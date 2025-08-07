/**
 * Gemini module for Answer As Me 3
 */
namespace Gemini {
  /**
   * Make API call with retry logic
   * Handles 429 (rate limit), 408 (timeout), and 5xx errors with Retry-After support
   */
  export function fetchWithRetry(url: string, options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions): GoogleAppsScript.URL_Fetch.HTTPResponse {
    const maxAttempts = Config.GEMINI.RETRY_ATTEMPTS + 1;
    const maxTotalWaitMs = 10000; // 10 second max total wait
    let totalWaitMs = 0;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = UrlFetchApp.fetch(url, options);
        const code = response.getResponseCode();
        
        // Check if we should retry: 429 (rate limit), 408 (timeout), or 5xx errors
        const shouldRetry = (code === 429 || code === 408 || (code >= 500 && code < 600)) 
                           && attempt < maxAttempts - 1;
        
        if (shouldRetry) {
          let backoffMs: number;
          
          // Check for Retry-After header (can be seconds or HTTP date)
          const headers = response.getHeaders() as {[key: string]: string};
          const retryAfterHeader = headers['Retry-After'] || headers['retry-after'];
          
          if (retryAfterHeader) {
            // Parse Retry-After header
            const retryAfterNum = parseInt(retryAfterHeader, 10);
            if (!isNaN(retryAfterNum)) {
              // It's a number of seconds
              backoffMs = retryAfterNum * 1000;
              AppLogger.info(`Using Retry-After header: ${retryAfterNum}s`, { code, attempt });
            } else {
              // Try to parse as HTTP date
              const retryDate = new Date(retryAfterHeader);
              if (!isNaN(retryDate.getTime())) {
                backoffMs = Math.max(0, retryDate.getTime() - Date.now());
                AppLogger.info(`Using Retry-After date: ${retryAfterHeader}`, { code, attempt });
              } else {
                // Fall back to exponential backoff if header is invalid
                backoffMs = Algorithms.calculateBackoffWithJitter(
                  attempt,
                  Config.GEMINI.RETRY_BACKOFF_MS,
                  maxTotalWaitMs - totalWaitMs
                );
              }
            }
          } else {
            // No Retry-After header, use exponential backoff with jitter
            backoffMs = Algorithms.calculateBackoffWithJitter(
              attempt,
              Config.GEMINI.RETRY_BACKOFF_MS,
              maxTotalWaitMs - totalWaitMs
            );
          }
          
          // Cap the wait time to avoid exceeding max total wait
          backoffMs = Math.min(backoffMs, maxTotalWaitMs - totalWaitMs);
          
          if (backoffMs > 0 && totalWaitMs + backoffMs <= maxTotalWaitMs) {
            AppLogger.info(`Retrying after ${backoffMs}ms`, { code, attempt, totalWaitMs });
            Utils.sleep(backoffMs);
            totalWaitMs += backoffMs;
            continue;
          } else {
            AppLogger.warn('Max retry wait time exceeded', { totalWaitMs, maxTotalWaitMs });
            break;
          }
        }
        
        return response;
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts - 1) {
          const backoffMs = Algorithms.calculateBackoffWithJitter(
            attempt,
            Config.GEMINI.RETRY_BACKOFF_MS,
            10000 // 10 second max
          );
          Utils.sleep(backoffMs);
        }
      }
    }
    
    throw lastError || new Error('Failed to fetch after retries');
  }
  
  /**
   * Call Gemini API with JSON response
   */
  export function callGenerateContent(apiKey: string, promptText: string): Types.GeminiCallResult {
    const startTime = Date.now();
    
    const payload = {
      contents: [{
        parts: [{
          text: promptText
        }]
      }],
      generationConfig: {
        response_mime_type: Config.GEMINI.RESPONSE_MIME_TYPE,
        response_schema: Config.RESPONSE_SCHEMA
      }
    };
    
    const url = `${Config.GEMINI.MODEL_URL}?key=${encodeURIComponent(apiKey)}`;
    
    const response = fetchWithRetry(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const responseText = response.getContentText();
    
    return {
      code: response.getResponseCode(),
      text: responseText,
      duration: Date.now() - startTime,
      respBytes: responseText.length,
      promptChars: promptText.length,
      requestPayload: payload
    };
  }
  
  /**
   * Extract JSON from Gemini response wrapper
   */
  export function extractJsonFromResponse(responseText: string): string {
    const parsed = Utils.jsonParse<Types.GeminiResponse>(responseText);
    
    if (!parsed || !parsed.candidates || !parsed.candidates[0]) {
      return '';
    }
    
    const parts = parsed.candidates[0].content?.parts;
    if (!parts || !parts[0] || typeof parts[0].text !== 'string') {
      return '';
    }
    
    return parts[0].text;
  }
  
  /**
   * Parse Gemini response - NO FALLBACKS, real responses only
   */
  export function parseResponse(responseText: string): Types.GeminiResponse | null {
    const jsonText = extractJsonFromResponse(responseText);
    if (!jsonText) {
      AppLogger.error('No JSON text extracted from response');
      return null;
    }
    
    // Clean up potential code fence blocks that Gemini might add
    const cleaned = jsonText.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    
    // Parse as JSON - fail if it doesn't parse
    const parsed = Utils.jsonParse<Types.GeminiResponse>(cleaned);
    
    if (!parsed) {
      AppLogger.error('Failed to parse Gemini response as JSON', { textLength: cleaned.length });
      return null;
    }
    
    return parsed;
  }
  
  /**
   * Get safety ratings from response
   */
  export function getSafetyRatings(responseText: string): Types.SafetyRating[] | null {
    const parsed = Utils.jsonParse<Types.GeminiResponse>(responseText);
    if (!parsed) {
      return null;
    }
    
    // Check for prompt feedback
    if (parsed.promptFeedback && parsed.promptFeedback.safetyRatings) {
      return parsed.promptFeedback.safetyRatings;
    }
    
    // Check for candidate safety ratings
    if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].safetyRatings) {
      return parsed.candidates[0].safetyRatings;
    }
    
    return null;
  }
  
  /**
   * Get error from response
   */
  export function getErrorFromResponse(responseText: string): string {
    const parsed = Utils.jsonParse<Types.GeminiResponse>(responseText);
    
    if (parsed && parsed.error) {
      if (parsed.error.message) {
        return parsed.error.message;
      }
      return Utils.jsonStringify(parsed.error);
    }
    
    return '';
  }
  
  /**
   * Generate email reply using Gemini
   */
  export function generateEmailReply(
    apiKey: string,
    promptText: string
  ): {
    success: boolean;
    response?: Types.GeminiResponse;
    error?: string;
    apiResult: Types.GeminiCallResult;
    safetyInfo?: Types.SafetyRating[];
  } {
    // Remove circuit breaker for now - GAS doesn't support async well
    // return CSUtils.geminiCircuitBreaker.execute(() => {
    const apiResult = callGenerateContent(apiKey, promptText);
    
    // Check HTTP status
    if (apiResult.code !== 200) {
      const error = getErrorFromResponse(apiResult.text);
      return {
        success: false,
        error: `HTTP ${apiResult.code}${error ? `: ${error}` : ''}`,
        apiResult,
        ...(getSafetyRatings(apiResult.text) && { safetyInfo: getSafetyRatings(apiResult.text)! })
      };
    }
    
    // Parse response
    const response = parseResponse(apiResult.text);
    if (!response) {
      return {
        success: false,
        error: 'Failed to parse Gemini response',
        apiResult,
        ...(getSafetyRatings(apiResult.text) && { safetyInfo: getSafetyRatings(apiResult.text)! })
      };
    }
    
    // Validate response
    const validationError = Validation.validateGeminiResponse(response);
    if (validationError) {
      return {
        success: false,
        error: `Response validation failed: ${validationError}`,
        apiResult,
        ...(getSafetyRatings(apiResult.text) && { safetyInfo: getSafetyRatings(apiResult.text)! })
      };
    }
    
    const result = {
      success: true,
      response,
      apiResult,
      ...(getSafetyRatings(apiResult.text) && { safetyInfo: getSafetyRatings(apiResult.text)! })
    };
    
    return result;
    // }); // End circuit breaker execute
  }
}
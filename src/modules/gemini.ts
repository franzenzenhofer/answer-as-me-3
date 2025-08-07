/**
 * Gemini module for Answer As Me 3
 */
namespace Gemini {
  /**
   * Make API call with retry logic
   */
  export function fetchWithRetry(url: string, options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions): GoogleAppsScript.URL_Fetch.HTTPResponse {
    const maxAttempts = Config.GEMINI.RETRY_ATTEMPTS + 1;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = UrlFetchApp.fetch(url, options);
        const code = response.getResponseCode();
        
        // Retry on 5xx errors
        if (code >= 500 && code < 600 && attempt < maxAttempts - 1) {
          Utils.sleep(Config.GEMINI.RETRY_BACKOFF_MS * (attempt + 1));
          continue;
        }
        
        return response;
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts - 1) {
          Utils.sleep(Config.GEMINI.RETRY_BACKOFF_MS * (attempt + 1));
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
    const parsed = Utils.jsonParse<any>(responseText);
    
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
   * Parse Gemini response
   */
  export function parseResponse(responseText: string): Types.GeminiResponse | null {
    const jsonText = extractJsonFromResponse(responseText);
    if (!jsonText) {
      return null;
    }
    
    return Utils.jsonParse<Types.GeminiResponse>(jsonText);
  }
  
  /**
   * Get safety ratings from response
   */
  export function getSafetyRatings(responseText: string): any {
    const parsed = Utils.jsonParse<any>(responseText);
    if (!parsed) {
      return null;
    }
    
    // Check for prompt feedback
    if (parsed.promptFeedback) {
      return parsed.promptFeedback;
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
    const parsed = Utils.jsonParse<any>(responseText);
    
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
    safetyInfo?: any;
  } {
    const apiResult = callGenerateContent(apiKey, promptText);
    
    // Check HTTP status
    if (apiResult.code !== 200) {
      const error = getErrorFromResponse(apiResult.text);
      return {
        success: false,
        error: `HTTP ${apiResult.code}${error ? `: ${error}` : ''}`,
        apiResult,
        safetyInfo: getSafetyRatings(apiResult.text)
      };
    }
    
    // Parse response
    const response = parseResponse(apiResult.text);
    if (!response) {
      return {
        success: false,
        error: 'Failed to parse Gemini response',
        apiResult,
        safetyInfo: getSafetyRatings(apiResult.text)
      };
    }
    
    // Validate response
    const validationError = Validation.validateGeminiResponse(response);
    if (validationError) {
      return {
        success: false,
        error: `Response validation failed: ${validationError}`,
        apiResult,
        safetyInfo: getSafetyRatings(apiResult.text)
      };
    }
    
    return {
      success: true,
      response,
      apiResult,
      safetyInfo: getSafetyRatings(apiResult.text)
    };
  }
}
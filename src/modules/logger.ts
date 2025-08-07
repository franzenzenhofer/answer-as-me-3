/**
 * Logger module for Answer As Me 3
 * Handles both console logging and Sheet logging
 */
namespace AppLogger {
  export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
  }
  
  export const currentLevel = LogLevel.INFO;
  
  /**
   * Log debug message
   */
  export function debug(_message: string, _data?: unknown): void {
    // Debug logging disabled in production
  }
  
  /**
   * Log info message
   */
  export function info(_message: string, _data?: unknown): void {
    // Info logging disabled in production
  }
  
  /**
   * Log warning message
   */
  export function warn(_message: string, _data?: unknown): void {
    // Warning logging disabled in production
  }
  
  /**
   * Log error message
   */
  export function error(_message: string, _error?: unknown): void {
    // Error logging disabled in production
  }
  
  /**
   * Log action to sheet
   */
  export function logAction(
    action: string,
    data: Partial<Types.LogEntry>
  ): void {
    const entry = SheetsUtils.formatLogEntry(action, data);
    SheetsUtils.writeLogEntry(entry);
  }
  
  /**
   * Log API key test
   */
  export function logApiKeyTest(
    success: boolean,
    result: Types.GeminiCallResult,
    safetyInfo?: Types.SafetyRating[]
  ): void {
    const requestUrl = DriveUtils.createJsonFile('testkey-request', result.requestPayload);
    const responseData = Utils.jsonParse(result.text) || { raw: result.text };
    const responseUrl = DriveUtils.createJsonFile('testkey-response', responseData);
    
    logAction('TestKey', {
      Success: success,
      Error: success ? '' : `HTTP ${result.code}`,
      DurationMs: result.duration,
      PromptChars: result.promptChars,
      Truncated: 'false',
      RespBytes: result.respBytes,
      Notes: safetyInfo ? Utils.jsonStringify(safetyInfo) : '',
      RequestBody: Utils.jsonStringify(result.requestPayload),
      ResponseBody: Utils.capString(result.text, 95000),
      ReqFileUrl: requestUrl,
      RespFileUrl: responseUrl
    });
  }
  
  /**
   * Log email generation
   */
  export function logEmailGeneration(
    params: {
      mode: Types.EmailMode;
      tone: Types.EmailTone;
      intent: string;
      subject: string;
      recipients: Types.Recipients;
      success: boolean;
      error?: string;
      apiResult: Types.GeminiCallResult;
      safetyInfo?: Types.SafetyRating[];
      truncated: boolean;
      threadId: string;
      messageId: string;
    }
  ): void {
    const requestUrl = DriveUtils.createJsonFile('generate-request', params.apiResult.requestPayload);
    const responseData = Utils.jsonParse(params.apiResult.text) || { raw: params.apiResult.text };
    const responseUrl = DriveUtils.createJsonFile('generate-response', responseData);
    
    logAction('Generate', {
      Mode: params.mode,
      Tone: params.tone,
      Intent: params.intent,
      Subject: params.subject,
      To: params.recipients.to,
      Cc: params.recipients.cc,
      Success: params.success,
      Error: params.error || '',
      DurationMs: params.apiResult.duration,
      PromptChars: params.apiResult.promptChars,
      Truncated: Utils.boolToString(params.truncated),
      RespBytes: params.apiResult.respBytes,
      ThreadId: params.threadId,
      MessageId: params.messageId,
      Notes: params.safetyInfo ? Utils.jsonStringify(params.safetyInfo) : '',
      RequestBody: Utils.jsonStringify(params.apiResult.requestPayload),
      ResponseBody: Utils.capString(params.apiResult.text, 95000),
      ReqFileUrl: requestUrl,
      RespFileUrl: responseUrl
    });
  }
}
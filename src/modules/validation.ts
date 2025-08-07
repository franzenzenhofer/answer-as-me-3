/**
 * Validation module for Answer As Me 3
 */
namespace Validation {
  /**
   * Validate API key exists
   */
  export function ensureApiKey(): string {
    const apiKey = Utils.getProperty(Config.PROPS.API_KEY);
    if (!apiKey) {
      Utils.throwError('API key missing. Open Settings.');
    }
    return apiKey;
  }
  
  /**
   * Validate prompt document exists and is accessible
   */
  export function ensurePromptDoc(): string {
    const docId = Utils.getProperty(Config.PROPS.PROMPT_DOC_ID);
    if (!docId) {
      Utils.throwError('Prompt Doc missing. Open Settings.');
    }
    
    try {
      DocumentApp.openById(docId);
    } catch (e) {
      Utils.throwError('Cannot open Prompt Doc (moved/trashed?). Fix in Settings.');
    }
    
    return docId;
  }
  
  /**
   * Validate logs folder exists and is accessible
   */
  export function ensureLogsFolder(): string {
    const folderId = Utils.getProperty(Config.PROPS.LOGS_FOLDER_ID);
    if (!folderId) {
      Utils.throwError('Logs Folder missing. Open Settings.');
    }
    
    try {
      DriveApp.getFolderById(folderId);
    } catch (e) {
      Utils.throwError('Cannot open Logs Folder (moved/trashed?). Fix in Settings.');
    }
    
    return folderId;
  }
  
  /**
   * Validate all requirements are met
   */
  export function ensureAllRequirements(): void {
    ensureApiKey();
    ensurePromptDoc();
    ensureLogsFolder();
  }
  
  /**
   * Validate email mode
   */
  export function validateEmailMode(mode: string): Types.EmailMode {
    if (!Utils.isInArray(Config.EMAIL.MODES, mode as Types.EmailMode)) {
      return Config.DEFAULTS.MODE;
    }
    return mode as Types.EmailMode;
  }
  
  /**
   * Validate email tone
   */
  export function validateEmailTone(tone: string): Types.EmailTone {
    if (!Utils.isInArray(Config.EMAIL.TONES, tone as Types.EmailTone)) {
      return Config.DEFAULTS.TONE;
    }
    return tone as Types.EmailTone;
  }
  
  /**
   * Validate Gemini response object
   */
  export function validateGeminiResponse(obj: unknown): string | null {
    if (!obj || typeof obj !== 'object') {
      return 'Response root is not an object';
    }
    
    const response = obj as Record<string, unknown>;
    const required = Config.RESPONSE_SCHEMA.required;
    for (const field of required) {
      if (!(field in response)) {
        return `Missing required field: ${field}`;
      }
    }
    
    if (typeof response['body'] !== 'string' || !(response['body'] as string).trim()) {
      return 'Body field is invalid or empty';
    }
    
    if (typeof response['mode'] !== 'string' || !Utils.isInArray(Config.EMAIL.MODES, response['mode'] as string)) {
      return 'Mode field is invalid';
    }
    
    if (typeof response['safeToSend'] !== 'boolean') {
      return 'SafeToSend field is not a boolean';
    }
    
    return null;
  }
  
  /**
   * Validate Gmail event
   */
  export function validateGmailEvent(event: unknown): Types.GmailAddOnEvent {
    const e = event as Types.GmailAddOnEvent;
    if (!e || !e.gmail || !e.gmail.messageId || !e.gmail.accessToken) {
      Utils.throwError('Open an email thread via the add-on.');
    }
    return e;
  }
  
  /**
   * Validate form inputs
   */
  export function getFormValue(formInputs: Types.FormInputs | undefined, key: keyof Types.FormInputs): string | undefined {
    if (!formInputs || !formInputs[key] || !formInputs[key]![0]) {
      return undefined;
    }
    return formInputs[key]![0];
  }
  
  /**
   * Validate and get email mode from form or default
   */
  export function getEmailMode(formInputs: Types.FormInputs | undefined): Types.EmailMode {
    const formMode = getFormValue(formInputs, 'mode');
    const defaultMode = Utils.getProperty(Config.PROPS.DEFAULT_MODE, Config.DEFAULTS.MODE);
    return validateEmailMode(formMode || defaultMode);
  }
  
  /**
   * Validate and get email tone from form or default
   */
  export function getEmailTone(formInputs: Types.FormInputs | undefined, override?: string): Types.EmailTone {
    if (override) {
      return validateEmailTone(override);
    }
    const formTone = getFormValue(formInputs, 'tone');
    const defaultTone = Utils.getProperty(Config.PROPS.DEFAULT_TONE, Config.DEFAULTS.TONE);
    return validateEmailTone(formTone || defaultTone);
  }
}
/**
 * Configuration module for Answer As Me 3
 */

// Declare globals that will be injected at build time
declare let DEPLOYMENT_VERSION: string | undefined;
declare let DEPLOYMENT_TIMESTAMP: string | undefined;

namespace Config {
  export const APP_NAME = 'Answer As Me 3';
  export let VERSION = '__VERSION__'; // Will be replaced during build
  export let DEPLOY_TIME = '__DEPLOY_TIME__'; // Will be replaced during build
  export const ICON_URL = 'https://www.gstatic.com/images/icons/material/system/2x/auto_awesome_black_24dp.png';
  
  // Runtime hydration for version info
  try {
    if (typeof DEPLOYMENT_VERSION !== 'undefined') {
      VERSION = DEPLOYMENT_VERSION;
    }
    if (typeof DEPLOYMENT_TIMESTAMP !== 'undefined') {
      DEPLOY_TIME = DEPLOYMENT_TIMESTAMP;
    }
  } catch (_) {
    // Fallback to build-time placeholders
  }
  
  // API Configuration
  export const GEMINI = {
    MODEL_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    RESPONSE_MIME_TYPE: 'application/json',
    RETRY_ATTEMPTS: 1,
    RETRY_BACKOFF_MS: 400
  };
  
  // Email Configuration
  export const EMAIL = {
    THREAD_MAX_CHARS: 120000,
    PREVIEW_CHARS: 1200,
    MODES: ['Reply', 'ReplyAll', 'Forward'] as const,
    TONES: ['Professional', 'Friendly', 'Casual', 'Formal', 'Humorous'] as const,
    INTENTS: ['Decline', 'AskFollowUps', 'Confirm', 'Schedule', 'Thanks'] as const
  };
  
  // Property Keys
  export const PROPS = {
    API_KEY: 'AAM3_API_KEY',
    DEFAULT_MODE: 'AAM3_DEFAULT_MODE',
    DEFAULT_TONE: 'AAM3_DEFAULT_TONE',
    PROMPT_DOC_ID: 'AAM3_PROMPT_DOC_ID',
    LOGS_FOLDER_ID: 'AAM3_LOGS_FOLDER_ID',
    TODAY_SHEET_ID: 'AAM3_TODAY_SHEET_ID',
    TODAY_DATE: 'AAM3_TODAY_DATE',
    LOGGING_ENABLED: 'AAM3_LOGGING_ENABLED'
  } as const;
  
  // Defaults
  export const DEFAULTS = {
    MODE: 'Reply' as const,
    TONE: 'Professional' as const
  };
  
  // Logging Configuration
  export const LOGS = {
    FOLDER_NAME: 'Answer As Me 3 – Logs',
    SHEET_PREFIX: 'Answer As Me 3 – ',
    HEADERS: [
      'Timestamp', 'Action', 'Mode', 'Tone', 'Intent', 'Subject', 'To', 'Cc',
      'Success', 'Error', 'DurationMs', 'PromptChars', 'Truncated', 'RespBytes',
      'ThreadId', 'MessageId', 'Notes', 'RequestBody', 'ResponseBody', 'ReqFileUrl', 'RespFileUrl'
    ] as const
  };
  
  // Response Schema for Gemini
  export const RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
      body: { type: 'string' },
      subject: { type: 'string' },
      mode: { type: 'string', enum: EMAIL.MODES },
      safeToSend: { type: 'boolean' }
    },
    required: ['body', 'mode', 'safeToSend']
  } as const;
  
  export const COLORS = {
    PRIMARY: '#4285F4',
    SUCCESS: '#34A853',
    WARNING: '#FBBC05',
    ERROR: '#EA4335'
  };
}
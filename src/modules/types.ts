/**
 * Type definitions for Answer As Me 3
 */
namespace Types {
  // Email Types
  export type EmailMode = typeof Config.EMAIL.MODES[number];
  export type EmailTone = typeof Config.EMAIL.TONES[number];
  export type EmailIntent = typeof Config.EMAIL.INTENTS[number];
  
  // Recipients
  export interface Recipients {
    to: string[];
    cc: string[];
  }
  
  // Gemini Response
  export interface GeminiResponse {
    body: string;
    subject: string;
    mode: EmailMode;
    safeToSend: boolean;
  }
  
  // Gemini API Call Result
  export interface GeminiCallResult {
    code: number;
    text: string;
    duration: number;
    respBytes: number;
    promptChars: number;
    requestPayload: any;
  }
  
  // Preview Data
  export interface PreviewData {
    mode: EmailMode;
    tone: EmailTone;
    intent: string;
    subject: string;
    to: string[];
    cc: string[];
    body: string;
    safeToSend: boolean;
    truncated: boolean;
  }
  
  // Log Entry
  export interface LogEntry {
    Action?: string;
    Mode?: string;
    Tone?: string;
    Intent?: string;
    Subject?: string;
    To?: string[];
    Cc?: string[];
    Success?: boolean;
    Error?: string;
    DurationMs?: number;
    PromptChars?: number;
    Truncated?: string;
    RespBytes?: number;
    ThreadId?: string;
    MessageId?: string;
    Notes?: string;
    RequestBody?: string;
    ResponseBody?: string;
    ReqFileUrl?: string;
    RespFileUrl?: string;
  }
  
  // Form Inputs
  export interface FormInputs {
    apiKey?: string[];
    defaultMode?: string[];
    defaultTone?: string[];
    mode?: string[];
    tone?: string[];
  }
  
  // Event Parameters
  export interface EventParameters {
    intent?: string;
    body?: string;
    subject?: string;
    mode?: string;
    to?: string;
    cc?: string;
  }
  
  // Gmail Event
  export interface GmailAddOnEvent {
    gmail?: {
      messageId?: string;
      threadId?: string;
      accessToken?: string;
    };
    formInputs?: FormInputs;
    parameters?: EventParameters;
  }

  export interface SafetyRating {
    category: string;
    probability: string;
  }

  // Settings
  export interface Settings {
    apiKey: string;
    defaultMode: EmailMode;
    defaultTone: EmailTone;
    hasPromptDoc: boolean;
    hasLogsFolder: boolean;
  }

}
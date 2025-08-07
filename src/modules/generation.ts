/**
 * Generation helpers module
 */
namespace Generation {
  /**
   * Extract generation context from Gmail event
   */
  export function extractContext(validEvent: Types.GmailAddOnEvent): {
    message: GoogleAppsScript.Gmail.GmailMessage;
    thread: GoogleAppsScript.Gmail.GmailThread;
    metadata: GmailUtils.MessageMetadata;
    threadMetadata: GmailUtils.ThreadMetadata;
    mode: Types.EmailMode;
    tone: Types.EmailTone;
    recipients: Types.Recipients;
    threadText: string;
    truncated: boolean;
  } {
    // Get message and thread
    const message = GmailUtils.getMessageById(validEvent.gmail!.messageId!, validEvent.gmail!.accessToken!);
    const thread = GmailUtils.getThreadFromMessage(message);
    const metadata = GmailUtils.getMessageMetadata(message);
    const threadMetadata = GmailUtils.getThreadMetadata(thread);
    
    // Get mode and tone
    const mode = Validation.getEmailMode(validEvent.formInputs);
    const tone = Validation.getEmailTone(validEvent.formInputs);
    
    // Compute recipients
    const recipients = Email.computeRecipients(thread, mode);
    
    // Get thread text
    const fullText = Email.getThreadPlainText(thread);
    const { text: threadText, truncated } = Email.truncateThreadText(fullText, Config.EMAIL.THREAD_MAX_CHARS);
    
    return { message, thread, metadata, threadMetadata, mode, tone, recipients, threadText, truncated };
  }
  
  /**
   * Build preview data from generation response
   */
  export function buildPreviewData(
    response: Types.GeminiResponse,
    context: {
      mode: Types.EmailMode;
      tone: Types.EmailTone;
      intent: string;
      threadMetadata: GmailUtils.ThreadMetadata;
      recipients: Types.Recipients;
      truncated: boolean;
    }
  ): Types.PreviewData {
    const baseSubject = context.threadMetadata.lastSubject || context.threadMetadata.firstSubject || '';
    return {
      mode: context.mode,
      tone: context.tone,
      intent: context.intent,
      subject: Email.formatSubjectForMode(baseSubject, context.mode),
      to: context.recipients.to,
      cc: context.recipients.cc,
      body: response.body,
      safeToSend: response.safeToSend,
      truncated: context.truncated
    };
  }
  
  /**
   * Build prompt text from template and variables
   * Returns both the prompt text and whether it was truncated
   */
  export function buildPromptText(
    context: {
      mode: Types.EmailMode;
      tone: Types.EmailTone;
      intent: string;
      threadMetadata: GmailUtils.ThreadMetadata;
      metadata: GmailUtils.MessageMetadata;
      recipients: Types.Recipients;
      threadText: string;
    }
  ): { promptText: string; truncated: boolean } {
    const promptTemplate = Document.readPromptTextCached();
    const baseSubject = context.threadMetadata.lastSubject || context.threadMetadata.firstSubject || '';
    const promptVars = Template.buildPromptVariables(
      context.mode,
      context.tone,
      context.intent,
      baseSubject,
      context.metadata.from,
      context.recipients.to,
      context.recipients.cc,
      context.threadText
    );
    const fullPrompt = Template.replaceVariables(promptTemplate, promptVars);
    
    // Truncate prompt if it exceeds max length
    if (fullPrompt.length <= Config.EMAIL.PROMPT_MAX_CHARS) {
      return { promptText: fullPrompt, truncated: false };
    }
    
    // Truncate the prompt to max chars
    AppLogger.warn('Prompt truncated', { 
      originalLength: fullPrompt.length, 
      maxLength: Config.EMAIL.PROMPT_MAX_CHARS 
    });
    
    return { 
      promptText: fullPrompt.substring(0, Config.EMAIL.PROMPT_MAX_CHARS), 
      truncated: true 
    };
  }
}
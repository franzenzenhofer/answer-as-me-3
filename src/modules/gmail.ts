/**
 * Gmail module for Answer As Me 3
 */
namespace Gmail {
  /**
   * Set Gmail access token for current session
   */
  export function setAccessToken(accessToken: string): void {
    GmailApp.setCurrentMessageAccessToken(accessToken);
  }
  
  /**
   * Get message by ID with access token
   */
  export function getMessageById(messageId: string, accessToken: string): GoogleAppsScript.Gmail.GmailMessage {
    setAccessToken(accessToken);
    return GmailApp.getMessageById(messageId);
  }
  
  /**
   * Get thread from message
   */
  export function getThreadFromMessage(message: GoogleAppsScript.Gmail.GmailMessage): GoogleAppsScript.Gmail.GmailThread {
    return message.getThread();
  }
  
  /**
   * Get thread subject
   */
  export function getThreadSubject(thread: GoogleAppsScript.Gmail.GmailThread): string {
    return thread.getFirstMessageSubject() || '';
  }
  
  /**
   * Create draft reply builder
   */
  export function createDraftReplyBuilder(): GoogleAppsScript.Card_Service.GmailDraftActionResponseBuilder {
    return CardService.newGmailDraftActionResponseBuilder();
  }
  
  /**
   * Build draft response with body
   */
  export function buildDraftResponse(body: string): GoogleAppsScript.Card_Service.GmailDraftActionResponse {
    return createDraftReplyBuilder()
      .setDraftBody(body)
      .build();
  }
  
  /**
   * Build draft response with recipients
   */
  export function buildDraftResponseWithRecipients(
    body: string,
    to: string[],
    cc: string[]
  ): GoogleAppsScript.Card_Service.GmailDraftActionResponse {
    return createDraftReplyBuilder()
      .setToRecipients(to.join(','))
      .setCcRecipients(cc.join(','))
      .setDraftBody(body)
      .build();
  }
  
  /**
   * Build draft response with subject
   */
  export function buildDraftResponseWithSubject(
    body: string,
    subject: string
  ): GoogleAppsScript.Card_Service.GmailDraftActionResponse {
    return createDraftReplyBuilder()
      .setSubject(subject)
      .setDraftBody(body)
      .build();
  }
  
  /**
   * Build full draft response
   */
  export function buildFullDraftResponse(
    body: string,
    subject: string,
    to: string[],
    cc: string[]
  ): GoogleAppsScript.Card_Service.GmailDraftActionResponse {
    return createDraftReplyBuilder()
      .setToRecipients(to.join(','))
      .setCcRecipients(cc.join(','))
      .setSubject(subject)
      .setDraftBody(body)
      .build();
  }
  
  /**
   * Get message metadata
   */
  export function getMessageMetadata(message: GoogleAppsScript.Gmail.GmailMessage): {
    from: string;
    to: string;
    cc: string;
    subject: string;
    date: Date | null;
    id: string;
  } {
    return {
      from: message.getFrom() || '',
      to: message.getTo() || '',
      cc: message.getCc() || '',
      subject: message.getSubject() || '',
      date: message.getDate(),
      id: message.getId()
    };
  }
  
  /**
   * Get thread metadata
   */
  export function getThreadMetadata(thread: GoogleAppsScript.Gmail.GmailThread): {
    id: string;
    messageCount: number;
    firstSubject: string;
    lastSubject: string;
  } {
    const messages = thread.getMessages();
    return {
      id: thread.getId(),
      messageCount: messages.length,
      firstSubject: thread.getFirstMessageSubject() || '',
      lastSubject: messages.length > 0 ? messages[messages.length - 1].getSubject() || '' : ''
    };
  }
}
/**
 * Gmail module for Answer As Me 3
 */
namespace GmailUtils {
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
   * Build update draft action response
   */
  export function buildDraftResponse(body: string): GoogleAppsScript.Card_Service.UpdateDraftActionResponse {
    return CardService.newUpdateDraftActionResponseBuilder()
      .setUpdateDraftBodyAction(CardService.newUpdateDraftBodyAction()
        .addUpdateContent(body, CardService.ContentType.MUTABLE_HTML)
        .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT))
      .build();
  }
  
  /**
   * Build update draft with recipients
   */
  export function buildDraftResponseWithRecipients(
    body: string,
    to: string[],
    cc: string[]
  ): GoogleAppsScript.Card_Service.UpdateDraftActionResponse {
    return CardService.newUpdateDraftActionResponseBuilder()
      .setUpdateDraftToRecipientsAction(CardService.newUpdateDraftToRecipientsAction()
        .addUpdateToRecipients(to))
      .setUpdateDraftCcRecipientsAction(CardService.newUpdateDraftCcRecipientsAction()
        .addUpdateCcRecipients(cc))
      .setUpdateDraftBodyAction(CardService.newUpdateDraftBodyAction()
        .addUpdateContent(body, CardService.ContentType.MUTABLE_HTML)
        .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT))
      .build();
  }
  
  /**
   * Build update draft with subject
   */
  export function buildDraftResponseWithSubject(
    body: string,
    subject: string
  ): GoogleAppsScript.Card_Service.UpdateDraftActionResponse {
    return CardService.newUpdateDraftActionResponseBuilder()
      .setUpdateDraftSubjectAction(CardService.newUpdateDraftSubjectAction()
        .addUpdateSubject(subject))
      .setUpdateDraftBodyAction(CardService.newUpdateDraftBodyAction()
        .addUpdateContent(body, CardService.ContentType.MUTABLE_HTML)
        .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT))
      .build();
  }
  
  /**
   * Build full update draft response
   */
  export function buildFullDraftResponse(
    body: string,
    subject: string,
    to: string[],
    cc: string[]
  ): GoogleAppsScript.Card_Service.UpdateDraftActionResponse {
    return CardService.newUpdateDraftActionResponseBuilder()
      .setUpdateDraftToRecipientsAction(CardService.newUpdateDraftToRecipientsAction()
        .addUpdateToRecipients(to))
      .setUpdateDraftCcRecipientsAction(CardService.newUpdateDraftCcRecipientsAction()
        .addUpdateCcRecipients(cc))
      .setUpdateDraftSubjectAction(CardService.newUpdateDraftSubjectAction()
        .addUpdateSubject(subject))
      .setUpdateDraftBodyAction(CardService.newUpdateDraftBodyAction()
        .addUpdateContent(body, CardService.ContentType.MUTABLE_HTML)
        .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT))
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
    date: string;
    id: string;
  } {
    const messageDate = message.getDate();
    return {
      from: message.getFrom() || '',
      to: message.getTo() || '',
      cc: message.getCc() || '',
      subject: message.getSubject() || '',
      date: messageDate ? messageDate.toString() : '',
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
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    return {
      id: thread.getId(),
      messageCount: messages.length,
      firstSubject: thread.getFirstMessageSubject() || '',
      lastSubject: lastMessage ? lastMessage.getSubject() || '' : ''
    };
  }
}
/**
 * Gmail module for Answer As Me 3
 */
namespace GmailUtils {
  // Export types
  export type MessageMetadata = ReturnType<typeof getMessageMetadata>;
  export type ThreadMetadata = ReturnType<typeof getThreadMetadata>;
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
   * Build update draft action response
   */
  export function buildDraftResponse(body: string): GoogleAppsScript.Card_Service.UpdateDraftActionResponse {
    const bodyAction = CardService.newUpdateDraftBodyAction()
      .addUpdateContent(Utils.toHtml(body), CardService.ContentType.MUTABLE_HTML)
      // Use IN_PLACE_INSERT for now - REPLACE may not be in type definitions yet
      .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT);
    
    return CardService.newUpdateDraftActionResponseBuilder()
      .setUpdateDraftBodyAction(bodyAction)
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
    // Normalize and validate recipients before using them
    const normalizedTo = Email.normalizeRecipients(to, true);
    const normalizedCc = Email.normalizeRecipients(cc, true);
    
    const builder = CardService.newUpdateDraftActionResponseBuilder()
      .setUpdateDraftToRecipientsAction(CardService.newUpdateDraftToRecipientsAction()
        .addUpdateToRecipients(normalizedTo))
      .setUpdateDraftBodyAction(CardService.newUpdateDraftBodyAction()
        .addUpdateContent(Utils.toHtml(body), CardService.ContentType.MUTABLE_HTML)
        .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT));
    
    // Only add CC recipients if there are any
    if (normalizedCc && normalizedCc.length > 0) {
      builder.setUpdateDraftCcRecipientsAction(CardService.newUpdateDraftCcRecipientsAction()
        .addUpdateCcRecipients(normalizedCc));
    }
    
    return builder.build();
  }
  
  /**
   * Build update draft with subject
   */
  export function buildDraftResponseWithSubject(
    body: string,
    subject: string
  ): GoogleAppsScript.Card_Service.UpdateDraftActionResponse {
    const builder = CardService.newUpdateDraftActionResponseBuilder()
      .setUpdateDraftSubjectAction(CardService.newUpdateDraftSubjectAction()
        .addUpdateSubject(subject))
      .setUpdateDraftBodyAction(CardService.newUpdateDraftBodyAction()
        .addUpdateContent(Utils.toHtml(body), CardService.ContentType.MUTABLE_HTML)
        .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT));
    
    return builder.build();
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
    // Normalize and validate recipients before using them
    const normalizedTo = Email.normalizeRecipients(to, true);
    const normalizedCc = Email.normalizeRecipients(cc, true);
    
    const builder = CardService.newUpdateDraftActionResponseBuilder()
      .setUpdateDraftToRecipientsAction(CardService.newUpdateDraftToRecipientsAction()
        .addUpdateToRecipients(normalizedTo))
      .setUpdateDraftSubjectAction(CardService.newUpdateDraftSubjectAction()
        .addUpdateSubject(subject))
      .setUpdateDraftBodyAction(CardService.newUpdateDraftBodyAction()
        .addUpdateContent(Utils.toHtml(body), CardService.ContentType.MUTABLE_HTML)
        .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT));
    
    // Only add CC recipients if there are any
    if (normalizedCc && normalizedCc.length > 0) {
      builder.setUpdateDraftCcRecipientsAction(CardService.newUpdateDraftCcRecipientsAction()
        .addUpdateCcRecipients(normalizedCc));
    }
    
    return builder.build();
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
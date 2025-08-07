/**
 * Email module for Answer As Me 3
 */
namespace Email {
  /**
   * Extract email addresses from a string
   */
  export function extractEmailAddresses(listStr: string | null | undefined): string[] {
    if (!listStr) return [];
    
    const emails: string[] = [];
    const parts = listStr.split(/[;,]/);
    
    parts.forEach(part => {
      const matches = part.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig);
      if (matches) {
        emails.push(...matches);
      }
    });
    
    return emails;
  }
  
  /**
   * Get current user's email addresses (primary + aliases)
   */
  export function getUserEmailAddresses(): Set<string> {
    const emailSet = new Set<string>();
    const primaryEmail = Utils.getCurrentUserEmail();
    
    if (primaryEmail) {
      emailSet.add(primaryEmail.toLowerCase());
    }
    
    try {
      const aliases = GmailApp.getAliases();
      aliases.forEach(alias => {
        if (alias) {
          emailSet.add(alias.toLowerCase());
        }
      });
    } catch (e) {
      // No alias access
    }
    
    return emailSet;
  }
  
  /**
   * Filter out user's own email addresses
   */
  export function filterOutUserEmails(emails: string[]): string[] {
    const userEmails = getUserEmailAddresses();
    return emails.filter(email => !userEmails.has(email.toLowerCase()));
  }
  
  /**
   * Get unique emails preserving case
   */
  export function getUniqueEmails(emails: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    
    emails.forEach(email => {
      const lower = email.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(email);
      }
    });
    
    return result;
  }
  
  /**
   * Compute recipients based on mode
   */
  export function computeRecipients(thread: GoogleAppsScript.Gmail.GmailThread, mode: Types.EmailMode): Types.Recipients {
    const messages = thread.getMessages();
    if (messages.length === 0) {
      return { to: [], cc: [] };
    }
    
    const lastMessage = messages[messages.length - 1];
    const to = extractEmailAddresses(lastMessage.getTo());
    const cc = extractEmailAddresses(lastMessage.getCc());
    const from = extractEmailAddresses(lastMessage.getFrom());
    
    let resultTo: string[] = [];
    let resultCc: string[] = [];
    
    if (mode === 'Reply') {
      resultTo = filterOutUserEmails(from);
    } else if (mode === 'ReplyAll') {
      resultTo = getUniqueEmails(filterOutUserEmails([...from, ...to]));
      resultCc = getUniqueEmails(filterOutUserEmails(cc));
    }
    // Forward mode has empty recipients
    
    return { to: resultTo, cc: resultCc };
  }
  
  /**
   * Format subject line based on mode
   */
  export function formatSubjectForMode(originalSubject: string | null | undefined, mode: Types.EmailMode): string {
    const subject = originalSubject || '';
    
    if (mode === 'Forward') {
      return subject.startsWith('Fwd:') ? subject : `Fwd: ${subject}`;
    }
    
    // Reply or ReplyAll
    return subject.startsWith('Re:') ? subject : `Re: ${subject}`;
  }
  
  /**
   * Get full thread as plain text
   */
  export function getThreadPlainText(thread: GoogleAppsScript.Gmail.GmailThread): string {
    const messages = thread.getMessages();
    const parts: string[] = [];
    
    messages.forEach((message, index) => {
      const header = [
        `From: ${message.getFrom() || ''}`,
        `Date: ${message.getDate() || ''}`,
        `To: ${message.getTo() || ''}`
      ];
      
      const cc = message.getCc();
      if (cc) {
        header.push(`Cc: ${cc}`);
      }
      
      parts.push(header.join('\n'));
      parts.push('');
      parts.push(message.getPlainBody() || '');
      
      if (index < messages.length - 1) {
        parts.push('', '---', '');
      }
    });
    
    return parts.join('\n');
  }
  
  /**
   * Truncate thread text if too long
   */
  export function truncateThreadText(text: string, maxChars: number): { text: string; truncated: boolean } {
    if (text.length <= maxChars) {
      return { text, truncated: false };
    }
    
    return {
      text: text.substring(0, maxChars),
      truncated: true
    };
  }
}
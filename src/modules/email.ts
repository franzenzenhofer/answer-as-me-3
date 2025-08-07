/**
 * Email module for Answer As Me 3
 * Enhanced with formal contracts for reliability
 */
namespace Email {
const EMPTY_RECIPIENTS: Types.Recipients = { to: [], cc: [] };

  /**
   * Extract email addresses from a string
   * @complexity O(n) where n is string length
   * @contract ensures unique valid email addresses
   */
  export function extractEmailAddresses(listStr: string | null | undefined): string[] {
    if (!listStr) {
      return [];
    }
    
    const emails: string[] = [];
    const parts = listStr.split(/[;,]/);
    
    parts.forEach(part => {
      const matches = part.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig);
      if (matches) {
        emails.push(...matches);
      }
    });
    
    // Postcondition: all extracted strings are valid emails
    if (Contracts.ENABLE_CONTRACTS) {
      emails.forEach(email => {
        Contracts.EmailContracts.requireValidEmail(email);
      });
    }
    
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
   * @complexity O(n) where n is number of emails
   * @contract ensures no duplicates in result
   */
  export function getUniqueEmails(emails: string[]): string[] {
    // Precondition: input is array of strings
    if (Contracts.ENABLE_CONTRACTS) {
      Contracts.requires(Array.isArray(emails), 'Input must be an array');
    }
    
    const seen = new Set<string>();
    const result: string[] = [];
    
    emails.forEach(email => {
      const lower = email.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(email);
      }
    });
    
    // Postcondition: result contains no duplicates
    if (Contracts.ENABLE_CONTRACTS) {
      Contracts.EmailContracts.ensureUniqueEmails(result);
    }
    
    return result;
  }
  
  /**
   * Compute recipients based on mode
   * @complexity O(n*m) where n is messages, m is recipients
   * @contract ensures valid recipient lists with no user emails
   */
  export function computeRecipients(thread: GoogleAppsScript.Gmail.GmailThread, mode: Types.EmailMode): Types.Recipients {
    // Preconditions
    if (Contracts.ENABLE_CONTRACTS) {
      Contracts.requires(thread !== null, 'Thread must not be null');
      Contracts.requires(
        ['Reply', 'ReplyAll', 'Forward'].includes(mode),
        'Mode must be valid EmailMode'
      );
    }
    
    const messages = thread.getMessages();
    if (messages.length === 0) {
      return EMPTY_RECIPIENTS;
    }
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      return EMPTY_RECIPIENTS;
    }
    
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
    
    // Postcondition: valid recipients for non-forward modes
    if (Contracts.ENABLE_CONTRACTS && mode !== 'Forward') {
      Contracts.EmailContracts.ensureRecipientsValid(resultTo, resultCc);
    }
    
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
   * @complexity O(1) or O(maxChars) for substring
   * @contract ensures text length <= maxChars
   */
  export function truncateThreadText(text: string, maxChars: number): { text: string; truncated: boolean } {
    // Preconditions
    if (Contracts.ENABLE_CONTRACTS) {
      Contracts.requires(text !== null && text !== undefined, 'Text must not be null');
      Contracts.requires(maxChars > 0, 'Max chars must be positive');
    }
    
    if (text.length <= maxChars) {
      return { text, truncated: false };
    }
    
    const result = {
      text: text.substring(0, maxChars),
      truncated: true
    };
    
    // Postcondition: text is within limit
    if (Contracts.ENABLE_CONTRACTS) {
      Contracts.ensures(
        result.text.length <= maxChars,
        'Truncated text must not exceed max chars'
      );
    }
    
    return result;
  }
}
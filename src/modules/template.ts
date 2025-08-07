/**
 * Template module for Answer As Me 3
 */
namespace Template {
  /**
   * Replace template variables in text
   */
  export function replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(variables[key]));
    });
    
    return result;
  }
  
  /**
   * Build prompt variables for email generation
   */
  export function buildPromptVariables(
    mode: Types.EmailMode,
    tone: Types.EmailTone,
    intent: string,
    subject: string,
    from: string,
    to: string[],
    cc: string[],
    threadText: string
  ): Record<string, string> {
    return {
      mode: mode,
      tone: tone,
      intent: intent || '',
      subject: subject || '',
      from: from || '',
      toList: to.join(', '),
      ccList: cc.join(', '),
      fullThreadText: threadText
    };
  }
  
  /**
   * Create default prompt template
   */
  export function getDefaultPromptTemplate(): string {
    return [
      'Answer As Me 3 – Prompt',
      '',
      'Identity: Write as the user in first person. Never reveal AI.',
      'Tone: Obey {{tone}} (Casual/Neutral/Formal).',
      'Intent: If provided, apply one of: Decline, AskFollowUps, Confirm, Schedule, Thanks.',
      'Mode: {{mode}} (Reply|ReplyAll|Forward). If Forward, write a concise intro line.',
      'Output: Return JSON only per schema (no prose):',
      '{"body": string, "subject": string, "mode": "Reply"|"ReplyAll"|"Forward", "safeToSend": boolean}',
      '',
      'Subject: {{subject}}',
      'From: {{from}}',
      'To: {{toList}}',
      'Cc: {{ccList}}',
      '',
      'FullThread:',
      '{{fullThreadText}}'
    ].join('\n');
  }
}
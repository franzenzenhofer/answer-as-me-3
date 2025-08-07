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
      '# EMAIL GENERATION TASK',
      '',
      '## YOUR MISSION',
      'Generate an email response that sounds EXACTLY like the user would write it.',
      'You are writing AS the user, in first person. The recipient must NEVER know AI helped.',
      '',
      '## CONTEXT',
      'Mode: {{mode}}',
      '- Reply: Respond only to the sender',
      '- ReplyAll: Respond to sender and all recipients', 
      '- Forward: Add brief intro and forward to new recipients',
      '',
      'Tone: {{tone}}',
      '- Professional: Formal business communication',
      '- Friendly: Warm but professional',
      '- Casual: Relaxed and conversational',
      '- Formal: Very proper and structured',
      '- Humorous: Light and witty while appropriate',
      '',
      'Intent: {{intent}}',
      '- Empty means normal response',
      '- Decline: Politely refuse or say no',
      '- AskFollowUps: Request more information',
      '- Confirm: Acknowledge and agree',
      '- Schedule: Arrange meeting/call',
      '- Thanks: Express gratitude',
      '',
      '## EMAIL THREAD',
      'Subject: {{subject}}',
      'From: {{from}}',
      'To: {{toList}}',
      'Cc: {{ccList}}',
      '',
      'Thread History (most recent last):',
      '{{fullThreadText}}',
      '',
      '## REQUIREMENTS',
      '1. Match the user\'s writing style from the thread',
      '2. Address ALL points raised in the last message',
      '3. Keep appropriate length (not too short, not too long)',
      '4. Use proper email formatting',
      '5. Include appropriate greeting and sign-off',
      '',
      '## OUTPUT FORMAT',
      'Return ONLY valid JSON with these exact fields:',
      '{',
      '  "body": "Complete email body with greeting and sign-off",',
      '  "subject": "Updated subject if needed, or original",',
      '  "mode": "{{mode}}",',
      '  "safeToSend": true/false (false if potentially problematic)',
      '}',
      '',
      'NO other text outside the JSON!'
    ].join('\n');
  }
}
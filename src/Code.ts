/// <reference path="modules/config.ts" />
/// <reference path="modules/types.ts" />
/// <reference path="modules/utils.ts" />
/// <reference path="modules/validation.ts" />
/// <reference path="modules/template.ts" />
/// <reference path="modules/email.ts" />
/// <reference path="modules/gmail.ts" />
/// <reference path="modules/gemini.ts" />
/// <reference path="modules/document.ts" />
/// <reference path="modules/drive.ts" />
/// <reference path="modules/sheets.ts" />
/// <reference path="modules/logger.ts" />
/// <reference path="modules/state.ts" />
/// <reference path="modules/ui.ts" />
/// <reference path="modules/error-handler.ts" />

/**
 * Answer As Me 3 - AI-Powered Gmail Add-on
 * 
 * Entry point for the Gmail add-on
 */

// ===== ENTRY POINTS =====

/**
 * Homepage trigger
 */
function onHomepage(_event?: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.Card {
  return ErrorHandler.wrapWithErrorHandling(() => {
    AppLogger.info('Homepage opened', { version: Config.VERSION });
    
    const missing = State.getMissingRequirements();
    
    if (missing.length > 0) {
      return buildSettingsCard(`Setup required: ${missing.join(', ')}`);
    }
    
    return buildSettingsCard();
  }, 'onHomepage')();
}

/**
 * Settings universal action
 */
function onSettings(_event?: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.Card {
  return ErrorHandler.wrapWithErrorHandling(() => {
    AppLogger.info('Settings opened');
    return buildSettingsCard();
  }, 'onSettings')();
}

/**
 * Gmail message contextual trigger
 */
function onGmailMessage(event?: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.Card {
  return ErrorHandler.wrapWithErrorHandling(() => {
    AppLogger.info('Gmail message opened');
    
    // Check requirements
    const missing = State.getMissingRequirements();
    if (missing.length > 0) {
      return buildSettingsCard(`Setup required: ${missing.join(', ')}`);
    }
    
    // Validate event
    if (!event || !event.gmail || !event.gmail.messageId) {
      return buildDetailCard(undefined, 'Open an email to generate replies');
    }
    
    return buildDetailCard(event);
  }, 'onGmailMessage')();
}

/**
 * Compose trigger
 */
function onComposeAction(_event?: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.Card {
  return ErrorHandler.wrapWithErrorHandling(() => {
    AppLogger.info('Compose action triggered');
    return buildSettingsCard();
  }, 'onComposeAction')();
}

// ===== CARD BUILDERS =====

/**
 * Build settings card
 */
function buildSettingsCard(banner?: string): GoogleAppsScript.Card_Service.Card {
  const settings = State.getSettings();
  const sections: GoogleAppsScript.Card_Service.CardSection[] = [];
  
  // Add sections
  if (banner) {
    sections.push(createBannerSection(banner));
  }
  sections.push(createApiSection(settings));
  sections.push(createDefaultsSection(settings));
  sections.push(createPromptDocSection());
  sections.push(createLogsSection());
  sections.push(createDangerZoneSection());
  
  return UI.createCard(
    UI.createHeader(Config.APP_NAME, 'Settings & Configuration'),
    ...sections
  );
}

/**
 * Create banner section
 */
function createBannerSection(banner: string): GoogleAppsScript.Card_Service.CardSection {
  return UI.createSection(
    UI.createTextParagraph(`⚠️ ${banner}`)
  );
}

/**
 * Create API configuration section
 */
function createApiSection(settings: Types.Settings): GoogleAppsScript.Card_Service.CardSection {
  return UI.createSectionWithHeader('API Configuration',
    UI.createTextInput('apiKey', 'Gemini API Key', settings.apiKey),
    UI.createButtonSet([
      UI.createButton('Save', 'saveSettings'),
      UI.createButton('Test Key', 'testApiKey'),
      UI.createOpenLinkButton('Get API Key', 'https://makersuite.google.com/app/apikey')
    ])
  );
}

/**
 * Create defaults section
 */
function createDefaultsSection(settings: Types.Settings): GoogleAppsScript.Card_Service.CardSection {
  return UI.createSectionWithHeader('Default Settings',
    UI.createDropdown('defaultMode', 'Default Mode', Config.EMAIL.MODES, settings.defaultMode),
    UI.createDropdown('defaultTone', 'Default Tone', Config.EMAIL.TONES, settings.defaultTone),
    UI.createButton('Save All', 'saveSettings')
  );
}

/**
 * Create prompt document section
 */
function createPromptDocSection(): GoogleAppsScript.Card_Service.CardSection {
  return UI.createSectionWithHeader('Prompt Document (Required)',
    UI.createTextParagraph('Controls AI behavior and response format'),
    UI.createButton('Create/Open Prompt Doc', 'openOrCreatePromptDoc')
  );
}

/**
 * Create logs section
 */
function createLogsSection(): GoogleAppsScript.Card_Service.CardSection {
  return UI.createSectionWithHeader('Logs & Analytics',
    UI.createTextParagraph('Daily activity logs and API usage tracking'),
    UI.createButtonSet([
      UI.createButton('Create/Open Logs Folder', 'openOrCreateLogsFolder'),
      UI.createButton("Open Today's Log", 'openTodayLog')
    ])
  );
}

/**
 * Create danger zone section
 */
function createDangerZoneSection(): GoogleAppsScript.Card_Service.CardSection {
  return UI.createSectionWithHeader('Danger Zone',
    UI.createTextParagraph('Factory reset removes all settings'),
    UI.createButton('Factory Reset', 'factoryReset', {}, CardService.TextButtonStyle.FILLED)
  );
}

/**
 * Build detail card for email thread
 */
function buildDetailCard(_event?: Types.GmailAddOnEvent, banner?: string): GoogleAppsScript.Card_Service.Card {
  const settings = State.getSettings();
  const sections: GoogleAppsScript.Card_Service.CardSection[] = [];
  
  // Banner
  if (banner) {
    sections.push(UI.createSection(
      UI.createTextParagraph(`⚠️ ${banner}`)
    ));
  }
  
  // Generation controls
  sections.push(UI.createSection(
    UI.createDropdown('mode', 'Mode', Config.EMAIL.MODES, settings.defaultMode),
    UI.createDropdown('tone', 'Tone', Config.EMAIL.TONES, settings.defaultTone),
    UI.createButton('Generate Reply', 'generateReply', {}, CardService.TextButtonStyle.FILLED)
  ));
  
  // Fast actions
  const intentButtons = Config.EMAIL.INTENTS.map(intent => 
    UI.createButton(intent, 'generateWithIntent', { intent })
  );
  
  sections.push(UI.createSectionWithHeader('Quick Actions',
    UI.createButtonSet(intentButtons),
    UI.createTextParagraph('Note: Long threads may be truncated for reliability.')
  ));
  
  // Settings link
  sections.push(UI.createSection(
    UI.createButton('Settings', 'onSettings')
  ));
  
  return UI.createCard(
    UI.createHeader(Config.APP_NAME, 'Email Assistant'),
    ...sections
  );
}

/**
 * Build preview card
 */
function buildPreviewCard(preview: Types.PreviewData): GoogleAppsScript.Card_Service.Card {
  const sections: GoogleAppsScript.Card_Service.CardSection[] = [];
  
  // Metadata
  const chips = `Mode: ${preview.mode} • Tone: ${preview.tone}${preview.intent ? ` • Intent: ${preview.intent}` : ''}${preview.truncated ? ' • Thread truncated' : ''}`;
  sections.push(UI.createSection(
    UI.createTextParagraph(chips)
  ));
  
  if (!preview.safeToSend) {
    sections.push(UI.createSection(
      UI.createTextParagraph('⚠️ Model flagged this as potentially unsafe. Review carefully.')
    ));
  }
  
  // Recipients
  sections.push(UI.createSectionWithHeader('Recipients',
    UI.createKeyValue('To', preview.to.join(', ')),
    ...(preview.cc.length > 0 ? [UI.createKeyValue('Cc', preview.cc.join(', '))] : [])
  ));
  
  // Body preview
  const bodyPreview = preview.body.length > Config.EMAIL.PREVIEW_CHARS
    ? preview.body.substring(0, Config.EMAIL.PREVIEW_CHARS) + '…'
    : preview.body;
  
  sections.push(UI.createSectionWithHeader('Message Preview',
    UI.createTextParagraph(Utils.escapeHtml(bodyPreview))
  ));
  
  // Actions
  sections.push(UI.createSectionWithHeader('Compose Actions',
    UI.createButtonSet([
      UI.createButton('Reply in Thread', 'composeReplyInThread', 
        { body: preview.body }, CardService.TextButtonStyle.FILLED),
      UI.createButton('Reply All in Thread', 'composeReplyAllInThread', 
        { body: preview.body }),
      UI.createButton('Forward in Thread', 'composeForwardInThread', 
        { body: preview.body, subject: preview.subject })
    ]),
    UI.createButtonSet([
      UI.createButton('Use in Compose (New)', 'useInComposeStandalone', {
        mode: preview.mode,
        subject: preview.subject,
        body: preview.body,
        to: preview.to.join(','),
        cc: preview.cc.join(',')
      }),
      UI.createButton('Back', 'onGmailMessage'),
      UI.createButton('Settings', 'onSettings')
    ])
  ));
  
  return UI.createCard(
    UI.createHeader('Preview', `${preview.mode} • ${preview.subject}`),
    ...sections
  );
}

// ===== ACTION HANDLERS =====

/**
 * Save settings action
 */
function saveSettings(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const formInputs = event.formInputs || {};
    
    const apiKey = Validation.getFormValue(formInputs, 'apiKey');
    const defaultMode = Validation.getFormValue(formInputs, 'defaultMode');
    const defaultTone = Validation.getFormValue(formInputs, 'defaultTone');
    
    const settings: Parameters<typeof State.saveSettings>[0] = {};
    if (apiKey !== undefined) {
      settings.apiKey = apiKey;
    }
    if (defaultMode !== undefined) {
      settings.defaultMode = defaultMode as Types.EmailMode;
    }
    if (defaultTone !== undefined) {
      settings.defaultTone = defaultTone as Types.EmailTone;
    }
    
    State.saveSettings(settings);
    
    return UI.createActionResponse(
      UI.createNotification('Settings saved'),
      UI.createUpdateNavigation(buildSettingsCard())
    );
  }, 'saveSettings')();
}

/**
 * Test API key action
 */
function testApiKey(_event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const apiKey = Validation.ensureApiKey();
    
    const result = Gemini.callGenerateContent(apiKey, 'Return {"ping":true} as JSON only.');
    const parsed = Gemini.parseResponse(result.text);
    const success = result.code === 200 && parsed !== null && 'ping' in parsed;
    
    AppLogger.logApiKeyTest(success, result, Gemini.getSafetyRatings(result.text));
    
    return UI.createActionResponse(
      UI.createNotification(success ? '✅ API key is valid' : `❌ API key test failed: HTTP ${result.code}`)
    );
  }, 'testApiKey')();
}

/**
 * Open or create prompt document
 */
function openOrCreatePromptDoc(_event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    Document.getOrCreatePromptDoc();
    const url = Document.getPromptDocUrl();
    
    return CardService.newActionResponseBuilder()
      .setOpenLink(CardService.newOpenLink()
        .setUrl(url)
        .setOpenAs(CardService.OpenAs.FULL_SIZE))
      .build();
  }, 'openOrCreatePromptDoc')();
}

/**
 * Open or create logs folder
 */
function openOrCreateLogsFolder(_event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    DriveUtils.getOrCreateLogsFolder();
    const url = DriveUtils.getLogsFolderUrl();
    
    // Ensure today's sheet exists
    SheetsUtils.getTodaySheet();
    
    return CardService.newActionResponseBuilder()
      .setOpenLink(CardService.newOpenLink()
        .setUrl(url)
        .setOpenAs(CardService.OpenAs.FULL_SIZE))
      .build();
  }, 'openOrCreateLogsFolder')();
}

/**
 * Open today's log sheet
 */
function openTodayLog(_event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const url = SheetsUtils.getTodaySheetUrl();
    
    return CardService.newActionResponseBuilder()
      .setOpenLink(CardService.newOpenLink()
        .setUrl(url)
        .setOpenAs(CardService.OpenAs.FULL_SIZE))
      .build();
  }, 'openTodayLog')();
}

/**
 * Factory reset
 */
function factoryReset(_event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    State.clearAllSettings();
    
    return UI.createActionResponse(
      UI.createNotification('All settings cleared'),
      UI.createUpdateNavigation(buildSettingsCard('Factory reset complete'))
    );
  }, 'factoryReset')();
}

/**
 * Generate reply action
 */
function generateReply(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  return doGenerate(event, undefined, undefined);
}

/**
 * Generate with intent
 */
function generateWithIntent(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  const intent = event.parameters?.intent || '';
  return doGenerate(event, undefined, intent);
}

/**
 * Core generation logic
 */
function doGenerate(
  event: Types.GmailAddOnEvent,
  toneOverride?: string,
  intent?: string
): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    // Validate requirements
    Validation.ensureAllRequirements();
    const validEvent = Validation.validateGmailEvent(event);
    
    // Extract context
    const context = Generation.extractContext(validEvent);
    
    // Apply tone override if provided
    if (toneOverride) {
      context.tone = toneOverride as Types.EmailTone;
    }
    
    // Build prompt
    const promptText = Generation.buildPromptText({
      ...context,
      intent: intent || ''
    });
    
    // Call Gemini
    const apiKey = Validation.ensureApiKey();
    const geminiResult = Gemini.generateEmailReply(apiKey, promptText);
    
    // Log the generation
    logGeneration(context, intent || '', geminiResult);
    
    if (!geminiResult.success || !geminiResult.response) {
      return ErrorHandler.createErrorResponse(geminiResult.error || 'Failed to generate reply');
    }
    
    // Build preview and return
    const preview = Generation.buildPreviewData(geminiResult.response, {
      ...context,
      intent: intent || ''
    });
    
    return UI.createActionResponse(
      UI.createNotification('Reply generated'),
      UI.createPushNavigation(buildPreviewCard(preview))
    );
  }, 'doGenerate')();
}

/**
 * Log generation attempt
 */
function logGeneration(
  context: ReturnType<typeof Generation.extractContext>,
  intent: string,
  geminiResult: ReturnType<typeof Gemini.generateEmailReply>
): void {
  AppLogger.logEmailGeneration({
    mode: context.mode,
    tone: context.tone,
    intent,
    subject: context.threadMetadata.firstSubject,
    recipients: context.recipients,
    success: geminiResult.success,
    ...(geminiResult.error && { error: geminiResult.error }),
    apiResult: geminiResult.apiResult,
    safetyInfo: geminiResult.safetyInfo,
    truncated: context.truncated,
    threadId: context.threadMetadata.id,
    messageId: context.metadata.id
  });
}

// ===== COMPOSE ACTIONS =====

/**
 * Compose reply in thread
 */
function composeReplyInThread(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.UpdateDraftActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const validEvent = Validation.validateGmailEvent(event);
    GmailUtils.setAccessToken(validEvent.gmail!.accessToken!);
    
    const body = event.parameters?.body || '';
    return GmailUtils.buildDraftResponse(body);
  }, 'composeReplyInThread')();
}

/**
 * Compose reply all in thread
 */
function composeReplyAllInThread(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.UpdateDraftActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const validEvent = Validation.validateGmailEvent(event);
    const message = GmailUtils.getMessageById(validEvent.gmail!.messageId!, validEvent.gmail!.accessToken!);
    const thread = GmailUtils.getThreadFromMessage(message);
    
    const recipients = Email.computeRecipients(thread, 'ReplyAll');
    const body = event.parameters?.body || '';
    
    return GmailUtils.buildDraftResponseWithRecipients(body, recipients.to, recipients.cc);
  }, 'composeReplyAllInThread')();
}

/**
 * Compose forward in thread
 */
function composeForwardInThread(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.UpdateDraftActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const validEvent = Validation.validateGmailEvent(event);
    GmailUtils.setAccessToken(validEvent.gmail!.accessToken!);
    
    const body = event.parameters?.body || '';
    const subject = event.parameters?.subject || '';
    
    return GmailUtils.buildDraftResponseWithSubject(body, subject);
  }, 'composeForwardInThread')();
}

/**
 * Use in standalone compose
 */
function useInComposeStandalone(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.UpdateDraftActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const params = event.parameters || {};
    
    const mode = params.mode || 'Reply';
    let subject = params.subject || '';
    const body = params.body || '';
    const to = params.to ? params.to.split(',') : [];
    const cc = params.cc ? params.cc.split(',') : [];
    
    // Adjust subject for non-forward modes
    if (mode !== 'Forward') {
      subject = `Re: ${subject.replace(/^Re:\s*/i, '').replace(/^Fwd:\s*/i, '')}`;
    }
    
    return GmailUtils.buildFullDraftResponse(body, subject, to, cc);
  }, 'useInComposeStandalone')();
}

// ===== TEST FUNCTION =====

/**
 * Test function for development
 */
function testAddon(): void {
  AppLogger.info('Testing add-on', { version: Config.VERSION });
  
  try {
    onHomepage();
    AppLogger.info('Homepage card created successfully');
    
    const settings = State.getSettings();
    AppLogger.info('Current settings', settings);
  } catch (error) {
    AppLogger.error('Test failed', error);
  }
}
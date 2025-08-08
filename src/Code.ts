/// <reference path="modules/config.ts" />
/// <reference path="modules/types.ts" />
/// <reference path="modules/algorithms.ts" />
/// <reference path="modules/cs-utils.ts" />
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
/// <reference path="modules/generation.ts" />
/// <reference path="modules/error-handler.ts" />

/**
 * Answer As Me 3 - AI-Powered Gmail Add-on
 * 
 * Entry point for the Gmail add-on
 */

// ===== ENTRY POINTS =====

/**
 * Homepage trigger - Returns array of cards as required by Gmail
 */
function onHomepage(_event?: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.Card[] {
  return ErrorHandler.wrapWithErrorHandling(() => {
    AppLogger.info('Homepage opened', { version: Config.VERSION });
    
    const missing = State.getMissingRequirements();
    
    const card = missing.length > 0
      ? buildSettingsCard(`Setup required: ${missing.join(', ')}`)
      : buildSettingsCard();
    
    // Gmail requires array of cards for homepage trigger
    return [card];
  }, 'onHomepage')();
}

/**
 * Settings universal action - Returns UniversalActionResponse for manifest
 */
function onSettingsUniversal(_event?: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.UniversalActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    AppLogger.info('Settings opened via universal action');
    const card = buildSettingsCard();
    return CardService.newUniversalActionResponseBuilder()
      .displayAddOnCards([card])
      .build();
  }, 'onSettingsUniversal')();
}

/**
 * Settings action for in-card buttons - Returns ActionResponse
 */
function openSettingsAction(_event?: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    AppLogger.info('Settings opened via card button');
    return UI.createActionResponse(
      UI.createNotification('Opening Settings…'),
      UI.createUpdateNavigation(buildSettingsCard())
    );
  }, 'openSettingsAction')();
}

/**
 * Legacy settings function - kept for backward compatibility
 */
function onSettings(_event?: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.Card {
  return ErrorHandler.wrapWithErrorHandling(() => {
    AppLogger.info('Settings opened (legacy)');
    return buildSettingsCard();
  }, 'onSettings')();
}

/**
 * Gmail message contextual trigger - Uses unified quick reply interface
 */
function onGmailMessage(event?: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.Card {
  return ErrorHandler.wrapWithErrorHandling(() => {
    AppLogger.info('Gmail message opened');
    
    // Check requirements
    const missing = State.getMissingRequirements();
    if (missing.length > 0) {
      return buildSettingsCard(`Setup required: ${missing.join(', ')}`);
    }
    
    // Use unified quick reply interface
    return buildQuickReplyCard(event, false);
  }, 'onGmailMessage')();
}

/**
 * Insert last suggestion into compose editor
 * Used from compose UI to insert cached generated body
 */
function insertLastSuggestionInCompose(_event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.UpdateDraftActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const body = CacheService.getUserCache().get('AAM3_LAST_BODY') || '';
    
    if (!body) {
      // Return empty response if no cached body
      return CardService.newUpdateDraftActionResponseBuilder().build();
    }
    
    return CardService.newUpdateDraftActionResponseBuilder()
      .setUpdateDraftBodyAction(
        CardService.newUpdateDraftBodyAction()
          .addUpdateContent(Utils.toHtml(body), CardService.ContentType.MUTABLE_HTML)
          .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT)
      )
      .build();
  }, 'insertLastSuggestionInCompose')();
}

/**
 * Compose trigger - Uses unified quick reply interface
 */
function onComposeAction(event?: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.Card {
  return ErrorHandler.wrapWithErrorHandling(() => {
    AppLogger.info('Compose action triggered');
    
    // Use unified quick reply interface (compose mode)
    return buildQuickReplyCard(event, true);
  }, 'onComposeAction')();
}

/**
 * Back to thread action - Returns ActionResponse for navigation
 */
function backToThread(_event?: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    AppLogger.info('Navigating back to thread');
    const nav = CardService.newNavigation().popCard();
    return UI.createActionResponse(UI.createNotification(''), nav);
  }, 'backToThread')();
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
      UI.createOpenLinkButton('Get API Key', 'https://aistudio.google.com/app/apikey')
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
  const loggingEnabled = Utils.getProperty(Config.PROPS.LOGGING_ENABLED, 'true') === 'true';
  
  return UI.createSectionWithHeader('Logs & Analytics',
    UI.createTextParagraph('Daily activity logs and API usage tracking'),
    UI.createSwitch('loggingEnabled', 'Enable Logging', loggingEnabled),
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
 * BUILD UNIFIED QUICK REPLY CARD - ONE INTERFACE TO RULE THEM ALL!
 * Works for both message view and compose view
 * No duplicate functionality, clean UX
 */
function buildQuickReplyCard(event?: Types.GmailAddOnEvent, isCompose: boolean = false): GoogleAppsScript.Card_Service.Card {
  const settings = State.getSettings();
  const sections: GoogleAppsScript.Card_Service.CardSection[] = [];
  
  // Show thread context ONLY in message view (not in compose)
  if (!isCompose && event?.gmail?.messageId && event?.gmail?.accessToken) {
    try {
      GmailUtils.setAccessToken(event.gmail.accessToken);
      const message = GmailUtils.getMessageById(event.gmail.messageId, event.gmail.accessToken);
      const metadata = GmailUtils.getMessageMetadata(message);
      const thread = GmailUtils.getThreadFromMessage(message);
      
      const from = metadata?.from || '';
      const fromParts = from.split('<');
      const fromName = fromParts[0] ? fromParts[0].trim() : 'Unknown';
      const subject = metadata?.subject || 'No subject';
      const msgCount = thread?.getMessages()?.length || 0;
      
      sections.push(UI.createSection(
        UI.createTextParagraph(`📧 ${subject}`),
        UI.createTextParagraph(`From: ${fromName} • ${msgCount} msgs`)
      ));
    } catch (e) {
      // Silent fail - just don't show context
    }
  }
  
  // QUICK ACTIONS - Clean grid layout (3x3)
  const quickActions = [
    { icon: '✅', text: 'Yes', intent: 'Confirm and agree' },
    { icon: '❌', text: 'No', intent: 'Politely decline' },
    { icon: '📅', text: 'Schedule', intent: 'Schedule a meeting' },
    { icon: '❓', text: 'Info?', intent: 'Need more information' },
    { icon: '🙏', text: 'Thanks', intent: 'Thank you' },
    { icon: '⏭️', text: 'Forward', intent: 'Will forward to right person' },
    { icon: '🔄', text: 'Follow', intent: 'Following up' },
    { icon: '📝', text: 'Summary', intent: 'Here is a summary' },
    { icon: '⌛', text: 'Later', intent: 'Will respond later' }
  ];
  
  // Use different function for compose vs message context
  const actionFunction = isCompose ? 'quickComposeAction' : 'quickReplyWithIntent';
  
  const actionButtons = quickActions.map(action =>
    UI.createButton(
      `${action.icon} ${action.text}`,
      actionFunction,
      { intent: action.intent },
      CardService.TextButtonStyle.FILLED
    )
  );
  
  sections.push(UI.createSectionWithHeader('⚡ Quick Actions',
    UI.createButtonSet(actionButtons.slice(0, 3)),
    UI.createButtonSet(actionButtons.slice(3, 6)),
    UI.createButtonSet(actionButtons.slice(6, 9))
  ));
  
  // MODE & TONE - Compact single row
  const modeButtons = [
    UI.createButton(
      settings.defaultMode === 'Reply' ? '● Reply' : 'Reply',
      isCompose ? 'setComposeMode' : 'setReplyMode',
      { mode: 'Reply' },
      settings.defaultMode === 'Reply' ? CardService.TextButtonStyle.FILLED : CardService.TextButtonStyle.TEXT
    ),
    UI.createButton(
      settings.defaultMode === 'ReplyAll' ? '● All' : 'All',
      isCompose ? 'setComposeMode' : 'setReplyMode',
      { mode: 'ReplyAll' },
      settings.defaultMode === 'ReplyAll' ? CardService.TextButtonStyle.FILLED : CardService.TextButtonStyle.TEXT
    ),
    UI.createButton(
      settings.defaultMode === 'Forward' ? '● Fwd' : 'Fwd',
      isCompose ? 'setComposeMode' : 'setReplyMode', 
      { mode: 'Forward' },
      settings.defaultMode === 'Forward' ? CardService.TextButtonStyle.FILLED : CardService.TextButtonStyle.TEXT
    )
  ];
  
  const toneButtons = [
    UI.createButton(
      settings.defaultTone === 'Professional' ? '● Pro' : 'Pro',
      isCompose ? 'setComposeTone' : 'setReplyTone',
      { tone: 'Professional' },
      settings.defaultTone === 'Professional' ? CardService.TextButtonStyle.FILLED : CardService.TextButtonStyle.TEXT
    ),
    UI.createButton(
      settings.defaultTone === 'Friendly' ? '● Friendly' : 'Friendly',
      isCompose ? 'setComposeTone' : 'setReplyTone',
      { tone: 'Friendly' },
      settings.defaultTone === 'Friendly' ? CardService.TextButtonStyle.FILLED : CardService.TextButtonStyle.TEXT
    ),
    UI.createButton(
      settings.defaultTone === 'Casual' ? '● Casual' : 'Casual',
      isCompose ? 'setComposeTone' : 'setReplyTone',
      { tone: 'Casual' },
      settings.defaultTone === 'Casual' ? CardService.TextButtonStyle.FILLED : CardService.TextButtonStyle.TEXT
    )
  ];
  
  sections.push(UI.createSection(
    UI.createButtonSet([...modeButtons, ...toneButtons])
  ));
  
  // Custom input field
  sections.push(UI.createSection(
    UI.createTextInput('customIntent', 'Custom message...', ''),
    UI.createButton('Generate', isCompose ? 'generateForCompose' : 'generateCustom', {}, CardService.TextButtonStyle.FILLED)
  ));
  
  // PRIMARY ACTION - Different for message vs compose
  if (!isCompose && event?.gmail?.messageId) {
    // Message view: Generate & Insert button
    const generateInsertButton = CardService.newTextButton()
      .setText('🚀 Generate & Open Reply')
      .setComposeAction(
        CardService.newAction().setFunctionName('generateAndOpenReply'),
        CardService.ComposedEmailType.REPLY_AS_DRAFT
      );
    sections.push(UI.createSection(generateInsertButton));
  } else if (isCompose) {
    // Compose view: Insert last suggestion if available
    const cache = CacheService.getUserCache();
    if (cache.get('AAM3_LAST_BODY')) {
      sections.push(UI.createSection(
        UI.createButton('📋 Insert Last Reply', 'insertLastSuggestionInCompose', {}, CardService.TextButtonStyle.FILLED)
      ));
    }
  }
  
  // Settings link (minimal)
  sections.push(UI.createSection(
    UI.createButton('⚙️ Settings', 'openSettingsAction', {}, CardService.TextButtonStyle.TEXT)
  ));
  
  return UI.createCard(
    UI.createHeader(Config.APP_NAME, '⚡ Quick Reply'),
    ...sections
  );
}

// REMOVED buildDetailCard - Using unified buildQuickReplyCard instead

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
      UI.createButton('Back', 'backToThread'),
      UI.createButton('Settings', 'openSettingsAction')
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
    const loggingEnabled = Validation.getFormValue(formInputs, 'loggingEnabled');
    
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
    
    // Save logging enabled separately
    if (loggingEnabled !== undefined) {
      Utils.setProperty(Config.PROPS.LOGGING_ENABLED, loggingEnabled === 'true' ? 'true' : 'false');
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
    
    AppLogger.logApiKeyTest(success, result, Gemini.getSafetyRatings(result.text) || undefined);
    
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
  // Strict Gmail context guard
  if (!Validation.isValidGmailContext(event)) {
    return Validation.createGmailContextError();
  }
  return doGenerate(event, undefined, undefined);
}

/**
 * Generate with intent
 */
function generateWithIntent(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  // Strict Gmail context guard
  if (!Validation.isValidGmailContext(event)) {
    return Validation.createGmailContextError();
  }
  const intent = event.parameters?.intent || '';
  return doGenerate(event, undefined, intent);
}

/**
 * Quick reply with intent - for the new quick action buttons
 */
function quickReplyWithIntent(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ComposeActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    // Validate requirements
    Validation.ensureAllRequirements();
    const validEvent = Validation.validateGmailEvent(event);
    
    const intent = event.parameters?.intent || '';
    
    // Extract context
    const context = Generation.extractContext(validEvent);
    
    // Build prompt with intent
    const { promptText, truncated: promptTruncated } = Generation.buildPromptText({
      ...context,
      intent
    });
    
    // Call Gemini
    const apiKey = Validation.ensureApiKey();
    const geminiResult = Gemini.generateEmailReply(apiKey, promptText);
    
    // Log the generation
    const fullTruncated = context.truncated || promptTruncated;
    logGeneration({ ...context, truncated: fullTruncated }, intent, geminiResult);
    
    if (!geminiResult.success || !geminiResult.response) {
      // Return empty compose action on error
      return CardService.newComposeActionResponseBuilder().build();
    }
    
    // Cache the generated body
    CacheService.getUserCache().put('AAM3_LAST_BODY', geminiResult.response.body, 600);
    
    // Create draft and open
    GmailUtils.setAccessToken(validEvent.gmail!.accessToken!);
    const message = GmailUtils.getMessageById(validEvent.gmail!.messageId!, validEvent.gmail!.accessToken!);
    const html = Utils.toHtml(geminiResult.response.body);
    
    const draft = (context.mode === 'ReplyAll')
      ? message.getThread().createDraftReplyAll('', { htmlBody: html })
      : (context.mode === 'Forward')
      ? message.getThread().createDraftReply(`Fwd: ${message.getSubject()}`, { htmlBody: html })
      : message.createDraftReply('', { htmlBody: html });
    
    return CardService.newComposeActionResponseBuilder()
      .setGmailDraft(draft)
      .build();
  }, 'quickReplyWithIntent')();
}

/**
 * Set reply mode (for message view)
 */
function setReplyMode(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const mode = event.parameters?.mode || 'Reply';
    const settings = State.getSettings();
    settings.defaultMode = mode as Types.EmailMode;
    State.saveSettings(settings);
    
    return UI.createActionResponse(
      UI.createNotification(`Mode: ${mode}`),
      UI.createUpdateNavigation(buildQuickReplyCard(event, false))
    );
  }, 'setReplyMode')();
}

/**
 * Set reply tone (for message view)
 */
function setReplyTone(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const tone = (event.parameters as any)?.tone || 'Professional';
    const settings = State.getSettings();
    settings.defaultTone = tone as Types.EmailTone;
    State.saveSettings(settings);
    
    return UI.createActionResponse(
      UI.createNotification(`Tone: ${tone}`),
      UI.createUpdateNavigation(buildQuickReplyCard(event, false))
    );
  }, 'setReplyTone')();
}

/**
 * Quick compose action for compose UI
 */
function quickComposeAction(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.UpdateDraftActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const intent = event.parameters?.intent || '';
    const settings = State.getSettings();
    
    if (!settings.apiKey) {
      return GmailUtils.buildDraftResponse('Please configure your Gemini API key in settings.');
    }
    
    // Simple prompt for quick compose
    const prompt = `Write an email to ${intent}.

Generate a complete, professional email.

Respond with just the email content. Start with "Subject: [your subject]" on the first line, then a blank line, then the email body.`;
    
    const result = Gemini.callGenerateContent(settings.apiKey, prompt);
    
    if (result.code !== 200 || !result.text) {
      return GmailUtils.buildDraftResponse(`Error: Failed to generate (${result.code})`);
    }
    
    // Extract subject and body
    const lines = result.text.split('\n');
    let subject = '';
    let body = result.text;
    
    if (lines && lines.length > 0 && lines[0] && lines[0].startsWith('Subject:')) {
      subject = lines[0].replace('Subject:', '').trim();
      body = lines.slice(2).join('\n'); // Skip subject and blank line
    }
    
    // Build response with subject if found
    if (subject) {
      return CardService.newUpdateDraftActionResponseBuilder()
        .setUpdateDraftSubjectAction(CardService.newUpdateDraftSubjectAction()
          .addUpdateSubject(subject))
        .setUpdateDraftBodyAction(CardService.newUpdateDraftBodyAction()
          .addUpdateContent(Utils.toHtml(body), CardService.ContentType.MUTABLE_HTML)
          .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT))
        .build();
    }
    
    return GmailUtils.buildDraftResponse(body);
  }, 'quickComposeAction')();
}

/**
 * Set compose mode (for compose view)
 */
function setComposeMode(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const mode = event.parameters?.mode || 'Reply';
    const settings = State.getSettings();
    settings.defaultMode = mode as Types.EmailMode;
    State.saveSettings(settings);
    
    return UI.createActionResponse(
      UI.createNotification(`Mode: ${mode}`),
      UI.createUpdateNavigation(buildQuickReplyCard(event, true))
    );
  }, 'setComposeMode')();
}

/**
 * Set compose tone (for compose view)
 */
function setComposeTone(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const tone = (event.parameters as any)?.tone || 'Professional';
    const settings = State.getSettings();
    settings.defaultTone = tone as Types.EmailTone;
    State.saveSettings(settings);
    
    return UI.createActionResponse(
      UI.createNotification(`Tone: ${tone}`),
      UI.createUpdateNavigation(buildQuickReplyCard(event, true))
    );
  }, 'setComposeTone')();
}

/**
 * Generate custom reply from text input (message view)
 */
function generateCustom(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ComposeActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const customIntent = (event.formInputs as any)?.customIntent?.[0] || '';
    
    if (!customIntent) {
      return CardService.newComposeActionResponseBuilder().build();
    }
    
    // Validate requirements
    Validation.ensureAllRequirements();
    const validEvent = Validation.validateGmailEvent(event);
    
    // Extract context
    const context = Generation.extractContext(validEvent);
    
    // Build prompt with custom intent
    const { promptText, truncated: promptTruncated } = Generation.buildPromptText({
      ...context,
      intent: customIntent
    });
    
    // Call Gemini
    const apiKey = Validation.ensureApiKey();
    const geminiResult = Gemini.generateEmailReply(apiKey, promptText);
    
    // Log the generation
    const fullTruncated = context.truncated || promptTruncated;
    logGeneration({ ...context, truncated: fullTruncated }, customIntent, geminiResult);
    
    if (!geminiResult.success || !geminiResult.response) {
      return CardService.newComposeActionResponseBuilder().build();
    }
    
    // Cache and create draft
    CacheService.getUserCache().put('AAM3_LAST_BODY', geminiResult.response.body, 600);
    
    const accessToken = validEvent.gmail?.accessToken;
    const messageId = validEvent.gmail?.messageId;
    
    if (!accessToken || !messageId) {
      return CardService.newComposeActionResponseBuilder().build();
    }
    
    GmailUtils.setAccessToken(accessToken);
    const message = GmailUtils.getMessageById(messageId, accessToken);
    const html = Utils.toHtml(geminiResult.response.body);
    
    const draft = (context.mode === 'ReplyAll')
      ? message.getThread().createDraftReplyAll('', { htmlBody: html })
      : (context.mode === 'Forward')
      ? message.getThread().createDraftReply(`Fwd: ${message.getSubject()}`, { htmlBody: html })
      : message.createDraftReply('', { htmlBody: html });
    
    return CardService.newComposeActionResponseBuilder()
      .setGmailDraft(draft)
      .build();
  }, 'generateCustom')();
}

/**
 * Generate and open reply in compose window (proper inline reply)
 * Uses ComposeActionResponse to open reply editor in thread
 */
function generateAndOpenReply(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.ComposeActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    // Validate requirements
    Validation.ensureAllRequirements();
    const validEvent = Validation.validateGmailEvent(event);
    
    // Extract context
    const context = Generation.extractContext(validEvent);
    
    // Build prompt
    const { promptText, truncated: promptTruncated } = Generation.buildPromptText({
      ...context,
      intent: ''
    });
    
    // Call Gemini
    const apiKey = Validation.ensureApiKey();
    const geminiResult = Gemini.generateEmailReply(apiKey, promptText);
    
    // Log the generation
    const fullTruncated = context.truncated || promptTruncated;
    logGeneration({ ...context, truncated: fullTruncated }, '', geminiResult);
    
    if (!geminiResult.success || !geminiResult.response) {
      // Compose actions must return a ComposeActionResponse
      // Return empty one so Gmail stays put while showing error
      return CardService.newComposeActionResponseBuilder().build();
    }
    
    // Cache the generated body for compose UI insert
    CacheService.getUserCache().put('AAM3_LAST_BODY', geminiResult.response.body, 600); // 10 min TTL
    
    // Create a GmailDraft reply and hand it to Gmail
    GmailUtils.setAccessToken(validEvent.gmail!.accessToken!);
    const message = GmailUtils.getMessageById(validEvent.gmail!.messageId!, validEvent.gmail!.accessToken!);
    const html = Utils.toHtml(geminiResult.response.body);
    
    const draft = (context.mode === 'ReplyAll')
      ? message.getThread().createDraftReplyAll('', { htmlBody: html })
      : message.createDraftReply('', { htmlBody: html });
    
    return CardService.newComposeActionResponseBuilder()
      .setGmailDraft(draft)
      .build();
  }, 'generateAndOpenReply')();
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
    const { promptText, truncated: promptTruncated } = Generation.buildPromptText({
      ...context,
      intent: intent || ''
    });
    
    // Call Gemini
    const apiKey = Validation.ensureApiKey();
    const geminiResult = Gemini.generateEmailReply(apiKey, promptText);
    
    // Log the generation (merge truncation flags)
    const fullTruncated = context.truncated || promptTruncated;
    logGeneration({ ...context, truncated: fullTruncated }, intent || '', geminiResult);
    
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
    ...(geminiResult.safetyInfo && { safetyInfo: geminiResult.safetyInfo }),
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

/**
 * Generate draft for compose
 */
function generateForCompose(event: Types.GmailAddOnEvent): GoogleAppsScript.Card_Service.UpdateDraftActionResponse {
  return ErrorHandler.wrapWithErrorHandling(() => {
    const settings = State.getSettings();
    const customIntent = (event.formInputs as any)?.customIntent?.[0] || '';
    
    if (!customIntent) {
      return GmailUtils.buildDraftResponse('Please describe what you would like to say.');
    }
    
    // Simple prompt for compose mode
    const prompt = `Write an email with the following requirements:
- Mode: ${settings.defaultMode}
- Tone: ${settings.defaultTone}
- Content: ${customIntent}

Generate a complete email with an appropriate subject line.

Respond with just the email content. Start with "Subject: [your subject]" on the first line, then a blank line, then the email body.`;
    
    if (!settings.apiKey) {
      return GmailUtils.buildDraftResponse('Please configure your Gemini API key in settings.');
    }
    
    const result = Gemini.callGenerateContent(settings.apiKey, prompt);
    
    if (result.code !== 200 || !result.text) {
      return GmailUtils.buildDraftResponse(`Error: Failed to generate email (${result.code})`);
    }
    
    // For compose, we get plain text response
    return GmailUtils.buildDraftResponse(result.text);
  }, 'generateForCompose')();
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
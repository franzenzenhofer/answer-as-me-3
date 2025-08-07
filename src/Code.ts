/// <reference path="modules/config.ts" />
/// <reference path="modules/logger.ts" />
/// <reference path="modules/state.ts" />
/// <reference path="modules/ui.ts" />
/// <reference path="modules/error-handler.ts" />

/**
 * Answer As Me 3 - Modular Hello World Google Apps Script Add-on
 * 
 * Entry point for the Gmail add-on
 */

// Entry point for the add-on
function onHomepage(_event?: any): GoogleAppsScript.Card_Service.Card {
  return ErrorHandler.wrapAsync(() => {
    AppLogger.info('Homepage opened', { version: Config.VERSION });
    
    // Load state
    State.loadFromProperties();
    
    const userName = State.getUserName();
    const greetingCount = State.getGreetingCount();
    
    // Build UI
    const header = UI.createHeader(
      Config.APP_NAME,
      `Version ${Config.VERSION}`
    );
    
    const nameInput = UI.createTextInput(
      'userName',
      'Your Name',
      'Enter your name for a personalized greeting',
      userName
    );
    
    const greetButton = UI.createButton(
      'Say Hello',
      'generateGreeting'
    );
    
    const statsText = UI.createDecoratedText(
      `Greetings generated: ${greetingCount}`,
      'Total count',
      CardService.Icon.STAR
    );
    
    const mainSection = UI.createSection(
      UI.createTextParagraph('Welcome to the modular Hello World add-on!'),
      nameInput,
      greetButton,
      statsText
    );
    
    // Add last greeting if available
    const sections = [mainSection];
    const lastGreeting = State.getLastGreeting();
    if (lastGreeting) {
      const greetingSection = UI.createSection(
        UI.createTextParagraph('<b>Last Greeting:</b>'),
        UI.createTextParagraph(lastGreeting)
      );
      sections.push(greetingSection);
    }
    
    return UI.createCard(header, ...sections);
  }, 'onHomepage')();
}

// Action handler for generating greeting
function generateGreeting(event: any): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapAsync(() => {
    AppLogger.info('Generating greeting', event);
    
    const formInputs = event.formInputs;
    const userName = formInputs?.userName?.[0] || 'World';
    
    // Update state
    State.setUserName(userName);
    State.incrementGreetingCount();
    
    // Generate greeting
    const greeting = createPersonalizedGreeting(userName);
    State.setLastGreeting(greeting);
    
    // Show notification
    const notification = UI.createNotification(greeting);
    
    // Rebuild the card to show updated state
    const updatedCard = onHomepage(event);
    
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .setNavigation(CardService.newNavigation().updateCard(updatedCard))
      .build();
  }, 'generateGreeting')();
}

// Helper function to create personalized greetings
function createPersonalizedGreeting(name: string): string {
  const greetings = [
    `${Config.SETTINGS.DEFAULT_GREETING}, ${name}!`,
    `Hey ${name}, nice to see you!`,
    `Greetings, ${name}! Hope you're having a great day!`,
    `Welcome back, ${name}!`,
    `Hi ${name}! Thanks for using ${Config.APP_NAME}!`
  ];
  
  const randomIndex = Math.floor(Math.random() * greetings.length);
  return greetings[randomIndex]!;
}

// Settings action
function showSettings(_event: any): GoogleAppsScript.Card_Service.Card {
  return ErrorHandler.wrapAsync(() => {
    AppLogger.info('Settings opened');
    
    const header = UI.createHeader('Settings', Config.APP_NAME);
    
    const resetButton = UI.createButton(
      'Reset All Data',
      'resetData'
    );
    
    const backButton = UI.createButton(
      'Back to Home',
      'onHomepage'
    );
    
    const section = UI.createSection(
      UI.createTextParagraph('Manage your add-on settings'),
      resetButton,
      backButton
    );
    
    return UI.createCard(header, section);
  }, 'showSettings')();
}

// Reset data action
function resetData(event: any): GoogleAppsScript.Card_Service.ActionResponse {
  return ErrorHandler.wrapAsync(() => {
    AppLogger.info('Resetting data');
    
    State.reset();
    
    const notification = UI.createNotification('All data has been reset');
    const homeCard = onHomepage(event);
    
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .setNavigation(CardService.newNavigation().updateCard(homeCard))
      .build();
  }, 'resetData')();
}

// Universal action handlers
function showSettingsUniversal(): GoogleAppsScript.Card_Service.UniversalActionResponse {
  const settingsCard = showSettings({});
  return CardService.newUniversalActionResponseBuilder()
    .displayAddOnCards([settingsCard] as any)
    .build();
}

// Test function for development
function testAddon(): void {
  AppLogger.info('Testing add-on');
  const card = onHomepage();
  AppLogger.info('Card created successfully', card);
}
/**
 * UI module for building CardService components
 */
namespace UI {
  export function createHeader(title: string, subtitle?: string): GoogleAppsScript.Card_Service.CardHeader {
    const header = CardService.newCardHeader()
      .setTitle(title);
    
    if (subtitle) {
      header.setSubtitle(subtitle);
    }
    
    return header;
  }
  
  export function createTextInput(
    fieldName: string,
    title: string,
    hint?: string,
    value?: string
  ): GoogleAppsScript.Card_Service.TextInput {
    const input = CardService.newTextInput()
      .setFieldName(fieldName)
      .setTitle(title);
    
    if (hint) {
      input.setHint(hint);
    }
    
    if (value) {
      input.setValue(value);
    }
    
    return input;
  }
  
  export function createButton(
    text: string,
    actionFunction: string,
    parameters?: Record<string, string>
  ): GoogleAppsScript.Card_Service.TextButton {
    const action = CardService.newAction()
      .setFunctionName(actionFunction);
    
    if (parameters) {
      Object.entries(parameters).forEach(([key, value]) => {
        action.setParameters({ [key]: value });
      });
    }
    
    return CardService.newTextButton()
      .setText(text)
      .setOnClickAction(action);
  }
  
  export function createSection(...widgets: GoogleAppsScript.Card_Service.Widget[]): GoogleAppsScript.Card_Service.CardSection {
    const section = CardService.newCardSection();
    widgets.forEach(widget => section.addWidget(widget));
    return section;
  }
  
  export function createCard(
    header: GoogleAppsScript.Card_Service.CardHeader,
    ...sections: GoogleAppsScript.Card_Service.CardSection[]
  ): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder()
      .setHeader(header);
    
    sections.forEach(section => card.addSection(section));
    
    return card.build();
  }
  
  export function createNotification(message: string): GoogleAppsScript.Card_Service.Notification {
    return CardService.newNotification()
      .setText(message);
  }
  
  export function createTextParagraph(text: string): GoogleAppsScript.Card_Service.TextParagraph {
    return CardService.newTextParagraph()
      .setText(text);
  }
  
  export function createDecoratedText(
    text: string,
    bottomLabel?: string,
    icon?: GoogleAppsScript.Card_Service.Icon
  ): GoogleAppsScript.Card_Service.DecoratedText {
    const decorated = CardService.newDecoratedText()
      .setText(text);
    
    if (bottomLabel) {
      decorated.setBottomLabel(bottomLabel);
    }
    
    if (icon) {
      decorated.setStartIcon(CardService.newIconImage().setIcon(icon));
    }
    
    return decorated;
  }
  
  export function showLoadingCard(message: string = 'Loading...'): GoogleAppsScript.Card_Service.Card {
    return createCard(
      createHeader(Config.APP_NAME),
      createSection(
        createTextParagraph(message)
      )
    );
  }
  
  export function showErrorCard(error: string): GoogleAppsScript.Card_Service.Card {
    return createCard(
      createHeader(Config.APP_NAME, 'Error'),
      createSection(
        createDecoratedText(
          error,
          'Please try again',
          CardService.Icon.NONE
        )
      )
    );
  }
}
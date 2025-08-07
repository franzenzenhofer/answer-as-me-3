/**
 * UI module for Answer As Me 3
 * CardService component builders for Gmail add-on
 */
namespace UI {
  // Cache common UI elements for SPEED
  let cachedImageStyle: GoogleAppsScript.Card_Service.ImageStyle | null = null;
  let cachedButtonStyle: GoogleAppsScript.Card_Service.TextButtonStyle | null = null;
  let cachedDropdowns = new Map<string, GoogleAppsScript.Card_Service.SelectionInput>();
  /**
   * Create card header with icon
   */
  export function createHeader(title: string, subtitle?: string): GoogleAppsScript.Card_Service.CardHeader {
    // FAST: Cache image style
    if (!cachedImageStyle) {
      cachedImageStyle = CardService.ImageStyle.CIRCLE;
    }
    
    const header = CardService.newCardHeader()
      .setTitle(title)
      .setImageUrl(Config.ICON_URL)
      .setImageStyle(cachedImageStyle);
    
    if (subtitle) {
      header.setSubtitle(subtitle);
    }
    
    return header;
  }
  
  /**
   * Create text input field
   */
  export function createTextInput(
    fieldName: string,
    title: string,
    value?: string,
    hint?: string
  ): GoogleAppsScript.Card_Service.TextInput {
    const input = CardService.newTextInput()
      .setFieldName(fieldName)
      .setTitle(title);
    
    if (value) {
      input.setValue(value);
    }
    
    if (hint) {
      input.setHint(hint);
    }
    
    return input;
  }
  
  /**
   * Create dropdown selection
   */
  export function createDropdown<T extends string>(
    fieldName: string,
    title: string,
    options: readonly T[],
    selected?: T
  ): GoogleAppsScript.Card_Service.SelectionInput {
    const dropdown = CardService.newSelectionInput()
      .setFieldName(fieldName)
      .setTitle(title)
      .setType(CardService.SelectionInputType.DROPDOWN);
    
    options.forEach(option => {
      dropdown.addItem(option, option, option === selected);
    });
    
    return dropdown;
  }
  
  /**
   * Create text button
   */
  export function createButton(
    text: string,
    actionFunction: string,
    parameters?: Record<string, string>,
    style?: GoogleAppsScript.Card_Service.TextButtonStyle
  ): GoogleAppsScript.Card_Service.TextButton {
    const action = CardService.newAction()
      .setFunctionName(actionFunction);
    
    if (parameters) {
      action.setParameters(parameters);
    }
    
    const button = CardService.newTextButton()
      .setText(text)
      .setOnClickAction(action);
    
    if (style) {
      button.setTextButtonStyle(style);
    }
    
    return button;
  }
  
  /**
   * Create button set
   */
  export function createButtonSet(
    buttons: GoogleAppsScript.Card_Service.TextButton[]
  ): GoogleAppsScript.Card_Service.ButtonSet {
    const buttonSet = CardService.newButtonSet();
    buttons.forEach(button => buttonSet.addButton(button));
    return buttonSet;
  }
  
  /**
   * Create open link button
   */
  export function createOpenLinkButton(
    text: string,
    url: string
  ): GoogleAppsScript.Card_Service.TextButton {
    return CardService.newTextButton()
      .setText(text)
      .setOpenLink(CardService.newOpenLink()
        .setUrl(url)
        .setOpenAs(CardService.OpenAs.FULL_SIZE));
  }
  
  /**
   * Create text paragraph
   */
  export function createTextParagraph(
    text: string
  ): GoogleAppsScript.Card_Service.TextParagraph {
    return CardService.newTextParagraph().setText(text);
  }
  
  /**
   * Create key value widget
   */
  export function createKeyValue(
    topLabel: string,
    content: string
  ): GoogleAppsScript.Card_Service.KeyValue {
    return CardService.newKeyValue()
      .setTopLabel(topLabel)
      .setContent(content);
  }
  
  /**
   * Create decorated text with icon
   */
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
  
  /**
   * Create card section
   */
  export function createSection(
    ...widgets: GoogleAppsScript.Card_Service.Widget[]
  ): GoogleAppsScript.Card_Service.CardSection {
    const section = CardService.newCardSection();
    widgets.forEach(widget => section.addWidget(widget));
    return section;
  }
  
  /**
   * Create card section with header
   */
  export function createSectionWithHeader(
    header: string,
    ...widgets: GoogleAppsScript.Card_Service.Widget[]
  ): GoogleAppsScript.Card_Service.CardSection {
    const section = CardService.newCardSection()
      .setHeader(header);
    widgets.forEach(widget => section.addWidget(widget));
    return section;
  }
  
  /**
   * Create notification
   */
  export function createNotification(text: string): GoogleAppsScript.Card_Service.Notification {
    return CardService.newNotification().setText(text);
  }
  
  /**
   * Create card
   */
  export function createCard(
    header: GoogleAppsScript.Card_Service.CardHeader,
    ...sections: GoogleAppsScript.Card_Service.CardSection[]
  ): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder()
      .setHeader(header);
    
    sections.forEach(section => card.addSection(section));
    
    return card.build();
  }
  
  /**
   * Create action response with notification
   */
  export function createActionResponse(
    notification: GoogleAppsScript.Card_Service.Notification,
    navigation?: GoogleAppsScript.Card_Service.Navigation
  ): GoogleAppsScript.Card_Service.ActionResponse {
    const builder = CardService.newActionResponseBuilder()
      .setNotification(notification);
    
    if (navigation) {
      builder.setNavigation(navigation);
    }
    
    return builder.build();
  }
  
  /**
   * Create navigation to update card
   */
  export function createUpdateNavigation(
    card: GoogleAppsScript.Card_Service.Card
  ): GoogleAppsScript.Card_Service.Navigation {
    return CardService.newNavigation().updateCard(card);
  }
  
  /**
   * Create navigation to push card
   */
  export function createPushNavigation(
    card: GoogleAppsScript.Card_Service.Card
  ): GoogleAppsScript.Card_Service.Navigation {
    return CardService.newNavigation().pushCard(card);
  }
}
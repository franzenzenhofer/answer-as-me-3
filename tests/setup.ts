/**
 * Jest setup file for mocking Google Apps Script globals
 */

// Mock Google Apps Script globals
(global as any).PropertiesService = {
  getUserProperties: jest.fn(() => ({
    getProperty: jest.fn(),
    setProperty: jest.fn(),
    deleteProperty: jest.fn(),
    getProperties: jest.fn(() => ({}))
  })),
  getScriptProperties: jest.fn(() => ({
    getProperty: jest.fn(),
    setProperty: jest.fn(),
    deleteProperty: jest.fn(),
    getProperties: jest.fn(() => ({}))
  }))
} as any;

(global as any).CardService = {
  newCardBuilder: jest.fn(() => ({
    setHeader: jest.fn().mockReturnThis(),
    addSection: jest.fn().mockReturnThis(),
    build: jest.fn(() => ({}))
  })),
  newCardHeader: jest.fn(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setSubtitle: jest.fn().mockReturnThis()
  })),
  newCardSection: jest.fn(() => ({
    addWidget: jest.fn().mockReturnThis()
  })),
  newTextInput: jest.fn(() => ({
    setFieldName: jest.fn().mockReturnThis(),
    setTitle: jest.fn().mockReturnThis(),
    setHint: jest.fn().mockReturnThis(),
    setValue: jest.fn().mockReturnThis()
  })),
  newTextButton: jest.fn(() => ({
    setText: jest.fn().mockReturnThis(),
    setOnClickAction: jest.fn().mockReturnThis()
  })),
  newAction: jest.fn(() => ({
    setFunctionName: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis()
  })),
  newNotification: jest.fn(() => ({
    setText: jest.fn().mockReturnThis()
  })),
  newTextParagraph: jest.fn(() => ({
    setText: jest.fn().mockReturnThis()
  })),
  newDecoratedText: jest.fn(() => ({
    setText: jest.fn().mockReturnThis(),
    setBottomLabel: jest.fn().mockReturnThis(),
    setStartIcon: jest.fn().mockReturnThis()
  })),
  newIconImage: jest.fn(() => ({
    setIcon: jest.fn().mockReturnThis()
  })),
  newActionResponseBuilder: jest.fn(() => ({
    setNotification: jest.fn().mockReturnThis(),
    setNavigation: jest.fn().mockReturnThis(),
    build: jest.fn(() => ({}))
  })),
  newNavigation: jest.fn(() => ({
    updateCard: jest.fn().mockReturnThis()
  })),
  newUniversalActionResponseBuilder: jest.fn(() => ({
    displayAddOnCards: jest.fn().mockReturnThis(),
    build: jest.fn(() => ({}))
  })),
  Icon: {
    STAR: 'STAR',
    ERROR: 'ERROR'
  }
} as any;

// Mock console methods
(global as any).console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
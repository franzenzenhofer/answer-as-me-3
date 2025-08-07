# Architecture - Answer As Me 3

## Overview

Answer As Me 3 is a Gmail add-on that generates AI-powered email replies using Google's Gemini API. The architecture follows a modular TypeScript approach with strict separation of concerns.

## Module Structure

```
src/modules/
├── config.ts        # Config namespace - all configuration constants
├── types.ts         # Types namespace - TypeScript type definitions
├── utils.ts         # Utils namespace - utility functions
├── validation.ts    # Validation namespace - input validation
├── template.ts      # Template namespace - template variable replacement
├── email.ts         # Email namespace - email parsing and recipient logic
├── gmail.ts         # Gmail namespace - Gmail API interactions
├── gemini.ts        # Gemini namespace - Gemini API integration
├── document.ts      # Document namespace - Google Docs operations
├── drive.ts         # Drive namespace - Google Drive operations
├── sheets.ts        # Sheets namespace - Google Sheets logging
├── logger.ts        # AppLogger namespace - structured logging with Sheet integration
├── state.ts         # State namespace - PropertiesService persistence
├── ui.ts            # UI namespace - CardService UI components
└── error-handler.ts # ErrorHandler namespace - comprehensive error handling
```

## Module Responsibilities

### Core Modules

#### config.ts
- All configuration constants
- API endpoints and URLs
- Property keys for storage
- Default values
- Response schemas

#### types.ts
- TypeScript interfaces
- Type definitions
- Type guards
- Enums and constants types

#### utils.ts
- Date formatting
- JSON parsing/stringifying
- String utilities
- Array operations
- Property access helpers

#### validation.ts
- Input validation
- Schema validation
- Type checking
- Requirement validation
- Form data extraction

#### template.ts
- Template variable replacement
- Prompt text generation
- Variable substitution

### Email Modules

#### email.ts
- Email address extraction
- Recipient computation (To, Cc)
- Subject line formatting
- Email list parsing
- Alias management

#### gmail.ts
- Gmail API wrapper
- Thread operations
- Message operations
- Access token management
- Draft creation

#### gemini.ts
- Gemini API calls
- Response parsing
- Retry logic
- Error handling
- JSON extraction

### Storage Modules

#### document.ts
- Prompt document creation
- Document reading
- Template management
- Document validation

#### drive.ts
- Logs folder management
- File creation
- JSON file storage
- Folder operations

#### sheets.ts
- Daily log sheet creation
- Log entry writing
- Sheet formatting
- Header management

### UI & State Modules

#### ui.ts
- Card builders
- Form inputs
- Buttons and actions
- Notifications
- Navigation

#### state.ts
- User properties
- Settings persistence
- State management
- Cache handling

#### logger.ts
- Structured logging
- Sheet integration
- Log formatting
- Performance tracking

#### error-handler.ts
- Error wrapping
- User-friendly messages
- Error logging
- Recovery strategies

## Data Flow

1. **Entry Points** (Code.ts)
   - onHomepage, onSettings, onGmailMessage
   - Event handlers receive Gmail context

2. **Validation Layer**
   - Validate requirements
   - Check permissions
   - Validate inputs

3. **Business Logic**
   - Parse email thread
   - Compute recipients
   - Generate prompt

4. **API Integration**
   - Call Gemini API
   - Parse response
   - Validate output

5. **UI Response**
   - Build preview card
   - Show notifications
   - Handle navigation

## Dependency Graph

```
Code.ts
├── Config
├── Types
├── Utils
├── Validation
├── ErrorHandler
├── UI
├── State
├── AppLogger
├── Email
├── Gmail
├── Gemini
├── Document
├── Drive
└── Sheets
```

## Build Process

1. TypeScript compilation to CommonJS
2. Namespace extraction
3. Dependency resolution
4. Module bundling in correct order
5. Single file output (Code.gs)

## Testing Strategy

- Unit tests for pure functions
- Integration tests for API calls
- Mock Google Apps Script globals
- Post-bundle validation
- Manual Gmail testing
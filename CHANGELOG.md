# Changelog

All notable changes to Answer As Me 3 will be documented in this file.

## [1.2.0] - 2025-01-07

### Added
- **Computer Science Excellence Features**
  - Formal contracts with preconditions, postconditions, and invariants
  - Bloom filter for efficient duplicate checking
  - LRU cache for API response caching  
  - Trie data structure for prompt prefix matching
  - Circuit breaker pattern for Gemini API resilience
  - Advanced algorithms module with optimized implementations

- **GAS Validation Tools**
  - Custom GAS linter (`gas-linter.ts`) for syntax validation
  - Bundle validator (`gas-bundle-validator.ts`) for pre-deployment checks
  - Comprehensive validation rules for GAS compatibility
  - Integration with build pipeline and deployment script

- **Build System Improvements**
  - TypeScript helper injection for ES5 compatibility
  - Clean deployment with .claspignore (only 2 files)
  - Enhanced bundle validation and size checks
  - Automated contract stripping for production

### Fixed
- `TypeError: __extends is not a function` - Added TypeScript helpers injection
- Source files being included in deployment - Added .claspignore
- Contract class instantiation issues - Changed to function-based approach
- ES2022 compatibility while maintaining GAS support

### Changed
- TypeScript target to ES5 for GAS compatibility (kept ES2022 lib)
- Enhanced error handling with contracts
- Improved state management with invariant checking
- Updated deployment script with GAS validation

### Documentation
- Added comprehensive GAS validation documentation
- Created troubleshooting guide for common issues
- Updated CLAUDE.md with current project status

## [1.1.0] - 2025-01-06

### Added
- Initial TypeScript modular architecture
- Namespace-based module system
- Comprehensive testing infrastructure
- Automated deployment pipeline

### Core Modules
- **config.ts** - Configuration constants
- **logger.ts** - Structured logging (AppLogger)
- **state.ts** - State management with persistence
- **ui.ts** - CardService UI builders
- **error-handler.ts** - Comprehensive error handling
- **email.ts** - Email processing utilities
- **gemini.ts** - Gemini API integration
- **generation.ts** - Email generation logic
- **validation.ts** - Input validation
- **template.ts** - Prompt templating
- **gmail.ts** - Gmail utilities
- **document.ts** - Google Docs integration
- **drive.ts** - Google Drive utilities
- **sheets.ts** - Google Sheets logging
- **utils.ts** - General utilities

### Features
- Gmail add-on with sidebar UI
- Gemini AI integration for email replies
- Multiple reply modes (Reply, Reply All, Forward)
- Tone selection (Professional, Friendly, etc.)
- Prompt customization via Google Docs
- Comprehensive logging to Google Sheets
- Settings persistence
- Error tracking and recovery

## [1.0.0] - 2025-01-05

### Initial Release
- Basic Gmail add-on structure
- TypeScript setup
- Module bundling system
- Deployment automation
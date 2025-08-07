# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Answer As Me 3** is a production-ready modular Google Apps Script Gmail add-on built with TypeScript. It's an AI-powered email assistant that generates contextual replies using Google's Gemini API.

## Development Philosophy

### Core Principles

#### MODULAR Architecture
- **One file per function**: Each module has a single responsibility
- **No monolithic files**: Split functionality across focused modules
- **Clear module boundaries**: Each module exports a namespace with related functions

#### SOLID Principles
- **Single Responsibility**: Each module handles one aspect (e.g., email parsing, API calls)
- **Open/Closed**: Modules are open for extension but closed for modification
- **Liskov Substitution**: Interfaces and types ensure proper substitution
- **Interface Segregation**: Small, focused interfaces over large ones
- **Dependency Inversion**: Depend on abstractions (types) not concretions

#### DRY (Don't Repeat Yourself)
- Shared logic extracted to utility modules
- Configuration centralized in Config namespace
- Reusable UI components in UI module

#### KISS (Keep It Simple, Stupid)
- Simple, readable code over clever solutions
- Clear naming conventions
- Minimal nesting and complexity

### Quality Standards

#### Bug-Free Development
- **100% Type Safety**: No `any` types without explicit reason
- **Comprehensive Testing**: Every module has corresponding tests
- **No Test Left Behind**: All functionality must be tested
- **Root Cause Analysis**: Fix the cause, not symptoms
- **Fail Fast**: Validate early and throw clear errors

#### Testing Requirements
- Write tests BEFORE or WITH implementation
- Test coverage must be 100% for new code
- Tests must be meaningful, not just for coverage
- Integration tests for module interactions
- Post-bundle validation for deployment

### Development Workflow

#### Atomic Commits
- One logical change per commit
- Commit after each module/test completion
- Use conventional commit messages
- Never commit broken code

#### Before Each Commit
1. Run `npm run lint` - must pass with 0 errors
2. Run `npm test` - all tests must pass
3. Run `npm run build` - must compile successfully
4. Verify no TypeScript errors or warnings

#### Deployment Process
- **CRITICAL**: Always use `npm run deploy` for production deployments!
- Never use `npm run push` directly
- Test in Gmail after deployment
- Document any issues found

### Root Cause Analysis

When bugs occur:
1. **Identify**: What exactly is broken?
2. **Reproduce**: Create minimal test case
3. **Analyze**: Why did it break? (ask "why" 5-7 times)
4. **Fix**: Address root cause, not symptoms
5. **Prevent**: Add tests to prevent recurrence
6. **Document**: Update relevant documentation

## Technical Details

For detailed architecture and module structure, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Architecture

### Modular TypeScript with Namespace Pattern
The project uses TypeScript namespaces (not ES modules) to maintain compatibility with Google Apps Script:
- Each module is compiled to a namespace (e.g., `Config`, `AppLogger`, `State`, `UI`, `ErrorHandler`)
- Dependencies are resolved at build time using topological sorting
- Single-file bundle output (`Code.gs`) required by GAS

### Module Structure
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

### Module Responsibilities

#### Core Modules
- **config.ts**: All configuration constants, API endpoints, property keys
- **types.ts**: TypeScript interfaces and type definitions
- **utils.ts**: Date formatting, JSON parsing, string utilities
- **validation.ts**: Input validation, schema validation
- **template.ts**: Template variable replacement

#### Email Modules
- **email.ts**: Email address extraction, recipient computation, subject formatting
- **gmail.ts**: Gmail API wrapper, thread/message operations
- **gemini.ts**: Gemini API calls, response parsing, retry logic

#### Storage Modules
- **document.ts**: Prompt document creation and reading
- **drive.ts**: Logs folder management, file creation
- **sheets.ts**: Daily log sheet creation and writing

#### UI & State Modules
- **ui.ts**: Card builders, form inputs, notifications
- **state.ts**: User properties, settings persistence
- **logger.ts**: Structured logging to sheets
- **error-handler.ts**: Error wrapping, user-friendly messages

### Build Pipeline
1. TypeScript compilation: `src/**/*.ts` → `dist/src/**/*.js`
2. Module bundling: Combines modules in dependency order → `dist/Code.gs`
3. Version injection: Replaces `__VERSION__` and `__DEPLOY_TIME__` placeholders
4. Deployment: Pushes single bundle to Google Apps Script

## Essential Commands

### Development
```bash
npm run build         # Full build: compile + bundle + validate
npm run watch         # Watch TypeScript files for changes
npm test              # Run Jest tests with GAS mocks
npm run lint          # TypeScript type checking (tsc --noEmit)
npm run check         # Full validation: lint + ESLint
```

### Deployment
```bash
npm run deploy        # Full deployment pipeline (minor version bump)
npm run deploy:major  # Major version deployment
npm run deploy:dry-run # Test deployment without pushing
```

### Testing
```bash
npm test              # Unit tests
npm run test:postbundle # Validate bundle structure
npm run test:comprehensive # All tests + code analysis
```

### Clasp Operations
```bash
npm run login         # Authenticate with Google
npm run push          # Push to Apps Script (build first)
npm run open          # Open in Apps Script editor
npm run logs          # View Apps Script logs
```

## Key Implementation Details

### Bundle Creation (`scripts/bundle.ts`)
- Analyzes module dependencies using AST parsing
- Performs topological sort for correct module order
- Extracts namespace content from compiled JavaScript
- Validates bundle syntax and required functions
- Supports tree shaking (currently disabled for .gs files)

### Deployment Process (`scripts/deploy.ts`)
1. Pre-deployment checks (lint, test, build)
2. Bundle validation (size, syntax, required functions)
3. Deployment header injection with version/timestamp
4. Clasp configuration in dist directory
5. Auto-cleanup of old deployments (keeps 40 most recent)
6. Push to Google Apps Script with version tracking
7. Post-deployment validation
8. GitHub push with tags

### State Management
- Uses PropertiesService for persistence
- Centralized state access through State namespace
- Immutable update pattern

### Error Handling
- Typed error categories
- User-friendly error messages
- Comprehensive logging
- Async wrapper functions (`ErrorHandler.wrapAsync`)

### UI Components
- Built with CardService API
- Reusable component builders in UI namespace
- Consistent styling and error states

## Critical Configuration

### Script ID
Located in `scripts/deploy.ts`:
```typescript
const SCRIPT_ID = '197HGcHZYyIkxSmoedQu9gixNURSmMi6_lqCsfsY3kYi4THzRCEl4nwi1';
```

### TypeScript Configuration
- Target: ES2022
- Module: CommonJS (for GAS compatibility)
- Strict mode enabled with all checks
- Namespace resolution for modules

### Version Management
- Version from package.json (e.g., "1.2.0")
- App version uses major.minor only (e.g., "1.2")
- Deploy time in Vienna timezone

## Common Issues & Solutions

### TypeScript Namespace Conflicts
- Solution: Rename namespaces (e.g., `Logger` → `AppLogger`)

### Bundle Too Small Error
- Indicates missing content in bundle
- Check module compilation and extraction

### Missing Functions in Bundle
- Verify all entry points are exported
- Check namespace extraction in bundle.ts

### Deployment Limit (50 deployments)
- Auto-cleanup runs during deployment
- Keeps 40 most recent deployments

## Testing Strategy

### Unit Tests
- Limited due to namespace architecture
- Mock Google Apps Script globals
- Focus on pure functions

### Post-Bundle Validation
- Validates bundle size (min 5KB)
- Checks required functions present
- Verifies namespace structure
- Syntax validation with Acorn parser

### Integration Testing
- Manual testing in Gmail required
- Test add-on appears in sidebar
- Verify all UI interactions work

## Development Workflow

1. Make changes to TypeScript modules
2. Run `npm run build` to compile and bundle
3. Run `npm test` to verify tests pass
4. Run `npm run deploy` for production deployment
5. Test in Gmail by opening an email and clicking the add-on

## Important Notes

- Always use `npm run deploy` for production deployments (not just `npm run push`)
- The bundle process removes CommonJS artifacts and reference tags
- Version placeholders are replaced at build time
- Deployment header is added by deploy.ts (not bundle.ts)
- All modules must be listed in CORE_MODULES array in bundle.ts
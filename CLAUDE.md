# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Answer As Me 3** is a production-ready modular Google Apps Script Gmail add-on built with TypeScript. It demonstrates best practices in architecture, deployment, and testing for GAS add-ons.

## Architecture

### Modular TypeScript with Namespace Pattern
The project uses TypeScript namespaces (not ES modules) to maintain compatibility with Google Apps Script:
- Each module is compiled to a namespace (e.g., `Config`, `AppLogger`, `State`, `UI`, `ErrorHandler`)
- Dependencies are resolved at build time using topological sorting
- Single-file bundle output (`Code.gs`) required by GAS

### Module Structure
```
src/modules/
├── config.ts      # Config namespace - configuration constants
├── logger.ts      # AppLogger namespace - structured logging
├── state.ts       # State namespace - PropertiesService persistence
├── ui.ts          # UI namespace - CardService component builders
└── error-handler.ts # ErrorHandler namespace - error handling
```

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
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Goal

**THE MAIN GOAL**: Create a production-ready modular Google Apps Script Gmail add-on with TypeScript, demonstrating best practices in architecture, deployment, and testing.

### Project Context

This is a "Hello World" Gmail add-on that showcases:
- Modular TypeScript architecture with proper separation of concerns
- State management with persistence
- Comprehensive error handling
- Modern build and deployment pipeline
- Testing infrastructure with Jest
- Single-file bundling for Google Apps Script

### Core Functionality

1. **User Interface**:
   - Homepage card with greeting functionality
   - Name input with persistence
   - Greeting counter tracking
   - Settings page with reset functionality

2. **Architecture**:
   - **Config Module**: Centralized configuration
   - **Logger Module**: Structured logging with levels
   - **State Module**: State management with PropertiesService persistence
   - **UI Module**: Reusable CardService component builders
   - **ErrorHandler Module**: Typed error handling with user-friendly messages

3. **Build Pipeline**:
   - TypeScript compilation with strict mode
   - Module bundling with dependency resolution
   - Single .gs file output
   - Version injection during build

4. **Deployment**:
   - Automated deployment script with dry-run mode
   - Version management and tagging
   - Automatic cleanup of old deployments
   - Post-deployment verification

## Development Commands

### Essential Commands
```bash
npm install          # Install dependencies
npm run build        # Build the project
npm test            # Run tests
npm run deploy      # Deploy to Google Apps Script
```

### Development Workflow
1. Make changes to TypeScript files in `src/`
2. Run `npm run build` to compile and bundle
3. Test locally with `npm test`
4. Deploy with `npm run deploy`

### Deployment Protocol

**ALWAYS RUN `npm run deploy` AFTER ANY CHANGES!**

The deployment process:
1. Runs all tests and linting
2. Creates optimized single-file bundle
3. Automatically cleans up old deployments
4. Deploys to Google Apps Script with versioning
5. Provides verification URLs and status

## Architecture Principles

### Modular Design
- Each module has a single responsibility
- Modules communicate through well-defined interfaces
- Dependencies are explicitly declared

### State Management
- Centralized state in State module
- Persistence using PropertiesService
- Immutable state updates

### Error Handling
- All errors go through ErrorHandler
- Typed error categories
- User-friendly error messages
- Comprehensive logging

### UI Components
- Reusable UI builders in UI module
- Consistent styling and behavior
- Type-safe component creation

## Testing Strategy

- Unit tests for each module
- Mocked Google Apps Script globals
- Coverage reporting
- Post-bundle validation

## Security Considerations

- No hardcoded credentials
- User properties for sensitive data
- Input validation
- Error messages don't expose internals

## Important Notes

1. **Single File Output**: The build process MUST produce a single Code.gs file
2. **Namespace Pattern**: Modules use TypeScript namespaces for organization
3. **Version Injection**: __VERSION__ and __DEPLOY_TIME__ are replaced during build
4. **Clasp Configuration**: Update scriptId in deploy.sh after creating project

## Future Enhancements

Consider adding:
- More sophisticated state management
- API integration examples
- Advanced UI patterns
- Performance monitoring
- A/B testing framework
# Answer As Me 3

A modular Hello World Google Apps Script Gmail add-on built with TypeScript.

## Recent Updates (v1.2.0)

- ✅ **Computer Science Excellence**: Formal contracts, advanced algorithms, circuit breaker pattern
- ✅ **GAS Validation Tools**: Custom linter and bundle validator for deployment safety  
- ✅ **Clean Deployment**: Only 2 files deployed (Code.gs + appsscript.json)
- ✅ **ES2022 Support**: Modern JavaScript features with GAS compatibility

See [CHANGELOG.md](CHANGELOG.md) for full details.

## Features

- **Modular TypeScript Architecture**: Clean separation of concerns with dedicated modules
- **State Management**: Persistent state using PropertiesService
- **Comprehensive Error Handling**: Typed errors with user-friendly messages
- **Modern Build Pipeline**: TypeScript → JavaScript → Single .gs bundle
- **Automated Deployment**: Single command deployment with version management
- **Testing Infrastructure**: Jest tests with Google Apps Script mocks
- **CI/CD Pipeline**: GitHub Actions for automated testing and builds
- **GAS Validation**: Custom linting and bundle validation tools

## Architecture

The project follows a modular architecture with these core modules:

- **Config**: Application configuration and constants
- **Logger**: Structured logging with log levels
- **State**: State management with persistence
- **UI**: CardService UI component builders
- **ErrorHandler**: Comprehensive error handling
- **Contracts**: Formal verification with pre/post conditions
- **Algorithms**: Advanced data structures (Bloom filter, LRU, Trie)
- **CS Utils**: Circuit breaker and other patterns

## Configuration

- App Name: Answer As Me 3
- Default Greeting: Hello World
- Timezone: Europe/Vienna

## Quick Start

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Set up clasp:
   ```bash
   npm run login
   npm run create
   ```
5. Deploy:
   ```bash
   npm run deploy
   ```

## Development

### Available Scripts

- `npm run build` - Compile TypeScript and create bundle
- `npm run watch` - Watch mode for development
- `npm test` - Run tests
- `npm run lint` - Run linting
- `npm run deploy` - Full deployment with version bump
- `npm run push` - Push changes to Apps Script
- `npm run open` - Open in Apps Script editor
- `npm run logs` - View Apps Script logs

### Project Structure

```
answer-as-me-3/
├── src/
│   ├── modules/         # TypeScript modules
│   │   ├── config.ts    # Configuration
│   │   ├── logger.ts    # Logging
│   │   ├── state.ts     # State management
│   │   ├── ui.ts        # UI components
│   │   └── error-handler.ts # Error handling
│   ├── Code.ts          # Main entry point
│   └── appsscript.json  # Apps Script manifest
├── tests/               # Test files
├── dist/                # Build output (gitignored)
├── bundle.js            # Bundle script
├── deploy.sh            # Deployment script
└── package.json         # Project config
```

### Deployment Process

The deployment process is fully automated:

1. **Pre-deployment checks**: Linting, tests, build
2. **Bundle creation**: Combines all modules into single Code.gs
3. **Version management**: Automatic version bumping
4. **Deployment**: Push to Google Apps Script with auto-cleanup
5. **Verification**: Post-deployment validation

### Testing

Tests are written using Jest with mocked Google Apps Script globals:

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Production Deployment

For production deployment:

```bash
npm run deploy        # Minor version bump
npm run deploy:major  # Major version bump
```

The deployment script includes:
- Dry-run mode: `./deploy.sh --dry-run`
- Automatic old deployment cleanup
- Comprehensive verification
- Single-file bundle guarantee

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT
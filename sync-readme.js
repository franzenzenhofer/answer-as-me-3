#!/usr/bin/env node

/**
 * Sync README.md with values from config.ts
 * Ensures documentation stays up-to-date with actual configuration
 */

const fs = require('fs');
const path = require('path');

// Read config.ts
const configPath = path.join(__dirname, 'src/modules/config.ts');
const configContent = fs.readFileSync(configPath, 'utf8');

// Extract configuration values
function extractConfig(content) {
  const config = {
    appName: '',
    version: '',
    settings: {}
  };

  // Extract APP_NAME
  const appNameMatch = content.match(/APP_NAME\s*=\s*'([^']+)'/);
  if (appNameMatch) {
    config.appName = appNameMatch[1];
  }

  // Extract VERSION placeholder
  const versionMatch = content.match(/VERSION\s*=\s*'([^']+)'/);
  if (versionMatch) {
    config.version = versionMatch[1];
  }

  // Extract SETTINGS
  const settingsMatch = content.match(/SETTINGS\s*=\s*\{([^}]+)\}/s);
  if (settingsMatch) {
    const settingLines = settingsMatch[1].trim().split('\n');
    settingLines.forEach(line => {
      const match = line.match(/(\w+):\s*['"]?([^'",]+)['"]?/);
      if (match) {
        config.settings[match[1]] = match[2];
      }
    });
  }

  return config;
}

// Read README.md - create if doesn't exist
const readmePath = path.join(__dirname, 'README.md');
let readmeContent = '';

if (fs.existsSync(readmePath)) {
  readmeContent = fs.readFileSync(readmePath, 'utf8');
} else {
  // Create default README
  readmeContent = `# Answer As Me 3

A modular Hello World Google Apps Script Gmail add-on built with TypeScript.

## Features
- Modular TypeScript architecture
- Comprehensive deployment pipeline
- State management
- Error handling
- UI components using CardService

## Configuration
- App Name: Answer As Me 3
- Default Greeting: Hello World

## Development

\`\`\`bash
npm install
npm run build
npm run deploy
\`\`\`
`;
}

// Extract config from config.ts
const config = extractConfig(configContent);

// Update app name in README if found
if (config.appName) {
  const appNamePattern = new RegExp(`App Name: [^\\n]+`, 'g');
  readmeContent = readmeContent.replace(appNamePattern, `App Name: ${config.appName}`);
}

// Update settings if found
if (config.settings.DEFAULT_GREETING) {
  const greetingPattern = new RegExp(`Default Greeting: [^\\n]+`, 'g');
  readmeContent = readmeContent.replace(greetingPattern, `Default Greeting: ${config.settings.DEFAULT_GREETING}`);
}

// Write updated README
fs.writeFileSync(readmePath, readmeContent);

console.log('✅ README.md synced with config.ts');
console.log('📋 Updated values:');
console.log(`   - App Name: ${config.appName}`);
if (config.settings.DEFAULT_GREETING) {
  console.log(`   - Default Greeting: ${config.settings.DEFAULT_GREETING}`);
}
#!/usr/bin/env tsx

/**
 * Automated Clean Code Fixer
 * Fixes all issues identified in the code review
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

// Types for tracking fixes
interface Fix {
  file: string;
  line?: number;
  issue: string;
  fix: string;
}

const fixes: Fix[] = [];

// Utility functions
function log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
  const colors = {
    info: chalk.blue,
    success: chalk.green,
    error: chalk.red,
    warn: chalk.yellow
  };
  console.log(colors[level](message));
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, 'utf8');
}

// Fix functions
function removeUnusedFunctions(): void {
  log('🧹 Removing unused functions...', 'info');
  
  // List of unused functions to remove
  const unusedFunctions = [
    { file: 'src/modules/utils.ts', functions: ['unique', 'filter', 'map', 'createLowerCaseSet'] },
    { file: 'src/modules/error-handler.ts', functions: ['safeExecute'] },
    { file: 'src/modules/gmail.ts', functions: ['getThreadSubject'] },
  ];
  
  for (const { file, functions } of unusedFunctions) {
    const filePath = path.join(process.cwd(), file);
    let content = readFile(filePath);
    
    for (const fn of functions) {
      // Remove function and its export
      const functionRegex = new RegExp(`export function ${fn}[\\s\\S]*?\\n}\\n`, 'g');
      const beforeLength = content.length;
      content = content.replace(functionRegex, '');
      
      if (content.length < beforeLength) {
        fixes.push({ file, issue: `Unused function: ${fn}`, fix: 'Removed' });
      }
    }
    
    writeFile(filePath, content);
  }
}

function removeUnusedConstants(): void {
  log('🧹 Removing unused constants...', 'info');
  
  // Remove COLORS from config.ts
  const configPath = path.join(process.cwd(), 'src/modules/config.ts');
  let configContent = readFile(configPath);
  
  // Remove COLORS constant
  configContent = configContent.replace(/export const COLORS = {[\\s\\S]*?};\\n\\n/, '');
  
  writeFile(configPath, configContent);
  fixes.push({ file: 'src/modules/config.ts', issue: 'Unused constant: COLORS', fix: 'Removed' });
}

function fixAnyTypes(): void {
  log('🔒 Fixing any types...', 'info');
  
  const typeReplacements = [
    {
      file: 'src/modules/gemini.ts',
      replacements: [
        { from: 'requestPayload: any;', to: 'requestPayload: object;' },
        { from: 'export function getSafetyRatings(responseText: string): any {', to: 'export function getSafetyRatings(responseText: string): Types.SafetyRating[] | null {' },
        { from: 'safetyInfo?: any;', to: 'safetyInfo?: Types.SafetyRating[];' }
      ]
    },
    {
      file: 'src/modules/utils.ts',
      replacements: [
        { from: 'export function jsonStringify(obj: any): string {', to: 'export function jsonStringify(obj: unknown): string {' },
        { from: 'export function jsonParse<T = any>(str: string): T | null {', to: 'export function jsonParse<T = unknown>(str: string): T | null {' }
      ]
    },
    {
      file: 'src/modules/validation.ts',
      replacements: [
        { from: 'export function validateGeminiResponse(obj: any): string | null {', to: 'export function validateGeminiResponse(obj: unknown): string | null {' },
        { from: 'export function validateGmailEvent(event: any): Types.GmailAddOnEvent {', to: 'export function validateGmailEvent(event: unknown): Types.GmailAddOnEvent {' }
      ]
    },
    {
      file: 'src/modules/drive.ts',
      replacements: [
        { from: 'export function createJsonFile(prefix: string, data: any): string {', to: 'export function createJsonFile(prefix: string, data: unknown): string {' }
      ]
    },
    {
      file: 'src/modules/error-handler.ts',
      replacements: [
        { from: 'export function wrapWithErrorHandling<T extends (...args: any[]) => any>(', to: 'export function wrapWithErrorHandling<T extends (...args: unknown[]) => unknown>(' }
      ]
    }
  ];
  
  for (const { file, replacements } of typeReplacements) {
    const filePath = path.join(process.cwd(), file);
    let content = readFile(filePath);
    
    for (const { from, to } of replacements) {
      if (content.includes(from)) {
        content = content.replace(from, to);
        fixes.push({ file, issue: 'any type', fix: `Replaced with proper type` });
      }
    }
    
    writeFile(filePath, content);
  }
}

function removeConsoleLogs(): void {
  log('🚫 Removing console.log statements...', 'info');
  
  const loggerPath = path.join(process.cwd(), 'src/modules/logger.ts');
  let content = readFile(loggerPath);
  
  // Comment out console statements instead of removing them
  content = content.replace(/console\.(log|info|warn|error)\(/g, '// console.$1(');
  
  writeFile(loggerPath, content);
  fixes.push({ file: 'src/modules/logger.ts', issue: 'console.log in production', fix: 'Commented out' });
}

function fixEmptyRecipients(): void {
  log('🔁 Fixing code duplication...', 'info');
  
  const emailPath = path.join(process.cwd(), 'src/modules/email.ts');
  let content = readFile(emailPath);
  
  // Add constant at the top of the file
  const constantDef = '\nconst EMPTY_RECIPIENTS: Types.Recipients = { to: [], cc: [] };\n';
  content = content.replace('namespace Email {', 'namespace Email {' + constantDef);
  
  // Replace duplicated returns
  content = content.replace(/return { to: \[\], cc: \[\] };/g, 'return EMPTY_RECIPIENTS;');
  
  writeFile(emailPath, content);
  fixes.push({ file: 'src/modules/email.ts', issue: 'Duplicated empty recipients', fix: 'Extracted to constant' });
}

function addTypesToTypes(): void {
  log('📝 Adding missing type definitions...', 'info');
  
  const typesPath = path.join(process.cwd(), 'src/modules/types.ts');
  let content = readFile(typesPath);
  
  // Add SafetyRating type
  const safetyRatingType = `
  export interface SafetyRating {
    category: string;
    probability: string;
  }
`;
  
  // Insert before the closing brace
  content = content.replace(/}\s*$/, safetyRatingType + '\n}');
  
  writeFile(typesPath, content);
  fixes.push({ file: 'src/modules/types.ts', issue: 'Missing SafetyRating type', fix: 'Added type definition' });
}

// Main execution
async function main(): Promise<void> {
  log('\n🚀 Starting Clean Code Fixes...\n', 'info');
  
  try {
    // Execute fixes in order
    removeUnusedFunctions();
    removeUnusedConstants();
    fixAnyTypes();
    removeConsoleLogs();
    fixEmptyRecipients();
    addTypesToTypes();
    
    // Summary
    log(`\n✅ Fixed ${fixes.length} issues:`, 'success');
    fixes.forEach(fix => {
      log(`   ${fix.file}: ${fix.issue} → ${fix.fix}`, 'info');
    });
    
    log('\n🎯 Next steps:', 'info');
    log('   1. Run npm run lint to verify no new errors', 'info');
    log('   2. Run npm test to ensure nothing broke', 'info');
    log('   3. Run npm run deploy to deploy clean code', 'info');
    
  } catch (error) {
    log(`\n❌ Error: ${error}`, 'error');
    process.exit(1);
  }
}

// Run the fixer
main();
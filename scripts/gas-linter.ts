#!/usr/bin/env tsx

/**
 * Google Apps Script (.gs) Linter
 * Validates GAS-specific syntax, globals, and best practices
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseAST } from 'acorn';
import chalk from 'chalk';

interface LintError {
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
}

interface LintResult {
  file: string;
  errors: LintError[];
  warnings: LintError[];
  info: LintError[];
}

// GAS Global objects that should be recognized
const GAS_GLOBALS = new Set([
  // Core Services
  'PropertiesService', 'ScriptApp', 'Session', 'Utilities', 'UrlFetchApp',
  'CacheService', 'LockService', 'HtmlService', 'ContentService',
  
  // Google Workspace Services
  'SpreadsheetApp', 'DocumentApp', 'FormApp', 'SlidesApp', 'DriveApp',
  'GmailApp', 'CalendarApp', 'GroupsApp', 'ContactsApp', 'SitesApp',
  
  // Card Service (for Add-ons)
  'CardService',
  
  // Advanced Services (when enabled)
  'Drive', 'Gmail', 'Calendar', 'Sheets', 'Docs', 'Forms', 'Slides',
  'AdminDirectory', 'AdminReports', 'Analytics', 'BigQuery', 'Classroom',
  
  // Triggers
  'ScriptApp',
  
  // Browser-like globals
  'console', 'Math', 'Date', 'JSON', 'RegExp', 'Array', 'Object',
  'String', 'Number', 'Boolean', 'Error', 'Promise', 'Set', 'Map'
]);

// GAS-specific rules
const RULES = {
  // Syntax rules
  NO_ES6_MODULES: 'no-es6-modules',
  NO_ASYNC_AWAIT: 'no-async-await',
  NO_CLASS_FIELDS: 'no-class-fields',
  NO_OPTIONAL_CHAINING: 'no-optional-chaining',
  NO_NULLISH_COALESCING: 'no-nullish-coalescing',
  NO_BIGINT: 'no-bigint',
  
  // Best practices
  NO_UNDEFINED_GLOBALS: 'no-undefined-globals',
  VALID_FUNCTION_NAMES: 'valid-function-names',
  NO_REQUIRE: 'no-require',
  NO_EXPORTS: 'no-exports',
  TRIGGER_FUNCTION_NAMING: 'trigger-function-naming',
  
  // Performance
  BATCH_OPERATIONS: 'batch-operations',
  CACHE_USAGE: 'cache-usage',
  
  // Security
  NO_EVAL: 'no-eval',
  NO_SCRIPT_SRC: 'no-script-src',
  PROPERTY_ACCESS: 'property-access'
};

class GASLinter {
  private errors: LintError[] = [];
  private ast: any;
  private code: string;
  private lines: string[];
  private declaredGlobals = new Set<string>();
  private usedGlobals = new Set<string>();
  
  constructor(private options: { strict?: boolean; legacy?: boolean } = {}) {}
  
  lint(code: string, filename: string): LintResult {
    this.code = code;
    this.lines = code.split('\n');
    this.errors = [];
    this.declaredGlobals.clear();
    this.usedGlobals.clear();
    
    try {
      // Parse with ES2022 support for modern features
      this.ast = parseAST(code, {
        ecmaVersion: 2022,
        sourceType: 'script', // GAS doesn't support modules
        locations: true
      } as any);
      
      // Run all lint rules
      this.checkES6Modules();
      this.checkAsyncAwait();
      this.checkClassFields();
      this.checkModernSyntax();
      this.checkUndefinedGlobals();
      this.checkFunctionNames();
      this.checkTriggerFunctions();
      this.checkBatchOperations();
      this.checkSecurity();
      
    } catch (error: any) {
      this.addError(1, 0, 'error', `Parse error: ${error.message}`, 'parse-error');
    }
    
    // Categorize errors
    const errors = this.errors.filter(e => e.severity === 'error');
    const warnings = this.errors.filter(e => e.severity === 'warning');
    const info = this.errors.filter(e => e.severity === 'info');
    
    return {
      file: filename,
      errors,
      warnings,
      info
    };
  }
  
  private addError(line: number, column: number, severity: LintError['severity'], message: string, rule: string) {
    this.errors.push({ line, column, severity, message, rule });
  }
  
  private checkES6Modules() {
    this.walk(this.ast, (node: any) => {
      if (node.type === 'ImportDeclaration' || node.type === 'ExportDeclaration' || 
          node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
        this.addError(
          node.loc.start.line,
          node.loc.start.column,
          'error',
          'ES6 modules (import/export) are not supported in Google Apps Script',
          RULES.NO_ES6_MODULES
        );
      }
    });
  }
  
  private checkAsyncAwait() {
    this.walk(this.ast, (node: any) => {
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || 
          node.type === 'ArrowFunctionExpression') {
        if (node.async) {
          this.addError(
            node.loc.start.line,
            node.loc.start.column,
            'error',
            'async/await is not supported in Google Apps Script',
            RULES.NO_ASYNC_AWAIT
          );
        }
      }
      
      if (node.type === 'AwaitExpression') {
        this.addError(
          node.loc.start.line,
          node.loc.start.column,
          'error',
          'await is not supported in Google Apps Script',
          RULES.NO_ASYNC_AWAIT
        );
      }
    });
  }
  
  private checkClassFields() {
    this.walk(this.ast, (node: any) => {
      if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        node.body.body.forEach((member: any) => {
          if (member.type === 'PropertyDefinition') {
            this.addError(
              member.loc.start.line,
              member.loc.start.column,
              'error',
              'Class fields are not supported in Google Apps Script. Use constructor initialization instead.',
              RULES.NO_CLASS_FIELDS
            );
          }
        });
      }
    });
  }
  
  private checkModernSyntax() {
    this.walk(this.ast, (node: any) => {
      // Optional chaining
      if (node.type === 'ChainExpression') {
        this.addError(
          node.loc.start.line,
          node.loc.start.column,
          'error',
          'Optional chaining (?.) is not supported in Google Apps Script',
          RULES.NO_OPTIONAL_CHAINING
        );
      }
      
      // Nullish coalescing
      if (node.type === 'LogicalExpression' && node.operator === '??') {
        this.addError(
          node.loc.start.line,
          node.loc.start.column,
          'error',
          'Nullish coalescing (??) is not supported in Google Apps Script',
          RULES.NO_NULLISH_COALESCING
        );
      }
      
      // BigInt
      if (node.type === 'Literal' && typeof node.value === 'bigint') {
        this.addError(
          node.loc.start.line,
          node.loc.start.column,
          'error',
          'BigInt is not supported in Google Apps Script',
          RULES.NO_BIGINT
        );
      }
    });
  }
  
  private checkUndefinedGlobals() {
    // First pass: collect all declarations
    this.walk(this.ast, (node: any) => {
      if (node.type === 'FunctionDeclaration' && node.id) {
        this.declaredGlobals.add(node.id.name);
      }
      if (node.type === 'VariableDeclarator' && node.id && node.id.type === 'Identifier') {
        this.declaredGlobals.add(node.id.name);
      }
    });
    
    // Second pass: check usage
    this.walk(this.ast, (node: any) => {
      if (node.type === 'Identifier' && !this.isDeclaration(node)) {
        const name = node.name;
        if (!this.declaredGlobals.has(name) && !GAS_GLOBALS.has(name)) {
          // Check if it's a property access (e.g., Config.VALUE)
          const parent = this.getParent(node);
          if (!parent || parent.type !== 'MemberExpression' || parent.object !== node) {
            this.addError(
              node.loc.start.line,
              node.loc.start.column,
              'warning',
              `'${name}' is not defined. If this is a global from another file, consider adding a comment.`,
              RULES.NO_UNDEFINED_GLOBALS
            );
          }
        }
      }
    });
  }
  
  private checkFunctionNames() {
    this.walk(this.ast, (node: any) => {
      if (node.type === 'FunctionDeclaration' && node.id) {
        const name = node.id.name;
        
        // Check for reserved function names
        if (name === 'require' || name === 'exports' || name === 'module') {
          this.addError(
            node.loc.start.line,
            node.loc.start.column,
            'error',
            `Function name '${name}' is reserved and may cause issues`,
            RULES.VALID_FUNCTION_NAMES
          );
        }
        
        // Check naming conventions
        if (name.startsWith('_') && !name.startsWith('__')) {
          this.addError(
            node.loc.start.line,
            node.loc.start.column,
            'info',
            `Function '${name}' starts with underscore. In GAS, this doesn't make it private.`,
            RULES.VALID_FUNCTION_NAMES
          );
        }
      }
    });
  }
  
  private checkTriggerFunctions() {
    const triggerPatterns = [
      { pattern: /^on[A-Z]/, type: 'Event trigger' },
      { pattern: /^doGet$/, type: 'Web app GET' },
      { pattern: /^doPost$/, type: 'Web app POST' },
      { pattern: /^onOpen$/, type: 'Simple trigger' },
      { pattern: /^onEdit$/, type: 'Simple trigger' },
      { pattern: /^onInstall$/, type: 'Simple trigger' },
      { pattern: /^onSelectionChange$/, type: 'Simple trigger' }
    ];
    
    this.walk(this.ast, (node: any) => {
      if (node.type === 'FunctionDeclaration' && node.id) {
        const name = node.id.name;
        
        triggerPatterns.forEach(({ pattern, type }) => {
          if (pattern.test(name)) {
            // Check if it has the correct signature
            if (type === 'Simple trigger' && node.params.length > 1) {
              this.addError(
                node.loc.start.line,
                node.loc.start.column,
                'warning',
                `${type} function '${name}' should have at most one parameter (event)`,
                RULES.TRIGGER_FUNCTION_NAMING
              );
            }
          }
        });
      }
    });
  }
  
  private checkBatchOperations() {
    // Look for patterns that suggest inefficient operations
    this.walk(this.ast, (node: any) => {
      if (node.type === 'ForStatement' || node.type === 'WhileStatement' || 
          node.type === 'DoWhileStatement' || node.type === 'ForOfStatement') {
        
        // Check for getValue/setValue in loops
        this.walk(node.body, (innerNode: any) => {
          if (innerNode.type === 'CallExpression' && 
              innerNode.callee.type === 'MemberExpression') {
            const method = innerNode.callee.property.name;
            
            if (['getValue', 'setValue', 'getRange', 'appendRow'].includes(method)) {
              this.addError(
                innerNode.loc.start.line,
                innerNode.loc.start.column,
                'warning',
                `Calling '${method}' inside a loop is inefficient. Consider batch operations.`,
                RULES.BATCH_OPERATIONS
              );
            }
          }
        });
      }
    });
  }
  
  private checkSecurity() {
    this.walk(this.ast, (node: any) => {
      // Check for eval
      if (node.type === 'CallExpression' && 
          node.callee.type === 'Identifier' && 
          node.callee.name === 'eval') {
        this.addError(
          node.loc.start.line,
          node.loc.start.column,
          'error',
          'eval() is dangerous and should not be used',
          RULES.NO_EVAL
        );
      }
      
      // Check for script properties without proper access
      if (node.type === 'CallExpression' && 
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'PropertiesService') {
        const method = node.callee.property.name;
        
        if (method === 'getScriptProperties' && !this.options.legacy) {
          this.addError(
            node.loc.start.line,
            node.loc.start.column,
            'info',
            'Consider using getUserProperties() for user-specific data',
            RULES.PROPERTY_ACCESS
          );
        }
      }
    });
  }
  
  private walk(node: any, callback: (node: any) => void, parent?: any) {
    if (!node) return;
    
    node._parent = parent;
    callback(node);
    
    for (const key in node) {
      if (key === '_parent' || key === 'loc' || key === 'start' || key === 'end') continue;
      
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(item => this.walk(item, callback, node));
      } else if (child && typeof child === 'object' && child.type) {
        this.walk(child, callback, node);
      }
    }
  }
  
  private getParent(node: any): any {
    return node._parent;
  }
  
  private isDeclaration(node: any): boolean {
    const parent = this.getParent(node);
    if (!parent) return false;
    
    return (
      (parent.type === 'FunctionDeclaration' && parent.id === node) ||
      (parent.type === 'VariableDeclarator' && parent.id === node) ||
      (parent.type === 'FunctionExpression' && parent.id === node) ||
      (parent.type === 'ClassDeclaration' && parent.id === node)
    );
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const files = args.filter(arg => !arg.startsWith('--'));
  const options = {
    strict: args.includes('--strict'),
    legacy: args.includes('--legacy'),
    fix: args.includes('--fix')
  };
  
  if (files.length === 0) {
    // Default to dist/Code.gs
    files.push(path.join(process.cwd(), 'dist', 'Code.gs'));
  }
  
  console.log(chalk.blue('🔍 GAS Linter - Google Apps Script Validator\n'));
  
  const linter = new GASLinter(options);
  let totalErrors = 0;
  let totalWarnings = 0;
  
  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.log(chalk.red(`❌ File not found: ${file}`));
      continue;
    }
    
    const code = fs.readFileSync(file, 'utf-8');
    const result = linter.lint(code, file);
    
    if (result.errors.length === 0 && result.warnings.length === 0 && result.info.length === 0) {
      console.log(chalk.green(`✅ ${file} - No issues found`));
    } else {
      console.log(chalk.yellow(`\n📋 ${file}`));
      
      // Display errors
      result.errors.forEach(error => {
        console.log(chalk.red(`  ❌ ${error.line}:${error.column} - ${error.message} (${error.rule})`));
      });
      
      // Display warnings
      result.warnings.forEach(warning => {
        console.log(chalk.yellow(`  ⚠️  ${warning.line}:${warning.column} - ${warning.message} (${warning.rule})`));
      });
      
      // Display info
      if (!options.strict) {
        result.info.forEach(info => {
          console.log(chalk.blue(`  ℹ️  ${info.line}:${info.column} - ${info.message} (${info.rule})`));
        });
      }
    }
    
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  }
  
  // Summary
  console.log(chalk.blue('\n📊 Summary:'));
  console.log(`  Errors: ${totalErrors}`);
  console.log(`  Warnings: ${totalWarnings}`);
  
  if (totalErrors > 0) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${__filename}`) {
  main().catch(console.error);
}

export { GASLinter, LintResult, LintError };
#!/usr/bin/env tsx

/**
 * GAS Bundle Validator
 * Validates the final Code.gs bundle before deployment
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseAST } from 'acorn';
import chalk from 'chalk';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    size: number;
    functions: number;
    namespaces: number;
    hasRequiredFunctions: boolean;
  };
}

// Required functions for Gmail Add-on
const REQUIRED_FUNCTIONS = [
  'onHomepage',
  'onSettings', 
  'onGmailMessage',
  'buildSettingsCard',
  'buildQuickReplyCard',
  'saveSettings'
];

// Known GAS globals that should be allowed
const ALLOWED_GLOBALS = new Set([
  // TypeScript helpers
  '__extends', '__assign', '__spreadArray', '__read', '__values', '__awaiter', '__generator',
  'extendStatics', 'd', 'b', '__', '__proto__', 'prototype', 'constructor',
  
  // JavaScript built-ins
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Error', 'TypeError',
  'Math', 'Date', 'JSON', 'RegExp', 'Promise', 'Set', 'Map', 'console',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'undefined', 'null',
  'encodeURIComponent', 'decodeURIComponent', 'escape', 'unescape',
  
  // GAS Services
  'PropertiesService', 'SpreadsheetApp', 'DocumentApp', 'DriveApp',
  'GmailApp', 'CardService', 'UrlFetchApp', 'Utilities', 'Session',
  'ScriptApp', 'HtmlService', 'ContentService', 'CalendarApp'
]);

// Dangerous patterns
const DANGEROUS_PATTERNS = [
  { pattern: /\beval\s*\(/, message: 'eval() usage detected - security risk' },
  { pattern: /\bnew\s+Function\s*\(/, message: 'new Function() detected - security risk' },
  { pattern: /\b(import|export)\s+/, message: 'ES6 modules detected - not supported in GAS' },
  { pattern: /\basync\s+function/, message: 'async/await detected - not supported in GAS' },
  { pattern: /\bawait\s+/, message: 'await detected - not supported in GAS' },
  { pattern: /\bclass\s+\w+\s*{[^}]*\w+\s*;/, message: 'Class fields detected - not supported in GAS' }
];

class GASBundleValidator {
  validate(bundlePath: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check file exists
    if (!fs.existsSync(bundlePath)) {
      return {
        valid: false,
        errors: [`Bundle file not found: ${bundlePath}`],
        warnings: [],
        stats: { size: 0, functions: 0, namespaces: 0, hasRequiredFunctions: false }
      };
    }
    
    const content = fs.readFileSync(bundlePath, 'utf-8');
    const stats = {
      size: content.length,
      functions: 0,
      namespaces: 0,
      hasRequiredFunctions: true
    };
    
    // Size check
    if (stats.size < 5000) {
      errors.push('Bundle too small - likely missing content');
    }
    if (stats.size > 500000) {
      warnings.push('Bundle very large - may hit GAS size limits');
    }
    
    // Check for dangerous patterns
    DANGEROUS_PATTERNS.forEach(({ pattern, message }) => {
      if (pattern.test(content)) {
        errors.push(message);
      }
    });
    
    // Parse AST
    try {
      const ast = parseAST(content, { ecmaVersion: 2022 } as any);
      
      // Count functions and namespaces
      this.walk(ast, (node: any) => {
        if (node.type === 'FunctionDeclaration') {
          stats.functions++;
        }
        if (node.type === 'VariableDeclaration' && 
            node.declarations[0]?.init?.type === 'LogicalExpression') {
          // Namespace pattern: var X = X || {};
          stats.namespaces++;
        }
      });
      
      // Check required functions
      const foundFunctions = new Set<string>();
      this.walk(ast, (node: any) => {
        if (node.type === 'FunctionDeclaration' && node.id) {
          foundFunctions.add(node.id.name);
        }
      });
      
      const missingFunctions = REQUIRED_FUNCTIONS.filter(fn => !foundFunctions.has(fn));
      if (missingFunctions.length > 0) {
        errors.push(`Missing required functions: ${missingFunctions.join(', ')}`);
        stats.hasRequiredFunctions = false;
      }
      
      // Check for undefined globals (excluding allowed ones)
      const declaredGlobals = new Set<string>();
      const usedGlobals = new Set<string>();
      
      // Collect declarations
      this.walk(ast, (node: any) => {
        if (node.type === 'FunctionDeclaration' && node.id) {
          declaredGlobals.add(node.id.name);
        }
        if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier') {
          declaredGlobals.add(node.id.name);
        }
      });
      
      // Collect usage
      this.walk(ast, (node: any) => {
        if (node.type === 'Identifier' && !this.isDeclaration(node)) {
          usedGlobals.add(node.name);
        }
      });
      
      // Find truly undefined
      const undefinedGlobals = Array.from(usedGlobals)
        .filter(name => !declaredGlobals.has(name) && !ALLOWED_GLOBALS.has(name))
        .filter(name => !name.includes('.') && !name.includes('$'));
      
      if (undefinedGlobals.length > 10) {
        warnings.push(`Many undefined globals (${undefinedGlobals.length}). Top 10: ${undefinedGlobals.slice(0, 10).join(', ')}`);
      }
      
    } catch (error: any) {
      errors.push(`Parse error: ${error.message}`);
    }
    
    // Check for common issues
    if (!content.includes('// TypeScript Helpers')) {
      warnings.push('Missing TypeScript helpers comment - may have helper issues');
    }
    
    if (!content.includes('* Answer As Me 3')) {
      warnings.push('Missing header comment');
    }
    
    // Check for src files (they shouldn't be in the bundle)
    if (content.includes('dist/src/')) {
      errors.push('Bundle contains references to src files - deployment will include unnecessary files');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats
    };
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
  
  private isDeclaration(node: any): boolean {
    const parent = node._parent;
    if (!parent) return false;
    
    return (
      (parent.type === 'FunctionDeclaration' && parent.id === node) ||
      (parent.type === 'VariableDeclarator' && parent.id === node) ||
      (parent.type === 'FunctionExpression' && parent.id === node)
    );
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const bundlePath = args[0] || path.join(process.cwd(), 'dist', 'Code.gs');
  
  console.log(chalk.blue('🔍 GAS Bundle Validator\n'));
  console.log(chalk.gray(`Validating: ${bundlePath}\n`));
  
  const validator = new GASBundleValidator();
  const result = validator.validate(bundlePath);
  
  // Display results
  if (result.errors.length > 0) {
    console.log(chalk.red('❌ Errors:'));
    result.errors.forEach(error => console.log(chalk.red(`   ${error}`)));
    console.log();
  }
  
  if (result.warnings.length > 0) {
    console.log(chalk.yellow('⚠️  Warnings:'));
    result.warnings.forEach(warning => console.log(chalk.yellow(`   ${warning}`)));
    console.log();
  }
  
  // Display stats
  console.log(chalk.blue('📊 Bundle Stats:'));
  console.log(`   Size: ${(result.stats.size / 1024).toFixed(1)}KB`);
  console.log(`   Functions: ${result.stats.functions}`);
  console.log(`   Namespaces: ${result.stats.namespaces}`);
  console.log(`   Required functions: ${result.stats.hasRequiredFunctions ? '✅ All present' : '❌ Missing'}`);
  console.log();
  
  if (result.valid) {
    console.log(chalk.green('✅ Bundle is valid for deployment'));
  } else {
    console.log(chalk.red('❌ Bundle validation failed'));
    process.exit(1);
  }
}

if (import.meta.url === `file://${__filename}`) {
  main().catch(console.error);
}

export { GASBundleValidator, ValidationResult };
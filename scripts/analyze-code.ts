#!/usr/bin/env tsx

/**
 * Advanced TypeScript Code Analyzer
 * Finds missing functions, variables, type errors, and potential bugs
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

// Types
interface AnalysisResult {
  errors: DiagnosticInfo[];
  warnings: DiagnosticInfo[];
  missingSymbols: MissingSymbol[];
  unusedSymbols: UnusedSymbol[];
  typeErrors: TypeErrorInfo[];
  suggestions: CodeSuggestion[];
}

interface DiagnosticInfo {
  file: string;
  line: number;
  column: number;
  message: string;
  code?: string;
}

interface MissingSymbol {
  name: string;
  type: 'function' | 'variable' | 'type' | 'namespace';
  usageLocation: Location;
}

interface UnusedSymbol {
  name: string;
  type: 'function' | 'variable' | 'type' | 'export';
  declarationLocation: Location;
}

interface TypeErrorInfo {
  file: string;
  line: number;
  message: string;
  expected?: string;
  actual?: string;
}

interface CodeSuggestion {
  type: 'performance' | 'security' | 'style' | 'bug';
  severity: 'low' | 'medium' | 'high';
  message: string;
  location?: Location;
}

interface Location {
  file: string;
  line: number;
  column: number;
}

// Constants
const PROJECT_ROOT = path.resolve(__dirname, '..');
const TSCONFIG_PATH = path.join(PROJECT_ROOT, 'tsconfig.json');

// Logging
function log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
  const colors = {
    info: chalk.blue,
    success: chalk.green,
    error: chalk.red,
    warn: chalk.yellow
  };
  console.log(colors[level](message));
}

// TypeScript Program Analysis
class TypeScriptAnalyzer {
  private program: ts.Program;
  private checker: ts.TypeChecker;
  private sourceFiles: ts.SourceFile[];
  
  constructor(configPath: string) {
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    if (configFile.error) {
      throw new Error(`Failed to read tsconfig: ${configFile.error.messageText}`);
    }
    
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(configPath)
    );
    
    // Create program with strict settings
    const compilerOptions: ts.CompilerOptions = {
      ...parsedConfig.options,
      strict: true,
      noImplicitAny: true,
      noImplicitThis: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      strictPropertyInitialization: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      noUncheckedIndexedAccess: true,
      noImplicitOverride: true,
      noPropertyAccessFromIndexSignature: true,
      exactOptionalPropertyTypes: true,
      allowUnusedLabels: false,
      allowUnreachableCode: false
    };
    
    this.program = ts.createProgram(parsedConfig.fileNames, compilerOptions);
    this.checker = this.program.getTypeChecker();
    this.sourceFiles = this.program.getSourceFiles()
      .filter(sf => !sf.fileName.includes('node_modules'));
  }
  
  analyze(): AnalysisResult {
    const result: AnalysisResult = {
      errors: [],
      warnings: [],
      missingSymbols: [],
      unusedSymbols: [],
      typeErrors: [],
      suggestions: []
    };
    
    // Run all diagnostics
    this.runSemanticDiagnostics(result);
    this.runSyntacticDiagnostics(result);
    this.runDeclarationDiagnostics(result);
    this.findMissingSymbols(result);
    this.findUnusedSymbols(result);
    this.analyzeCodePatterns(result);
    
    return result;
  }
  
  private runSemanticDiagnostics(result: AnalysisResult): void {
    for (const sourceFile of this.sourceFiles) {
      const diagnostics = this.program.getSemanticDiagnostics(sourceFile);
      
      for (const diagnostic of diagnostics) {
        const info = this.diagnosticToInfo(diagnostic);
        
        if (diagnostic.category === ts.DiagnosticCategory.Error) {
          result.errors.push(info);
        } else if (diagnostic.category === ts.DiagnosticCategory.Warning) {
          result.warnings.push(info);
        }
        
        // Check for type errors
        if (this.isTypeError(diagnostic)) {
          result.typeErrors.push(this.extractTypeError(diagnostic));
        }
      }
    }
  }
  
  private runSyntacticDiagnostics(result: AnalysisResult): void {
    for (const sourceFile of this.sourceFiles) {
      const diagnostics = this.program.getSyntacticDiagnostics(sourceFile);
      
      for (const diagnostic of diagnostics) {
        result.errors.push(this.diagnosticToInfo(diagnostic));
      }
    }
  }
  
  private runDeclarationDiagnostics(result: AnalysisResult): void {
    const diagnostics = this.program.getDeclarationDiagnostics();
    
    for (const diagnostic of diagnostics) {
      result.warnings.push(this.diagnosticToInfo(diagnostic));
    }
  }
  
  private findMissingSymbols(result: AnalysisResult): void {
    const declaredSymbols = new Set<string>();
    const usedSymbols = new Map<string, Location>();
    
    for (const sourceFile of this.sourceFiles) {
      ts.forEachChild(sourceFile, node => this.visitNode(node, declaredSymbols, usedSymbols, sourceFile));
    }
    
    // Find symbols that are used but not declared
    for (const [symbol, location] of usedSymbols) {
      if (!declaredSymbols.has(symbol) && !this.isGlobalSymbol(symbol)) {
        result.missingSymbols.push({
          name: symbol,
          type: this.guessSymbolType(symbol),
          usageLocation: location
        });
      }
    }
  }
  
  private findUnusedSymbols(result: AnalysisResult): void {
    for (const sourceFile of this.sourceFiles) {
      const symbols = this.checker.getSymbolsInScope(sourceFile, ts.SymbolFlags.Variable | ts.SymbolFlags.Function);
      
      for (const symbol of symbols) {
        if (symbol.declarations && symbol.declarations.length > 0) {
          const isUsed = this.isSymbolUsed(symbol);
          
          if (!isUsed && !this.isExported(symbol)) {
            const declaration = symbol.declarations[0];
            const sourceFile = declaration.getSourceFile();
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(declaration.getStart());
            
            result.unusedSymbols.push({
              name: symbol.getName(),
              type: this.getSymbolType(symbol),
              declarationLocation: {
                file: sourceFile.fileName,
                line: line + 1,
                column: character + 1
              }
            });
          }
        }
      }
    }
  }
  
  private analyzeCodePatterns(result: AnalysisResult): void {
    for (const sourceFile of this.sourceFiles) {
      ts.forEachChild(sourceFile, node => {
        // Check for common bugs
        this.checkForCommonBugs(node, sourceFile, result);
        
        // Check for performance issues
        this.checkForPerformanceIssues(node, sourceFile, result);
        
        // Check for security issues
        this.checkForSecurityIssues(node, sourceFile, result);
      });
    }
  }
  
  private checkForCommonBugs(node: ts.Node, sourceFile: ts.SourceFile, result: AnalysisResult): void {
    // Check for == instead of ===
    if (ts.isBinaryExpression(node) && 
        (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken ||
         node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsToken)) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      result.suggestions.push({
        type: 'bug',
        severity: 'medium',
        message: 'Use === or !== instead of == or != for strict equality',
        location: {
          file: sourceFile.fileName,
          line: line + 1,
          column: character + 1
        }
      });
    }
    
    // Check for array holes
    if (ts.isArrayLiteralExpression(node)) {
      let hasHoles = false;
      for (let i = 0; i < node.elements.length; i++) {
        if (node.elements[i].kind === ts.SyntaxKind.OmittedExpression) {
          hasHoles = true;
          break;
        }
      }
      
      if (hasHoles) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        result.suggestions.push({
          type: 'bug',
          severity: 'high',
          message: 'Array literal contains holes which can cause unexpected behavior',
          location: {
            file: sourceFile.fileName,
            line: line + 1,
            column: character + 1
          }
        });
      }
    }
    
    // Recursively check children
    ts.forEachChild(node, child => this.checkForCommonBugs(child, sourceFile, result));
  }
  
  private checkForPerformanceIssues(node: ts.Node, sourceFile: ts.SourceFile, result: AnalysisResult): void {
    // Check for inefficient array methods in loops
    if (ts.isForStatement(node) || ts.isWhileStatement(node)) {
      const loopBody = ts.isForStatement(node) ? node.statement : node.statement;
      
      ts.forEachChild(loopBody, child => {
        if (ts.isCallExpression(child) && 
            ts.isPropertyAccessExpression(child.expression) &&
            ['filter', 'map', 'reduce'].includes(child.expression.name.text)) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(child.getStart());
          result.suggestions.push({
            type: 'performance',
            severity: 'low',
            message: 'Array method inside loop may cause performance issues',
            location: {
              file: sourceFile.fileName,
              line: line + 1,
              column: character + 1
            }
          });
        }
      });
    }
    
    // Recursively check children
    ts.forEachChild(node, child => this.checkForPerformanceIssues(child, sourceFile, result));
  }
  
  private checkForSecurityIssues(node: ts.Node, sourceFile: ts.SourceFile, result: AnalysisResult): void {
    // Check for eval usage
    if (ts.isCallExpression(node) && 
        ts.isIdentifier(node.expression) && 
        node.expression.text === 'eval') {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      result.suggestions.push({
        type: 'security',
        severity: 'high',
        message: 'Avoid using eval() as it poses security risks',
        location: {
          file: sourceFile.fileName,
          line: line + 1,
          column: character + 1
        }
      });
    }
    
    // Recursively check children
    ts.forEachChild(node, child => this.checkForSecurityIssues(child, sourceFile, result));
  }
  
  // Helper methods
  private visitNode(node: ts.Node, declared: Set<string>, used: Map<string, Location>, sourceFile: ts.SourceFile): void {
    // Track declarations
    if (ts.isFunctionDeclaration(node) && node.name) {
      declared.add(node.name.text);
    } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      declared.add(node.name.text);
    } else if (ts.isClassDeclaration(node) && node.name) {
      declared.add(node.name.text);
    } else if (ts.isModuleDeclaration(node) && ts.isIdentifier(node.name)) {
      declared.add(node.name.text);
    }
    
    // Track usage
    if (ts.isIdentifier(node) && !this.isDeclarationIdentifier(node)) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      used.set(node.text, {
        file: sourceFile.fileName,
        line: line + 1,
        column: character + 1
      });
    }
    
    ts.forEachChild(node, child => this.visitNode(child, declared, used, sourceFile));
  }
  
  private isDeclarationIdentifier(node: ts.Identifier): boolean {
    const parent = node.parent;
    return (ts.isFunctionDeclaration(parent) && parent.name === node) ||
           (ts.isVariableDeclaration(parent) && parent.name === node) ||
           (ts.isClassDeclaration(parent) && parent.name === node) ||
           (ts.isPropertyDeclaration(parent) && parent.name === node) ||
           (ts.isMethodDeclaration(parent) && parent.name === node);
  }
  
  private isGlobalSymbol(name: string): boolean {
    const globals = [
      'console', 'Math', 'Date', 'JSON', 'Object', 'Array', 'String', 'Number',
      'Boolean', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Error',
      'PropertiesService', 'CardService', 'UrlFetchApp', 'ScriptApp'
    ];
    return globals.includes(name);
  }
  
  private guessSymbolType(name: string): 'function' | 'variable' | 'type' | 'namespace' {
    if (name[0] === name[0].toUpperCase()) {
      return 'type';
    }
    return 'variable';
  }
  
  private isSymbolUsed(symbol: ts.Symbol): boolean {
    // Simple heuristic - check if symbol has any references
    return symbol.getName().startsWith('_') || // Convention for unused
           symbol.getName() === 'constructor';
  }
  
  private isExported(symbol: ts.Symbol): boolean {
    return !!(symbol.flags & ts.SymbolFlags.Export);
  }
  
  private getSymbolType(symbol: ts.Symbol): 'function' | 'variable' | 'type' | 'export' {
    if (symbol.flags & ts.SymbolFlags.Function) return 'function';
    if (symbol.flags & ts.SymbolFlags.Variable) return 'variable';
    if (symbol.flags & ts.SymbolFlags.Type) return 'type';
    return 'export';
  }
  
  private diagnosticToInfo(diagnostic: ts.Diagnostic): DiagnosticInfo {
    const file = diagnostic.file;
    const start = diagnostic.start || 0;
    
    if (file) {
      const { line, character } = file.getLineAndCharacterOfPosition(start);
      return {
        file: file.fileName,
        line: line + 1,
        column: character + 1,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        code: diagnostic.code?.toString()
      };
    }
    
    return {
      file: 'unknown',
      line: 0,
      column: 0,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      code: diagnostic.code?.toString()
    };
  }
  
  private isTypeError(diagnostic: ts.Diagnostic): boolean {
    const typeCodes = [2322, 2345, 2339, 2349, 2351, 2361, 2365];
    return typeCodes.includes(diagnostic.code);
  }
  
  private extractTypeError(diagnostic: ts.Diagnostic): TypeErrorInfo {
    const info = this.diagnosticToInfo(diagnostic);
    return {
      file: info.file,
      line: info.line,
      message: info.message
    };
  }
}

// Report generator
function generateReport(result: AnalysisResult): void {
  console.log('\n' + chalk.bold.underline('TypeScript Code Analysis Report'));
  console.log('=' .repeat(50));
  
  // Errors
  if (result.errors.length > 0) {
    log(`\n❌ Errors (${result.errors.length})`, 'error');
    for (const error of result.errors) {
      console.log(`   ${error.file}:${error.line}:${error.column} - ${error.message}`);
    }
  }
  
  // Type errors
  if (result.typeErrors.length > 0) {
    log(`\n🔍 Type Errors (${result.typeErrors.length})`, 'error');
    for (const error of result.typeErrors) {
      console.log(`   ${error.file}:${error.line} - ${error.message}`);
    }
  }
  
  // Missing symbols
  if (result.missingSymbols.length > 0) {
    log(`\n❓ Missing Symbols (${result.missingSymbols.length})`, 'warn');
    for (const symbol of result.missingSymbols) {
      console.log(`   ${symbol.name} (${symbol.type}) - used at ${symbol.usageLocation.file}:${symbol.usageLocation.line}`);
    }
  }
  
  // Unused symbols
  if (result.unusedSymbols.length > 0) {
    log(`\n🗑️  Unused Symbols (${result.unusedSymbols.length})`, 'warn');
    for (const symbol of result.unusedSymbols) {
      console.log(`   ${symbol.name} (${symbol.type}) - declared at ${symbol.declarationLocation.file}:${symbol.declarationLocation.line}`);
    }
  }
  
  // Warnings
  if (result.warnings.length > 0) {
    log(`\n⚠️  Warnings (${result.warnings.length})`, 'warn');
    for (const warning of result.warnings) {
      console.log(`   ${warning.file}:${warning.line}:${warning.column} - ${warning.message}`);
    }
  }
  
  // Suggestions
  if (result.suggestions.length > 0) {
    log(`\n💡 Suggestions (${result.suggestions.length})`, 'info');
    
    const grouped = result.suggestions.reduce((acc, suggestion) => {
      if (!acc[suggestion.type]) acc[suggestion.type] = [];
      acc[suggestion.type].push(suggestion);
      return acc;
    }, {} as Record<string, CodeSuggestion[]>);
    
    for (const [type, suggestions] of Object.entries(grouped)) {
      console.log(`\n   ${chalk.bold(type.toUpperCase())}:`);
      for (const suggestion of suggestions) {
        const severity = chalk[suggestion.severity === 'high' ? 'red' : suggestion.severity === 'medium' ? 'yellow' : 'gray'];
        console.log(`   ${severity(`[${suggestion.severity}]`)} ${suggestion.message}`);
        if (suggestion.location) {
          console.log(`      at ${suggestion.location.file}:${suggestion.location.line}`);
        }
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  const hasErrors = result.errors.length > 0 || result.typeErrors.length > 0;
  const status = hasErrors ? chalk.red('❌ FAILED') : chalk.green('✅ PASSED');
  console.log(`Status: ${status}`);
  console.log(`Total issues: ${result.errors.length + result.typeErrors.length + result.warnings.length}`);
}

// Main function
async function main(): Promise<void> {
  try {
    log('🔍 Running advanced TypeScript code analysis...', 'info');
    
    if (!fs.existsSync(TSCONFIG_PATH)) {
      throw new Error('tsconfig.json not found');
    }
    
    const analyzer = new TypeScriptAnalyzer(TSCONFIG_PATH);
    const result = analyzer.analyze();
    
    generateReport(result);
    
    // Exit with error if there are errors
    if (result.errors.length > 0 || result.typeErrors.length > 0) {
      process.exit(1);
    }
    
  } catch (error: any) {
    log(`❌ Analysis failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${__filename}`) {
  main();
}

export { TypeScriptAnalyzer, AnalysisResult };
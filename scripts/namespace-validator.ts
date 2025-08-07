#!/usr/bin/env tsx

/**
 * Namespace Validator for Google Apps Script Projects
 * Prevents namespace conflicts with GAS global types
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import chalk from 'chalk';

// Known GAS global namespaces that cause conflicts
const RESERVED_NAMESPACES = [
  'Drive',
  'DriveApp',
  'Gmail',
  'GmailApp',
  'Calendar',
  'CalendarApp',
  'Sheets',
  'SpreadsheetApp',
  'Docs',
  'DocumentApp',
  'Forms',
  'FormApp',
  'Slides',
  'SlidesApp',
  'Maps',
  'Charts',
  'Sites',
  'Groups',
  'Analytics',
  'BigQuery',
  'Classroom',
  'TagManager',
  'AdminDirectory',
  'AdminReports',
  'Mirror',
  'Tasks',
  'UrlShortener',
  'YouTube'
];

// Suggested alternatives
const NAMESPACE_ALTERNATIVES: Record<string, string[]> = {
  'Drive': ['DriveUtils', 'DriveService', 'DriveHelper'],
  'Gmail': ['GmailUtils', 'GmailService', 'EmailService'],
  'Calendar': ['CalendarUtils', 'CalendarService', 'EventService'],
  'Sheets': ['SheetsUtils', 'SpreadsheetService', 'SheetHelper'],
  'Docs': ['DocsUtils', 'DocumentService', 'DocHelper'],
  'Forms': ['FormsUtils', 'FormService', 'FormHelper'],
  'Slides': ['SlidesUtils', 'PresentationService', 'SlideHelper']
};

interface ValidationResult {
  valid: boolean;
  conflicts: Array<{
    file: string;
    line: number;
    namespace: string;
    suggestions: string[];
  }>;
}

class NamespaceValidator {
  private conflicts: ValidationResult['conflicts'] = [];

  validateProject(srcDir: string): ValidationResult {
    console.log(chalk.blue('🔍 Validating TypeScript namespaces for GAS compatibility...\n'));
    
    const files = this.getTypeScriptFiles(srcDir);
    
    for (const file of files) {
      this.validateFile(file);
    }
    
    return {
      valid: this.conflicts.length === 0,
      conflicts: this.conflicts
    };
  }

  private getTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];
    
    const walk = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir);
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && entry !== 'node_modules' && entry !== 'dist') {
          walk(fullPath);
        } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts') && !entry.endsWith('.spec.ts')) {
          files.push(fullPath);
        }
      }
    };
    
    walk(dir);
    return files;
  }

  private validateFile(filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );
    
    this.walkNode(sourceFile, sourceFile, filePath);
  }

  private walkNode(node: ts.Node, sourceFile: ts.SourceFile, filePath: string): void {
    if (ts.isModuleDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      const namespaceName = node.name.text;
      
      if (RESERVED_NAMESPACES.includes(namespaceName)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        
        this.conflicts.push({
          file: path.relative(process.cwd(), filePath),
          line: line + 1,
          namespace: namespaceName,
          suggestions: NAMESPACE_ALTERNATIVES[namespaceName] || [`${namespaceName}Utils`, `${namespaceName}Service`]
        });
      }
    }
    
    ts.forEachChild(node, child => this.walkNode(child, sourceFile, filePath));
  }

  generateReport(result: ValidationResult): void {
    if (result.valid) {
      console.log(chalk.green('✅ No namespace conflicts found!\n'));
      return;
    }
    
    console.log(chalk.red(`❌ Found ${result.conflicts.length} namespace conflicts:\n`));
    
    for (const conflict of result.conflicts) {
      console.log(chalk.yellow(`📁 ${conflict.file}:${conflict.line}`));
      console.log(chalk.red(`   Conflict: namespace ${conflict.namespace}`));
      console.log(chalk.green(`   Suggestions: ${conflict.suggestions.join(', ')}\n`));
    }
    
    console.log(chalk.blue('💡 Fix suggestions:'));
    console.log('   1. Rename the namespace to one of the suggested alternatives');
    console.log('   2. Update all references to the namespace throughout your code');
    console.log('   3. Update namespace mappings in your bundle configuration\n');
  }

  async autoFix(result: ValidationResult): Promise<void> {
    if (result.valid) return;
    
    console.log(chalk.blue('🔧 Attempting automatic fixes...\n'));
    
    for (const conflict of result.conflicts) {
      const content = fs.readFileSync(conflict.file, 'utf8');
      const newNamespace = conflict.suggestions[0];
      
      // Simple regex replacement (more sophisticated AST transformation could be used)
      const pattern = new RegExp(`namespace\\s+${conflict.namespace}\\b`, 'g');
      const updated = content.replace(pattern, `namespace ${newNamespace}`);
      
      if (content !== updated) {
        fs.writeFileSync(conflict.file, updated);
        console.log(chalk.green(`✅ Fixed: ${conflict.namespace} → ${newNamespace} in ${conflict.file}`));
      }
    }
    
    console.log(chalk.yellow('\n⚠️  Note: You still need to update references to these namespaces in other files.'));
  }
}

// CLI execution
if (require.main === module) {
  const validator = new NamespaceValidator();
  const srcDir = path.join(process.cwd(), 'src');
  
  const result = validator.validateProject(srcDir);
  validator.generateReport(result);
  
  if (!result.valid) {
    // Check for --fix flag
    if (process.argv.includes('--fix')) {
      validator.autoFix(result).then(() => {
        process.exit(0);
      });
    } else {
      console.log(chalk.yellow('Run with --fix flag to attempt automatic fixes.'));
      process.exit(1);
    }
  }
}

export { NamespaceValidator, ValidationResult };
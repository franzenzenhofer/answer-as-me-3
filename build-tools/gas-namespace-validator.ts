/**
 * Google Apps Script Namespace Validator
 * Prevents namespace conflicts with GAS global types
 */

import * as fs from 'fs';
import * as path from 'path';

export class GASNamespaceValidator {
  private reservedNamespaces: Set<string>;
  private safeAlternatives: Map<string, string>;

  constructor() {
    // Initialize with known GAS global namespaces
    this.reservedNamespaces = new Set([
      'Drive', 'DriveApp',
      'Gmail', 'GmailApp',
      'Sheets', 'SpreadsheetApp',
      'Calendar', 'CalendarApp',
      'Docs', 'DocumentApp',
      'Forms', 'FormApp',
      'Sites', 'SitesApp',
      'Groups', 'GroupsApp',
      'Maps', 'MapsApp',
      'Base', 'Utilities',
      'Logger', 'console',
      'Session', 'Browser',
      'HtmlService', 'ContentService',
      'ScriptApp', 'UrlFetchApp',
      'PropertiesService', 'CacheService',
      'LockService', 'MailApp',
      'ContactsApp', 'AdminDirectory',
      'Analytics', 'BigQuery',
      'Classroom', 'Slides',
      'Tasks', 'YouTube',
      'CardService', 'ChartsService'
    ]);

    // Suggested safe alternatives
    this.safeAlternatives = new Map([
      ['Drive', 'DriveService'],
      ['Gmail', 'GmailService'],
      ['Sheets', 'SheetsService'],
      ['Calendar', 'CalendarService'],
      ['Docs', 'DocsService'],
      ['Forms', 'FormsService']
    ]);
  }

  /**
   * Check if a namespace is reserved by GAS
   */
  isReserved(namespace: string): boolean {
    return this.reservedNamespaces.has(namespace);
  }

  /**
   * Get a safe alternative for a reserved namespace
   */
  getSafeAlternative(namespace: string): string {
    return this.safeAlternatives.get(namespace) || `${namespace}Service`;
  }

  /**
   * Validate all TypeScript files in a project
   */
  async validateProject(projectRoot: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const tsFiles = await this.findTypeScriptFiles(projectRoot);

    for (const file of tsFiles) {
      const content = await fs.promises.readFile(file, 'utf8');
      const namespaces = this.extractNamespaces(content);

      for (const ns of namespaces) {
        if (this.isReserved(ns)) {
          errors.push({
            file: path.relative(projectRoot, file),
            namespace: ns,
            suggestion: this.getSafeAlternative(ns),
            line: this.findLineNumber(content, ns)
          });
        }
      }
    }

    return { errors, warnings, valid: errors.length === 0 };
  }

  /**
   * Extract namespace declarations from TypeScript content
   */
  private extractNamespaces(content: string): string[] {
    const namespaces: string[] = [];
    
    // Match namespace declarations
    const namespaceRegex = /namespace\s+(\w+)\s*\{/g;
    let match;
    
    while ((match = namespaceRegex.exec(content)) !== null) {
      namespaces.push(match[1]);
    }

    // Also check for potential var/const declarations that might conflict
    const varRegex = /(?:var|const|let)\s+(\w+)\s*=/g;
    
    while ((match = varRegex.exec(content)) !== null) {
      const varName = match[1];
      if (this.isReserved(varName)) {
        namespaces.push(varName);
      }
    }

    return namespaces;
  }

  /**
   * Find all TypeScript files in a directory
   */
  private async findTypeScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    async function walk(currentDir: string) {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    }

    await walk(dir);
    return files;
  }

  /**
   * Find line number for a namespace declaration
   */
  private findLineNumber(content: string, namespace: string): number {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`namespace ${namespace}`) || 
          lines[i].includes(`var ${namespace}`) ||
          lines[i].includes(`const ${namespace}`) ||
          lines[i].includes(`let ${namespace}`)) {
        return i + 1;
      }
    }
    
    return 0;
  }

  /**
   * Generate a report of all reserved namespaces
   */
  generateReport(): string {
    const report = ['# Google Apps Script Reserved Namespaces\n'];
    report.push('The following namespaces are reserved by Google Apps Script and should not be used:\n');

    const sorted = Array.from(this.reservedNamespaces).sort();
    
    for (const ns of sorted) {
      const alt = this.safeAlternatives.get(ns);
      if (alt) {
        report.push(`- **${ns}** → Use \`${alt}\` instead`);
      } else {
        report.push(`- **${ns}**`);
      }
    }

    return report.join('\n');
  }
}

interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  valid: boolean;
}

interface ValidationError {
  file: string;
  namespace: string;
  suggestion: string;
  line: number;
}

interface ValidationWarning {
  file: string;
  message: string;
  line: number;
}

// Export for use in build scripts
export default GASNamespaceValidator;
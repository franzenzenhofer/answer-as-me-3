#!/usr/bin/env tsx

/**
 * GAS Type Checker - Validates TypeScript types against actual GAS runtime APIs
 * Catches type mismatches between @types/google-apps-script and runtime
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import chalk from 'chalk';

interface TypeMismatch {
  api: string;
  typeScriptType: string;
  documentedType: string;
  file: string;
  line: number;
  suggestion: string;
}

interface KnownTypeFix {
  pattern: RegExp;
  replacement: string;
  reason: string;
}

// Known type mismatches between TypeScript definitions and GAS runtime
const KNOWN_TYPE_FIXES: KnownTypeFix[] = [
  {
    pattern: /GmailDraftActionResponse/g,
    replacement: 'UpdateDraftActionResponse',
    reason: 'GAS uses UpdateDraftActionResponse for draft updates'
  },
  {
    pattern: /CardService\.newGmailDraftActionResponseBuilder/g,
    replacement: 'CardService.newUpdateDraftActionResponseBuilder',
    reason: 'Builder method name changed in newer GAS version'
  },
  {
    pattern: /Calendar\.EventRecurrence/g,
    replacement: 'CalendarApp.EventRecurrence',
    reason: 'EventRecurrence is under CalendarApp, not Calendar'
  },
  {
    pattern: /Drive\.Permission/g,
    replacement: 'DriveApp.Permission',
    reason: 'Permission is under DriveApp, not Drive'
  }
];

// Type mapping for common GAS services
const GAS_TYPE_MAPPINGS = {
  // CardService types
  'CardService.ActionResponse': {
    builders: ['newActionResponseBuilder'],
    methods: ['setNotification', 'setNavigation', 'setOpenLink', 'setStateChanged']
  },
  'CardService.UpdateDraftActionResponse': {
    builders: ['newUpdateDraftActionResponseBuilder'],
    methods: ['setUpdateDraftBodyAction', 'setUpdateDraftSubjectAction', 'setUpdateDraftToRecipientsAction']
  },
  'CardService.Card': {
    builders: ['newCardBuilder'],
    methods: ['addSection', 'setHeader', 'setName']
  },
  
  // Gmail types
  'GmailApp.GmailMessage': {
    methods: ['getFrom', 'getTo', 'getSubject', 'getDate', 'getThread', 'getId']
  },
  'GmailApp.GmailThread': {
    methods: ['getMessages', 'getFirstMessageSubject', 'getId', 'getMessageCount']
  },
  
  // Drive types
  'DriveApp.Folder': {
    methods: ['createFile', 'addFile', 'getFiles', 'getFolders', 'getName']
  },
  'DriveApp.File': {
    methods: ['getId', 'getName', 'getUrl', 'getBlob', 'setContent']
  },
  
  // Spreadsheet types
  'SpreadsheetApp.Spreadsheet': {
    methods: ['getActiveSheet', 'getSheets', 'insertSheet', 'getUrl']
  },
  'SpreadsheetApp.Sheet': {
    methods: ['getRange', 'appendRow', 'getLastRow', 'setFrozenRows']
  }
};

class GasTypeChecker {
  private mismatches: TypeMismatch[] = [];
  private program: ts.Program;
  private checker: ts.TypeChecker;

  constructor(private projectPath: string) {
    const configPath = ts.findConfigFile(projectPath, ts.sys.fileExists, 'tsconfig.json');
    if (!configPath) {
      throw new Error('tsconfig.json not found');
    }

    const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
    const { options, fileNames } = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      path.dirname(configPath)
    );

    this.program = ts.createProgram(fileNames, options);
    this.checker = this.program.getTypeChecker();
  }

  checkTypes(): void {
    console.log(chalk.blue('🔍 Checking GAS type compatibility...\n'));

    for (const sourceFile of this.program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile && !sourceFile.fileName.includes('node_modules')) {
        this.checkFile(sourceFile);
      }
    }
  }

  private checkFile(sourceFile: ts.SourceFile): void {
    const visit = (node: ts.Node): void => {
      // Check property access expressions for GAS API calls
      if (ts.isPropertyAccessExpression(node)) {
        this.checkGasApiCall(node, sourceFile);
      }

      // Check type references
      if (ts.isTypeReferenceNode(node)) {
        this.checkTypeReference(node, sourceFile);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  private checkGasApiCall(node: ts.PropertyAccessExpression, sourceFile: ts.SourceFile): void {
    const symbol = this.checker.getSymbolAtLocation(node);
    if (!symbol) return;

    const type = this.checker.getTypeOfSymbolAtLocation(symbol, node);
    const typeString = this.checker.typeToString(type);

    // Check for known problematic patterns
    for (const fix of KNOWN_TYPE_FIXES) {
      if (fix.pattern.test(typeString)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        
        this.mismatches.push({
          api: node.getText(),
          typeScriptType: typeString,
          documentedType: typeString.replace(fix.pattern, fix.replacement),
          file: path.relative(this.projectPath, sourceFile.fileName),
          line: line + 1,
          suggestion: fix.reason
        });
      }
    }
  }

  private checkTypeReference(node: ts.TypeReferenceNode, sourceFile: ts.SourceFile): void {
    const typeName = node.typeName.getText();
    
    // Check for known problematic type names
    if (typeName === 'GmailDraftActionResponse') {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      
      this.mismatches.push({
        api: typeName,
        typeScriptType: typeName,
        documentedType: 'UpdateDraftActionResponse',
        file: path.relative(this.projectPath, sourceFile.fileName),
        line: line + 1,
        suggestion: 'Use GoogleAppsScript.Card_Service.UpdateDraftActionResponse instead'
      });
    }
  }

  generateReport(): void {
    if (this.mismatches.length === 0) {
      console.log(chalk.green('✅ No GAS type mismatches found!\n'));
      return;
    }

    console.log(chalk.red(`❌ Found ${this.mismatches.length} type mismatches:\n`));

    for (const mismatch of this.mismatches) {
      console.log(chalk.yellow(`📁 ${mismatch.file}:${mismatch.line}`));
      console.log(chalk.red(`   TypeScript: ${mismatch.typeScriptType}`));
      console.log(chalk.green(`   Should be: ${mismatch.documentedType}`));
      console.log(chalk.blue(`   Reason: ${mismatch.suggestion}\n`));
    }
  }

  async autoFix(): Promise<void> {
    if (this.mismatches.length === 0) return;

    console.log(chalk.blue('🔧 Applying automatic fixes...\n'));

    const fileUpdates = new Map<string, string>();

    for (const mismatch of this.mismatches) {
      const filePath = path.join(this.projectPath, mismatch.file);
      let content = fileUpdates.get(filePath) || fs.readFileSync(filePath, 'utf8');

      // Apply known fixes
      for (const fix of KNOWN_TYPE_FIXES) {
        if (fix.pattern.test(mismatch.typeScriptType)) {
          content = content.replace(fix.pattern, fix.replacement);
        }
      }

      fileUpdates.set(filePath, content);
    }

    // Write updated files
    for (const [filePath, content] of fileUpdates) {
      fs.writeFileSync(filePath, content);
      console.log(chalk.green(`✅ Updated: ${path.relative(this.projectPath, filePath)}`));
    }
  }

  // Generate type override file for project-specific fixes
  generateTypeOverrides(): void {
    const overrides = `/**
 * Type overrides for Google Apps Script
 * Generated by gas-type-checker
 */

declare namespace GoogleAppsScript {
  namespace Card_Service {
    // Fix for Gmail draft response type
    interface UpdateDraftActionResponse {
      printJson(): string;
    }
  }
  
  namespace Gmail {
    // Add any missing Gmail types here
  }
  
  namespace Drive {
    // Add any missing Drive types here
  }
}

// Global type fixes
type GmailDraftActionResponse = GoogleAppsScript.Card_Service.UpdateDraftActionResponse;
`;

    const overridePath = path.join(this.projectPath, 'src', 'types', 'gas-overrides.d.ts');
    fs.mkdirSync(path.dirname(overridePath), { recursive: true });
    fs.writeFileSync(overridePath, overrides);
    
    console.log(chalk.green(`✅ Generated type overrides at: ${path.relative(this.projectPath, overridePath)}`));
  }
}

// CLI execution
if (require.main === module) {
  const checker = new GasTypeChecker(process.cwd());
  
  try {
    checker.checkTypes();
    checker.generateReport();
    
    if (process.argv.includes('--fix')) {
      checker.autoFix().then(() => {
        console.log(chalk.green('\n✅ Automatic fixes applied!'));
      });
    }
    
    if (process.argv.includes('--generate-overrides')) {
      checker.generateTypeOverrides();
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

export { GasTypeChecker };
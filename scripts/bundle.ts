#!/usr/bin/env tsx

/**
 * TypeScript Bundle Script for Answer As Me 3
 * Modern bundling with tree shaking and advanced code analysis
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseAST, Node } from 'acorn';
import * as esbuild from 'esbuild';
import chalk from 'chalk';

// Types
interface ModuleDependency {
  module: string;
  dependencies: string[];
}

interface BundleOptions {
  treeShake: boolean;
  analyze: boolean;
  verbose: boolean;
}

interface CodeAnalysisResult {
  missingFunctions: string[];
  missingVariables: string[];
  unusedExports: string[];
  circularDependencies: string[];
}

// Constants
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const MODULES_DIR = path.join(SRC_DIR, 'modules');

// Core modules in dependency order
const CORE_MODULES = [
  'config',
  'types',
  'utils',
  'validation',
  'template',
  'email',
  'gmail',
  'gemini',
  'document',
  'drive',
  'sheets',
  'logger',
  'state',
  'error-handler',
  'ui'
];

// Namespace mapping
const NAMESPACE_MAP: Record<string, string> = {
  'Config': 'config',
  'Types': 'types',
  'Utils': 'utils',
  'Validation': 'validation',
  'Template': 'template',
  'Email': 'email',
  'Gmail': 'gmail',
  'Gemini': 'gemini',
  'Document': 'document',
  'Drive': 'drive',
  'Sheets': 'sheets',
  'AppLogger': 'logger',
  'State': 'state',
  'ErrorHandler': 'error-handler',
  'UI': 'ui'
};

// Logging utilities
function log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
  const colors = {
    info: chalk.blue,
    success: chalk.green,
    error: chalk.red,
    warn: chalk.yellow
  };
  console.log(colors[level](message));
}

// Advanced code analysis
class CodeAnalyzer {
  private declaredFunctions = new Set<string>();
  private declaredVariables = new Set<string>();
  private usedFunctions = new Set<string>();
  private usedVariables = new Set<string>();
  private exportedSymbols = new Set<string>();
  private importedSymbols = new Set<string>();

  analyze(code: string): CodeAnalysisResult {
    try {
      const ast = parseAST(code, { ecmaVersion: 2022 } as any);
      this.walk(ast);
      
      return {
        missingFunctions: Array.from(this.usedFunctions).filter(f => !this.declaredFunctions.has(f)),
        missingVariables: Array.from(this.usedVariables).filter(v => !this.declaredVariables.has(v)),
        unusedExports: Array.from(this.exportedSymbols).filter(s => !this.importedSymbols.has(s)),
        circularDependencies: [] // TODO: Implement circular dependency detection
      };
    } catch (error: any) {
      throw new Error(`Code analysis failed: ${error.message}`);
    }
  }

  private walk(node: any): void {
    if (!node) return;

    switch (node.type) {
      case 'FunctionDeclaration':
        if (node.id) {
          this.declaredFunctions.add(node.id.name);
        }
        break;
      
      case 'VariableDeclarator':
        if (node.id && node.id.type === 'Identifier') {
          this.declaredVariables.add(node.id.name);
        }
        break;
      
      case 'CallExpression':
        if (node.callee.type === 'Identifier') {
          this.usedFunctions.add(node.callee.name);
        } else if (node.callee.type === 'MemberExpression' && node.callee.object.type === 'Identifier') {
          // Track namespace usage
          this.usedVariables.add(node.callee.object.name);
        }
        break;
      
      case 'Identifier':
        // Track variable usage in expressions
        if (node.name && !['undefined', 'null', 'true', 'false'].includes(node.name)) {
          this.usedVariables.add(node.name);
        }
        break;
    }

    // Recursively walk the AST
    for (const key in node) {
      if (key === 'type' || key === 'start' || key === 'end') continue;
      
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(item => this.walk(item));
      } else if (child && typeof child === 'object') {
        this.walk(child);
      }
    }
  }
}

// Module dependency analyzer
function analyzeDependencies(): Map<string, string[]> {
  const dependencies = new Map<string, string[]>();
  
  for (const moduleName of CORE_MODULES) {
    const filePath = path.join(MODULES_DIR, `${moduleName}.ts`);
    if (!fs.existsSync(filePath)) {
      dependencies.set(moduleName, []);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const deps: string[] = [];
    
    // Find namespace references
    for (const [namespace, module] of Object.entries(NAMESPACE_MAP)) {
      const pattern = new RegExp(`\\b${namespace}\\.`, 'g');
      if (pattern.test(content) && module !== moduleName) {
        deps.push(module);
      }
    }
    
    dependencies.set(moduleName, [...new Set(deps)]);
  }
  
  return dependencies;
}

// Topological sort for dependency resolution
function topologicalSort(dependencies: Map<string, string[]>): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  
  function visit(node: string): void {
    if (visiting.has(node)) {
      throw new Error(`Circular dependency detected involving: ${node}`);
    }
    if (visited.has(node)) return;
    
    visiting.add(node);
    
    const deps = dependencies.get(node) || [];
    for (const dep of deps) {
      if (dependencies.has(dep)) {
        visit(dep);
      }
    }
    
    visiting.delete(node);
    visited.add(node);
    sorted.push(node);
  }
  
  for (const module of dependencies.keys()) {
    if (!visited.has(module)) {
      visit(module);
    }
  }
  
  return sorted;
}

// Tree shaking with esbuild
async function performTreeShaking(inputPath: string, outputPath: string): Promise<void> {
  log('🌳 Performing tree shaking...', 'info');
  
  try {
    const result = await esbuild.build({
      entryPoints: [inputPath],
      bundle: true,
      format: 'iife',
      target: 'es2020',
      treeShaking: true,
      minify: false, // Keep readable for GAS
      outfile: outputPath,
      platform: 'browser',
      globalName: 'AnswerAsMe3',
      write: false
    });
    
    if (result.outputFiles && result.outputFiles.length > 0) {
      const optimizedCode = result.outputFiles[0].text;
      fs.writeFileSync(outputPath, optimizedCode);
      
      const originalSize = fs.statSync(inputPath).size;
      const optimizedSize = optimizedCode.length;
      const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
      
      log(`✅ Tree shaking complete: ${reduction}% reduction`, 'success');
    }
  } catch (error: any) {
    log(`⚠️  Tree shaking failed: ${error.message}`, 'warn');
    // Fall back to original file
    fs.copyFileSync(inputPath, outputPath);
  }
}

// Extract namespace content from compiled JavaScript
function extractNamespaceContent(moduleContent: string, moduleName: string): { name: string; content: string } | null {
  try {
    const ast = parseAST(moduleContent, { ecmaVersion: 2022 } as any);
    
    let namespaceName: string | null = null;
    let namespaceContent: string | null = null;
    
    // Look for namespace pattern
    for (let i = 0; i < ast.body.length; i++) {
      const node = ast.body[i];
      
      if (node.type === 'VariableDeclaration' && node.declarations.length === 1) {
        const varName = node.declarations[0].id.name;
        
        if (i + 1 < ast.body.length) {
          const nextNode = ast.body[i + 1];
          
          if (nextNode.type === 'ExpressionStatement' && 
              nextNode.expression.type === 'CallExpression' &&
              nextNode.expression.callee.type === 'FunctionExpression') {
            
            const funcExpr = nextNode.expression.callee;
            const args = nextNode.expression.arguments;
            
            if (funcExpr.params.length === 1 && 
                funcExpr.params[0].name === varName &&
                args.length === 1) {
              
              namespaceName = varName;
              
              // Extract function body content
              const startPos = funcExpr.body.start + 1;
              const endPos = funcExpr.body.end - 1;
              let innerContent = moduleContent.substring(startPos, endPos);
              
              // Clean up the content
              innerContent = innerContent
                .replace(/Object\.defineProperty\(exports[^;]*;/g, '')
                .replace(/exports\.[^=]*=[^;]*;/g, '')
                .trim();
              
              namespaceContent = innerContent;
              break;
            }
          }
        }
      }
    }
    
    if (namespaceName && namespaceContent) {
      return { name: namespaceName, content: namespaceContent };
    }
    
    return null;
  } catch (error: any) {
    throw new Error(`Failed to extract namespace from ${moduleName}: ${error.message}`);
  }
}

// Main bundle creation
async function createBundle(options: BundleOptions = { treeShake: true, analyze: true, verbose: false }): Promise<void> {
  const startTime = Date.now();
  
  log('🔨 Creating TypeScript modular bundle...', 'info');
  
  // Check prerequisites
  const codeFile = path.join(DIST_DIR, 'src', 'Code.js');
  const modulesDir = path.join(DIST_DIR, 'src', 'modules');
  const bundleFile = path.join(DIST_DIR, 'Code.gs');
  
  if (!fs.existsSync(codeFile)) {
    throw new Error('Code.js not found. Run npm run build first.');
  }
  
  // Get version info
  const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
  const fullVersion = packageJson.version || '1.0.0';
  const appVersion = fullVersion.split('.').slice(0, 2).join('.');
  const deployTime = new Date().toLocaleString('de-AT', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Vienna'
  });
  
  // Analyze dependencies
  const dependencies = analyzeDependencies();
  const moduleOrder = topologicalSort(dependencies);
  
  if (options.verbose) {
    log('🔍 Dependency analysis:', 'info');
    for (const [module, deps] of dependencies) {
      if (deps.length > 0) {
        log(`   ${module} → ${deps.join(', ')}`, 'info');
      }
    }
    log(`📋 Module order: ${moduleOrder.join(' → ')}`, 'info');
  }
  
  // Validate all modules exist
  const missingModules = moduleOrder.filter(moduleName => 
    !fs.existsSync(path.join(modulesDir, `${moduleName}.js`))
  );
  
  if (missingModules.length > 0) {
    throw new Error(`Missing modules: ${missingModules.join(', ')}`);
  }
  
  // Combine modules
  let modulesContent = '';
  
  for (const moduleName of moduleOrder) {
    const jsPath = path.join(modulesDir, `${moduleName}.js`);
    const moduleContent = fs.readFileSync(jsPath, 'utf8');
    
    const extracted = extractNamespaceContent(moduleContent, moduleName);
    if (!extracted) {
      throw new Error(`Failed to extract namespace from ${moduleName}`);
    }
    
    modulesContent += `\n// ===== ${extracted.name.toUpperCase()} MODULE =====\n`;
    modulesContent += `var ${extracted.name};\n(function (${extracted.name}) {\n${extracted.content}\n})(${extracted.name} || (${extracted.name} = {}));\n`;
    
    log(`✅ Included module: ${moduleName} (${extracted.name})`, 'success');
  }
  
  // Read main code
  let mainContent = fs.readFileSync(codeFile, 'utf8');
  
  // Clean up CommonJS artifacts
  mainContent = mainContent
    .replace(/\/\/\/\s*<reference[^>]*>/g, '')
    .replace(/"use strict";?\n?/g, '')
    .replace(/Object\.defineProperty\(exports[^;]*;/g, '')
    .replace(/exports\.[^=]*=[^;]*;/g, '')
    .replace(/var\s+([^=]+)\s*=\s*require\([^)]+\);?/g, '')
    .replace(/const\s+([^=]+)\s*=\s*require\([^)]+\);?/g, '')
    .trim();
  
  // Replace version placeholders
  let finalContent = modulesContent + '\n\n' + mainContent;
  finalContent = finalContent
    .replace(/__VERSION__/g, appVersion)
    .replace(/__DEPLOY_TIME__/g, deployTime);
  
  // Don't add header - deploy.ts will handle it
  const bundledContent = finalContent;
  
  // Validate bundle
  if (bundledContent.length < 5000) {
    throw new Error('Bundle too small - likely missing content');
  }
  
  // Code analysis
  if (options.analyze) {
    log('🔍 Running advanced code analysis...', 'info');
    const analyzer = new CodeAnalyzer();
    const analysis = analyzer.analyze(bundledContent);
    
    if (analysis.missingFunctions.length > 0) {
      log(`⚠️  Missing functions: ${analysis.missingFunctions.join(', ')}`, 'warn');
    }
    
    if (analysis.missingVariables.length > 0) {
      // Filter out known globals
      const knownGlobals = ['PropertiesService', 'CardService', 'console', 'Math', 'Date', 'JSON'];
      const reallyMissing = analysis.missingVariables.filter(v => !knownGlobals.includes(v));
      if (reallyMissing.length > 0) {
        log(`⚠️  Missing variables: ${reallyMissing.join(', ')}`, 'warn');
      }
    }
  }
  
  // Write initial bundle
  fs.writeFileSync(bundleFile, bundledContent);
  
  // Tree shaking (skip for .gs files as esbuild doesn't support them)
  if (options.treeShake && !bundleFile.endsWith('.gs')) {
    const tempFile = bundleFile + '.temp';
    await performTreeShaking(bundleFile, tempFile);
    fs.renameSync(tempFile, bundleFile);
  } else if (options.treeShake) {
    log('⏭️  Skipping tree shaking for .gs files', 'info');
  }
  
  // Final validation
  try {
    parseAST(fs.readFileSync(bundleFile, 'utf8'), { ecmaVersion: 2022 } as any);
    log('✅ Bundle syntax validation passed', 'success');
  } catch (error: any) {
    throw new Error(`Bundle has syntax errors: ${error.message}`);
  }
  
  // Success
  const finalSize = (fs.statSync(bundleFile).size / 1024).toFixed(1);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  log(`\n✅ Bundle created successfully!`, 'success');
  log(`   Path: ${bundleFile}`, 'info');
  log(`   Size: ${finalSize}KB`, 'info');
  log(`   Modules: ${moduleOrder.join(', ')}`, 'info');
  log(`   Time: ${duration}s`, 'info');
}

// CLI
if (import.meta.url === `file://${__filename}`) {
  const args = process.argv.slice(2);
  const options: BundleOptions = {
    treeShake: !args.includes('--no-tree-shake'),
    analyze: !args.includes('--no-analyze'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };
  
  createBundle(options).catch(error => {
    log(`❌ Bundle failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

export { createBundle, CodeAnalyzer };
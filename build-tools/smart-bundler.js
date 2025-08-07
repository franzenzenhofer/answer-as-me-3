/**
 * Smart Bundler for Google Apps Script
 * Uses AST parsing for reliable module bundling
 */

const fs = require('fs').promises;
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');

class SmartBundler {
  constructor(options = {}) {
    this.options = {
      verbose: false,
      ...options
    };
    this.modules = new Map();
    this.dependencies = new Map();
  }

  /**
   * Analyze a JavaScript file and classify its structure
   */
  async analyzeFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const filename = path.basename(filePath, '.js');
    
    if (!content.trim()) {
      return {
        path: filePath,
        filename,
        type: 'empty',
        content: '',
        namespace: null,
        dependencies: []
      };
    }

    try {
      const ast = acorn.parse(content, { 
        ecmaVersion: 'latest',
        sourceType: 'script'
      });

      const analysis = {
        path: filePath,
        filename,
        type: 'unknown',
        content,
        namespace: null,
        dependencies: [],
        exports: [],
        hasNamespace: false,
        hasExports: false
      };

      // Walk the AST to find patterns
      walk.simple(ast, {
        // Look for namespace pattern: var Namespace = (function() { ... })();
        VariableDeclaration(node) {
          if (node.declarations.length === 1) {
            const decl = node.declarations[0];
            if (decl.init && 
                decl.init.type === 'CallExpression' &&
                decl.init.callee.type === 'FunctionExpression') {
              analysis.hasNamespace = true;
              analysis.namespace = decl.id.name;
              analysis.type = 'namespace';
            }
          }
        },
        
        // Look for CommonJS exports
        AssignmentExpression(node) {
          if (node.left.type === 'MemberExpression' &&
              node.left.object.name === 'exports') {
            analysis.hasExports = true;
            analysis.exports.push(node.left.property.name);
          }
        },

        // Look for dependencies (references to other namespaces)
        Identifier(node) {
          // Common GAS namespace pattern
          if (node.name && /^[A-Z][a-zA-Z]+$/.test(node.name)) {
            // Avoid built-in objects
            if (!['Array', 'Object', 'String', 'Number', 'Date', 'Math', 'JSON'].includes(node.name)) {
              analysis.dependencies.push(node.name);
            }
          }
        }
      });

      // Deduplicate dependencies
      analysis.dependencies = [...new Set(analysis.dependencies)];

      // Determine final type
      if (analysis.hasNamespace) {
        analysis.type = 'namespace';
      } else if (analysis.hasExports) {
        analysis.type = 'commonjs';
      } else if (content.includes('//# sourceMappingURL=')) {
        analysis.type = 'sourcemap';
      } else {
        analysis.type = 'script';
      }

      return analysis;

    } catch (error) {
      if (this.options.verbose) {
        console.warn(`Failed to parse ${filePath}:`, error.message);
      }
      
      return {
        path: filePath,
        filename,
        type: 'invalid',
        content,
        namespace: null,
        dependencies: [],
        error: error.message
      };
    }
  }

  /**
   * Extract namespace content from parsed module
   */
  extractNamespaceContent(analysis) {
    if (analysis.type !== 'namespace' || !analysis.namespace) {
      return null;
    }

    const { content, namespace } = analysis;
    
    // Use regex as fallback for namespace extraction
    const namespaceRegex = new RegExp(
      `var ${namespace}\\s*=\\s*\\(function\\s*\\(\\)\\s*{([\\s\\S]*?)\\}\\)\\(\\);?`,
      'g'
    );
    
    const match = namespaceRegex.exec(content);
    if (match && match[1]) {
      const innerContent = match[1].trim();
      
      // Remove 'use strict' if present
      const cleanContent = innerContent.replace(/^\s*['"]use strict['"];\s*/, '');
      
      return {
        namespace,
        content: cleanContent
      };
    }

    return null;
  }

  /**
   * Bundle multiple files into a single GAS-compatible file
   */
  async bundle(filePaths, outputPath) {
    const analyses = [];
    
    // Analyze all files
    for (const filePath of filePaths) {
      const analysis = await this.analyzeFile(filePath);
      analyses.push(analysis);
      
      if (analysis.namespace) {
        this.modules.set(analysis.namespace, analysis);
      }
    }

    // Build dependency graph
    for (const analysis of analyses) {
      if (analysis.namespace) {
        const deps = analysis.dependencies.filter(dep => 
          this.modules.has(dep) && dep !== analysis.namespace
        );
        this.dependencies.set(analysis.namespace, deps);
      }
    }

    // Topological sort
    const sorted = this.topologicalSort();
    
    // Build final bundle
    const bundleParts = [];
    
    // Add header
    bundleParts.push('// Google Apps Script Bundle');
    bundleParts.push(`// Generated: ${new Date().toISOString()}`);
    bundleParts.push('');

    // Add each namespace in dependency order
    for (const namespace of sorted) {
      const analysis = this.modules.get(namespace);
      if (!analysis) continue;

      const extracted = this.extractNamespaceContent(analysis);
      if (extracted) {
        bundleParts.push(`// === ${namespace} ===`);
        bundleParts.push(`var ${namespace} = (function() {`);
        bundleParts.push(extracted.content);
        bundleParts.push('})();');
        bundleParts.push('');
      }
    }

    // Add any non-namespace scripts
    for (const analysis of analyses) {
      if (analysis.type === 'script' && !analysis.namespace) {
        bundleParts.push(`// === ${analysis.filename} ===`);
        bundleParts.push(analysis.content);
        bundleParts.push('');
      }
    }

    // Write bundle
    const bundle = bundleParts.join('\n');
    await fs.writeFile(outputPath, bundle, 'utf8');

    return {
      totalFiles: analyses.length,
      bundledNamespaces: sorted.length,
      skippedFiles: analyses.filter(a => a.type === 'empty' || a.type === 'invalid').length,
      bundle
    };
  }

  /**
   * Topological sort for dependency resolution
   */
  topologicalSort() {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (namespace) => {
      if (visited.has(namespace)) return;
      if (visiting.has(namespace)) {
        throw new Error(`Circular dependency detected: ${namespace}`);
      }

      visiting.add(namespace);
      
      const deps = this.dependencies.get(namespace) || [];
      for (const dep of deps) {
        visit(dep);
      }

      visiting.delete(namespace);
      visited.add(namespace);
      sorted.push(namespace);
    };

    // Visit all modules
    for (const namespace of this.modules.keys()) {
      visit(namespace);
    }

    return sorted;
  }

  /**
   * Validate bundle syntax and structure
   */
  async validateBundle(bundlePath) {
    const content = await fs.readFile(bundlePath, 'utf8');
    
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      stats: {
        size: content.length,
        lines: content.split('\n').length,
        namespaces: []
      }
    };

    // Check minimum size
    if (content.length < 1000) {
      validation.errors.push('Bundle is too small (< 1KB)');
      validation.valid = false;
    }

    // Parse and validate syntax
    try {
      const ast = acorn.parse(content, { ecmaVersion: 'latest' });
      
      // Count namespaces
      walk.simple(ast, {
        VariableDeclaration(node) {
          if (node.declarations.length === 1) {
            const decl = node.declarations[0];
            if (decl.id && decl.id.name && /^[A-Z]/.test(decl.id.name)) {
              validation.stats.namespaces.push(decl.id.name);
            }
          }
        }
      });

    } catch (error) {
      validation.errors.push(`Syntax error: ${error.message}`);
      validation.valid = false;
    }

    // Check for required GAS functions
    const requiredFunctions = ['onOpen', 'onHomepage'];
    for (const func of requiredFunctions) {
      if (!content.includes(`function ${func}`)) {
        validation.warnings.push(`Missing required function: ${func}`);
      }
    }

    // Check for common issues
    if (content.includes('export ') || content.includes('import ')) {
      validation.errors.push('ES6 import/export found - not supported in GAS');
      validation.valid = false;
    }

    if (content.includes('require(')) {
      validation.warnings.push('CommonJS require() found - may not work in GAS');
    }

    return validation;
  }
}

module.exports = SmartBundler;

// CLI interface
if (require.main === module) {
  const bundler = new SmartBundler({ verbose: true });
  
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node smart-bundler.js <input-dir> <output-file>');
    process.exit(1);
  }

  const inputDir = args[0];
  const outputFile = args[1];

  (async () => {
    try {
      // Find all .js files
      const files = await fs.readdir(inputDir);
      const jsFiles = files
        .filter(f => f.endsWith('.js'))
        .map(f => path.join(inputDir, f));

      // Bundle
      const result = await bundler.bundle(jsFiles, outputFile);
      console.log('Bundle created:', result);

      // Validate
      const validation = await bundler.validateBundle(outputFile);
      console.log('Validation:', validation);

      if (!validation.valid) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Bundling failed:', error);
      process.exit(1);
    }
  })();
}
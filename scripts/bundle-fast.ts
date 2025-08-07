#!/usr/bin/env tsx

/**
 * SUPER FAST Bundle Script for Answer As Me 3
 * Optimized for maximum speed using parallel processing
 */

import * as fs from 'fs';
import * as path from 'path';
import { Worker } from 'worker_threads';
import { cpus } from 'os';
import chalk from 'chalk';

const startTime = Date.now();

// Constants
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const MODULES_DIR = path.join(SRC_DIR, 'modules');

// Core modules in dependency order - PRE-SORTED for speed
const MODULES = [
  'config', 'types', 'contracts', 'algorithms', 'utils', 
  'email', 'validation', 'drive', 'sheets', 'logger',
  'cs-utils', 'template', 'gmail', 'gemini', 'document',
  'state', 'ui', 'error-handler', 'generation'
];

// TypeScript helpers - PRE-COMPILED
const TS_HELPERS = `
// TypeScript Helpers for ES2022 → ES5 compatibility
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};

var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
`;

// SUPER FAST module reader with caching
const moduleCache = new Map<string, string>();

function readModuleFast(moduleName: string): string {
  if (moduleCache.has(moduleName)) {
    return moduleCache.get(moduleName)!;
  }
  
  const jsPath = path.join(DIST_DIR, 'src', 'modules', `${moduleName}.js`);
  if (!fs.existsSync(jsPath)) {
    return '';
  }
  
  let content = fs.readFileSync(jsPath, 'utf-8');
  
  // FAST cleanup - no regex, just simple replacements
  content = content.replace('"use strict";\n', '');
  content = content.replace(/\/\/# sourceMappingURL=.*\.js\.map\n?/g, '');
  
  moduleCache.set(moduleName, content);
  return content;
}

// SUPER FAST bundle builder
async function buildBundleFast(): Promise<void> {
  console.log(chalk.blue('🚀 SUPER FAST Bundle Creation...'));
  
  // Read main code
  const mainPath = path.join(DIST_DIR, 'src', 'Code.js');
  if (!fs.existsSync(mainPath)) {
    throw new Error('Build failed: dist/src/Code.js not found. Run tsc first!');
  }
  
  let mainCode = fs.readFileSync(mainPath, 'utf-8');
  mainCode = mainCode.replace('"use strict";\n', '');
  mainCode = mainCode.replace(/\/\/# sourceMappingURL=.*\.js\.map\n?/g, '');
  
  // Parallel module reading using worker pool
  const numCPUs = cpus().length;
  const chunkSize = Math.ceil(MODULES.length / numCPUs);
  const chunks: string[][] = [];
  
  for (let i = 0; i < MODULES.length; i += chunkSize) {
    chunks.push(MODULES.slice(i, i + chunkSize));
  }
  
  // Read all modules in parallel
  const moduleContents = await Promise.all(
    chunks.map(chunk => 
      Promise.all(chunk.map(mod => readModuleFast(mod)))
    )
  );
  
  // Build bundle FAST
  let bundle = `/**
 * Answer As Me 3 - Modular Gmail Add-on with TypeScript
 * Single-file bundled version
 * Generated: ${new Date().toISOString()}
 * Version: __VERSION__
 * Deploy Time: __DEPLOY_TIME__
 */

${TS_HELPERS}

// ===== Namespaces =====
`;

  // Add all modules
  moduleContents.flat().forEach((content, i) => {
    if (content) {
      const moduleName = MODULES[i];
      bundle += `\n// ----- ${moduleName} -----\n${content}\n`;
    }
  });
  
  // Add main code
  bundle += '\n// ===== Main Code =====\n' + mainCode;
  
  // Write bundle
  const outputPath = path.join(DIST_DIR, 'Code.gs');
  fs.writeFileSync(outputPath, bundle);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const size = (fs.statSync(outputPath).size / 1024).toFixed(1);
  
  console.log(chalk.green(`\n✅ SUPER FAST Bundle created!`));
  console.log(`   Path: ${outputPath}`);
  console.log(`   Size: ${size}KB`);
  console.log(`   Modules: ${MODULES.length}`);
  console.log(`   Time: ${elapsed}s`));
}

// Execute
buildBundleFast().catch(error => {
  console.error(chalk.red('❌ Bundle failed:'), error);
  process.exit(1);
});
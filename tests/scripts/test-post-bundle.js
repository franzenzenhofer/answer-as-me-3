#!/usr/bin/env node

/**
 * Post-bundle validation script
 * Ensures the bundled Code.gs file is valid and contains all required functions
 */

const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../../dist/Code.gs');

console.log('🧪 Running post-bundle validation...');

// Check if bundle exists
if (!fs.existsSync(bundlePath)) {
  console.error('❌ Bundle file not found at dist/Code.gs');
  process.exit(1);
}

// Read bundle content
const bundleContent = fs.readFileSync(bundlePath, 'utf8');

// Check bundle size
const bundleSize = Buffer.byteLength(bundleContent, 'utf8');
console.log(`📦 Bundle size: ${Math.round(bundleSize / 1024)}KB`);

if (bundleSize < 5000) {
  console.error('❌ Bundle too small (< 5KB) - likely missing content');
  process.exit(1);
}

// Check for required entry points
const requiredFunctions = [
  'onHomepage',
  'generateGreeting',
  'showSettings',
  'resetData',
  'showSettingsUniversal',
  'testAddon'
];

const missingFunctions = [];
requiredFunctions.forEach(fn => {
  const regex = new RegExp(`function\\s+${fn}\\s*\\(`, 'm');
  if (!regex.test(bundleContent)) {
    missingFunctions.push(fn);
  }
});

if (missingFunctions.length > 0) {
  console.error(`❌ Missing required functions: ${missingFunctions.join(', ')}`);
  process.exit(1);
}

// Check for required namespaces
const requiredNamespaces = ['Config', 'Logger', 'State', 'UI', 'ErrorHandler'];
const missingNamespaces = [];

requiredNamespaces.forEach(ns => {
  const regex = new RegExp(`var\\s+${ns}\\s*;`, 'm');
  if (!regex.test(bundleContent)) {
    missingNamespaces.push(ns);
  }
});

if (missingNamespaces.length > 0) {
  console.error(`❌ Missing required namespaces: ${missingNamespaces.join(', ')}`);
  process.exit(1);
}

// Check for syntax errors by trying to parse
try {
  const acorn = require('acorn');
  acorn.parse(bundleContent, { ecmaVersion: 2022 });
  console.log('✅ Syntax validation passed');
} catch (error) {
  console.error('❌ Bundle has syntax errors:', error.message);
  process.exit(1);
}

// Check for common issues
if (bundleContent.includes('require(') || bundleContent.includes('exports.')) {
  console.warn('⚠️  Bundle contains CommonJS artifacts - these should be removed');
}

if (bundleContent.includes('/// <reference')) {
  console.warn('⚠️  Bundle contains TypeScript references - these should be removed');
}

console.log('✅ Post-bundle validation passed!');
console.log(`📋 Found ${requiredFunctions.length} required functions`);
console.log(`📚 Found ${requiredNamespaces.length} required namespaces`);
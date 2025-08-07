#!/usr/bin/env tsx

/**
 * Modern TypeScript Deployment Script for Answer As Me 3
 * Replaces the old bash script with a fully TypeScript solution
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'acorn';
import { program } from 'commander';
import chalk from 'chalk';

// Types
interface DeployOptions {
  dryRun: boolean;
  skipTests: boolean;
  verbose: boolean;
}

interface DeploymentInfo {
  version: string;
  timestamp: string;
  size: string;
  bytes: number;
}

// Constants
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const BUNDLE_PATH = path.join(DIST_DIR, 'Code.gs');
const SCRIPT_ID = '197HGcHZYyIkxSmoedQu9gixNURSmMi6_lqCsfsY3kYi4THzRCEl4nwi1';

// Utility functions
function log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
  const colors = {
    info: chalk.blue,
    success: chalk.green,
    error: chalk.red,
    warn: chalk.yellow
  };
  console.log(colors[level](message));
}

function execCommand(cmd: string, options: { silent?: boolean } = {}): string {
  try {
    const output = execSync(cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit'
    });
    return output.toString().trim();
  } catch (error) {
    throw new Error(`Command failed: ${cmd}\n${error}`);
  }
}

function getFileSize(filePath: string): { bytes: number; human: string } {
  const stats = fs.statSync(filePath);
  const bytes = stats.size;
  const units = ['B', 'KB', 'MB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return {
    bytes,
    human: `${size.toFixed(1)}${units[unitIndex]}`
  };
}

function validatePrerequisites(): void {
  log('🔍 Validating prerequisites...', 'info');
  
  // Check required commands
  const requiredCommands = ['clasp', 'npm', 'node'];
  for (const cmd of requiredCommands) {
    try {
      execCommand(`which ${cmd}`, { silent: true });
    } catch {
      throw new Error(`Required command '${cmd}' not found!`);
    }
  }
  
  // Check clasp authentication
  try {
    execCommand('clasp login --status', { silent: true });
  } catch {
    throw new Error('Not logged in to clasp! Run: clasp login');
  }
  
  // Check directory structure
  if (!fs.existsSync(path.join(PROJECT_ROOT, 'src'))) {
    throw new Error('src directory not found!');
  }
  
  if (!fs.existsSync(path.join(PROJECT_ROOT, 'src/Code.ts'))) {
    throw new Error('src/Code.ts not found!');
  }
  
  log('✅ Prerequisites validated', 'success');
}

function runBuild(options: DeployOptions): void {
  if (options.dryRun) {
    log('[DRY-RUN] Would run: npm run build', 'info');
    if (!fs.existsSync(BUNDLE_PATH)) {
      throw new Error('No existing bundle found for dry-run validation');
    }
    return;
  }
  
  log('🔨 Building project...', 'info');
  execCommand('npm run build');
}

function validateBundle(): DeploymentInfo {
  log('📦 Validating bundle...', 'info');
  
  if (!fs.existsSync(BUNDLE_PATH)) {
    throw new Error('Bundle not found at dist/Code.gs');
  }
  
  const { bytes, human } = getFileSize(BUNDLE_PATH);
  
  if (bytes < 1000) {
    throw new Error(`Bundle too small! Only ${human} (${bytes} bytes)`);
  }
  
  // Validate syntax
  const content = fs.readFileSync(BUNDLE_PATH, 'utf8');
  try {
    parse(content, { ecmaVersion: 2022 } as any);
  } catch (error: any) {
    throw new Error(`Bundle has syntax errors: ${error.message}`);
  }
  
  // Check for required functions
  const requiredFunctions = ['onHomepage', 'generateGreeting'];
  const missingFunctions = requiredFunctions.filter(fn => !content.includes(`function ${fn}(`));
  
  if (missingFunctions.length > 0) {
    throw new Error(`Bundle missing required functions: ${missingFunctions.join(', ')}`);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
  const version = packageJson.version || '1.0.0';
  const timestamp = new Date().toISOString();
  
  log(`✅ Bundle validated: ${human}`, 'success');
  
  return { version, timestamp, size: human, bytes };
}

function addDeploymentHeader(info: DeploymentInfo, options: DeployOptions): void {
  if (options.dryRun) {
    log('[DRY-RUN] Would add deployment header', 'info');
    return;
  }
  
  log('📝 Adding deployment header...', 'info');
  
  const header = `/**
 * Answer As Me 3 - Modular Hello World Add-on
 * Single-file bundled version
 * Version: ${info.version}
 * Deployed: ${info.timestamp}
 * Size: ${info.size}
 * 
 * Production deployment ready
 */

const DEPLOYMENT_VERSION = '${info.version}';
const DEPLOYMENT_TIMESTAMP = '${info.timestamp}';

`;
  
  // Read current content and strip any existing header
  let content = fs.readFileSync(BUNDLE_PATH, 'utf8');
  
  // Remove existing header if present
  const headerEndPattern = /^(var|namespace|\/\/ =====)/m;
  const match = content.match(headerEndPattern);
  if (match) {
    content = content.substring(content.indexOf(match[0]));
  }
  
  // Write new content with header
  fs.writeFileSync(BUNDLE_PATH, header + content);
  
  log('✅ Deployment header added', 'success');
}

function createClaspConfig(options: DeployOptions): void {
  const claspPath = path.join(DIST_DIR, '.clasp.json');
  
  if (options.dryRun) {
    log('[DRY-RUN] Would create .clasp.json in dist/', 'info');
    return;
  }
  
  const config = {
    scriptId: SCRIPT_ID,
    rootDir: '.'
  };
  
  fs.writeFileSync(claspPath, JSON.stringify(config, null, 2));
  log('✅ Created .clasp.json', 'success');
}

async function cleanOldDeployments(options: DeployOptions): Promise<void> {
  if (options.dryRun) {
    log('[DRY-RUN] Would check and clean old deployments', 'info');
    return;
  }
  
  log('🧹 Checking for old deployments...', 'info');
  
  try {
    process.chdir(DIST_DIR);
    const deploymentsOutput = execCommand('clasp deployments', { silent: true });
    const deploymentLines = deploymentsOutput.split('\n').filter(line => line.includes('AKfycb'));
    
    if (deploymentLines.length > 48) {
      log(`Found ${deploymentLines.length} deployments, cleaning old ones...`, 'warn');
      
      // Keep the 40 most recent deployments
      const toDelete = deploymentLines.slice(40);
      for (const line of toDelete) {
        const match = line.match(/(\w+)\s+AKfycb/);
        if (match) {
          const deploymentId = match[1];
          try {
            execCommand(`clasp undeploy ${deploymentId}`, { silent: true });
            log(`  Deleted deployment: ${deploymentId}`, 'info');
          } catch {
            // Ignore errors for individual deletions
          }
        }
      }
    }
  } finally {
    process.chdir(PROJECT_ROOT);
  }
}

async function deployToGAS(options: DeployOptions): Promise<string> {
  if (options.dryRun) {
    log('[DRY-RUN] Would deploy to Google Apps Script', 'info');
    return 'DRY-RUN-DEPLOYMENT-ID';
  }
  
  log('🚀 Deploying to Google Apps Script...', 'info');
  
  process.chdir(DIST_DIR);
  
  try {
    // Push the code
    execCommand('clasp push --force');
    
    // Create a new deployment
    const deployOutput = execCommand('clasp deploy --description "Automated deployment"', { silent: true });
    
    // Extract deployment ID
    const deployMatch = deployOutput.match(/Created version (\d+)[\s\S]*?-(AKfycb[\w-]+)/);
    if (!deployMatch) {
      throw new Error('Failed to extract deployment ID from clasp output');
    }
    
    const version = deployMatch[1];
    const deploymentId = deployMatch[2];
    
    log(`✅ Deployed successfully!`, 'success');
    log(`   Version: ${version}`, 'info');
    log(`   Deployment ID: ${deploymentId}`, 'info');
    
    return deploymentId;
  } finally {
    process.chdir(PROJECT_ROOT);
  }
}

function runPostDeploymentTests(deploymentId: string, options: DeployOptions): void {
  if (options.dryRun || options.skipTests) {
    log('[DRY-RUN] Would run post-deployment tests', 'info');
    return;
  }
  
  log('🧪 Running post-deployment tests...', 'info');
  
  // Run any post-deployment validation
  execCommand('npm run test:postbundle');
  
  log('✅ Post-deployment tests passed', 'success');
}

// Main deployment function
async function deploy(options: DeployOptions): Promise<void> {
  const startTime = Date.now();
  
  try {
    log('🚀 Answer As Me 3 - TypeScript Deployment System', 'info');
    log(`Mode: ${options.dryRun ? 'DRY-RUN' : 'PRODUCTION'}`, 'info');
    
    // Step 1: Validate prerequisites
    validatePrerequisites();
    
    // Step 2: Run build
    runBuild(options);
    
    // Step 3: Validate bundle
    const deploymentInfo = validateBundle();
    
    // Step 4: Add deployment header
    addDeploymentHeader(deploymentInfo, options);
    
    // Step 5: Create clasp config
    createClaspConfig(options);
    
    // Step 6: Clean old deployments
    await cleanOldDeployments(options);
    
    // Step 7: Deploy to GAS
    const deploymentId = await deployToGAS(options);
    
    // Step 8: Run post-deployment tests
    runPostDeploymentTests(deploymentId, options);
    
    // Success!
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`\n✅ Deployment completed successfully in ${duration}s!`, 'success');
    
    if (!options.dryRun) {
      log(`\n📋 Deployment Summary:`, 'info');
      log(`   Version: ${deploymentInfo.version}`, 'info');
      log(`   Size: ${deploymentInfo.size}`, 'info');
      log(`   Deployment ID: ${deploymentId}`, 'info');
      log(`   Script URL: https://script.google.com/d/${SCRIPT_ID}/edit`, 'info');
    }
    
  } catch (error: any) {
    log(`\n❌ Deployment failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// CLI setup
program
  .name('deploy')
  .description('Deploy Answer As Me 3 to Google Apps Script')
  .option('--dry-run', 'Preview deployment without executing', false)
  .option('--skip-tests', 'Skip post-deployment tests', false)
  .option('-v, --verbose', 'Verbose output', false)
  .action(deploy);

// Install required packages if missing
async function ensureDependencies(): Promise<void> {
  const requiredPackages = ['commander', 'chalk', 'acorn'];
  const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
  const installedPackages = {
    ...packageJson.dependencies || {},
    ...packageJson.devDependencies || {}
  };
  
  const missingPackages = requiredPackages.filter(pkg => !installedPackages[pkg]);
  
  if (missingPackages.length > 0) {
    log(`Installing missing packages: ${missingPackages.join(', ')}`, 'info');
    execCommand(`npm install --save-dev ${missingPackages.join(' ')}`);
  }
}

// Run the program
(async () => {
  await ensureDependencies();
  program.parse();
})();
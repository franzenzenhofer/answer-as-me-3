#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing Answer As Me 3 Deployment...\n');

// Change to dist directory
process.chdir(path.join(__dirname, 'dist'));

try {
  // Check deployments
  console.log('📋 Checking deployments...');
  const deployments = execSync('clasp deployments', { encoding: 'utf8' });
  console.log(deployments);
  
  // Get the latest deployment ID
  const lines = deployments.split('\n').filter(line => line.includes('AKfycb'));
  if (lines.length > 0) {
    console.log('✅ Deployment found!');
    const latestDeployment = lines[0];
    console.log('Latest deployment:', latestDeployment);
    
    // Extract deployment ID
    const match = latestDeployment.match(/AKfycb[\w-]+/);
    if (match) {
      const deploymentId = match[0];
      console.log(`\n🔗 Add-on URL: https://script.google.com/macros/d/${deploymentId}/edit`);
      console.log(`\n📧 To test in Gmail:`);
      console.log(`   1. Open Gmail`);
      console.log(`   2. Click on any email`);
      console.log(`   3. Look for "Answer As Me 3" in the right sidebar`);
      console.log(`   4. Click on it to open the add-on`);
    }
  } else {
    console.log('⚠️  No deployments found. You may need to create one manually.');
    console.log('Run: clasp deploy --description "Initial deployment"');
  }
  
  // Test the main function
  console.log('\n🔧 Testing main function availability...');
  const code = require('fs').readFileSync('Code.gs', 'utf8');
  
  const functions = ['onHomepage', 'generateGreeting', 'showSettings', 'resetData'];
  functions.forEach(fn => {
    if (code.includes(`function ${fn}(`)) {
      console.log(`✅ ${fn}() found`);
    } else {
      console.log(`❌ ${fn}() missing`);
    }
  });
  
  console.log('\n✨ Deployment test complete!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
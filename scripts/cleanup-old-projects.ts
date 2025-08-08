#!/usr/bin/env tsx

/**
 * Cleanup old Apps Script projects
 * This script helps identify and prepare deletion of old/duplicate projects
 */

import { execSync } from 'child_process';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

// Projects to potentially delete
const OLD_PROJECTS = [
  {
    name: 'Answer As Me 2',
    id: '1EBU3Ro5-wxnDgS15pdxQu0vLYpPQ-uSAxyEFepNROnGChAsilc6fB_cU',
    reason: 'Old version - replaced by Answer As Me 3'
  },
  {
    name: 'Answer As Me',
    id: '1lBZGlPIg44JJB6h7OlYIvg1AUe8ACLNVda5kjoEsiVIqrnlf-eOqb872',
    reason: 'Old version 1 - replaced by Answer As Me 3'
  },
  {
    name: 'Gmail Support Triage (1)',
    id: '1rsJQPU1V1CIHbxfz4SZbZu3sYmK8eEcXuGUM_-no1Mtr0rNbu-RHq6Xt',
    reason: 'Duplicate project'
  },
  {
    name: 'Gmail Support Triage (2)',
    id: '1KoGDnoguHBTp_oRymUA5GSgtfVe056NW7vNZWIFlxX0RWXgHDISlUeJx',
    reason: 'Duplicate project'
  },
  {
    name: 'AI-POWERED GMAIL',
    id: '1D9jUw4MQqIFDYyTN7UMIhBxpYfLcUSgSNeYTKrp3ogyCWiFZ-uSP7tUl',
    reason: 'Different add-on, not needed'
  },
  {
    name: 'Untitled project',
    id: '1zcvQe_cmFGa5fdEknbA9Po-bECSt6tNULHFxlhOQHYo0mJu8jJiKb9-O',
    reason: 'Untitled/test project'
  }
];

// Project to keep
const KEEP_PROJECT = {
  name: 'Answer As Me 3',
  id: '197HGcHZYyIkxSmoedQu9gixNURSmMi6_lqCsfsY3kYi4THzRCEl4nwi1'
};

async function main() {
  console.log('🧹 Apps Script Project Cleanup Tool\n');
  console.log('✅ KEEPING: ' + KEEP_PROJECT.name);
  console.log('   Script ID: ' + KEEP_PROJECT.id + '\n');
  
  console.log('❌ PROJECTS TO REMOVE:');
  OLD_PROJECTS.forEach((project, index) => {
    console.log(`${index + 1}. ${project.name}`);
    console.log(`   ID: ${project.id}`);
    console.log(`   Reason: ${project.reason}\n`);
  });
  
  console.log('⚠️  IMPORTANT STEPS:');
  console.log('1. First, uninstall add-ons from Gmail (see UNINSTALL_GUIDE.md)');
  console.log('2. Then run this script to open each project for deletion\n');
  
  const proceed = await question('Have you uninstalled the add-ons from Gmail? (yes/no): ');
  
  if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
    console.log('\n📋 Please first uninstall add-ons from Gmail:');
    console.log('1. Open Gmail');
    console.log('2. Click the puzzle piece icon (Add-ons)');
    console.log('3. Click "Manage add-ons"');
    console.log('4. Uninstall each unwanted add-on\n');
    rl.close();
    return;
  }
  
  console.log('\n🔗 Opening each project for manual deletion...\n');
  console.log('For each project that opens:');
  console.log('1. Click "Project Settings" (gear icon)');
  console.log('2. Scroll to bottom');
  console.log('3. Click "Delete project"');
  console.log('4. Type DELETE to confirm\n');
  
  const openAll = await question('Open all projects for deletion? (yes/no): ');
  
  if (openAll.toLowerCase() === 'yes' || openAll.toLowerCase() === 'y') {
    for (const project of OLD_PROJECTS) {
      console.log(`\n📂 Opening: ${project.name}`);
      const url = `https://script.google.com/d/${project.id}/edit`;
      
      // Open in browser
      const openCommand = process.platform === 'darwin' 
        ? `open "${url}"`
        : process.platform === 'win32'
        ? `start "${url}"`
        : `xdg-open "${url}"`;
      
      try {
        execSync(openCommand);
        console.log(`   ✓ Opened: ${url}`);
        
        // Wait a bit between opens to not overwhelm browser
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log(`   ✗ Failed to open: ${url}`);
      }
    }
    
    console.log('\n✅ All projects opened!');
    console.log('📋 Remember to delete each project manually in the browser.\n');
  } else {
    console.log('\n📋 Manual URLs for deletion:');
    OLD_PROJECTS.forEach(project => {
      console.log(`\n${project.name}:`);
      console.log(`https://script.google.com/d/${project.id}/edit`);
    });
  }
  
  console.log('\n🎯 After deletion, only "Answer As Me 3" should remain!');
  console.log('   You can verify with: npx clasp list\n');
  
  rl.close();
}

main().catch(console.error);
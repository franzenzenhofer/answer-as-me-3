#!/usr/bin/env node

/**
 * Strip header from bundled code file
 * Removes any existing deployment headers to prevent duplication
 */

const fs = require('fs');

if (process.argv.length < 3) {
  console.error('Usage: strip-header.js <file>');
  process.exit(1);
}

const filePath = process.argv[2];

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let startIndex = 0;
  let inHeader = false;
  
  // Look for the pattern of header comments
  for (let i = 0; i < lines.length && i < 30; i++) {
    const line = lines[i];
    
    // Check if we're in a header comment block
    if (line.startsWith('/**')) {
      inHeader = true;
    } else if (inHeader && line.includes('*/')) {
      // Found end of header
      startIndex = i + 1;
      
      // Skip any following const DEPLOYMENT_ lines
      while (startIndex < lines.length) {
        const nextLine = lines[startIndex];
        if (nextLine.startsWith('const DEPLOYMENT_') || 
            nextLine.trim() === '' ||
            nextLine.trim() === '"use strict";') {
          startIndex++;
        } else {
          break;
        }
      }
      break;
    }
  }
  
  // Output the content without header
  const strippedContent = lines.slice(startIndex).join('\n');
  process.stdout.write(strippedContent);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
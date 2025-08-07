#!/usr/bin/env node

/**
 * Clean distribution directory script
 * Removes all generated files from dist/
 */

const fs = require('fs');
const path = require('path');

function cleanDist() {
  const distDir = path.join(__dirname, '..', '..', 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.log('✅ dist/ directory does not exist, nothing to clean');
    return;
  }

  console.log('🧹 Cleaning dist/ directory...');

  // Remove all files except .clasp.json (if exists)
  try {
    const files = fs.readdirSync(distDir);
    let cleaned = 0;
    
    files.forEach(file => {
      if (file === '.clasp.json') {
        console.log('📌 Preserving .clasp.json');
        return;
      }
      
      const filePath = path.join(distDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively remove directories
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`  Removed directory: ${file}/`);
      } else {
        fs.unlinkSync(filePath);
        console.log(`  Removed file: ${file}`);
      }
      cleaned++;
    });
    
    console.log(`✅ Cleaned ${cleaned} items from dist/`);
  } catch (error) {
    console.error('❌ Error cleaning dist/:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  cleanDist();
}

module.exports = { cleanDist };
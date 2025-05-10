#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - adjust these to match your needs
const CONFIG = {
  title: "My Documentation",
  //sourceDir: path.join(__dirname, './templates/default/layouts'), // Where your docs are local testing
  //outputFile: path.join(__dirname, './templates/default/sidebar.json'), // Where to save local testing

  sourceDir: path.join(__dirname, '../../templates/default/layouts'), // Where your docs are for npm pagekage installed
  outputFile: path.join(__dirname, '../../templates/default/sidebar.json'), // Where to save for npm pagekage installed
  exclude: ['_partials', 'components', 'assets', '.DS_Store'],
  fileExtensions: ['.md', '.html'],
  defaultItems: [
    {
      text: "Home",
      link: "/",
      icon: "home"
    }
  ]
};

async function generateSidebar() {
  console.log('Starting sidebar generation...');
  console.log(`Source directory: ${CONFIG.sourceDir}`);
  console.log(`Output file: ${CONFIG.outputFile}`);

  try {
    // 1. Verify source directory exists
    try {
      await fs.access(CONFIG.sourceDir);
      console.log('✓ Source directory exists');
    } catch {
      console.error('× Source directory does not exist!');
      throw new Error(`Source directory not found: ${CONFIG.sourceDir}`);
    }

    // 2. Create basic sidebar structure
    const sidebar = {
      title: CONFIG.title,
      items: [...CONFIG.defaultItems],
      generatedAt: new Date().toISOString()
    };

    // 3. Process files and directories
    console.log('\nScanning directory structure...');
    await processDirectory(CONFIG.sourceDir, sidebar.items, '');

    // 4. Save the sidebar
    await fs.mkdir(path.dirname(CONFIG.outputFile), { recursive: true });
    await fs.writeFile(CONFIG.outputFile, JSON.stringify(sidebar, null, 2));
    
    console.log('\n✅ Successfully generated sidebar with:');
    console.log(`- ${sidebar.items.length} top-level items`);
    console.log(`- Saved to: ${CONFIG.outputFile}`);
    
    return sidebar;
  } catch (error) {
    console.error('\n❌ Sidebar generation failed:', error.message);
    throw error;
  }
}

async function processDirectory(currentDir, parentItems, currentPath) {
  try {
    const items = await fs.readdir(currentDir, { withFileTypes: true });
    console.log(`\nProcessing: ${currentPath || '/'} (${items.length} items)`);

    for (const item of items) {
      // Skip excluded items and hidden files
      if (CONFIG.exclude.includes(item.name)) {
        console.log(`  - Skipping excluded: ${item.name}`);
        continue;
      }
      if (item.name.startsWith('.')) {
        console.log(`  - Skipping hidden: ${item.name}`);
        continue;
      }

      const itemPath = path.join(currentDir, item.name);
      const relativePath = path.join(currentPath, item.name.replace(/\..+$/, ''));

      if (item.isDirectory()) {
        console.log(`  + Directory: ${item.name}`);
        
        const newItem = {
          text: formatName(item.name),
          link: `/${relativePath}`,
          icon: 'folder',
          items: []
        };
        parentItems.push(newItem);
        
        await processDirectory(itemPath, newItem.items, relativePath);
      } 
      else if (item.isFile() && CONFIG.fileExtensions.some(ext => item.name.endsWith(ext))) {
        // Skip index files (they're represented by their directory)
        if (item.name.match(/^_?index\./i)) {
          console.log(`  - Skipping index file: ${item.name}`);
          continue;
        }

        console.log(`  + File: ${item.name}`);
        parentItems.push({
          text: formatName(item.name.replace(/\..+$/, '')),
          link: `/${relativePath}`,
          icon: 'file'
        });
      }
    }

    // Sort items alphabetically
    parentItems.sort((a, b) => a.text.localeCompare(b.text));
  } catch (error) {
    console.error(`Error processing ${currentDir}:`, error.message);
  }
}

function formatName(name) {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Run immediately if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSidebar()
    .then(() => console.log('\nSidebar generation complete!'))
    .catch(() => process.exit(1));
}

export default {
  generateSidebar
};
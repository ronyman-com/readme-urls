#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  title: "My Documentation",
  sourceDir: path.join(__dirname, '../../../../templates/default/layouts'),
  outputFile: path.join(__dirname, '../../../../templates/default/sidebar.json'),
  exclude: ['_partials', 'components', 'assets', '.DS_Store'],
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

  try {
    // Verify source directory exists
    await fs.access(CONFIG.sourceDir);
    console.log('✓ Source directory exists');

    const sidebar = {
      title: CONFIG.title,
      items: [...CONFIG.defaultItems],
      generatedAt: new Date().toISOString()
    };

    console.log('\nScanning directory structure...');
    await processDirectory(CONFIG.sourceDir, sidebar.items, '');

    // Save the sidebar
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

    for (const item of items) {
      // Skip excluded items and hidden files
      if (CONFIG.exclude.includes(item.name) || item.name.startsWith('.')) {
        continue;
      }

      const itemPath = path.join(currentDir, item.name);
      const baseName = item.name.replace(/\.md$/, '');
      const relativePath = path.join(currentPath, baseName);

      if (item.isDirectory()) {
        const newItem = {
          text: formatName(item.name),
          link: `/${relativePath}`,
          icon: 'folder',
          items: []
        };
        
        await processDirectory(itemPath, newItem.items, relativePath);
        
        // Only add directory if it has items or an index file
        if (newItem.items.length > 0 || await hasIndexFile(itemPath)) {
          parentItems.push(newItem);
        }
      } 
      else if (item.isFile() && item.name.endsWith('.md')) {
        // Skip index files (they're represented by their directory)
        if (isIndexFile(item.name)) continue;
        
        parentItems.push({
          text: formatName(baseName),
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

async function hasIndexFile(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    return files.some(file => isIndexFile(file));
  } catch {
    return false;
  }
}

function isIndexFile(filename) {
  return /^_?index\.md$/i.test(filename);
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
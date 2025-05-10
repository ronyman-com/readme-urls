#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptConfirm(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

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
  
  try {
    try {
      await fs.access(CONFIG.sourceDir);
    } catch {
      console.error('Source directory not found!');
      const shouldContinue = await promptConfirm('Continue with empty sidebar?');
      if (!shouldContinue) {
        console.log('Generation canceled');
        process.exit(0);
      }
    }

    const sidebar = {
      title: CONFIG.title,
      items: [...CONFIG.defaultItems],
      generatedAt: new Date().toISOString()
    };

    if (await fs.access(CONFIG.sourceDir).then(() => true).catch(() => false)) {
      console.log('Scanning directory structure...');
      await processDirectory(CONFIG.sourceDir, sidebar.items, '');
    }

    try {
      await fs.access(CONFIG.outputFile);
      const overwrite = await promptConfirm('Sidebar.json already exists. Overwrite?');
      if (!overwrite) {
        console.log('Generation canceled');
        process.exit(0);
      }
    } catch {}

    await fs.mkdir(path.dirname(CONFIG.outputFile), { recursive: true });
    await fs.writeFile(CONFIG.outputFile, JSON.stringify(sidebar, null, 2));
    console.log('✅ Successfully generated sidebar');
    
    return sidebar;
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    throw error;
  } finally {
    rl.close();
  }
}

async function processDirectory(currentDir, parentItems, currentPath) {
  try {
    const items = await fs.readdir(currentDir, { withFileTypes: true });

    for (const item of items) {
      if (CONFIG.exclude.includes(item.name) || item.name.startsWith('.')) {
        continue;
      }

      const itemPath = path.join(currentDir, item.name);
      const baseName = item.name.replace(/\.md$/, '');
      // Convert path to use forward slashes
      const relativePath = path.join(currentPath, baseName).replace(/\\/g, '/');

      if (item.isDirectory()) {
        const newItem = {
          text: formatName(item.name),
          link: `/${relativePath}${await hasIndexFile(itemPath) ? '/index' : ''}`,
          icon: 'folder',
          items: []
        };
        
        await processDirectory(itemPath, newItem.items, relativePath);
        
        if (newItem.items.length > 0 || await hasIndexFile(itemPath)) {
          parentItems.push(newItem);
        }
      } 
      else if (item.isFile() && item.name.endsWith('.md')) {
        // For index files, we now include them but with '/index' path
        if (isIndexFile(item.name)) {
          parentItems.push({
            text: formatName(baseName),
            link: `/${currentPath.replace(/\\/g, '/')}/index`,
            icon: 'file'
          });
          continue;
        }
        parentItems.push({
          text: formatName(baseName),
          link: `/${relativePath}`,
          icon: 'file'
        });
      }
    }

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
  return filename.toLowerCase() === 'index.md' || filename.toLowerCase() === 'readme.md';
}

function formatName(name) {
  return name
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}


if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSidebar()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default {
  generateSidebar,
  promptConfirm
};
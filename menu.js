import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default configuration
const DEFAULT_CONFIG = {
  title: "Documentation Navigation",
  exclude: ['_partials', 'components', 'includes', 'assets', '.DS_Store'],
  iconMappings: {
    'home': 'home',
    'about': 'info-circle',
    'blog': 'newspaper',
    'contact': 'envelope',
    'products': 'box',
    'services': 'server',
    'docs': 'book',
    'pages': 'file-alt',
    'index': 'home',
    'readme': 'info-circle',
    'license': 'file-contract',
    'changelog': 'history',
    '_index': 'folder'
  },
  defaultFolderIcon: 'folder',
  defaultFileIcon: 'file-alt',
  textOverrides: {
    '_index': 'Overview',
    'index': 'Home',
    'readme': 'Read Me'
  }
};

// Path configuration
const BASE_DIR = process.cwd();
const LAYOUTS_DIR = path.join(BASE_DIR, 'templates/default/layouts');
const SIDEBAR_PATH = path.join(BASE_DIR, 'templates/sidebar.json');

/**
 * Ensure directory exists (fs/promises version)
 */
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

/**
 * Check if path exists
 */
async function pathExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate complete menu structure
 */
export async function generateMenuStructure() {
  const menu = {
    title: DEFAULT_CONFIG.title,
    menu: [],
    items: [],
    generatedAt: new Date().toISOString()
  };

  // Add mandatory home item
  const homeItem = {
    title: "Home",
    text: "Home",
    path: "/",
    link: "/",
    icon: "home",
    exact: true
  };
  menu.menu.push(homeItem);
  menu.items.push(homeItem);

  try {
    if (!await pathExists(LAYOUTS_DIR)) {
      console.warn(`Layouts directory not found: ${LAYOUTS_DIR}`);
      return menu;
    }

    const dirents = await fs.readdir(LAYOUTS_DIR, { withFileTypes: true });
    console.log(`Found ${dirents.length} items in layouts directory`);

    for (const dirent of dirents) {
      try {
        if (dirent.isDirectory() && !DEFAULT_CONFIG.exclude.includes(dirent.name)) {
          const menuItem = await processDirectory(dirent.name, path.join(LAYOUTS_DIR, dirent.name));
          if (menuItem) {
            menu.menu.push(menuItem);
            menu.items.push(menuItem);
          }
        } else if (isValidFile(dirent)) {
          const fileItem = processFile(dirent.name, '');
          if (fileItem) {
            menu.menu.push(fileItem);
            menu.items.push(fileItem);
          }
        }
      } catch (error) {
        console.error(`Error processing ${dirent.name}:`, error);
      }
    }

    // Add mandatory changelog
    if (!menu.items.some(item => item.link === '/changelog')) {
      menu.items.push({
        title: 'Change Log',
        text: 'Change Log',
        path: '/changelog.md',
        link: '/changelog',
        icon: 'history'
      });
    }

    return menu;
  } catch (error) {
    console.error('Error generating menu structure:', error);
    return menu;
  }
}

/**
 * Process directory with async/await
 */
async function processDirectory(dirName, dirPath) {
  const menuItem = {
    title: formatName(dirName),
    text: formatName(dirName),
    path: `/${dirName}`,
    link: `/${dirName}`,
    icon: getIcon(dirName, 'folder'),
    items: [],
    children: []
  };

  try {
    const contents = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const dirent of contents) {
      try {
        if (dirent.isDirectory()) {
          const subItem = await processDirectory(dirent.name, path.join(dirPath, dirent.name));
          if (subItem) {
            menuItem.items.push(subItem);
            menuItem.children.push(subItem);
          }
        } else if (isValidFile(dirent)) {
          const fileItem = processFile(dirent.name, dirName);
          if (fileItem) {
            menuItem.items.push(fileItem);
            menuItem.children.push(fileItem);
          }
        }
      } catch (error) {
        console.error(`Error processing ${dirent.name} in ${dirName}:`, error);
      }
    }

    if (menuItem.items.length === 0) {
      menuItem.items.push({
        title: 'Overview',
        text: 'Overview',
        path: `/${dirName}/_index.md`,
        link: `/${dirName}`,
        icon: 'folder-open'
      });
    }

    return menuItem;
  } catch (error) {
    console.error(`Error processing directory ${dirName}:`, error);
    return null;
  }
}

/**
 * Process file (sync as it doesn't need I/O)
 */
function processFile(fileName, parentDir = '') {
  const baseName = path.basename(fileName, path.extname(fileName));
  if (baseName === '_index') return null;

  const linkPath = parentDir ? `/${parentDir}/${baseName}` : `/${baseName}`;
  
  return {
    title: formatName(baseName),
    text: formatName(baseName),
    path: parentDir ? `/${parentDir}/${baseName}.md` : `/${baseName}.md`,
    link: linkPath,
    icon: getIcon(baseName)
  };
}

/**
 * Update sidebar.json with async file operations
 */
export async function updateSidebar() {
  try {
    console.log('Starting sidebar generation...');
    const menu = await generateMenuStructure();
    
    if (!menu.items || menu.items.length === 0) {
      console.warn('Generated empty menu, adding default items');
      menu.items.push({
        title: 'Home',
        path: '/',
        link: '/',
        icon: 'home'
      });
    }
    
    await ensureDir(path.dirname(SIDEBAR_PATH));
    await fs.writeFile(SIDEBAR_PATH, JSON.stringify(menu, null, 2));
    console.log(`Successfully wrote sidebar to ${SIDEBAR_PATH}`);
    
    return menu;
  } catch (error) {
    console.error('Failed to update sidebar:', error);
    throw error;
  }
}

// Helper functions
function formatName(name) {
  return DEFAULT_CONFIG.textOverrides[name] || 
    name.replace(/[-_]/g, ' ')
       .replace(/\b\w/g, l => l.toUpperCase());
}

function getIcon(name, type = 'file') {
  const lowerName = name.toLowerCase();
  return DEFAULT_CONFIG.iconMappings[lowerName] || 
    (type === 'folder' ? DEFAULT_CONFIG.defaultFolderIcon : DEFAULT_CONFIG.defaultFileIcon);
}

function isValidFile(dirent) {
  return dirent.isFile() && /\.(html|md)$/i.test(dirent.name);
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateSidebar()
    .then(() => console.log('Sidebar generation complete'))
    .catch(err => {
      console.error('Sidebar generation failed:', err);
      process.exit(1);
    });
}

export default {
  generateMenuStructure,
  updateSidebar,
  DEFAULT_CONFIG
};
const fs = require('fs').promises;
const path = require('path');

async function getPackageInfo() {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkgContent = await fs.readFile(pkgPath, 'utf8');
    return JSON.parse(pkgContent);
  } catch (error) {
    throw new Error(`Could not read package.json: ${error.message}`);
  }
}

function keywordsToTags(keywords = []) {
  if (!Array.isArray(keywords)) return '';
  return keywords.join(', ');
}

function generateDescription(name, keywords = []) {
  const baseDescription = `The ${name} npm package`;
  if (!keywords.length) return baseDescription;
  
  return `${baseDescription} provides ${keywords.slice(0, 3).join(', ')} and more.`;
}

module.exports = {
  getPackageInfo,
  keywordsToTags,
  generateDescription
};
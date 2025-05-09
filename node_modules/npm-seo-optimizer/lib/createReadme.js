const fs = require('fs').promises;
const path = require('path');
const { compile } = require('handlebars');

async function enhanceReadme(pkgInfo, metadata) {
  try {
    // Load the template
    const templatePath = path.join(__dirname, '../templates/seo-readme.md');
    const templateContent = await fs.readFile(templatePath, 'utf8');
    
    // Compile template with Handlebars
    const template = compile(templateContent);
    
    // Merge package info with SEO metadata
    const context = { ...pkgInfo, seo: metadata };
    
    // Generate enhanced README
    const enhancedReadme = template(context);
    
    // Write to README.md
    await fs.writeFile('README.md', enhancedReadme);
  } catch (error) {
    throw new Error(`Failed to enhance README: ${error.message}`);
  }
}

module.exports = { enhanceReadme };
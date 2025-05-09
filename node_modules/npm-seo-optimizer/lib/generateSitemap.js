const fs = require('fs').promises;
const { getPackageInfo } = require('./utils');

async function generateSitemap(pkgInfo) {
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.npmjs.com/package/${pkgInfo.name}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

  try {
    await fs.writeFile('sitemap.xml', sitemapContent);
  } catch (error) {
    throw new Error(`Failed to generate sitemap: ${error.message}`);
  }
}

module.exports = { generateSitemap };
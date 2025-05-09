const { generateSEOMetadata } = require('./lib/generateMetadata');
const { enhanceReadme } = require('./lib/createReadme');
const { generateSitemap } = require('./lib/generateSitemap');
const { getPackageInfo } = require('./lib/utils');

async function optimizeSEO() {
  try {
    // Get package info
    const pkgInfo = await getPackageInfo();
    
    // Generate SEO metadata
    const metadata = generateSEOMetadata(pkgInfo);
    
    // Enhance README with SEO content
    await enhanceReadme(pkgInfo, metadata);
    
    // Generate sitemap.xml
    await generateSitemap(pkgInfo);
    
    console.log('✅ SEO optimization complete!');
    console.log('🔍 Your package is now more discoverable by search engines');
  } catch (error) {
    console.error('❌ SEO optimization failed:', error.message);
  }
}

module.exports = optimizeSEO;
const { keywordsToTags, generateDescription } = require('./utils');

function generateSEOMetadata(pkgInfo) {
  const { name, description, keywords, author, version } = pkgInfo;
  
  // Generate SEO title
  const seoTitle = `${name} - ${description || 'npm package'} | v${version}`;
  
  // Generate meta description if not provided
  const metaDescription = description || generateDescription(name, keywords);
  
  // Convert keywords to SEO tags
  const seoTags = keywordsToTags(keywords);
  
  // Generate canonical URL
  const canonicalUrl = `https://www.npmjs.com/package/${name}`;
  
  return {
    title: seoTitle,
    description: metaDescription,
    keywords: seoTags,
    canonicalUrl,
    author: author || '',
    ogTitle: seoTitle,
    ogDescription: metaDescription,
    ogUrl: canonicalUrl,
    ogType: 'software',
    twitterCard: 'summary',
    twitterCreator: author || '',
  };
}

module.exports = { generateSEOMetadata };
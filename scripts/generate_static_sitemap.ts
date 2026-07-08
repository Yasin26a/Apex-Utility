import * as fs from 'fs';
import * as path from 'path';
import { SEO_H1_MAPPING } from '../src/seo-mapping';
import { AT_LEAST_20_ARTICLES } from '../src/data/articles';
import { generate100ViralArticles } from '../src/data/viral100Articles';
import { generate100Volume2Articles } from '../src/data/viral100Volume2Articles';
import { viralArticles } from '../src/data/viralArticles';
import { REDDIT_50_TOPICS } from '../src/data/reddit50Articles';
import { ADDITIONAL_35_ARTICLES } from '../src/data/additional35Articles';

function generateSitemap() {
  const baseUrl = 'https://apexutility.live';
  
  // Dynamically extract all tools mapped in SEO_H1_MAPPING (excluding the main home 'dashboard')
  const tools = Object.keys(SEO_H1_MAPPING)
    .filter(key => key !== 'dashboard')
    .sort();

  const today = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // 1. Home path
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>1.00</priority>\n';
  xml += '  </url>\n';

  // 2. Add each dynamic tool route
  tools.forEach(tool => {
    const isLegal = ['privacy-policy', 'terms-of-service', 'about-us'].includes(tool);
    const isHighPriority = ['sitemap-generator', 'sitemap-seo', 'seo-optimizer', 'guides'].includes(tool);
    
    const prio = isLegal ? '0.40' : (isHighPriority ? '0.90' : '0.80');
    const freq = isLegal ? 'monthly' : 'weekly';
    
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/${tool}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${freq}</changefreq>\n`;
    xml += `    <priority>${prio}</priority>\n`;
    xml += '  </url>\n';
  });

  // 3. Add all unique editorial, viral, and dynamic articles
  const seenArticleIds = new Set<string>();
  
  const addArticle = (art: any) => {
    if (art && art.id) {
      const cleanId = art.id.trim();
      if (cleanId && !seenArticleIds.has(cleanId)) {
        seenArticleIds.add(cleanId);
        
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/${cleanId}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.75</priority>\n';
        xml += '  </url>\n';
      }
    }
  };

  // Process standard articles
  if (Array.isArray(AT_LEAST_20_ARTICLES)) {
    AT_LEAST_20_ARTICLES.forEach(addArticle);
  }
  
  // Process viral articles (Volume 1)
  if (typeof generate100ViralArticles === 'function') {
    try {
      generate100ViralArticles().forEach(addArticle);
    } catch (e) {
      console.warn('Could not load generate100ViralArticles:', e);
    }
  }

  // Process viral articles (Volume 2)
  if (typeof generate100Volume2Articles === 'function') {
    try {
      generate100Volume2Articles().forEach(addArticle);
    } catch (e) {
      console.warn('Could not load generate100Volume2Articles:', e);
    }
  }

  // Process core trending viral articles
  if (Array.isArray(viralArticles)) {
    viralArticles.forEach(addArticle);
  }

  // Process Reddit authority topics
  if (Array.isArray(REDDIT_50_TOPICS)) {
    REDDIT_50_TOPICS.forEach(addArticle);
  }

  // Process additional educational articles
  if (Array.isArray(ADDITIONAL_35_ARTICLES)) {
    ADDITIONAL_35_ARTICLES.forEach(addArticle);
  }

  // 4. Add Apex Subdomains for indexing
  const subdomains = [
    'https://news.apexutility.live/',
    'https://www.smallpdf.com.apexutility.live/',
    'https://pdf.apexutility.live/',
    'https://png.apexutility.live/',
    'https://utility.apexutility.live/',
    'https://jpg2pdf.com.apexutility.live/',
    'https://json.apexutility.live/',
    'https://ilovepdf.com.apexutility.live/',
    'https://www.apexutility.live/',
    'https://beta.apexutility.live/',
    'https://apex.apexutility.live/',
    'https://jpg.apexutility.live/',
    'https://apexutility.com.apexutility.live/',
    'https://ai.apexutility.live/',
    'https://docs.apexutility.live/',
    'https://image.apexutility.live/',
    'https://blog.apexutility.live/',
    'https://www.ilovepdf.com.apexutility.live/',
    'https://seo.apexutility.live/',
    'https://qrcode.apexutility.live/',
    'https://regex.apexutility.live/',
    'https://audio.apexutility.live/',
    'https://video.apexutility.live/',
    'https://dev.apexutility.live/',
    'https://tools.apexutility.live/',
    'https://api.apexutility.live/',
    'https://converter.apexutility.live/',
    'https://design.apexutility.live/',
    'https://sketch.apexutility.live/',
    'https://analytics.apexutility.live/',
    'https://cloud.apexutility.live/'
  ];

  subdomains.forEach(sub => {
    xml += '  <url>\n';
    xml += `    <loc>${sub}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.60</priority>\n';
    xml += '  </url>\n';
  });

  xml += '</urlset>\n';

  const outputDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  
  const urlCount = (xml.match(/<url>/g) || []).length;
  console.log(`Successfully compiled dynamic high-visibility sitemap with ${urlCount} URLs to "${outputPath}"!`);
}

generateSitemap();

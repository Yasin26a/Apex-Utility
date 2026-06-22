import * as fs from 'fs';
import * as path from 'path';
import { AT_LEAST_20_ARTICLES } from '../src/data/articles';

function generateSitemap() {
  const baseUrl = 'https://apexutility.live';
  
  const tools = [
    'compress-pdf', 'webp-converter', 'json-beautifier', 
    'sitemap-seo', 'sitemap-generator', 'image-to-pdf', 'join-pdf', 'ai-writer', 
    'password-generator', 'qr-generator', 'unit-converter', 'svg-rasterizer', 'batch-processor', 'json-diff', 'secure-hash', 'color-palette', 'digital-signature', 'seo-optimizer', 'base64-converter', 'regex-tester', 'csv-json-converter', 'image-compressor', 'rich-text-stats', 'audio-trimmer', 'ai-transcriber', 'pdf-analyst', 'exif-stripper', 'video-recorder', 'image-vectorizer', 'code-snapshot', 'private-sketchpad', 'case-converter', 'lorem-generator', 'image-cropper', 'date-calculator', 'privacy-policy', 'terms-of-service', 'about-us', 'guides', 'content-planner', 'schema-generator', 'content-gap', 'keyword-cluster'
  ].sort(); // Keep it sorted for clean diffs

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

  // 3. Add all editorial articles (200 articles!)
  if (Array.isArray(AT_LEAST_20_ARTICLES)) {
    AT_LEAST_20_ARTICLES.forEach(art => {
      if (art && art.id) {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/guides?id=${encodeURIComponent(art.id)}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.75</priority>\n';
        xml += '  </url>\n';
      }
    });
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
  console.log(`Successfully compiled physical sitemap with 274 URLs to "${outputPath}"!`);
}

generateSitemap();

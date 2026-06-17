import express from 'express';
import path from 'path';

async function createServer() {
  const app = express();
  const port = 3000;

  // JSON and URL-encoded body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API endpoints
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Serve a dynamically generated, search-crawler compliant sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    const host = req.headers.host || 'apexutility.live';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;
    
    const tools = [
      'compress-pdf', 'webp-converter', 'json-beautifier', 
      'sitemap-seo', 'sitemap-generator', 'image-to-pdf', 'join-pdf', 'ai-writer', 
      'password-generator', 'qr-generator', 'unit-converter', 'svg-rasterizer', 'batch-processor', 'json-diff', 'secure-hash', 'color-palette', 'digital-signature', 'seo-optimizer', 'base64-converter', 'regex-tester', 'csv-json-converter', 'image-compressor', 'rich-text-stats', 'audio-trimmer', 'ai-transcriber', 'pdf-analyst', 'exif-stripper', 'video-recorder', 'image-vectorizer', 'code-snapshot', 'private-sketchpad', 'case-converter', 'lorem-generator', 'image-cropper', 'date-calculator', 'privacy-policy', 'terms-of-service', 'about-us', 'guides'
    ];

    const today = new Date().toISOString().split('T')[0];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // 1. Add home path
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

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server starting on port ${port} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

createServer().catch((err) => {
  console.error('Error starting server:', err);
});

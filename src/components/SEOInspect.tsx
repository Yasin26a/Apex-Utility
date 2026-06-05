import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, Download, Check, Copy, Code, Sparkles, FileText, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';

export default function SEOInspect() {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const websiteUrl = 'https://apex-pdf.cloudflare.dev';
  const currentDateISO = '2026-06-05';

  // Sitemap XML markup string
  const xmlSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- PRIMARY PORT OPERATIONS DECK -->
  <url>
    <loc>${websiteUrl}/</loc>
    <lastmod>${currentDateISO}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.00</priority>
  </url>

  <!-- DOCUMENT OPTIMIZATION RESUMES COMPRESSOR -->
  <url>
    <loc>${websiteUrl}/pdf-document-optimizer/compress-pdf</loc>
    <lastmod>${currentDateISO}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>

  <!-- MEDIA PRODUCTION INSTANT WEBPE CONVERTER -->
  <url>
    <loc>${websiteUrl}/media-producer-toolkit/webp-converter</loc>
    <lastmod>${currentDateISO}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>

  <!-- DEVELOPER UTILITIES JSON FORMATTER & PARSER -->
  <url>
    <loc>${websiteUrl}/developer-utilities/json-beautifier</loc>
    <lastmod>${currentDateISO}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>
</urlset>`;

  // Robots.txt content string
  const robotsTxt = `# APEX UTILITY Crawler Instructions
User-agent: *
Allow: /

Sitemap: ${websiteUrl}/sitemap.xml`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-12">
      {/* Header Info Banner */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-rose-500/15 border border-rose-500/25 text-rose-400 text-xs font-mono font-bold uppercase">
          <Cpu className="w-3.5 h-3.5" />
          <span>SEO Optimization Engine Active</span>
        </div>
        <h1 className="font-heading text-3xl font-black text-white tracking-tight">
          Automated Dynamic Sitemap Generator
        </h1>
        <p className="font-sans text-sm text-[#94a3b8] max-w-2xl leading-relaxed">
          Technical SEO monitoring center. Preview and download pristine search-compliant crawl arrays configured to optimize sitemap indexings across Cloudflare edges instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* SITEMAP.XML PREVIEW PANEL */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-rose-500" />
              <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider">sitemap.xml Output</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(xmlSitemap, 'sitemap')}
                className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-white rounded bg-zinc-900 border border-zinc-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedIndex === 'sitemap' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedIndex === 'sitemap' ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => triggerDownload(xmlSitemap, 'sitemap.xml', 'text/xml')}
                className="px-2.5 py-1 text-[10px] font-mono text-rose-400 hover:text-rose-300 rounded bg-rose-950/15 border border-rose-500/20 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Export XML</span>
              </button>
            </div>
          </div>

          <div className="beveled-panel p-5 bg-[#08080c] border-rose-950/10 min-h-[350px] relative max-h-[450px] overflow-auto">
            <pre className="font-mono text-[11px] text-zinc-400 leading-normal whitespace-pre">
              <code>{xmlSitemap}</code>
            </pre>
          </div>
        </div>

        {/* ROBOTS.TXT PREVIEW PANEL & SEO STATS */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-500" />
                <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider">robots.txt Instructions</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(robotsTxt, 'robots')}
                  className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-white rounded bg-zinc-900 border border-zinc-800 flex items-center gap-1 cursor-pointer"
                >
                  {copiedIndex === 'robots' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedIndex === 'robots' ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => triggerDownload(robotsTxt, 'robots.txt', 'text/plain')}
                  className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-white rounded bg-zinc-900 border border-zinc-800 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Export TXT</span>
                </button>
              </div>
            </div>

            <div className="beveled-panel p-5 bg-[#08080c] border-zinc-900 min-h-[120px] overflow-auto">
              <pre className="font-mono text-[11px] text-zinc-400 leading-normal whitespace-pre">
                <code>{robotsTxt}</code>
              </pre>
            </div>
          </div>

          {/* Crawler Priority Matrix & Recommendations */}
          <div className="beveled-panel p-6 border-rose-950/15 bg-rose-950/[0.03] space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-rose-540 text-rose-500" />
              <h4 className="font-heading text-xs font-bold text-rose-400 uppercase tracking-widest">Dynamic Priority Directives</h4>
            </div>
            
            <p className="font-sans text-xs text-zinc-400 leading-relaxed">
              Crawlers rank resources based on strict weighting patterns. Our index maps have locked the optimization routes with high priority scores:
            </p>

            <ul className="space-y-3 font-mono text-[10px]">
              <li className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-900">
                <span className="text-zinc-550">HOMEPAGE CORE:</span>
                <span className="text-emerald-400 font-bold">Priority: 1.00 (Weekly)</span>
              </li>
              <li className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-900">
                <span className="text-zinc-550">PDF OPTIMIZATION RESUMES:</span>
                <span className="text-zinc-350">Priority: 0.85 (Weekly)</span>
              </li>
              <li className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-900">
                <span className="text-zinc-550">WEBP IMAGE RASTERIZER:</span>
                <span className="text-zinc-350">Priority: 0.85 (Weekly)</span>
              </li>
              <li className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-900">
                <span className="text-zinc-550">JSON SWISS PARSER:</span>
                <span className="text-zinc-350">Priority: 0.75 (Weekly)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

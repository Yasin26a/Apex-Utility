import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, FileCode, Plus, Trash2, Download, Copy, Check, Settings, 
  HelpCircle, RefreshCw, CheckCircle2, Sparkles, Info, Calendar, 
  ArrowRight, FileText, Sliders, Shield, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SitemapRoute {
  id: string;
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number; // 0.0 to 1.0
  lastmodEnabled: boolean;
  lastmodDate: string;
}

const PRESET_PACKS = [
  {
    name: 'Minimal Core',
    desc: 'Basic routes for standard sites',
    routes: [
      { path: '/', changefreq: 'weekly', priority: 1.0 },
      { path: '/about', changefreq: 'monthly', priority: 0.8 },
      { path: '/contact', changefreq: 'monthly', priority: 0.8 }
    ]
  },
  {
    name: 'SaaS Platform',
    desc: 'Ready for product, billing & auth',
    routes: [
      { path: '/', changefreq: 'weekly', priority: 1.0 },
      { path: '/features', changefreq: 'weekly', priority: 0.9 },
      { path: '/pricing', changefreq: 'weekly', priority: 0.9 },
      { path: '/blog', changefreq: 'daily', priority: 0.8 },
      { path: '/login', changefreq: 'monthly', priority: 0.5 },
      { path: '/register', changefreq: 'monthly', priority: 0.5 },
      { path: '/docs', changefreq: 'weekly', priority: 0.7 }
    ]
  },
  {
    name: 'E-Commerce Store',
    desc: 'Catalog, shopping cart & checkout',
    routes: [
      { path: '/', changefreq: 'daily', priority: 1.0 },
      { path: '/shop', changefreq: 'daily', priority: 0.9 },
      { path: '/categories', changefreq: 'weekly', priority: 0.8 },
      { path: '/products', changefreq: 'daily', priority: 0.9 },
      { path: '/cart', changefreq: 'monthly', priority: 0.3 },
      { path: '/checkout', changefreq: 'monthly', priority: 0.3 },
      { path: '/terms', changefreq: 'yearly', priority: 0.4 }
    ]
  }
];

export default function SitemapGenerator() {
  const { t } = useLanguage();
  
  // State variables
  const [baseUrl, setBaseUrl] = useState('https://example.com');
  const [routes, setRoutes] = useState<SitemapRoute[]>([
    { id: '1', path: '/', changefreq: 'weekly', priority: 1.0, lastmodEnabled: true, lastmodDate: new Date().toISOString().split('T')[0] },
    { id: '2', path: '/about', changefreq: 'monthly', priority: 0.8, lastmodEnabled: true, lastmodDate: new Date().toISOString().split('T')[0] },
    { id: '3', path: '/contact', changefreq: 'monthly', priority: 0.8, lastmodEnabled: true, lastmodDate: new Date().toISOString().split('T')[0] }
  ]);

  // Form states for adding a new route
  const [newPath, setNewPath] = useState('');
  const [newFreq, setNewFreq] = useState<'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'>('weekly');
  const [newPriority, setNewPriority] = useState(0.8);
  const [includeLastmod, setIncludeLastmod] = useState(true);

  // Global settings toggles
  const [globalIncludeLastmod, setGlobalIncludeLastmod] = useState(true);
  const [globalIncludeChangefreq, setGlobalIncludeChangefreq] = useState(true);
  const [globalIncludePriority, setGlobalIncludePriority] = useState(true);
  const [formatBeautify, setFormatBeautify] = useState(true);

  // UI state
  const [copied, setCopied] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Clean the base URL
  const cleanedBaseUrl = useMemo(() => {
    let url = baseUrl.trim();
    if (!url) return 'https://example.com';
    // Ensure protocol
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    // Remove trailing slash
    return url.replace(/\/+$/, '');
  }, [baseUrl]);

  // Handle URL changes
  const addRoute = (pathStr: string, freq: typeof newFreq, prio: number) => {
    let cleanPath = pathStr.trim();
    if (!cleanPath) return;
    
    // Formatting: ensure starting slash
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }

    // Check duplicate
    if (routes.some(r => r.path === cleanPath)) {
      setCopiedNotice(`Route "${cleanPath}" already exists.`);
      setTimeout(() => setCopiedNotice(null), 3000);
      return;
    }

    const newRouteItem: SitemapRoute = {
      id: Math.random().toString(36).substring(2, 9),
      path: cleanPath,
      changefreq: freq,
      priority: Math.min(Math.max(prio, 0.0), 1.0),
      lastmodEnabled: true,
      lastmodDate: new Date().toISOString().split('T')[0]
    };

    setRoutes(prev => [...prev, newRouteItem]);
    setNewPath('');
  };

  // Add a route using UI input
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRoute(newPath, newFreq, newPriority);
  };

  const removeRoute = (id: string) => {
    if (routes.length <= 1) {
      setCopiedNotice('Minimum of 1 route required.');
      setTimeout(() => setCopiedNotice(null), 3000);
      return;
    }
    setRoutes(prev => prev.filter(r => r.id !== id));
  };

  const clearAllRoutes = () => {
    setRoutes([{ id: '1', path: '/', changefreq: 'weekly', priority: 1.0, lastmodEnabled: true, lastmodDate: new Date().toISOString().split('T')[0] }]);
  };

  // Pre-load preset packs
  const applyPreset = (presetRoutes: { path: string; changefreq: string; priority: number }[]) => {
    const today = new Date().toISOString().split('T')[0];
    const mapped = presetRoutes.map((r, index) => ({
      id: `preset_${index}_${Math.random().toString(36).substring(2, 5)}`,
      path: r.path,
      changefreq: r.changefreq as any,
      priority: r.priority,
      lastmodEnabled: true,
      lastmodDate: today
    }));
    setRoutes(mapped);
  };

  // XML Sitemap compilation block
  const generatedXml = useMemo(() => {
    const lines: string[] = [];
    
    if (formatBeautify) {
      lines.push('<?xml version="1.0" encoding="UTF-8"?>');
      lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      
      routes.forEach(route => {
        lines.push('  <url>');
        lines.push(`    <loc>${cleanedBaseUrl}${route.path}</loc>`);
        
        if (globalIncludeLastmod && route.lastmodEnabled) {
          lines.push(`    <lastmod>${route.lastmodDate}</lastmod>`);
        }
        if (globalIncludeChangefreq) {
          lines.push(`    <changefreq>${route.changefreq}</changefreq>`);
        }
        if (globalIncludePriority) {
          lines.push(`    <priority>${route.priority.toFixed(2)}</priority>`);
        }
        
        lines.push('  </url>');
      });
      
      lines.push('</urlset>');
      return lines.join('\n');
    } else {
      // Minified XML format
      let mini = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
      routes.forEach(route => {
        mini += '<url>';
        mini += `<loc>${cleanedBaseUrl}${route.path}</loc>`;
        if (globalIncludeLastmod && route.lastmodEnabled) {
          mini += `<lastmod>${route.lastmodDate}</lastmod>`;
        }
        if (globalIncludeChangefreq) {
          mini += `<changefreq>${route.changefreq}</changefreq>`;
        }
        if (globalIncludePriority) {
          mini += `<priority>${route.priority.toFixed(2)}</priority>`;
        }
        mini += '</url>';
      });
      mini += '</urlset>';
      return mini;
    }
  }, [routes, cleanedBaseUrl, globalIncludeLastmod, globalIncludeChangefreq, globalIncludePriority, formatBeautify]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerDownload = () => {
    const blob = new Blob([generatedXml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Use clear domain name file handle
    const domainPart = cleanedBaseUrl.replace(/^https?:\/\/(www\.)?/i, '').replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.download = `sitemap_${domainPart || 'web'}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const xmlSizeKb = useMemo(() => {
    const bytes = new Blob([generatedXml]).size;
    return (bytes / 1024).toFixed(2);
  }, [generatedXml]);

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Header Panel */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-brand/10 border border-brand/20 text-brand text-xs font-mono font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SEO Engine Toolkit Active</span>
        </div>
        <h1 className="font-heading text-3xl font-black text-white tracking-tight">
          Primiun XML Sitemap Generator
        </h1>
        <p className="font-sans text-sm text-zinc-400 max-w-3xl leading-relaxed">
          Compile standard-compliant crawl maps to configure dynamic indexes across search spiders instantly. Fully running locally in-browser with customizable priorities, change cycles, and downloadable XML files.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Base URL & Global Config Card */}
          <div className="beveled-panel bg-[#09090d]/95 p-6 border-brand-border/40 space-y-4 shadow-xl">
            <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand" />
              <span>Target Website Configuration</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest block mb-1.5 font-semibold">Web Portal Base URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 font-mono text-xs">
                    URL:
                  </div>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://mywebsite.com"
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-lg pl-12 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand/55 focus:ring-1 focus:ring-brand/30 font-sans transition-all"
                  />
                </div>
                <p className="text-[10px] font-sans text-zinc-500 mt-1 dark:text-zinc-500">
                  Calculated location references will prepend: <span className="text-zinc-400 font-mono select-all bg-zinc-950 px-1 py-0.5 rounded">{cleanedBaseUrl}</span>
                </p>
              </div>

              {/* Global XML Directive Elements */}
              <div className="pt-2 border-t border-zinc-900/60 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Element Schemas</span>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={globalIncludeLastmod}
                        onChange={(e) => setGlobalIncludeLastmod(e.target.checked)}
                        className="rounded bg-zinc-950 border-zinc-900 text-brand focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-brand"
                      />
                      <span>Include &lt;lastmod&gt; parameters</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={globalIncludeChangefreq}
                        onChange={(e) => setGlobalIncludeChangefreq(e.target.checked)}
                        className="rounded bg-zinc-950 border-zinc-900 text-brand focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-brand"
                      />
                      <span>Include &lt;changefreq&gt; frequency</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={globalIncludePriority}
                        onChange={(e) => setGlobalIncludePriority(e.target.checked)}
                        className="rounded bg-zinc-950 border-zinc-900 text-brand focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-brand"
                      />
                      <span>Include &lt;priority&gt; elements</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Style Formatting</span>
                  <div className="space-y-1.5 text-xs text-zinc-400">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="layout"
                        checked={formatBeautify}
                        onChange={() => setFormatBeautify(true)}
                        className="accent-brand cursor-pointer"
                      />
                      <span>Pretty Indented Layout (Prestige XML)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="layout"
                        checked={!formatBeautify}
                        onChange={() => setFormatBeautify(false)}
                        className="accent-brand cursor-pointer"
                      />
                      <span>Compact Payload Minification (Production)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Preset Packs */}
          <div className="beveled-panel bg-[#09090d]/95 p-6 border-brand-border/40 space-y-3 shadow-xl">
            <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand" />
              <span>Apply Dynamic Preset Packs</span>
            </h3>
            <p className="font-sans text-xs text-zinc-400 leading-normal">
              Need to populate common pages? Choose a preset ecosystem pack to instantly prefill your sitemap directory structure.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {PRESET_PACKS.map((pack) => (
                <button
                  key={pack.name}
                  onClick={() => applyPreset(pack.routes)}
                  className="p-3 text-left bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-brand/30 rounded-lg cursor-pointer transition-all space-y-1 active:scale-95 text-xs"
                >
                  <div className="font-bold text-zinc-200">{pack.name}</div>
                  <div className="text-[10px] text-zinc-500 leading-tight">{pack.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Route Listing and Editing table */}
          <div className="beveled-panel bg-[#09090d]/95 p-6 border-brand-border/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-brand" />
                <span>Mapped Directory Routes ({routes.length})</span>
              </h3>
              <button
                onClick={clearAllRoutes}
                className="text-[9px] font-mono text-zinc-500 hover:text-red-400 uppercase tracking-widest cursor-pointer transition-all"
              >
                Clear all except root
              </button>
            </div>

            {/* List and add block */}
            <div className="space-y-4">
              
              {/* Insert Route Form */}
              <form onSubmit={handleAddSubmit} className="p-3 rounded-lg bg-zinc-950 border border-zinc-900 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                <div className="md:col-span-5">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Crawl Path</label>
                  <input
                    type="text"
                    required
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                    placeholder="/portfolio/services"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-brand/40 font-mono"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Frequency</label>
                  <select
                    value={newFreq}
                    onChange={(e) => setNewFreq(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    <option value="always">Always</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="never">Never</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Priority ({newPriority.toFixed(1)})</label>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.1"
                    value={newPriority}
                    onChange={(e) => setNewPriority(parseFloat(e.target.value))}
                    className="w-full accent-brand h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer mb-2.5"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-brand hover:bg-brand-hover text-zinc-950 hover:text-zinc-900 font-mono text-xs font-bold py-2 rounded flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ADD</span>
                  </button>
                </div>
              </form>

              {copiedNotice && (
                <div className="text-[10px] font-mono text-rose-400 bg-rose-950/20 border border-rose-950/40 p-2 rounded text-center uppercase tracking-wider">
                  {copiedNotice}
                </div>
              )}

              {/* Scrollable routes grid */}
              <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
                {routes.map((route) => (
                  <div 
                    key={route.id} 
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all font-mono text-xs gap-3"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white max-w-xs break-all flex items-center gap-1.5">
                        <span className="text-zinc-500 text-[10px]">LOC:</span>
                        <span>{route.path}</span>
                      </div>
                      <div className="flex gap-3 text-[10px] text-zinc-500">
                        <span>Freq: <span className="text-zinc-300 capitalize">{route.changefreq}</span></span>
                        <span>Priority: <span className="text-brand font-bold">{route.priority.toFixed(1)}</span></span>
                        <span>Date: <span className="text-zinc-400">{route.lastmodDate}</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                      {/* Interactive inline selectors */}
                      <select
                        value={route.changefreq}
                        onChange={(e) => {
                          const updated = routes.map(r => r.id === route.id ? { ...r, changefreq: e.target.value as any } : r);
                          setRoutes(updated);
                        }}
                        className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                      >
                        <option value="always">Always</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="never">Never</option>
                      </select>

                      <input
                        type="number"
                        min="0.0"
                        max="1.0"
                        step="0.1"
                        value={route.priority}
                        onChange={(e) => {
                          const val = Math.min(Math.max(parseFloat(e.target.value) || 0.0, 0.0), 1.0);
                          const updated = routes.map(r => r.id === route.id ? { ...r, priority: val } : r);
                          setRoutes(updated);
                        }}
                        className="bg-zinc-900 border border-zinc-800 text-[10px] text-center text-zinc-200 rounded w-11 py-0.5"
                      />

                      <button
                        onClick={() => removeRoute(route.id)}
                        className="p-1 text-zinc-600 hover:text-red-400 rounded transition-all cursor-pointer"
                        title="Delete path reference"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

        {/* Right column previewing Generated output (5 cols) */}
        <div className="lg:col-span-5 space-y-6 text-xs">
          
          {/* Quick Metrics stats block */}
          <div className="grid grid-cols-2 gap-4">
            <div className="beveled-panel bg-[#09090d]/95 p-4 border-brand-border/40 text-center space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total Index URLs</div>
              <div className="font-heading text-2xl font-black text-brand">{routes.length}</div>
            </div>
            <div className="beveled-panel bg-[#09090d]/95 p-4 border-brand-border/40 text-center space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Payload Weight</div>
              <div className="font-heading text-2xl font-black text-white">{xmlSizeKb} KB</div>
            </div>
          </div>

          {/* XML Output Panel */}
          <div className="beveled-panel bg-[#09090d]/95 p-6 border-brand-border/40 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900/60">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-brand" />
                <span className="font-heading text-xs font-bold text-white uppercase tracking-wider">sitemap.xml Output</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-white rounded bg-zinc-900 border border-zinc-800 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={triggerDownload}
                  className="px-2.5 py-1 text-[10px] font-mono text-brand hover:text-brand-hover rounded bg-brand/10 hover:bg-brand/20 border border-brand/20 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* XML Document Renderer block */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg max-h-[340px] overflow-auto relative">
              <pre className="font-mono text-[10.5px] text-zinc-400 select-all leading-normal whitespace-pre">
                <code>{generatedXml}</code>
              </pre>
            </div>
          </div>

          {/* Guidelines & SEO Crawl Optimization Checklist */}
          <div className="beveled-panel bg-[#09090d]/95 p-6 border-brand-border/40 space-y-4">
            <h4 className="font-heading text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand" />
              <span>Sitemap SEO Audit Checklist</span>
            </h4>
            <div className="space-y-3 font-sans text-zinc-400 text-[11px] leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-zinc-200">Submit sitemap to Google Search Console</strong>
                  <p className="text-zinc-500 text-[10px]">Navigate to Crawl &gt; Sitemaps, enter its location (e.g., /sitemap.xml), and trigger index verification.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-zinc-200">Point to your map in robots.txt</strong>
                  <p className="text-zinc-500 text-[10px]">Ensure your robots.txt directory contains the directive: <span className="font-mono text-[9px] text-[#22c55e]">Sitemap: {cleanedBaseUrl}/sitemap.xml</span></p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-zinc-200">Keep links under 50,000 URLs</strong>
                  <p className="text-zinc-500 text-[10px]">Standard XML index restrictions cap size at 50,000 links or 50MB. If exceeded, split into nested indices.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

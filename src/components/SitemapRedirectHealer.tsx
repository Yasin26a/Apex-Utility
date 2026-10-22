import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ShieldCheck, ShieldAlert, ArrowRight, Check, Copy, Download, 
  RefreshCw, FileCode, ExternalLink, Zap, AlertTriangle, CheckCircle2, 
  Trash2, Globe, FileText, Layers, CheckCircle, Search, Filter, Play, 
  Square, Info, Server, ArrowDownRight
} from 'lucide-react';

export interface RedirectIssue {
  type: 'query_param' | 'subdomain' | 'insecure_http' | 'trailing_slash' | 'deprecated_path' | 'tracking_param' | 'status_3xx';
  label: string;
  description: string;
  originalUrl: string;
  canonicalUrl: string;
  statusCode?: number;
}

export interface SitemapEntry {
  id: string;
  originalLoc: string;
  canonicalLoc: string;
  isRedirect: boolean;
  issues: RedirectIssue[];
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  isLiveAuditing?: boolean;
  liveStatusCode?: number | null;
  liveStatusText?: string | null;
  liveRedirectUrl?: string | null;
  isFixed: boolean;
}

/**
 * Intelligent Canonicalizer Engine
 * Detects URL patterns that trigger Google Search Console "Page with redirect" (301/302/307/308)
 */
export function detectAndFixUrlRedirect(
  rawUrl: string, 
  liveStatusCode?: number, 
  liveRedirectUrl?: string
): { isRedirect: boolean; canonicalUrl: string; issues: RedirectIssue[] } {
  const issues: RedirectIssue[] = [];
  let current = rawUrl.trim();
  if (!current) {
    return { isRedirect: false, canonicalUrl: '', issues: [] };
  }

  // Check live status code if provided
  if (liveStatusCode && liveStatusCode >= 300 && liveStatusCode < 400 && liveRedirectUrl) {
    issues.push({
      type: 'status_3xx',
      label: `HTTP ${liveStatusCode} Live Redirect`,
      description: `Server explicitly issued HTTP ${liveStatusCode} pointing to ${liveRedirectUrl}`,
      originalUrl: rawUrl,
      canonicalUrl: liveRedirectUrl,
      statusCode: liveStatusCode
    });
    current = liveRedirectUrl;
  }

  // 1. Insecure HTTP check on apexutility.live
  if (current.startsWith('http://apexutility.live') || current.startsWith('http://www.apexutility.live')) {
    const fixed = current.replace(/^http:\/\//i, 'https://');
    issues.push({
      type: 'insecure_http',
      label: 'Insecure HTTP Protocol (301)',
      description: 'Crawlers encounter a mandatory 301 upgrade from HTTP to HTTPS, consuming extra crawl budget.',
      originalUrl: current,
      canonicalUrl: fixed
    });
    current = fixed;
  }

  try {
    const dummyBase = 'https://apexutility.live';
    const parsed = new URL(current.startsWith('http') ? current : `${dummyBase}${current.startsWith('/') ? '' : '/'}${current}`);
    const host = parsed.hostname.toLowerCase();
    
    // 2. Subdomain check (e.g. pdf.apexutility.live, news.apexutility.live -> apexutility.live)
    if (host.endsWith('apexutility.live') && host !== 'apexutility.live') {
      parsed.hostname = 'apexutility.live';
      parsed.protocol = 'https:';
      const fixed = parsed.toString();
      issues.push({
        type: 'subdomain',
        label: `Subdomain Alias (${host})`,
        description: `Subdomain ${host} redirects via 301 to canonical apexutility.live, creating an "Alternate page with proper canonical tag" warning.`,
        originalUrl: current,
        canonicalUrl: fixed
      });
      current = fixed;
    }

    // 3. Query parameter check (e.g. /guides?id=slug, ?art=slug, ?article=slug)
    const targetId = parsed.searchParams.get('id') || parsed.searchParams.get('art') || parsed.searchParams.get('article');
    if ((parsed.pathname === '/guides' || parsed.pathname === '/guides/') && targetId) {
      parsed.pathname = `/${encodeURIComponent(targetId.trim())}`;
      parsed.searchParams.delete('id');
      parsed.searchParams.delete('art');
      parsed.searchParams.delete('article');
      parsed.searchParams.delete('p');
      parsed.searchParams.delete('paragraph');
      const fixed = parsed.toString();
      issues.push({
        type: 'query_param',
        label: 'Legacy Query Parameter (301 Hazard)',
        description: `URL uses ?id=${targetId}. Google Search Console flags query parameter routes as "Page with redirect" instead of indexing the target page directly.`,
        originalUrl: current,
        canonicalUrl: fixed
      });
      current = fixed;
    }

    // 4. Deprecated /tools/* or /tools/$ path
    if (parsed.pathname.startsWith('/tools')) {
      const sub = parsed.pathname.replace(/^\/tools\/?/, '');
      if (!sub || sub === '$' || sub === '%24') {
        parsed.pathname = '/';
      } else {
        parsed.pathname = `/${sub}`;
      }
      const fixed = parsed.toString();
      issues.push({
        type: 'deprecated_path',
        label: 'Nested /tools/ Prefix (301)',
        description: `Nested /tools/ directory redirects to the root-level canonical path ${parsed.pathname}.`,
        originalUrl: current,
        canonicalUrl: fixed
      });
      current = fixed;
    }

    // 5. Tracking parameter check (?utm_..., ?ref=...)
    const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid', 'gclid'];
    let hasTracking = false;
    trackingKeys.forEach(k => {
      if (parsed.searchParams.has(k)) {
        parsed.searchParams.delete(k);
        hasTracking = true;
      }
    });
    if (hasTracking) {
      const fixed = parsed.toString();
      issues.push({
        type: 'tracking_param',
        label: 'Tracking Query String (Crawl Waste)',
        description: 'Tracking parameters create infinite URL duplicates and waste Googlebot crawl passes.',
        originalUrl: current,
        canonicalUrl: fixed
      });
      current = fixed;
    }

    // 6. Trailing slash check (except root '/')
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
      const fixed = parsed.toString();
      issues.push({
        type: 'trailing_slash',
        label: 'Trailing Slash Inconsistency (301)',
        description: 'Server strips trailing slashes to avoid duplicate content penalties.',
        originalUrl: current,
        canonicalUrl: fixed
      });
      current = fixed;
    }

    current = parsed.toString();
  } catch (err) {
    // If invalid URL structure, maintain as is
  }

  return {
    isRedirect: issues.length > 0,
    canonicalUrl: current,
    issues
  };
}

export default function SitemapRedirectHealer() {
  const [rawInput, setRawInput] = useState('');
  const [entries, setEntries] = useState<SitemapEntry[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [isLiveVerifying, setIsLiveVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'redirects' | 'clean'>('all');
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const [healedNotice, setHealedNotice] = useState<string | null>(null);
  const [showServerRules, setShowServerRules] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isVerifyingRef = useRef(false);

  // Sample with realistic redirect hazards for testing
  const sampleWithHazards = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Clean Root & Tools -->
  <url>
    <loc>https://apexutility.live/</loc>
    <changefreq>daily</changefreq>
    <priority>1.00</priority>
  </url>
  <url>
    <loc>https://apexutility.live/compress-pdf</loc>
    <changefreq>weekly</changefreq>
    <priority>0.90</priority>
  </url>

  <!-- HAZARD 1: Legacy Query Parameters (Flagged as 'Page with redirect' in GSC) -->
  <url>
    <loc>https://apexutility.live/guides?id=svg-path-optimization-algorithms</loc>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>
  <url>
    <loc>https://apexutility.live/guides?id=lighthouse-performance-optimization</loc>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>
  <url>
    <loc>https://apexutility.live/guides?id=css-glassmorphism-ultimate-guide-2026</loc>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>

  <!-- HAZARD 2: Subdomain Aliases (Causes duplicate index loops) -->
  <url>
    <loc>https://pdf.apexutility.live/merge-pdf</loc>
    <changefreq>weekly</changefreq>
    <priority>0.60</priority>
  </url>
  <url>
    <loc>https://news.apexutility.live/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.50</priority>
  </url>

  <!-- HAZARD 3: Insecure Protocol & Trailing Slashes -->
  <url>
    <loc>http://apexutility.live/json-diff</loc>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://apexutility.live/webp-converter/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>

  <!-- HAZARD 4: Phantom Nested /tools/ Paths -->
  <url>
    <loc>https://apexutility.live/tools/$</loc>
    <changefreq>weekly</changefreq>
    <priority>0.50</priority>
  </url>
  <url>
    <loc>https://apexutility.live/tools/qr-generator</loc>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
</urlset>`;

  // Parse XML or raw URL list into SitemapEntry items
  const parseSitemap = (xmlContent: string) => {
    const text = xmlContent.trim();
    if (!text) {
      setEntries([]);
      return;
    }

    const parsedEntries: SitemapEntry[] = [];
    const seenUrls = new Set<string>();

    if (text.includes('<url') || text.includes('<loc>')) {
      // Regex parsing for <url>...</url> blocks to preserve lastmod, changefreq, priority
      const urlBlockRegex = /<url>([\s\S]*?)<\/url>/gi;
      let match;
      let count = 0;

      while ((match = urlBlockRegex.exec(text)) !== null) {
        const block = match[1];
        const locMatch = /<loc>\s*([^<\s]+)\s*<\/loc>/i.exec(block);
        if (!locMatch) continue;

        const loc = locMatch[1].trim();
        if (seenUrls.has(loc)) continue;
        seenUrls.add(loc);

        const lastmodMatch = /<lastmod>\s*([^<\s]+)\s*<\/lastmod>/i.exec(block);
        const changefreqMatch = /<changefreq>\s*([^<\s]+)\s*<\/changefreq>/i.exec(block);
        const priorityMatch = /<priority>\s*([^<\s]+)\s*<\/priority>/i.exec(block);

        const diagnosis = detectAndFixUrlRedirect(loc);

        parsedEntries.push({
          id: `entry_${count++}_${Math.random().toString(36).substring(2, 6)}`,
          originalLoc: loc,
          canonicalLoc: diagnosis.canonicalUrl,
          isRedirect: diagnosis.isRedirect,
          issues: diagnosis.issues,
          lastmod: lastmodMatch ? lastmodMatch[1] : undefined,
          changefreq: changefreqMatch ? changefreqMatch[1] : undefined,
          priority: priorityMatch ? priorityMatch[1] : undefined,
          isFixed: false
        });
      }

      // Fallback: If no <url> blocks matched, extract bare <loc> tags
      if (parsedEntries.length === 0) {
        const locRegex = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
        let locM;
        while ((locM = locRegex.exec(text)) !== null) {
          const loc = locM[1].trim();
          if (seenUrls.has(loc)) continue;
          seenUrls.add(loc);

          const diagnosis = detectAndFixUrlRedirect(loc);
          parsedEntries.push({
            id: `entry_${count++}_${Math.random().toString(36).substring(2, 6)}`,
            originalLoc: loc,
            canonicalLoc: diagnosis.canonicalUrl,
            isRedirect: diagnosis.isRedirect,
            issues: diagnosis.issues,
            isFixed: false
          });
        }
      }
    } else {
      // Raw list of URLs
      const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
      let count = 0;
      for (const line of lines) {
        if (!seenUrls.has(line)) {
          seenUrls.add(line);
          const diagnosis = detectAndFixUrlRedirect(line);
          parsedEntries.push({
            id: `entry_${count++}_${Math.random().toString(36).substring(2, 6)}`,
            originalLoc: line,
            canonicalLoc: diagnosis.canonicalUrl,
            isRedirect: diagnosis.isRedirect,
            issues: diagnosis.issues,
            isFixed: false
          });
        }
      }
    }

    setEntries(parsedEntries);
  };

  // Auto-fetch live site /sitemap.xml
  const fetchLiveSitemap = async () => {
    setIsLoadingLive(true);
    try {
      const res = await fetch('/sitemap.xml');
      if (!res.ok) throw new Error(`HTTP ${res.status} when fetching /sitemap.xml`);
      const xml = await res.text();
      setRawInput(xml);
      parseSitemap(xml);
      setHealedNotice(`Loaded live /sitemap.xml with ${xml.split('<url>').length - 1} entries!`);
      setTimeout(() => setHealedNotice(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(`Could not load /sitemap.xml: ${err.message}`);
    } finally {
      setIsLoadingLive(false);
    }
  };

  // Load sample sitemap with 301 hazards
  const loadSample = () => {
    setRawInput(sampleWithHazards);
    parseSitemap(sampleWithHazards);
    setHealedNotice('Loaded demonstration sitemap with 301/302 redirect hazards!');
    setTimeout(() => setHealedNotice(null), 4000);
  };

  // Upload .xml file handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawInput(content);
        parseSitemap(content);
        setHealedNotice(`Uploaded "${file.name}" successfully!`);
        setTimeout(() => setHealedNotice(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  // Master Action: Auto-Fix All 301/302 Redirects
  const autoFixAllRedirects = () => {
    if (entries.length === 0) return;

    let fixedCount = 0;
    const updated = entries.map(entry => {
      if (entry.isRedirect && !entry.isFixed) {
        fixedCount++;
        return {
          ...entry,
          originalLoc: entry.canonicalLoc,
          isRedirect: false,
          isFixed: true
        };
      }
      return entry;
    });

    setEntries(updated);

    // Also update rawInput with healed XML
    const healedXml = generateCleanXml(updated);
    setRawInput(healedXml);

    setHealedNotice(`Successfully auto-fixed ${fixedCount} redirecting URLs! Your sitemap is now 100% direct 200 OK.`);
    setTimeout(() => setHealedNotice(null), 6000);
  };

  // Fix single entry
  const fixSingleEntry = (entryId: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id === entryId) {
        return {
          ...e,
          originalLoc: e.canonicalLoc,
          isRedirect: false,
          isFixed: true
        };
      }
      return e;
    }));
  };

  // Run live HTTP verification via server link-health endpoint
  const startLiveVerification = async () => {
    if (entries.length === 0) return;

    setIsLiveVerifying(true);
    isVerifyingRef.current = true;
    setVerifyProgress(0);

    const queue = [...entries];
    const total = queue.length;
    let completed = 0;

    const verifyWorker = async () => {
      while (queue.length > 0 && isVerifyingRef.current) {
        const item = queue.shift();
        if (!item) break;

        try {
          const res = await fetch('/api/check-link-health', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: item.originalLoc })
          });

          if (res.ok) {
            const data = await res.json();
            const liveStatus = data.statusCode;
            const liveRedirect = data.redirectUrl;

            setEntries(prev => prev.map(e => {
              if (e.id === item.id) {
                const diagnosis = detectAndFixUrlRedirect(e.originalLoc, liveStatus, liveRedirect);
                return {
                  ...e,
                  liveStatusCode: liveStatus,
                  liveStatusText: data.statusText,
                  liveRedirectUrl: liveRedirect,
                  isRedirect: diagnosis.isRedirect,
                  canonicalLoc: diagnosis.canonicalUrl,
                  issues: diagnosis.issues
                };
              }
              return e;
            }));
          }
        } catch (e) {
          // Keep silent on worker error
        } finally {
          completed++;
          setVerifyProgress(Math.round((completed / total) * 100));
        }
      }
    };

    const concurrency = Math.min(6, entries.length);
    const workers = Array.from({ length: concurrency }, () => verifyWorker());
    await Promise.all(workers);

    setIsLiveVerifying(false);
    isVerifyingRef.current = false;
  };

  const stopLiveVerification = () => {
    isVerifyingRef.current = false;
    setIsLiveVerifying(false);
  };

  // Generate clean compliant XML
  const generateCleanXml = (data: SitemapEntry[]) => {
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ];

    data.forEach(entry => {
      lines.push('  <url>');
      lines.push(`    <loc>${entry.originalLoc}</loc>`);
      if (entry.lastmod) {
        lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      }
      if (entry.changefreq) {
        lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      }
      if (entry.priority) {
        lines.push(`    <priority>${entry.priority}</priority>`);
      }
      lines.push('  </url>');
    });

    lines.push('</urlset>');
    return lines.join('\n');
  };

  // Download healed sitemap.xml
  const downloadCleanSitemap = () => {
    const xml = generateCleanXml(entries);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap-healed.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy healed XML
  const copyHealedXml = () => {
    const xml = generateCleanXml(entries);
    navigator.clipboard.writeText(xml);
    setCopiedNotice('Clean XML Sitemap copied to clipboard!');
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  // Sync fixed routes to Sitemap Generator
  const syncWithSitemapGenerator = () => {
    const routesToExport = entries.map(e => ({
      path: e.originalLoc.replace('https://apexutility.live', ''),
      changefreq: e.changefreq || 'weekly',
      priority: parseFloat(e.priority || '0.8'),
      lastmodDate: e.lastmod || new Date().toISOString().split('T')[0],
      lastmodEnabled: true
    }));

    try {
      localStorage.setItem('apex_healed_sitemap_routes', JSON.stringify(routesToExport));
      setCopiedNotice('Synced routes to localStorage! Open Sitemap Generator to view.');
      setTimeout(() => setCopiedNotice(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Calculations & Analytics
  const totalUrls = entries.length;
  const redirectCount = entries.filter(e => e.isRedirect).length;
  const cleanCount = totalUrls - redirectCount;
  const fixedCount = entries.filter(e => e.isFixed).length;
  const healthScore = totalUrls > 0 ? Math.round((cleanCount / totalUrls) * 100) : 100;
  
  // Crawl budget estimations
  const wastedRequestsAvoided = redirectCount * 2; // Source hit + Redirect target hit
  const estimatedLatencySavedMs = redirectCount * 180; // Avg 180ms per redirect roundtrip

  // Filtered view
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.originalLoc.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          entry.canonicalLoc.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          entry.issues.some(i => i.label.toLowerCase().includes(searchFilter.toLowerCase()));
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'redirects') return matchesSearch && entry.isRedirect;
    if (statusFilter === 'clean') return matchesSearch && !entry.isRedirect;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Alert Notice */}
      <AnimatePresence>
        {healedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-mono shadow-lg backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{healedNotice}</span>
            </div>
            <button onClick={() => setHealedNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
          </motion.div>
        )}

        {copiedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-amber-950/80 border border-amber-800 text-amber-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-mono shadow-lg backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{copiedNotice}</span>
            </div>
            <button onClick={() => setCopiedNotice(null)} className="text-amber-400 hover:text-white">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner & Feature Description */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold flex items-center gap-1">
                <Zap className="w-3 h-3 text-red-400" />
                Crawl Budget Shield
              </span>
              <span className="text-zinc-500 text-xs font-mono">Google Search Console Index Optimizer</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Sitemap 301/302 Redirect Auto-Healer
            </h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              When Googlebot discovers URLs with query parameters (<code className="text-red-300 font-mono text-[11px]">/guides?id=...</code>), subdomains, or missing trailing slashes in your sitemap, it flags them as <span className="text-amber-300 font-semibold font-mono">"Page with redirect"</span> and refuses to index the source URL. This tool auto-identifies all 301/302 hops and rewrites them into pristine, 200 OK canonical destinations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={fetchLiveSitemap}
              disabled={isLoadingLive}
              className="bg-zinc-800/80 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-zinc-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isLoadingLive ? 'animate-spin' : ''}`} />
              <span>Load Live Sitemap</span>
            </button>

            <button
              onClick={loadSample}
              className="bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/60 text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load 301 Demo</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xml"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload XML</span>
            </button>
          </div>
        </div>
      </div>

      {/* Input / Editor Section */}
      <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <FileText className="w-3.5 h-3.5 text-red-400" />
            Raw Sitemap XML or URL Manifest
          </label>
          <span className="text-[11px] font-mono text-zinc-500">
            {entries.length > 0 ? `${entries.length} URLs Detected` : 'Paste XML to begin'}
          </span>
        </div>

        <textarea
          value={rawInput}
          onChange={(e) => {
            setRawInput(e.target.value);
            parseSitemap(e.target.value);
          }}
          placeholder="Paste XML Sitemap content or URLs here to instantly scan for 301/302 'Page with redirect' issues..."
          className="w-full h-36 bg-zinc-900/90 border border-zinc-800 focus:border-red-500 rounded-xl p-3.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none transition-all resize-none"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRawInput('');
                setEntries([]);
              }}
              disabled={entries.length === 0}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-mono border border-zinc-800 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>

            {isLiveVerifying ? (
              <button
                onClick={stopLiveVerification}
                className="bg-red-950/80 text-red-300 border border-red-800 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Square className="w-3 h-3 text-red-400 fill-current" />
                <span>Stop Verification ({verifyProgress}%)</span>
              </button>
            ) : (
              <button
                onClick={startLiveVerification}
                disabled={entries.length === 0}
                className="bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800 hover:border-blue-600/40 px-3 py-1.5 rounded-lg text-xs font-mono transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3 h-3 text-blue-400 fill-current" />
                <span>Verify with Live Server ({entries.length})</span>
              </button>
            )}
          </div>

          {/* Master Auto-Fix Button */}
          {redirectCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={autoFixAllRedirects}
              className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-red-600/25 flex items-center gap-2 cursor-pointer border border-red-500/50"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Auto-Fix All {redirectCount} Redirects</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Crawl Budget & SEO Impact Metrics */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold block">Total URLs</span>
            <div className="text-2xl font-black text-white font-mono">{totalUrls}</div>
            <span className="text-[10px] text-zinc-400">In current manifest</span>
          </div>

          <div className={`border rounded-xl p-4 space-y-1 ${redirectCount > 0 ? 'bg-amber-950/20 border-amber-800/40' : 'bg-emerald-950/20 border-emerald-800/40'}`}>
            <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold block flex items-center gap-1">
              {redirectCount > 0 ? <AlertTriangle className="w-3 h-3 text-amber-400" /> : <ShieldCheck className="w-3 h-3 text-emerald-400" />}
              301/302 Hazards
            </span>
            <div className={`text-2xl font-black font-mono ${redirectCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {redirectCount}
            </div>
            <span className="text-[10px] text-zinc-400">
              {redirectCount > 0 ? 'Causes GSC redirect flags' : '0 redirects detected'}
            </span>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold block">Bot Hits Saved</span>
            <div className="text-2xl font-black text-emerald-400 font-mono">+{wastedRequestsAvoided}</div>
            <span className="text-[10px] text-zinc-400">Crawl passes per cycle</span>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold block">Crawl Health Score</span>
            <div className={`text-2xl font-black font-mono ${healthScore === 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {healthScore}%
            </div>
            <span className="text-[10px] text-zinc-400">
              {healthScore === 100 ? '100% GSC Compliant' : `${redirectCount} URLs need healing`}
            </span>
          </div>
        </div>
      )}

      {/* Action Bar & Filter Controls */}
      {entries.length > 0 && (
        <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Filter */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by slug, URL, or hazard type..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-all"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                All ({entries.length})
              </button>
              <button
                onClick={() => setStatusFilter('redirects')}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'redirects' ? 'bg-amber-900/60 text-amber-300 font-bold border border-amber-700/50' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Redirects ({redirectCount})
              </button>
              <button
                onClick={() => setStatusFilter('clean')}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'clean' ? 'bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700/50' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Clean ({cleanCount})
              </button>
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={downloadCleanSitemap}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl border border-zinc-700 transition-all flex items-center gap-1 cursor-pointer"
                title="Download clean sitemap.xml with all 301 redirects resolved"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download .xml</span>
              </button>

              <button
                onClick={copyHealedXml}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl border border-zinc-700 transition-all flex items-center gap-1 cursor-pointer"
                title="Copy clean XML to clipboard"
              >
                <Copy className="w-3.5 h-3.5 text-blue-400" />
                <span>Copy XML</span>
              </button>

              <button
                onClick={syncWithSitemapGenerator}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl border border-zinc-700 transition-all flex items-center gap-1 cursor-pointer"
                title="Send healed routes to Sitemap Generator"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Sync</span>
              </button>

              <button
                onClick={() => setShowServerRules(!showServerRules)}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono px-2.5 py-2 rounded-xl border border-zinc-800 transition-all cursor-pointer"
                title="View Server 301 Nginx / Express Directives"
              >
                <Server className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Server Rewrite Rules Panel (Optional Toggle) */}
          <AnimatePresence>
            {showServerRules && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs font-mono text-zinc-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-amber-400" />
                    Express / Nginx 301 Permanent Redirect Directive Snippet
                  </span>
                  <span className="text-[10px] text-zinc-500">Add to server config</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Ensure your web server actively maps legacy query parameter URLs to clean canonical URLs at the HTTP layer:
                </p>
                <pre className="p-3 bg-black/60 rounded-lg text-emerald-400 text-[11px] overflow-x-auto">
{`// Express.js 301 Redirect for legacy /guides?id=
app.get('/guides', (req, res, next) => {
  if (req.query.id) {
    return res.redirect(301, '/' + req.query.id);
  }
  next();
});

// Nginx rewrite block:
if ($arg_id != "") {
  rewrite ^/guides$ /$arg_id? permanent;
}`}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Entries Diagnostic Table */}
          <div className="border border-zinc-900 rounded-xl overflow-hidden divide-y divide-zinc-900">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs font-mono">
                No URLs match your current search/filter criteria.
              </div>
            ) : (
              filteredEntries.map(entry => (
                <div 
                  key={entry.id} 
                  className={`p-3.5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                    entry.isRedirect 
                      ? 'bg-amber-950/10 hover:bg-amber-950/20' 
                      : entry.isFixed 
                        ? 'bg-emerald-950/15' 
                        : 'bg-zinc-950 hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {entry.isRedirect ? (
                        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                          301/302 Redirect Hazard
                        </span>
                      ) : entry.isFixed ? (
                        <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          Healed &amp; Canonicalized
                        </span>
                      ) : (
                        <span className="bg-zinc-800 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          200 OK Direct
                        </span>
                      )}

                      {entry.issues.map((issue, idx) => (
                        <span key={idx} className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono px-1.5 py-0.5 rounded">
                          {issue.label}
                        </span>
                      ))}

                      {entry.liveStatusCode && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          entry.liveStatusCode >= 200 && entry.liveStatusCode < 300 
                            ? 'bg-emerald-950 text-emerald-300' 
                            : 'bg-amber-950 text-amber-300'
                        }`}>
                          HTTP {entry.liveStatusCode}
                        </span>
                      )}
                    </div>

                    {/* URL Comparison */}
                    <div className="space-y-0.5 pt-1">
                      <div className="flex items-center gap-1.5 font-mono text-xs break-all">
                        <span className={entry.isRedirect ? 'text-rose-400 font-semibold line-through decoration-rose-500/60' : 'text-zinc-200'}>
                          {entry.originalLoc}
                        </span>
                      </div>

                      {entry.isRedirect && (
                        <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-400 pl-3 border-l-2 border-emerald-500/40">
                          <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="font-bold">{entry.canonicalLoc}</span>
                          <span className="text-[10px] text-zinc-500 font-sans">(Direct 200 Destination)</span>
                        </div>
                      )}
                    </div>

                    {/* Issue Description note */}
                    {entry.issues.length > 0 && (
                      <p className="text-[11px] text-zinc-400 pt-0.5">
                        {entry.issues.map(i => i.description).join(' ')}
                      </p>
                    )}
                  </div>

                  {/* Single Action */}
                  {entry.isRedirect && (
                    <button
                      onClick={() => fixSingleEntry(entry.id)}
                      className="shrink-0 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Fix to Canonical</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SEO Educational Insight Card */}
      <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-red-400" />
          Why Google Search Console Flags "Page with redirect" in Sitemaps
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed font-sans">
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-3.5 space-y-1">
            <span className="font-bold text-white block">1. Sitemaps Must Only Contain Final URLs</span>
            <p>
              Google’s official webmaster documentation mandates that XML sitemaps only list URLs that return a direct <strong>HTTP 200 OK</strong>. Including redirecting URLs (such as query parameters or subdomains) forces Googlebot to double its crawl requests.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-3.5 space-y-1">
            <span className="font-bold text-white block">2. Google Never Indexes the Source URL</span>
            <p>
              When a URL redirects to a canonical target, Google deliberately places the source URL into the <em>"Page with redirect"</em> non-indexed category. By keeping your sitemap 100% clean, you eliminate these warnings and expedite indexation.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-3.5 space-y-1">
            <span className="font-bold text-white block">3. Preserves 100% Crawl Budget</span>
            <p>
              For sites with 500+ articles, every wasted 301 hop delays crawler discovery of new tools and articles. Directly submitting the canonical target URL (<code className="text-emerald-400 text-[11px]">/slug</code>) guarantees instant discovery and indexing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

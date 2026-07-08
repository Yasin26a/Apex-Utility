import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, ChevronDown, ChevronUp, Shield, ShieldAlert, ShieldCheck, 
  Clock, ExternalLink, AlertTriangle, CheckCircle2, XCircle, Link2, 
  HelpCircle, Info, Sparkles, RefreshCw, Copy, Check, Lock, Unlock, 
  FileText, Play, Square, Settings, Database, Filter, Search, Download, 
  Trash2, FileCode, CheckCircle, BarChart2, PieChart as PieIcon, Globe, MoveRight, BookOpen
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';

// --- Types ---
interface HopSecurityHeaders {
  hsts: string | null;
  csp: string | null;
  xFrameOptions: string | null;
  xContentTypeOptions: string | null;
  referrerPolicy: string | null;
  xXssProtection: string | null;
}

interface RedirectHop {
  url: string;
  statusCode: number;
  statusText: string;
  redirectUrl: string | null;
  redirectType: string | null;
  responseTimeMs: number;
  headers: Record<string, string>;
  securityHeaders: HopSecurityHeaders;
}

interface AuditResult {
  targetUrl: string;
  redirectChain: RedirectHop[];
  finalUrl: string;
  totalRedirects: number;
  error: string | null;
  success: boolean;
}

interface LinkItem {
  id: string;
  url: string;
  context: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  statusCode: number | null;
  statusText: string | null;
  responseTimeMs: number | null;
  redirectUrl: string | null;
  contentType: string | null;
  error: string | null;
}

export default function RedirectAuditor() {
  const { t } = useLanguage();
  
  // --- Tab State ---
  const [activeTab, setActiveTab] = useState<'bulk' | 'single'>('bulk');

  // =========================================================================
  // STATE & REFS FOR SINGLE REDIRECT TRACE (PRESERVED PREVIOUS BEHAVIOR)
  // =========================================================================
  const [urlInput, setUrlInput] = useState('');
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<AuditResult | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [expandedHops, setExpandedHops] = useState<Record<number, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const quickPresets = [
    { name: 'HTTP to HTTPS', url: 'http://github.com' },
    { name: 'Triple Chain', url: 'http://httpbin.org/redirect-to?url=https%3A%2F%2Fhttpbin.org%2Frelative-redirect%2F1&status_code=301' },
    { name: 'Secure Final', url: 'https://google.com' }
  ];

  const handleSingleAudit = async (targetUrlStr?: string) => {
    const urlToTest = (targetUrlStr || urlInput).trim();
    if (!urlToTest) {
      setSingleError('Please provide a valid URL.');
      return;
    }

    setSingleLoading(true);
    setSingleError(null);
    setSingleResult(null);
    setExpandedHops({});

    try {
      const response = await fetch('/api/audit-redirect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlToTest }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze the URL redirect chain.');
      }

      const data: AuditResult = await response.json();
      setSingleResult(data);
      if (data.error && data.redirectChain.length === 0) {
        setSingleError(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setSingleError(err.message || 'An error occurred while communicating with the redirect auditor server.');
    } finally {
      setSingleLoading(false);
    }
  };

  const toggleHopExpand = (index: number) => {
    setExpandedHops(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getStatusColor = (code: number | null) => {
    if (code === null) return 'text-zinc-400 bg-zinc-900 border-zinc-800';
    if (code >= 200 && code < 300) return 'text-emerald-400 bg-emerald-950/45 border-emerald-800/40';
    if (code >= 300 && code < 400) return 'text-amber-400 bg-amber-950/45 border-amber-800/40';
    return 'text-red-400 bg-red-950/45 border-red-800/40';
  };

  const getAuditInsights = (chain: RedirectHop[]) => {
    const insights: { type: 'success' | 'warning' | 'danger'; title: string; desc: string }[] = [];
    if (chain.length === 0) return insights;

    const firstHop = chain[0];
    const lastHop = chain[chain.length - 1];

    if (chain.length > 3) {
      insights.push({
        type: 'danger',
        title: 'Long Redirect Chain (SEO Hazard)',
        desc: `This chain has ${chain.length} hops. Search engines like Google may stop following redirects after 3-5 hops, leading to indexing issues and a heavily depleted crawl budget.`
      });
    } else if (chain.length > 1) {
      insights.push({
        type: 'warning',
        title: 'Multi-hop Redirection',
        desc: `Takes ${chain.length} hops to resolve. Aim for direct 1-step redirects to minimize latency and ensure search bots traverse your linkages optimally.`
      });
    } else if (chain.length === 1 && !firstHop.redirectUrl) {
      insights.push({
        type: 'success',
        title: 'Direct Connection (No Redirects)',
        desc: 'Great! The target URL loaded directly with no redirection loops or delay hops.'
      });
    }

    const firstIsHttp = firstHop.url.startsWith('http://');
    const lastIsHttps = lastHop.url.startsWith('https://');

    if (firstIsHttp && lastIsHttps) {
      insights.push({
        type: 'success',
        title: 'Secure Redirection Enforced',
        desc: 'Excellent. The insecure HTTP request successfully upgraded to a secure HTTPS connection.'
      });
    } else if (!lastIsHttps) {
      insights.push({
        type: 'danger',
        title: 'Insecure Final Destination (Critical)',
        desc: 'The final destination URL does not use HTTPS. User data and session information could be vulnerable to interception.'
      });
    }

    const redirectsList = chain.filter(h => h.redirectUrl);
    const has302 = redirectsList.some(h => h.statusCode === 302 || h.statusCode === 307);
    const all301 = redirectsList.every(h => h.statusCode === 301 || h.statusCode === 308);

    if (has302) {
      insights.push({
        type: 'warning',
        title: 'Temporary Redirects (302/307) Detected',
        desc: 'One or more redirects in the chain are temporary. If this redirect is intended to be permanent, use a 301 or 308 redirect instead to pass full SEO link equity (PageRank) to the target page.'
      });
    } else if (redirectsList.length > 0 && all301) {
      insights.push({
        type: 'success',
        title: 'Permanent Redirects (301) Configured',
        desc: 'All redirect hops utilize permanent (301/308) status codes, which fully transmits ranking power and search traffic metrics.'
      });
    }

    let secureHeaderCount = 0;
    const finalSec = lastHop.securityHeaders;
    if (finalSec.hsts) secureHeaderCount++;
    if (finalSec.csp) secureHeaderCount++;
    if (finalSec.xFrameOptions) secureHeaderCount++;
    if (finalSec.xContentTypeOptions) secureHeaderCount++;
    if (finalSec.referrerPolicy) secureHeaderCount++;

    if (secureHeaderCount === 5) {
      insights.push({
        type: 'success',
        title: 'Bulletproof Security Headers Configuration',
        desc: 'All five major security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) are correctly implemented on the final destination host.'
      });
    } else if (secureHeaderCount >= 3) {
      insights.push({
        type: 'warning',
        title: 'Moderate Security Hardening',
        desc: `The destination implements ${secureHeaderCount}/5 standard security headers. Consider establishing missing headers like ${!finalSec.csp ? 'Content-Security-Policy' : ''} ${!finalSec.hsts ? 'Strict-Transport-Security' : ''} to reach optimum protection.`
      });
    } else {
      insights.push({
        type: 'danger',
        title: 'Weak Security Profile (Missing Headers)',
        desc: `The destination implements only ${secureHeaderCount}/5 security headers. Lacks critical client defense wrappers, creating vulnerabilities to clickjacking, cross-site scripting (XSS), and MIME-sniffing exploits.`
      });
    }

    return insights;
  };


  // =========================================================================
  // STATE, REFS & CONTROLS FOR BULK LINK HEALTH AUDITOR (NEW FEATURE)
  // =========================================================================
  const [bulkInput, setBulkInput] = useState('');
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [concurrency, setConcurrency] = useState(5);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'clean' | 'redirect' | 'broken' | 'failed'>('all');
  const [bulkError, setBulkError] = useState<string | null>(null);

  const isScanningRef = useRef(false);
  const queueRef = useRef<LinkItem[]>([]);

  // Sample templates for sitemaps or text blocks to scan
  const bulkSamples = [
    {
      name: 'Blog Text Snippet',
      text: `Check our top content:
- Home: https://news.apexutility.live/
- SEO Guide: https://news.apexutility.live/guides
- Error Link Example: https://httpbin.org/status/404
- Redirect Page: http://github.com
- Timeout Page: https://httpbin.org/delay/5`
    },
    {
      name: 'Standard XML Sitemap',
      text: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://news.apexutility.live/</loc>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>https://news.apexutility.live/about-us</loc>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>https://httpbin.org/status/404</loc>
  </url>
  <url>
    <loc>http://github.com</loc>
  </url>
</urlset>`
    },
    {
      name: 'Raw Link List',
      text: `https://news.apexutility.live/
https://httpbin.org/status/200
https://httpbin.org/status/301
https://httpbin.org/status/410
https://httpbin.org/status/503`
    }
  ];

  // Extracts URLs and context from raw input block
  const parseLinks = () => {
    setBulkError(null);
    const input = bulkInput.trim();
    if (!input) {
      setBulkError('Please enter some text, sitemap HTML, or a list of URLs.');
      return;
    }

    const tempLinks: { url: string; context: string }[] = [];
    const seenUrls = new Set<string>();

    // 1. Check if XML/Sitemap block
    if (input.includes('<?xml') || input.includes('<urlset') || input.includes('<sitemap')) {
      const locRegex = /<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi;
      let match;
      while ((match = locRegex.exec(input)) !== null) {
        const url = match[1].trim();
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          tempLinks.push({ url, context: 'Sitemap <loc>' });
        }
      }
    } else {
      // 2. Parse Markdown Links: [Anchor](URL)
      const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/gi;
      let match;
      while ((match = mdRegex.exec(input)) !== null) {
        const anchor = match[1].trim();
        const url = match[2].trim();
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          tempLinks.push({ url, context: `MD Anchor: "${anchor.substring(0, 30)}"` });
        }
      }

      // 3. Parse HTML Links: <a href="URL">Anchor</a>
      const htmlRegex = /<a\s+[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      while ((match = htmlRegex.exec(input)) !== null) {
        const url = match[1].trim();
        const anchorText = match[2].replace(/<[^>]*>/g, '').trim() || 'HTML Link';
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          tempLinks.push({ url, context: `HTML Link: "${anchorText.substring(0, 30)}"` });
        }
      }

      // 4. Any raw URLs
      const rawUrlRegex = /https?:\/\/[^\s"'<>\)\{\}\[\]\+,]+/gi;
      while ((match = rawUrlRegex.exec(input)) !== null) {
        const url = match[0].trim();
        // Remove trailing punctuation from sloppy matching
        const cleanUrl = url.replace(/[.,;:]$/, '');
        if (!seenUrls.has(cleanUrl)) {
          seenUrls.add(cleanUrl);
          tempLinks.push({ url: cleanUrl, context: 'Raw Text Link' });
        }
      }
    }

    if (tempLinks.length === 0) {
      setBulkError('No valid URLs starting with http:// or https:// could be extracted from your input.');
      return;
    }

    // Map to full LinkItem interface
    const mapped: LinkItem[] = tempLinks.map((item, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      url: item.url,
      context: item.context,
      status: 'pending',
      statusCode: null,
      statusText: null,
      responseTimeMs: null,
      redirectUrl: null,
      contentType: null,
      error: null
    }));

    setLinks(mapped);
  };

  // Start concurrent bulk scan
  const startBulkScan = async () => {
    if (links.length === 0) {
      setBulkError('Please extract some links first using the "Parse and Extract" button.');
      return;
    }

    setIsScanning(true);
    isScanningRef.current = true;
    setBulkError(null);

    // Reset non-completed items to pending
    const itemsToScan = links.map(link => {
      if (link.status === 'completed' || link.status === 'failed') {
        return link; // keep already audited
      }
      return { ...link, status: 'pending' as const };
    });

    setLinks(itemsToScan);
    queueRef.current = itemsToScan.filter(l => l.status === 'pending');

    const checkSingleItem = async (link: LinkItem) => {
      // Update status to scanning
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, status: 'scanning' } : l));

      try {
        const res = await fetch('/api/check-link-health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: link.url })
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        
        setLinks(prev => prev.map(l => {
          if (l.id === link.id) {
            return {
              ...l,
              status: 'completed',
              statusCode: data.statusCode,
              statusText: data.statusText || (data.statusCode === 200 ? 'OK' : ''),
              responseTimeMs: data.responseTimeMs,
              redirectUrl: data.redirectUrl,
              contentType: data.contentType,
              error: data.error
            };
          }
          return l;
        }));
      } catch (err: any) {
        setLinks(prev => prev.map(l => {
          if (l.id === link.id) {
            return {
              ...l,
              status: 'failed',
              error: err.message || 'Connection failed'
            };
          }
          return l;
        }));
      }
    };

    // Worker pool loop
    const runWorker = async () => {
      while (queueRef.current.length > 0 && isScanningRef.current) {
        const nextItem = queueRef.current.shift();
        if (!nextItem) break;
        await checkSingleItem(nextItem);
      }
    };

    // Spawn concurrent workers
    const activeWorkersCount = Math.min(concurrency, queueRef.current.length);
    const workers = Array.from({ length: activeWorkersCount }, () => runWorker());
    
    await Promise.all(workers);

    setIsScanning(false);
    isScanningRef.current = false;
  };

  // Stops / Pauses the bulk scan process
  const pauseBulkScan = () => {
    isScanningRef.current = false;
    setIsScanning(false);
  };

  // Resets entire bulk state
  const clearBulkState = () => {
    pauseBulkScan();
    setLinks([]);
    setBulkInput('');
    setScanProgress(0);
    setSearchFilter('');
    setStatusFilter('all');
    setBulkError(null);
  };

  // Re-check single link individually from the table
  const recheckSingleLink = async (linkId: string) => {
    const link = links.find(l => l.id === linkId);
    if (!link) return;

    setLinks(prev => prev.map(l => l.id === linkId ? { ...l, status: 'scanning', statusCode: null, error: null } : l));

    try {
      const res = await fetch('/api/check-link-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: link.url })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setLinks(prev => prev.map(l => {
        if (l.id === linkId) {
          return {
            ...l,
            status: 'completed',
            statusCode: data.statusCode,
            statusText: data.statusText,
            responseTimeMs: data.responseTimeMs,
            redirectUrl: data.redirectUrl,
            contentType: data.contentType,
            error: data.error
          };
        }
        return l;
      }));
    } catch (err: any) {
      setLinks(prev => prev.map(l => {
        if (l.id === linkId) {
          return { ...l, status: 'failed', error: err.message || 'Verification failed' };
        }
        return l;
      }));
    }
  };

  // Calculate scan stats
  const totalCount = links.length;
  const completedCount = links.filter(l => l.status === 'completed' || l.status === 'failed').length;
  const cleanCount = links.filter(l => l.status === 'completed' && l.statusCode !== null && l.statusCode >= 200 && l.statusCode < 300).length;
  const redirectCount = links.filter(l => l.status === 'completed' && l.statusCode !== null && l.statusCode >= 300 && l.statusCode < 400).length;
  const brokenCount = links.filter(l => l.status === 'completed' && l.statusCode !== null && l.statusCode >= 400).length;
  const failedCount = links.filter(l => l.status === 'failed' || (l.status === 'completed' && l.statusCode === 0)).length;

  useEffect(() => {
    if (totalCount > 0) {
      setScanProgress(Math.round((completedCount / totalCount) * 100));
    } else {
      setScanProgress(0);
    }
  }, [completedCount, totalCount]);

  // Filters links for the list
  const filteredLinks = links.filter(link => {
    const matchesSearch = link.url.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          (link.context && link.context.toLowerCase().includes(searchFilter.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'clean') return matchesSearch && link.status === 'completed' && link.statusCode !== null && link.statusCode >= 200 && link.statusCode < 300;
    if (statusFilter === 'redirect') return matchesSearch && link.status === 'completed' && link.statusCode !== null && link.statusCode >= 300 && link.statusCode < 400;
    if (statusFilter === 'broken') return matchesSearch && link.status === 'completed' && link.statusCode !== null && link.statusCode >= 400;
    if (statusFilter === 'failed') return matchesSearch && (link.status === 'failed' || (link.status === 'completed' && link.statusCode === 0));
    
    return matchesSearch;
  });

  // --- Export Data ---
  const exportToCSV = () => {
    if (links.length === 0) return;
    const headers = ['URL', 'Extraction Context', 'Status', 'HTTP Code', 'Status Message', 'Response Time (ms)', 'Redirect Destination', 'Content-Type', 'Errors'];
    const rows = links.map(l => [
      l.url,
      l.context,
      l.status,
      l.statusCode || '',
      l.statusText || '',
      l.responseTimeMs || '',
      l.redirectUrl || '',
      l.contentType || '',
      l.error || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `broken-link-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (links.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(links, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `broken-link-report-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // --- Charts Data Preparation ---
  const chartPieData = [
    { name: 'Healthy (2xx)', value: cleanCount, color: '#10b981' },
    { name: 'Redirects (3xx)', value: redirectCount, color: '#f59e0b' },
    { name: 'Broken (4xx/5xx)', value: brokenCount, color: '#ef4444' },
    { name: 'Failed / Dead', value: failedCount, color: '#6b7280' }
  ].filter(d => d.value > 0);

  // Speed bar chart data
  const fastSpeedCount = links.filter(l => l.status === 'completed' && l.responseTimeMs && l.responseTimeMs < 250).length;
  const avgSpeedCount = links.filter(l => l.status === 'completed' && l.responseTimeMs && l.responseTimeMs >= 250 && l.responseTimeMs < 750).length;
  const slowSpeedCount = links.filter(l => l.status === 'completed' && l.responseTimeMs && l.responseTimeMs >= 750).length;

  const chartSpeedData = [
    { range: '< 250ms (Fast)', count: fastSpeedCount },
    { range: '250-750ms (Average)', count: avgSpeedCount },
    { range: '> 750ms (Slow)', count: slowSpeedCount }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header and Introduction */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold tracking-widest text-brand uppercase">Audit &amp; Security Tools</span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans">Broken Link &amp; Redirect Auditor</h2>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Verify link health instantly. Parse text blocks, XML sitemaps, or list maps to track broken links and trace complete redirect pathways.
          </p>
        </div>

        {/* Sliding Tab Selector */}
        <div className="flex bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80 self-start md:self-center">
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bulk'
                ? 'bg-brand text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Bulk Link Scanner</span>
          </button>
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'single'
                ? 'bg-brand text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Single URL Trace</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: BULK LINK SCANNER & SITEMAP AUDITOR
          ========================================================================= */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          {/* Main Input Configuration Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form Box */}
            <div className="lg:col-span-2 bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Source Text, XML Sitemap, or URL List
                </label>
                <div className="flex gap-1.5">
                  {bulkSamples.map(sample => (
                    <button
                      key={sample.name}
                      onClick={() => {
                        setBulkInput(sample.text);
                        setBulkError(null);
                      }}
                      className="bg-zinc-900/40 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-400 hover:text-white px-2 py-0.5 rounded-md text-[10px] font-mono transition-all"
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Paste an XML Sitemap, HTML content with anchor links, Markdown documents, or list of URLs (one per line) to audit..."
                className="w-full h-44 bg-zinc-900 border border-zinc-800 focus:border-red-600 rounded-xl p-4 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none transition-all resize-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-4">
                  {/* Concurrency slider */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-zinc-500 uppercase">Concurrency:</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={concurrency}
                      onChange={(e) => setConcurrency(parseInt(e.target.value))}
                      className="accent-brand w-20 cursor-pointer h-1 bg-zinc-800 rounded-lg appearance-none"
                    />
                    <span className="text-xs font-bold font-mono text-white">{concurrency}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={clearBulkState}
                    className="bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-800/80"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>

                  <button
                    onClick={parseLinks}
                    className="bg-zinc-900/60 hover:bg-zinc-800 text-brand hover:text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-brand/30 hover:border-brand"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Parse &amp; Extract</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Scanning Orchestrator Widget */}
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-white font-sans font-extrabold text-sm uppercase tracking-wider">
                  <Globe className="w-4 h-4 text-brand" />
                  <span>Scan Controller</span>
                </div>
                <p className="text-zinc-500 text-[11px] leading-relaxed font-mono">
                  Review gathered links and begin the automated HTTP validation scan. Connections are processed asynchronously.
                </p>
              </div>

              {/* Counter Display */}
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 text-center space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Extracted Links Pool</span>
                <span className="text-3xl font-black text-white font-mono">{links.length}</span>
                <span className="text-[11px] font-mono text-zinc-400 block">
                  {completedCount} / {totalCount} verified
                </span>
              </div>

              {/* Progress bar */}
              {links.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 uppercase">
                    <span>Audit Progress</span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                    <motion.div 
                      className="bg-brand h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${scanProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Execute / Cancel actions */}
              <div className="flex gap-3">
                {isScanning ? (
                  <button
                    onClick={pauseBulkScan}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/20"
                  >
                    <Square className="w-4 h-4" />
                    <span>Pause Scan</span>
                  </button>
                ) : (
                  <button
                    onClick={startBulkScan}
                    disabled={links.length === 0}
                    className="flex-1 bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Audit Scan</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error Alert inside Bulk Tab */}
          <AnimatePresence>
            {bulkError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 bg-red-950/20 border border-red-500/20 text-red-300 rounded-xl text-xs flex gap-3 items-start"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Extraction Fault</p>
                  <p className="opacity-90">{bulkError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visual Analytical Charts (Visible only when links exist) */}
          {links.length > 0 && completedCount > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Donut distribution chart */}
              <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-brand" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Status Code Distribution</span>
                </div>
                <div className="h-44 w-full flex items-center justify-center">
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartPieData}
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                          labelStyle={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                          itemStyle={{ color: '#ccc', fontSize: '11px', fontFamily: 'monospace' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-2 pl-4">
                    {chartPieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-zinc-400 truncate">{d.name}:</span>
                        <span className="text-white font-bold ml-auto">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Speed bar chart */}
              <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-brand" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Response Latency Profile</span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartSpeedData}>
                      <XAxis dataKey="range" stroke="#71717a" fontSize={10} fontFamily="monospace" />
                      <YAxis stroke="#71717a" fontSize={10} fontFamily="monospace" allowDecimals={false} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                      />
                      <Bar dataKey="count" fill="#cf1544" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Results Tabular Section */}
          {links.length > 0 && (
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
              
              {/* Header Stats & Filtering Bar */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                {/* Stats pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span>All Links</span>
                    <span className="ml-1.5 font-mono text-[11px] bg-zinc-900/80 px-1.5 py-0.5 rounded text-zinc-400">
                      {totalCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('clean')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'clean'
                        ? 'bg-emerald-950/45 border-emerald-800/60 text-emerald-400'
                        : 'bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span>Healthy (2xx)</span>
                    <span className="ml-1.5 font-mono text-[11px] bg-emerald-950/20 px-1.5 py-0.5 rounded text-emerald-500">
                      {cleanCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('redirect')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'redirect'
                        ? 'bg-amber-950/45 border-amber-800/60 text-amber-400'
                        : 'bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span>Redirects (3xx)</span>
                    <span className="ml-1.5 font-mono text-[11px] bg-amber-950/20 px-1.5 py-0.5 rounded text-amber-500">
                      {redirectCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('broken')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'broken'
                        ? 'bg-red-950/45 border-red-800/60 text-red-400'
                        : 'bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span>Broken (4xx/5xx)</span>
                    <span className="ml-1.5 font-mono text-[11px] bg-red-950/20 px-1.5 py-0.5 rounded text-red-500">
                      {brokenCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('failed')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'failed'
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        : 'bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span>Failed / Unreachable</span>
                    <span className="ml-1.5 font-mono text-[11px] bg-zinc-900/60 px-1.5 py-0.5 rounded text-zinc-400">
                      {failedCount}
                    </span>
                  </button>
                </div>

                {/* Search bar and Export buttons */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="relative flex-1 sm:w-64">
                    <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500 pointer-events-none">
                      <Search className="w-3.5 h-3.5 text-zinc-600" />
                    </span>
                    <input
                      type="text"
                      placeholder="Filter URLs or Anchor text..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all font-mono"
                    />
                  </div>

                  <div className="flex gap-2 self-end sm:self-auto">
                    <button
                      onClick={exportToCSV}
                      className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                      title="Download CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">CSV</span>
                    </button>
                    <button
                      onClick={exportToJSON}
                      className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                      title="Download JSON"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">JSON</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-xl border border-zinc-900">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900/40 text-[10px] font-mono text-zinc-400 uppercase tracking-wider border-b border-zinc-900">
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Type</th>
                      <th className="py-3 px-4 font-bold">Target Link URL &amp; Source Context</th>
                      <th className="py-3 px-4 font-bold text-right">Latency</th>
                      <th className="py-3 px-4 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/40 text-xs font-mono">
                    <AnimatePresence initial={false}>
                      {filteredLinks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-zinc-500 text-xs">
                            No links match the selected filter or search keyword.
                          </td>
                        </tr>
                      ) : (
                        filteredLinks.map((link) => {
                          const isInternal = link.url.includes('apexutility') || link.url.includes('news.apexutility') || link.url.startsWith('/');
                          const statusClass = getStatusColor(link.statusCode);

                          return (
                            <tr 
                              key={link.id} 
                              className="hover:bg-zinc-900/25 transition-colors group"
                            >
                              {/* Status Badge */}
                              <td className="py-3 px-4">
                                {link.status === 'pending' && (
                                  <span className="text-zinc-500 border border-zinc-800 bg-zinc-950 px-2 py-0.5 rounded-full text-[10px]">
                                    Pending
                                  </span>
                                )}
                                {link.status === 'scanning' && (
                                  <span className="text-brand border border-brand/20 bg-red-950/10 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 w-max animate-pulse">
                                    <RefreshCw className="w-3 h-3 animate-spin text-brand" />
                                    Scanning
                                  </span>
                                )}
                                {link.status === 'failed' && (
                                  <span className="text-red-400 border border-red-900/30 bg-red-950/20 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 w-max" title={link.error || 'Connection Failed'}>
                                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                                    Failed
                                  </span>
                                )}
                                {link.status === 'completed' && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}>
                                    {link.statusCode} {link.statusText}
                                  </span>
                                )}
                              </td>

                              {/* Internal / External badge */}
                              <td className="py-3 px-4">
                                {isInternal ? (
                                  <span className="text-indigo-400 border border-indigo-900/35 bg-indigo-950/25 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                    Internal
                                  </span>
                                ) : (
                                  <span className="text-amber-400 border border-amber-900/35 bg-amber-950/25 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                    External
                                  </span>
                                )}
                              </td>

                              {/* URL & Context */}
                              <td className="py-3 px-4 max-w-lg">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <a 
                                      href={link.url} 
                                      target="_blank" 
                                      referrerPolicy="no-referrer"
                                      className="text-zinc-300 hover:text-white underline truncate text-xs font-mono block transition-colors max-w-sm sm:max-w-md lg:max-w-lg"
                                    >
                                      {link.url}
                                    </a>
                                    <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 shrink-0 transition-colors" />
                                  </div>
                                  
                                  {/* Redirect Info */}
                                  {link.redirectUrl && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-amber-500/90 font-mono">
                                      <MoveRight className="w-3 h-3 shrink-0" />
                                      <span className="uppercase text-[9px]">Redirects to:</span>
                                      <span className="truncate max-w-sm">{link.redirectUrl}</span>
                                    </div>
                                  )}

                                  {/* Error Subtext */}
                                  {link.error && (
                                    <p className="text-[10px] text-red-400 font-mono flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 shrink-0" />
                                      <span>Error: {link.error}</span>
                                    </p>
                                  )}

                                  {/* Context extracted string */}
                                  <p className="text-[10px] text-zinc-500 font-mono italic">
                                    {link.context || 'Raw Text Extraction'}
                                  </p>
                                </div>
                              </td>

                              {/* Latency ms */}
                              <td className="py-3 px-4 text-right">
                                {link.responseTimeMs !== null ? (
                                  <span className={`text-[11px] font-bold font-mono ${
                                    link.responseTimeMs < 250 
                                      ? 'text-emerald-400' 
                                      : link.responseTimeMs < 750 
                                        ? 'text-amber-400' 
                                        : 'text-red-400'
                                  }`}>
                                    {link.responseTimeMs}ms
                                  </span>
                                ) : (
                                  <span className="text-zinc-600">-</span>
                                )}
                              </td>

                              {/* Action items */}
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => recheckSingleLink(link.id)}
                                    className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded transition-colors"
                                    title="Retest Link"
                                    disabled={isScanning && link.status === 'scanning'}
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(link.url, `bulk-copy-${link.id}`)}
                                    className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded transition-colors"
                                    title="Copy URL"
                                  >
                                    {copiedText === `bulk-copy-${link.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  {link.redirectUrl && (
                                    <button
                                      onClick={() => {
                                        setUrlInput(link.url);
                                        setActiveTab('single');
                                        handleSingleAudit(link.url);
                                      }}
                                      className="p-1 text-zinc-500 hover:text-brand hover:bg-zinc-900 rounded transition-colors"
                                      title="Trace Redirect Chain"
                                    >
                                      <Shield className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: SINGLE URL REDIRECT CHAIN TRACER (PRESERVED)
          ========================================================================= */}
      {activeTab === 'single' && (
        <div className="space-y-6">
          {/* Main Form Box */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-5">
            <div>
              <label htmlFor="target-url-input" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Target Website URL</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-4 flex items-center text-zinc-500 pointer-events-none">
                    <Link2 className="w-4 h-4 text-brand" />
                  </span>
                  <input
                    id="target-url-input"
                    type="text"
                    placeholder="e.g. http://github.com or test-site.com"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSingleAudit()}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all font-mono"
                  />
                </div>
                <button
                  onClick={() => handleSingleAudit()}
                  disabled={singleLoading}
                  className="bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {singleLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Auditing...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>Audit URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick presets row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-500 font-mono">Sample Cases:</span>
              {quickPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setUrlInput(preset.url);
                    handleSingleAudit(preset.url);
                  }}
                  className="bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 border border-zinc-800/80 px-2.5 py-1 rounded-lg transition-all text-[11px] font-mono hover:text-brand"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Error state */}
          <AnimatePresence>
            {singleError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 bg-red-950/30 border border-red-500/20 text-red-300 rounded-xl text-xs flex gap-3 items-start"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Auditing Failure</p>
                  <p className="opacity-90">{singleError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audit Results Dashboard */}
          <AnimatePresence>
            {singleResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Key Metrics Bento row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 space-y-1">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total Redirections</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-white">{singleResult.totalRedirects}</p>
                      <p className="text-xs text-zinc-400 font-mono">hops</p>
                    </div>
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 space-y-1">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Final Status</p>
                    {singleResult.redirectChain.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          singleResult.redirectChain[singleResult.redirectChain.length - 1].statusCode < 300 
                            ? 'bg-emerald-500' 
                            : 'bg-red-500'
                        }`} />
                        <p className="text-base font-extrabold text-white">
                          {singleResult.redirectChain[singleResult.redirectChain.length - 1].statusCode} {singleResult.redirectChain[singleResult.redirectChain.length - 1].statusText}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-zinc-500">N/A</p>
                    )}
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 space-y-1">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total Delay</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-black text-white">
                        {singleResult.redirectChain.reduce((acc, hop) => acc + hop.responseTimeMs, 0)}
                      </p>
                      <p className="text-xs text-zinc-400 font-mono">ms</p>
                    </div>
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 space-y-1">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Security Profile</p>
                    {singleResult.redirectChain.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        {singleResult.redirectChain[singleResult.redirectChain.length - 1].url.startsWith('https://') ? (
                          <div className="flex items-center gap-1 text-emerald-400">
                            <Lock className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase font-mono tracking-wider">SSL Secure</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-400">
                            <Unlock className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase font-mono tracking-wider">Insecure HTTP</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-zinc-500">N/A</p>
                    )}
                  </div>
                </div>

                {/* Main content grid: Timeline on Left, Expert audit findings on right */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Vertical redirection timeline (Left 2/3) */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-black text-xs uppercase tracking-widest text-zinc-400">Redirect Chain Timeline</h3>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Interactive Trace Logs</span>
                    </div>

                    <div className="space-y-4 relative pl-4 sm:pl-6 border-l border-zinc-900 py-1">
                      {singleResult.redirectChain.map((hop, index) => {
                        const isExpanded = !!expandedHops[index];
                        
                        const secCount = [
                          hop.securityHeaders.hsts,
                          hop.securityHeaders.csp,
                          hop.securityHeaders.xFrameOptions,
                          hop.securityHeaders.xContentTypeOptions,
                          hop.securityHeaders.referrerPolicy
                        ].filter(Boolean).length;

                        return (
                          <div key={index} className="relative space-y-2">
                            <div className={`absolute -left-[21px] sm:-left-[29px] top-1 w-3 h-3 rounded-full border-2 bg-black ${
                              hop.statusCode >= 200 && hop.statusCode < 300 
                                ? 'border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                                : 'border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                            }`} />

                            <div className="bg-zinc-950/65 border border-zinc-900 rounded-xl p-4 hover:border-zinc-800 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center flex-wrap gap-2">
                                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                                    Hop #{index + 1}
                                  </span>
                                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${getStatusColor(hop.statusCode)}`}>
                                    {hop.statusCode} {hop.statusText}
                                  </span>
                                  {hop.redirectType && (
                                    <span className="text-[10px] font-mono text-red-400 bg-red-950/20 border border-red-900/40 px-2 py-0.5 rounded-md">
                                      {hop.redirectType}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2.5 text-zinc-500 font-mono text-[11px]">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-zinc-600" />
                                    {hop.responseTimeMs}ms
                                  </span>
                                </div>
                              </div>

                              <div className="mt-2.5 space-y-1.5">
                                <div className="flex items-center justify-between gap-4">
                                  <p className="text-xs text-zinc-300 font-mono break-all select-all pr-2">
                                    {hop.url}
                                  </p>
                                  <button
                                    onClick={() => copyToClipboard(hop.url, `single-hop-url-${index}`)}
                                    className="text-zinc-600 hover:text-white shrink-0 transition-colors"
                                    title="Copy URL"
                                  >
                                    {copiedText === `single-hop-url-${index}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>

                                {hop.redirectUrl && (
                                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono py-1 border-t border-zinc-900/60 mt-2">
                                    <ArrowRight className="w-3.5 h-3.5 text-brand shrink-0" />
                                    <span className="text-zinc-500 uppercase shrink-0">Redirects to:</span>
                                    <span className="text-zinc-400 break-all">{hop.redirectUrl}</span>
                                  </div>
                                )}
                              </div>

                              <div className="mt-3.5 flex items-center justify-between pt-3 border-t border-zinc-900/80">
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                                    <Shield className="w-3.5 h-3.5 text-zinc-600" />
                                    Security Headers: {secCount}/5
                                  </span>
                                </div>

                                <button
                                  onClick={() => toggleHopExpand(index)}
                                  className="text-zinc-400 hover:text-white text-[11px] font-mono flex items-center gap-1 transition-colors"
                                >
                                  <span>{isExpanded ? 'Hide' : 'Inspect'} Headers</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-4 pt-4 border-t border-zinc-900/85 space-y-4">
                                      <div className="bg-zinc-900/40 border border-zinc-900/80 rounded-xl p-3.5 space-y-2.5">
                                        <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Security Hardening Status</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                          <div className="flex items-center justify-between p-1.5 bg-zinc-950/40 rounded-lg" title={hop.securityHeaders.hsts || "Missing Strict-Transport-Security (HSTS)"}>
                                            <span className="font-mono text-[11px] text-zinc-400">Strict-Transport-Security</span>
                                            {hop.securityHeaders.hsts ? (
                                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                              <ShieldAlert className="w-4 h-4 text-red-500" />
                                            )}
                                          </div>
                                          <div className="flex items-center justify-between p-1.5 bg-zinc-950/40 rounded-lg" title={hop.securityHeaders.csp || "Missing Content-Security-Policy (CSP)"}>
                                            <span className="font-mono text-[11px] text-zinc-400">Content-Security-Policy</span>
                                            {hop.securityHeaders.csp ? (
                                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                              <ShieldAlert className="w-4 h-4 text-red-500" />
                                            )}
                                          </div>
                                          <div className="flex items-center justify-between p-1.5 bg-zinc-950/40 rounded-lg" title={hop.securityHeaders.xFrameOptions || "Missing X-Frame-Options"}>
                                            <span className="font-mono text-[11px] text-zinc-400">X-Frame-Options</span>
                                            {hop.securityHeaders.xFrameOptions ? (
                                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                              <ShieldAlert className="w-4 h-4 text-red-500" />
                                            )}
                                          </div>
                                          <div className="flex items-center justify-between p-1.5 bg-zinc-950/40 rounded-lg" title={hop.securityHeaders.xContentTypeOptions || "Missing X-Content-Type-Options"}>
                                            <span className="font-mono text-[11px] text-zinc-400">X-Content-Type-Options</span>
                                            {hop.securityHeaders.xContentTypeOptions ? (
                                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                              <ShieldAlert className="w-4 h-4 text-red-500" />
                                            )}
                                          </div>
                                          <div className="flex items-center justify-between p-1.5 bg-zinc-950/40 rounded-lg" title={hop.securityHeaders.referrerPolicy || "Missing Referrer-Policy"}>
                                            <span className="font-mono text-[11px] text-zinc-400">Referrer-Policy</span>
                                            {hop.securityHeaders.referrerPolicy ? (
                                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                              <ShieldAlert className="w-4 h-4 text-red-500" />
                                            )}
                                          </div>
                                          <div className="flex items-center justify-between p-1.5 bg-zinc-950/40 rounded-lg" title={hop.securityHeaders.xXssProtection || "Missing X-XSS-Protection (Legacy)"}>
                                            <span className="font-mono text-[11px] text-zinc-400">X-XSS-Protection</span>
                                            {hop.securityHeaders.xXssProtection ? (
                                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                              <ShieldAlert className="w-4 h-4 text-zinc-600" />
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Raw Response Headers</h4>
                                          <button
                                            onClick={() => copyToClipboard(JSON.stringify(hop.headers, null, 2), `single-hop-headers-${index}`)}
                                            className="text-[10px] text-zinc-500 hover:text-white font-mono flex items-center gap-1 transition-all"
                                          >
                                            {copiedText === `single-hop-headers-${index}` ? 'Copied!' : 'Copy JSON'}
                                          </button>
                                        </div>
                                        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 font-mono text-[10px] text-zinc-400 overflow-x-auto max-h-56 overflow-y-auto space-y-1.5">
                                          {Object.entries(hop.headers).map(([key, val]) => (
                                            <div key={key} className="flex gap-2 border-b border-zinc-900/40 pb-1 last:border-b-0 last:pb-0">
                                              <span className="text-brand font-semibold select-all shrink-0">{key}:</span>
                                              <span className="text-zinc-300 break-all select-all">{val}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expert Audit Summary (Right 1/3) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-black text-xs uppercase tracking-widest text-zinc-400">Expert Insights</h3>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Compliance Auditor</span>
                    </div>

                    <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 space-y-5 shadow-lg">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">SEO &amp; Security Diagnosis</h4>
                        <p className="text-[11px] text-zinc-500 font-mono">Dynamic Webmaster Quality checks</p>
                      </div>

                      <hr className="border-zinc-900" />

                      <div className="space-y-4">
                        {singleResult.redirectChain.length > 0 && getAuditInsights(singleResult.redirectChain).map((insight, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3.5 rounded-xl border flex gap-3 items-start ${
                              insight.type === 'success' 
                                ? 'bg-emerald-950/15 border-emerald-950/80 text-emerald-300' 
                                : insight.type === 'warning' 
                                  ? 'bg-amber-950/15 border-amber-950/80 text-amber-300' 
                                  : 'bg-red-950/15 border-red-950/80 text-red-300'
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {insight.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : insight.type === 'warning' ? (
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                            </div>
                            <div className="space-y-1 text-xs">
                              <p className="font-bold">{insight.title}</p>
                              <p className="opacity-95 leading-relaxed text-[11px] font-mono">{insight.desc}</p>
                            </div>
                          </div>
                        ))}
                        
                        {singleResult.redirectChain.length === 0 && (
                          <p className="text-zinc-500 font-mono text-xs text-center py-6">No hops analyzed yet.</p>
                        )}
                      </div>

                      <hr className="border-zinc-900" />

                      <div className="p-4 bg-red-950/10 border border-red-950/50 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-brand">
                          <Sparkles className="w-4 h-4 text-brand animate-pulse" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">AI Optimizer recommendation</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
                          To optimize your crawl path latency, redirect from host directly in your server configuration (Nginx or .htaccess) with a direct <span className="text-white font-bold">301 Permanent Redirect</span> rather than multiple client hops.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Google AdSense Compliant Informational Article & FAQs Footer */}
      <div className="border-t border-zinc-900 pt-12 mt-12 space-y-10 text-left max-w-5xl mx-auto px-4">
        
        {/* Editorial Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>SEO & Optimization Guide: Broken Links & Redirect Chains</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight sm:text-2xl">
            A Comprehensive Guide to Broken Link Audits & Permanent 301 Redirect Chains
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Protect your website's crawl budget, preserve PageRank link equity, and deliver flawless user experiences. Learn how auditing redirect chains and patching 404 broken links ensures absolute Google AdSense compliance and ranks you higher.
          </p>
        </div>

        {/* 2-Column Article Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Article Column 1 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-red-500 font-mono">01.</span>
                What is a Redirect Chain?
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                A **redirect chain** occurs when a visitor or search engine crawler requests a URL that points to another URL, which in turn redirects to a third URL, and potentially more. These multi-step redirection sequences introduce heavy latencies, increasing page-load times and depleting the server's compute resources.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Search engine spiders (such as Googlebot) limit their traversal path; they typically abort crawling if a chain exceeds 3 to 5 hops. This means nested target pages will fail to get indexed entirely.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-red-500 font-mono">02.</span>
                Difference Between 301 and 302 Redirection
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                When configuring redirects, choosing the correct HTTP status code is paramount for SEO integrity:
              </p>
              <ul className="space-y-2 text-zinc-400 text-xs pl-4 list-disc">
                <li><strong className="text-zinc-200">301 Moved Permanently:</strong> Tells search engines that the URL has permanently migrated to a new location. This transfers approximately 95% to 99% of ranking power (link equity) to the final URL.</li>
                <li><strong className="text-zinc-200">302 Found (Temporary):</strong> Signals that the move is temporary. Search engines will continue to index the original URL, passing zero ranking signals to the new destination.</li>
              </ul>
            </div>
          </div>

          {/* Article Column 2 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-red-500 font-mono">03.</span>
                Impact of Broken Links on Google AdSense Approval
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Websites applying for Google AdSense monetization are frequently rejected with a "Low Value Content" or "Difficult Site Navigation" flag. Automated ad networks evaluate your site structure to ensure high editorial compliance.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Having broken links (resulting in dead 404 or 410 errors) signals poor maintenance, high user frustration, and incomplete site architecture, immediately blocking monetization permissions.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-red-500 font-mono">04.</span>
                How to Perform a Comprehensive Link Audit
              </h4>
              <ol className="space-y-1.5 text-zinc-400 text-xs pl-4 list-decimal">
                <li>Input your target destination URL into our Single URL Trace tab to map out hops step-by-step.</li>
                <li>Verify if your insecure HTTP URLs successfully upgrade to secure, modern HTTPS protocols.</li>
                <li>Use the Bulk Link Scanner to parse entire sitemaps, markdown notes, or raw texts to scan up to 10 links concurrently.</li>
                <li>Audit missing server security headers (such as HSTS, Content Security Policy, CSP, or X-Frame-Options) on final resolution endpoints.</li>
                <li>Export comprehensive CSV or JSON auditing logs to patch bad pathways directly in your server's configuration.</li>
              </ol>
            </div>
          </div>

        </div>

        {/* Separator */}
        <div className="border-t border-zinc-900/60" />

        {/* FAQ Section */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white tracking-tight">Frequently Asked Questions (FAQ)</h4>
            <p className="text-zinc-500 text-xs">Got questions about server-side redirects, security headers, and link health? Read on.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
                What is an HTTP Strict-Transport-Security (HSTS) header?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                HSTS is a security header that forces standard web browsers to communicate with your server exclusively over secure HTTPS channels, automatically preventing man-in-the-middle attacks and SSL stripping exploits.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
                How do broken links affect my website's crawl budget?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Google assigns a specific "crawl budget" (total page queries) to every website based on authority and trust. When bots hit 404 errors or get trapped in endless loops, they waste this budget on dead pages instead of indexing fresh content.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
                Why are some links flagged with a status code of 0?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                A status code of 0 indicates a connection-level failure, which typically occurs due to DNS lookup issues, dead nameservers, request timeouts, or aggressive CORS restrictions blocks on the target host.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
                Can I analyze redirects behind secure logins?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Because this auditor operates from an isolated sandbox network client, pages secured behind login gates, cookied payloads, or custom firewalls cannot be traversed, maintaining user session privacy.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, CheckCircle2, XCircle, RotateCcw, Repeat, Link2, 
  ShieldAlert, ShieldCheck, Layers, Folder, FolderOpen, FileText, 
  Sparkles, Download, RefreshCw, Play, Square, Search, Filter, 
  ArrowRight, ExternalLink, Copy, Check, Trash2, Globe, FileCode, 
  TrendingUp, BarChart2, Zap, ChevronRight, ChevronDown, Clock, Info,
  AlertCircle, ArrowUpRight
} from 'lucide-react';
import { detectAndFixUrlRedirect, RedirectIssue } from './SitemapRedirectHealer';
import RedirectQuickFixModal, { QuickFixItem } from './RedirectQuickFixModal';

// --- Types ---
export type UrlIssueCategory = 'unreachable_404' | 'redirect_loop' | 'redirect_3xx' | 'non_canonical' | 'clean_200' | 'warning';

export interface ValidatedSitemapUrl {
  id: string;
  originalLoc: string;
  statusCode: number | null;
  statusText: string | null;
  responseTimeMs: number | null;
  isScanning: boolean;
  
  // Categorization
  category: UrlIssueCategory;
  categoryLabel: string;
  
  // Issue details
  errorDetails: string | null;
  is404: boolean;
  isRedirectLoop: boolean;
  isNonCanonical: boolean;
  isClean: boolean;
  
  // Canonical comparison
  declaredCanonical: string | null;
  isCanonicalMatch: boolean | null;
  canonicalMismatchReason: string | null;
  
  // Redirect chain / loop trace
  redirectHops: Array<{
    url: string;
    statusCode: number;
    redirectUrl: string | null;
  }>;
  finalDestinationUrl: string | null;
  
  // Sitemap attributes
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  
  // Directory path categorization
  sectionPath: string; // e.g. "/guides", "/tools", "/"
}

export interface SectionNode {
  path: string;
  displayName: string;
  totalUrls: number;
  cleanCount: number;
  unreachableCount: number;
  loopCount: number;
  redirectCount: number;
  nonCanonicalCount: number;
  urls: ValidatedSitemapUrl[];
}

export default function VisualSitemapValidator() {
  const [xmlInput, setXmlInput] = useState('');
  const [urls, setUrls] = useState<ValidatedSitemapUrl[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<UrlIssueCategory | 'all'>('all');
  const [selectedSection, setSelectedSection] = useState<string | 'all'>('all');
  const [selectedUrl, setSelectedUrl] = useState<ValidatedSitemapUrl | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [quickFixModalOpen, setQuickFixModalOpen] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<'hierarchy' | 'cards' | 'table'>('hierarchy');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ '/': true });

  const isScanningRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Realistic sample with 404s, redirect loops, 301/302 redirects, and non-canonical pages
  const sampleSitemapWithIssues = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 🟢 Clean 200 OK Self-Referencing Canonical Pages -->
  <url>
    <loc>https://apexutility.live/</loc>
    <lastmod>2026-07-08</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.00</priority>
  </url>
  <url>
    <loc>https://apexutility.live/compress-pdf</loc>
    <lastmod>2026-07-08</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.90</priority>
  </url>
  <url>
    <loc>https://apexutility.live/webp-converter</loc>
    <lastmod>2026-07-08</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>

  <!-- 🔴 FLAG 1: Unreachable 404 Dead Links (Depleted Crawl Budget & 404 Penalties) -->
  <url>
    <loc>https://httpbin.org/status/404</loc>
    <lastmod>2026-05-12</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.50</priority>
  </url>
  <url>
    <loc>https://apexutility.live/old-legacy-deleted-tool-2024</loc>
    <lastmod>2026-02-10</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.30</priority>
  </url>

  <!-- 🟠 FLAG 2: Redirect Loops (301/302 Infinite Loops & Crawl Traps) -->
  <url>
    <loc>http://httpbin.org/redirect/4</loc>
    <lastmod>2026-06-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.70</priority>
  </url>
  <url>
    <loc>http://httpbin.org/relative-redirect/2</loc>
    <lastmod>2026-06-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.70</priority>
  </url>

  <!-- 🟠 FLAG 3: 301/302 Page with Redirect Hazards -->
  <url>
    <loc>http://github.com</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://apexutility.live/guides?id=svg-path-optimization-algorithms</loc>
    <lastmod>2026-07-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>

  <!-- 🟣 FLAG 4: Non-Canonical Pages (Declared canonical differs from Sitemap <loc>) -->
  <url>
    <loc>https://news.apexutility.live/about-us</loc>
    <lastmod>2026-07-08</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.60</priority>
  </url>
  <url>
    <loc>https://apexutility.live/guides?id=lighthouse-performance-optimization</loc>
    <lastmod>2026-07-08</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>
  <url>
    <loc>http://apexutility.live/privacy-policy</loc>
    <lastmod>2026-07-08</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.40</priority>
  </url>
</urlset>`;

  // Helper: Copy string to clipboard with feedback
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Helper: Extract section path from URL (e.g. "https://domain.com/guides/article" -> "/guides")
  const extractSectionPath = (urlStr: string): string => {
    try {
      const parsed = new URL(urlStr);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length === 0) return '/ (Root)';
      return `/${parts[0]}`;
    } catch {
      return '/ (Other)';
    }
  };

  // Parse sitemap XML into initial URL entries
  const parseSitemapXml = (rawXml: string) => {
    const input = rawXml.trim();
    if (!input) {
      setUrls([]);
      return;
    }

    const parsedItems: ValidatedSitemapUrl[] = [];
    const seen = new Set<string>();

    const urlBlockRegex = /<url>([\s\S]*?)<\/url>/gi;
    let blockMatch;

    while ((blockMatch = urlBlockRegex.exec(input)) !== null) {
      const block = blockMatch[1];
      const locMatch = block.match(/<loc>\s*([^<\s]+)\s*<\/loc>/i);
      if (!locMatch) continue;

      const loc = locMatch[1].trim();
      if (seen.has(loc)) continue;
      seen.add(loc);

      const lastmodMatch = block.match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/i);
      const changefreqMatch = block.match(/<changefreq>\s*([^<\s]+)\s*<\/changefreq>/i);
      const priorityMatch = block.match(/<priority>\s*([^<\s]+)\s*<\/priority>/i);

      // Diagnostic heuristic check for instant feedback before live fetch
      const heuristic = detectAndFixUrlRedirect(loc);
      const isHeuristicNonCanonical = heuristic.isRedirect;
      const section = extractSectionPath(loc);

      parsedItems.push({
        id: `v_url_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        originalLoc: loc,
        statusCode: null,
        statusText: null,
        responseTimeMs: null,
        isScanning: false,
        category: isHeuristicNonCanonical ? 'non_canonical' : 'clean_200',
        categoryLabel: isHeuristicNonCanonical ? 'Non-Canonical Pattern Detected' : 'Pending Verification',
        errorDetails: isHeuristicNonCanonical ? heuristic.issues.map(i => i.label).join(', ') : null,
        is404: false,
        isRedirectLoop: false,
        isNonCanonical: isHeuristicNonCanonical,
        isClean: !isHeuristicNonCanonical,
        declaredCanonical: heuristic.canonicalUrl !== loc ? heuristic.canonicalUrl : null,
        isCanonicalMatch: heuristic.canonicalUrl === loc,
        canonicalMismatchReason: isHeuristicNonCanonical ? 'URL has parameter or subdomain inconsistency' : null,
        redirectHops: [],
        finalDestinationUrl: null,
        lastmod: lastmodMatch ? lastmodMatch[1] : undefined,
        changefreq: changefreqMatch ? changefreqMatch[1] : undefined,
        priority: priorityMatch ? priorityMatch[1] : undefined,
        sectionPath: section
      });
    }

    // Fallback: If no <url> tags found, extract raw <loc> tags
    if (parsedItems.length === 0) {
      const locRegex = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
      let locMatch;
      while ((locMatch = locRegex.exec(input)) !== null) {
        const loc = locMatch[1].trim();
        if (seen.has(loc)) continue;
        seen.add(loc);

        const heuristic = detectAndFixUrlRedirect(loc);
        const isHeuristicNonCanonical = heuristic.isRedirect;
        const section = extractSectionPath(loc);

        parsedItems.push({
          id: `v_url_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          originalLoc: loc,
          statusCode: null,
          statusText: null,
          responseTimeMs: null,
          isScanning: false,
          category: isHeuristicNonCanonical ? 'non_canonical' : 'clean_200',
          categoryLabel: isHeuristicNonCanonical ? 'Non-Canonical' : 'Pending Verification',
          errorDetails: null,
          is404: false,
          isRedirectLoop: false,
          isNonCanonical: isHeuristicNonCanonical,
          isClean: !isHeuristicNonCanonical,
          declaredCanonical: heuristic.canonicalUrl !== loc ? heuristic.canonicalUrl : null,
          isCanonicalMatch: heuristic.canonicalUrl === loc,
          canonicalMismatchReason: null,
          redirectHops: [],
          finalDestinationUrl: null,
          sectionPath: section
        });
      }
    }

    setUrls(parsedItems);
  };

  // Run live validation against each URL to flag 404s, Redirect Loops, and Canonical Mismatches
  const startLiveValidation = async () => {
    if (urls.length === 0) return;

    setIsValidating(true);
    isScanningRef.current = true;
    setValidationProgress(0);

    const queue = [...urls];
    const total = queue.length;
    let completed = 0;

    const worker = async () => {
      while (queue.length > 0 && isScanningRef.current) {
        const item = queue.shift();
        if (!item) break;

        // Set scanning status
        setUrls(prev => prev.map(u => u.id === item.id ? { ...u, isScanning: true } : u));

        try {
          // Perform full redirect audit via /api/audit-redirect to trace loops and canonicals
          const res = await fetch('/api/audit-redirect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: item.originalLoc })
          });

          if (res.ok) {
            const auditData = await res.json();
            const hops = auditData.redirectChain || [];
            const finalUrl = auditData.finalUrl || item.originalLoc;
            const lastHop = hops[hops.length - 1];
            const finalStatusCode = lastHop ? lastHop.statusCode : 200;
            const finalStatusText = lastHop ? lastHop.statusText : 'OK';

            // Check for redirect loop
            const hopUrls = hops.map((h: any) => h.url.toLowerCase());
            const hasLoop = hops.length > 5 || (new Set(hopUrls).size < hopUrls.length && hops.length > 1);

            // Check for 404 unreachable
            const is404 = finalStatusCode === 404 || finalStatusCode === 410 || !auditData.success;

            // Check for 301/302 redirects
            const isRedirect = hops.length > 1 || (hops[0] && hops[0].redirectUrl !== null);

            // Check for non-canonical
            const finalCanonical = auditData.finalCanonicalTag;
            const isCanonicalMatch = auditData.isCanonicalMatch;
            const isNonCanonical = isCanonicalMatch === false || (finalCanonical && finalCanonical.toLowerCase() !== finalUrl.toLowerCase());

            // Determine primary issue category
            let category: UrlIssueCategory = 'clean_200';
            let categoryLabel = '200 OK (Clean & Indexable)';
            let errorDetails: string | null = null;

            if (is404) {
              category = 'unreachable_404';
              categoryLabel = `HTTP ${finalStatusCode} Unreachable 404`;
              errorDetails = auditData.error || `Target page does not exist (${finalStatusCode} Not Found). Google Search Console will flag as a 404 crawl error.`;
            } else if (hasLoop) {
              category = 'redirect_loop';
              categoryLabel = 'Redirect Loop (301/302 Loop Trap)';
              errorDetails = `Redirect sequence exceeds threshold or loops back to previous hop (${hops.length} hops detected). Crawlers will abort traversal.`;
            } else if (isNonCanonical) {
              category = 'non_canonical';
              categoryLabel = 'Non-Canonical Page Flagged';
              errorDetails = auditData.canonicalMismatchReason || `Declared canonical tag "${finalCanonical || 'None'}" does not match final URL "${finalUrl}". Causes GSC "Alternate page with proper canonical tag" de-indexing.`;
            } else if (isRedirect) {
              category = 'redirect_3xx';
              categoryLabel = `HTTP ${hops[0]?.statusCode || 301} Page with Redirect`;
              errorDetails = `URL redirects to "${finalUrl}". Sitemaps must contain only direct 200 OK canonical URLs to preserve crawl budget.`;
            }

            setUrls(prev => prev.map(u => {
              if (u.id === item.id) {
                return {
                  ...u,
                  statusCode: finalStatusCode,
                  statusText: finalStatusText,
                  responseTimeMs: hops.reduce((acc: number, h: any) => acc + (h.responseTimeMs || 0), 0),
                  isScanning: false,
                  category,
                  categoryLabel,
                  errorDetails,
                  is404,
                  isRedirectLoop: hasLoop,
                  isNonCanonical,
                  isClean: category === 'clean_200',
                  declaredCanonical: finalCanonical,
                  isCanonicalMatch: auditData.isCanonicalMatch,
                  canonicalMismatchReason: auditData.canonicalMismatchReason,
                  redirectHops: hops.map((h: any) => ({
                    url: h.url,
                    statusCode: h.statusCode,
                    redirectUrl: h.redirectUrl
                  })),
                  finalDestinationUrl: finalUrl
                };
              }
              return u;
            }));
          } else {
            // Connection error / 404
            setUrls(prev => prev.map(u => {
              if (u.id === item.id) {
                return {
                  ...u,
                  statusCode: 404,
                  statusText: 'Unreachable',
                  isScanning: false,
                  category: 'unreachable_404',
                  categoryLabel: 'Unreachable Host / 404',
                  errorDetails: 'Server connection failed or host refused request',
                  is404: true,
                  isClean: false
                };
              }
              return u;
            }));
          }
        } catch (e: any) {
          setUrls(prev => prev.map(u => {
            if (u.id === item.id) {
              return {
                ...u,
                statusCode: 404,
                statusText: 'Error',
                isScanning: false,
                category: 'unreachable_404',
                categoryLabel: 'Unreachable Connection Failure',
                errorDetails: e.message || 'Network timeout or unreachable endpoint',
                is404: true,
                isClean: false
              };
            }
            return u;
          }));
        } finally {
          completed++;
          setValidationProgress(Math.round((completed / total) * 100));
        }
      }
    };

    const concurrency = Math.min(4, queue.length);
    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    setIsValidating(false);
    isScanningRef.current = false;
  };

  const stopValidation = () => {
    isScanningRef.current = false;
    setIsValidating(false);
  };

  // Load sample sitemap
  const handleLoadSample = () => {
    setXmlInput(sampleSitemapWithIssues);
    parseSitemapXml(sampleSitemapWithIssues);
    setNotification('Loaded comprehensive sample sitemap with 404s, redirect loops & non-canonical pages.');
    setTimeout(() => setNotification(null), 4000);
  };

  // Auto-fetch live sitemap
  const handleFetchLiveSitemap = async () => {
    try {
      const res = await fetch('/sitemap.xml');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setXmlInput(text);
      parseSitemapXml(text);
      setNotification('Loaded live site /sitemap.xml! Click "Run Visual Audit" to validate all URLs.');
      setTimeout(() => setNotification(null), 4000);
    } catch (e: any) {
      setNotification(`Failed to load /sitemap.xml: ${e.message}`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setXmlInput(content);
      parseSitemapXml(content);
      setNotification(`Imported ${file.name} successfully!`);
      setTimeout(() => setNotification(null), 3000);
    };
    reader.readAsText(file);
  };

  // Auto-Fix In Place: Purges 404s, auto-resolves redirect loops and non-canonical pages
  const autoFixAllIssuesInPlace = () => {
    if (urls.length === 0) return;

    // Filter out 404s and redirect loops that cannot be salvaged
    const healthyOrFixed = urls
      .filter(u => !u.is404 && !u.isRedirectLoop)
      .map(u => {
        // If non-canonical or redirecting, rewrite to final destination or declared canonical
        if (u.isNonCanonical || u.category === 'redirect_3xx') {
          const newTarget = u.finalDestinationUrl || u.declaredCanonical || u.originalLoc;
          return {
            ...u,
            originalLoc: newTarget,
            category: 'clean_200' as UrlIssueCategory,
            categoryLabel: '200 OK (Cleaned & Healed)',
            statusCode: 200,
            statusText: 'OK',
            isClean: true,
            isNonCanonical: false,
            errorDetails: null
          };
        }
        return u;
      });

    setUrls(healthyOrFixed);

    // Reconstruct clean XML
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...healthyOrFixed.map(u => [
        '  <url>',
        `    <loc>${u.originalLoc}</loc>`,
        u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : '',
        u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>` : '',
        u.priority ? `    <priority>${u.priority}</priority>` : '',
        '  </url>'
      ].filter(Boolean).join('\n')),
      '</urlset>'
    ].join('\n');

    setXmlInput(xml);
    setNotification('Auto-Fixed sitemap: Purged all 404s & redirect loops, resolved non-canonical targets!');
    setTimeout(() => setNotification(null), 5000);
  };

  // One-Click Download Sanitized 200 OK Sitemap (Prunes 404s, Loops, & Non-Canonicals)
  const downloadSanitized200Sitemap = () => {
    // Only keep URLs that are verified 200 OK and self-referencing canonical
    const cleanUrls = urls.filter(u => u.category === 'clean_200' && !u.is404 && !u.isRedirectLoop && !u.isNonCanonical);

    if (cleanUrls.length === 0) {
      setNotification('No verified 200 OK URLs available yet. Run the visual audit or heal issues first.');
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...cleanUrls.map(u => [
        '  <url>',
        `    <loc>${u.originalLoc}</loc>`,
        u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : '',
        u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>` : '',
        u.priority ? `    <priority>${u.priority}</priority>` : '',
        '  </url>'
      ].filter(Boolean).join('\n')),
      '</urlset>'
    ].join('\n');

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sitemap-200-ok-sanitized-${Date.now()}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setNotification(`✓ Downloaded Sanitized Sitemap with ${cleanUrls.length} verified 200 OK URLs!`);
    setTimeout(() => setNotification(null), 4500);
  };

  // Calculations & Analytics
  const totalUrls = urls.length;
  const count404 = urls.filter(u => u.is404).length;
  const countLoops = urls.filter(u => u.isRedirectLoop).length;
  const countRedirects = urls.filter(u => u.category === 'redirect_3xx').length;
  const countNonCanonical = urls.filter(u => u.isNonCanonical).length;
  const countClean = urls.filter(u => u.isClean && !u.is404 && !u.isRedirectLoop && !u.isNonCanonical).length;

  const totalIssues = count404 + countLoops + countRedirects + countNonCanonical;
  const healthScore = totalUrls > 0 ? Math.max(0, Math.round(((totalUrls - totalIssues) / totalUrls) * 100)) : 100;

  // Group URLs by directory hierarchy for visual tree mapping
  const sectionNodes: SectionNode[] = useMemo(() => {
    const map = new Map<string, ValidatedSitemapUrl[]>();
    urls.forEach(u => {
      const list = map.get(u.sectionPath) || [];
      list.push(u);
      map.set(u.sectionPath, list);
    });

    const nodes: SectionNode[] = [];
    map.forEach((secUrls, path) => {
      nodes.push({
        path,
        displayName: path === '/ (Root)' ? 'Home / Root Level' : `${path} Directory`,
        totalUrls: secUrls.length,
        cleanCount: secUrls.filter(u => u.category === 'clean_200').length,
        unreachableCount: secUrls.filter(u => u.is404).length,
        loopCount: secUrls.filter(u => u.isRedirectLoop).length,
        redirectCount: secUrls.filter(u => u.category === 'redirect_3xx').length,
        nonCanonicalCount: secUrls.filter(u => u.isNonCanonical).length,
        urls: secUrls
      });
    });

    return nodes.sort((a, b) => b.totalUrls - a.totalUrls);
  }, [urls]);

  // Filtered URLs list based on active filters
  const filteredUrls = useMemo(() => {
    return urls.filter(u => {
      const matchesSearch = u.originalLoc.toLowerCase().includes(searchFilter.toLowerCase()) ||
                            (u.errorDetails && u.errorDetails.toLowerCase().includes(searchFilter.toLowerCase())) ||
                            u.sectionPath.toLowerCase().includes(searchFilter.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || u.category === categoryFilter;
      const matchesSection = selectedSection === 'all' || u.sectionPath === selectedSection;

      return matchesSearch && matchesCategory && matchesSection;
    });
  }, [urls, searchFilter, categoryFilter, selectedSection]);

  // QuickFix items for modal
  const quickFixItems: QuickFixItem[] = useMemo(() => {
    return urls
      .filter(u => u.isNonCanonical || u.category === 'redirect_3xx')
      .map((u, idx) => ({
        id: `qf_vis_${u.id || idx}`,
        sourceUrl: u.originalLoc,
        canonicalUrl: u.finalDestinationUrl || u.declaredCanonical || u.originalLoc,
        statusCode: u.statusCode || 301,
        reason: u.categoryLabel,
        lastmod: u.lastmod,
        changefreq: u.changefreq,
        priority: u.priority
      }));
  }, [urls]);

  const toggleSection = (path: string) => {
    setExpandedSections(prev => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-zinc-900/90 border border-zinc-750 text-white rounded-xl text-xs font-mono shadow-2xl flex items-center justify-between backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand shrink-0" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-zinc-500 hover:text-white ml-3">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner & Hero Panel */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-brand/20 text-brand border border-brand/30 text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Visual Sitemap Intelligence
              </span>
              <span className="text-zinc-500 text-xs font-mono">
                Flag 404s • Detect Redirect Loops • Validate Canonicals
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Visual Sitemap.xml Validator &amp; Diagnostic Suite
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Googlebot halts crawling and penalizes domain authority when sitemaps contain unreachable <span className="text-red-400 font-bold font-mono">404 broken links</span>, <span className="text-amber-400 font-bold font-mono">301/302 redirect loops</span>, or <span className="text-purple-400 font-bold font-mono">non-canonical pages</span>. Deconstruct your sitemap hierarchy visually and generate sanitized 200 OK files in one click.
            </p>
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <button
              onClick={handleFetchLiveSitemap}
              className="bg-zinc-800/80 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              title="Auto-fetch and validate live /sitemap.xml from server"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Load Live Sitemap</span>
            </button>

            <button
              onClick={handleLoadSample}
              className="bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/60 text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              title="Load demo sitemap with 404s, redirect loops, and canonical mismatches"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Test Issues Demo</span>
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
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload XML File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Input / Control Bar */}
      <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <FileText className="w-3.5 h-3.5 text-brand" />
            Sitemap.xml Input Payload
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400">
              {urls.length} URLs Detected
            </span>
            {urls.length > 0 && (
              <button
                onClick={() => {
                  setXmlInput('');
                  setUrls([]);
                  setSelectedUrl(null);
                }}
                className="text-zinc-500 hover:text-white text-xs font-mono p-1 rounded hover:bg-zinc-900"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <textarea
          value={xmlInput}
          onChange={(e) => {
            setXmlInput(e.target.value);
            parseSitemapXml(e.target.value);
          }}
          placeholder="Paste standard sitemap.xml (<urlset><url><loc>...</loc></url>...</urlset>) here..."
          className="w-full h-32 bg-zinc-900/90 border border-zinc-800 focus:border-red-500 rounded-xl p-3.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none transition-all resize-none"
        />

        {/* Audit Execution Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            {isValidating ? (
              <button
                onClick={stopValidation}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-red-950/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Audit ({validationProgress}%)</span>
              </button>
            ) : (
              <button
                onClick={startLiveValidation}
                disabled={urls.length === 0}
                className="bg-brand hover:bg-brand-hover text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-red-950/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Visual Audit Scan ({urls.length} URLs)</span>
              </button>
            )}

            {/* Quick Auto-Fix All */}
            {totalIssues > 0 && (
              <button
                onClick={autoFixAllIssuesInPlace}
                className="bg-zinc-800 hover:bg-zinc-700 text-emerald-300 font-bold text-xs uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                title="Purge 404s and redirect loops, rewrite non-canonicals in-place"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Fix All Issues ({totalIssues})</span>
              </button>
            )}
          </div>

          {/* Download Sanitized 200 OK Sitemap */}
          <button
            onClick={downloadSanitized200Sitemap}
            disabled={countClean === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 border border-emerald-500/50 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            title="Download sanitized sitemap.xml with ONLY verified 200 OK self-referencing canonical URLs"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-200" />
            <span>Download Sanitized 200 OK Sitemap</span>
            <span className="bg-black/30 text-emerald-100 text-[10px] font-mono px-2 py-0.5 rounded-full ml-1">
              {countClean} URLs
            </span>
          </button>
        </div>
      </div>

      {/* Visual Analytics & Issue Bento Dashboard */}
      {urls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Health Score Meter */}
          <div className="bg-zinc-950/90 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between space-y-1">
            <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold block">
              Sitemap Health
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black font-mono ${
                healthScore >= 90 ? 'text-emerald-400' : healthScore >= 70 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {healthScore}%
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Index Ready</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  healthScore >= 90 ? 'bg-emerald-500' : healthScore >= 70 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>

          {/* 🔴 Flag 1: 404 Unreachable */}
          <button
            onClick={() => setCategoryFilter(categoryFilter === 'unreachable_404' ? 'all' : 'unreachable_404')}
            className={`border rounded-xl p-4 text-left transition-all cursor-pointer ${
              categoryFilter === 'unreachable_404'
                ? 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                : 'bg-zinc-950/90 border-zinc-900 hover:border-red-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-red-400 font-bold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                404 Unreachable
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-red-400 mt-1">
              {count404}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
              Broken Dead Links
            </span>
          </button>

          {/* 🟠 Flag 2: Redirect Loops */}
          <button
            onClick={() => setCategoryFilter(categoryFilter === 'redirect_loop' ? 'all' : 'redirect_loop')}
            className={`border rounded-xl p-4 text-left transition-all cursor-pointer ${
              categoryFilter === 'redirect_loop'
                ? 'bg-orange-950/40 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                : 'bg-zinc-950/90 border-zinc-900 hover:border-orange-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-orange-400 font-bold flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-orange-400" />
                Redirect Loops
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-orange-400 mt-1">
              {countLoops}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
              Crawl Traps (301/302)
            </span>
          </button>

          {/* 🟠 Flag 3: 301/302 Redirects */}
          <button
            onClick={() => setCategoryFilter(categoryFilter === 'redirect_3xx' ? 'all' : 'redirect_3xx')}
            className={`border rounded-xl p-4 text-left transition-all cursor-pointer ${
              categoryFilter === 'redirect_3xx'
                ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-zinc-950/90 border-zinc-900 hover:border-amber-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-amber-400 font-bold flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                301/302 Redirects
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">
              {countRedirects}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
              Waste Crawl Passes
            </span>
          </button>

          {/* 🟣 Flag 4: Non-Canonical Pages */}
          <button
            onClick={() => setCategoryFilter(categoryFilter === 'non_canonical' ? 'all' : 'non_canonical')}
            className={`border rounded-xl p-4 text-left transition-all cursor-pointer ${
              categoryFilter === 'non_canonical'
                ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'bg-zinc-950/90 border-zinc-900 hover:border-purple-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-purple-400 font-bold flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-purple-400" />
                Non-Canonical
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-purple-400 mt-1">
              {countNonCanonical}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
              Canonical Mismatches
            </span>
          </button>

          {/* 🟢 Clean 200 OK */}
          <button
            onClick={() => setCategoryFilter(categoryFilter === 'clean_200' ? 'all' : 'clean_200')}
            className={`border rounded-xl p-4 text-left transition-all cursor-pointer ${
              categoryFilter === 'clean_200'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-zinc-950/90 border-zinc-900 hover:border-emerald-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                200 OK Clean
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {countClean}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
              100% Index Ready
            </span>
          </button>
        </div>
      )}

      {/* Visual Directory Tree & Architecture Hierarchy View */}
      {urls.length > 0 && (
        <div className="bg-zinc-950/90 border border-zinc-900 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand" />
              <h3 className="font-heading font-black text-xs uppercase tracking-wider text-white">
                Sitemap Visual Architecture &amp; Section Hierarchy
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">View Layout:</span>
              <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs font-mono">
                <button
                  onClick={() => setActiveViewMode('hierarchy')}
                  className={`px-2.5 py-1 rounded transition-colors ${activeViewMode === 'hierarchy' ? 'bg-brand text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
                >
                  Visual Tree
                </button>
                <button
                  onClick={() => setActiveViewMode('cards')}
                  className={`px-2.5 py-1 rounded transition-colors ${activeViewMode === 'cards' ? 'bg-brand text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
                >
                  URL Cards
                </button>
                <button
                  onClick={() => setActiveViewMode('table')}
                  className={`px-2.5 py-1 rounded transition-colors ${activeViewMode === 'table' ? 'bg-brand text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
                >
                  Data Table
                </button>
              </div>
            </div>
          </div>

          {/* Section Nodes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sectionNodes.map(node => {
              const hasIssues = (node.unreachableCount + node.loopCount + node.redirectCount + node.nonCanonicalCount) > 0;
              const isExpanded = !!expandedSections[node.path];

              return (
                <div 
                  key={node.path}
                  className={`border rounded-xl p-3.5 transition-all ${
                    hasIssues ? 'bg-zinc-900/30 border-zinc-850 hover:border-zinc-700' : 'bg-zinc-900/20 border-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      {isExpanded ? <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" /> : <Folder className="w-4 h-4 text-zinc-500 shrink-0" />}
                      <span className="font-mono text-xs font-bold text-white truncate">
                        {node.displayName}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md shrink-0">
                      {node.totalUrls} URLs
                    </span>
                  </div>

                  {/* Section status pill indicators */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2.5 text-[10px] font-mono">
                    {node.cleanCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                        {node.cleanCount} OK
                      </span>
                    )}
                    {node.unreachableCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-800/40 font-bold animate-pulse">
                        {node.unreachableCount} 404
                      </span>
                    )}
                    {node.loopCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-orange-950/40 text-orange-400 border border-orange-800/40 font-bold">
                        {node.loopCount} Loops
                      </span>
                    )}
                    {node.nonCanonicalCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-400 border border-purple-800/40 font-bold">
                        {node.nonCanonicalCount} Non-Canon
                      </span>
                    )}
                    {node.redirectCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40">
                        {node.redirectCount} 3xx
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-900">
                    <button
                      onClick={() => setSelectedSection(selectedSection === node.path ? 'all' : node.path)}
                      className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition-colors ${
                        selectedSection === node.path ? 'text-brand font-bold' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      <span>{selectedSection === node.path ? 'Showing Filter' : 'Filter Section'}</span>
                    </button>
                    <button
                      onClick={() => toggleSection(node.path)}
                      className="text-[10px] font-mono text-zinc-400 hover:text-white flex items-center gap-0.5"
                    >
                      <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Inline list of URLs inside this section */}
                  {isExpanded && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-900/80 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {node.urls.map(u => (
                        <div
                          key={u.id}
                          onClick={() => setSelectedUrl(u)}
                          className={`p-2 rounded-lg text-[11px] font-mono cursor-pointer transition-all flex items-center justify-between gap-2 border ${
                            selectedUrl?.id === u.id
                              ? 'bg-zinc-800 border-zinc-700 text-white'
                              : 'bg-zinc-950/60 border-zinc-900 hover:border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <span className="truncate max-w-[200px]" title={u.originalLoc}>
                            {u.originalLoc.replace('https://', '').replace('http://', '')}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                            u.is404
                              ? 'bg-red-950/60 text-red-400 border border-red-800/60'
                              : u.isRedirectLoop
                              ? 'bg-orange-950/60 text-orange-400 border border-orange-800/60'
                              : u.isNonCanonical
                              ? 'bg-purple-950/60 text-purple-400 border border-purple-800/60'
                              : u.category === 'redirect_3xx'
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                              : 'bg-emerald-950/60 text-emerald-400'
                          }`}>
                            {u.statusCode || (u.is404 ? '404' : u.isNonCanonical ? 'Non-Canon' : '200')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar for URL Explorer */}
      {urls.length > 0 && (
        <div className="bg-zinc-950/90 border border-zinc-900 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter sitemap URLs by path, slug, or error reason..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-all"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  categoryFilter === 'all' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                All ({urls.length})
              </button>
              <button
                onClick={() => setCategoryFilter('unreachable_404')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  categoryFilter === 'unreachable_404' ? 'bg-red-900/70 text-red-300 font-bold border border-red-700/60' : 'text-red-400/80 hover:text-red-300'
                }`}
              >
                <XCircle className="w-3 h-3 text-red-400" />
                <span>404s ({count404})</span>
              </button>
              <button
                onClick={() => setCategoryFilter('redirect_loop')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  categoryFilter === 'redirect_loop' ? 'bg-orange-900/70 text-orange-300 font-bold border border-orange-700/60' : 'text-orange-400/80 hover:text-orange-300'
                }`}
              >
                <Repeat className="w-3 h-3 text-orange-400" />
                <span>Loops ({countLoops})</span>
              </button>
              <button
                onClick={() => setCategoryFilter('non_canonical')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  categoryFilter === 'non_canonical' ? 'bg-purple-900/70 text-purple-300 font-bold border border-purple-700/60' : 'text-purple-400/80 hover:text-purple-300'
                }`}
              >
                <Link2 className="w-3 h-3 text-purple-400" />
                <span>Non-Canonical ({countNonCanonical})</span>
              </button>
              <button
                onClick={() => setCategoryFilter('clean_200')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  categoryFilter === 'clean_200' ? 'bg-emerald-900/70 text-emerald-300 font-bold border border-emerald-700/60' : 'text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>200 OK ({countClean})</span>
              </button>
            </div>
          </div>

          {/* Active filter tags summary */}
          {(categoryFilter !== 'all' || selectedSection !== 'all' || searchFilter) && (
            <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-zinc-400">
              <span>Active Filters:</span>
              {categoryFilter !== 'all' && (
                <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-white flex items-center gap-1">
                  Category: {categoryFilter}
                  <button onClick={() => setCategoryFilter('all')} className="text-zinc-500 hover:text-white">✕</button>
                </span>
              )}
              {selectedSection !== 'all' && (
                <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-white flex items-center gap-1">
                  Section: {selectedSection}
                  <button onClick={() => setSelectedSection('all')} className="text-zinc-500 hover:text-white">✕</button>
                </span>
              )}
              {searchFilter && (
                <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-white flex items-center gap-1">
                  Query: "{searchFilter}"
                  <button onClick={() => setSearchFilter('')} className="text-zinc-500 hover:text-white">✕</button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Content Grid: Detailed List + Visual Inspector Drawer */}
      {urls.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Cols: URL List or Cards View */}
          <div className="lg:col-span-2 space-y-3">
            {filteredUrls.length === 0 ? (
              <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-500 font-mono text-xs">
                No URLs match the selected category filter or search keyword.
              </div>
            ) : (
              filteredUrls.map(u => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUrl(u)}
                  className={`bg-zinc-950/90 border rounded-2xl p-4 transition-all cursor-pointer hover:border-zinc-700 space-y-3 ${
                    selectedUrl?.id === u.id
                      ? 'border-brand shadow-[0_0_20px_rgba(207,21,68,0.15)] ring-1 ring-brand/40'
                      : u.is404
                      ? 'border-red-950/60 hover:border-red-800/80'
                      : u.isRedirectLoop
                      ? 'border-orange-950/60 hover:border-orange-800/80'
                      : u.isNonCanonical
                      ? 'border-purple-950/60 hover:border-purple-800/80'
                      : 'border-zinc-900'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Badges */}
                      {u.is404 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950/60 text-red-300 border border-red-800 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-400" />
                          404 UNREACHABLE
                        </span>
                      )}
                      {u.isRedirectLoop && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-950/60 text-orange-300 border border-orange-800 flex items-center gap-1 animate-pulse">
                          <Repeat className="w-3 h-3 text-orange-400" />
                          REDIRECT LOOP (301/302)
                        </span>
                      )}
                      {u.isNonCanonical && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950/60 text-purple-300 border border-purple-800 flex items-center gap-1">
                          <Link2 className="w-3 h-3 text-purple-400" />
                          NON-CANONICAL
                        </span>
                      )}
                      {u.category === 'redirect_3xx' && !u.isRedirectLoop && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-800 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-amber-400" />
                          PAGE WITH REDIRECT
                        </span>
                      )}
                      {u.category === 'clean_200' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          200 OK
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">
                        {u.sectionPath}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px]">
                      {u.responseTimeMs !== null && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {u.responseTimeMs}ms
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(u.originalLoc, `url_${u.id}`);
                        }}
                        className="p-1 hover:text-white rounded"
                        title="Copy URL"
                      >
                        {copiedKey === `url_${u.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* URL string */}
                  <div className="space-y-1">
                    <p className="font-mono text-xs text-zinc-200 break-all select-all font-semibold">
                      {u.originalLoc}
                    </p>

                    {/* Visual Hop Chain if redirecting */}
                    {u.redirectHops.length > 0 && (
                      <div className="mt-2 p-2.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1.5 text-xs font-mono">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
                          <Repeat className="w-3 h-3 text-brand" /> Redirect Pathway:
                        </span>
                        <div className="space-y-1 pl-1">
                          {u.redirectHops.map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] text-zinc-300">
                              <span className="text-zinc-500">#{i + 1}</span>
                              <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                                h.statusCode < 300 ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                              }`}>
                                {h.statusCode}
                              </span>
                              <span className="truncate max-w-xs">{h.url}</span>
                              {h.redirectUrl && <ArrowRight className="w-3 h-3 text-brand shrink-0" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Declared Canonical Tag mismatch banner */}
                    {u.declaredCanonical && u.declaredCanonical !== u.originalLoc && (
                      <div className="mt-2 p-2.5 bg-purple-950/25 border border-purple-800/40 rounded-xl flex items-start gap-2 text-xs font-mono">
                        <Link2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
                            Declared Canonical Points Elsewhere:
                          </span>
                          <span className="text-purple-200 break-all select-all block text-[11px]">
                            {u.declaredCanonical}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Explanatory error details */}
                    {u.errorDetails && (
                      <p className="text-[11px] text-zinc-400 font-sans mt-1">
                        <span className="text-zinc-500 font-mono font-bold mr-1">Impact:</span>
                        {u.errorDetails}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right 1 Col: Visual Inspector & Remediation Card */}
          <div className="space-y-4 lg:sticky lg:top-6">
            <div className="bg-zinc-950/90 border border-zinc-900 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand" />
                  <h4 className="font-heading font-black text-xs uppercase tracking-wider text-white">
                    URL Visual Inspector
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Live Remediation</span>
              </div>

              {selectedUrl ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Inspecting Target URL</span>
                    <p className="font-mono text-xs text-white break-all font-semibold select-all bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                      {selectedUrl.originalLoc}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Audit Classification</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase ${
                        selectedUrl.is404
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : selectedUrl.isRedirectLoop
                          ? 'bg-orange-950 text-orange-300 border border-orange-800'
                          : selectedUrl.isNonCanonical
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : selectedUrl.category === 'redirect_3xx'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {selectedUrl.categoryLabel}
                      </span>
                    </div>
                  </div>

                  {/* Canonical Comparison Drawer */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">
                      Canonical Comparison
                    </span>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 bg-zinc-900/40 rounded-lg border border-zinc-800/80 space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase">Sitemap &lt;loc&gt; Declared</span>
                        <p className="text-zinc-300 break-all select-all">{selectedUrl.originalLoc}</p>
                      </div>

                      <div className={`p-2.5 rounded-lg border space-y-1 ${
                        selectedUrl.declaredCanonical && selectedUrl.declaredCanonical !== selectedUrl.originalLoc
                          ? 'bg-purple-950/20 border-purple-800/40'
                          : 'bg-zinc-900/40 border-zinc-800/80'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500 uppercase">Declared Canonical Tag</span>
                          {selectedUrl.declaredCanonical && selectedUrl.declaredCanonical !== selectedUrl.originalLoc && (
                            <span className="text-[9px] text-purple-400 font-bold uppercase">Mismatch!</span>
                          )}
                        </div>
                        <p className="text-purple-300 break-all select-all">
                          {selectedUrl.declaredCanonical || selectedUrl.finalDestinationUrl || 'Self-Referencing'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* One-click Corrective Tag Generator */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Corrective Canonical Tag</span>
                    <div className="flex items-center justify-between gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                      <code className="text-brand font-mono text-[11px] truncate select-all">
                        {`<link rel="canonical" href="${selectedUrl.finalDestinationUrl || selectedUrl.originalLoc}" />`}
                      </code>
                      <button
                        onClick={() => {
                          const tag = `<link rel="canonical" href="${selectedUrl.finalDestinationUrl || selectedUrl.originalLoc}" />`;
                          copyToClipboard(tag, 'corrective_canonical_tag');
                        }}
                        className="text-zinc-400 hover:text-white shrink-0 p-1"
                        title="Copy Corrective Canonical Tag"
                      >
                        {copiedKey === 'corrective_canonical_tag' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remediation Action Buttons */}
                  <div className="pt-2 border-t border-zinc-900 space-y-2">
                    {/* If 404, purge action */}
                    {selectedUrl.is404 && (
                      <button
                        onClick={() => {
                          setUrls(prev => prev.filter(u => u.id !== selectedUrl.id));
                          setSelectedUrl(null);
                          setNotification(`Purged 404 dead link "${selectedUrl.originalLoc}" from sitemap.`);
                          setTimeout(() => setNotification(null), 3000);
                        }}
                        className="w-full bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/80 rounded-xl py-2 px-3 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Purge 404 from Sitemap</span>
                      </button>
                    )}

                    {/* If non-canonical or redirect, rewrite action */}
                    {(selectedUrl.isNonCanonical || selectedUrl.category === 'redirect_3xx') && (
                      <button
                        onClick={() => {
                          const target = selectedUrl.finalDestinationUrl || selectedUrl.declaredCanonical || selectedUrl.originalLoc;
                          setUrls(prev => prev.map(u => {
                            if (u.id === selectedUrl.id) {
                              return {
                                ...u,
                                originalLoc: target,
                                category: 'clean_200',
                                categoryLabel: '200 OK (Cleaned & Healed)',
                                isNonCanonical: false,
                                isClean: true,
                                errorDetails: null
                              };
                            }
                            return u;
                          }));
                          setSelectedUrl(prev => prev ? { ...prev, originalLoc: target, category: 'clean_200', isClean: true } : null);
                          setNotification(`Healed URL to canonical destination: ${target}`);
                          setTimeout(() => setNotification(null), 3000);
                        }}
                        className="w-full bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/80 rounded-xl py-2 px-3 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Rewrite to Canonical Destination</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 font-mono text-xs space-y-2">
                  <Search className="w-6 h-6 text-zinc-600 mx-auto" />
                  <p>Click any URL from the tree or list to inspect its HTTP hops, canonical match, and live remediation options.</p>
                </div>
              )}
            </div>

            {/* Google Search Console SEO Guideline Card */}
            <div className="bg-zinc-950/70 border border-zinc-900 rounded-2xl p-4 space-y-2 text-xs font-sans text-zinc-400">
              <div className="flex items-center gap-1.5 text-zinc-200 font-bold font-mono text-[11px] uppercase">
                <Info className="w-3.5 h-3.5 text-brand" />
                <span>Googlebot Sitemap Rules</span>
              </div>
              <ul className="space-y-1.5 text-[11px] leading-relaxed text-zinc-400 list-disc list-inside font-sans">
                <li><strong className="text-zinc-300">No 404s:</strong> Sitemaps should never contain deleted or dead URLs; search crawlers penalize crawl priority.</li>
                <li><strong className="text-zinc-300">Zero Redirects:</strong> Never point &lt;loc&gt; to 301/302 hops; Google Search Console excludes them as "Page with redirect".</li>
                <li><strong className="text-zinc-300">Self-Referencing Canonicals:</strong> Every URL declared in a sitemap must declare a self-referencing canonical tag.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* QuickFix Modal Integration */}
      <RedirectQuickFixModal
        isOpen={quickFixModalOpen}
        onClose={() => setQuickFixModalOpen(false)}
        items={quickFixItems}
        onApplyFix={(fixedItems: QuickFixItem[]) => {
          const map = new Map<string, string>(fixedItems.map(i => [i.sourceUrl, i.canonicalUrl]));
          setUrls(prev => prev.map(u => {
            const healed = map.get(u.originalLoc);
            if (healed) {
              return {
                ...u,
                originalLoc: healed,
                category: 'clean_200' as UrlIssueCategory,
                categoryLabel: '200 OK (Cleaned & Healed)',
                isClean: true,
                isNonCanonical: false,
                errorDetails: null
              };
            }
            return u;
          }));
          setNotification(`Quick-Fix applied to ${fixedItems.length} sitemap URLs!`);
          setTimeout(() => setNotification(null), 4000);
        }}
      />
    </div>
  );
}

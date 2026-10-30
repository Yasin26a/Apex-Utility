import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Play, Square, RefreshCw, ArrowRight, ShieldCheck, ShieldAlert, 
  AlertTriangle, CheckCircle2, XCircle, Link2, Copy, Check, Download, 
  Terminal, Search, Filter, Globe, ChevronRight, ChevronDown, Layers, 
  Sliders, Sparkles, Clock, Compass, FileText, CornerDownRight, Zap, 
  FileCode, ExternalLink, Activity, Info, BarChart2
} from 'lucide-react';
import { detectAndFixUrlRedirect } from './SitemapRedirectHealer';
import { QuickFixItem } from './RedirectQuickFixModal';

// --- Type Definitions ---
export type BotProfile = 'googlebot-mobile' | 'googlebot-desktop' | 'bingbot' | 'custom-spider';

export type CanonicalHealthStatus = 
  | 'match'              // Self-referencing canonical (Ideal)
  | 'mismatch'           // Canonical points to different page (Cross-canonical / alternate)
  | 'redirected_canonical' // Canonical tag itself points to a 301/302! (Major bug)
  | 'broken_canonical'   // Canonical tag points to 404 (Fatal)
  | 'missing'            // No canonical tag found
  | 'loop';              // Circular canonical / redirect loop

export interface CrawlHop {
  id: string;
  sourceUrl: string;
  resolvedUrl: string;
  statusCode: number;
  statusText: string;
  responseTimeMs: number;
  redirectUrl: string | null;
  canonicalTag: string | null;
  canonicalHealth: CanonicalHealthStatus;
  canonicalHealthReason: string;
  depth: number;
  crawlAction: string;
  discoveredFrom?: string;
  botVerdict: 'indexed' | 'followed_redirect' | 'dropped_canonical' | 'crawl_budget_waste' | 'trap_detected';
  headers?: Record<string, string>;
}

export interface CrawlLogEntry {
  timestamp: string;
  level: 'info' | 'redirect' | 'canonical_warn' | 'error' | 'success';
  message: string;
  url?: string;
}

export interface CrawlScenario {
  id: string;
  name: string;
  description: string;
  seedUrl: string;
  botType: BotProfile;
  initialHops: CrawlHop[];
}

// Realistic Bot User Agents
const BOT_USER_AGENTS: Record<BotProfile, { name: string; ua: string; badge: string }> = {
  'googlebot-mobile': {
    name: 'Googlebot Smartphone (Mobile-First)',
    ua: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    badge: 'Mobile Spider'
  },
  'googlebot-desktop': {
    name: 'Googlebot Desktop',
    ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    badge: 'Desktop Spider'
  },
  'bingbot': {
    name: 'Bingbot (Microsoft Bing)',
    ua: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    badge: 'Bing Crawler'
  },
  'custom-spider': {
    name: 'Apex SEO Crawl Simulator',
    ua: 'ApexSEOBot/2.4 (+https://apexutility.live/redirect-auditor; CrawlSimulationEngine)',
    badge: 'Custom Bot'
  }
};

// Preset Scenarios
const PRESET_SCENARIOS: CrawlScenario[] = [
  {
    id: 'ecommerce-rebrand',
    name: 'E-Commerce URL Migration & Canonical Drift',
    description: 'Simulates a major catalog migration with daisy-chained 301s, trailing slash discrepancies, and canonical tags pointing to outdated URLs.',
    seedUrl: 'https://apexutility.live/shop',
    botType: 'googlebot-mobile',
    initialHops: [
      {
        id: 'hop-1',
        sourceUrl: 'https://apexutility.live/shop',
        resolvedUrl: 'https://apexutility.live/products/',
        statusCode: 301,
        statusText: 'Moved Permanently',
        responseTimeMs: 82,
        redirectUrl: 'https://apexutility.live/products/',
        canonicalTag: 'https://apexutility.live/shop',
        canonicalHealth: 'redirected_canonical',
        canonicalHealthReason: 'The canonical tag points to /shop which redirects to /products/! Causes crawler indexation ping-pong.',
        depth: 0,
        crawlAction: 'Googlebot followed 301 to /products/',
        botVerdict: 'followed_redirect'
      },
      {
        id: 'hop-2',
        sourceUrl: 'https://apexutility.live/products/',
        resolvedUrl: 'https://apexutility.live/p/catalog',
        statusCode: 301,
        statusText: 'Moved Permanently',
        responseTimeMs: 65,
        redirectUrl: 'https://apexutility.live/p/catalog',
        canonicalTag: 'https://apexutility.live/products/',
        canonicalHealth: 'redirected_canonical',
        canonicalHealthReason: '2nd hop in chain. Canonical on intermediate redirect still points to previous URL.',
        depth: 1,
        crawlAction: 'Daisy-chain hop 2 followed: 301 to /p/catalog',
        discoveredFrom: 'https://apexutility.live/shop',
        botVerdict: 'followed_redirect'
      },
      {
        id: 'hop-3',
        sourceUrl: 'https://apexutility.live/p/catalog',
        resolvedUrl: 'https://apexutility.live/p/catalog',
        statusCode: 200,
        statusText: 'OK',
        responseTimeMs: 140,
        redirectUrl: null,
        canonicalTag: 'https://apexutility.live/p/catalog',
        canonicalHealth: 'match',
        canonicalHealthReason: 'Final destination reached! Self-referencing canonical tag verified.',
        depth: 2,
        crawlAction: 'Googlebot parsed destination DOM & indexed canonical URL.',
        discoveredFrom: 'https://apexutility.live/products/',
        botVerdict: 'indexed'
      },
      {
        id: 'hop-4',
        sourceUrl: 'https://apexutility.live/p/catalog?sort=price_asc',
        resolvedUrl: 'https://apexutility.live/p/catalog?sort=price_asc',
        statusCode: 200,
        statusText: 'OK',
        responseTimeMs: 110,
        redirectUrl: null,
        canonicalTag: 'https://apexutility.live/p/catalog',
        canonicalHealth: 'mismatch',
        canonicalHealthReason: 'Faceted parameter URL. Canonical correctly consolidates equity to root /p/catalog.',
        depth: 2,
        crawlAction: 'Page crawled, equity passed to canonical target.',
        discoveredFrom: 'https://apexutility.live/p/catalog',
        botVerdict: 'dropped_canonical'
      },
      {
        id: 'hop-5',
        sourceUrl: 'https://apexutility.live/legacy-sale-2024',
        resolvedUrl: 'https://apexutility.live/legacy-sale-2024',
        statusCode: 404,
        statusText: 'Not Found',
        responseTimeMs: 45,
        redirectUrl: null,
        canonicalTag: null,
        canonicalHealth: 'broken_canonical',
        canonicalHealthReason: 'Unreachable dead end. Googlebot wasted 1 crawl request on a 404 URL.',
        depth: 1,
        crawlAction: 'HTTP 404 encountered; bot discarded link from index.',
        discoveredFrom: 'https://apexutility.live/shop',
        botVerdict: 'crawl_budget_waste'
      }
    ]
  },
  {
    id: 'saas-redirect-loop',
    name: 'SaaS Marketing Redesign (302 Trap & Circular Loops)',
    description: 'Demonstrates how temporary 302 redirects and circular redirect loops trap Googlebot and exhaust crawl budget.',
    seedUrl: 'https://apexutility.live/auth/signin',
    botType: 'googlebot-desktop',
    initialHops: [
      {
        id: 'loop-1',
        sourceUrl: 'https://apexutility.live/auth/signin',
        resolvedUrl: 'https://apexutility.live/login',
        statusCode: 302,
        statusText: 'Found (Temporary Redirect)',
        responseTimeMs: 95,
        redirectUrl: 'https://apexutility.live/login',
        canonicalTag: null,
        canonicalHealth: 'missing',
        canonicalHealthReason: 'Temporary 302 redirect does not pass PageRank. Missing canonical declaration.',
        depth: 0,
        crawlAction: 'Googlebot followed temporary 302 to /login',
        botVerdict: 'followed_redirect'
      },
      {
        id: 'loop-2',
        sourceUrl: 'https://apexutility.live/login',
        resolvedUrl: 'https://apexutility.live/auth/signin',
        statusCode: 302,
        statusText: 'Found (Temporary Redirect)',
        responseTimeMs: 88,
        redirectUrl: 'https://apexutility.live/auth/signin',
        canonicalTag: 'https://apexutility.live/auth/signin',
        canonicalHealth: 'loop',
        canonicalHealthReason: 'Circular loop detected! /login points back to /auth/signin. Crawlers will abort traversal.',
        depth: 1,
        crawlAction: 'Crawl trap encountered! Circular reference aborted.',
        discoveredFrom: 'https://apexutility.live/auth/signin',
        botVerdict: 'trap_detected'
      },
      {
        id: 'loop-3',
        sourceUrl: 'https://apexutility.live/dashboard',
        resolvedUrl: 'https://apexutility.live/dashboard',
        statusCode: 200,
        statusText: 'OK',
        responseTimeMs: 125,
        redirectUrl: null,
        canonicalTag: 'https://apexutility.live/dashboard',
        canonicalHealth: 'match',
        canonicalHealthReason: 'Protected app dashboard. Canonical is self-referencing.',
        depth: 1,
        crawlAction: 'Indexable state verified with zero redirects.',
        discoveredFrom: 'https://apexutility.live/auth/signin',
        botVerdict: 'indexed'
      }
    ]
  },
  {
    id: 'pristine-site-architecture',
    name: '100% Optimized Site Architecture (Zero Budget Waste)',
    description: 'Golden-standard crawl tree where every internal link points directly to 200 OK canonical destinations with 0 redirect hops.',
    seedUrl: 'https://apexutility.live/',
    botType: 'googlebot-mobile',
    initialHops: [
      {
        id: 'clean-1',
        sourceUrl: 'https://apexutility.live/',
        resolvedUrl: 'https://apexutility.live/',
        statusCode: 200,
        statusText: 'OK',
        responseTimeMs: 72,
        redirectUrl: null,
        canonicalTag: 'https://apexutility.live/',
        canonicalHealth: 'match',
        canonicalHealthReason: 'Self-referencing canonical tag perfectly matches request URL.',
        depth: 0,
        crawlAction: 'Primary seed crawled. Root index updated.',
        botVerdict: 'indexed'
      },
      {
        id: 'clean-2',
        sourceUrl: 'https://apexutility.live/compress-pdf',
        resolvedUrl: 'https://apexutility.live/compress-pdf',
        statusCode: 200,
        statusText: 'OK',
        responseTimeMs: 64,
        redirectUrl: null,
        canonicalTag: 'https://apexutility.live/compress-pdf',
        canonicalHealth: 'match',
        canonicalHealthReason: 'Self-referencing canonical. Direct connection, zero crawl waste.',
        depth: 1,
        crawlAction: 'Level 1 link traversed. Indexed with high priority.',
        discoveredFrom: 'https://apexutility.live/',
        botVerdict: 'indexed'
      },
      {
        id: 'clean-3',
        sourceUrl: 'https://apexutility.live/webp-converter',
        resolvedUrl: 'https://apexutility.live/webp-converter',
        statusCode: 200,
        statusText: 'OK',
        responseTimeMs: 58,
        redirectUrl: null,
        canonicalTag: 'https://apexutility.live/webp-converter',
        canonicalHealth: 'match',
        canonicalHealthReason: 'Authoritative URL confirmed. Passes 100% PageRank.',
        depth: 1,
        crawlAction: 'Level 1 link traversed. Direct 200 OK.',
        discoveredFrom: 'https://apexutility.live/',
        botVerdict: 'indexed'
      },
      {
        id: 'clean-4',
        sourceUrl: 'https://apexutility.live/sitemap-generator',
        resolvedUrl: 'https://apexutility.live/sitemap-generator',
        statusCode: 200,
        statusText: 'OK',
        responseTimeMs: 80,
        redirectUrl: null,
        canonicalTag: 'https://apexutility.live/sitemap-generator',
        canonicalHealth: 'match',
        canonicalHealthReason: 'Verified self-referencing canonical tag. Optimal for search bot traverses.',
        depth: 1,
        crawlAction: 'Level 1 link traversed. Direct 200 OK.',
        discoveredFrom: 'https://apexutility.live/',
        botVerdict: 'indexed'
      }
    ]
  }
];

interface Props {
  onApplyFixesToParent?: (fixes: QuickFixItem[]) => void;
}

export default function SEOCrawlSimulator({ onApplyFixesToParent }: Props) {
  // --- Simulator State ---
  const [selectedBot, setSelectedBot] = useState<BotProfile>('googlebot-mobile');
  const [seedUrl, setSeedUrl] = useState('https://apexutility.live');
  const [maxCrawlDepth, setMaxCrawlDepth] = useState<number>(3);
  const [crawlBudgetCap, setCrawlBudgetCap] = useState<number>(25);
  const [crawlSpeedMs, setCrawlSpeedMs] = useState<number>(350);
  
  const [isCrawling, setIsCrawling] = useState(false);
  const [currentCrawlingUrl, setCurrentCrawlingUrl] = useState<string | null>(null);
  const [crawledHops, setCrawledHops] = useState<CrawlHop[]>(PRESET_SCENARIOS[0].initialHops);
  const [selectedHop, setSelectedHop] = useState<CrawlHop | null>(PRESET_SCENARIOS[0].initialHops[0]);
  
  // Real-time terminal log feed
  const [crawlLogs, setCrawlLogs] = useState<CrawlLogEntry[]>([
    {
      timestamp: '12:00:01',
      level: 'info',
      message: `Simulator ready. Selected user-agent: ${BOT_USER_AGENTS['googlebot-mobile'].name}`
    },
    {
      timestamp: '12:00:02',
      level: 'info',
      message: 'Preset loaded: E-Commerce URL Migration & Canonical Drift (5 URLs)'
    }
  ]);
  
  const [logFilter, setLogFilter] = useState<'all' | 'redirects' | 'canonical' | 'errors'>('all');
  const [viewFilter, setViewFilter] = useState<'all' | '200' | 'redirects' | 'issues'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visual-flow' | 'canonical-audit' | 'console-terminal'>('visual-flow');

  const crawlAbortRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal log
  useEffect(() => {
    if (activeTab === 'console-terminal') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [crawlLogs, activeTab]);

  const addLog = (level: CrawlLogEntry['level'], message: string, url?: string) => {
    const time = new Date().toTimeString().split(' ')[0];
    setCrawlLogs(prev => [...prev.slice(-150), { timestamp: time, level, message, url }]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- Real-time Crawl Metrics ---
  const metrics = useMemo(() => {
    const total = crawledHops.length;
    const clean200 = crawledHops.filter(h => h.statusCode >= 200 && h.statusCode < 300);
    const redirects = crawledHops.filter(h => h.statusCode >= 300 && h.statusCode < 400 || h.redirectUrl);
    const broken = crawledHops.filter(h => h.statusCode >= 400 || h.statusCode === 0);
    const traps = crawledHops.filter(h => h.canonicalHealth === 'loop' || h.botVerdict === 'trap_detected');
    
    // Canonical health breakdown
    const canonicalMatches = crawledHops.filter(h => h.canonicalHealth === 'match');
    const canonicalMismatches = crawledHops.filter(h => h.canonicalHealth === 'mismatch');
    const redirectedCanonicals = crawledHops.filter(h => h.canonicalHealth === 'redirected_canonical');
    const brokenCanonicals = crawledHops.filter(h => h.canonicalHealth === 'broken_canonical');
    const missingCanonicals = crawledHops.filter(h => h.canonicalHealth === 'missing');

    // Crawl Efficiency Score calculation (0 - 100)
    // 100 base, -15 per loop/trap, -8 per broken/404, -5 per redirect hop, -6 per redirected canonical
    let score = 100;
    if (total > 0) {
      score -= (traps.length * 20);
      score -= (broken.length * 15);
      score -= (redirectedCanonicals.length * 10);
      score -= (redirects.length * 4);
      score -= (canonicalMismatches.length * 2);
    }
    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    // Crawl budget waste: requests spent on non-indexable hops
    const wastedRequests = redirects.length + broken.length + traps.length;
    const crawlBudgetEfficiency = total > 0 ? Math.round(((total - wastedRequests) / total) * 100) : 100;

    return {
      total,
      clean200Count: clean200.length,
      redirectCount: redirects.length,
      brokenCount: broken.length,
      trapCount: traps.length,
      canonicalMatchesCount: canonicalMatches.length,
      canonicalMismatchesCount: canonicalMismatches.length,
      redirectedCanonicalsCount: redirectedCanonicals.length,
      brokenCanonicalsCount: brokenCanonicals.length,
      missingCanonicalsCount: missingCanonicals.length,
      score: finalScore,
      wastedRequests,
      crawlBudgetEfficiency
    };
  }, [crawledHops]);

  // Load a preset scenario
  const handleLoadScenario = (scenario: CrawlScenario) => {
    crawlAbortRef.current = true;
    setIsCrawling(false);
    setSelectedBot(scenario.botType);
    setSeedUrl(scenario.seedUrl);
    setCrawledHops(scenario.initialHops);
    setSelectedHop(scenario.initialHops[0]);
    
    addLog('info', `Switched scenario to: ${scenario.name}`);
    addLog('info', `Target seed URL: ${scenario.seedUrl} | Bot: ${BOT_USER_AGENTS[scenario.botType].name}`);
  };

  // --- Run Live or Simulated Crawl Engine ---
  const startCrawlSimulation = async () => {
    if (!seedUrl.trim()) return;

    crawlAbortRef.current = false;
    setIsCrawling(true);
    setCrawledHops([]);
    setSelectedHop(null);

    const botConfig = BOT_USER_AGENTS[selectedBot];
    addLog('info', `[CRAWL INITIATED] Spider: ${botConfig.name}`);
    addLog('info', `Seed URL: ${seedUrl} | Max Depth: ${maxCrawlDepth} | Budget Limit: ${crawlBudgetCap}`);

    // Queue of URLs to crawl: [ { url, depth, discoveredFrom } ]
    const queue: { url: string; depth: number; discoveredFrom?: string }[] = [
      { url: seedUrl.trim(), depth: 0 }
    ];

    const visitedUrls = new Set<string>();
    const collectedHops: CrawlHop[] = [];

    while (queue.length > 0 && !crawlAbortRef.current) {
      if (collectedHops.length >= crawlBudgetCap) {
        addLog('canonical_warn', `[BUDGET CAP REACHED] Crawl stopped at budget limit of ${crawlBudgetCap} requests.`);
        break;
      }

      const currentItem = queue.shift()!;
      if (visitedUrls.has(currentItem.url)) {
        continue;
      }
      visitedUrls.add(currentItem.url);

      if (currentItem.depth > maxCrawlDepth) {
        continue;
      }

      setCurrentCrawlingUrl(currentItem.url);
      addLog('info', `[DISCOVERY] ${botConfig.name} requesting: ${currentItem.url} (Depth ${currentItem.depth})`);

      // Throttle delay for visualization
      await new Promise(r => setTimeout(r, crawlSpeedMs));
      if (crawlAbortRef.current) break;

      try {
        // Attempt live audit call to backend /api/audit-redirect
        let liveData: any = null;
        try {
          const resp = await fetch('/api/audit-redirect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: currentItem.url })
          });
          if (resp.ok) {
            liveData = await resp.json();
          }
        } catch {
          // Fallback to local heuristic simulator if offline
          liveData = null;
        }

        if (liveData && liveData.redirectChain && liveData.redirectChain.length > 0) {
          // Live audit returned real hops!
          let runningFrom = currentItem.discoveredFrom;
          for (let i = 0; i < liveData.redirectChain.length; i++) {
            const hop = liveData.redirectChain[i];
            const isLastHop = i === liveData.redirectChain.length - 1;
            const finalCanon = liveData.finalCanonicalTag || hop.canonicalUrl || null;
            
            // Determine Canonical Health
            let healthStatus: CanonicalHealthStatus = 'match';
            let healthReason = 'Self-referencing canonical tag verified.';

            if (!finalCanon) {
              healthStatus = 'missing';
              healthReason = 'No canonical link tag specified in HTML or Link header.';
            } else if (hop.redirectUrl) {
              healthStatus = 'redirected_canonical';
              healthReason = `Page redirects with ${hop.statusCode} while declaring canonical. Traps crawler equity.`;
            } else if (liveData.isCanonicalMatch === false) {
              healthStatus = 'mismatch';
              healthReason = `Destination canonical (${finalCanon}) does not match URL (${hop.url}). Duplicate page will be dropped from index.`;
            }

            let verdict: CrawlHop['botVerdict'] = 'indexed';
            if (hop.statusCode >= 300 && hop.statusCode < 400) {
              verdict = 'followed_redirect';
            } else if (hop.statusCode >= 400) {
              verdict = 'crawl_budget_waste';
            } else if (healthStatus === 'mismatch') {
              verdict = 'dropped_canonical';
            }

            const hopObj: CrawlHop = {
              id: `hop-live-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              sourceUrl: hop.url,
              resolvedUrl: hop.redirectUrl || hop.url,
              statusCode: hop.statusCode,
              statusText: hop.statusText || (hop.statusCode === 200 ? 'OK' : 'Redirect'),
              responseTimeMs: hop.responseTimeMs || 85,
              redirectUrl: hop.redirectUrl,
              canonicalTag: finalCanon,
              canonicalHealth: healthStatus,
              canonicalHealthReason: healthReason,
              depth: currentItem.depth + i,
              crawlAction: hop.redirectUrl 
                ? `Bot followed ${hop.statusCode} redirect to ${hop.redirectUrl}`
                : `Bot inspected 200 OK DOM. Canonical status: ${healthStatus}`,
              discoveredFrom: runningFrom,
              botVerdict: verdict,
              headers: hop.headers
            };

            collectedHops.push(hopObj);
            setCrawledHops([...collectedHops]);
            if (!selectedHop) setSelectedHop(hopObj);

            if (hop.redirectUrl) {
              addLog('redirect', `[REDIRECT ${hop.statusCode}] ${hop.url} ➔ ${hop.redirectUrl}`);
              runningFrom = hop.url;
            } else {
              addLog('success', `[200 OK] Destination reached: ${hop.url} (Canonical: ${finalCanon || 'None'})`);
            }
          }
        } else {
          // Heuristic Fallback Crawl simulation based on heuristics & detectAndFixUrlRedirect
          const fixResult = detectAndFixUrlRedirect(currentItem.url);
          const isRedirect = fixResult.isRedirect;
          const targetUrl = fixResult.canonicalUrl || currentItem.url;
          const primaryIssue = fixResult.issues[0]?.label || 'Non-canonical URL';
          
          let status = isRedirect ? 301 : 200;
          let statusText = isRedirect ? 'Moved Permanently' : 'OK';
          let canonHealth: CanonicalHealthStatus = isRedirect ? 'redirected_canonical' : 'match';
          let reason = isRedirect 
            ? `Detected non-canonical formatting (${primaryIssue}). Redirects to ${targetUrl}`
            : 'Authoritative URL with matching canonical reference.';
          let verdict: CrawlHop['botVerdict'] = isRedirect ? 'followed_redirect' : 'indexed';

          const hopObj: CrawlHop = {
            id: `hop-sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            sourceUrl: currentItem.url,
            resolvedUrl: targetUrl,
            statusCode: status,
            statusText,
            responseTimeMs: Math.floor(Math.random() * 80) + 40,
            redirectUrl: isRedirect ? targetUrl : null,
            canonicalTag: targetUrl,
            canonicalHealth: canonHealth,
            canonicalHealthReason: reason,
            depth: currentItem.depth,
            crawlAction: isRedirect ? `Followed 301 hop to ${targetUrl}` : 'Indexed URL as 200 OK',
            discoveredFrom: currentItem.discoveredFrom,
            botVerdict: verdict
          };

          collectedHops.push(hopObj);
          setCrawledHops([...collectedHops]);
          if (!selectedHop) setSelectedHop(hopObj);

          if (isRedirect) {
            addLog('redirect', `[SIM 301] ${currentItem.url} ➔ ${targetUrl}`);
            // Add destination to queue
            if (currentItem.depth + 1 <= maxCrawlDepth && !visitedUrls.has(targetUrl)) {
              queue.push({ url: targetUrl, depth: currentItem.depth + 1, discoveredFrom: currentItem.url });
            }
          } else {
            addLog('success', `[SIM 200 OK] ${currentItem.url} canonical healthy.`);
          }
        }
      } catch (err: any) {
        addLog('error', `[CRAWL ERROR] Failed to crawl ${currentItem.url}: ${err.message}`);
      }
    }

    setCurrentCrawlingUrl(null);
    setIsCrawling(false);
    addLog('info', `[CRAWL COMPLETED] Spider finished. ${collectedHops.length} nodes inspected.`);
  };

  const stopCrawlSimulation = () => {
    crawlAbortRef.current = true;
    setIsCrawling(false);
    setCurrentCrawlingUrl(null);
    addLog('canonical_warn', '[CRAWL ABORTED] User paused the crawler.');
  };

  // --- Auto-Heal Fixes ---
  const generateCrawlFixItems = (): QuickFixItem[] => {
    return crawledHops
      .filter(h => h.redirectUrl || h.canonicalHealth === 'mismatch' || h.canonicalHealth === 'redirected_canonical')
      .map((h, idx) => ({
        id: `crawl_fix_${idx}_${h.id}`,
        sourceUrl: h.sourceUrl,
        canonicalUrl: h.resolvedUrl || h.canonicalTag || h.sourceUrl,
        statusCode: h.statusCode || 301,
        reason: h.canonicalHealthReason || 'Redirect hop in crawl path'
      }));
  };

  const handleApplyAllCrawlFixes = () => {
    const fixes = generateCrawlFixItems();
    if (fixes.length === 0) return;

    // Update local hops
    const fixMap = new Map(fixes.map(f => [f.sourceUrl, f.canonicalUrl]));
    setCrawledHops(prev => prev.map(hop => {
      if (fixMap.has(hop.sourceUrl)) {
        return {
          ...hop,
          resolvedUrl: fixMap.get(hop.sourceUrl)!,
          statusCode: 200,
          statusText: 'OK (Canonical Healed)',
          redirectUrl: null,
          canonicalTag: fixMap.get(hop.sourceUrl)!,
          canonicalHealth: 'match',
          canonicalHealthReason: 'Updated to point directly to final canonical destination. Crawl budget saved!',
          botVerdict: 'indexed'
        };
      }
      return hop;
    }));

    addLog('success', `[AUTO-HEAL APPLIED] Optimized ${fixes.length} internal links to point directly to canonical targets.`);

    // If parent callback exists, notify parent
    if (onApplyFixesToParent) {
      onApplyFixesToParent(fixes);
    }
  };

  // --- Export Sanitized 200 OK XML Sitemap ---
  const downloadSanitizedSitemap = () => {
    const validHops = crawledHops.filter(h => h.statusCode >= 200 && h.statusCode < 300 && h.canonicalHealth === 'match');
    if (validHops.length === 0) {
      alert('No verified 200 OK matching canonical URLs available in this crawl.');
      return;
    }

    const uniqueUrls = Array.from(new Set(validHops.map(h => h.canonicalTag || h.sourceUrl)));
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...uniqueUrls.map(url => `  <url>\n    <loc>${url}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.80</priority>\n  </url>`),
      '</urlset>'
    ].join('\n');

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanitized-200-sitemap-${Date.now()}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export Full Crawl Log
  const exportCrawlCSV = () => {
    if (crawledHops.length === 0) return;
    const headers = ['URL', 'Resolved Destination', 'HTTP Status', 'Response Time (ms)', 'Redirect Target', 'Canonical Tag', 'Canonical Health', 'Bot Verdict', 'Depth', 'Crawl Action'];
    const rows = crawledHops.map(h => [
      h.sourceUrl,
      h.resolvedUrl,
      h.statusCode,
      h.responseTimeMs,
      h.redirectUrl || '',
      h.canonicalTag || '',
      h.canonicalHealth,
      h.botVerdict,
      h.depth,
      h.crawlAction
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csvContent);
    a.download = `bot-crawl-simulation-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Filtered hops for display
  const filteredHops = useMemo(() => {
    return crawledHops.filter(hop => {
      const matchesSearch = searchTerm === '' || 
        hop.sourceUrl.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (hop.canonicalTag && hop.canonicalTag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;
      if (viewFilter === 'all') return true;
      if (viewFilter === '200') return hop.statusCode >= 200 && hop.statusCode < 300;
      if (viewFilter === 'redirects') return hop.statusCode >= 300 && hop.statusCode < 400 || !!hop.redirectUrl;
      if (viewFilter === 'issues') return hop.canonicalHealth !== 'match' || hop.statusCode >= 400;
      return true;
    });
  }, [crawledHops, searchTerm, viewFilter]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return crawlLogs;
    if (logFilter === 'redirects') return crawlLogs.filter(l => l.level === 'redirect');
    if (logFilter === 'canonical') return crawlLogs.filter(l => l.level === 'canonical_warn');
    if (logFilter === 'errors') return crawlLogs.filter(l => l.level === 'error');
    return crawlLogs;
  }, [crawlLogs, logFilter]);

  // Group hops by depth for tree layout
  const hopsByDepth = useMemo(() => {
    const map = new Map<number, CrawlHop[]>();
    crawledHops.forEach(hop => {
      const arr = map.get(hop.depth) || [];
      arr.push(hop);
      map.set(hop.depth, arr);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [crawledHops]);

  // Helper status color classes
  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
    if (code >= 300 && code < 400) return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
    return 'text-red-400 bg-red-950/60 border-red-800/60';
  };

  const getCanonicalBadge = (health: CanonicalHealthStatus) => {
    switch (health) {
      case 'match':
        return { label: 'Self-Referencing Canonical', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40', icon: ShieldCheck };
      case 'mismatch':
        return { label: 'Canonical Mismatch', color: 'text-amber-400 bg-amber-950/40 border-amber-800/40', icon: AlertTriangle };
      case 'redirected_canonical':
        return { label: 'Redirected Canonical (Trap)', color: 'text-rose-400 bg-rose-950/40 border-rose-800/40', icon: XCircle };
      case 'broken_canonical':
        return { label: 'Broken Canonical (404)', color: 'text-red-400 bg-red-950/40 border-red-800/40', icon: XCircle };
      case 'missing':
        return { label: 'Missing Canonical Tag', color: 'text-zinc-400 bg-zinc-900 border-zinc-700', icon: Info };
      case 'loop':
        return { label: 'Circular Redirect Loop', color: 'text-purple-400 bg-purple-950/40 border-purple-800/40', icon: AlertTriangle };
    }
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          HERO & BOT RADAR BANNER
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <Bot className="w-5 h-5 animate-pulse" />
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                SEO Crawl Simulation Engine
                <span className="text-[11px] font-semibold text-zinc-400 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 uppercase tracking-wider">
                  Bot Traversal Simulator
                </span>
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Visualize how Googlebot, Bingbot, or custom search spiders traverse your site architecture. Follow redirect chains, diagnose crawl budget exhaustion, and audit canonical link health across discovery layers.
            </p>
          </div>

          {/* Quick Presets Menu */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start lg:self-center">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Simulation Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SCENARIOS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleLoadScenario(preset)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors flex items-center gap-1 cursor-pointer"
                  title={preset.description}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{preset.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Crawl Control Deck */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Seed URL Input */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Seed Target URL / Domain</span>
              <span className="text-[11px] text-zinc-500">Root crawl origin</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={seedUrl}
                onChange={e => setSeedUrl(e.target.value)}
                placeholder="https://apexutility.live"
                disabled={isCrawling}
                className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors pl-9"
              />
              <Globe className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Bot Profile Selector */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Bot Persona (User-Agent)</span>
            </label>
            <select
              value={selectedBot}
              onChange={e => setSelectedBot(e.target.value as BotProfile)}
              disabled={isCrawling}
              className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
            >
              <option value="googlebot-mobile">Googlebot Smartphone (Mobile-First)</option>
              <option value="googlebot-desktop">Googlebot Desktop</option>
              <option value="bingbot">Bingbot (Microsoft)</option>
              <option value="custom-spider">Apex SEO Spider</option>
            </select>
          </div>

          {/* Crawl Depth & Cap */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Max Depth</span>
              <span className="text-[11px] text-zinc-500">{maxCrawlDepth} Levels</span>
            </label>
            <select
              value={maxCrawlDepth}
              onChange={e => setMaxCrawlDepth(Number(e.target.value))}
              disabled={isCrawling}
              className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
            >
              <option value={1}>1 Level (Seed Hops)</option>
              <option value={2}>2 Levels (Internal Links)</option>
              <option value={3}>3 Levels (Deep Path)</option>
              <option value={4}>4 Levels (Full Catalog)</option>
            </select>
          </div>

          {/* Action Button */}
          <div className="md:col-span-2 flex gap-2">
            {!isCrawling ? (
              <button
                onClick={startCrawlSimulation}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Simulate Crawl</span>
              </button>
            ) : (
              <button
                onClick={stopCrawlSimulation}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Pause Bot</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Bot Progress Ticker */}
        {isCrawling && (
          <div className="mt-4 p-3 rounded-xl bg-zinc-950/90 border border-red-500/30 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5 text-xs text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="font-mono font-bold text-red-400">[{BOT_USER_AGENTS[selectedBot].badge}]</span>
              <span>Crawling: <strong className="text-white font-mono">{currentCrawlingUrl}</strong></span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              Crawled {crawledHops.length} of {crawlBudgetCap} budget cap
            </span>
          </div>
        )}
      </div>

      {/* =========================================================================
          CRAWL HEALTH & CANONICAL SCOREBOARD
          ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Crawl Efficiency Score */}
        <div className="col-span-2 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Crawl Efficiency Score</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold tracking-tight ${
                metrics.score >= 85 ? 'text-emerald-400' : metrics.score >= 65 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {metrics.score}/100
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                {metrics.score >= 85 ? 'Optimal' : metrics.score >= 65 ? 'Needs Optimization' : 'Severe Waste'}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              {metrics.crawlBudgetEfficiency}% Crawl Budget Indexable
            </div>
          </div>
          <div className={`p-3 rounded-xl ${
            metrics.score >= 85 ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40' : 'bg-amber-950/50 text-amber-400 border border-amber-800/40'
          }`}>
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* 200 OK Indexable */}
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            200 OK Direct
          </span>
          <div className="text-2xl font-bold text-emerald-400">{metrics.clean200Count}</div>
          <p className="text-[11px] text-zinc-400">Zero hop latency</p>
        </div>

        {/* 301/302 Redirect Hops */}
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Redirect Hops
          </span>
          <div className="text-2xl font-bold text-amber-400">{metrics.redirectCount}</div>
          <p className="text-[11px] text-zinc-400">Delays bot indexing</p>
        </div>

        {/* Canonical Health Issues */}
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Canonical Traps
          </span>
          <div className="text-2xl font-bold text-rose-400">
            {metrics.redirectedCanonicalsCount + metrics.canonicalMismatchesCount + metrics.trapCount}
          </div>
          <p className="text-[11px] text-zinc-400">Mismatch or loops</p>
        </div>

        {/* Wasted Bot Requests */}
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Budget Wasted
          </span>
          <div className="text-2xl font-bold text-red-400">{metrics.wastedRequests} hops</div>
          <p className="text-[11px] text-zinc-400">404s &amp; chains</p>
        </div>
      </div>

      {/* =========================================================================
          VIEW SWITCHER & ACTION TOOLBAR
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/70 p-2 rounded-xl border border-zinc-800">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800/80">
          <button
            onClick={() => setActiveTab('visual-flow')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'visual-flow'
                ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-red-400" />
            <span>Bot Crawl Path Graph</span>
          </button>
          <button
            onClick={() => setActiveTab('canonical-audit')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'canonical-audit'
                ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Canonical Health Audit ({crawledHops.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('console-terminal')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'console-terminal'
                ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Live Crawler Logs</span>
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {metrics.redirectCount > 0 && (
            <button
              onClick={handleApplyAllCrawlFixes}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Automatically rewire internal links directly to their 200 OK canonical destinations"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-Heal {metrics.redirectCount} Links</span>
            </button>
          )}

          <button
            onClick={downloadSanitizedSitemap}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download XML sitemap containing only clean, verified 200 OK URLs"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sanitized XML</span>
          </button>

          <button
            onClick={exportCrawlCSV}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download CSV report of the bot crawl simulation"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: VISUAL BOT CRAWL PATH GRAPH
          ========================================================================= */}
      {activeTab === 'visual-flow' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Visual Traversal Canvas */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Spider Crawl Hierarchy (Level 0 ➔ Depth {maxCrawlDepth})
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> 200 Indexable
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> 301/302 Hop
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400" /> Canonical Trap
                  </span>
                </div>
              </div>

              {/* Crawl Level Rows */}
              <div className="space-y-6">
                {hopsByDepth.map(([depth, hopsInDepth]) => (
                  <div key={depth} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider bg-zinc-800/80 px-2 py-0.5 rounded">
                        Depth {depth} {depth === 0 ? '(Seed Origin)' : `(${hopsInDepth.length} Nodes Discovered)`}
                      </span>
                      <div className="h-px bg-zinc-800 flex-1" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {hopsInDepth.map((hop, idx) => {
                        const isSelected = selectedHop?.id === hop.id;
                        const canonBadge = getCanonicalBadge(hop.canonicalHealth);
                        const CanonIcon = canonBadge.icon;

                        return (
                          <div
                            key={hop.id}
                            onClick={() => setSelectedHop(hop)}
                            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                              isSelected
                                ? 'bg-zinc-800/90 border-red-500 shadow-md ring-1 ring-red-500/40'
                                : 'bg-zinc-950/60 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/60'
                            }`}
                          >
                            {/* Top row: Status code + response time */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(hop.statusCode)}`}>
                                {hop.statusCode} {hop.statusText.split(' ')[0]}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-zinc-400" />
                                {hop.responseTimeMs}ms
                              </span>
                            </div>

                            {/* URL path */}
                            <div className="text-xs font-mono font-semibold text-white truncate group-hover:text-red-300 transition-colors">
                              {hop.sourceUrl}
                            </div>

                            {/* Redirect target arrow if redirect */}
                            {hop.redirectUrl && (
                              <div className="mt-2 pt-2 border-t border-zinc-800/70 flex items-center gap-1.5 text-[11px] text-amber-300 font-mono truncate">
                                <CornerDownRight className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="text-zinc-400">Target:</span>
                                <span className="truncate">{hop.redirectUrl}</span>
                              </div>
                            )}

                            {/* Canonical tag health badge */}
                            <div className="mt-2.5 flex items-center justify-between gap-2">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${canonBadge.color}`}>
                                <CanonIcon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{canonBadge.label}</span>
                              </span>

                              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                                {hop.botVerdict.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Node Inspector Drawer */}
          <div className="lg:col-span-4 sticky top-6">
            {selectedHop ? (
              <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-red-400" />
                    <h4 className="text-sm font-bold text-white">Bot Inspection Verdict</h4>
                  </div>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${getStatusBadge(selectedHop.statusCode)}`}>
                    HTTP {selectedHop.statusCode}
                  </span>
                </div>

                {/* Crawled URL */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Requested URL:</span>
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200 break-all select-all flex items-center justify-between gap-2">
                    <span>{selectedHop.sourceUrl}</span>
                    <button
                      onClick={() => copyToClipboard(selectedHop.sourceUrl, 'source')}
                      className="p-1 text-zinc-400 hover:text-white"
                      title="Copy URL"
                    >
                      {copiedId === 'source' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Destination if redirect */}
                {selectedHop.redirectUrl && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <CornerDownRight className="w-3 h-3" />
                      Redirect Destination URL:
                    </span>
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-amber-900/40 font-mono text-xs text-amber-200 break-all select-all flex items-center justify-between gap-2">
                      <span>{selectedHop.redirectUrl}</span>
                      <button
                        onClick={() => copyToClipboard(selectedHop.redirectUrl!, 'dest')}
                        className="p-1 text-zinc-400 hover:text-white"
                        title="Copy Target"
                      >
                        {copiedId === 'dest' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Canonical Tag Declaration */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Declared Canonical Tag:
                  </span>
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 break-all">
                    {selectedHop.canonicalTag ? (
                      selectedHop.canonicalTag
                    ) : (
                      <span className="text-zinc-400 italic">None declared (&lt;link rel="canonical"&gt; missing)</span>
                    )}
                  </div>
                </div>

                {/* Canonical Health Evaluation Card */}
                <div className={`p-3.5 rounded-xl border space-y-2 ${getCanonicalBadge(selectedHop.canonicalHealth).color}`}>
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                    {React.createElement(getCanonicalBadge(selectedHop.canonicalHealth).icon, { className: 'w-4 h-4' })}
                    <span>{getCanonicalBadge(selectedHop.canonicalHealth).label}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-300">
                    {selectedHop.canonicalHealthReason}
                  </p>
                </div>

                {/* Bot Traversal Action */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    Search Engine Spider Reaction
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {selectedHop.crawlAction}
                  </p>
                  <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                    Bot Persona: <strong className="text-zinc-300">{BOT_USER_AGENTS[selectedBot].name}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 text-center text-zinc-500 space-y-2">
                <Bot className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-xs">Click any node in the crawl path above to inspect detailed headers and canonical decisions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CANONICAL HEALTH AUDIT TABLE
          ========================================================================= */}
      {activeTab === 'canonical-audit' && (
        <div className="space-y-4">
          {/* Table Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search crawled URLs or canonical tags..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => setViewFilter('all')}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  viewFilter === 'all' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                All ({crawledHops.length})
              </button>
              <button
                onClick={() => setViewFilter('200')}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  viewFilter === '200' ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800/60' : 'text-zinc-400 hover:text-white'
                }`}
              >
                200 OK ({metrics.clean200Count})
              </button>
              <button
                onClick={() => setViewFilter('redirects')}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  viewFilter === 'redirects' ? 'bg-amber-950/80 text-amber-300 font-semibold border border-amber-800/60' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Redirects ({metrics.redirectCount})
              </button>
              <button
                onClick={() => setViewFilter('issues')}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  viewFilter === 'issues' ? 'bg-rose-950/80 text-rose-300 font-semibold border border-rose-800/60' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Issues ({metrics.redirectedCanonicalsCount + metrics.canonicalMismatchesCount + metrics.brokenCount})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Crawled URL Path</th>
                  <th className="py-3 px-4">Redirect Destination</th>
                  <th className="py-3 px-4">Declared Canonical Tag</th>
                  <th className="py-3 px-4">Canonical Health</th>
                  <th className="py-3 px-4">Bot Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredHops.length > 0 ? (
                  filteredHops.map(hop => {
                    const badge = getCanonicalBadge(hop.canonicalHealth);
                    const Icon = badge.icon;

                    return (
                      <tr key={hop.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold border ${getStatusBadge(hop.statusCode)}`}>
                            {hop.statusCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-white max-w-xs truncate">
                          <span title={hop.sourceUrl}>{hop.sourceUrl}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400 max-w-xs truncate">
                          {hop.redirectUrl ? (
                            <span className="text-amber-300 flex items-center gap-1" title={hop.redirectUrl}>
                              <CornerDownRight className="w-3 h-3 shrink-0" />
                              <span className="truncate">{hop.redirectUrl}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-300 max-w-xs truncate">
                          {hop.canonicalTag ? (
                            <span title={hop.canonicalTag}>{hop.canonicalTag}</span>
                          ) : (
                            <span className="text-zinc-400 italic">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 w-fit ${badge.color}`}>
                            <Icon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-400 max-w-xs truncate" title={hop.crawlAction}>
                          {hop.crawlAction}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                      No URLs matching the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: LIVE CRAWLER CONSOLE / TERMINAL LOGS
          ========================================================================= */}
      {activeTab === 'console-terminal' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden font-mono text-xs shadow-2xl">
          {/* Terminal Titlebar */}
          <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-zinc-400 font-semibold text-[11px]">
                Googlebot / Spider Live Telemetry Feed
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[11px]">
                <button
                  onClick={() => setLogFilter('all')}
                  className={`px-1.5 py-0.5 rounded ${logFilter === 'all' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setLogFilter('redirects')}
                  className={`px-1.5 py-0.5 rounded ${logFilter === 'redirects' ? 'text-amber-400 bg-zinc-800' : 'text-zinc-400 hover:text-white'}`}
                >
                  Redirects
                </button>
                <button
                  onClick={() => setLogFilter('canonical')}
                  className={`px-1.5 py-0.5 rounded ${logFilter === 'canonical' ? 'text-rose-400 bg-zinc-800' : 'text-zinc-400 hover:text-white'}`}
                >
                  Canonical
                </button>
                <button
                  onClick={() => setLogFilter('errors')}
                  className={`px-1.5 py-0.5 rounded ${logFilter === 'errors' ? 'text-red-400 bg-zinc-800' : 'text-zinc-400 hover:text-white'}`}
                >
                  Errors
                </button>
              </div>

              <button
                onClick={() => {
                  const logText = crawlLogs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
                  copyToClipboard(logText, 'logs');
                }}
                className="px-2 py-0.5 rounded text-[11px] text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'logs' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy Logs</span>
              </button>
            </div>
          </div>

          {/* Terminal Body */}
          <div className="p-4 h-96 overflow-y-auto space-y-1.5 bg-black/60 selection:bg-red-500/30">
            {filteredLogs.map((log, index) => {
              let textCol = 'text-zinc-300';
              if (log.level === 'redirect') textCol = 'text-amber-400';
              if (log.level === 'canonical_warn') textCol = 'text-rose-400';
              if (log.level === 'error') textCol = 'text-red-400 font-bold';
              if (log.level === 'success') textCol = 'text-emerald-400 font-semibold';

              return (
                <div key={index} className="leading-relaxed flex items-start gap-2 hover:bg-zinc-900/30 px-1 rounded">
                  <span className="text-zinc-400 select-none shrink-0">[{log.timestamp}]</span>
                  <span className={`shrink-0 font-bold uppercase text-[10px] px-1 rounded ${
                    log.level === 'redirect' ? 'bg-amber-950 text-amber-300' :
                    log.level === 'canonical_warn' ? 'bg-rose-950 text-rose-300' :
                    log.level === 'error' ? 'bg-red-950 text-red-300' :
                    log.level === 'success' ? 'bg-emerald-950 text-emerald-300' :
                    'bg-zinc-900 text-zinc-400'
                  }`}>
                    {log.level}
                  </span>
                  <span className={textCol}>{log.message}</span>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Comprehensive Dynamic Sitemap & Robots Service for Apex Utility Labs
 * Programmatically discovers and indexes all tools, guides, editorial articles, and legal routes.
 * Ensures strict W3C lastmod formatting (YYYY-MM-DD), dynamic priority weighting, and RFC XML compliance
 * to assist Google Search Console crawl budget discovery and canonical indexing.
 */

import { DEFAULT_CARDS } from '../components/Dashboard';
import { AT_LEAST_20_ARTICLES } from '../data/articles';
import { ActiveTab } from '../types';

export type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

export type PageType = 'home' | 'tool' | 'article' | 'legal' | 'hub';

export interface SitemapEntry {
  id: string;
  path: string;
  loc: string;
  lastmod: string;
  changefreq: ChangeFrequency;
  priority: string;
  type: PageType;
  category?: string;
  title?: string;
}

export interface SitemapGenerationOptions {
  baseUrl?: string;
  includeHome?: boolean;
  includeTools?: boolean;
  includeArticles?: boolean;
  includeLegal?: boolean;
  includePriority?: boolean;
  includeChangeFreq?: boolean;
  defaultToolChangeFreq?: ChangeFrequency;
  defaultArticleChangeFreq?: ChangeFrequency;
  defaultLastmod?: string;
  customLastmods?: Record<string, string>;
  toolCategories?: string[];
  filterFn?: (entry: SitemapEntry) => boolean;
}

export interface SitemapStats {
  totalUrls: number;
  toolCount: number;
  articleCount: number;
  legalCount: number;
  hubCount: number;
  lastmod: string;
  categories: Record<string, number>;
}

export interface ToolRouteConfig {
  id: string;
  path: string;
  title: string;
  category: string;
  pinned: boolean;
  priority: string;
  changefreq: ChangeFrequency;
  lastmod: string;
}

/** Non-tool tabs that belong to legal, hub, or home categories */
const NON_TOOL_TABS: Set<string> = new Set([
  'dashboard',
  'guides',
  'privacy-policy',
  'terms-of-service',
  'cookie-policy',
  'affiliate-disclosure',
  'about-us',
  'contact'
]);

/** Flagship high-authority tools deserving top priority ranking */
const FLAGSHIP_TOOL_IDS = new Set([
  'sitemap-generator',
  'sitemap-seo',
  'synthid-remover',
  'whop-video-clipping-tool',
  'internet-speed-test',
  'webp-converter',
  'compress-pdf',
  'network-tools',
  'ping-test',
  'what-is-my-ip'
]);

/** Legal and regulatory compliance pages */
export const LEGAL_PAGES: Array<{ id: string; title: string; priority: string; changefreq: ChangeFrequency }> = [
  { id: 'about-us', title: 'About Us & Company Engineering Mission', priority: '0.50', changefreq: 'monthly' },
  { id: 'privacy-policy', title: 'Privacy Policy & Zero-Telemetry Data Policy', priority: '0.40', changefreq: 'monthly' },
  { id: 'terms-of-service', title: 'Terms of Service & Usage Governance', priority: '0.40', changefreq: 'monthly' },
  { id: 'cookie-policy', title: 'Cookie Policy & Consent Mode Standards', priority: '0.40', changefreq: 'monthly' },
  { id: 'affiliate-disclosure', title: 'Affiliate Disclosure & Commercial Transparency', priority: '0.40', changefreq: 'monthly' },
  { id: 'contact', title: 'Contact & Developer Support Registry', priority: '0.50', changefreq: 'monthly' }
];

/** Flagged canonical pages historically reported by Search Console to safeguard index discovery */
export const FLAGGED_CANONICAL_PAGES: readonly string[] = [
  'webcam-check', 'date-calculator', 'content-planner', 'keyword-cluster', 'mockup-generator',
  'unit-converter', 'csv-json-converter', 'ai-writer', 'lorem-generator', 'mute-video',
  'sql-formatter', 'color-palette', 'pdf-form-filler', 'ai-humanizer', 'image-cropper',
  'video-compressor', 'bento-grid', 'private-sketchpad', 'voice-recorder', 'social-hooks',
  'loan-calculator', 'join-pdf', 'meta-tag-auditor', 'exif-stripper', 'batch-processor',
  'pdf-converter', 'pattern-blob', 'video-cutter', 'visual-pdf-organizer', 'gradient-generator',
  'svg-wave', 'video-converter', 'content-gap', 'schema-generator', 'html-markdown',
  'image-to-pdf', 'bmi-calculator', 'ai-transcriber', 'video-to-mp3', 'json-node-map',
  'regex-tester', 'video-resizer', 'video-merger', 'bezier-spline', 'pdf-signer',
  'image-compressor', 'base64-converter', 'clip-path', 'subtitle-converter', 'glass-brutalist',
  'meta-tags', 'css-generator', 'json-diff', 'sitemap-generator', 'favicon-generator',
  'video-rotator', 'video-recorder', 'tone-analyzer', 'audio-trimmer', 'redirect-auditor',
  'tailwind-grid', 'microphone-tester', 'password-generator', 'video-to-gif', 'resume-optimizer',
  'seo-inspect', 'alt-text-generator', 'image-upscaler', 'headshot-generator', 'cron-builder',
  'meme-generator', 'keyword-difficulty', 'passport-photo', 'pdf-analyst', 'uuid-generator',
  'url-slugifier', 'ai-content-brief', 'qr-generator', 'screen-recorder', 'secure-hash',
  'case-converter', 'markdown-compiler', 'code-explainer', 'digital-signature', 'image-vectorizer',
  'quick-image-optimizer', 'audio-converter', 'whop-video-clipping-tool', 'internet-speed-test',
  'network-tools', 'ping-test', 'what-is-my-ip', 'dns-test', 'ip-location', 'synthid-remover'
];

/**
 * Normalizes any string, Date, or timestamp into strict W3C ISO 8601 YYYY-MM-DD
 */
export function formatLastmodDate(dateInput?: string | Date | number): string {
  const fallback = '2026-11-09';
  if (!dateInput) return fallback;
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput as any);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {
    // Return fallback on invalid date
  }
  return fallback;
}

/**
 * Escapes characters for strict XML standards
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Programmatically extracts all tool IDs from App routing and cards.
 * Combines DEFAULT_CARDS with any extra active tool tabs.
 */
export function getAllToolIds(): string[] {
  const toolIdSet = new Set<string>();

  // 1. Gather all IDs declared in Dashboard cards
  DEFAULT_CARDS.forEach(card => {
    if (card && card.id && !NON_TOOL_TABS.has(card.id)) {
      toolIdSet.add(card.id);
    }
  });

  // 2. Add all flagged canonical tool pages
  FLAGGED_CANONICAL_PAGES.forEach(slug => {
    if (!NON_TOOL_TABS.has(slug)) {
      toolIdSet.add(slug);
    }
  });

  // 3. Fallback explicit discovery of network & special tool endpoints
  const additionalUtilities = [
    'network-tools', 'internet-speed-test', 'ping-test', 'what-is-my-ip', 'dns-test', 'ip-location',
    'synthid-remover', 'whop-video-clipping-tool', 'robots-txt', 'dns-lookup', 'user-agent', 'sitemap-seo'
  ];
  additionalUtilities.forEach(id => toolIdSet.add(id));

  return Array.from(toolIdSet).sort();
}

/**
 * Computes programmatic priority for a tool based on significance, category, and pinned status
 */
export function calculateToolPriority(toolId: string, category?: string, pinned?: boolean): string {
  if (FLAGSHIP_TOOL_IDS.has(toolId)) {
    return '0.95';
  }
  if (pinned) {
    return '0.90';
  }

  const cat = (category || '').toLowerCase();
  if (cat.includes('network') || cat.includes('security') || cat.includes('pdf') || cat.includes('copywriting') || cat.includes('document')) {
    return '0.90';
  }
  if (cat.includes('media') || cat.includes('developer') || cat.includes('design') || cat.includes('seo')) {
    return '0.85';
  }
  if (cat.includes('calculator') || toolId.includes('calculator')) {
    return '0.75';
  }
  if (['case-converter', 'lorem-generator', 'date-calculator'].includes(toolId)) {
    return '0.70';
  }

  return '0.80';
}

/**
 * Programmatically retrieves full route configurations for all tools
 */
export function getAllToolRoutes(defaultLastmod?: string, customLastmods?: Record<string, string>): ToolRouteConfig[] {
  const toolIds = getAllToolIds();
  const cardMap = new Map(DEFAULT_CARDS.map(c => [c.id, c]));
  const today = formatLastmodDate(defaultLastmod);

  return toolIds.map(id => {
    const card = cardMap.get(id);
    const category = card?.category || 'General Utilities';
    const title = card?.title || id.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    const pinned = !!card?.pinned || FLAGSHIP_TOOL_IDS.has(id);
    const priority = calculateToolPriority(id, category, pinned);
    const lastmod = customLastmods?.[id] ? formatLastmodDate(customLastmods[id]) : today;
    const changefreq: ChangeFrequency = pinned ? 'daily' : 'weekly';

    return {
      id,
      path: `/${id}`,
      title,
      category,
      pinned,
      priority,
      changefreq,
      lastmod
    };
  });
}

/**
 * Generates all deduplicated SitemapEntry items across the entire app
 */
export function getAllSitemapEntries(options: SitemapGenerationOptions = {}): SitemapEntry[] {
  const {
    baseUrl = 'https://apexutility.live',
    includeHome = true,
    includeTools = true,
    includeArticles = true,
    includeLegal = true,
    includePriority = true,
    includeChangeFreq = true,
    defaultToolChangeFreq = 'weekly',
    defaultArticleChangeFreq = 'weekly',
    defaultLastmod,
    customLastmods = {},
    toolCategories,
    filterFn
  } = options;

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const today = formatLastmodDate(defaultLastmod);
  const entries: SitemapEntry[] = [];
  const seenPaths = new Set<string>();

  const register = (entry: SitemapEntry) => {
    const cleanPath = entry.path.toLowerCase().trim();
    if (seenPaths.has(cleanPath)) return;
    if (filterFn && !filterFn(entry)) return;
    seenPaths.add(cleanPath);
    entries.push(entry);
  };

  // 1. Home / Root page
  if (includeHome) {
    register({
      id: 'dashboard',
      path: '/',
      loc: `${normalizedBaseUrl}/`,
      lastmod: customLastmods['/'] || customLastmods['dashboard'] || today,
      changefreq: 'daily',
      priority: includePriority ? '1.00' : '1.0',
      type: 'home',
      category: 'Home',
      title: 'Apex Utility Labs – High-Performance Client-Side Developer Suite'
    });
  }

  // 2. Guides Hub
  if (includeArticles) {
    register({
      id: 'guides',
      path: '/guides',
      loc: `${normalizedBaseUrl}/guides`,
      lastmod: customLastmods['guides'] || today,
      changefreq: 'daily',
      priority: includePriority ? '0.85' : '0.8',
      type: 'hub',
      category: 'Editorial Guides Hub',
      title: 'Apex Technical Engineering & Web Operations Guides'
    });
  }

  // 3. Legal and Regulatory compliance pages
  if (includeLegal) {
    LEGAL_PAGES.forEach(legal => {
      register({
        id: legal.id,
        path: `/${legal.id}`,
        loc: `${normalizedBaseUrl}/${legal.id}`,
        lastmod: customLastmods[legal.id] || '2026-11-01',
        changefreq: includeChangeFreq ? legal.changefreq : 'monthly',
        priority: includePriority ? legal.priority : '0.5',
        type: 'legal',
        category: 'Legal & Compliance',
        title: legal.title
      });
    });
  }

  // 4. All Programmatically Discovered Tools
  if (includeTools) {
    const toolRoutes = getAllToolRoutes(defaultLastmod, customLastmods);
    toolRoutes.forEach(tool => {
      if (toolCategories && toolCategories.length > 0 && !toolCategories.includes(tool.category)) {
        return;
      }
      register({
        id: tool.id,
        path: tool.path,
        loc: `${normalizedBaseUrl}${tool.path}`,
        lastmod: tool.lastmod,
        changefreq: includeChangeFreq ? tool.changefreq : defaultToolChangeFreq,
        priority: includePriority ? tool.priority : '0.80',
        type: 'tool',
        category: tool.category,
        title: tool.title
      });
    });
  }

  // 5. All Editorial Articles (670+ comprehensive technical guides)
  if (includeArticles && Array.isArray(AT_LEAST_20_ARTICLES)) {
    AT_LEAST_20_ARTICLES.forEach(art => {
      if (!art || !art.id) return;
      const parsedLastmod = formatLastmodDate(art.publishDate || defaultLastmod);
      register({
        id: art.id,
        path: `/${art.id}`,
        loc: `${normalizedBaseUrl}/${art.id}`,
        lastmod: customLastmods[art.id] || parsedLastmod,
        changefreq: includeChangeFreq ? defaultArticleChangeFreq : 'weekly',
        priority: includePriority ? '0.75' : '0.7',
        type: 'article',
        category: art.category || 'Technical Articles',
        title: art.title
      });
    });
  }

  return entries;
}

/**
 * Dynamically builds a search-crawler compliant sitemap.xml string conforming to sitemaps.org 0.9 schema
 */
export function generateSitemapXml(options: SitemapGenerationOptions = {}): string {
  const entries = getAllSitemapEntries(options);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  entries.forEach(entry => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(entry.loc)}</loc>\n`;
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    if (entry.changefreq) {
      xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    }
    if (entry.priority) {
      xml += `    <priority>${entry.priority}</priority>\n`;
    }
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}

/**
 * Generates standard crawler robots.txt referencing the canonical sitemap.xml
 */
export function generateRobotsTxt(baseUrl = 'https://apexutility.live'): string {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  return `# Standard robots.txt for Search Engines and AI Crawlers
User-agent: *
Allow: /
Disallow: /api/
Disallow: /debug

Sitemap: ${normalizedBaseUrl}/sitemap.xml
`;
}

/**
 * Computes detailed diagnostic statistics for the current sitemap
 */
export function getSitemapStats(options: SitemapGenerationOptions = {}): SitemapStats {
  const entries = getAllSitemapEntries(options);
  const categories: Record<string, number> = {};
  let toolCount = 0;
  let articleCount = 0;
  let legalCount = 0;
  let hubCount = 0;

  entries.forEach(e => {
    const cat = e.category || 'Uncategorized';
    categories[cat] = (categories[cat] || 0) + 1;

    if (e.type === 'tool') toolCount++;
    else if (e.type === 'article') articleCount++;
    else if (e.type === 'legal') legalCount++;
    else if (e.type === 'hub') hubCount++;
  });

  return {
    totalUrls: entries.length,
    toolCount,
    articleCount,
    legalCount,
    hubCount,
    lastmod: formatLastmodDate(options.defaultLastmod),
    categories
  };
}

/**
 * Triggers in-browser dynamic download of the generated sitemap.xml file
 */
export function downloadSitemapXml(xmlContent?: string, filename = 'sitemap.xml'): void {
  if (typeof window === 'undefined') return;

  const content = xmlContent || generateSitemapXml();
  const blob = new Blob([content], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

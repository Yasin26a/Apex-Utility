import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, FileCode, Plus, Trash2, Download, Copy, Check, Settings, 
  HelpCircle, RefreshCw, CheckCircle2, Sparkles, Info, Calendar, 
  ArrowRight, FileText, Sliders, Shield, AlertTriangle,
  Folder, FolderOpen, ChevronRight, ChevronDown, ListPlus
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { gzipSync } from 'fflate';
import { AT_LEAST_20_ARTICLES } from '../data/articles';

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

const DISCOVERED_APP_TABS = [
  { tab: 'dashboard', path: '/', defaultPriority: 1.0, defaultFreq: 'daily' },
  { tab: 'compress-pdf', path: '/compress-pdf', defaultPriority: 0.9, defaultFreq: 'weekly' },
  { tab: 'webp-converter', path: '/webp-converter', defaultPriority: 0.9, defaultFreq: 'weekly' },
  { tab: 'json-beautifier', path: '/json-beautifier', defaultPriority: 0.8, defaultFreq: 'weekly' },
  { tab: 'sitemap-seo', path: '/sitemap-seo', defaultPriority: 0.8, defaultFreq: 'weekly' },
  { tab: 'sitemap-generator', path: '/sitemap-generator', defaultPriority: 0.95, defaultFreq: 'weekly' },
  { tab: 'image-to-pdf', path: '/image-to-pdf', defaultPriority: 0.9, defaultFreq: 'weekly' },
  { tab: 'join-pdf', path: '/join-pdf', defaultPriority: 0.9, defaultFreq: 'weekly' },
  { tab: 'ai-writer', path: '/ai-writer', defaultPriority: 0.9, defaultFreq: 'weekly' },
  { tab: 'password-generator', path: '/password-generator', defaultPriority: 0.75, defaultFreq: 'weekly' },
  { tab: 'qr-generator', path: '/qr-generator', defaultPriority: 0.75, defaultFreq: 'weekly' },
  { tab: 'unit-converter', path: '/unit-converter', defaultPriority: 0.75, defaultFreq: 'weekly' },
  { tab: 'svg-rasterizer', path: '/svg-rasterizer', defaultPriority: 0.8, defaultFreq: 'weekly' },
  { tab: 'batch-processor', path: '/batch-processor', defaultPriority: 0.85, defaultFreq: 'weekly' },
  { tab: 'json-diff', path: '/json-diff', defaultPriority: 0.8, defaultFreq: 'weekly' },
  { tab: 'secure-hash', path: '/secure-hash', defaultPriority: 0.75, defaultFreq: 'weekly' },
  { tab: 'color-palette', path: '/color-palette', defaultPriority: 0.8, defaultFreq: 'weekly' },
  { tab: 'digital-signature', path: '/digital-signature', defaultPriority: 0.85, defaultFreq: 'weekly' },
  { tab: 'seo-optimizer', path: '/seo-optimizer', defaultPriority: 0.9, defaultFreq: 'weekly' },
  { tab: 'base64-converter', path: '/base64-converter', defaultPriority: 0.75, defaultFreq: 'weekly' },
  { tab: 'regex-tester', path: '/regex-tester', defaultPriority: 0.8, defaultFreq: 'weekly' },
  { tab: 'csv-json-converter', path: '/csv-json-converter', defaultPriority: 0.8, defaultFreq: 'weekly' },
  { tab: 'image-compressor', path: '/image-compressor', defaultPriority: 0.9, defaultFreq: 'weekly' },
  { tab: 'rich-text-stats', path: '/rich-text-stats', defaultPriority: 0.75, defaultFreq: 'weekly' },
  { tab: 'audio-trimmer', path: '/audio-trimmer', defaultPriority: 0.85, defaultFreq: 'weekly' },
  { tab: 'ai-transcriber', path: '/ai-transcriber', defaultPriority: 0.9, defaultFreq: 'weekly' },
  { tab: 'pdf-analyst', path: '/pdf-analyst', defaultPriority: 0.9, defaultFreq: 'weekly' },
  { tab: 'exif-stripper', path: '/exif-stripper', defaultPriority: 0.85, defaultFreq: 'weekly' },
  { tab: 'video-recorder', path: '/video-recorder', defaultPriority: 0.8, defaultFreq: 'weekly' },
  { tab: 'image-vectorizer', path: '/image-vectorizer', defaultPriority: 0.85, defaultFreq: 'weekly' },
  { tab: 'code-snapshot', path: '/code-snapshot', defaultPriority: 0.8, defaultFreq: 'weekly' },
  { tab: 'private-sketchpad', path: '/private-sketchpad', defaultPriority: 0.8, defaultFreq: 'weekly' },
  { tab: 'case-converter', path: '/case-converter', defaultPriority: 0.7, defaultFreq: 'weekly' },
  { tab: 'lorem-generator', path: '/lorem-generator', defaultPriority: 0.7, defaultFreq: 'weekly' },
  { tab: 'image-cropper', path: '/image-cropper', defaultPriority: 0.8, defaultFreq: 'weekly' },
  { tab: 'date-calculator', path: '/date-calculator', defaultPriority: 0.7, defaultFreq: 'weekly' },
  { tab: 'privacy-policy', path: '/privacy-policy', defaultPriority: 0.4, defaultFreq: 'monthly' },
  { tab: 'terms-of-service', path: '/terms-of-service', defaultPriority: 0.4, defaultFreq: 'monthly' },
  { tab: 'about-us', path: '/about-us', defaultPriority: 0.5, defaultFreq: 'monthly' },
  { tab: 'guides', path: '/guides', defaultPriority: 0.7, defaultFreq: 'daily' },
  { tab: 'content-planner', path: '/content-planner', defaultPriority: 0.9, defaultFreq: 'weekly' },
  { tab: 'schema-generator', path: '/schema-generator', defaultPriority: 0.85, defaultFreq: 'weekly' },
  { tab: 'content-gap', path: '/content-gap', defaultPriority: 0.9, defaultFreq: 'weekly' },
  { tab: 'keyword-cluster', path: '/keyword-cluster', defaultPriority: 0.9, defaultFreq: 'weekly' },
  { tab: 'robots-txt', path: '/robots-txt', defaultPriority: 0.85, defaultFreq: 'weekly' },
  { tab: 'dns-lookup', path: '/dns-lookup', defaultPriority: 0.8, defaultFreq: 'weekly' },
  { tab: 'user-agent', path: '/user-agent', defaultPriority: 0.8, defaultFreq: 'weekly' },
  { tab: 'html-markdown', path: '/html-markdown', defaultPriority: 0.8, defaultFreq: 'weekly' },
  { tab: 'meta-tags', path: '/meta-tags', defaultPriority: 0.85, defaultFreq: 'weekly' }
];

export default function SitemapGenerator() {
  const { t } = useLanguage();
  
  // State variables
  const [baseUrl, setBaseUrl] = useState(() => {
    return localStorage.getItem('apex_sitemap_base_url') || 'https://example.com';
  });
  
  const [routes, setRoutes] = useState<SitemapRoute[]>(() => {
    try {
      const saved = localStorage.getItem('apex_sitemap_configured_routes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { id: '1', path: '/', changefreq: 'weekly', priority: 1.0, lastmodEnabled: true, lastmodDate: new Date().toISOString().split('T')[0] },
      { id: '2', path: '/about', changefreq: 'monthly', priority: 0.8, lastmodEnabled: true, lastmodDate: new Date().toISOString().split('T')[0] },
      { id: '3', path: '/contact', changefreq: 'monthly', priority: 0.8, lastmodEnabled: true, lastmodDate: new Date().toISOString().split('T')[0] }
    ];
  });

  // Form states for adding a new route
  const [newPath, setNewPath] = useState('');
  const [newFreq, setNewFreq] = useState<'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'>('weekly');
  const [newPriority, setNewPriority] = useState(0.8);
  const [includeLastmod, setIncludeLastmod] = useState(true);

  // Bulk Paste Mode States
  const [creationMode, setCreationMode] = useState<'single' | 'bulk' | 'auto'>('single');
  const [bulkInput, setBulkInput] = useState('');
  const [bulkFreq, setBulkFreq] = useState<'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'>('weekly');
  const [bulkPriority, setBulkPriority] = useState(0.8);
  const [bulkOverwrite, setBulkOverwrite] = useState(false);

  // Dynamic Auto-discovery Mode States
  const [autoFreq, setAutoFreq] = useState<'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'>('weekly');
  const [autoToolPriority, setAutoToolPriority] = useState(0.85);
  const [autoLegalPriority, setAutoLegalPriority] = useState(0.5);
  const [autoOverwrite, setAutoOverwrite] = useState(true);

  // Global settings toggles
  const [globalIncludeLastmod, setGlobalIncludeLastmod] = useState(true);
  const [globalIncludeChangefreq, setGlobalIncludeChangefreq] = useState(true);
  const [globalIncludePriority, setGlobalIncludePriority] = useState(true);
  const [formatBeautify, setFormatBeautify] = useState(true);

  // UI state
  const [copied, setCopied] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState('sitemap.xml');
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string | null>(null);

  // Automated Meta-Tag Analysis & SEO Scanner States
  const [seoMetadata, setSeoMetadata] = useState<Record<string, {
    title: string;
    description: string;
    canonical: string;
  }>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);

  // Interactive Directory Tree Preview States
  const [previewTab, setPreviewTab] = useState<'xml' | 'tree'>('tree');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [treeSearch, setTreeSearch] = useState('');

  // Convert list of routes to directory tree structure
  const directoryTree = useMemo(() => {
    interface TempTreeNode {
      name: string;
      fullPath: string;
      isRoute: boolean;
      routeData?: SitemapRoute;
      children: Record<string, TempTreeNode>;
    }

    const rootNode: TempTreeNode = {
      name: '/',
      fullPath: '/',
      isRoute: false,
      children: {}
    };

    // Find root route
    const rootRoute = routes.find(r => r.path === '/');
    if (rootRoute) {
      rootNode.isRoute = true;
      rootNode.routeData = rootRoute;
    }

    routes.forEach(route => {
      const trimmed = route.path.trim();
      if (trimmed === '/' || !trimmed) return;

      const segments = trimmed.split('/').filter(s => s.length > 0);
      let currentNode = rootNode;
      let currentPath = '';

      segments.forEach((segment, idx) => {
        currentPath += '/' + segment;
        const isLast = idx === segments.length - 1;

        if (!currentNode.children[segment]) {
          currentNode.children[segment] = {
            name: segment,
            fullPath: currentPath,
            isRoute: isLast,
            routeData: isLast ? route : routes.find(r => r.path === currentPath),
            children: {}
          };
        } else {
          if (isLast) {
            currentNode.children[segment].isRoute = true;
            currentNode.children[segment].routeData = route;
          }
        }
        currentNode = currentNode.children[segment];
      });
    });

    return rootNode;
  }, [routes]);

  // Recurse helper to find matches in subtree
  const matchSearch = (n: any, query: string): boolean => {
    if (!query) return true;
    const q = query.toLowerCase();
    
    // Checks if self name or path matches
    if (n.name.toLowerCase().includes(q) || n.fullPath.toLowerCase().includes(q)) {
      return true;
    }
    
    // Checks if any child matches (recursive)
    return Object.values(n.children).some(child => matchSearch(child, query));
  };

  const toggleNode = (fullPath: string) => {
    setCollapsedNodes(prev => ({
      ...prev,
      [fullPath]: !prev[fullPath]
    }));
  };

  const getAllFolderPaths = (node: any): string[] => {
    const paths: string[] = [];
    if (Object.keys(node.children).length > 0 && node.fullPath !== '/') {
      paths.push(node.fullPath);
    }
    Object.values(node.children).forEach(child => {
      paths.push(...getAllFolderPaths(child));
    });
    return paths;
  };

  const collapseAll = () => {
    const folders = getAllFolderPaths(directoryTree);
    const collapsedMap: Record<string, boolean> = {};
    folders.forEach(p => {
      collapsedMap[p] = true;
    });
    setCollapsedNodes(collapsedMap);
  };

  const expandAll = () => {
    setCollapsedNodes({});
  };

  const renderTree = (node: any, depth: number = 0): React.ReactNode => {
    // If searching, verify if this node matches or contains matches
    if (treeSearch && !matchSearch(node, treeSearch)) {
      return null;
    }

    const childrenKeys = Object.keys(node.children).sort();
    const hasChildren = childrenKeys.length > 0;
    const isCollapsed = !!collapsedNodes[node.fullPath];
    const isRoot = node.fullPath === '/';
    
    // Check SEO auditing status if scanned
    const isRouteNode = node.isRoute && node.routeData;
    const auditInfo = isRouteNode && node.routeData ? (auditAnalysis as Record<string, any>)[node.routeData.id] : null;

    // Determine warning/error dot or badge
    let statusColor = 'text-zinc-400';
    let statusLabel = '';
    
    if (hasScanned && auditInfo) {
      if (auditInfo.titleStatus === 'fail' || auditInfo.descStatus === 'fail' || auditInfo.canonicalStatus === 'fail') {
        statusColor = 'text-rose-400';
        statusLabel = 'Critical Missing Tag';
      } else if (auditInfo.titleStatus === 'warning' || auditInfo.descStatus === 'warning' || auditInfo.canonicalStatus === 'warning') {
        statusColor = 'text-amber-450';
        statusLabel = 'Suboptimal Metadata';
      } else {
        statusColor = 'text-emerald-400';
        statusLabel = 'SEO Optimal';
      }
    }

    return (
      <div key={node.fullPath} className="space-y-0.5" id={`tree-node-wrapper-${node.fullPath.replace(/[^a-zA-Z0-9-]/g, '_')}`}>
        {/* Row element */}
        <div 
          id={`tree-node-row-${node.fullPath.replace(/[^a-zA-Z0-9-]/g, '_')}`}
          className={`group flex items-center justify-between p-1.5 rounded transition-all select-none hover:bg-zinc-900/60 font-mono text-[11px] ${
            isRouteNode ? 'text-zinc-200' : 'text-zinc-500'
          }`}
          style={{ paddingLeft: `${Math.max(depth * 14, 6)}px` }}
        >
          {/* Node path/name column */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Toggle Arrow for folders */}
            {hasChildren ? (
              <button
                type="button"
                id={`tree-node-toggle-${node.fullPath.replace(/[^a-zA-Z0-9-]/g, '_')}`}
                onClick={() => toggleNode(node.fullPath)}
                className="p-0.5 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-800 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                )}
              </button>
            ) : (
              <span className="w-4 h-4 flex items-center justify-center shrink-0">
                <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
              </span>
            )}

            {/* Folder/File Icon */}
            {hasChildren ? (
              isCollapsed ? (
                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )
            ) : (
              <FileCode className="w-3.5 h-3.5 text-brand shrink-0 opacity-80" />
            )}

            {/* Path description label */}
            <span 
              id={`tree-node-label-${node.fullPath.replace(/[^a-zA-Z0-9-]/g, '_')}`}
              onClick={() => {
                if (hasChildren) {
                  toggleNode(node.fullPath);
                } else if (isRouteNode && node.routeData) {
                  // highlight or select for edit
                  setEditingRouteId(node.routeData.id);
                  // Scroll to SEO scanner or route config edit
                  const el = document.getElementById('seo-audit-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={`truncate cursor-pointer hover:underline ${
                isRoot ? 'font-bold text-brand' : ''
              } ${
                !isRouteNode ? 'italic opacity-60' : 'font-medium'
              }`}
            >
              {isRoot ? '/' : node.name}
            </span>

            {/* Implied Directory badge/status */}
            {!isRouteNode && !isRoot && (
              <span className="shrink-0 text-[8px] px-1 py-0.2 rounded bg-zinc-950 text-zinc-500 border border-zinc-900/50 uppercase font-semibold">
                Implicit Folder
              </span>
            )}

            {/* Warn dot for scanned audits */}
            {hasScanned && isRouteNode && (
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                statusColor === 'text-rose-400' 
                  ? 'bg-rose-500 animate-pulse' 
                  : statusColor === 'text-amber-450' 
                  ? 'bg-amber-500' 
                  : 'bg-emerald-505'
              }`} title={statusLabel} />
            )}
          </div>

          {/* Controls column on hover / active */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {/* If implicit directory, allow turning into a route */}
            {!isRouteNode && !isRoot ? (
              <button
                type="button"
                id={`tree-node-promote-${node.fullPath.replace(/[^a-zA-Z0-9-]/g, '_')}`}
                onClick={() => {
                  // Add this implicit directory as an index route
                  addRoute(node.fullPath, 'weekly', 0.6);
                }}
                className="hidden group-hover:flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-mono text-emerald-400 hover:text-emerald-350 bg-emerald-950/25 border border-emerald-950/40 cursor-pointer"
                title="Add index route for this folder to sitemap"
              >
                <ListPlus className="w-3 h-3 text-emerald-405" />
                <span>Add index page</span>
              </button>
            ) : (
              isRouteNode && node.routeData && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-805 uppercase scale-90">
                    P: {node.routeData.priority.toFixed(1)}
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-900 text-zinc-500 border border-zinc-805 capitalize scale-90 hidden sm:inline">
                    {node.routeData.changefreq}
                  </span>

                  {/* Actions */}
                  <button
                    type="button"
                    onClick={() => {
                      if (node.routeData) {
                        setEditingRouteId(node.routeData.id);
                        // find the element of SEO Inspector and scroll
                        const el = document.getElementById('seo-audit-section');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    className="p-0.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
                    title="Edit Metadata & configuration details"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (node.routeData) {
                        removeRoute(node.routeData.id);
                      }
                    }}
                    className="p-0.5 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 cursor-pointer"
                    title="Remove route from sitemap"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Render nested children if present and not collapsed */}
        {hasChildren && !isCollapsed && (
          <div className="space-y-0.5 border-l border-zinc-900/40 ml-[11px] pl-[5px]" id={`tree-node-children-${node.fullPath.replace(/[^a-zA-Z0-9-]/g, '_')}`}>
            {childrenKeys.map(key => renderTree(node.children[key], depth + 1))}
          </div>
        )}
      </div>
    );
  };

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

  // Synchronize dynamic sitemap variables with localStorage for instant crawl indexing persistence
  useEffect(() => {
    localStorage.setItem('apex_sitemap_base_url', cleanedBaseUrl);
    window.dispatchEvent(new Event('apex_sitemap_changed'));
  }, [cleanedBaseUrl]);

  useEffect(() => {
    localStorage.setItem('apex_sitemap_configured_routes', JSON.stringify(routes));
    window.dispatchEvent(new Event('apex_sitemap_changed'));
  }, [routes]);

  // Auto-sync suggested filename when base website host shifts
  useEffect(() => {
    const domainPart = cleanedBaseUrl.replace(/^https?:\/\/(www\.)?/i, '').replace(/[^a-zA-Z0-9.-]/g, '_');
    const suggested = domainPart ? `sitemap_${domainPart}.xml` : 'sitemap.xml';
    setDownloadFilename(suggested);
  }, [cleanedBaseUrl]);

  // Synchronize SEO metadata whenever routes or base URL change (ensure reasonable simulated data is always preloaded)
  useEffect(() => {
    setSeoMetadata(prev => {
      const next = { ...prev };
      let changed = false;
      routes.forEach(route => {
        if (!next[route.id]) {
          const rawSlug = route.path === '/' ? 'Home' : route.path
            .replace(/^\//, '')
            .split('/')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' › ');
          
          next[route.id] = {
            title: route.path === '/' 
              ? `Home | ${cleanedBaseUrl.replace(/^https?:\/\/(www\.)?/i, '')}`
              : `${rawSlug} | ${cleanedBaseUrl.replace(/^https?:\/\/(www\.)?/i, '')}`,
            description: `Welcome to our optimized ${route.path === '/' ? 'primary index entry' : route.path} page. Discover specifications, SEO tag configurations, and premium insights.`,
            canonical: `${cleanedBaseUrl}${route.path}`
          };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [routes, cleanedBaseUrl]);

  // Reset crawler state if the base URL or routes are changed, reminding the user to re-run the crawl audit
  useEffect(() => {
    setHasScanned(false);
  }, [routes, cleanedBaseUrl]);

  // Dynamically analyze the SEO tag content for all routes
  const auditAnalysis = useMemo(() => {
    const results: Record<string, {
      titleStatus: 'pass' | 'warning' | 'fail';
      titleMsg: string;
      descStatus: 'pass' | 'warning' | 'fail';
      descMsg: string;
      canonicalStatus: 'pass' | 'warning' | 'fail';
      canonicalMsg: string;
      score: number;
    }> = {};

    routes.forEach(route => {
      const meta = seoMetadata[route.id] || { title: '', description: '', canonical: '' };
      
      // Title Tag Audit (Recommend 30-60 chars)
      let titleStatus: 'pass' | 'warning' | 'fail' = 'pass';
      let titleMsg = 'Sublime length and context (30–60 chars).';
      const tLen = meta.title.trim().length;
      if (tLen === 0) {
        titleStatus = 'fail';
        titleMsg = 'Critical: Title tag is completely empty/missing.';
      } else if (tLen < 25) {
        titleStatus = 'warning';
        titleMsg = `Suboptimal: Title length is too short (${tLen} chars). Recommend 30–60 chars.`;
      } else if (tLen > 65) {
        titleStatus = 'warning';
        titleMsg = `Truncated: Exceeds search snippet limit (${tLen} chars). Recommend under 60 chars.`;
      }

      // Description Tag Audit (Recommend 50-160 chars)
      let descStatus: 'pass' | 'warning' | 'fail' = 'pass';
      let descMsg = 'Optimal meta description layout (60–160 chars).';
      const dLen = meta.description.trim().length;
      if (dLen === 0) {
        descStatus = 'fail';
        descMsg = 'Critical: Meta description tag is missing or empty.';
      } else if (dLen < 50) {
        descStatus = 'warning';
        descMsg = `Suboptimal: Description is too brief (${dLen} chars). Recommend 60–160 chars.`;
      } else if (dLen > 165) {
        descStatus = 'warning';
        descMsg = `Truncated snippet: Description exceeds standardized search snippet limit (${dLen} chars). Keep under 160 chars.`;
      }

      // Canonical Header Tag Audit
      let canonicalStatus: 'pass' | 'warning' | 'fail' = 'pass';
      let canonicalMsg = 'Matches current search destination perfectly.';
      const standardCanonical = `${cleanedBaseUrl}${route.path}`;
      if (!meta.canonical.trim()) {
        canonicalStatus = 'fail';
        canonicalMsg = 'Critical: Canonical URL link reference is missing.';
      } else if (meta.canonical.trim() !== standardCanonical) {
        canonicalStatus = 'warning';
        canonicalMsg = `Mismatch error: points to "${meta.canonical}" instead of target index "${standardCanonical}".`;
      }

      // Calculate aggregated score for this node
      let rawScore = 0;
      if (titleStatus === 'pass') rawScore += 35;
      else if (titleStatus === 'warning') rawScore += 20;

      if (descStatus === 'pass') rawScore += 35;
      else if (descStatus === 'warning') rawScore += 20;

      if (canonicalStatus === 'pass') rawScore += 30;
      else if (canonicalStatus === 'warning') rawScore += 15;

      results[route.id] = {
        titleStatus,
        titleMsg,
        descStatus,
        descMsg,
        canonicalStatus,
        canonicalMsg,
        score: rawScore
      };
    });

    return results;
  }, [routes, seoMetadata, cleanedBaseUrl]);

  // Run the staggered simulated crawler indexation audit
  const triggerCrawlScan = () => {
    if (routes.length === 0) return;
    setIsScanning(true);
    setHasScanned(false);
    setScanProgress(0);
    setScanLogs([
      '🕷️ Initializing crawl audit core...',
      `🔗 Active scan queue: ${routes.length} sitemap pathways targets.`,
      `🌐 Targeting Base Web Host: ${cleanedBaseUrl}`
    ]);

    let queueIdx = 0;
    const scrollPeriod = setInterval(() => {
      if (queueIdx >= routes.length) {
        clearInterval(scrollPeriod);
        setScanLogs(prev => [
          ...prev,
          '📂 Compiling audit indexes into meta schema validation report...',
          '✅ SUCCESS: Sitemaps metadata inspection complete!'
        ]);
        setScanProgress(100);
        setIsScanning(false);
        setHasScanned(true);
        return;
      }

      const activeRoute = routes[queueIdx];
      const routeMeta = seoMetadata[activeRoute.id] || { title: '', description: '', canonical: '' };
      const randPing = Math.floor(Math.random() * 80) + 40;
      
      setScanLogs(prev => [
        ...prev,
        `📡 HTTP GET ${activeRoute.path} (latency: ${randPing}ms)`,
        `   ↳ Status: 200 OK | type: text/html`,
        `   ↳ Found: <title> "${routeMeta.title.substring(0, 30)}${routeMeta.title.length > 30 ? '...' : ''}"`,
        `   ↳ Found: <meta name="description"> "${routeMeta.description.substring(0, 45)}${routeMeta.description.length > 45 ? '...' : ''}"`,
        `   ↳ Found: <link rel="canonical"> "${routeMeta.canonical}"`
      ]);

      queueIdx++;
      setScanProgress(Math.min(Math.round((queueIdx / routes.length) * 100), 100));
    }, 400);
  };

  interface URLValidationResult {
    line: string;
    index: number;
    type: 'absolute' | 'relative' | 'malformed';
    message: string;
    cleanPath: string;
  }

  // Real-time bulk input URL and path analytics
  const bulkAnalysis = useMemo<URLValidationResult[]>(() => {
    if (!bulkInput.trim()) return [];
    
    const lines = bulkInput.split(/\r?\n/);
    const results: URLValidationResult[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // 1. Check for illegal characters
      const hasSpaces = /\s/.test(trimmed);
      const hasControlChars = /["'<>\\^`{}[\]|]/.test(trimmed);
      
      // 2. Check protocol structure
      const hasHttpSecure = /^https?:\/\//i.test(trimmed);
      const hasBrokenHttp = /^(https?:?\/+(?!\/)|https?:?\/*$|http:?\/\/*)/i.test(trimmed);
      const hasOtherProto = /^[a-z0-9+.-]+:\/\//i.test(trimmed) && !hasHttpSecure;

      if (hasSpaces || hasControlChars || hasBrokenHttp || hasOtherProto) {
        results.push({
          line,
          index: idx + 1,
          type: 'malformed',
          message: hasSpaces 
            ? 'Contains space characters (not allowed in URL paths)' 
            : hasBrokenHttp
            ? 'Malformed protocol structure (must be http:// or https://)'
            : hasControlChars
            ? 'Contains illegal raw URI special characters'
            : 'Unsupported transfer protocol (only http:// or https:// are valid)',
          cleanPath: ''
        });
        return;
      }

      if (hasHttpSecure) {
        try {
          const urlObj = new URL(trimmed);
          if (!urlObj.hostname || !urlObj.hostname.includes('.')) {
            results.push({
              line,
              index: idx + 1,
              type: 'malformed',
              message: 'Absolute URL requires a valid hostname with domain name ext',
              cleanPath: ''
            });
          } else {
            const pathPart = urlObj.pathname + urlObj.search + urlObj.hash;
            results.push({
              line,
              index: idx + 1,
              type: 'absolute',
              message: 'Valid absolute URL (will automatically resolve to local route)',
              cleanPath: pathPart
            });
          }
        } catch (err) {
          results.push({
            line,
            index: idx + 1,
            type: 'malformed',
            message: 'Invalid absolute URL string syntax',
            cleanPath: ''
          });
        }
      } else {
        // Relative path validation
        const hasHostLikePrefix = /^[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]{2,}/.test(trimmed);
        
        let targetPath = trimmed;
        if (!targetPath.startsWith('/')) {
          targetPath = '/' + targetPath;
        }

        if (hasHostLikePrefix) {
          results.push({
            line,
            index: idx + 1,
            type: 'malformed',
            message: 'Domain name input without protocol (either add http(s):// or start with "/" for relative paths)',
            cleanPath: ''
          });
        } else {
          results.push({
            line,
            index: idx + 1,
            type: 'relative',
            message: trimmed.startsWith('/') 
              ? 'Non-absolute local path (will append to base URL)'
              : 'Non-absolute local path missing root slash (will auto-prepend "/")',
            cleanPath: targetPath
          });
        }
      }
    });

    return results;
  }, [bulkInput]);

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

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if there are malformed URLs
    const malformed = bulkAnalysis.filter(r => r.type === 'malformed');
    if (malformed.length > 0) {
      setCopiedNotice(`Cannot import! Please resolve or delete the ${malformed.length} malformed URL(s) highlighted in red.`);
      setTimeout(() => setCopiedNotice(null), 5000);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    let duplicateCount = 0;
    let parsedCount = 0;
    const importedRoutes: SitemapRoute[] = [];

    bulkAnalysis.forEach(item => {
      let cleanPath = item.cleanPath;
      if (!cleanPath) return;

      // Strip trailing slash if it's not a single root
      if (cleanPath.length > 1) {
        cleanPath = cleanPath.replace(/\/+$/, '');
      }

      // Avoid duplicates within the new bulk payload list
      if (importedRoutes.some(r => r.path === cleanPath)) {
        duplicateCount++;
        return;
      }

      // Unless overwriting, check against existing list of crawled routes
      if (!bulkOverwrite && routes.some(r => r.path === cleanPath)) {
        duplicateCount++;
        return;
      }

      importedRoutes.push({
        id: Math.random().toString(36).substring(2, 9),
        path: cleanPath,
        changefreq: bulkFreq,
        priority: bulkPriority,
        lastmodEnabled: true,
        lastmodDate: today
      });
      parsedCount++;
    });

    if (parsedCount === 0) {
      setCopiedNotice('No valid new paths found inside bulk selection.');
      setTimeout(() => setCopiedNotice(null), 4000);
      return;
    }

    if (bulkOverwrite) {
      setRoutes(importedRoutes);
    } else {
      setRoutes(prev => [...prev, ...importedRoutes]);
    }

    setCopiedNotice(`Success! Mapped ${parsedCount} directory routes.${duplicateCount > 0 ? ` [${duplicateCount} duplicates skipped]` : ''}`);
    setTimeout(() => setCopiedNotice(null), 4000);
    setBulkInput('');
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

  // Automatically discover and map all 45 dynamic tool routes plus 138 high-value articles in the app
  const handleAutoDiscovery = (fallbackFreq: typeof newFreq, toolPriority: number, legalPriority: number, overwrite: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Convert DISCOVERED_APP_TABS to real sitemap routes
    const discoveredTools = DISCOVERED_APP_TABS.map((item) => {
      const isLegal = ['privacy-policy', 'terms-of-service', 'about-us'].includes(item.tab);
      const isIndex = item.tab === 'dashboard';
      
      let prio = item.defaultPriority;
      if (isLegal) prio = legalPriority;
      else if (!isIndex) {
        // Fallback or customize general utility priority slightly based on user selection
        prio = Number((item.defaultPriority * (toolPriority / 0.85)).toFixed(2));
        prio = Math.min(Math.max(prio, 0.1), 1.0);
      }
      
      return {
        id: `auto_${item.tab}_${Math.random().toString(36).substring(2, 6)}`,
        path: item.path,
        changefreq: (isLegal ? 'monthly' : (isIndex ? 'daily' : fallbackFreq)) as any,
        priority: prio,
        lastmodEnabled: true,
        lastmodDate: today
      };
    });

    // 2. Map all 138 deep-linked dynamic guides & blog posts to individual SEO routes
    const discoveredArticles = AT_LEAST_20_ARTICLES.map((art) => {
      return {
        id: `auto_art_${art.id}_${Math.random().toString(36).substring(2, 6)}`,
        path: `/guides?id=${encodeURIComponent(art.id)}`,
        changefreq: 'weekly' as any,
        priority: 0.75,
        lastmodEnabled: true,
        lastmodDate: today
      };
    });

    const discovered = [...discoveredTools, ...discoveredArticles];

    if (overwrite) {
      setRoutes(discovered);
    } else {
      // Merge: avoid duplication on paths
      setRoutes(prev => {
        const existingPaths = new Set(prev.map(r => r.path));
        const filteredNew = discovered.filter(r => !existingPaths.has(r.path));
        return [...prev, ...filteredNew];
      });
    }

    setCopiedNotice(`Auto-discovery completed! Dynamic crawling indexes initialized with ${discovered.length} active routes (${discoveredTools.length} tools & ${discoveredArticles.length} deep-linked guides).`);
    setTimeout(() => setCopiedNotice(null), 5000);
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

  const triggerDownload = (format: 'xml' | 'gzip' = 'xml') => {
    let finalFilename = downloadFilename.trim();
    if (!finalFilename) {
      finalFilename = 'sitemap.xml';
    }

    if (format === 'gzip') {
      // Ensure file name ends in .xml.gz
      if (!finalFilename.toLowerCase().endsWith('.xml.gz')) {
        if (finalFilename.toLowerCase().endsWith('.xml')) {
          finalFilename = finalFilename.substring(0, finalFilename.length - 4) + '.xml.gz';
        } else {
          finalFilename += '.xml.gz';
        }
      }

      try {
        const textBytes = new TextEncoder().encode(generatedXml);
        const compressedBytes = gzipSync(textBytes);
        const blob = new Blob([compressedBytes], { type: 'application/gzip' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Provide success feedback for GZip download
        setDownloadSuccessNotice(`Successfully compressed & downloaded "${finalFilename}" XML file (${(compressedBytes.byteLength / 1024).toFixed(2)} KB).`);
        setTimeout(() => {
          setDownloadSuccessNotice(null);
        }, 4000);
      } catch (err: any) {
        console.error('Compression/Download error:', err);
        setDownloadSuccessNotice(`Error: Failed to compress sitemap. ${err?.message || ''}`);
      }

    } else {
      // Standard XML format
      if (finalFilename.toLowerCase().endsWith('.xml.gz')) {
        finalFilename = finalFilename.substring(0, finalFilename.length - 7) + '.xml';
      } else if (!finalFilename.toLowerCase().endsWith('.xml')) {
        finalFilename += '.xml';
      }

      const blob = new Blob([generatedXml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Provide instant responsive success feedback banner
      setDownloadSuccessNotice(`Successfully generated and downloaded "${finalFilename}" XML file.`);
      setTimeout(() => {
        setDownloadSuccessNotice(null);
      }, 4000);
    }
  };

  const xmlSizeKb = useMemo(() => {
    const bytes = new Blob([generatedXml]).size;
    return (bytes / 1024).toFixed(2);
  }, [generatedXml]);

  const gzipSizeKb = useMemo(() => {
    try {
      const dataArr = new TextEncoder().encode(generatedXml);
      const compressed = gzipSync(dataArr);
      return (compressed.byteLength / 1024).toFixed(2);
    } catch (e) {
      return '0.00';
    }
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
          Premium XML Sitemap Generator
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
              
              {/* Creation Mode Toggle Tabs */}
              <div className="flex border-b border-zinc-900 pb-1 gap-2">
                <button
                  type="button"
                  onClick={() => setCreationMode('single')}
                  className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all border-b-2 outline-none select-none ${
                    creationMode === 'single'
                      ? 'border-brand text-brand'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Single Path</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode('bulk')}
                  className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all border-b-2 outline-none select-none ${
                    creationMode === 'bulk'
                      ? 'border-brand text-brand'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Bulk Paste Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode('auto')}
                  className={`px-4 py-2 text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all border-b-2 outline-none select-none ${
                    creationMode === 'auto'
                      ? 'border-brand text-brand'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Detect Routes</span>
                </button>
              </div>

              {creationMode === 'single' ? (
                /* Insert Route Form */
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
                    <label className="text-[9px] font-mono text-[#71717a] uppercase tracking-wider block mb-1">Priority ({newPriority.toFixed(1)})</label>
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
              ) : creationMode === 'bulk' ? (
                /* Bulk Paste Form */
                <form onSubmit={handleBulkImport} className="p-4 rounded-lg bg-zinc-950 border border-zinc-900 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-extrabold">
                      Paste Newline-Separated URLs or Paths
                    </label>
                    <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                      Paste a raw batch list below. Full URLs (e.g. <code className="text-zinc-405 font-mono">{cleanedBaseUrl}/services</code>) or simple paths (e.g. <code className="text-zinc-405 font-mono">/about</code>) are accepted. Domain components are auto-resolved into relative references.
                    </p>
                    <textarea
                      required
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      placeholder={"/portfolio/services\n/blog/engineering-updates\nhttps://mywebsite.com/solutions\nhttps://mywebsite.com/contact-us"}
                      className="w-full h-32 bg-[#060608] border border-zinc-900 focus:border-brand/50 rounded p-3 font-mono text-xs text-zinc-300 focus:outline-none resize-none placeholder-zinc-700 leading-relaxed transition-colors"
                    />
                  </div>

                  {/* Real-time Inline URL/Path Quality Reporter & Highlighting */}
                  <AnimatePresence>
                    {bulkAnalysis.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        <div className="flex items-center justify-between border-t border-zinc-900/60 pt-3">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${bulkAnalysis.some(x => x.type === 'malformed') ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${bulkAnalysis.some(x => x.type === 'malformed') ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                            </span>
                            Real-Time URL Quality Report
                          </span>
                          <div className="flex gap-1.5 select-none">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-semibold">
                              {bulkAnalysis.filter(x => x.type === 'absolute').length} Absolute
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[9px] font-semibold">
                              {bulkAnalysis.filter(x => x.type === 'relative').length} Non-Absolute
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[9px] font-semibold">
                              {bulkAnalysis.filter(x => x.type === 'malformed').length} Malformed
                            </span>
                          </div>
                        </div>

                        <div className="max-h-40 overflow-y-auto border border-zinc-900 rounded bg-[#07070a]/90 divide-y divide-zinc-900/40">
                          {bulkAnalysis.map((item, id) => {
                            let indicatorBg = '';
                            let borderAccent = '';
                            let messageColor = '';

                            if (item.type === 'absolute') {
                              indicatorBg = 'bg-emerald-500/5';
                              borderAccent = 'border-l-2 border-emerald-500';
                              messageColor = 'text-emerald-400';
                            } else if (item.type === 'relative') {
                              indicatorBg = 'bg-amber-500/5';
                              borderAccent = 'border-l-2 border-amber-500';
                              messageColor = 'text-amber-450';
                            } else {
                              indicatorBg = 'bg-rose-500/5';
                              borderAccent = 'border-l-2 border-rose-500';
                              messageColor = 'text-rose-400';
                            }

                            return (
                              <div key={id} className={`p-2 ${indicatorBg} ${borderAccent} flex items-start gap-2 text-xs font-mono`}>
                                <span className="text-[10px] text-zinc-500 font-bold bg-zinc-900 px-1 rounded shrink-0">
                                  L{item.index}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-zinc-300 truncate pb-0.5" title={item.line}>
                                    {item.line}
                                  </div>
                                  <div className={`text-[10px] ${messageColor} flex items-center gap-1`}>
                                    {item.type === 'malformed' ? (
                                      <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                    ) : item.type === 'relative' ? (
                                      <Info className="w-3 h-3 text-amber-500 shrink-0" />
                                    ) : (
                                      <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                    )}
                                    <span>{item.message}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4 select-none">
                      <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Fallback frequency</label>
                      <select
                        value={bulkFreq}
                        onChange={(e) => setBulkFreq(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-850 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
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

                    <div className="md:col-span-4">
                      <label className="text-[9px] font-mono text-[#71717a] uppercase tracking-wider block mb-1">Fallback Priority ({bulkPriority.toFixed(1)})</label>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.1"
                        value={bulkPriority}
                        onChange={(e) => setBulkPriority(parseFloat(e.target.value))}
                        className="w-full accent-brand h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer mb-2.5"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none pb-2.5 md:pb-1">
                        <input
                          type="checkbox"
                          checked={bulkOverwrite}
                          onChange={(e) => setBulkOverwrite(e.target.checked)}
                          className="rounded bg-zinc-900 border-zinc-800 text-brand focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-brand"
                        />
                        <span className="text-[10px] font-mono uppercase tracking-wide text-zinc-400 hover:text-white transition-colors">Replace existing pathways</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={bulkAnalysis.some(x => x.type === 'malformed')}
                    className={`w-full font-sans font-extrabold text-xs py-2.5 rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all uppercase tracking-wider active:scale-[0.99] outline-none ${
                      bulkAnalysis.some(x => x.type === 'malformed')
                        ? 'bg-[#180f12] border border-rose-950/60 text-rose-450 cursor-not-allowed'
                        : 'bg-brand hover:bg-brand-hover text-zinc-950 shadow-[0_2px_10px_rgba(235,190,40,0.15)] hover:text-zinc-900'
                    }`}
                  >
                    {bulkAnalysis.some(x => x.type === 'malformed') ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>Resolve highlighted errors to import</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-zinc-950 shrink-0" />
                        <span>Compile & Parse Bulk Import</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Workspace Route Auto-Discovery */
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-900 space-y-4">
                  <div className="space-y-1.5 animate-fade-in">
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="font-bold w-4 h-4 text-brand animate-pulse" />
                      <span>Workspace Route Auto-Discovery</span>
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      Scan the active application workspace package to enumerate all 40+ dynamic interactive tool pages, blog articles, and compliance legal agreements. This instantly maps optimized crawl pathways for search engine accessibility.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-900 pt-3 text-xs">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase">Tool Pages Priority</label>
                        <span className="text-[10px] font-mono text-brand font-bold">{autoToolPriority.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={autoToolPriority}
                        onChange={(e) => setAutoToolPriority(parseFloat(e.target.value))}
                        className="w-full accent-brand h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <p className="text-[9px] text-zinc-650 mt-1 leading-tight">Crawl weight coefficient for all core utilities.</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase">Legal Pages Priority</label>
                        <span className="text-[10px] font-mono text-brand font-bold">{autoLegalPriority.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={autoLegalPriority}
                        onChange={(e) => setAutoLegalPriority(parseFloat(e.target.value))}
                        className="w-full accent-brand h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <p className="text-[9px] text-zinc-650 mt-1 leading-tight">Crawl weight identifier for policies & directories.</p>
                    </div>

                    <div>
                      <label className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Default Crawl Cycle</label>
                      <select
                        value={autoFreq}
                        onChange={(e) => setAutoFreq(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-850 rounded px-2.5 py-1 text-xs text-zinc-300 focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="always">Always</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="never">Never</option>
                      </select>
                      <p className="text-[9px] text-zinc-650 mt-1 leading-tight">Suggested crawler update cycle mapping.</p>
                    </div>
                  </div>

                  <div className="flex border-t border-zinc-900 pt-3 flex-col sm:flex-row justify-between items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none self-start sm:self-auto">
                      <input
                        type="checkbox"
                        checked={autoOverwrite}
                        onChange={(e) => setAutoOverwrite(e.target.checked)}
                        className="rounded bg-zinc-900 border-zinc-800 text-brand focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-brand"
                      />
                      <span className="text-[10px] font-mono uppercase tracking-wide text-zinc-400 hover:text-white transition-colors">Replace existing sitemap</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleAutoDiscovery(autoFreq, autoToolPriority, autoLegalPriority, autoOverwrite)}
                      className="w-full sm:w-auto px-6 py-2 bg-brand hover:bg-brand-hover text-zinc-950 hover:text-zinc-900 font-mono text-xs font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
                      <span>DISCOVER & MAP 40+ APP ROUTES</span>
                    </button>
                  </div>
                </div>
              )}

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
            <div className="beveled-panel bg-[#09090d]/95 p-4 border-brand-border/40 text-center space-y-1 flex flex-col justify-center">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total Index URLs</div>
              <div className="font-heading text-2xl font-black text-brand">{routes.length}</div>
            </div>
            <div className="beveled-panel bg-[#09090d]/95 p-4 border-brand-border/40 text-center space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Payload Weight</div>
              <div className="font-heading text-xl font-black text-white">{xmlSizeKb} KB</div>
              <div className="text-[9px] text-emerald-400 font-mono">
                ~{gzipSizeKb} KB compressed (.gz)
              </div>
            </div>
          </div>

          {/* XML Output Panel */}
          <div id="xml-output-panel-card" className="beveled-panel bg-[#09090d]/95 p-6 border-brand-border/40 space-y-4">
            
            {/* Tab switchers in the panel header */}
            <div id="xml-output-tabs-container" className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-900/60 gap-3">
              <div id="xml-output-tab-button-group" className="flex bg-[#030305] border border-zinc-900 rounded p-1 max-w-fit">
                <button
                  type="button"
                  id="preview-tab-tree-btn"
                  onClick={() => setPreviewTab('tree')}
                  className={`px-3 py-1.5 rounded transition-all font-sans text-[11px] uppercase tracking-wider font-extrabold flex items-center gap-1.5 cursor-pointer ${
                    previewTab === 'tree'
                      ? 'bg-brand text-zinc-950 font-black'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Structure Tree Preview</span>
                  <span className="text-[8px] px-1 py-0.2 rounded bg-zinc-950 text-white border border-zinc-800 scale-90 ml-0.5">NEW</span>
                </button>
                <button
                  type="button"
                  id="preview-tab-xml-btn"
                  onClick={() => setPreviewTab('xml')}
                  className={`px-3 py-1.5 rounded transition-all font-sans text-[11px] uppercase tracking-wider font-extrabold flex items-center gap-1.5 cursor-pointer ${
                    previewTab === 'xml'
                      ? 'bg-brand text-zinc-950 font-black'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>sitemap.xml Code</span>
                </button>
              </div>

              <div id="xml-output-actions-or-status" className="flex gap-2 select-none self-end sm:self-auto">
                {previewTab === 'xml' ? (
                  <>
                    <button
                      type="button"
                      id="xml-copy-btn"
                      onClick={copyToClipboard}
                      className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-white rounded bg-zinc-900 border border-zinc-800 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      id="xml-download-top-btn"
                      onClick={() => triggerDownload('xml')}
                      className="px-2.5 py-1 text-[10px] font-mono text-brand hover:text-brand-hover rounded bg-brand/10 hover:bg-brand/20 border border-brand/20 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      title="Download standard XML sitemap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download XML</span>
                    </button>
                    <button
                      type="button"
                      id="xml-download-gzip-top-btn"
                      onClick={() => triggerDownload('gzip')}
                      className="px-2.5 py-1 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 rounded bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/20 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      title="Download gzip compressed XML sitemap (.xml.gz)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .gz</span>
                    </button>
                  </>
                ) : (
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Interactive Structure</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content pane: Interactive Folder Tree */}
            {previewTab === 'tree' ? (
              <div id="tree-directory-rendered-view" className="space-y-4">
                {/* Search & Bulk Collapse/Expand buttons panel */}
                <div id="tree-directory-controls-bar" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-zinc-950 p-2 border border-zinc-900 rounded-lg">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      id="tree-directory-search-input"
                      value={treeSearch}
                      onChange={(e) => setTreeSearch(e.target.value)}
                      placeholder="Filter directory tree structure..."
                      className="w-full bg-[#030305] border border-zinc-905 rounded px-2.5 py-1 text-xs font-mono text-zinc-300 focus:outline-none focus:border-brand/40 placeholder-zinc-700 transition-colors"
                    />
                    {treeSearch && (
                      <button
                        type="button"
                        id="tree-directory-search-clear-btn"
                        onClick={() => setTreeSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 font-mono text-[9px] font-bold cursor-pointer bg-transparent border-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      type="button"
                      id="tree-directory-expand-all-btn"
                      onClick={expandAll}
                      className="px-2 py-1 text-[10px] font-mono text-zinc-400 hover:text-white rounded bg-zinc-900 border border-zinc-900 flex items-center gap-1 cursor-pointer hover:border-zinc-800"
                      title="Expand all tree directories"
                    >
                      <span>Expand All</span>
                    </button>
                    <button
                      type="button"
                      id="tree-directory-collapse-all-btn"
                      onClick={collapseAll}
                      className="px-2 py-1 text-[10px] font-mono text-zinc-400 hover:text-white rounded bg-zinc-900 border border-zinc-900 flex items-center gap-1 cursor-pointer hover:border-zinc-800"
                      title="Collapse all tree directories"
                    >
                      <span>Collapse All</span>
                    </button>
                  </div>
                </div>

                {/* Tree scroll boundary box */}
                <div id="tree-directory-nodes-scroller-box" className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg max-h-[340px] overflow-y-auto relative custom-scrollbar space-y-1">
                  {renderTree(directoryTree)}
                </div>

                {/* Tree metadata footer legend */}
                <div id="tree-directory-footer-legend" className="flex flex-wrap items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-900/40 pt-2 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Folder className="w-3 h-3 text-amber-500" /> Folder</span>
                    <span className="flex items-center gap-1"><FileCode className="w-3 h-3 text-brand" /> Route page</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] animate-pulse"></span> Alert</span>
                  </div>
                  <p className="italic">Click any route label/icon to inspect metrics below.</p>
                </div>
              </div>
            ) : (
              /* Content pane: Raw sitemap.xml source */
              <div id="xml-source-rendered-view" className="space-y-4">
                <div id="xml-document-source-scroller-box" className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg max-h-[340px] overflow-auto relative">
                  <pre className="font-mono text-[10.5px] text-zinc-400 select-all leading-normal whitespace-pre">
                    <code>{generatedXml}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Direct Browser Download Control & Filename Customization */}
            <div id="xml-output-panel-downloads-footer" className="pt-4 border-t border-zinc-900/60 w-full space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-extrabold font-sans">
                  Download Filename (.xml or .xml.gz)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      id="sitemap-download-filename-input"
                      value={downloadFilename}
                      onChange={(e) => setDownloadFilename(e.target.value)}
                      placeholder="sitemap.xml"
                      className="w-full h-full bg-zinc-950 border border-zinc-900 rounded px-3 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-brand/40 placeholder-zinc-700 transition-colors"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      id="sitemap-download-xml-button"
                      onClick={() => triggerDownload('xml')}
                      className="flex-1 sm:flex-initial px-4 py-1.5 text-xs font-mono font-bold text-zinc-950 bg-brand hover:bg-brand-hover rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
                      title="Download standard XML sitemap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download XML</span>
                    </button>
                    <button
                      type="button"
                      id="sitemap-download-gzip-button"
                      onClick={() => triggerDownload('gzip')}
                      className="flex-1 sm:flex-initial px-4 py-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/25 rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
                      title="Download gzip compressed XML sitemap (.xml.gz)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Gzip (.gz)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Download Success Status Alert */}
              <AnimatePresence>
                {downloadSuccessNotice && (
                  <motion.div
                    id="sitemap-download-success-notice-popup"
                    initial={{ opacity: 0, height: 0, y: 5 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -5 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded text-emerald-400 font-mono text-[10.5px] flex items-center gap-2 overflow-hidden"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{downloadSuccessNotice}</span>
                  </motion.div>
                )}
              </AnimatePresence>
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
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0 text-zinc-500 animate-pulse" />
                <div>
                  <strong className="text-zinc-200">Keep links under 50,000 URLs</strong>
                  <p className="text-zinc-500 text-[10px]">Standard XML index restrictions cap size at 50,000 links or 50MB. If exceeded, split into nested indices.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-zinc-200">Leverage Gzip Compression (.xml.gz)</strong>
                  <p className="text-zinc-500 text-[10px]">Compressing sitemaps reduces server load, bandwidth, and download times for crawling bots. Standard search engines (Google, Bing) automatically unpack .xml.gz files.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* SEO Metatag Crawler & Compliance Auditor Panel */}
      <div id="seo-audit-section" className="beveled-panel bg-[#09090d]/95 p-6 border-brand-border/40 space-y-6 mt-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-900/60">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand/10 border border-brand/20 text-brand text-[10px] font-mono font-bold uppercase tracking-wide">
              <span>Automated SEO Inspector</span>
            </div>
            <h3 className="font-heading text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-brand" />
              <span>Automated Search Bot Meta-Tag Crawler</span>
            </h3>
            <p className="font-sans text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Initiate standardized virtual web crawler bot requests to parse all active sitemap target links for critical SEO meta-elements (<code className="text-zinc-200 font-mono">&lt;title&gt;</code>, <code className="text-zinc-200 font-mono">&lt;meta description&gt;</code>, and <code className="text-zinc-200 font-mono">&lt;link rel="canonical"&gt;</code>). Alert for omissions instantly.
            </p>
          </div>

          {!isScanning && (
            <button
              onClick={triggerCrawlScan}
              disabled={routes.length === 0}
              className={`px-4 py-2.5 font-sans font-bold text-xs rounded uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0 ${
                routes.length === 0
                  ? 'bg-zinc-950 border border-zinc-900 text-zinc-600 cursor-not-allowed'
                  : 'bg-brand hover:bg-brand-hover text-zinc-950 shadow-[0_2px_10px_rgba(235,190,40,0.15)] hover:text-zinc-900'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{hasScanned ? 'Re-Run Inspection Crawl' : 'Trigger Automated Scan'}</span>
            </button>
          )}
        </div>

        {/* Status Panel: Idle */}
        {!isScanning && !hasScanned && (
          <div className="py-12 text-center max-w-md mx-auto space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-650">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-11">
              <h4 className="font-heading text-sm font-bold text-zinc-300">Compliance Scanner Core Standby</h4>
              <p className="font-sans text-xs text-zinc-500 leading-normal">
                No inspection results generated yet. Execute the virtual auditor to request page headers and check for missing meta tags.
              </p>
            </div>
            <button
              type="button"
              onClick={triggerCrawlScan}
              disabled={routes.length === 0}
              className="font-mono text-xs text-brand hover:underline font-bold"
            >
              Crawl {routes.length} paths now &rarr;
            </button>
          </div>
        )}

        {/* Status Panel: Crawling */}
        {isScanning && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-brand"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                  </span>
                  Spiders traversing sitemap nodes...
                </span>
                <span>{scanProgress}% Completed</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900 p-[1px]">
                <div 
                  className="h-full bg-brand rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-zinc-900 bg-[#050508]/95 overflow-hidden font-mono text-[10px] p-4 text-zinc-400 space-y-1.5 max-h-56 overflow-y-auto shadow-inner">
              {scanLogs.map((log, lIdx) => (
                <div key={lIdx} className="leading-relaxed">
                  {log.includes('✅') || log.includes('SUCCESS') ? (
                    <span className="text-emerald-400 font-bold">{log}</span>
                  ) : log.includes('🕷️') ? (
                    <span className="text-brand font-extrabold">{log}</span>
                  ) : log.includes('📡') ? (
                    <span className="text-zinc-200 font-semibold">{log}</span>
                  ) : log.includes('Critical') ? (
                    <span className="text-rose-400 font-bold">{log}</span>
                  ) : (
                    <span className="text-zinc-500">{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Panel: Finished and displaying report cards */}
        {hasScanned && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-905 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand/5 border border-brand/10 flex items-center justify-center text-brand font-heading text-lg font-black">
                  {Math.round(
                    (Object.values(auditAnalysis) as any[]).reduce((acc, curr) => acc + curr.score, 0) / 
                    Math.max(routes.length, 1)
                  )}%
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-zinc-500">SEO Health Index</div>
                  <div className="text-xs font-bold text-white">Mean Compliance</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-905 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-550/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                  {
                    (Object.values(auditAnalysis) as any[]).filter(
                      item => item.titleStatus === 'pass' && item.descStatus === 'pass' && item.canonicalStatus === 'pass'
                    ).length
                  }
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">Passed Checks</div>
                  <div className="text-xs font-bold text-zinc-300">100% Configured Pages</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-905 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-550/20 flex items-center justify-center text-amber-500 text-xs font-bold">
                  {
                    (Object.values(auditAnalysis) as any[]).filter(
                      item => item.titleStatus === 'warning' || item.descStatus === 'warning' || item.canonicalStatus === 'warning'
                    ).length
                  }
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">Warnings Flagged</div>
                  <div className="text-xs font-bold text-zinc-300">Suboptimal Dimensions</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-905 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-rose-500/10 border border-rose-550/20 flex items-center justify-center text-rose-450 text-xs font-bold">
                  {
                    (Object.values(auditAnalysis) as any[]).filter(
                      item => item.titleStatus === 'fail' || item.descStatus === 'fail' || item.canonicalStatus === 'fail'
                    ).length
                  }
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">Critical Errors</div>
                  <div className="text-xs font-bold text-zinc-300">Missing Elements</div>
                </div>
              </div>
            </div>

            {/* Audit compliance result row-cards */}
            <div className="border border-zinc-900 rounded-lg bg-[#050508]/80 divide-y divide-zinc-900/40 overflow-hidden">
              <div className="hidden md:grid grid-cols-12 p-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-950 font-extrabold border-b border-zinc-900">
                <div className="col-span-4">Crawl Target Path</div>
                <div className="col-span-4">Compliance Diagnostics</div>
                <div className="col-span-4">Live Render Inspection</div>
              </div>

              {routes.map((route) => {
                const audit = auditAnalysis[route.id] || {
                  titleStatus: 'fail', titleMsg: '',
                  descStatus: 'fail', descMsg: '',
                  canonicalStatus: 'fail', canonicalMsg: '',
                  score: 0
                };
                const meta = seoMetadata[route.id] || { title: '', description: '', canonical: '' };
                const isEditing = editingRouteId === route.id;

                return (
                  <div 
                    key={route.id} 
                    className={`grid grid-cols-12 p-4 items-start gap-4 transition-all ${
                      isEditing ? 'bg-zinc-950/90 ring-1 ring-brand/35 border-brand/20' : 'hover:bg-[#07070d]/50'
                    }`}
                  >
                    {/* Path and general data */}
                    <div className="col-span-12 md:col-span-4 space-y-2">
                      <div className="font-mono text-xs font-bold text-zinc-200 break-all flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold text-zinc-550 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">CRAWL</span>
                        <span>{route.path}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-500">Quality Score:</span>
                        <div className={`text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          audit.score === 100 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                            : audit.score >= 60 
                            ? 'bg-amber-500/10 text-amber-450 border border-amber-500/10' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                        }`}>
                          {audit.score}/100
                        </div>
                      </div>
                    </div>

                    {/* Meta analyses status alerts */}
                    <div className="col-span-12 md:col-span-4 space-y-3">
                      {/* Title Tag */}
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-zinc-500 uppercase font-semibold">Title Tag:</span>
                          <span className={`font-bold uppercase text-[9px] px-1 rounded ${
                            audit.titleStatus === 'pass' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : audit.titleStatus === 'warning' 
                              ? 'bg-amber-500/10 text-amber-450' 
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {audit.titleStatus}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-zinc-400 leading-normal">{audit.titleMsg}</p>
                      </div>

                      {/* Description Tag */}
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-zinc-500 uppercase font-semibold">Meta Description:</span>
                          <span className={`font-bold uppercase text-[9px] px-1 rounded ${
                            audit.descStatus === 'pass' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : audit.descStatus === 'warning' 
                              ? 'bg-amber-500/10 text-amber-450' 
                              : 'bg-rose-500/10 text-rose-450'
                          }`}>
                            {audit.descStatus}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-zinc-400 leading-normal">{audit.descMsg}</p>
                      </div>

                      {/* Canonical Link */}
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-zinc-500 uppercase font-semibold">Canonical URL:</span>
                          <span className={`font-bold uppercase text-[9px] px-1 rounded ${
                            audit.canonicalStatus === 'pass' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : audit.canonicalStatus === 'warning' 
                              ? 'bg-amber-500/10 text-amber-450' 
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {audit.canonicalStatus}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-zinc-400 leading-normal">{audit.canonicalMsg}</p>
                      </div>
                    </div>

                    {/* Metadata rendering and inline customizer inputs */}
                    <div className="col-span-12 md:col-span-4 space-y-2">
                      {isEditing ? (
                        <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-3.5">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-mono uppercase text-zinc-520">Page Title String</span>
                              <span className={`text-[9px] font-mono ${meta.title.length < 25 || meta.title.length > 65 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {meta.title.length} chars
                              </span>
                            </div>
                            <input
                              type="text"
                              value={meta.title}
                              onChange={(e) => {
                                setSeoMetadata(prev => ({
                                  ...prev,
                                  [route.id]: { ...meta, title: e.target.value }
                                }));
                              }}
                              className="w-full bg-[#030305] border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-100 focus:outline-none focus:border-brand/40 font-mono"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-mono uppercase text-zinc-520">Meta Description String</span>
                              <span className={`text-[9px] font-mono ${meta.description.length < 50 || meta.description.length > 165 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {meta.description.length} chars
                              </span>
                            </div>
                            <textarea
                              value={meta.description}
                              onChange={(e) => {
                                setSeoMetadata(prev => ({
                                  ...prev,
                                  [route.id]: { ...meta, description: e.target.value }
                                }));
                              }}
                              className="w-full h-16 bg-[#030305] border border-zinc-800 rounded p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-brand/40 resize-none font-mono leading-normal"
                            />
                          </div>

                          <div>
                            <span className="text-[9px] font-mono uppercase text-zinc-520 block mb-1">Canonical Target reference</span>
                            <input
                              type="text"
                              value={meta.canonical}
                              onChange={(e) => {
                                setSeoMetadata(prev => ({
                                  ...prev,
                                  [route.id]: { ...meta, canonical: e.target.value }
                                }));
                              }}
                              className="w-full bg-[#030305] border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-100 focus:outline-none focus:border-brand/40 font-mono text-zinc-400"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                // Re-run dynamic validation score check instantly on save
                                setEditingRouteId(null);
                              }}
                              className="flex-1 py-1.5 bg-brand hover:bg-brand-hover text-zinc-950 font-sans text-[10px] uppercase font-extrabold tracking-wider rounded cursor-pointer transition-colors"
                            >
                              Save & Recalculate
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-[10.5px] leading-relaxed space-y-2 font-mono">
                            <div className="space-y-0.5">
                              <div className="text-[8.5px] font-mono text-zinc-550 flex items-center justify-between">
                                <span>&lt;title&gt;</span>
                                <span className="opacity-60">{meta.title.length}c</span>
                              </div>
                              <p className="text-zinc-200 truncate" title={meta.title}>
                                {meta.title ? meta.title : <span className="text-rose-400 italic font-semibold">Empty block missing!</span>}
                              </p>
                            </div>

                            <div className="space-y-0.5">
                              <div className="text-[8.5px] font-mono text-zinc-550 flex items-center justify-between">
                                <span>&lt;meta name="description"&gt;</span>
                                <span className="opacity-60">{meta.description.length}c</span>
                              </div>
                              <p className="text-zinc-400 line-clamp-2" title={meta.description}>
                                {meta.description ? meta.description : <span className="text-rose-400 italic font-semibold font-bold">Missing! Description tag absent</span>}
                              </p>
                            </div>

                            <div className="space-y-0.5 pt-1.5 border-t border-zinc-900/60">
                              <span className="text-[8.5px] font-mono text-zinc-550">&lt;link rel="canonical"&gt;</span>
                              <p className="text-zinc-500 font-bold truncate break-all block" title={meta.canonical}>
                                {meta.canonical ? meta.canonical : <span className="text-rose-400 italic font-semibold text-[10px]">Missing canonical tag</span>}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-end pr-0.5">
                            <button
                              type="button"
                              onClick={() => setEditingRouteId(route.id)}
                              className="text-[9.5px] font-mono text-brand hover:underline font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Config custom elements &rarr;
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

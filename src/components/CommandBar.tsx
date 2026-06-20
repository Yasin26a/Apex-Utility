import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Command, FileText, Image as ImageIcon, FileImage, Braces, Globe, LayoutGrid, Palette, ArrowRight, CornerDownLeft, Layers, Sparkles, ShieldCheck, QrCode, Scale, FileCode, Sliders, GitPullRequest, Hash, PenTool, Gauge, Binary, Regex, ArrowLeftRight, Shrink, Type, AlignLeft, Crop, Calendar, BookOpen } from 'lucide-react';
import { ActiveTab } from '../types';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  theme: 'crimson' | 'cobalt' | 'auto';
  onThemeChange: (theme: 'crimson' | 'cobalt' | 'auto') => void;
}

interface CommandItem {
  id: string;
  category: 'Tools' | 'Aesthetics' | 'System';
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  keywords: string[];
  action: () => void;
  shortcut?: string;
}

export default function CommandBar({ isOpen, onClose, onSelectTab, theme, onThemeChange }: CommandBarProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const commandItems: CommandItem[] = [
    {
      id: 'dashboard',
      category: 'Tools',
      title: 'Control Deck',
      description: 'System operations hub and processing dashboard',
      icon: LayoutGrid,
      keywords: ['dashboard', 'control', 'deck', 'home', 'overview', 'main', 'summary'],
      action: () => {
        onSelectTab('dashboard');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'compress-pdf',
      category: 'Tools',
      title: 'PDF Forge (ATS Bio-Optimizer)',
      description: 'Compress and shrink document payload size to 2MB for job application resumes free',
      icon: FileText,
      keywords: ['pdf', 'compress', 'shrink', 'resume', 'job', 'application', 'ats', 'file size', '2mb', 'optimizer'],
      action: () => {
        onSelectTab('compress-pdf');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'join-pdf',
      category: 'Tools',
      title: 'PDF Joiner & Reorder',
      description: 'Upload multiple PDF documents and combine them into a single file with drag-and-drop page reordering',
      icon: Layers,
      keywords: ['pdf', 'join', 'combine', 'merge', 'reorder', 'pages', 'split', 'rotate', 'duplicate'],
      action: () => {
        onSelectTab('join-pdf');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'image-to-pdf',
      category: 'Tools',
      title: 'JPG/PNG to PDF Converter',
      description: 'Combine several raster image files into a single optimized PDF document locally',
      icon: FileImage,
      keywords: ['pdf', 'image to pdf', 'convert', 'merge', 'jpg to pdf', 'png to pdf', 'watermark', 'compile'],
      action: () => {
        onSelectTab('image-to-pdf');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'webp-converter',
      category: 'Tools',
      title: 'Media Lab (WebP Image Converter)',
      description: 'Convert WebP to JPG instantly without registration or files leaving browser',
      icon: ImageIcon,
      keywords: ['webp', 'jpg', 'png', 'image', 'converter', 'quality', 'convert', 'rasterize', 'offline'],
      action: () => {
        onSelectTab('webp-converter');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'json-beautifier',
      category: 'Tools',
      title: 'JSON Core Swiss Beautifier',
      description: 'Format unreadable JSON data tool and validate nested arrays in real time',
      icon: Braces,
      keywords: ['json', 'beautifier', 'format', 'minify', 'unreadable', 'array', 'parse', 'validate', 'developer'],
      action: () => {
        onSelectTab('json-beautifier');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'sitemap-seo',
      category: 'Tools',
      title: 'SEO Crawler & Sitemap Analyzer',
      description: 'Generate and inspect dynamic XML sitemap online free',
      icon: Globe,
      keywords: ['seo', 'crawler', 'sitemap', 'robots', 'xml', 'inspect', 'priority', 'indexing', 'audit'],
      action: () => {
        onSelectTab('sitemap-seo');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'sitemap-generator',
      category: 'Tools',
      title: 'Sitemap XML Generator',
      description: 'Create custom in-browser XML sitemaps with custom page priorities and frequencies',
      icon: FileCode,
      keywords: ['seo', 'sitemap', 'generator', 'xml', 'builder', 'links', 'crawling', 'frequency', 'priority'],
      action: () => {
        onSelectTab('sitemap-generator');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'ai-writer',
      category: 'Tools',
      title: 'Apex AI Writer & Copywriter',
      description: 'Draft, format, and edit publications, emails, and markdown documents using Google Gemini AI',
      icon: Sparkles,
      keywords: ['ai', 'writer', 'copywriter', 'draft', 'author', 'article', 'email', 'markdown', 'gemini', 'tone'],
      action: () => {
        onSelectTab('ai-writer');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'password-generator',
      category: 'Tools',
      title: 'Shield Vault Secure Password Generator',
      description: 'Generate high-entropy random keys or memorable multi-word passphrases offline',
      icon: ShieldCheck,
      keywords: ['password', 'generator', 'passphrase', 'key', 'shield', 'vault', 'security', 'secure', 'entropy', 'copy'],
      action: () => {
        onSelectTab('password-generator');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'qr-generator',
      category: 'Tools',
      title: 'QR & Barcode Studio',
      description: 'Generate high-resolution custom raster and vector QR codes or multi-format linear barcodes with full styling and design templates',
      icon: QrCode,
      keywords: ['qr', 'code', 'generator', 'wifi', 'email', 'sms', 'link', 'vector', 'svg', 'png', 'builder', 'compile', 'barcode', 'ean', 'upc', 'code128'],
      action: () => {
        onSelectTab('qr-generator');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'image-vectorizer',
      category: 'Tools',
      title: 'Local Image Vectorizer (Raster to SVG)',
      description: 'Convert raster JPG, JPEG, or PNG images to highly scalable SVG vectors offline with customizable contours, triangulation lowpoly, halftone matrices, and pixel grids',
      icon: Palette,
      keywords: ['vectorizer', 'svg', 'png to svg', 'jpeg to svg', 'contour', 'tracing', 'lowpoly', 'halftone', 'traced', 'image', 'quantize', 'pixelart'],
      action: () => {
        onSelectTab('image-vectorizer');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'unit-converter',
      category: 'Tools',
      title: 'Unit Converter & Metric Solver',
      description: 'Convert custom metrics (length, weight, volume, temperature) in real-time with an instant comparison matrix',
      icon: Scale,
      keywords: ['unit', 'converter', 'metric', 'solver', 'length', 'weight', 'volume', 'temperature', 'dimensions', 'cm', 'kg', 'fahrenheit', 'celsius', 'calculate'],
      action: () => {
        onSelectTab('unit-converter');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'svg-rasterizer',
      category: 'Tools',
      title: 'SVG Vector Rasterizer Compiler',
      description: 'Render or paste raw SVG XML, edit vectors in real-time, scale up to 8x for high-res PNG, JPEG, or WebP downloads',
      icon: FileCode,
      keywords: ['svg', 'rasterizer', 'vector', 'convert', 'scale', 'high', 'resolution', 'hq', 'png', 'jpg', 'jpeg', 'webp', 'xml', 'graphics', 'editor'],
      action: () => {
        onSelectTab('svg-rasterizer');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'batch-processor',
      category: 'Tools',
      title: 'Parallel Batch Processor Core',
      description: 'Upload multiple files to resize, compress, and reformat images in parallel offline',
      icon: Sliders,
      keywords: ['batch', 'processor', 'multi', 'files', 'bulk', 'parallel', 'resize', 'compress', 'format', 'image', 'png', 'jpeg', 'webp', 'optimize'],
      action: () => {
        onSelectTab('batch-processor');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'json-diff',
      category: 'Tools',
      title: 'JSON Object Diff Checker Engine',
      description: 'Compare two JSON schemas, detect additions, deletions, slight drifts or value updates side-by-side with color highlights',
      icon: GitPullRequest,
      keywords: ['json', 'diff', 'checker', 'compare', 'difference', 'side-by-side', 'match', 'schemas', 'syntax', 'validator', 'format', 'merge'],
      action: () => {
        onSelectTab('json-diff');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'secure-hash',
      category: 'Tools',
      title: 'Hash Vault (Secure Cryptographic Hashes)',
      description: 'Generate secure cryptographic MD5, SHA-1, SHA-256, and SHA-512 hashes instantly from input text with copy capabilities',
      icon: Hash,
      keywords: ['secure', 'cryptographic', 'hash', 'hashes', 'md5', 'sha1', 'sha256', 'sha512', 'crypto', 'generator', 'encryption', 'vault', 'fingerprint'],
      action: () => {
        onSelectTab('secure-hash');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'color-palette',
      category: 'Tools',
      title: 'Apex Color Palette Generator & Extractor',
      description: 'Generate harmonious color schemes, extract brand/dominant colors from images, and compile premium CSS variables & Tailwind themes offline',
      icon: Palette,
      keywords: ['color', 'palette', 'extractor', 'brand', 'theme', 'hex', 'css variables', 'harmony', 'analogous', 'monochromatic', 'triadic', 'complementary', 'tailwind'],
      action: () => {
        onSelectTab('color-palette');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'digital-signature',
      category: 'Tools',
      title: 'Apex Digital Signature Generator & Stylist',
      description: 'Create, styling-up, paint, sign, and download custom document signature vectors or png files completely offline',
      icon: PenTool,
      keywords: ['signature', 'sign', 'digital signature', 'autograph', 'draw signature', 'text signature', 'ink', 'document signature', 'offline writer'],
      action: () => {
        onSelectTab('digital-signature');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'seo-optimizer',
      category: 'Tools',
      title: 'Apex SEO Content Optimizer & Real-time Analyzer',
      description: 'Analyze text for keyword density, Flesch-Kincaid readability, character count targets, search engine mockups, and AI-powered enhancements',
      icon: Gauge,
      keywords: ['seo', 'keyword density', 'readability', 'flesch-kincaid', 'score', 'meta description', 'google preview', 'social preview', 'ai optimizer', 'smart content'],
      action: () => {
        onSelectTab('seo-optimizer');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'base64-converter',
      category: 'Tools',
      title: 'Apex Base64 Encoder/Decoder & Asset Generator',
      description: 'Convert text, images, or assets to/from Base64 dynamically with instant web code output templates (html, CSS, js)',
      icon: Binary,
      keywords: ['base64', 'encode', 'decode', 'image to base64', 'file to base64', 'binary', 'ascii', 'data uri', 'b64', 'btoa', 'atob', 'img source'],
      action: () => {
        onSelectTab('base64-converter');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'regex-tester',
      category: 'Tools',
      title: 'Apex Regex Validator & Tester',
      description: 'Input modern RegEx expressions to validate, test capture groups, and preview matched text indicators in real-time',
      icon: Regex,
      keywords: ['regex', 'regular expression', 'regex tester', 'validator', 'pattern', 'test string', 'capture groups', 'match', 'replace', 'greedy', 'lazy'],
      action: () => {
        onSelectTab('regex-tester');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'csv-json-converter',
      category: 'Tools',
      title: 'Apex CSV & JSON Data Converter',
      description: 'Convert structured tabular CSV files to JSON schemas and back with instantaneous visual previews, field editing, and file outputs',
      icon: ArrowLeftRight,
      keywords: ['csv', 'json', 'converter', 'comma separated', 'parse csv', 'json to csv', 'csv to json', 'excel', 'spreadsheet', 'data conversion'],
      action: () => {
        onSelectTab('csv-json-converter');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'image-compressor',
      category: 'Tools',
      title: 'Apex Image Compressor Studio',
      description: 'Reduce image file size or dimensions for JPEG, PNG, and WebP assets with direct side-by-side quality visualizers',
      icon: Shrink,
      keywords: ['image compressor', 'compress', 'resize', 'jpeg', 'png', 'webp', 'aspect ratio', 'byte reducer', 'size reduction', 'quality slider', 'quality factor'],
      action: () => {
        onSelectTab('image-compressor');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'quick-image-optimizer',
      category: 'Tools',
      title: 'Quick Image Optimizer',
      description: 'Bulk resize, compress, and optimize custom image filenames for SEO performance and speed optimization',
      icon: FileImage,
      keywords: ['quick image optimizer', 'seo image optimizer', 'bulk image compression', 'batch resize', 'multiple images', 'webp converter', 'seo filename conversion', 'compress multiple'],
      action: () => {
        onSelectTab('quick-image-optimizer');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'case-converter',
      category: 'Tools',
      title: 'Apex Case Converter & Text Formatter',
      description: 'Format text styles, convert letter cases, clean whitespace, run find & replace, and calculate stats in real-time',
      icon: Type,
      keywords: ['case converter', 'lowercase', 'uppercase', 'title case', 'sentence case', 'camelcase', 'snake_case', 'slug', 'kebab', 'format text', 'html strip', 'find and replace'],
      action: () => {
        onSelectTab('case-converter');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'lorem-generator',
      category: 'Tools',
      title: 'Apex Lorem Ipsum & Placeholder Generator',
      description: 'Generate customizable classical Latin copy text, sentences, HTML list wrappers, or SVG vector graphic mockups instantly',
      icon: AlignLeft,
      keywords: ['lorem generator', 'lorem ipsum', 'placeholder', 'dummy text', 'mock image', 'placeholder image', 'developer mockup', 'svg size', 'unlocked copy', 'paragraph list maker'],
      action: () => {
        onSelectTab('lorem-generator');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'image-cropper',
      category: 'Tools',
      title: 'Apex Image Cropper, Resizer & Ratio Balancer',
      description: 'Crop screenshots, adjust aspect ratios (16:9, 4:3, 1:1, etc.), resize pixel scales, and balance resolutions offline',
      icon: Crop,
      keywords: ['image cropper', 'crop image', 'resize image', 'aspect ratio lock', 'resolution balancer', 'avatar generator', 'compress photo', 'fit inside aspect ratio', 'canvas padding', 'blurred background padding'],
      action: () => {
        onSelectTab('image-cropper');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'date-calculator',
      category: 'Tools',
      title: 'Apex Time & Date Calculator',
      description: 'Find intervals, count business days, add/subtract duration periods, and convert UTC/local time offsets',
      icon: Calendar,
      keywords: ['date calculator', 'time differences', 'business days', 'add time', 'subtract date', 'working days', 'countdown', 'timezone converter', 'duration calculator'],
      action: () => {
        onSelectTab('date-calculator');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'guides',
      category: 'System',
      title: 'Guides & Practical Tutorials',
      description: 'Review structural layouts, frontend cryptography details, and SEO indexing blueprints',
      icon: BookOpen,
      keywords: ['guides', 'tutorials', 'blog', 'articles', 'documentation', 'learning', 'help', 'instructions'],
      action: () => {
        onSelectTab('guides');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'privacy-policy',
      category: 'System',
      title: 'Privacy Policy & Cookie Audit',
      description: 'Review how we operate with Google AdSense, DoubleClick cookies, CCPA, and GDPR compliance parameters',
      icon: ShieldCheck,
      keywords: ['privacy', 'policy', 'cookies', 'gdpr', 'ccpa', 'security', 'adsense', 'doubleclick', 'dart', 'compliance'],
      action: () => {
        onSelectTab('privacy-policy');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'terms-of-service',
      category: 'System',
      title: 'Terms of Service & Usage Policies',
      description: 'Understand user acceptance terms, AS-IS release of liability, and system constraints',
      icon: FileText,
      keywords: ['terms', 'of', 'service', 'use', 'conditions', 'liability', 'disclaimer', 'rules'],
      action: () => {
        onSelectTab('terms-of-service');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'about-us',
      category: 'System',
      title: 'About Us & Contact Information',
      description: 'Review APEX UTILITY compliance missions and securely correspond via terminal forms',
      icon: Command,
      keywords: ['about', 'us', 'contact', 'email', 'apex', 'utility', 'support', 'compliance', 'help'],
      action: () => {
        onSelectTab('about-us');
        onClose();
      },
      shortcut: '↵'
    },
    {
      id: 'theme-crimson',
      category: 'Aesthetics',
      title: 'Switch to Obsidian Crimson Mode',
      description: 'Change global interactive palette accent colors to crimson obsidian',
      icon: Palette,
      keywords: ['theme', 'crimson', 'red', 'color', 'dark', 'obsidian', 'aesthetics'],
      action: () => {
        onThemeChange('crimson');
        onClose();
      },
    },
    {
      id: 'theme-cobalt',
      category: 'Aesthetics',
      title: 'Switch to Steel Cobalt Mode',
      description: 'Change global interactive palette accent colors to deep steel cobalt blue',
      icon: Palette,
      keywords: ['theme', 'cobalt', 'blue', 'color', 'dark', 'steel', 'aesthetics'],
      action: () => {
        onThemeChange('cobalt');
        onClose();
      },
    },
    {
      id: 'theme-auto',
      category: 'Aesthetics',
      title: 'Switch to Automatic System Theme',
      description: 'Automatically toggle crimson/cobalt based on system color-scheme preference',
      icon: Palette,
      keywords: ['theme', 'auto', 'automatic', 'system', 'preference', 'color', 'scheme', 'aesthetics'],
      action: () => {
        onThemeChange('auto');
        onClose();
      },
    },
    {
      id: 'clear-history',
      category: 'System',
      title: 'Clear Processing Ops History',
      description: 'Wipe all cached offline recent utility logs and downloaded sessions',
      icon: Command,
      keywords: ['clear', 'wipe', 'delete', 'recent', 'operations', 'history', 'reset'],
      action: () => {
        localStorage.removeItem('apex_recent_ops');
        window.dispatchEvent(new Event('storage'));
        onClose();
      },
    }
  ];

  // Filtering and prioritized sorting of match items to boost SEO / Organic index tools to top
  const filteredItems = commandItems.filter(item => {
    const term = query.toLowerCase().trim();
    if (!term) return true;
    
    return (
      item.title.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(term))
    );
  }).sort((a, b) => {
    const term = query.toLowerCase().trim();
    if (!term) return 0;
    
    // Prioritize and lift SEO / organic index tools to the absolute top so they pop first on the list
    const isA_SEO = a.id === 'seo-optimizer' || a.id === 'sitemap-seo' || a.id === 'sitemap-generator';
    const isB_SEO = b.id === 'seo-optimizer' || b.id === 'sitemap-seo' || b.id === 'sitemap-generator';
    
    if (isA_SEO && !isB_SEO) return -1;
    if (!isA_SEO && isB_SEO) return 1;
    
    // Secondary prioritizing: title exact match / contains query comes before description matches
    const aTitleMatch = a.title.toLowerCase().includes(term);
    const bTitleMatch = b.title.toLowerCase().includes(term);
    if (aTitleMatch && !bTitleMatch) return -1;
    if (!aTitleMatch && bTitleMatch) return 1;
    
    return 0;
  });

  // Re-focus overlay input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Navigate selection wrap index
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems, selectedIndex]);

  // Key listening binds inside the open command search console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  // Handle clicking outside the layout sheet to shutdown
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-[#000000]/80 backdrop-blur-md z-50 flex items-start justify-center pt-[15vh] px-4"
        >
          <motion.div
            ref={containerRef}
            initial={{ scale: 0.97, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="w-full max-w-xl bg-[#09090d]/95 border border-brand-border/40 rounded-xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(var(--theme-glow-rgb),0.08)] flex flex-col"
          >
            {/* Input Header Area */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-brand-border/20 bg-zinc-950/40">
              <Search className="w-5 h-5 text-brand" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search tools, commands, or change theme presets..."
                className="w-full bg-transparent text-white text-sm outline-none placeholder-zinc-500 font-sans border-none focus:ring-0 focus:outline-none"
              />
              <div className="flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-[10px] font-mono text-zinc-500">
                <span>ESC</span>
              </div>
            </div>

            {/* Match Listings Wrapper */}
            <div className="max-h-[350px] overflow-y-auto p-2 space-y-1">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs font-mono">
                  No matching APEX operations or utilities found for "{query}"
                </div>
              ) : (
                filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`w-full text-left p-3.5 rounded-lg flex items-center gap-3.5 transition-all text-xs outline-none cursor-pointer border ${
                        isSelected
                          ? 'bg-brand/10 border-brand/40 text-white'
                          : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-950/60 hover:text-white'
                      }`}
                    >
                      <div className={`p-2 rounded-md ${
                        isSelected ? 'bg-brand/10 text-brand' : 'bg-zinc-900 text-zinc-500'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`font-heading font-bold truncate ${
                              isSelected ? 'text-brand' : 'text-zinc-300'
                            }`}>
                              {item.title}
                            </span>
                            {(item.id === 'seo-optimizer' || item.id === 'sitemap-seo' || item.id === 'sitemap-generator') && (
                              <span className="inline-flex items-center gap-0.5 pointer-events-none rounded px-1.5 py-0.5 text-[8px] font-bold font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 shrink-0">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping mr-0.5" />
                                <span>SEO PRIORITY</span>
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600 px-1.5 py-0.5 rounded bg-zinc-950/20 border border-zinc-900/60 shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-zinc-500 truncate mt-0.5 font-sans">
                          {item.description}
                        </p>
                      </div>

                      {/* Match Selection Indicator */}
                      {isSelected ? (
                        <div className="flex items-center gap-1 text-brand text-[10px] font-mono">
                          <CornerDownLeft className="w-3.5 h-3.5 text-brand" />
                        </div>
                      ) : (
                        item.shortcut && (
                          <span className="text-[10px] font-mono text-zinc-600">
                            {item.shortcut}
                          </span>
                        )
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Aesthetic Console Information Panel footer */}
            <div className="border-t border-brand-border/10 px-4 py-2 bg-[#050508]/60 flex justify-between items-center text-[10px] font-mono text-zinc-500">
              <div className="flex items-center gap-1">
                <span>Use arrows</span>
                <span className="text-zinc-400 font-bold">↑↓</span>
                <span>or type, then press</span>
                <span className="text-zinc-400 font-bold">Enter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Palette className="w-3 h-3 text-brand text-opacity-65" />
                <span>Theme: <strong className="text-brand text-opacity-80 capitalize">{theme}</strong></span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

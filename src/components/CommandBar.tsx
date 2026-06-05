import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Command, FileText, Image as ImageIcon, FileImage, Braces, Globe, LayoutGrid, Palette, ArrowRight, CornerDownLeft, Layers, Sparkles } from 'lucide-react';
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

  // Filtering the match items based on multiple triggers or keywords
  const filteredItems = commandItems.filter(item => {
    const term = query.toLowerCase().trim();
    if (!term) return true;
    
    return (
      item.title.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(term))
    );
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
                        <div className="flex items-center justify-between">
                          <span className={`font-heading font-bold ${
                            isSelected ? 'text-brand' : 'text-zinc-300'
                          }`}>
                            {item.title}
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600 px-1.5 py-0.5 rounded bg-zinc-950/20 border border-zinc-900/60">
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

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Eye, Settings, Smartphone, Monitor, Info, Sparkles, 
  Copy, Check, RefreshCw, AlertTriangle, CheckCircle2, Star, 
  HelpCircle, ChevronDown, ChevronUp, Link, Globe, Trash2
} from 'lucide-react';

interface RichSnippetOptions {
  showStars: boolean;
  ratingValue: number;
  reviewCount: number;
  showDate: boolean;
  dateValue: string;
  showSitelinks: boolean;
  sitelinks: Array<{ title: string; url: string }>;
  showFaq: boolean;
  faqs: Array<{ question: string; answer: string }>;
}

export default function SERPPreviewer() {
  const [title, setTitle] = useState('Apex Utility Labs – Free Webmaster & SEO Optimization Tools');
  const [description, setDescription] = useState('Optimize your workspace vectors, compile documents, audit complete URL redirect paths, and parse configuration patterns locally with zero latency in your browser.');
  const [url, setUrl] = useState('https://apex-utility-labs.com/seo-suite');
  const [keywords, setKeywords] = useState('seo tools');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Rich Snippets Configuration
  const [richSnippets, setRichSnippets] = useState<RichSnippetOptions>({
    showStars: true,
    ratingValue: 4.9,
    reviewCount: 148,
    showDate: true,
    dateValue: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    showSitelinks: true,
    sitelinks: [
      { title: 'Sitemap Generator', url: '/sitemap-generator' },
      { title: 'Redirect Auditor', url: '/redirect-auditor' },
    ],
    showFaq: false,
    faqs: [
      { question: 'Are these webmaster utilities entirely free?', answer: 'Yes, all utilities are processed purely in-browser and are 100% free with no limits.' },
      { question: 'Is my data secure?', answer: 'Absolutely. All processing and document rendering is executed on your local client with zero server lags.' }
    ]
  });

  // Expandable settings states
  const [faqExpanded, setFaqExpanded] = useState<Record<number, boolean>>({});

  // Helper to copy text
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Preset quick templates
  const presets = [
    {
      name: 'E-Commerce Product',
      title: 'Craftsman Leather Goods – Premium Hand-Stitched Wallets',
      desc: 'Discover our curated selection of fine leather goods. Hand-stitched with premium full-grain Italian leather. 10-year warranty & free global shipping today!',
      url: 'https://leathercrafts.co/products/full-grain-wallet',
      snippets: {
        ...richSnippets,
        showStars: true,
        ratingValue: 4.8,
        reviewCount: 342,
        showDate: false,
      }
    },
    {
      name: 'Tech Blog Article',
      title: 'How to Optimize React Rendering Performance in 2026',
      desc: 'Unlock optimal render metrics in your React SPAs. Learn about the latest dynamic memoization hooks, state partitioning hacks, and web vitals optimization steps.',
      url: 'https://codeminds.dev/react/rendering-performance-tips',
      snippets: {
        ...richSnippets,
        showStars: false,
        showDate: true,
        dateValue: 'Jun 15, 2026',
      }
    },
    {
      name: 'Local Services',
      title: 'Elite HVAC Service Specialists – Instant 24/7 Home Repairs',
      desc: 'Local heating, ventilation, and air conditioning pros are on-call. Certified specialists offering transparent upfront pricing, direct warranties, and quick emergency callouts.',
      url: 'https://hvac-masters.net/services/emergency-repairs',
      snippets: {
        ...richSnippets,
        showStars: true,
        ratingValue: 4.9,
        reviewCount: 89,
        showDate: false,
      }
    }
  ];

  const applyPreset = (preset: typeof presets[number]) => {
    setTitle(preset.title);
    setDescription(preset.desc);
    setUrl(preset.url);
    setRichSnippets(preset.snippets);
  };

  // Pixel width math approximation (Google title caps at ~600px desktop, ~160 chars description ~960px)
  // Non-monospace average character widths
  const estimatePixelWidth = (text: string, isTitle: boolean) => {
    let width = 0;
    const factor = isTitle ? 10.2 : 7.8; // Appx pixel widths
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (/[A-Z]/.test(char)) width += factor * 1.25;
      else if (/[mw]/.test(char)) width += factor * 1.4;
      else if (/[ijl]/.test(char)) width += factor * 0.45;
      else if (/\s/.test(char)) width += factor * 0.5;
      else width += factor;
    }
    return Math.round(width);
  };

  const titlePixels = useMemo(() => estimatePixelWidth(title, true), [title]);
  const descPixels = useMemo(() => estimatePixelWidth(description, false), [description]);

  const TITLE_PIXEL_LIMIT = device === 'desktop' ? 600 : 540;
  const DESC_PIXEL_LIMIT = device === 'desktop' ? 960 : 720;

  const isTitleOver = titlePixels > TITLE_PIXEL_LIMIT || title.length > 60;
  const isDescOver = descPixels > DESC_PIXEL_LIMIT || description.length > 160;

  // Render text with highlight keywords
  const renderHighlightedText = (text: string, keywordStr: string, truncateLimit: number) => {
    if (!text) return '';
    
    // Trim to simulated display limit with ellipsis
    let renderedText = text;
    if (text.length > truncateLimit) {
      renderedText = text.substring(0, truncateLimit - 3) + '...';
    }

    if (!keywordStr.trim()) return <span>{renderedText}</span>;

    const queryParts = keywordStr.trim().split(/\s+/).filter(Boolean);
    if (queryParts.length === 0) return <span>{renderedText}</span>;

    // Build regex to match any of the keywords
    const esc = (s: string) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${queryParts.map(esc).join('|')})`, 'gi');

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // Re-run regex over the rendered (potentially truncated) text
    while ((match = regex.exec(renderedText)) !== null) {
      const matchIndex = match.index;
      const matchText = match[0];

      if (matchIndex > lastIndex) {
        elements.push(<span key={lastIndex}>{renderedText.substring(lastIndex, matchIndex)}</span>);
      }
      elements.push(<strong key={matchIndex} className="text-[#3c4043] font-bold dark:text-zinc-200">{matchText}</strong>);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < renderedText.length) {
      elements.push(<span key={lastIndex}>{renderedText.substring(lastIndex)}</span>);
    }

    return <>{elements}</>;
  };

  // Get Breadcrumbs from URL
  const getBreadcrumbs = (urlStr: string) => {
    try {
      if (!urlStr.startsWith('http')) {
        urlStr = 'https://' + urlStr;
      }
      const parsed = new URL(urlStr);
      const paths = parsed.pathname.split('/').filter(Boolean);
      return {
        domain: parsed.hostname,
        protocol: parsed.protocol,
        paths: paths
      };
    } catch {
      return {
        domain: urlStr || 'example.com',
        protocol: 'https:',
        paths: []
      };
    }
  };

  const breadcrumbs = useMemo(() => getBreadcrumbs(url), [url]);

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-500 uppercase">SEO Suite</span>
        <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans">Google SERP Snippet Previewer</h2>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Optimize your metadata for maximum click-through rates. Live pixel-perfect simulation of Google Search desktop and mobile SERP listings with real-time character truncations.
        </p>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Editor Panel (Left 5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-brand" />
                Metadata Editor
              </span>
              <button 
                onClick={() => {
                  setTitle('');
                  setDescription('');
                  setUrl('');
                  setKeywords('');
                }}
                className="text-zinc-500 hover:text-red-400 transition-colors text-xs flex items-center gap-1"
                title="Clear inputs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            {/* Quick Preset Choice */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Load Preset Case:</span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map(p => (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    className="text-[11px] font-mono bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 border border-zinc-800 px-2 py-1 rounded-lg transition-all"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-zinc-400">Meta Title</label>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                  isTitleOver ? 'text-red-400 bg-red-950/20' : 'text-emerald-400 bg-emerald-950/20'
                }`}>
                  {title.length} chars | {titlePixels}px / {TITLE_PIXEL_LIMIT}px
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter page SEO title..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all font-sans"
              />
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${isTitleOver ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (titlePixels / TITLE_PIXEL_LIMIT) * 100)}%` }}
                />
              </div>
            </div>

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-400">Page URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourwebsite.com/page-slug"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all font-mono text-xs"
              />
            </div>

            {/* Description Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-zinc-400">Meta Description</label>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                  isDescOver ? 'text-red-400 bg-red-950/20' : 'text-emerald-400 bg-emerald-950/20'
                }`}>
                  {description.length} chars | {descPixels}px / {DESC_PIXEL_LIMIT}px
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Enter page SEO meta description..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all font-sans resize-y leading-relaxed text-xs"
              />
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${isDescOver ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (descPixels / DESC_PIXEL_LIMIT) * 100)}%` }}
                />
              </div>
            </div>

            {/* Keyword Highlighter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-zinc-500" />
                Highlight Keywords (Google Emulation)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. seo tools document optimization"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all font-sans text-xs"
              />
            </div>
          </div>

          {/* Rich Snippets Control Panel */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-3">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              Interactive Rich Snippets
            </span>

            {/* Star Ratings toggle */}
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={richSnippets.showStars}
                  onChange={(e) => setRichSnippets({ ...richSnippets, showStars: e.target.checked })}
                  className="rounded border-zinc-800 bg-zinc-900 text-brand focus:ring-brand"
                />
                Show Reviews / Rating Schema
              </label>

              {richSnippets.showStars && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Rating Score</span>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={richSnippets.ratingValue}
                      onChange={(e) => setRichSnippets({ ...richSnippets, ratingValue: parseFloat(e.target.value) || 5.0 })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Vote Count</span>
                    <input
                      type="number"
                      value={richSnippets.reviewCount}
                      onChange={(e) => setRichSnippets({ ...richSnippets, reviewCount: parseInt(e.target.value) || 0 })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Date toggle */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={richSnippets.showDate}
                  onChange={(e) => setRichSnippets({ ...richSnippets, showDate: e.target.checked })}
                  className="rounded border-zinc-800 bg-zinc-900 text-brand focus:ring-brand"
                />
                Include Article Published Date
              </label>

              {richSnippets.showDate && (
                <div className="pl-6 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Publication Date Label</span>
                  <input
                    type="text"
                    value={richSnippets.dateValue}
                    onChange={(e) => setRichSnippets({ ...richSnippets, dateValue: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              )}
            </div>

            {/* Dynamic Sitelinks */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={richSnippets.showSitelinks}
                  onChange={(e) => setRichSnippets({ ...richSnippets, showSitelinks: e.target.checked })}
                  className="rounded border-zinc-800 bg-zinc-900 text-brand focus:ring-brand"
                />
                Simulate Organic Sitelinks
              </label>

              {richSnippets.showSitelinks && (
                <div className="pl-6 space-y-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Custom Secondary Links</span>
                  {richSnippets.sitelinks.map((link, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={link.title}
                        placeholder="Link Label"
                        onChange={(e) => {
                          const updated = [...richSnippets.sitelinks];
                          updated[idx].title = e.target.value;
                          setRichSnippets({ ...richSnippets, sitelinks: updated });
                        }}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={link.url}
                        placeholder="Link Path"
                        onChange={(e) => {
                          const updated = [...richSnippets.sitelinks];
                          updated[idx].url = e.target.value;
                          setRichSnippets({ ...richSnippets, sitelinks: updated });
                        }}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FAQ Rich snippet */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={richSnippets.showFaq}
                  onChange={(e) => setRichSnippets({ ...richSnippets, showFaq: e.target.checked })}
                  className="rounded border-zinc-800 bg-zinc-900 text-brand focus:ring-brand"
                />
                Show FAQ Schema Accordion
              </label>

              {richSnippets.showFaq && (
                <div className="pl-6 space-y-3">
                  {richSnippets.faqs.map((faq, idx) => (
                    <div key={idx} className="space-y-1.5 p-2.5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
                      <span className="text-[9px] font-bold font-mono text-emerald-400 block uppercase">Question #{idx + 1}</span>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...richSnippets.faqs];
                          updated[idx].question = e.target.value;
                          setRichSnippets({ ...richSnippets, faqs: updated });
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-xs text-white"
                      />
                      <textarea
                        value={faq.answer}
                        rows={2}
                        onChange={(e) => {
                          const updated = [...richSnippets.faqs];
                          updated[idx].answer = e.target.value;
                          setRichSnippets({ ...richSnippets, faqs: updated });
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-xs text-white text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Simulator View (Right 7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Controls bar (Desktop/Mobile selection, copy buttons) */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
            <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl">
              <button
                onClick={() => setDevice('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  device === 'desktop' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop View
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  device === 'mobile' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobile View
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(title, 'title')}
                className="text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-zinc-800"
              >
                {copiedText === 'title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy Title
              </button>
              <button
                onClick={() => handleCopy(description, 'description')}
                className="text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-zinc-800"
              >
                {copiedText === 'description' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy Description
              </button>
            </div>
          </div>

          {/* The Google Mock Container */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl text-[#202124] font-sans antialiased">
            {/* Top Bar simulating a real browser or Google search header */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-500 font-mono flex items-center gap-1.5 truncate">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Google Search:</span>
                <span className="text-gray-900 font-bold font-sans truncate">{keywords || title || 'your search query'}</span>
              </div>
            </div>

            {/* Result Area */}
            <div className="p-6 md:p-8 space-y-6">
              
              {/* Google Result block */}
              {device === 'desktop' ? (
                /* DESKTOP SERP INTERFACE */
                <div className="max-w-[600px] space-y-1 text-left">
                  {/* Breadcrumbs Row */}
                  <div className="flex items-center gap-1 text-[12px] text-[#202124] leading-relaxed truncate">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 text-gray-500 mr-1 shrink-0">
                      <Globe className="w-2.5 h-2.5" />
                    </span>
                    <span className="font-sans truncate">{breadcrumbs.domain}</span>
                    {breadcrumbs.paths.length > 0 && (
                      <span className="text-gray-400 flex items-center gap-1 text-[11px] font-mono">
                        <span>›</span>
                        <span className="truncate">{breadcrumbs.paths.join(' › ')}</span>
                      </span>
                    )}
                  </div>

                  {/* Title Row (Google Desktop max width roughly 600px, usually text truncates at ~60-65 chars depending on character width) */}
                  <h3 className="text-xl font-sans font-medium text-[#1a0dab] hover:underline cursor-pointer leading-[1.3] truncate break-words">
                    {title || 'Please enter a Meta Title'}
                  </h3>

                  {/* Rich Snippet: Star Rating Row */}
                  {richSnippets.showStars && (
                    <div className="flex items-center gap-1 text-sm text-[#4d5156] py-0.5">
                      <div className="flex items-center text-[#f1c40f]">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`w-3.5 h-3.5 ${
                              s <= Math.floor(richSnippets.ratingValue) 
                                ? 'fill-[#f1c40f]' 
                                : s - 0.5 <= richSnippets.ratingValue 
                                  ? 'fill-[#f1c40f]/60' 
                                  : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-xs text-[#70757a] font-mono">
                        Rating: {richSnippets.ratingValue.toFixed(1)} · ‎{richSnippets.reviewCount} votes
                      </span>
                    </div>
                  )}

                  {/* Description & Snippet row */}
                  <p className="text-sm text-[#4d5156] leading-[1.58] break-words">
                    {richSnippets.showDate && (
                      <span className="text-gray-500 text-[13px] mr-1 font-sans">{richSnippets.dateValue} —</span>
                    )}
                    {renderHighlightedText(description || 'Please enter a Meta Description for your website to outline its core purposes in Google Search outcomes.', keywords, 160)}
                  </p>

                  {/* Sitelinks simulation */}
                  {richSnippets.showSitelinks && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pt-3.5 pl-3 border-l-2 border-gray-100">
                      {richSnippets.sitelinks.map((sitelink, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <span className="text-[#1a0dab] text-[13px] hover:underline cursor-pointer font-sans block truncate">
                            {sitelink.title || `Sitelink #${idx + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Accordion FAQ Schema simulation */}
                  {richSnippets.showFaq && (
                    <div className="pt-3.5 space-y-2 border-t border-gray-100 mt-3 max-w-[580px]">
                      {richSnippets.faqs.map((faq, idx) => {
                        const isOpen = !!faqExpanded[idx];
                        return (
                          <div key={idx} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                            <button
                              onClick={() => setFaqExpanded({ ...faqExpanded, [idx]: !isOpen })}
                              className="w-full flex items-center justify-between text-left text-sm text-[#1a0dab] hover:underline hover:text-[#1a0dab] transition-all font-sans font-medium"
                            >
                              <span>{faq.question || `FAQ Question #${idx + 1}`}</span>
                              {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </button>
                            {isOpen && (
                              <p className="mt-1.5 text-xs text-[#4d5156] leading-relaxed pl-1 transition-all">
                                {faq.answer || `Placeholder Answer for Question #${idx + 1}`}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* MOBILE SERP INTERFACE */
                <div className="max-w-[420px] mx-auto border border-gray-200 rounded-xl p-4 bg-white shadow-inner space-y-2 text-left">
                  {/* Site identity header */}
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Globe className="w-3.5 h-3.5 text-gray-500" />
                    </span>
                    <div className="text-xs leading-tight">
                      <p className="font-semibold text-[#202124]">{breadcrumbs.domain}</p>
                      <p className="text-[#70757a] font-mono text-[10px] truncate">{url || 'example.com'}</p>
                    </div>
                  </div>

                  {/* Mobile Title row */}
                  <h3 className="text-[17px] font-sans font-medium text-[#1a0dab] active:text-[#1a0dab]/80 leading-snug cursor-pointer block line-clamp-2">
                    {title || 'Please enter a Meta Title'}
                  </h3>

                  {/* Rich Snippet: Rating row */}
                  {richSnippets.showStars && (
                    <div className="flex items-center gap-1 text-xs text-[#4d5156]">
                      <div className="flex items-center text-[#f1c40f]">
                        <Star className="w-3 h-3 fill-[#f1c40f]" />
                      </div>
                      <span>
                        {richSnippets.ratingValue.toFixed(1)} ★ ({richSnippets.reviewCount} reviews)
                      </span>
                    </div>
                  )}

                  {/* Mobile Description & Content */}
                  <p className="text-[13px] text-[#4d5156] leading-[1.5] line-clamp-3">
                    {richSnippets.showDate && (
                      <span className="text-gray-500 text-[12px] mr-1 font-sans">{richSnippets.dateValue} —</span>
                    )}
                    {renderHighlightedText(description || 'Please enter a Meta Description for your website to outline its core purposes in Google Search outcomes.', keywords, 120)}
                  </p>

                  {/* FAQ mobile row list */}
                  {richSnippets.showFaq && (
                    <div className="pt-2 mt-2 border-t border-gray-100 space-y-1.5">
                      {richSnippets.faqs.slice(0, 1).map((faq, idx) => (
                        <div key={idx} className="text-xs text-gray-500">
                          <p className="font-semibold text-gray-800">{faq.question}</p>
                          <p className="mt-0.5 leading-relaxed">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Expert SEO Recommendations Panel */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              SEO Quality Audit Checklist
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title feedback */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                isTitleOver 
                  ? 'bg-red-950/10 border-red-500/20 text-red-300' 
                  : title.length < 30 
                    ? 'bg-amber-950/10 border-amber-500/20 text-amber-300' 
                    : 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300'
              }`}>
                <div className="flex items-center gap-2">
                  {isTitleOver ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : title.length < 30 ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <h4 className="text-xs font-bold uppercase tracking-wider">Title Length</h4>
                </div>
                <p className="text-[11px] leading-relaxed font-mono">
                  {isTitleOver 
                    ? `Your title occupies ${titlePixels}px (${title.length} chars). It exceeds Google's maximum display threshold of 600 pixels (~60 chars). Search results will append a trailing ellipsis (...), which might cut off vital marketing messages.`
                    : title.length < 30 
                      ? 'Your title is shorter than 30 characters. Expand it with relevant keyword combinations and search intent phrases to maximize visibility and index reach.'
                      : 'Perfect! Your title is well-proportioned, fits Google\'s size limits, and ensures pristine display across all screen categories.'
                  }
                </p>
              </div>

              {/* Description feedback */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                isDescOver 
                  ? 'bg-red-950/10 border-red-500/20 text-red-300' 
                  : description.length < 70 
                    ? 'bg-amber-950/10 border-amber-500/20 text-amber-300' 
                    : 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300'
              }`}>
                <div className="flex items-center gap-2">
                  {isDescOver ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : description.length < 70 ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <h4 className="text-xs font-bold uppercase tracking-wider">Description Length</h4>
                </div>
                <p className="text-[11px] leading-relaxed font-mono">
                  {isDescOver 
                    ? `Your meta description is ${description.length} chars (${descPixels}px). It exceeds Google's typical desktop limit of 160 characters (or mobile 120 characters). Google will truncate your text.`
                    : description.length < 70 
                      ? 'Your description is very short. Expand it up to 120-155 characters to fully outline features, increase query matches, and maximize organic click-through rates.'
                      : 'Excellent! Your meta description uses space effectively, keeping important summaries visible to search clients.'
                  }
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

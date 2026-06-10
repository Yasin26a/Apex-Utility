import React, { useState } from 'react';
import { 
  BookOpen, Search, Clock, ArrowRight, Tag, HelpCircle, 
  Terminal, Sparkles, User, Calendar, ExternalLink, ThumbsUp, 
  ChevronRight, ArrowLeft, Bookmark, Heart, Share2, MessageSquare 
} from 'lucide-react';
import { ActiveTab } from '../types';

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  topic: string;
  icon: typeof BookOpen;
  readTime: string;
  date: string;
  author: string;
  role: string;
  relatedTool: ActiveTab;
  tags: string[];
  content: React.ReactNode;
}

interface GuidesProps {
  onTabChange: (tab: ActiveTab) => void;
}

export default function Guides({ onTabChange }: GuidesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({
    'wasm-pdf': 28,
    'webp-demystified': 19,
    'crypto-passwords': 35,
    'seo-sitemaps': 42
  });
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});
  const [suggestionName, setSuggestionName] = useState('');
  const [suggestionTopic, setSuggestionTopic] = useState('');
  const [submittedSuggestion, setSubmittedSuggestion] = useState(false);

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userLiked[id]) {
      setLikes(prev => ({ ...prev, [id]: prev[id] - 1 }));
      setUserLiked(prev => ({ ...prev, [id]: false }));
    } else {
      setLikes(prev => ({ ...prev, [id]: prev[id] + 1 }));
      setUserLiked(prev => ({ ...prev, [id]: true }));
    }
  };

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestionName && suggestionTopic) {
      setSubmittedSuggestion(true);
      setTimeout(() => {
        setSuggestionName('');
        setSuggestionTopic('');
        setSubmittedSuggestion(false);
      }, 2500);
    }
  };

  const articles: Article[] = [
    {
      id: 'wasm-pdf',
      title: 'Under the Hood of Client-Side WASM PDF Compression',
      excerpt: 'Learn how WebAssembly compilers and bicubic canvas scaling shrink bloated PDF documents from 50MB down to the 2.0MB ATS threshold without flattening vector text layers.',
      topic: 'Document Engineering',
      icon: Terminal,
      readTime: '6 min read',
      date: 'June 10, 2026',
      author: 'Yasin Alam',
      role: 'Lead Architect',
      relatedTool: 'compress-pdf',
      tags: ['WASM', 'PDF', 'WebAssembly', 'ATS Optimization'],
      content: (
        <div className="space-y-6 font-sans text-sm text-zinc-300 leading-relaxed text-justify">
          <p>
            For engineering candidates and creators alike, uploading portfolios or detailed PDF curriculum vitae to enterprise Applicant Tracking Systems (ATS) can be incredibly challenging. The master database files created by robust software systems like Adobe InDesign or Figma often exceed standard 2MB uploading limits. This is because these files embed massive structural components: high-density pixel layers, multi-megabyte outline tables, and complex vector nodes.
          </p>
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 font-mono text-[11px] text-zinc-400 space-y-2">
            <div className="text-zinc-200 uppercase tracking-widest font-extrabold text-[9px] flex items-center gap-1.5 mb-1 text-brand">
              <Terminal className="w-3 h-3" />
              <span>Diagnostic Memory Mapping</span>
            </div>
            <div>[INIT] Client PDF uploaded to browser container heap</div>
            <div>[INFO] Scanning cross-reference dictionary blocks (xref table)</div>
            <div>[INFO] Found 14 high-density graphic assets (43.2 MB total weight)</div>
            <div>[OPTIMIZE] Triggering bicubic downsampling engine: Target DPI = 150</div>
            <div>[WRITE] Output PDF buffer generated in-memory. Result: 1.84 MB (95% shrank)</div>
          </div>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            Why Standard Online Flattening Ruin Resumes
          </h3>
          <p>
            Traditional PDF downscalers solve bloating by simply converting every page of your document into a giant flat PNG image. While this forces the size below the limit, it introduces a severe structural flaw: <strong className="text-white underline">it completely strips vector text hierarchies.</strong> Crawler bots deployed by ATS networks cannot run OCR on low-quality flat images efficiently. This means your achievements, layout elements, and keyword strings will be invisible to recruiters, resulting in automated rejections.
          </p>
          <p>
            To address this, our localized tool targets PDF dictionaries. It parses document components, finds redundant font files, compresses internal byte offsets, and downsamples heavy assets using a 2D canvas interpolation pipeline. This maintains perfect text outline paths, keeping your files searchable and compliant.
          </p>
          <blockquote className="border-l-2 border-brand/50 pl-4 py-1 italic text-xs text-zinc-400">
            "By utilizing client-side WebAssembly, developer workforces can optimize secure corporate reports or job resumes inside an isolated browser environment, with zero risk of database leakage."
          </blockquote>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            Step-by-Step Optimization Best Practices
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-white">Verify Native OCR:</strong> Ensure the source PDF contains real selectable text. If you can double-click and copy words inside your browser, the parser can index it.
            </li>
            <li>
              <strong className="text-white">Isolate Target DPI:</strong> For standard job submissions, 150 DPI is the sweet spot. It delivers extreme size reduction while keeping screen fonts crisp.
            </li>
            <li>
              <strong className="text-white">Avoid Password Walls:</strong> Decrypt locked files before feeding them into client-side compilers, as locked dictionaries prevent standard index parsing.
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'webp-demystified',
      title: 'WebP Format Demystified: Transparent PNG vs Progressive JPG',
      excerpt: 'Explore the internal layout differences, compression speeds, and transparency configurations between modern WebP codecs and legacy layout files.',
      topic: 'Graphics Optimization',
      icon: Sparkles,
      readTime: '5 min read',
      date: 'June 08, 2026',
      author: 'Yasin Alam',
      role: 'Frontend Architect',
      relatedTool: 'webp-converter',
      tags: ['WebP', 'PNG', 'Graphics', 'Performance'],
      content: (
        <div className="space-y-6 font-sans text-sm text-zinc-300 leading-relaxed text-justify">
          <p>
            WebP, introduced by Google, has quickly become the web standard for high-performance images. It provides lossless and lossy compression parameters that outperform the oldest formats: PNG and JPG. WebP images are typically 26% smaller than PNGs and up to 34% smaller than equivalent JPGs, all while preserving alpha transparency channels.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-center">
              <span className="block text-[10px] font-mono text-zinc-500 uppercase">Legacy JPG</span>
              <span className="font-heading text-base font-black text-red-400">Heavy Weight</span>
              <span className="block text-[9px] text-zinc-500 mt-1">No Transparency</span>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-center">
              <span className="block text-[10px] font-mono text-zinc-500 uppercase">Transparent PNG</span>
              <span className="font-heading text-base font-black text-orange-400">Bloated Bytes</span>
              <span className="block text-[9px] text-zinc-500 mt-1">High fidelity</span>
            </div>
            <div className="p-3 bg-zinc-950 border border-brand/20 rounded-lg text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-brand/5 pointer-events-none" />
              <span className="block text-[10px] font-mono text-zinc-400 uppercase">Modern WebP</span>
              <span className="font-heading text-base font-black text-brand">Ultra Compact</span>
              <span className="block text-[9px] text-brand/80 mt-1">High fidelity & Alpha</span>
            </div>
          </div>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            How the Browser Rasterizes WebP Offline
          </h3>
          <p>
            When utilizing our WebP converter, your graphics are never processed by external server-side systems. The app mounts a virtual <span className="font-mono text-zinc-200">OffscreenCanvas</span> worker thread, which receives your source image bytes, decodes the pixel structures, and projects the variables onto a 2D matrix canvas. From there, we export the files natively using highly specialized browser rendering algorithms.
          </p>
          <p>
            This decentralized setup ensures you can process client brand elements, mockups, or sensitive receipts without worrying about network snooping or server-side breaches.
          </p>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            Key Formatting Differences to Remember
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-white">Lossy vs. Lossless:</strong> Use lossy mode for photography to maximize space savings. For UI wireframes, logos, or typography illustrations, choose lossless mode to keep clean gradients and pixel-perfect transparency.
            </li>
            <li>
              <strong className="text-white">Decoding Overhead:</strong> While WebP provides much smaller file sizes, decoding it requires slightly more CPU power than traditional JPGs. However, the massive page-load speedups far outweigh this minor overhead.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'crypto-passwords',
      title: 'Mastering Front-End Cryptography: Secure Key Conversions & Entropy',
      excerpt: 'Learn the math behind the Web Crypto API, password crack times, and how to verify file integrity locally without exposing private databases.',
      topic: 'Frontend Security',
      icon: Bookmark,
      readTime: '7 min read',
      date: 'June 05, 2026',
      author: 'Yasin Alam',
      role: 'Security Specialist',
      relatedTool: 'password-generator',
      tags: ['Security', 'Cryptography', 'Web Crypto', 'Entropy'],
      content: (
        <div className="space-y-6 font-sans text-sm text-zinc-300 leading-relaxed text-justify">
          <p>
            Many developers make the mistake of using basic, predictable algorithms to generate passwords or hash digital files. In standard programming, function calls like <span className="font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900 text-brand">Math.random()</span> are pseudorandom. This means their outputs can be predicted by modern analysis tools, leaving your user accounts, cloud servers, and directories vulnerable to exploit.
          </p>
          <blockquote className="border-l-2 border-brand/50 pl-4 py-1 italic text-xs text-zinc-400">
            "Our security tool utilizes the cryptographically secure Web Crypto interface, which taps directly into operating system entropy sources. This guarantees that your passwords are brute-force resistant."
          </blockquote>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            Understanding Password Entropy Formulas
          </h3>
          <p>
            Entropy is measured in bits. It quantifies how difficult a password is to guess or brute-force by evaluating its total possibilities mathematically. The calculation follows this standard formula:
          </p>
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 font-mono text-[12px] text-zinc-300 text-center">
            E = L &times; log₂ ( P )
          </div>
          <p className="text-xs text-zinc-400 leading-normal">
            Where <span className="font-mono text-white">L</span> is the total character length representation, and <span className="font-mono text-white">P</span> is the maximum possible pool of characters selected (e.g., 26 for lowercase, 52 for mixed case, 62 with numbers, and 94 with symbols).
          </p>
          <p>
            To establish secure boundaries:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-white">Below 50 Bits:</strong> Highly insecure. These standard configurations can be cracked in minutes by basic GPU systems.
            </li>
            <li>
              <strong className="text-white">60 to 75 Bits:</strong> Medium protection. Safe for average daily forums but insufficient for advanced bank databases.
            </li>
            <li>
              <strong className="text-white">Above 80 Bits:</strong> Cryptographically shielded. These configurations require trillions of years to guess with current supercomputers.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'seo-sitemaps',
      title: 'The Complete SEO Sitemap Blueprint & Structural Indexing',
      excerpt: 'A comprehensive checklist on how crawler bots index dynamic subpages, schema prioritization, and how our offline XML tool boosts organic rankings.',
      topic: 'SEO & Growth',
      icon: BookOpen,
      readTime: '4 min read',
      date: 'May 28, 2026',
      author: 'Yasin Alam',
      role: 'Growth Strategist',
      relatedTool: 'sitemap-seo',
      tags: ['SEO', 'XML Sitemaps', 'Indexing', 'Search Console'],
      content: (
        <div className="space-y-6 font-sans text-sm text-zinc-300 leading-relaxed text-justify">
          <p>
            A high-fidelity XML sitemap serves as a structured map for Google, Bing, and other search engines to index your website efficiently. Rather than leaving index structures to chance, publishing an explicit XML blueprint guarantees that new routes, tool modules, and blog posts are indexed and ranked.
          </p>
          <p>
            Our generator parses dynamic paths, normalizes trailing slashes, and formats files to comply with official Schema.org standards. It outputs clean grids of XML coordinates that search engine crawlers can scan in milliseconds.
          </p>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            Best Practices for XML Sitemap Submissions
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-white">Limit Sitemap Bloat:</strong> Google allows up to 50,000 URLs or a maximum 50MB uncompressed file weight per sitemap. If your application exceeds this, divide paths across index blocks.
            </li>
            <li>
              <strong className="text-white">Target High Priority:</strong> Assign high priority values (e.g., <span className="font-mono">1.0</span> or <span className="font-mono">0.9</span>) only to core landing hubs and utility workspaces. Overusing high priorities across all matching URLs confuses crawler weighting systems.
            </li>
            <li>
              <strong className="text-white">Keep Changefreqs Accurate:</strong> Set blog pages to update "weekly" and tools to "monthly" to match actual content updates, preventing bots from wasting scan cycles.
            </li>
          </ul>
        </div>
      )
    }
  ];

  const filteredArticles = articles.filter(art => {
    const matchesSearch = 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedTag) {
      return matchesSearch && art.tags.includes(selectedTag);
    }
    return matchesSearch;
  });

  const allTags = Array.from(new Set(articles.flatMap(art => art.tags)));

  const currentArticle = articles.find(art => art.id === selectedArticleId);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Panel */}
      <div className="beveled-panel bg-[#09090d]/95 p-6 md:p-10 border-brand-border/40 shadow-2xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none -mr-40 -mt-40" style={{ backgroundColor: 'var(--theme-glow)', opacity: 0.15 }} />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/35 text-brand px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-extrabold shadow-sm">
              <BookOpen className="w-3.5 h-3.5 animate-pulse" />
              <span>Developer Knowledge Station</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-black tracking-wider uppercase bg-clip-text text-white leading-tight">
              APEX GUIDES & BLOGS
            </h1>
            <p className="font-sans text-sm text-zinc-300 leading-relaxed max-w-xl">
              Equip your development workflow with human-written, highly detailed technical guides. Demystifying format transformations, frontend cryptography, WebAssembly pipelines, and SEO crawlers.
            </p>
          </div>

          <div className="flex gap-2.5 shrink-0 max-sm:grid max-sm:grid-cols-2">
            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl text-center min-w-[110px]">
              <div className="font-sans text-[10px] text-zinc-500 font-bold uppercase tracking-wider">INDEX RATE</div>
              <div className="font-mono text-sm text-emerald-400 font-extrabold">100% LIVE</div>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl text-center min-w-[110px]">
              <div className="font-sans text-[10px] text-zinc-500 font-bold uppercase tracking-wider">GUIDES COUNT</div>
              <div className="font-mono text-sm text-cyan-400 font-extrabold">4 MODULES</div>
            </div>
          </div>
        </div>
      </div>

      {currentArticle ? (
        /* Full Article View */
        <div className="space-y-6">
          {/* Back button and Meta info */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => setSelectedArticleId(null)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-900 bg-zinc-950/60 text-zinc-400 hover:text-brand hover:border-brand/40 text-xs font-heading font-extrabold tracking-wider uppercase transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Knowledge Index</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 bg-zinc-950/40 px-3/1 border border-zinc-950 rounded-full py-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Published: {currentArticle.date}</span>
            </div>
          </div>

          {/* Article Card */}
          <div className="beveled-panel bg-[#09090d]/95 p-6 md:p-10 border-brand-border/40 shadow-xl text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none -mr-16 -mt-16 bg-brand/5" />
            
            <div className="space-y-6 relative z-10">
              {/* Author and Topic */}
              <div className="flex items-center gap-3 border-b border-zinc-900/60 pb-4">
                <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-heading font-black text-sm uppercase shrink-0">
                  {currentArticle.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-xs font-black text-white uppercase tracking-wider">
                      {currentArticle.author}
                    </span>
                    <span className="text-[10px] bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded text-brand font-mono font-bold uppercase shrink-0">
                      {currentArticle.topic}
                    </span>
                  </div>
                  <div className="font-sans text-[11px] text-zinc-500">{currentArticle.role} &bull; {currentArticle.readTime}</div>
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-4">
                <h2 className="font-heading text-xl sm:text-2xl font-black text-white tracking-wide uppercase leading-tight">
                  {currentArticle.title}
                </h2>
                
                {/* Human Written Core Paragraph Checkpoint */}
                <div className="pt-2 border-t border-zinc-900/40">
                  {currentArticle.content}
                </div>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-2 pt-6 border-t border-[#1e1e2d] mt-8">
                {currentArticle.tags.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-900 text-zinc-400 font-mono text-[10px] uppercase">
                    #{t}
                  </span>
                ))}
              </div>

              {/* Action Board (Related Tool link & Likes count) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl mt-6">
                <div className="flex items-center gap-3.5 max-sm:text-center max-sm:flex-col">
                  <div className="p-2.5 rounded-lg bg-brand/10 text-brand shrink-0">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div className="text-left max-sm:text-center">
                    <h4 className="font-heading text-xs font-black text-white uppercase tracking-wider">Deploy This Feature Locally</h4>
                    <p className="font-sans text-[11px] text-zinc-500 mt-0.5">This article operates concurrently with our secure workspace modules.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 shrink-0 max-sm:w-full max-sm:grid max-sm:grid-cols-2">
                  <button 
                    onClick={() => onTabChange(currentArticle.relatedTool)}
                    className="px-4 py-2 bg-brand text-zinc-950 hover:bg-brand-hover hover:text-white transition-all font-heading text-[11px] font-black tracking-wider uppercase rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>LAUNCH WORKSPACE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleLike(currentArticle.id, e)}
                    className={`px-4 py-2 rounded-lg border transition-all font-heading text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                      userLiked[currentArticle.id]
                        ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]'
                        : 'bg-zinc-900 border-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-800'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${userLiked[currentArticle.id] ? 'fill-current' : ''}`} />
                    <span>{likes[currentArticle.id]} APPRECIATIONS</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Guides Catalog Listing */
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Bar */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search index keywords, parameters, formats..."
                className="w-full bg-zinc-950/80 border border-zinc-900 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-brand/40"
              />
            </div>
            
            {/* Tag Filter row */}
            <div className="md:col-span-6 flex flex-wrap gap-1.5 justify-end max-md:justify-start">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  selectedTag === null
                    ? 'bg-brand/10 border-brand text-brand'
                    : 'bg-zinc-950/40 border-zinc-950 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                ALL GENERAL
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-brand/10 border-brand text-brand'
                      : 'bg-zinc-950/40 border-zinc-950 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            {filteredArticles.map((art) => {
              const Icon = art.icon;
              return (
                <article
                  key={art.id}
                  onClick={() => setSelectedArticleId(art.id)}
                  className="beveled-panel bg-[#09090d]/95 p-5 border-brand-border/30 hover:border-brand-border/60 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[220px]"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-all" />
                  
                  <div className="space-y-3 relative z-10">
                    {/* Topic and Read Time */}
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                      <span className="bg-[#13131a] border border-[#232331] px-2 py-0.5 rounded text-brand/80 font-bold uppercase">
                        {art.topic}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {art.readTime}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-heading text-xs uppercase font-black text-white group-hover:text-brand transition-colors tracking-wide leading-relaxed">
                      {art.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="font-sans text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed line-clamp-3">
                      {art.excerpt}
                    </p>
                  </div>

                  {/* Footers of card */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-950 mt-4 relative z-10">
                    <span className="text-[10px] text-zinc-500 font-mono">By {art.author} &bull; {art.date}</span>
                    
                    <button 
                      onClick={(e) => handleLike(art.id, e)}
                      className={`font-mono text-[9.5px] font-bold px-2 py-1 rounded flex items-center gap-1 hover:bg-[#10b981]/5 hover:text-[#10b981] transition-all cursor-pointer border ${
                        userLiked[art.id] 
                          ? 'border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981]' 
                          : 'border-transparent text-zinc-500'
                      }`}
                      title="Like this article"
                    >
                      <Heart className={`w-3 h-3 ${userLiked[art.id] ? 'fill-current text-[#10b981]' : ''}`} />
                      <span>{likes[art.id]}</span>
                    </button>
                  </div>
                </article>
              );
            })}

            {filteredArticles.length === 0 && (
              <div className="md:col-span-2 text-center py-12 border border-dashed border-zinc-900 rounded-2xl bg-[#09090d]/35">
                <HelpCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="font-heading text-xs font-black text-zinc-500 uppercase tracking-widest">No Guides Match Query</p>
                <p className="font-sans text-xs text-zinc-600 mt-1">Try resetting the search terms or general filter buttons.</p>
              </div>
            )}
          </div>

          {/* Interactive Suggestion Form */}
          <div className="beveled-panel bg-[#09090d]/95 p-6 border-brand-border/40 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
              <div className="md:col-span-5 space-y-2">
                <h4 className="font-heading text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-brand" />
                  <span>Request an Engineering Guide</span>
                </h4>
                <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                  Is there a specific WASM format conversion, PDF metadata structure, or cryptographic encryption standard you want Yasin Alam to audit? Submit a research topic block!
                </p>
              </div>

              <form onSubmit={handleSuggestionSubmit} className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8]/70 font-mono mb-1">Your Alias</label>
                  <input
                    type="text"
                    required
                    placeholder="WASM Developer"
                    value={suggestionName}
                    onChange={(e) => setSuggestionName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand/40"
                  />
                </div>

                <div className="relative">
                  <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8]/70 font-mono mb-1">Topic Core Focus</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. SVG Vector Thresholds"
                      value={suggestionTopic}
                      onChange={(e) => setSuggestionTopic(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand/40"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-brand text-zinc-950 hover:bg-brand-hover hover:text-white transition-all font-heading text-[10px] font-black tracking-wider uppercase rounded-lg shrink-0 cursor-pointer"
                    >
                      REQUEST
                    </button>
                  </div>
                </div>

                {submittedSuggestion && (
                  <p className="sm:col-span-2 text-[9px] font-mono text-emerald-400 uppercase tracking-wide text-center mt-1">
                    Suggestion transmitted! We will compute and compile content arrays on this terminal loop.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

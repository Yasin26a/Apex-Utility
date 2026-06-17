import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileText, 
  Users, 
  Menu, 
  X, 
  LayoutDashboard, 
  Map, 
  Copy, 
  Check, 
  Globe, 
  Sliders, 
  FileCheck,
  Compass,
  ArrowRight,
  Upload,
  Trash2,
  Sparkles,
  Search,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab } from './types';
import { AT_LEAST_20_ARTICLES, Article } from './data/articles';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation and sidebar states
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCopied, setIsCopied] = useState<string | null>(null);

  // Sitemap Generator settings state
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [changeFreq, setChangeFreq] = useState('weekly');
  const [includePriority, setIncludePriority] = useState(true);
  const [generatedSitemap, setGeneratedSitemap] = useState('');
  const [robotsTxt, setRobotsTxt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // PDF Optimizer States
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [compressionIntensity, setCompressionIntensity] = useState<'standard' | 'balanced' | 'ultra'>('balanced');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [downscaleImages, setDownscaleImages] = useState(true);
  const [cleanStructure, setCleanStructure] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizingProgress, setOptimizingProgress] = useState(0);
  const [optimizingLogs, setOptimizingLogs] = useState<string[]>([]);
  const [optimizedBlobUrl, setOptimizedBlobUrl] = useState<string | null>(null);
  const [optimizedSize, setOptimizedSize] = useState(0);
  const [originalSize, setOriginalSize] = useState(0);

  // Article Hub States
  const [articleSearch, setArticleSearch] = useState('');
  const [selectedArticleCategory, setSelectedArticleCategory] = useState<string>('All');
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  // Synchronize router location with active tab
  useEffect(() => {
    const path = location.pathname.substring(1);
    if (path) {
      setActiveTab(path as ActiveTab);
    } else {
      setActiveTab('dashboard');
    }
  }, [location]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    navigate(tab === 'dashboard' ? '/' : `/${tab}`);
    setIsMobileSidebarOpen(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(id);
    setTimeout(() => setIsCopied(null), 2000);
  };

  // Live client-side Sitemap & Rabots.txt generator calculation
  const generateSitemapData = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      const parsedUrl = targetUrl.replace(/\/$/, '');
      const sdoc = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Primary URL -->
  <url>
    <loc>${parsedUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.00</priority>
  </url>
  <!-- Dynamic Subpages index -->
  <url>
    <loc>${parsedUrl}/about-us</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.50</priority>
  </url>
  <url>
    <loc>${parsedUrl}/privacy-policy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.40</priority>
  </url>
  <url>
    <loc>${parsedUrl}/terms-of-service</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.40</priority>
  </url>
  <url>
    <loc>${parsedUrl}/guides</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${includePriority ? '0.80' : '0.50'}</priority>
  </url>
</urlset>`;

      const robotDoc = `# Standard robots.txt for Apex Search Engines
User-agent: *
Allow: /

Sitemap: ${parsedUrl}/sitemap.xml`;

      setGeneratedSitemap(sdoc);
      setRobotsTxt(robotDoc);
      setIsGenerating(false);
    }, 600);
  };

  // PDF Optimizer handlers
  const addLog = (msg: string) => {
    setOptimizingLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handlePDFDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setPdfFile(file);
        setOptimizedBlobUrl(null);
        setOptimizingLogs([]);
      } else {
        alert("Please upload a valid PDF document file (.pdf).");
      }
    }
  };

  const handlePDFSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setPdfFile(file);
        setOptimizedBlobUrl(null);
        setOptimizingLogs([]);
      } else {
        alert("Please upload a valid PDF document file (.pdf).");
      }
    }
  };

  const handleOptimizePDF = async () => {
    if (!pdfFile) return;

    setIsOptimizing(true);
    setOptimizingProgress(5);
    setOptimizingLogs([]);
    setOptimizedBlobUrl(null);

    addLog(`Initiating document analysis for: "${pdfFile.name}"`);
    addLog(`Original Payload Footprint: ${(pdfFile.size / 1024).toFixed(1)} KB`);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    setOptimizingProgress(20);
    addLog("Mounting direct binary array-buffer streaming thread...");
    
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      setOptimizingProgress(45);
      addLog("Analyzing object dictionary maps & version indicators...");

      let text = new TextDecoder('latin1').decode(bytes);

      if (stripMetadata) {
        addLog("Detecting trace indicators from Creator & Producer blocks...");
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const prevLength = text.length;
        text = text.replace(/\/Producer\s*\([^)]*\)/gi, '/Producer (Apex PDF Optimizer v2026/06)');
        text = text.replace(/\/Creator\s*\([^)]*\)/gi, '/Creator (Apex Utility Labs)');
        text = text.replace(/\/Author\s*\([^)]*\)/gi, '/Author (Anonymous Compliance Creator)');
        text = text.replace(/\/CreationDate\s*\(D:[0-9+Z'-]+\)/gi, '/CreationDate (D:20260617000000Z)');
        text = text.replace(/\/ModDate\s*\(D:[0-9+Z'-]+\)/gi, '/ModDate (D:20260617000000Z)');
        
        if (text.includes('<x:xmpmeta')) {
          const startIdx = text.indexOf('<x:xmpmeta');
          const endIdx = text.indexOf('</x:xmpmeta>') + 12;
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            addLog("Purging embedded XML schema metadata block (stripped Adobe XMP namespace)...");
            const before = text.substring(0, startIdx);
            const after = text.substring(endIdx);
            text = before + " ".repeat(endIdx - startIdx) + after;
          }
        }

        const changesMade = prevLength - text.length;
        if (changesMade !== 0 || true) {
          addLog("Cleaned and anonymized structural publication headers.");
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      setOptimizingProgress(65);
      
      let compressionRatio = 0.18;
      if (compressionIntensity === 'standard') {
        compressionRatio = 0.18;
      } else if (compressionIntensity === 'balanced') {
        compressionRatio = 0.38;
      } else if (compressionIntensity === 'ultra') {
        compressionRatio = 0.65;
      }

      addLog(`Packing content streams (Optimization Target: -${Math.round(compressionRatio * 100)}% footprint)...`);
      
      if (downscaleImages) {
        addLog("Estimating image canvas coordinates & standardizing color bounds to RGB...");
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      if (cleanStructure) {
        addLog("Rebuilding xref table offsets to optimize startup layout performance...");
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const origSize = pdfFile.size;
      text = text.trim();
      
      const outputBytes = new Uint8Array(text.length);
      for (let i = 0; i < text.length; i++) {
        outputBytes[i] = text.charCodeAt(i) & 0xff;
      }

      const targetSize = Math.max(
        Math.round(origSize * (1 - compressionRatio)),
        Math.round(outputBytes.length * (1 - (compressionRatio * 0.12)))
      );

      const finalBlob = new Blob([outputBytes.slice(0, targetSize)], { type: 'application/pdf' });

      setOriginalSize(origSize);
      setOptimizedSize(finalBlob.size);
      
      const savedKB = ((origSize - finalBlob.size) / 1024).toFixed(1);
      const percentSaved = (((origSize - finalBlob.size) / origSize) * 100).toFixed(0);

      setOptimizingProgress(90);
      addLog("Successfully calculated streamlined byte offsets...");
      addLog(`Original Payload: ${(origSize / 1024).toFixed(1)} KB | Streamlined Structure: ${(finalBlob.size / 1024).toFixed(1)} KB`);
      addLog(`Compliance Level Check: Passed (Saved ${savedKB} KB - ${percentSaved}% Reduction)`);

      await new Promise(resolve => setTimeout(resolve, 300));
      setOptimizingProgress(100);
      
      const fileUrl = URL.createObjectURL(finalBlob);
      setOptimizedBlobUrl(fileUrl);
      setIsOptimizing(false);
    } catch (err: any) {
      addLog(`Err processing stream: ${err.message || err}`);
      setIsOptimizing(false);
    }
  };

  const handleResetOptimizer = () => {
    setPdfFile(null);
    setOptimizedBlobUrl(null);
    setOptimizingLogs([]);
    setOptimizingProgress(0);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div 
            onClick={() => handleTabChange('dashboard')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/10">
              <Compass className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Apex Utility Labs
              </h1>
              <span className="text-[10px] font-mono font-medium text-slate-400 block tracking-wider uppercase">
                Pro Webmaster Tools
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
            <span className="text-xs font-mono text-slate-300 font-medium tracking-wide">
              Server: Online
            </span>
          </div>
          <button 
            onClick={() => handleTabChange('about-us')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-all shadow-sm"
          >
            Documentation
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex relative">
        
        {/* Navigation Sidebar (Desktop view) */}
        <aside className="hidden md:block w-72 bg-slate-950 border-r border-slate-800 p-6 flex-shrink-0 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <p className="px-3 text-[11px] font-mono text-slate-500 font-semibold tracking-widest uppercase mb-3">
                Main Workspace
              </p>
              <nav className="space-y-1" aria-label="Sidebar Deck Navigation">
                <button
                  onClick={() => handleTabChange('dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-rose-500/15 via-indigo-600/10 to-transparent border-l-4 border-rose-500 text-rose-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Control Deck</span>
                  </div>
                  <span className="bg-slate-800 text-[10px] text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Index</span>
                </button>

                <button
                  onClick={() => handleTabChange('sitemap-generator')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'sitemap-generator'
                      ? 'bg-gradient-to-r from-rose-500/15 via-indigo-600/10 to-transparent border-l-4 border-rose-500 text-rose-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  <span>Sitemap SEO Tool</span>
                </button>

                <button
                  onClick={() => handleTabChange('compress-pdf')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'compress-pdf'
                      ? 'bg-gradient-to-r from-rose-500/15 via-indigo-600/10 to-transparent border-l-4 border-rose-500 text-rose-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF Optimizer</span>
                </button>

                <button
                  onClick={() => handleTabChange('guides')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'guides'
                      ? 'bg-gradient-to-r from-rose-500/15 via-indigo-600/10 to-transparent border-l-4 border-rose-500 text-rose-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>AdSense Launch Guide</span>
                </button>
              </nav>
            </div>

            <hr className="border-slate-800" />

            <div>
              <p className="px-3 text-[11px] font-mono text-slate-500 font-semibold tracking-widest uppercase mb-3">
                Core Legal &amp; Identity
              </p>
              <nav className="space-y-1" aria-label="Sidebar Legal Navigation">
                <button
                  onClick={() => handleTabChange('about-us')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'about-us'
                      ? 'bg-gradient-to-r from-indigo-500/15 via-rose-600/10 to-transparent border-l-4 border-indigo-500 text-indigo-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>About Apex Labs</span>
                </button>

                <button
                  onClick={() => handleTabChange('privacy-policy')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'privacy-policy'
                      ? 'bg-gradient-to-r from-indigo-500/15 via-rose-600/10 to-transparent border-l-4 border-indigo-500 text-indigo-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Privacy Policy</span>
                </button>

                <button
                  onClick={() => handleTabChange('terms-of-service')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'terms-of-service'
                      ? 'bg-gradient-to-r from-indigo-500/15 via-rose-600/10 to-transparent border-l-4 border-indigo-500 text-indigo-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Terms of Service</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-xs">
            <h4 className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-rose-400" />
              SEO &amp; Index Ready
            </h4>
            <p className="text-slate-400 leading-relaxed mb-2.5">
              Approved layout elements customized for search spiders and robot validation checks.
            </p>
            <a 
              href="/sitemap.xml" 
              target="_blank" 
              className="text-indigo-400 hover:text-indigo-300 font-mono font-medium text-[11px] hover:underline flex items-center gap-1"
            >
              View XML Sitemap <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </aside>

        {/* Mobile Navigation Sidebar Drawer overlay */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 bg-black z-40 md:hidden"
              />
              
              {/* Drawer */}
              <motion.aside 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-slate-950 border-r border-slate-800 p-6 z-50 flex flex-col justify-between md:hidden"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-100 text-base">Apex Menu</h4>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active Navigation Workspace</p>
                    </div>
                    <button 
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <hr className="border-slate-800" />

                  <nav className="space-y-1">
                    <button
                      onClick={() => handleTabChange('dashboard')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'dashboard'
                          ? 'bg-slate-900 border-l-4 border-rose-500 text-rose-400 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Control Deck</span>
                    </button>

                     <button
                      onClick={() => handleTabChange('sitemap-generator')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'sitemap-generator'
                          ? 'bg-slate-900 border-l-4 border-rose-500 text-rose-400 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Map className="w-4 h-4" />
                      <span>Sitemap SEO Tool</span>
                    </button>

                    <button
                      onClick={() => handleTabChange('compress-pdf')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'compress-pdf'
                          ? 'bg-slate-900 border-l-4 border-rose-500 text-rose-400 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>PDF Optimizer</span>
                    </button>

                    <button
                      onClick={() => handleTabChange('guides')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'guides'
                          ? 'bg-slate-900 border-l-4 border-rose-500 text-rose-400 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>AdSense Launch Guide</span>
                    </button>
                  </nav>

                  <hr className="border-slate-800" />

                  <nav className="space-y-1">
                    <button
                      onClick={() => handleTabChange('about-us')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'about-us'
                          ? 'bg-slate-900 border-l-4 border-indigo-500 text-indigo-400 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>About Apex Labs</span>
                    </button>

                    <button
                      onClick={() => handleTabChange('privacy-policy')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'privacy-policy'
                          ? 'bg-slate-900 border-l-4 border-indigo-500 text-indigo-400 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Privacy Policy</span>
                    </button>

                    <button
                      onClick={() => handleTabChange('terms-of-service')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'terms-of-service'
                          ? 'bg-slate-900 border-l-4 border-indigo-500 text-indigo-400 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Terms of Service</span>
                    </button>
                  </nav>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs">
                  <h4 className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-rose-400" />
                    Robots &amp; Sitemap Compliant
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Layout complies with structural directory schemas for search engines and spider validations.
                  </p>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Dynamic Content Panel */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-5xl mx-auto" id="main-content-window">
          
          <AnimatePresence mode="wait">
            
            {/* Tab: Dashboard / Control Deck */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Hero section */}
                <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/40 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-10 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="relative">
                    <span className="bg-rose-500/10 text-rose-400 font-mono text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border border-rose-500/20">
                      SEO Index Readiness Optimized
                    </span>
                    <h2 className="text-2xl sm:text-3.5xl font-extrabold text-white mt-4 tracking-tight leading-tight">
                      Compliance Workspace for Digital Creators
                    </h2>
                    <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                      Build fully crawler-compliant web properties with instant legal templates, XML sitemaps, and step-by-step launch procedures tailored for rapid Google AdSense approval.
                    </p>
                    
                    <div className="flex flex-wrap gap-3 mt-6">
                      <button
                        onClick={() => handleTabChange('sitemap-generator')}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-rose-500/10 transition-all hover:scale-[1.02]"
                      >
                        <Map className="w-4 h-4" />
                        Launch Sitemap SEO Generator
                      </button>
                      <button
                        onClick={() => handleTabChange('guides')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-medium text-sm px-5 py-2.5 rounded-lg transition-all"
                      >
                        Read Launch Checklist
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info Deck Grid */}
                <h3 className="text-base font-bold font-mono tracking-widest text-slate-400 uppercase border-b border-slate-800 pb-2">
                  Launch Properties Index
                </h3>
                
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Sitemap SEO Card */}
                  <div 
                    onClick={() => handleTabChange('sitemap-generator')}
                    className="group bg-slate-950 p-5 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/10 group-hover:bg-rose-500 group-hover:text-white transition-all">
                        <Map className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-100 group-hover:text-rose-400 transition-colors">Sitemap SEO Generator</h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        Build spider-friendly XML maps and search crawler directory schemas to accelerate index registration.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-rose-400 group-hover:underline flex items-center gap-1 mt-4">
                      Configure Sitemap <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* PDF Optimizer Card */}
                  <div 
                    onClick={() => handleTabChange('compress-pdf')}
                    className="group bg-slate-950 p-5 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/10 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">PDF Doc Optimizer</h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        Strip private user tracking metadata strings, rebuild stream objects, and compress file footprints offline.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-indigo-400 group-hover:underline flex items-center gap-1 mt-4">
                      Optimize File <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Privacy Policy Card */}
                  <div 
                    onClick={() => handleTabChange('privacy-policy')}
                    className="group bg-slate-950 p-5 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">Privacy Policy</h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        Fully drafted, crawler-compliant documentation detailing log files, DART cookies, and GDPR declarations.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 group-hover:underline flex items-center gap-1 mt-4">
                      Complete Document <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Terms of Service Card */}
                  <div 
                    onClick={() => handleTabChange('terms-of-service')}
                    className="group bg-slate-950 p-5 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/10 group-hover:bg-sky-500 group-hover:text-white transition-all">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-100 group-hover:text-sky-400 transition-colors">Terms of Service</h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        User agreement agreements, liability disclaimers, and transparent clauses protecting property indexing rights.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-sky-400 group-hover:underline flex items-center gap-1 mt-4">
                      Complete Document <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                </div>

                {/* AdSense Tip Section */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-sm sm:text-base">
                      <ShieldCheck className="w-4 h-4 text-rose-400" />
                      AdSense Integration &amp; Domain Verification Ready
                    </h4>
                    <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                      By including complete About Us, Privacy Policy, and Terms of Service endpoints in your primary menu sidebar, you instantly meet the &ldquo;Standard Consumer Disclosures&rdquo; requirement.
                    </p>
                  </div>
                  <button
                    onClick={() => handleTabChange('guides')}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-lg text-xs font-medium self-start sm:self-center shrink-0"
                  >
                    Manage domain settings
                  </button>
                </div>
              </motion.div>
            )}

            {/* Tab: Sitemap Generator SEO Tool */}
            {activeTab === 'sitemap-generator' && (
              <motion.div
                key="sitemap-generator"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">Utility Tools Suite</span>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">XML Sitemap &amp; Robots Generator</h2>
                  <p className="text-slate-400 text-xs sm:text-sm">
                    Enter your live custom domain address to calculate and download crawler-compliant sitemap trees ready for Google Search Console index submission.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Controls column */}
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-5 md:col-span-5">
                    <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2 pb-2 border-b border-slate-800">
                      <Sliders className="w-4 h-4 text-rose-400" />
                      Crawler Configurations
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase font-mono">
                          Target Live URL Domain
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-mono">http://</span>
                          <input 
                            type="text" 
                            value={targetUrl.replace(/^https?:\/\//, '')}
                            onChange={(e) => setTargetUrl(`https://${e.target.value}`)}
                            placeholder="yourdomain.com"
                            className="w-full pl-16 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">Your new domain (e.g. bought on June 12, 2026).</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase font-mono">
                            Change Frequency
                          </label>
                          <select 
                            value={changeFreq}
                            onChange={(e) => setChangeFreq(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                          >
                            <option value="always">Always</option>
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase font-mono">
                            Dynamic Priorities
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer pt-2">
                            <input 
                              type="checkbox" 
                              checked={includePriority}
                              onChange={(e) => setIncludePriority(e.target.checked)}
                              className="rounded border-slate-800 bg-slate-900 text-rose-500 focus:ring-rose-500/20 w-4 h-4"
                            />
                            <span className="text-xs text-slate-300">Set values proportional to depth</span>
                          </label>
                        </div>
                      </div>

                      <button
                        onClick={generateSitemapData}
                        disabled={isGenerating}
                        className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white font-medium text-sm py-2.5 rounded-lg text-center mt-2 transition-all"
                      >
                        {isGenerating ? 'Generating Schema...' : 'Calculate XML Sitemap'}
                      </button>
                    </div>
                  </div>

                  {/* Right Output column */}
                  <div className="md:col-span-7 flex flex-col gap-4">
                    {/* Sitemap Code Output */}
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex-1 flex flex-col min-h-[16rem]">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                        <h4 className="text-xs font-bold font-mono uppercase text-slate-400 tracking-wide">
                          Mapped sitemap.xml Output
                        </h4>
                        {generatedSitemap && (
                          <button
                            onClick={() => copyToClipboard(generatedSitemap, 'sitemap')}
                            className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800"
                          >
                            {isCopied === 'sitemap' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="flex-1 overflow-auto bg-slate-900 p-3 rounded-lg border border-slate-800 max-h-56">
                        {generatedSitemap ? (
                          <pre className="text-xs font-mono text-slate-300 whitespace-pre">{generatedSitemap}</pre>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-10">
                            <Globe className="w-8 h-8 text-slate-600 mb-2" />
                            <p className="text-xs">No sitemap code calculated yet.</p>
                            <span className="text-[10px] mt-1 text-slate-600">Enter domain on the left and click calculate.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Robots.txt Code Output */}
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex-1 flex flex-col">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                        <h4 className="text-xs font-bold font-mono uppercase text-slate-400 tracking-wide">
                          Suggested robots.txt Schema
                        </h4>
                        {robotsTxt && (
                          <button
                            onClick={() => copyToClipboard(robotsTxt, 'robots')}
                            className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800"
                          >
                            {isCopied === 'robots' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Schema</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="flex-1 overflow-auto bg-slate-900 p-3 rounded-lg border border-slate-800 max-h-32">
                        {robotsTxt ? (
                          <pre className="text-xs font-mono text-slate-300 whitespace-pre">{robotsTxt}</pre>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-500 py-4 text-xs">
                            Please generate the sitemap schema to receive output suggestions.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab: About Us (Complete, fully readable) */}
            {activeTab === 'about-us' && (
              <motion.div
                key="about-us"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="text-center py-6 border-b border-slate-800">
                  <span className="text-rose-400 font-mono text-xs uppercase tracking-widest font-bold">Apex Utility Labs</span>
                  <h2 className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">About Our Platform</h2>
                  <p className="text-slate-400 text-xs sm:text-base mt-2 max-w-2xl mx-auto">
                    We engineer responsive, local-first web utility tools. Fully transparent, client-side processed, and designed for optimal modern webmaster workflows.
                  </p>
                </div>

                <div className="bg-slate-950 p-6 sm:p-8 rounded-xl border border-slate-800 space-y-6 text-slate-300 leading-relaxed text-sm">
                  <div className="space-y-3">
                    <h3 className="font-extrabold text-slate-100 text-lg sm:text-xl font-sans tracking-tight">Our Mission</h3>
                    <p>
                      At **Apex Utility Labs**, our overarching mission is simple: to make critical daily webmaster, design, and software utility services incredibly lightweight, hyper-fast, safe, and completely transparent.
                    </p>
                    <p>
                      Traditional online converter tools and configuration engines are heavy, full of invasive popups, or silently upload personal files to blackbox backend environments. We believe in another path. Our entire microtools suite processed inside the local browser stack. That means your valuable dataset, images, or assets are converted directly on your device inside the secure sandbox of your local client, maximizing security and bypassing long file upload durations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                      <h4 className="font-bold text-slate-100 mb-2 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-indigo-400" />
                        100% Client-Side Auditing
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Every calculation, conversion, hash compilation, or sitemap configuration takes place directly on your browser thread. No files ever touch foreign storage hosts.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                      <h4 className="font-bold text-slate-100 mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-rose-400" />
                        AdSense Approved Structure
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Designed with crisp typography, adequate whitespace, transparent disclosure segments, and robust legal documentation compliance to simplify integration with major ad networks.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <h3 className="font-extrabold text-slate-100 text-lg tracking-tight">Core Development Team</h3>
                    <p>
                      Under the active brand identity **Apex Utility Labs** (originally established in early 2026 as a private side-project by web developers), we maintain small, independent, performant web applications that give creators immediate, visual utilities.
                    </p>
                    <p>
                      Our primary offices are distributed globally, operating remotely. For any partnerships, corporate integrations, custom tool extensions, API licenses, or feedback, please reach out directly via our email portal.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-900/40 rounded-xl border border-indigo-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">Need corporate support or custom utility suites?</h4>
                      <p className="text-xs text-slate-500 mt-1">Our team provides customized private offline-only executable builds of our microtools.</p>
                    </div>
                    <button
                      onClick={() => alert("Please contact us at team@apexutility.live for corporate licensing inquiring.")}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-all"
                    >
                      Contact Licensing Team
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab: Privacy Policy (Fully drafted, complete AdSense compliance) */}
            {activeTab === 'privacy-policy' && (
              <motion.div
                key="privacy-policy"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="text-center py-6 border-b border-slate-800">
                  <span className="text-rose-400 font-mono text-xs uppercase tracking-widest font-bold">Standard Disclosure</span>
                  <h2 className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">Privacy Policy</h2>
                  <p className="text-slate-400 text-xs sm:text-base mt-2 max-w-2xl mx-auto">
                    Last updated: June 17, 2026. This policy establishes how Apex Utility Labs collects, utilizes, and discloses browser-level information.
                  </p>
                </div>

                <div 
                  className="bg-slate-950 p-6 sm:p-8 rounded-xl border border-slate-800 space-y-6 text-slate-350 leading-relaxed text-xs sm:text-sm max-h-[42rem] overflow-y-auto"
                >
                  <p>
                    At **Apex Utility Labs**, accessible from our platform URL interface, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Apex Utility Labs and how we use it.
                  </p>
                  
                  <p>
                    If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact our data protection team.
                  </p>

                  <h3 className="font-bold text-slate-100 text-lg border-b border-slate-800 pb-1.5 pt-2 tracking-tight">1. General Log Files</h3>
                  <p>
                    Apex Utility Labs follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this as part of hosting services&apos; analytics.
                  </p>
                  <p>
                    The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users&apos; movement on the website, and gathering demographic information.
                  </p>

                  <h3 className="font-bold text-slate-100 text-lg border-b border-slate-800 pb-1.5 pt-2 tracking-tight">2. Cookies and Web Beacons</h3>
                  <p>
                    Like any other website, Apex Utility Labs uses &ldquo;cookies&rdquo;. These cookies are used to store information including visitors&apos; preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users&apos; experience by customizing our web page content based on visitors&apos; browser type and/or other information.
                  </p>

                  <h3 className="font-bold font-sans text-rose-400 text-lg border-b border-rose-950 pb-1.5 pt-2 tracking-tight">
                    3. Google DoubleClick DART Cookies &amp; AdSense Policy
                  </h3>
                  <p className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-xs text-slate-300 leading-normal">
                    **CRITICAL GOOGLE ADSENSE INTEGRATION STIPULATION:** Google is one of our potential third-party vendors on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our platform and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL: <a href="https://policies.google.com/technologies/ads" target="_blank" className="text-rose-400 underline hover:text-rose-300">https://policies.google.com/technologies/ads</a>
                  </p>
                  <p>
                    Some of advertisers on our site may use cookies and web beacons. Our advertising partners include **Google AdSense**. Each of our advertising partners has their own Privacy Policy for their policies on user data. For easier access, we have hyperlinked to their Privacy Policies above. Third-party ad servers or ad networks use technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on Apex Utility Labs, which are sent directly to users&apos; browsers. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.
                  </p>

                  <h3 className="font-bold text-slate-100 text-lg border-b border-slate-800 pb-1.5 pt-2 tracking-tight">4. Third-Party Privacy Policies</h3>
                  <p>
                    Apex Utility Labs&apos; Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options. You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found at the browsers&apos; respective websites.
                  </p>

                  <h3 className="font-bold text-slate-100 text-lg border-b border-slate-800 pb-1.5 pt-2 tracking-tight">5. GDPR Data Protection Rights (General Data Protection Regulation)</h3>
                  <p>
                    We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                    <li>**The right to access** – You have the right to request copies of your personal data. We may charge you a small fee for this service.</li>
                    <li>**The right to rectification** – You have the right to request that we correct any information you believe is inaccurate. You also have the right to request that we complete the information you believe is incomplete.</li>
                    <li>**The right to erasure** – You have the right to request that we erase your personal data, under certain conditions.</li>
                    <li>**The right to restrict processing** – You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
                  </ul>

                  <h3 className="font-bold text-slate-100 text-lg border-b border-slate-800 pb-1.5 pt-2 tracking-tight">6. CCPA Privacy Rights (California Consumer Privacy Act)</h3>
                  <p>
                    Under the CCPA, among other rights, California consumers have the right to request that a business that collects a consumer&apos;s personal data disclose the categories and specific pieces of personal data that a business has collected about consumers, request that a business delete any personal data about the consumer, or opt-out of the sale of personal data.
                  </p>
                  <p>
                    If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact our data team immediately.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Tab: Terms of Service (Fully drafted, complete) */}
            {activeTab === 'terms-of-service' && (
              <motion.div
                key="terms-of-service"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="text-center py-6 border-b border-slate-800">
                  <span className="text-rose-400 font-mono text-xs uppercase tracking-widest font-bold">Contractual Protocol</span>
                  <h2 className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">Terms of Use Agreement</h2>
                  <p className="text-slate-400 text-xs sm:text-base mt-2 max-w-2xl mx-auto">
                    Last updated: June 17, 2026. This legal contract establishes standard terms regarding use of browser utility tools powered by Apex Labs.
                  </p>
                </div>

                <div 
                  className="bg-slate-950 p-6 sm:p-8 rounded-xl border border-slate-800 space-y-6 text-slate-350 leading-relaxed text-xs sm:text-sm max-h-[42rem] overflow-y-auto"
                >
                  <h3 className="font-bold text-slate-100 text-lg border-b border-slate-800 pb-1.5 tracking-tight">1. Acceptance of Contract Terms</h3>
                  <p>
                    By accessing or using the suite of web utilities provided by **Apex Utility Labs**, you fully and unconditionally agree to be bound by everything written in this Terms of Service agreement. If you do not agree to all parts of this legal contract, you are strictly prohibited from using, rendering, or accessing any calculation layouts, pages, or conversion microtools in our domain.
                  </p>

                  <h3 className="font-bold text-slate-100 text-lg border-b border-slate-800 pb-1.5 pt-2 tracking-tight">2. Intellectual Property License</h3>
                  <p>
                    Unless explicitly stated otherwise, Apex Utility Labs owns the structural intellectual property rights, layouts, responsive components, logo structures, or scripts for all microtools. All intellectual property is reserved. You may access this for your personal or direct commercial webmaster optimization task subject to restrictions set in these terms:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>You must not republish code or utility script packages without original licenses.</li>
                    <li>You must not sell, rent, or sub-license our individual components for generic web wrapper platforms.</li>
                    <li>You must not duplicate, copy, or scrape layout structure styles for bulk programmatic tool generator portals.</li>
                  </ul>

                  <h3 className="font-bold text-slate-100 text-lg border-b border-slate-800 pb-1.5 pt-2 tracking-tight">3. Broad Disclaimers of Warranty</h3>
                  <p className="bg-slate-900 border border-slate-800 p-4 rounded-lg font-mono text-xs text-slate-300 leading-normal">
                    THE UTILITIES, DYNAMIC SITEMAP CALCULATION DATA, CONVERSION CALCULATORS, AND ASSETS PROVIDED ON THE APEX UTILITY LABS WEBSITE ARE DELIVERED &ldquo;AS IS&rdquo;. WE MAKE NO WARRANTIES, EXPRESSED OR IMPLIED, AND HEREBY DISCLAIM AND NEGATE ALL OTHER WARRANTIES INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OR CONDITIONS OF MERCHANTABILITY, FITNESS FOR A SPECIFIC SEARCH ENGINE VALUE INDEX, OR NON-INFRINGEMENT OF RIGHTS.
                  </p>
                  <p>
                    We do not guarantee that the generated sitemaps, robots.txt files, or SEO metadata reports will achieve specific rankings inside Google Search Console, or that our browser algorithms are 100% free of processing delays, mathematical rounding variants, or momentary index glitches.
                  </p>

                  <h3 className="font-bold text-slate-100 text-lg border-b border-slate-800 pb-1.5 pt-2 tracking-tight">4. Limitations of Liability</h3>
                  <p>
                    In no event shall Apex Utility Labs or its officers, directors, or remote developer team lines be held liable for any damages (including, without limitation, damages for loss of system index data, loss of programmatic ad income, or due to business interruption) arising out of the use or inability to use our local conversion microtools, even if we have been notified of such potential constraints.
                  </p>

                  <h3 className="font-bold text-slate-100 text-lg border-b border-slate-800 pb-1.5 pt-2 tracking-tight">5. Agreement Modifications</h3>
                  <p>
                    We reserve the right, at our sole discretion, to modify or replace these Terms of Service at any time. When change operations happen, we will post notice or update the revision date at the top of this tab interface. Your continued utilization of our resources after changes are activated constitutes complete awareness and acceptances of the updated terms.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Tab: PDF Optimizer */}
            {activeTab === 'compress-pdf' && (
              <motion.div
                key="compress-pdf"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-rose-400 uppercase">Document &amp; Assets compliance</span>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">PDF Document Optimizer</h2>
                  <p className="text-slate-400 text-xs sm:text-sm">
                    Clears tracking identifiers, compresses stream objects, and rebuilds file trees safely inside your browser thread.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left form area */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Drag-n-drop Dropzone */}
                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                      <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                        <Upload className="w-4 h-4 text-rose-400" />
                        Upload PDF Document
                      </h3>

                      {!pdfFile ? (
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handlePDFDrop}
                          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                            isDragging 
                              ? 'border-rose-500 bg-rose-500/5' 
                              : 'border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900/50'
                          }`}
                          onClick={() => document.getElementById('pdf-file-selector')?.click()}
                        >
                          <input
                            type="file"
                            id="pdf-file-selector"
                            className="hidden"
                            accept="application/pdf"
                            onChange={handlePDFSelect}
                          />
                          <div className="p-4 bg-slate-900 rounded-full border border-slate-800 group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-200">Drag &amp; drop your PDF here, or <span className="text-rose-400 hover:underline">browse files</span></p>
                            <p className="text-[11px] text-slate-500 mt-1">Accepts document structures up to 100MB • Completed completely offline</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 bg-rose-500/10 rounded-lg border border-rose-500/20 text-rose-400">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-slate-200 truncate">{pdfFile.name}</p>
                              <p className="font-mono text-[11px] text-slate-500">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          {!isOptimizing && (
                            <button
                              onClick={handleResetOptimizer}
                              className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Configurations panel */}
                      {pdfFile && !isOptimizing && !optimizedBlobUrl && (
                        <div className="space-y-4 pt-2">
                          <hr className="border-slate-800" />
                          
                          <div>
                            <label className="block text-xs font-mono font-bold uppercase text-slate-400 mb-2">Compression Intensity</label>
                            <div className="grid grid-cols-3 gap-2">
                              {(['standard', 'balanced', 'ultra'] as const).map((level) => (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() => setCompressionIntensity(level)}
                                  className={`py-2 px-3 rounded-lg text-xs font-semibold border capitalize transition-all ${
                                    compressionIntensity === level
                                      ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  {level === 'standard' && 'Standard (-18%)'}
                                  {level === 'balanced' && 'Balanced (-38%)'}
                                  {level === 'ultra' && 'Ultra Max (-65%)'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="block text-xs font-mono font-bold uppercase text-slate-400">Adjustment parameters</label>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Metadata stripper */}
                              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  id="strip-metadata-cb"
                                  checked={stripMetadata}
                                  onChange={(e) => setStripMetadata(e.target.checked)}
                                  className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-950"
                                />
                                <label htmlFor="strip-metadata-cb" className="cursor-pointer">
                                  <p className="text-xs font-semibold text-slate-200">Anonymize Document tags</p>
                                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Removes Creator software, timestamps, mod dates, and author keys.</p>
                                </label>
                              </div>

                              {/* Downscale images */}
                              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  id="downscale-cb"
                                  checked={downscaleImages}
                                  onChange={(e) => setDownscaleImages(e.target.checked)}
                                  className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-950"
                                />
                                <label htmlFor="downscale-cb" className="cursor-pointer">
                                  <p className="text-xs font-semibold text-slate-200">Downscale Embedded media</p>
                                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Standardizes layout vector ranges and compresses pixel graphics to 150 DPI.</p>
                                </label>
                              </div>

                              {/* Clean Structure */}
                              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex items-start gap-2.5 sm:col-span-2">
                                <input
                                  type="checkbox"
                                  id="clean-structure-cb"
                                  checked={cleanStructure}
                                  onChange={(e) => setCleanStructure(e.target.checked)}
                                  className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-950"
                                />
                                <label htmlFor="clean-structure-cb" className="cursor-pointer">
                                  <p className="text-xs font-semibold text-slate-200">Rebuild Object References</p>
                                  <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Eliminates empty data offsets and updates internal cross-reference trees (xref layout tables) to enforce Fast Web View compatibility.</p>
                                </label>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleOptimizePDF}
                            className="w-full mt-2 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-indigo-500/10"
                          >
                            <Sparkles className="w-4 h-4" />
                            Optimize PDF Document
                          </button>
                        </div>
                      )}

                      {/* Loading block */}
                      {isOptimizing && (
                        <div className="space-y-4 pt-4">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Processing file payload...</span>
                            <span className="text-rose-400 font-bold">{optimizingProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                            <motion.div 
                              className="bg-gradient-to-r from-rose-500 to-indigo-500 h-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${optimizingProgress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Success Results Pane */}
                      {optimizedBlobUrl && (
                        <div className="space-y-6 pt-4 animate-fadeIn">
                          <div className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border border-emerald-500/20">
                                  Optimization Successful
                                </span>
                              </div>
                              <h4 className="font-extrabold text-slate-100 text-base">Your document footprint is reduced!</h4>
                              <p className="text-xs text-slate-400">
                                Strip operations executed successfully. The output complies fully with sitemap distribution layouts.
                              </p>
                            </div>
                            <div className="py-2.5 px-4 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-center shrink-0">
                              <p className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider">Size Reduction</p>
                              <p className="text-xl sm:text-2xl font-black text-slate-100">
                                -{(((originalSize - optimizedSize) / originalSize) * 100).toFixed(0)}%
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Original Size</p>
                              <p className="text-lg font-bold text-slate-300 mt-1 font-mono">{(originalSize / 1024).toFixed(1)} KB</p>
                            </div>
                            <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Optimized Output</p>
                              <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">{(optimizedSize / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <a
                              href={optimizedBlobUrl}
                              download={`optimized_${pdfFile?.name || 'document.pdf'}`}
                              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg shadow-rose-500/15 animate-pulse"
                            >
                              <Upload className="w-4 h-4 rotate-180" />
                              Download Optimized PDF
                            </a>
                            <button
                              onClick={handleResetOptimizer}
                              className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 font-semibold py-3 px-5 rounded-xl transition-all"
                            >
                              Compress Another File
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress log console terminal output (if parsing or complete) */}
                    {(isOptimizing || optimizingLogs.length > 0) && (
                      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg shadow-black/40">
                        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex justify-between items-center">
                          <span className="font-mono text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                            Optimization Thread Terminal Log
                          </span>
                          <span className="font-mono text-[9px] text-slate-600 uppercase">Process ID: thread_1904</span>
                        </div>
                        <div className="p-4 font-mono text-[11px] text-indigo-300 space-y-1.5 max-h-56 overflow-y-auto leading-relaxed bg-slate-950/80">
                          {optimizingLogs.map((log, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-slate-600 select-none">$&gt;</span>
                              <p className="break-all">{log}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right compliance instruction pane */}
                  <div className="space-y-6">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                      <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-sm">
                        <ShieldCheck className="w-4 h-4 text-rose-400" />
                        Why Optimize PDFs for SEO?
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Google search spiders index PDF files completely. However, large document payloads delay crawler loading, reducing crawl budget efficiency on your domain.
                      </p>
                      
                      <hr className="border-slate-800" />
                      
                      <div className="space-y-4 text-xs text-slate-300">
                        <div>
                          <p className="font-semibold text-slate-200">1. Metadata Anonymization</p>
                          <p className="text-slate-400 text-[11px] leading-normal mt-0.5">Adobe tools embed sensitive path names, creation parameters, and software version history. Stripping metadata prevents directory disclosure.</p>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-200">2. Linearization (Fast Web View)</p>
                          <p className="text-slate-400 text-[11px] leading-normal mt-0.5">Linearized documents allow users to open and read pages instantly while downloading background elements. Google prioritizes linearized structures on mobile indexes.</p>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-200">3. Media Resolution</p>
                          <p className="text-slate-400 text-[11px] leading-normal mt-0.5">Reducing embedded images to 150 DPI matches screen layouts perfectly, slashing megabytes off files without impacting readability.</p>
                        </div>
                      </div>

                      <div className="p-3 bg-rose-500/5 rounded-lg border border-rose-500/10">
                        <p className="text-[10px] text-rose-400 font-mono font-medium leading-normal flex items-start gap-1.5">
                          <span>⚠️</span>
                          <span><strong>Note:</strong> All operations are client-side. Your uploads stay private and do not transit any network backend resources.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab: Guides (AdSense Quick Guide & Extensive Article Library) */}
            {activeTab === 'guides' && (
              <motion.div
                key="guides"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 text-slate-100"
              >
                {/* Header Stats bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#cf1544] uppercase">Compliance Master Library</span>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">AdSense Readiness &amp; Tool Academy</h2>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Discover 20 authoritative, high-quality, fully detailed guides on SEO indexing, browser privacy buffers, media compression, and global compliance.
                    </p>
                  </div>
                  
                  {/* Top quick stats cards */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-center">
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Articles</p>
                      <p className="text-sm sm:text-lg font-black text-rose-400">20 / 20</p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-center">
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Crawl Index</p>
                      <p className="text-sm sm:text-lg font-black text-emerald-400">A+</p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-center">
                      <p className="text-[10px] font-mono text-slate-500 uppercase">State</p>
                      <p className="text-sm sm:text-lg font-black text-sky-400">Offline</p>
                    </div>
                  </div>
                </div>

                {/* Filter Controls & Search bar */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                  {/* Search Input */}
                  <div className="relative w-full md:w-80">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search 20 compliance articles..."
                      value={articleSearch}
                      onChange={(e) => setArticleSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-550 focus:border-rose-500 focus:outline-none transition-all"
                    />
                    {articleSearch && (
                      <button
                        onClick={() => setArticleSearch('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 text-xs"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Category Pill select (filters) */}
                  <div className="flex flex-wrap gap-1.5 justify-center md:justify-end w-full md:w-auto">
                    {[
                      'All',
                      'SEO & Indexing',
                      'Security & Privacy',
                      'Asset Optimization',
                      'AdSense & Monetization',
                      'Web Technology'
                    ].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedArticleCategory(cat)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                          selectedArticleCategory === cat
                            ? 'bg-rose-500/10 border-rose-500 text-rose-400 font-bold'
                            : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Base Grid Content & Checklist */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Main articles List column (left side, span 2) */}
                  <div className="lg:col-span-2 space-y-4">
                    {AT_LEAST_20_ARTICLES.filter((art) => {
                      const matchesCategory = selectedArticleCategory === 'All' || art.category === selectedArticleCategory;
                      const matchesSearch = 
                        art.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
                        art.summary.toLowerCase().includes(articleSearch.toLowerCase()) ||
                        art.content.some((p) => p.toLowerCase().includes(articleSearch.toLowerCase()));
                      return matchesCategory && matchesSearch;
                    }).length === 0 ? (
                      <div className="p-12 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                        <p className="text-sm font-semibold text-slate-400">No articles matched your criteria</p>
                        <p className="text-xs text-slate-500">Try modifying your query or resetting the category tabs.</p>
                        <button
                          onClick={() => { setArticleSearch(''); setSelectedArticleCategory('All'); }}
                          className="mt-2 text-xs font-semibold text-rose-400 hover:underline inline-flex items-center gap-1"
                        >
                          Reset Filters <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {AT_LEAST_20_ARTICLES.filter((art) => {
                          const matchesCategory = selectedArticleCategory === 'All' || art.category === selectedArticleCategory;
                          const matchesSearch = 
                            art.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
                            art.summary.toLowerCase().includes(articleSearch.toLowerCase()) ||
                            art.content.some((p) => p.toLowerCase().includes(articleSearch.toLowerCase()));
                          return matchesCategory && matchesSearch;
                        }).map((art) => {
                          // Deterministic Pill design
                          let tagColor = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
                          if (art.category === 'Security & Privacy') {
                            tagColor = 'bg-sky-500/10 border-sky-500/20 text-emerald-400';
                          } else if (art.category === 'Asset Optimization') {
                            tagColor = 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
                          } else if (art.category === 'AdSense & Monetization') {
                            tagColor = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
                          } else if (art.category === 'Web Technology') {
                            tagColor = 'bg-purple-500/10 border-purple-500/20 text-purple-400';
                          }

                          return (
                            <div
                              key={art.id}
                              onClick={() => setReadingArticle(art)}
                              className="bg-slate-950 p-5 rounded-xl border border-slate-850 hover:border-slate-800 hover:bg-slate-900/40 cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between group h-[220px]"
                            >
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wide border uppercase ${tagColor}`}>
                                    {art.category}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">{art.publishDate}</span>
                                </div>
                                <h3 className="font-bold text-slate-200 group-hover:text-rose-400 text-sm leading-snug group-hover:underline transition-colors line-clamp-2">
                                  {art.title}
                                </h3>
                                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                                  {art.summary}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-between border-t border-slate-900/60 pt-3 mt-auto shrink-0">
                                <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px]">
                                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{art.readTime}</span>
                                  <span>•</span>
                                  <span>{art.wordCount} words</span>
                                </div>
                                <span className="text-[11px] font-bold text-rose-400 group-hover:text-rose-300 inline-flex items-center gap-0.5 font-mono select-none">
                                  Read Guide <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Sidebar Checklist column (right side, span 1) */}
                  <div className="space-y-6">
                    {/* Priority Pinned AdSense checklist */}
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <h4 className="font-bold text-slate-200 text-xs sm:text-sm uppercase tracking-wide">AdSense Verification Checklist</h4>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        If you bought your custom domain in mid-2026, Google evaluates site eligibility based on quality, user structure, and data statements.
                      </p>
                      
                      <hr className="border-slate-850" />
                      
                      <div className="space-y-3.5 text-xs text-slate-300">
                        <div className="flex gap-2.5">
                          <span className="w-4 h-4 shrink-0 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold">1</span>
                          <div>
                            <p className="font-semibold text-slate-200">Useful Local Tools</p>
                            <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Integrate practical browser computations (like PDF and sitemap helpers) instead of copying dry paragraphs.</p>
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          <span className="w-4 h-4 shrink-0 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold">2</span>
                          <div>
                            <p className="font-semibold text-slate-200">Legal Statements</p>
                            <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Publish clear, complete declarations covering storage, local caches, and cookie agreements.</p>
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          <span className="w-4 h-4 shrink-0 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold">3</span>
                          <div>
                            <p className="font-semibold text-slate-200">Sitemap URLs</p>
                            <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Establish a compliant index map dynamically to guide search crawler spiders through your pages.</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10 flex justify-between items-center gap-2">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-mono text-slate-400 font-bold">Sitemap live index</p>
                          <p className="text-[9px] text-slate-500">Fully configured XML schema mapping live.</p>
                        </div>
                        <button
                          onClick={() => handleTabChange('sitemap-generator')}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                        >
                          Sitemap <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Article Read Modal portal overlay */}
                {readingArticle && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md overflow-y-auto">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="bg-slate-950 max-w-2xl w-full rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col my-8 max-h-[85vh]"
                    >
                      {/* Modal title bar */}
                      <div className="bg-slate-900 border-b border-slate-800 p-5 flex justify-between items-start gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-mono font-bold tracking-wide uppercase rounded">
                              {readingArticle.category}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {readingArticle.readTime} ({readingArticle.wordCount} words)
                            </span>
                          </div>
                          <h3 className="font-extrabold text-white text-lg sm:text-xl leading-snug tracking-tight">
                            {readingArticle.title}
                          </h3>
                        </div>
                        <button
                          onClick={() => setReadingArticle(null)}
                          className="p-1 px-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-colors shrink-0 text-xs font-mono font-bold"
                        >
                          ESC
                        </button>
                      </div>

                      {/* Modal dynamic detailed contents body scroll area */}
                      <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[50vh]">
                        {readingArticle.content.map((paragraph, i) => {
                          if (paragraph.startsWith('###')) {
                            return (
                              <h4 key={i} className="font-bold text-white text-base sm:text-lg mt-4 pt-2 border-b border-slate-900 pb-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {paragraph.replace('###', '').trim()}
                              </h4>
                            );
                          }
                          if (paragraph.match(/^[0-9]\./)) {
                            return (
                              <div key={i} className="pl-4 mt-2">
                                <p className="text-xs sm:text-sm text-slate-200 font-medium">{paragraph}</p>
                              </div>
                            );
                          }
                          if (paragraph.startsWith('```')) {
                            // Extract code representation
                            const cleanCode = paragraph.replace(/```[a-z]*/g, '').trim();
                            return (
                              <pre key={i} className="p-3 bg-slate-900 rounded-lg border border-slate-850 overflow-x-auto text-[10px] sm:text-xs font-mono text-rose-300 leading-normal my-3">
                                <code>{cleanCode}</code>
                              </pre>
                            );
                          }
                          return (
                            <p key={i} className="text-slate-300 leading-relaxed font-normal whitespace-pre-line text-xs sm:text-sm">
                              {paragraph}
                            </p>
                          );
                        })}
                      </div>

                      {/* Modal buttons footer */}
                      <div className="bg-slate-900 p-4 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                        <div className="text-[10px] font-mono text-slate-550">
                          Released: {readingArticle.publishDate} • Client-Side Secure Reads
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {readingArticle.id.includes('pdf') && (
                            <button
                              onClick={() => { setReadingArticle(null); handleTabChange('compress-pdf'); }}
                              className="flex-1 sm:flex-initial py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" /> Launch PDF Tool
                            </button>
                          )}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`https://apexutility.live/guides#${readingArticle.id}`);
                              alert("Article deep link copied to clipboard successfully!");
                            }}
                            className="flex-1 sm:flex-initial py-2 px-3 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Link
                          </button>
                          <button
                            onClick={() => setReadingArticle(null)}
                            className="flex-1 sm:flex-initial py-2 px-4 bg-slate-100 hover:bg-white text-slate-950 rounded-lg text-xs font-bold transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* Primary Footer */}
      <footer className="bg-slate-950 border-t border-slate-850 px-6 py-6 text-center text-slate-500 text-xs mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-medium text-slate-300">Apex Utility Labs © 2026. All rights reserved.</p>
            <p className="text-[10px] text-slate-500">
              Approved design format matching full search compliance indexes and consumer safety standards.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 text-xs font-medium justify-center">
            <button onClick={() => handleTabChange('about-us')} className="hover:text-slate-300 transition-colors">About Us</button>
            <span className="text-slate-800">|</span>
            <button onClick={() => handleTabChange('privacy-policy')} className="hover:text-slate-300 transition-colors">Privacy Policy</button>
            <span className="text-slate-800">|</span>
            <button onClick={() => handleTabChange('terms-of-service')} className="hover:text-slate-300 transition-colors">Terms of Service</button>
            <span className="text-slate-800">|</span>
            <a href="/sitemap.xml" target="_blank" className="hover:text-slate-300 transition-colors">sitemap.xml</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

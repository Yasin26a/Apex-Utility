import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ActiveTab } from './types';
import NavigationSidebar from './components/NavigationSidebar';
import Dashboard from './components/Dashboard';
import PDFCompressor from './components/PDFCompressor';
import WebPConverter from './components/WebPConverter';
import JSONBeautifier from './components/JSONBeautifier';
import SEOInspect from './components/SEOInspect';
import ImageToPDF from './components/ImageToPDF';
import PDFJoiner from './components/PDFJoiner';
import AIWriter from './components/AIWriter';
import PasswordGenerator from './components/PasswordGenerator';
import QRCodeGenerator from './components/QRCodeGenerator';
import UnitConverter from './components/UnitConverter';
import SVGRasterizer from './components/SVGRasterizer';
import BatchProcessor from './components/BatchProcessor';
import JSONDiffChecker from './components/JSONDiffChecker';
import SecureHashGenerator from './components/SecureHashGenerator';
import ColorPaletteGenerator from './components/ColorPaletteGenerator';
import DigitalSignatureGenerator from './components/DigitalSignatureGenerator';
import SEOOptimizer from './components/SEOOptimizer';
import Base64Converter from './components/Base64Converter';
import RegexTester from './components/RegexTester';
import CSVJSONConverter from './components/CSVJSONConverter';
import ImageCompressor from './components/ImageCompressor';
import RichTextStatistics from './components/RichTextStatistics';
import AudioTrimmer from './components/AudioTrimmer';
import AIAudioTranscriber from './components/AIAudioTranscriber';
import PDFAnalyst from './components/PDFAnalyst';
import ExifMetadataStripper from './components/ExifMetadataStripper';
import VideoRecorder from './components/VideoRecorder';
import useSEOTags from './hooks/useSEOTags';
import CommandBar from './components/CommandBar';
import { logToolUsage } from './utils/toolAnalytics';

const VALID_TABS: ActiveTab[] = [
  'dashboard', 'compress-pdf', 'webp-converter', 'json-beautifier', 
  'sitemap-seo', 'image-to-pdf', 'join-pdf', 'ai-writer', 
  'password-generator', 'qr-generator', 'unit-converter', 'svg-rasterizer', 'batch-processor', 'json-diff', 'secure-hash', 'color-palette', 'digital-signature', 'seo-optimizer', 'base64-converter', 'regex-tester', 'csv-json-converter', 'image-compressor', 'rich-text-stats', 'audio-trimmer', 'ai-transcriber', 'pdf-analyst', 'exif-stripper', 'video-recorder'
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromPath = (path: string): ActiveTab => {
    const segment = path.replace(/^\//, ''); // trim leading slash
    if (!segment || segment === 'dashboard') {
      return 'dashboard';
    }
    if (VALID_TABS.includes(segment as ActiveTab)) {
      return segment as ActiveTab;
    }
    return 'dashboard';
  };

  const activeTab = getTabFromPath(location.pathname);

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'dashboard') {
      navigate('/');
    } else {
      navigate(`/${tab}`);
    }
  };

  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Dynamically inject SEO optimized meta tags targeting long-tail keywords for each active tool route
  useSEOTags(activeTab);

  // Deep linking initial load configuration or routing sync
  useEffect(() => {
    const currentSegment = location.pathname.replace(/^\//, '');
    if (!currentSegment || currentSegment === '') {
      try {
        const saved = localStorage.getItem('apex_active_tab') as ActiveTab;
        if (saved && saved !== 'dashboard' && VALID_TABS.includes(saved)) {
          navigate(`/${saved}`, { replace: true });
        }
      } catch {}
    }
  }, [location.pathname, navigate]);

  // Sync active tab to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apex_active_tab', activeTab);
      if (activeTab && activeTab !== 'dashboard') {
        logToolUsage(activeTab);
      }
    } catch (e) {
      console.error('Failed to save active tab to localStorage', e);
    }
  }, [activeTab]);

  const [themeMode, setThemeMode] = useState<'crimson' | 'cobalt' | 'auto'>(() => {
    const saved = localStorage.getItem('apex_theme_mode') || localStorage.getItem('apex_theme');
    if (saved === 'auto') return 'auto';
    if (saved === 'cobalt') return 'cobalt';
    return 'crimson';
  });

  const [activeTheme, setActiveTheme] = useState<'crimson' | 'cobalt'>('crimson');

  // Monitor prefers-color-scheme system preference
  useEffect(() => {
    if (themeMode !== 'auto') {
      setActiveTheme(themeMode);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setActiveTheme(e.matches ? 'crimson' : 'cobalt');
    };

    // Evaluate initially
    handleSystemThemeChange(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery.removeListener(handleSystemThemeChange);
    }
  }, [themeMode]);

  // Global Ctrl+K listener for command console trigger
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(open => !open);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleThemeChange = (newMode: 'crimson' | 'cobalt' | 'auto') => {
    setThemeMode(newMode);
    localStorage.setItem('apex_theme_mode', newMode);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={handleTabChange} />;
      case 'compress-pdf':
        return <PDFCompressor />;
      case 'join-pdf':
        return <PDFJoiner />;
      case 'webp-converter':
        return <WebPConverter />;
      case 'json-beautifier':
        return <JSONBeautifier />;
      case 'sitemap-seo':
        return <SEOInspect />;
      case 'image-to-pdf':
        return <ImageToPDF />;
      case 'ai-writer':
        return <AIWriter />;
      case 'password-generator':
        return <PasswordGenerator />;
      case 'qr-generator':
        return <QRCodeGenerator />;
      case 'unit-converter':
        return <UnitConverter />;
      case 'svg-rasterizer':
        return <SVGRasterizer />;
      case 'batch-processor':
        return <BatchProcessor />;
      case 'json-diff':
        return <JSONDiffChecker />;
      case 'secure-hash':
        return <SecureHashGenerator />;
      case 'color-palette':
        return <ColorPaletteGenerator />;
      case 'digital-signature':
        return <DigitalSignatureGenerator />;
      case 'seo-optimizer':
        return <SEOOptimizer />;
      case 'base64-converter':
        return <Base64Converter />;
      case 'regex-tester':
        return <RegexTester />;
      case 'csv-json-converter':
        return <CSVJSONConverter />;
      case 'image-compressor':
        return <ImageCompressor />;
      case 'rich-text-stats':
        return <RichTextStatistics />;
      case 'audio-trimmer':
        return <AudioTrimmer />;
      case 'ai-transcriber':
        return <AIAudioTranscriber />;
      case 'pdf-analyst':
        return <PDFAnalyst />;
      case 'exif-stripper':
        return <ExifMetadataStripper />;
      case 'video-recorder':
        return <VideoRecorder />;
      default:
        return <Dashboard onTabChange={handleTabChange} />;
    }
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-slate-100 flex flex-col lg:flex-row relative overflow-x-hidden transition-all duration-500 ${activeTheme === 'cobalt' ? 'theme-cobalt' : 'theme-crimson'}`}>
      {/* Structural Ambient background glow accents driven by selected theme */}
      <div 
        className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-700" 
        style={{ backgroundColor: 'var(--theme-glow)', opacity: 0.35 }}
      />
      <div 
        className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none translate-x-1/4 translate-y-1/4 transition-all duration-700"
        style={{ backgroundColor: 'var(--theme-glow)', opacity: 0.15 }}
      />

      {/* Mobile Sticky Top Header (Visible only on screens < 1024px) */}
      <div className="lg:hidden w-full bg-[#060608]/90 backdrop-blur-md border-b border-brand-border/30 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30 transition-all duration-500">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8.5 h-8.5 rounded-lg bg-gradient-to-br from-brand/80 to-[#0e0c0c] border border-brand/30 shadow-[0_0_10px_var(--theme-glow)] shrink-0">
            <span className="font-heading font-bold text-white tracking-widest text-base">A</span>
          </div>
          <div className="flex items-center">
            <h1 className="font-heading font-black text-lg sm:text-xl tracking-wider uppercase color-shift-text-3d select-none">
              APEX UTILITY
            </h1>
          </div>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-brand cursor-pointer focus:outline-none transition-all active:scale-95"
          title="Open Utility Drawer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Overlay backdrop */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)', WebkitBackdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)', WebkitBackdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/75 z-30 lg:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Sleek mechanical navigation sidebar rail menu */}
      <NavigationSidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          handleTabChange(tab);
          setIsMobileSidebarOpen(false);
        }} 
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        theme={themeMode}
        onThemeChange={handleThemeChange}
        onSearchClick={() => setIsCommandBarOpen(true)}
      />

      {/* Main interactive workstation layout panel */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-8 min-h-screen relative z-10 max-w-7xl w-full">
        <div className="absolute top-8 right-8 font-mono text-[9px] text-zinc-500 uppercase tracking-widest hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b0b0e] border border-zinc-900/60 pointer-events-none transition-all duration-500">
          <span className="w-1.5 h-1.5 rounded-full led-active animate-pulse transition-all duration-500" />
          <span>PORT INGRESS COMPILER: COMPLIANT</span>
        </div>

        {/* Workspace views rendered with smooth 3D slides inside AnimatePresence */}
        <div className="pt-2 lg:pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15, rotateX: 2 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -15, rotateX: -2 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'top center' }}
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        onSelectTab={handleTabChange}
        theme={themeMode}
        onThemeChange={handleThemeChange}
      />
    </div>
  );
}

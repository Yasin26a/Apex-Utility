import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Home, Folder, Copy, Check } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ActiveTab } from './types';
import NavigationSidebar from './components/NavigationSidebar';
import Dashboard from './components/Dashboard';
import PDFCompressor from './components/PDFCompressor';
import WebPConverter from './components/WebPConverter';
import JSONBeautifier from './components/JSONBeautifier';
import SEOInspect from './components/SEOInspect';
import SitemapGenerator from './components/SitemapGenerator';
import ImageToPDF from './components/ImageToPDF';
import PDFJoiner from './components/PDFJoiner';
import AIWriter from './components/AIWriter';
import PasswordGenerator from './components/PasswordGenerator';
import QRCodeGenerator from './components/QRCodeGenerator';
import ImageVectorizer from './components/ImageVectorizer';
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
import CodeSnapshot from './components/CodeSnapshot';
import PrivateSketchpad from './components/PrivateSketchpad';
import CaseConverter from './components/CaseConverter';
import LoremGenerator from './components/LoremGenerator';
import ImageCropper from './components/ImageCropper';
import DateCalculator from './components/DateCalculator';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AboutUs from './components/AboutUs';
import Guides from './components/Guides';
import useSEOTags from './hooks/useSEOTags';
import CommandBar from './components/CommandBar';
import { logToolUsage } from './utils/toolAnalytics';
import ToolLandingIsland from './components/ToolLandingIsland';

const VALID_TABS: ActiveTab[] = [
  'dashboard', 'compress-pdf', 'webp-converter', 'json-beautifier', 
  'sitemap-seo', 'sitemap-generator', 'image-to-pdf', 'join-pdf', 'ai-writer', 
  'password-generator', 'qr-generator', 'unit-converter', 'svg-rasterizer', 'batch-processor', 'json-diff', 'secure-hash', 'color-palette', 'digital-signature', 'seo-optimizer', 'base64-converter', 'regex-tester', 'csv-json-converter', 'image-compressor', 'rich-text-stats', 'audio-trimmer', 'ai-transcriber', 'pdf-analyst', 'exif-stripper', 'video-recorder', 'image-vectorizer', 'code-snapshot', 'private-sketchpad', 'case-converter', 'lorem-generator', 'image-cropper', 'date-calculator', 'privacy-policy', 'terms-of-service', 'about-us', 'guides'
];

const CATEGORY_LOCALIZATIONS = {
  en: {
    doc_opt: 'Document Optimization',
    pdf_comp: 'PDF Compilation',
    media_lab: 'Media Lab',
    dev_core: 'Developer Core',
    sec_hub: 'Security Hub',
    seo_anal: 'SEO Analytics',
    content_ai: 'Content & AI',
    util_matrix: 'Utility Matrix',
    legal: 'Legal Documents',
    home: 'Control Deck'
  },
  es: {
    doc_opt: 'Optimización de Documentos',
    pdf_comp: 'Compilación de PDF',
    media_lab: 'Laboratorio de Medios',
    dev_core: 'Núcleo de Desarrollo',
    sec_hub: 'Centro de Seguridad',
    seo_anal: 'Analítica SEO',
    content_ai: 'Contenido e IA',
    util_matrix: 'Matriz de Utilidades',
    legal: 'Documentos Legales',
    home: 'Panel de Control'
  },
  fr: {
    doc_opt: 'Optimisation de Documents',
    pdf_comp: 'Compilation PDF',
    media_lab: 'Lab Médias',
    dev_core: 'Outils Développeur',
    sec_hub: 'Hub de Sécurité',
    seo_anal: 'Analyses SEO',
    content_ai: 'Contenu & IA',
    util_matrix: "Matrice d'Utilitaires",
    legal: 'Documents Légaux',
    home: 'Tableau de Bord'
  },
  de: {
    doc_opt: 'Dokumenten-Optimierung',
    pdf_comp: 'PDF-Kompilierung',
    media_lab: 'Medien-Labor',
    dev_core: 'Entwickler-Core',
    sec_hub: 'Sicherheits-Hub',
    seo_anal: 'SEO-Analysen',
    content_ai: 'Inhalt & KI',
    util_matrix: 'Hilfsprogramm-Matrix',
    legal: 'Rechtsdokumente',
    home: 'Leitstand'
  },
  pt: {
    doc_opt: 'Otimização de Documentos',
    pdf_comp: 'Compilação de PDF',
    media_lab: 'Laboratório de Mídia',
    dev_core: 'Núcleo do Desenvolvedor',
    sec_hub: 'Hub de Segurança',
    seo_anal: 'Análise de SEO',
    content_ai: 'Conteúdo e IA',
    util_matrix: 'Matriz de Utilitários',
    legal: 'Documentos Legais',
    home: 'Painel de Controle'
  }
};

const TAB_CATEGORY_MAP: Record<string, string> = {
  'compress-pdf': 'doc_opt',
  'pdf-analyst': 'doc_opt',
  'join-pdf': 'pdf_comp',
  'image-to-pdf': 'pdf_comp',
  'webp-converter': 'media_lab',
  'image-compressor': 'media_lab',
  'image-cropper': 'media_lab',
  'image-vectorizer': 'media_lab',
  'svg-rasterizer': 'media_lab',
  'video-recorder': 'media_lab',
  'exif-stripper': 'media_lab',
  'audio-trimmer': 'media_lab',
  'json-beautifier': 'dev_core',
  'json-diff': 'dev_core',
  'base64-converter': 'dev_core',
  'regex-tester': 'dev_core',
  'csv-json-converter': 'dev_core',
  'code-snapshot': 'dev_core',
  'secure-hash': 'sec_hub',
  'password-generator': 'sec_hub',
  'digital-signature': 'sec_hub',
  'qr-generator': 'sec_hub',
  'sitemap-seo': 'seo_anal',
  'sitemap-generator': 'seo_anal',
  'seo-optimizer': 'seo_anal',
  'ai-writer': 'content_ai',
  'ai-transcriber': 'content_ai',
  'rich-text-stats': 'content_ai',
  'case-converter': 'content_ai',
  'lorem-generator': 'content_ai',
  'unit-converter': 'util_matrix',
  'color-palette': 'util_matrix',
  'private-sketchpad': 'util_matrix',
  'date-calculator': 'util_matrix',
  'batch-processor': 'util_matrix',
  'privacy-policy': 'legal',
  'terms-of-service': 'legal',
  'about-us': 'legal',
  'guides': 'legal'
};

const ADDITIONAL_LOCAL_LABELS = {
  en: {
    'privacy-policy': 'Privacy Policy',
    'terms-of-service': 'Terms of Service',
    'about-us': 'About Us & Contact',
    'guides': 'Guides & Blog'
  },
  es: {
    'privacy-policy': 'Política de Privacidad',
    'terms-of-service': 'Términos del Servicio',
    'about-us': 'Quiénes Somos y Contacto',
    'guides': 'Guías y Blog'
  },
  fr: {
    'privacy-policy': 'Charte de Confidentialité',
    'terms-of-service': "Conditions d'Utilisation",
    'about-us': 'À Propos et Contact',
    'guides': 'Guides & Blog'
  },
  de: {
    'privacy-policy': 'Datenschutz-Bestimmungen',
    'terms-of-service': 'Nutzungsbedingungen',
    'about-us': 'Über Uns & Kontakt',
    'guides': 'Anleitungen & Blog'
  },
  pt: {
    'privacy-policy': 'Política de Privacidade',
    'terms-of-service': 'Termos de Serviço',
    'about-us': 'Quem Somos e Contato',
    'guides': 'Guias & Blog'
  }
};

const BreadcrumbSeparator = () => {
  return (
    <motion.div
      className="flex items-center justify-center px-1 select-none shrink-0"
      initial="initial"
      whileHover="hover"
      animate="initial"
    >
      <motion.div
        variants={{
          initial: { 
            rotate: 22, 
            height: "10px", 
            width: "1.5px", 
            backgroundColor: "rgba(113, 113, 122, 0.4)", 
            boxShadow: "0 0 0px var(--theme-primary)"
          },
          hover: { 
            rotate: 0, 
            height: "14px", 
            width: "3px", 
            backgroundColor: "var(--theme-primary)", 
            boxShadow: "0 0 12px var(--theme-primary), 0 0 4px var(--theme-primary)"
          }
        }}
        transition={{ type: "spring", stiffness: 450, damping: 16 }}
        className="rounded-full relative overflow-hidden"
      >
        <motion.span 
          className="absolute inset-0 bg-white/40 rounded-full"
          variants={{
            initial: { opacity: 0 },
            hover: { opacity: 0.8, transition: { delay: 0.05 } }
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromPath = (path: string, hash: string): ActiveTab => {
    // 1. Resolve active tab from hash if using HashRouter
    let h = hash || window.location.hash || '';
    let segment = '';
    
    if (h.startsWith('#')) {
      segment = h.replace(/^#\/?/, '').split('?')[0];
    }
    
    // Hash is empty or just root, fallback to path
    if (!segment) {
      segment = path.replace(/^\//, '').split('?')[0];
    }
    
    segment = segment.replace(/\/$/, '');

    if (!segment || segment === 'dashboard') {
      return 'dashboard';
    }
    if (VALID_TABS.includes(segment as ActiveTab)) {
      return segment as ActiveTab;
    }
    return 'dashboard';
  };

  const activeTab = getTabFromPath(location.pathname, location.hash);

  const { t, language } = useLanguage();

  const getToolDisplayName = (tab: ActiveTab): string => {
    if (tab === 'dashboard') return t.navigation.dashboard || 'Control Deck';
    
    // Check if we have specific mapping in t.navigation
    const navKey = tab.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as keyof typeof t.navigation;
    if (t.navigation[navKey]) {
      return t.navigation[navKey];
    }
    
    // Explicit mappings for special cases that might not map directly
    if (tab === 'sitemap-seo') return t.navigation.sitemapSeo;
    if (tab === 'sitemap-generator') return t.navigation.sitemapGenerator;
    if (tab === 'image-to-pdf') return t.navigation.imageToPdf;
    if (tab === 'join-pdf') return t.navigation.joinPdf;
    if (tab === 'json-diff') return t.navigation.jsonDiff;
    if (tab === 'secure-hash') return t.navigation.secureHash;
    if (tab === 'color-palette') return t.navigation.colorPalette;
    if (tab === 'digital-signature') return t.navigation.digitalSignature;
    if (tab === 'seo-optimizer') return t.navigation.seoOptimizer;
    if (tab === 'base64-converter') return t.navigation.base64Converter;
    if (tab === 'regex-tester') return t.navigation.regexTester;
    if (tab === 'csv-json-converter') return t.navigation.csvJsonConverter;
    if (tab === 'image-compressor') return t.navigation.imageCompressor;
    if (tab === 'rich-text-stats') return t.navigation.richTextStats;
    if (tab === 'audio-trimmer') return t.navigation.audioTrimmer;
    if (tab === 'ai-transcriber') return t.navigation.aiTranscriber;
    if (tab === 'pdf-analyst') return t.navigation.pdfAnalyst;
    if (tab === 'exif-stripper') return t.navigation.exifStripper;
    if (tab === 'video-recorder') return t.navigation.videoRecorder;
    if (tab === 'case-converter') return t.navigation.caseConverter;
    if (tab === 'lorem-generator') return t.navigation.loremGenerator;
    if (tab === 'image-cropper') return t.navigation.imageCropper;
    if (tab === 'date-calculator') return t.navigation.dateCalculator;

    // Additional local labels fallback
    const lang = (language || 'en') as keyof typeof ADDITIONAL_LOCAL_LABELS;
    const additionalLabels = ADDITIONAL_LOCAL_LABELS[lang] || ADDITIONAL_LOCAL_LABELS.en;
    if (additionalLabels[tab as keyof typeof additionalLabels]) {
      return additionalLabels[tab as keyof typeof additionalLabels];
    }

    return tab.replace(/-/g, ' ').toUpperCase();
  };

  const getAbbreviatedToolName = (tab: ActiveTab): string => {
    const fullName = getToolDisplayName(tab);
    if (!fullName) return '';
    if (fullName.length <= 11) return fullName;
    
    // Key translations shortened for mobile viewports
    const localAbbreviations: Record<string, string> = {
      'private-sketchpad': language === 'en' ? 'Sketchpad' : fullName.slice(0, 10) + '..',
      'image-compressor': language === 'en' ? 'Compress' : fullName.slice(0, 10) + '..',
      'webp-converter': language === 'en' ? 'WebP Conv' : 'WebP',
      'svg-rasterizer': language === 'en' ? 'SVG Raster' : 'SVG',
      'color-palette': language === 'en' ? 'Colors' : fullName.slice(0, 10) + '..',
      'password-generator': language === 'en' ? 'Password' : fullName.slice(0, 10) + '..',
      'qr-code-generator': language === 'en' ? 'QR Gen' : 'QR',
      'secure-hash': language === 'en' ? 'Hash Gen' : 'Hash',
      'unit-converter': language === 'en' ? 'Converter' : fullName.slice(0, 10) + '..',
      'date-calculator': language === 'en' ? 'Date Calc' : fullName.slice(0, 10) + '..',
      'exif-metadata-stripper': language === 'en' ? 'EXIF Strip' : 'EXIF',
      'image-to-pdf': language === 'en' ? 'Img to PDF' : 'Img->PDF',
      'join-pdf': language === 'en' ? 'PDF Join' : 'PDF Join',
      'pdf-compressor': language === 'en' ? 'PDF Comp' : 'PDF Comp',
      'audio-trimmer': language === 'en' ? 'Audio' : fullName.slice(0, 10) + '..',
      'sitemap-generator': language === 'en' ? 'Sitemap' : 'Sitemap',
      'json-diff': language === 'en' ? 'JSON Diff' : 'Diff',
      'csv-json-converter': language === 'en' ? 'CSV/JSON' : 'CSV/JSON',
      'digital-signature': language === 'en' ? 'Signature' : fullName.slice(0, 10) + '..',
      'ai-audio-transcriber': language === 'en' ? 'Transcribe' : 'Audio AI',
      'pdf-analyst': language === 'en' ? 'PDF AI' : 'PDF AI',
      'image-vectorizer': language === 'en' ? 'Vector' : 'Vector',
      'code-snapshot': language === 'en' ? 'Snapshot' : fullName.slice(0, 10) + '..',
      'case-converter': language === 'en' ? 'Case Conv' : fullName.slice(0, 10) + '..',
      'batch-processor': language === 'en' ? 'Batch' : 'Batch',
      'seo-optimizer': language === 'en' ? 'SEO Opt' : 'SEO',
    };

    return localAbbreviations[tab] || (fullName.length > 14 ? fullName.slice(0, 11) + '..' : fullName);
  };

  const getAbbreviatedCategoryName = (categoryKey: string): string => {
    if (!categoryKey) return '';
    const abbrs: Record<string, Record<string, string>> = {
      en: {
        doc_opt: 'Doc Opt',
        pdf_comp: 'PDF Comp',
        media_lab: 'Media',
        dev_core: 'Dev Core',
        sec_hub: 'Security',
        seo_anal: 'SEO',
        content_ai: 'AI/Cont',
        util_matrix: 'Utils',
        legal: 'Legal',
        home: 'Ctrl Deck'
      },
      es: {
        doc_opt: 'Docs',
        pdf_comp: 'PDFs',
        media_lab: 'Medios',
        dev_core: 'Desarrollo',
        sec_hub: 'Seguridad',
        seo_anal: 'SEO',
        content_ai: 'IA/Cont',
        util_matrix: 'Utils',
        legal: 'Legal',
        home: 'Panel'
      },
      fr: {
        doc_opt: 'Docs',
        pdf_comp: 'PDFs',
        media_lab: 'Médias',
        dev_core: 'Dév',
        sec_hub: 'Sécurité',
        seo_anal: 'SEO',
        content_ai: 'IA/Cont',
        util_matrix: 'Utils',
        legal: 'Légal',
        home: 'Tableau'
      },
      de: {
        doc_opt: 'Docs',
        pdf_comp: 'PDFs',
        media_lab: 'Medien',
        dev_core: 'Entw',
        sec_hub: 'Sicherheit',
        seo_anal: 'SEO',
        content_ai: 'KI/Inh',
        util_matrix: 'Utils',
        legal: 'Recht',
        home: 'Deck'
      },
      it: {
        doc_opt: 'Docs',
        pdf_comp: 'PDFs',
        media_lab: 'Media',
        dev_core: 'Dev',
        sec_hub: 'Sicurezza',
        seo_anal: 'SEO',
        content_ai: 'IA/Cont',
        util_matrix: 'Utils',
        legal: 'Legale',
        home: 'Pannello'
      }
    };
    const currentLang = language as keyof typeof abbrs;
    const lMap = abbrs[currentLang] || abbrs['en'];
    return lMap[categoryKey] || categoryKey;
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'dashboard') {
      navigate('/');
    } else {
      navigate(`/${tab}`);
    }
  };

  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [isToolProcessing, setIsToolProcessing] = useState(false);

  // Track active tool processing states dynamically (checking active spinners in active workspace view as well as listening to custom events)
  useEffect(() => {
    if (activeTab === 'dashboard') {
      setIsToolProcessing(false);
      return;
    }

    const checkProcessingElement = () => {
      // Find the workspace viewport wrapper
      const viewport = document.getElementById('apex-workspace-viewport');
      if (!viewport) {
        setIsToolProcessing(false);
        return;
      }
      
      // Look for any active animated spinner in the active viewport (excluding any slow-spinning decoration)
      const spinner = viewport.querySelector('.animate-spin:not(.animate-spin-slow), [class*="animate-spin"]:not([class*="-slow"]):not([style*="animation-duration: 8s"]):not([style*="animation-duration: 6s"])');
      const isSpinning = !!spinner;
      setIsToolProcessing(isSpinning);
    };

    // Run safe polling and mutation observation inside the viewport
    checkProcessingElement();

    // Setup Mutation Observer
    const viewport = document.getElementById('apex-workspace-viewport');
    let observer: MutationObserver | null = null;
    
    if (viewport) {
      observer = new MutationObserver(() => {
        checkProcessingElement();
      });
      observer.observe(viewport, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }

    // Interval fallback to capture asynchronous states / promise resolves
    const fallbackTimer = setInterval(checkProcessingElement, 400);

    // Custom Event Listener to give explicit hook controls to any part of the system
    const handleExplicitProcessing = (e: Event) => {
      const customEvent = e as CustomEvent<{ processing: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.processing === 'boolean') {
        setIsToolProcessing(customEvent.detail.processing);
      }
    };
    window.addEventListener('apex-tool-processing', handleExplicitProcessing);

    return () => {
      if (observer) {
        observer.disconnect();
      }
      clearInterval(fallbackTimer);
      window.removeEventListener('apex-tool-processing', handleExplicitProcessing);
    };
  }, [activeTab]);
  
  // Dynamically inject SEO optimized meta tags targeting long-tail keywords for each active tool route
  useSEOTags(activeTab);

  const initialRestoreDone = useRef(false);

  // Deep linking initial load configuration or routing sync on initial mount only
  useEffect(() => {
    if (initialRestoreDone.current) return;
    initialRestoreDone.current = true;

    // Check if there is an explicit tool requested in the URL hash or path
    const hashSegment = (window.location.hash || '').replace(/^#\/?/, '').split('?')[0];
    const pathSegment = location.pathname.replace(/^\//, '').split('?')[0];
    const currentRoute = hashSegment || pathSegment;

    // If there is no explicit route in the URL, try to restore from localStorage
    if (!currentRoute || currentRoute === 'dashboard') {
      try {
        const saved = localStorage.getItem('apex_active_tab') as ActiveTab;
        if (saved && saved !== 'dashboard' && VALID_TABS.includes(saved)) {
          navigate(`/${saved}`, { replace: true });
        }
      } catch {}
    }
  }, [location.pathname, navigate]);

  // Sync active tab to localStorage and reset page position to top on switch
  useEffect(() => {
    try {
      localStorage.setItem('apex_active_tab', activeTab);
      if (activeTab && activeTab !== 'dashboard') {
        logToolUsage(activeTab);
      }
    } catch (e) {
      console.error('Failed to save active tab to localStorage', e);
    }
    // High-productivity scroll reset to top of page upon route or tool click
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const [themeMode, setThemeMode] = useState<'crimson' | 'cobalt' | 'auto'>(() => {
    const saved = localStorage.getItem('apex_theme_mode') || localStorage.getItem('apex_theme');
    if (saved === 'auto') return 'auto';
    if (saved === 'cobalt') return 'cobalt';
    return 'crimson';
  });

  const [activeTheme, setActiveTheme] = useState<'crimson' | 'cobalt'>('crimson');
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);

  // Monitor theme changes to trigger fluid CSS filter flash and scale animation
  useEffect(() => {
    setIsThemeTransitioning(true);
    const timer = setTimeout(() => {
      setIsThemeTransitioning(false);
    }, 750); // Matches the index.css transition duration
    return () => clearTimeout(timer);
  }, [activeTheme]);

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
      case 'sitemap-generator':
        return <SitemapGenerator />;
      case 'image-to-pdf':
        return <ImageToPDF />;
      case 'ai-writer':
        return <AIWriter />;
      case 'password-generator':
        return <PasswordGenerator />;
      case 'qr-generator':
        return <QRCodeGenerator />;
      case 'image-vectorizer':
        return <ImageVectorizer />;
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
      case 'code-snapshot':
        return <CodeSnapshot />;
      case 'private-sketchpad':
        return <PrivateSketchpad />;
      case 'case-converter':
        return <CaseConverter />;
      case 'lorem-generator':
        return <LoremGenerator />;
      case 'image-cropper':
        return <ImageCropper />;
      case 'date-calculator':
        return <DateCalculator />;
      case 'privacy-policy':
        return <PrivacyPolicy />;
      case 'terms-of-service':
        return <TermsOfService />;
      case 'about-us':
        return <AboutUs />;
      case 'guides':
        return <Guides onTabChange={handleTabChange} />;
      default:
        return <Dashboard onTabChange={handleTabChange} />;
    }
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-slate-100 flex flex-col lg:flex-row relative overflow-x-hidden transition-all duration-500 ${activeTheme === 'cobalt' ? 'theme-cobalt' : 'theme-crimson'}`}>
      {/* Dynamic hardware-accelerator drift ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full blur-[160px] opacity-40 mix-blend-screen pointer-events-none"
          style={{ backgroundColor: 'var(--theme-glow)' }}
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute bottom-[-20%] right-[-15%] w-[65vw] h-[65vw] max-w-[900px] max-h-[900px] rounded-full blur-[180px] opacity-25 mix-blend-screen pointer-events-none"
          style={{ backgroundColor: 'var(--theme-glow)' }}
          animate={{
            x: [0, -30, 50, 0],
            y: [0, 40, -40, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Mobile Sticky Top Header (Visible only on screens < 1024px) */}
      <div className="lg:hidden w-full bg-[#060608]/90 backdrop-blur-md border-b border-brand-border/30 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30 transition-all duration-500">
        <button
          onClick={() => handleTabChange('dashboard')}
          className="flex items-center gap-3 cursor-pointer group hover:opacity-95 active:scale-95 transition-all text-left focus:outline-none"
          title="Return to Home Dashboard"
        >
          <div className="relative flex items-center justify-center w-8.5 h-8.5 rounded-lg bg-gradient-to-br from-brand/80 to-[#0e0c0c] border border-brand/30 shadow-[0_0_10px_var(--theme-glow)] shrink-0 transition-all duration-300 group-hover:shadow-[0_0_15px_var(--theme-glow)]">
            <span className="font-heading font-bold text-white tracking-widest text-base">A</span>
          </div>
          <div className="flex items-center">
            <h1 className="font-heading font-black text-lg sm:text-xl tracking-wider uppercase color-shift-text-3d select-none">
              APEX UTILITY
            </h1>
          </div>
        </button>
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
      <main className={`flex-1 lg:ml-64 p-4 sm:p-8 min-h-screen relative z-10 max-w-7xl w-full transition-all duration-700 ${isThemeTransitioning ? 'theme-switching-active' : ''}`}>
        <div className="absolute top-8 right-8 font-mono text-[9px] text-zinc-500 uppercase tracking-widest hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b0b0e] border border-zinc-900/60 pointer-events-none transition-all duration-500">
          <span className="w-1.5 h-1.5 rounded-full led-active animate-pulse transition-all duration-500" />
          <span>PORT INGRESS COMPILER: COMPLIANT</span>
        </div>

        {/* Sleek, responsive, physical/mechanical breadcrumb navigation trail with intelligent truncation */}
        <div 
          id="apex-breadcrumb-navigation-trail" 
          className={`mb-6 flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-lg bg-[#07070a]/80 backdrop-blur-md border border-brand-border/20 text-[10px] font-mono leading-none tracking-wide text-zinc-400 max-w-full overflow-hidden shadow-md select-none transition-all duration-300 ${
            isToolProcessing ? 'breadcrumb-pulse-glow' : ''
          }`}
        >
          <motion.button
            type="button"
            id="breadcrumb-home-link"
            onClick={() => handleTabChange('dashboard')}
            className="flex items-center gap-1 px-1.5 py-1 rounded bg-zinc-950/40 border border-zinc-900/40 hover:border-brand/40 text-zinc-400 hover:text-brand transition-all cursor-pointer hover:bg-[#111116] focus:outline-none hover:shadow-[0_0_10px_var(--theme-glow-intense)] duration-300 shrink-0"
            title={t.navigation.dashboard || 'Return to Control Deck'}
            whileHover={{ scale: 1.03, boxShadow: '0 0 10px var(--theme-primary)' }}
            whileTap={{ scale: 0.97 }}
          >
            <Home className="w-3 h-3 text-brand/80 shrink-0" />
            <span className="font-heading font-black text-[9px] uppercase tracking-wider hidden sm:inline">
              {CATEGORY_LOCALIZATIONS[language as keyof typeof CATEGORY_LOCALIZATIONS]?.home || 'Control Deck'}
            </span>
            <span className="font-heading font-black text-[9px] uppercase tracking-wider inline sm:hidden">
              {language === 'en' ? 'Ctrl' : CATEGORY_LOCALIZATIONS[language as keyof typeof CATEGORY_LOCALIZATIONS]?.home?.slice(0, 5) || 'Home'}
            </span>
          </motion.button>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="flex items-center gap-1.5"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                },
                exit: {
                  opacity: 0,
                  transition: {
                    staggerChildren: 0.03,
                    staggerDirection: -1
                  }
                }
              }}
            >
              {activeTab !== 'dashboard' ? (
                <>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      visible: { opacity: 1, x: 0 },
                      exit: { opacity: 0, x: 4 }
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  >
                    <BreadcrumbSeparator />
                  </motion.div>
                  
                  {TAB_CATEGORY_MAP[activeTab] && CATEGORY_LOCALIZATIONS[language as keyof typeof CATEGORY_LOCALIZATIONS]?.[TAB_CATEGORY_MAP[activeTab] as keyof typeof CATEGORY_LOCALIZATIONS['en']] && (
                    <>
                      <motion.div
                        variants={{
                          hidden: { opacity: 0, x: -8 },
                          visible: { opacity: 1, x: 0 },
                          exit: { opacity: 0, x: 4 }
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        whileHover={{ scale: 1.02, boxShadow: '0 0 10px var(--theme-glow-intense)' }}
                        className="flex items-center gap-1 px-1.5 py-1 text-zinc-500 hover:text-brand/85 rounded bg-zinc-950/20 border border-zinc-900/20 hover:border-brand-border/40 hover:bg-[#111116]/30 transition-all cursor-pointer hover:shadow-[0_0_10px_var(--theme-glow-semi)] duration-300"
                        title={CATEGORY_LOCALIZATIONS[language as keyof typeof CATEGORY_LOCALIZATIONS]?.[TAB_CATEGORY_MAP[activeTab] as keyof typeof CATEGORY_LOCALIZATIONS['en']]}
                      >
                        <Folder className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="font-heading font-bold text-[8.5px] uppercase tracking-wider font-mono hidden sm:inline">
                          {CATEGORY_LOCALIZATIONS[language as keyof typeof CATEGORY_LOCALIZATIONS]?.[TAB_CATEGORY_MAP[activeTab] as keyof typeof CATEGORY_LOCALIZATIONS['en']]}
                        </span>
                        <span className="font-heading font-bold text-[8.5px] uppercase tracking-wider font-mono inline sm:hidden max-w-[50px] xs:max-w-[75px] truncate block">
                          {getAbbreviatedCategoryName(TAB_CATEGORY_MAP[activeTab])}
                        </span>
                      </motion.div>

                      <motion.div
                        variants={{
                          hidden: { opacity: 0, x: -8 },
                          visible: { opacity: 1, x: 0 },
                          exit: { opacity: 0, x: 4 }
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      >
                        <BreadcrumbSeparator />
                      </motion.div>
                    </>
                  )}

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -12, scale: 0.95 },
                      visible: { opacity: 1, x: 0, scale: 1 },
                      exit: { opacity: 0, x: 8, scale: 0.95 }
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    whileHover={{ scale: 1.03, boxShadow: '0 0 12px var(--theme-primary)' }}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#0b0b0e] border border-brand-border/40 text-brand font-black tracking-wider uppercase shadow-[0_0_8px_var(--theme-glow)] hover:border-brand-border/80 transition-all cursor-pointer duration-300"
                    title={getToolDisplayName(activeTab)}
                  >
                    <span className="w-1 h-1 rounded-full bg-brand led-active animate-pulse shrink-0" />
                    <span className="font-heading text-[9px] hidden sm:inline">
                      {getToolDisplayName(activeTab)}
                    </span>
                    <span className="font-heading text-[9px] inline sm:hidden max-w-[65px] xs:max-w-[95px] truncate block">
                      {getAbbreviatedToolName(activeTab)}
                    </span>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      visible: { opacity: 1, x: 0 },
                      exit: { opacity: 0, x: 4 }
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  >
                    <BreadcrumbSeparator />
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -12, scale: 0.95 },
                      visible: { opacity: 1, x: 0, scale: 1 },
                      exit: { opacity: 0, x: 8, scale: 0.95 }
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    whileHover={{ scale: 1.03, boxShadow: '0 0 12px rgba(16, 185, 129, 0.35)' }}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#0a0c0a] border border-emerald-500/20 text-emerald-400 font-extrabold tracking-wider uppercase hover:border-emerald-500/50 hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all cursor-pointer duration-300"
                  >
                    <span className="w-1 h-1 rounded-full bg-emerald-500 led-active animate-pulse shrink-0" />
                    <span className="font-heading text-[9px] hidden sm:inline">
                      {CATEGORY_LOCALIZATIONS[language as keyof typeof CATEGORY_LOCALIZATIONS]?.home || 'Control Deck'}
                    </span>
                    <span className="font-heading text-[9px] inline sm:hidden max-w-[65px] xs:max-w-[95px] truncate block">
                      {language === 'en' ? 'Ctrl Deck' : (CATEGORY_LOCALIZATIONS[language as keyof typeof CATEGORY_LOCALIZATIONS]?.home || 'Control').slice(0, 9)}
                    </span>
                  </motion.div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="w-[1px] h-3 bg-zinc-800 self-center mx-1 shrink-0" />

          <motion.button
            type="button"
            id="breadcrumb-copy-path-button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                setCopiedPath(true);
                setTimeout(() => setCopiedPath(false), 2000);
              } catch (err) {
                console.error("Failed to copy path: ", err);
              }
            }}
            className={`flex items-center gap-1 px-1.5 py-1 rounded bg-zinc-950/40 border transition-all cursor-pointer hover:bg-[#111116] focus:outline-none shrink-0 duration-300 ${
              copiedPath
                ? 'border-emerald-500/45 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                : 'border-zinc-900/40 hover:border-brand/40 text-zinc-500 hover:text-brand hover:shadow-[0_0_8px_var(--theme-glow-semi)]'
            }`}
            title={copiedPath ? 'Path Copied!' : 'Copy Current URL Path'}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {copiedPath ? (
              <Check className="w-3 h-3 text-emerald-400 shrink-0" strokeWidth={2.5} />
            ) : (
              <Copy className="w-3 h-3 shrink-0 text-zinc-500 hover:text-brand" strokeWidth={2} />
            )}
            <span className="font-heading font-black text-[8px] uppercase tracking-wider hidden xs:inline">
              {copiedPath ? 'Copied' : 'Copy Path'}
            </span>
          </motion.button>
        </div>

        {/* Workspace views rendered with smooth 3D slides inside AnimatePresence */}
        <div className="pt-2 lg:pt-4" id="apex-workspace-viewport">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'top center', willChange: 'transform, opacity' }}
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>

          {activeTab !== 'dashboard' && (
            <ToolLandingIsland toolId={activeTab} onTabChange={handleTabChange} />
          )}

          {/* Compliant Global Legal Footer Block (AdSense Mandatory Linkages) */}
          <footer className="mt-16 pt-8 border-t border-brand-border/20 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4 text-zinc-500 font-sans text-xs pb-6 relative z-20">
            <div className="space-y-1">
              <p className="font-heading text-xs font-black text-white tracking-widest uppercase">
                APEX UTILITY LABS
              </p>
              <p className="text-[11px] text-zinc-600 font-mono">
                © {new Date().getFullYear()} <span className="text-zinc-500">apexutility.live</span> • Client-Side WASM Engine • APEX UTILITY WORKSTATION
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-[11px] font-mono tracking-wider">
              <button 
                onClick={() => handleTabChange('guides')} 
                className={`transition-colors cursor-pointer border-b pb-0.5 ${activeTab === 'guides' ? 'text-brand border-brand font-extrabold' : 'text-zinc-500 hover:text-brand border-transparent'}`}
                title="Browse our structural optimization and security guides"
              >
                GUIDES & BLOG
              </button>
              <button 
                onClick={() => handleTabChange('about-us')} 
                className={`transition-colors cursor-pointer border-b pb-0.5 ${activeTab === 'about-us' ? 'text-brand border-brand font-extrabold' : 'text-zinc-500 hover:text-brand border-transparent'}`}
                title="Read about the founding developers and correspond securely"
              >
                ABOUT & CONTACT
              </button>
              <button 
                onClick={() => handleTabChange('privacy-policy')} 
                className={`transition-colors cursor-pointer border-b pb-0.5 ${activeTab === 'privacy-policy' ? 'text-brand border-brand font-extrabold' : 'text-zinc-500 hover:text-brand border-transparent'}`}
                title="Review our Google AdSense, DoubleClick Cookie, CCPA, and GDPR compliance policies"
              >
                PRIVACY POLICY
              </button>
              <button 
                onClick={() => handleTabChange('terms-of-service')} 
                className={`transition-colors cursor-pointer border-b pb-0.5 ${activeTab === 'terms-of-service' ? 'text-brand border-brand font-extrabold' : 'text-zinc-500 hover:text-brand border-transparent'}`}
                title="Inspect our AS-IS software operations release of liability"
              >
                TERMS OF SERVICE
              </button>
            </div>
          </footer>
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

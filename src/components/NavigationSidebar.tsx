import React, { useState, useEffect } from 'react';
import { LayoutGrid, FileText, Image as ImageIcon, FileImage, Braces, Globe, Terminal, ShieldCheck, Settings, Search, Layers, Monitor, Trash2, Plus, Check, X, Sparkles, Download, Upload, QrCode, Scale, FileCode, Sliders, GitPullRequest, Hash, Palette, Gauge, Binary, Regex, ArrowLeftRight, Shrink, Database, Volume2, Mic, Eye, Video, PenTool, VolumeX, Music, Type, AlignLeft, Crop, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { usePresets } from '../context/PresetContext';
import BackupRestoreModal from './BackupRestoreModal';
import { startFocusSound, stopFocusSound, setFocusSoundVolume, getActiveFocusSound } from '../utils/focusSoundEngine';

const ambientLabels = {
  en: {
    title: 'Ambient Focus Noise',
    volume: 'Level',
    noise: 'White Noise',
    rain: 'Rainfall',
    beats: 'Focus Beats',
    stop: 'Silence'
  },
  es: {
    title: 'Enfoque de Ambiente',
    volume: 'Nivel',
    noise: 'Ruido Blanco',
    rain: 'Lluvia',
    beats: 'Pulsos Focus',
    stop: 'Silencio'
  },
  fr: {
    title: 'Ambiance Focus',
    volume: 'Niveau',
    noise: 'Bruit Blanc',
    rain: 'Pluie',
    beats: 'Ondes Alpha',
    stop: 'Silence'
  },
  de: {
    title: 'Fokus-Geräusche',
    volume: 'Pegel',
    noise: 'Rauschen',
    rain: 'Regen',
    beats: 'Mental-Beats',
    stop: 'Stumm'
  },
  pt: {
    title: 'Foco de Ambiente',
    volume: 'Nível',
    noise: 'Ruído Branco',
    rain: 'Chuva',
    beats: 'Sons Alpha',
    stop: 'Silêncio'
  }
};


interface NavigationSidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
  theme: 'crimson' | 'cobalt' | 'auto';
  onThemeChange: (theme: 'crimson' | 'cobalt' | 'auto') => void;
  onSearchClick: () => void;
}

export default function NavigationSidebar({ activeTab, onTabChange, isMobileOpen, onClose, theme, onThemeChange, onSearchClick }: NavigationSidebarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [secretDevMode, setSecretDevMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('apex_secret_dev_mode') === 'true';
    } catch (_) {
      return false;
    }
  });

  const toggleSecretDevMode = () => {
    const nextVal = !secretDevMode;
    setSecretDevMode(nextVal);
    try {
      localStorage.setItem('apex_secret_dev_mode', String(nextVal));
    } catch (_) {}
  };

  const { language, setLanguage, t } = useLanguage();

  const [activeSound, setActiveSound] = useState<'noise' | 'rain' | 'beats' | null>(null);
  const [ambientVolume, setAmbientVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('apex_ambient_volume');
      return saved !== null ? parseFloat(saved) : 0.5;
    } catch (e) {
      return 0.5;
    }
  });

  useEffect(() => {
    // Synchronize UI with background service engine upon sidebar mount
    setActiveSound(getActiveFocusSound());
  }, []);

  const handleSoundToggle = (type: 'noise' | 'rain' | 'beats') => {
    if (activeSound === type) {
      stopFocusSound();
      setActiveSound(null);
    } else {
      startFocusSound(type, ambientVolume);
      setActiveSound(type);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setAmbientVolume(newVol);
    setFocusSoundVolume(newVol);
    try {
      localStorage.setItem('apex_ambient_volume', newVol.toString());
    } catch (_) {}
  };

  const handleMute = () => {
    stopFocusSound();
    setActiveSound(null);
  };
  const { presets, activePresetId, loadPreset, saveNewPreset, deletePreset } = usePresets();
  const [newPresetName, setNewPresetName] = useState('');
  const [backupStatus, setBackupStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 1024);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleExportBackup = () => {
    try {
      const keysToBackup = [
        'apex_custom_presets',
        'apex_recent_ops',
        'apex_active_settings',
        'apex_active_preset_id',
        'apex_language',
        'apex_theme_mode',
        'apex_theme',
        'apex_dashboard_layout'
      ];
      
      const backupData: Record<string, string | null> = {};
      keysToBackup.forEach((key) => {
        backupData[key] = localStorage.getItem(key);
      });
      
      const payload = {
        app: 'APEX UTILITY',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        data: backupData
      };
      
      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `apex_utility_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setBackupStatus({ message: 'Backup exported successfully!', type: 'success' });
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (error) {
      console.error('Error exporting backup:', error);
      setBackupStatus({ message: 'Export failed!', type: 'error' });
      setTimeout(() => setBackupStatus(null), 4000);
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON format');
        }
        
        const sourceData = parsed.data || parsed;
        if (typeof sourceData !== 'object' || sourceData === null) {
          throw new Error('Data payload missing or invalid');
        }

        const keysToImport = [
          'apex_custom_presets',
          'apex_recent_ops',
          'apex_active_settings',
          'apex_active_preset_id',
          'apex_language',
          'apex_theme_mode',
          'apex_theme',
          'apex_dashboard_layout'
        ];

        let importCount = 0;
        keysToImport.forEach((key) => {
          if (key in sourceData) {
            const value = sourceData[key];
            if (value === null) {
              localStorage.removeItem(key);
            } else if (typeof value === 'string') {
              localStorage.setItem(key, value);
              importCount++;
            } else {
              localStorage.setItem(key, JSON.stringify(value));
              importCount++;
            }
          }
        });

        if (importCount === 0) {
          throw new Error('No valid APEX database keys found.');
        }

        setBackupStatus({ message: 'State imported! Re-initializing...', type: 'success' });
        setTimeout(() => {
          window.location.reload();
        }, 1200);

      } catch (err: any) {
        console.error('Import backup failure:', err);
        setBackupStatus({ 
          message: err.message || 'Invalid config file format.', 
          type: 'error' 
        });
        setTimeout(() => setBackupStatus(null), 5000);
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const menuItems = [
    { id: 'dashboard' as ActiveTab, label: t.navigation.dashboard, icon: LayoutGrid, description: t.navigation.dashboardDesc },
    { id: 'compress-pdf' as ActiveTab, label: t.navigation.compressPdf, icon: FileText, description: t.navigation.compressPdfDesc },
    { id: 'join-pdf' as ActiveTab, label: t.navigation.joinPdf, icon: Layers, description: t.navigation.joinPdfDesc },
    { id: 'image-to-pdf' as ActiveTab, label: t.navigation.imageToPdf, icon: FileImage, description: t.navigation.imageToPdfDesc },
    { id: 'webp-converter' as ActiveTab, label: t.navigation.webpConverter, icon: ImageIcon, description: t.navigation.webpConverterDesc },
    { id: 'json-beautifier' as ActiveTab, label: t.navigation.jsonBeautifier, icon: Braces, description: t.navigation.jsonBeautifierDesc },
    { id: 'sitemap-seo' as ActiveTab, label: t.navigation.sitemapSeo, icon: Globe, description: t.navigation.sitemapSeoDesc },
    { id: 'sitemap-generator' as ActiveTab, label: t.navigation.sitemapGenerator, icon: FileCode, description: t.navigation.sitemapGeneratorDesc },
    { id: 'ai-writer' as ActiveTab, label: t.navigation.aiWriter, icon: Sparkles, description: t.navigation.aiWriterDesc },
    { id: 'password-generator' as ActiveTab, label: t.navigation.passwordGenerator, icon: ShieldCheck, description: t.navigation.passwordGeneratorDesc },
    { id: 'qr-generator' as ActiveTab, label: t.navigation.qrGenerator, icon: QrCode, description: t.navigation.qrGeneratorDesc },
    { id: 'image-vectorizer' as ActiveTab, label: t.navigation.imageVectorizer, icon: Palette, description: t.navigation.imageVectorizerDesc },
    { id: 'unit-converter' as ActiveTab, label: t.navigation.unitConverter, icon: Scale, description: t.navigation.unitConverterDesc },
    { id: 'svg-rasterizer' as ActiveTab, label: t.navigation.svgRasterizer, icon: FileCode, description: t.navigation.svgRasterizerDesc },
    { id: 'batch-processor' as ActiveTab, label: t.navigation.batchProcessor, icon: Sliders, description: t.navigation.batchProcessorDesc },
    { id: 'json-diff' as ActiveTab, label: t.navigation.jsonDiff, icon: GitPullRequest, description: t.navigation.jsonDiffDesc },
    { id: 'secure-hash' as ActiveTab, label: t.navigation.secureHash, icon: Hash, description: t.navigation.secureHashDesc },
    { id: 'color-palette' as ActiveTab, label: t.navigation.colorPalette, icon: Palette, description: t.navigation.colorPaletteDesc },
    { id: 'digital-signature' as ActiveTab, label: t.navigation.digitalSignature, icon: PenTool, description: t.navigation.digitalSignatureDesc },
    { id: 'seo-optimizer' as ActiveTab, label: t.navigation.seoOptimizer, icon: Gauge, description: t.navigation.seoOptimizerDesc },
    { id: 'base64-converter' as ActiveTab, label: t.navigation.base64Converter, icon: Binary, description: t.navigation.base64ConverterDesc },
    { id: 'regex-tester' as ActiveTab, label: t.navigation.regexTester, icon: Regex, description: t.navigation.regexTesterDesc },
    { id: 'csv-json-converter' as ActiveTab, label: t.navigation.csvJsonConverter, icon: ArrowLeftRight, description: t.navigation.csvJsonConverterDesc },
    { id: 'image-compressor' as ActiveTab, label: t.navigation.imageCompressor, icon: Shrink, description: t.navigation.imageCompressorDesc },
    { id: 'quick-image-optimizer' as ActiveTab, label: t.navigation.quickImageOptimizer || 'Quick Image Optimizer', icon: FileImage, description: t.navigation.quickImageOptimizerDesc || 'Bulk resize, compress, and optimize custom image filenames for SEO compliance' },
    { id: 'rich-text-stats' as ActiveTab, label: t.navigation.richTextStats, icon: FileText, description: t.navigation.richTextStatsDesc },
    { id: 'audio-trimmer' as ActiveTab, label: t.navigation.audioTrimmer, icon: Volume2, description: t.navigation.audioTrimmerDesc },
    { id: 'ai-transcriber' as ActiveTab, label: t.navigation.aiTranscriber, icon: Mic, description: t.navigation.aiTranscriberDesc },
    { id: 'pdf-analyst' as ActiveTab, label: t.navigation.pdfAnalyst, icon: FileText, description: t.navigation.pdfAnalystDesc },
    { id: 'exif-stripper' as ActiveTab, label: t.navigation.exifStripper, icon: Eye, description: t.navigation.exifStripperDesc },
    { id: 'video-recorder' as ActiveTab, label: t.navigation.videoRecorder, icon: Video, description: t.navigation.videoRecorderDesc },
    { id: 'code-snapshot' as ActiveTab, label: t.navigation.codeSnapshot, icon: FileCode, description: t.navigation.codeSnapshotDesc },
    { id: 'private-sketchpad' as ActiveTab, label: t.navigation.privateSketchpad, icon: PenTool, description: t.navigation.privateSketchpadDesc },
    { id: 'case-converter' as ActiveTab, label: t.navigation.caseConverter, icon: Type, description: t.navigation.caseConverterDesc },
    { id: 'lorem-generator' as ActiveTab, label: t.navigation.loremGenerator, icon: AlignLeft, description: t.navigation.loremGeneratorDesc },
    { id: 'image-cropper' as ActiveTab, label: t.navigation.imageCropper, icon: Crop, description: t.navigation.imageCropperDesc },
    { id: 'date-calculator' as ActiveTab, label: t.navigation.dateCalculator, icon: Calendar, description: t.navigation.dateCalculatorDesc },
    { id: 'content-planner' as ActiveTab, label: t.navigation.contentPlanner || 'AI Content Planner', icon: Sparkles, description: t.navigation.contentPlannerDesc || 'Analyze search intent, LSI keywords and generate outlines' },
    { id: 'schema-generator' as ActiveTab, label: t.navigation.schemaGenerator || 'JSON-LD Schema Generator', icon: Braces, description: t.navigation.schemaGeneratorDesc || 'Generate search-optimized JSON-LD schema markup templates or let AI extract microdata automatically' },
    { id: 'content-gap' as ActiveTab, label: t.navigation.contentGap || 'Competitor Content-Gap Analyzer', icon: ArrowLeftRight, description: t.navigation.contentGapDesc || 'Unveil missing keyword opportunities and head-to-head structural topical gaps vs competitors' },
    { id: 'robots-txt' as ActiveTab, label: 'Robots.txt Generator', icon: FileCode, description: 'Create and validate SEO-friendly web spider crawler instructions' },
    { id: 'dns-lookup' as ActiveTab, label: 'Dynamic DNS Resolver', icon: Globe, description: 'Extract and inspect global nameserver DNS registry records' },
    { id: 'user-agent' as ActiveTab, label: 'User-Agent Parser', icon: Terminal, description: 'Deconstruct and identify active browser client-agent strings' },
    { id: 'html-markdown' as ActiveTab, label: 'HTML &lt;&gt; Markdown', icon: FileText, description: 'Seamlessly convert markup between Markdown syntax and HTML tags' },
    { id: 'meta-tags' as ActiveTab, label: 'Meta Tags Optimizer', icon: Sliders, description: 'Preview page meta tags snippets for Google, Facebook, and Twitter' },
  ];

  return (
    <motion.aside
      initial={isMobile ? { x: '100%' } : false}
      animate={isMobile ? { x: isMobileOpen ? '0%' : '100%' } : { x: '0%' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 h-screen w-64 bg-[#060608]/98 backdrop-blur-md p-6 flex flex-col justify-between z-40 right-0 left-auto border-l border-brand-border/30 lg:left-0 lg:right-auto lg:border-r lg:border-l-0`}
    >
      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 pb-4 min-h-0">
        {/* Master Branding Logo Plate with settings gear */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-brand-border/35">
          <button
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-95 active:scale-[0.98] transition-all text-left focus:outline-none"
            title="Return to Home Dashboard"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-brand/20 to-[#0e0c0c] border border-brand/30 shadow-[0_0_15px_var(--theme-glow)] transition-all duration-500 group-hover:shadow-[0_0_20px_var(--theme-glow)] overflow-hidden">
              <img src="/favicon.svg" alt="APEX Logo" className="w-full h-full p-0.5 object-contain transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
            </div>
            <div className="flex items-center relative">
              <h1 className="font-heading font-black text-base tracking-wider uppercase color-shift-text-3d select-none">
                {secretDevMode ? '🌌 APEX MATRIX' : 'APEX UTILITY'}
              </h1>
              {/* Invisible Secret Toggle Overlay */}
              <button
                type="button"
                id="sidebar-invisible-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSecretDevMode();
                }}
                className="absolute inset-0 w-full h-full bg-transparent border-none outline-none opacity-0 cursor-default"
                title="System Diagnostic Access"
                aria-label="Secret Diagnostics Toggle"
              />
            </div>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800 hover:border-brand/40 text-zinc-400 hover:text-brand transition-all cursor-pointer"
              title="Configure System Aesthetics & Language"
            >
              <Settings className={`w-4 h-4 transition-transform duration-700 ${showSettings ? 'rotate-90 text-brand' : ''}`} />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded bg-zinc-900/60 border border-zinc-800 hover:border-brand/40 text-zinc-400 hover:text-brand transition-all cursor-pointer"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Technical Command Search Trigger */}
        <div className="mb-4">
          <button
            onClick={onSearchClick}
            className="w-full h-8.5 px-3 rounded bg-zinc-950/80 hover:bg-[#0c0c10] border border-zinc-900/90 hover:border-brand/40 text-zinc-500 hover:text-zinc-300 flex items-center justify-between text-[11px] font-mono transition-all duration-300 cursor-pointer group"
            title="Global mechanical console query panel (Ctrl+K)"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-zinc-600 group-hover:text-brand transition-colors duration-300" />
              <span className="tracking-wide">{t.common.searchPlaceholder}</span>
            </div>
            <div className="flex items-center gap-1 bg-[#050505] px-1.5 py-0.5 rounded border border-zinc-900 text-[9px] font-mono text-zinc-500 group-hover:text-brand-light">
              <span className="text-[10px] scale-90">⌘</span>
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Dynamic Aesthetics Selector Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="beveled-panel bg-[#0d0d12]/95 border-brand-border p-3 space-y-2.5 transition-all duration-500">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{t.settings.title}</span>
                  <span className="font-mono text-[8px] text-zinc-600">{t.settings.presets}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onThemeChange('crimson')}
                      className={`p-1.5 rounded flex flex-col items-center gap-1 border text-center transition-all cursor-pointer ${
                        theme === 'crimson'
                          ? 'bg-brand/10 border-brand text-brand shadow-[0_0_8px_var(--theme-glow)]'
                          : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-500 flex items-center justify-center border border-rose-300/30">
                        {theme === 'crimson' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="font-heading text-[9px] font-medium tracking-tight">Obsidian Crimson</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => onThemeChange('cobalt')}
                      className={`p-1.5 rounded flex flex-col items-center gap-1 border text-center transition-all cursor-pointer ${
                        theme === 'cobalt'
                          ? 'bg-brand/10 border-brand text-brand shadow-[0_0_8px_var(--theme-glow)]'
                          : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center border border-blue-300/30">
                        {theme === 'cobalt' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="font-heading text-[9px] font-medium tracking-tight">Steel Cobalt</span>
                    </button>
                  </div>

                  {/* Premium 'Sync with System' Toggle Switch */}
                  <div className="flex items-center justify-between p-2 rounded bg-zinc-950/40 border border-zinc-900/60 hover:bg-zinc-950/60 transition-all">
                    <div className="flex items-center gap-2 min-w-0">
                      <Monitor className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-300 ${theme === 'auto' ? 'text-brand' : 'text-zinc-500'}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="font-heading text-[9px] font-bold tracking-wider text-zinc-300 uppercase truncate">
                          {language === 'en' ? 'Sync with System' :
                           language === 'es' ? 'Sincronizar con Sistema' :
                           language === 'fr' ? 'Synchro Système' :
                           language === 'de' ? 'System-Synchronisation' :
                           'Sincronizar com Sistema'}
                        </span>
                        <span className="font-sans text-[7.5px] text-zinc-500 leading-none mt-0.5 truncate">
                          {language === 'en' ? 'Auto-toggle crimson/cobalt via OS preference' :
                           language === 'es' ? 'Alternancia automática según preferencia SO' :
                           language === 'fr' ? 'Alternance auto selon le système OS' :
                           language === 'de' ? 'Automatisch per OS-Einstellung wechseln' :
                           'Alternância automática conforme preferência do SO'}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      id="theme-sync-system-toggle"
                      onClick={() => onThemeChange(theme === 'auto' ? 'crimson' : 'auto')}
                      className={`relative inline-flex h-4 w-7.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        theme === 'auto' ? 'bg-brand' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          theme === 'auto' ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Language support block */}
                  <div className="pt-2 border-t border-brand-border/20 space-y-1">
                    <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8]/70 font-mono">
                      {t.settings.language}
                    </label>
                    <div className="relative flex items-center justify-between bg-zinc-950 border border-zinc-900 rounded px-2.5 py-2 hover:border-brand/35 transition-all">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-brand" />
                        <span className="text-[10px] text-zinc-400 font-mono uppercase">LANG</span>
                      </div>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        className="bg-transparent text-white font-sans text-xs focus:outline-none cursor-pointer uppercase font-bold tracking-wide text-right flex-1 pl-4"
                        style={{ border: 'none' }}
                      >
                        <option value="en" className="bg-[#0f0f13] text-white font-mono text-[11px]">EN — {t.settings.english}</option>
                        <option value="es" className="bg-[#0f0f13] text-white font-mono text-[11px]">ES — {t.settings.spanish}</option>
                        <option value="fr" className="bg-[#0f0f13] text-white font-mono text-[11px]">FR — {t.settings.french}</option>
                        <option value="de" className="bg-[#0f0f13] text-white font-mono text-[11px]">DE — {t.settings.german}</option>
                        <option value="pt" className="bg-[#0f0f13] text-white font-mono text-[11px]">PT — {t.settings.portuguese}</option>
                      </select>
                    </div>
                  </div>

                  {/* Active Configuration Presets Block */}
                  <div className="pt-2 border-t border-brand-border/20 space-y-1.5 align-left">
                    <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8]/70 font-mono">
                      Tool Presets Hub
                    </label>
                    <div className="space-y-1 max-h-[140px] overflow-y-auto pr-0.5 scrollbar-thin">
                      {presets.map((p) => {
                        const isActive = activePresetId === p.id;
                        return (
                          <div key={p.id} className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => loadPreset(p.id)}
                              className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded transition-all border text-left cursor-pointer ${
                                isActive
                                  ? 'bg-brand/10 border-brand text-brand shadow-[0_0_8px_var(--theme-glow)]'
                                  : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              <span className="text-[10px] font-mono capitalize truncate max-w-[120px]">{p.name}</span>
                              {isActive && <Check className="w-3 h-3 text-brand shrink-0 ml-1" />}
                            </button>
                            
                            {p.isCustom && (
                              <button
                                type="button"
                                onClick={() => deletePreset(p.id)}
                                className="p-1.5 rounded bg-red-950/10 border border-red-950/20 hover:border-red-500 hover:text-red-400 text-red-500 transition-all cursor-pointer shrink-0"
                                title="Delete Custom Preset"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-1.5 flex gap-1 items-center">
                      <input
                        type="text"
                        placeholder="Save as Preset..."
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-900 rounded px-2 py-1 text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-brand/40"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newPresetName.trim()) {
                            saveNewPreset(newPresetName);
                            setNewPresetName('');
                          }
                        }}
                        disabled={!newPresetName.trim()}
                        className="p-1.5 rounded bg-brand text-zinc-950 hover:bg-brand-hover hover:text-white disabled:opacity-30 disabled:hover:bg-brand disabled:hover:text-zinc-950 transition-all cursor-pointer shrink-0"
                        title="Save settings as named Preset"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Backup & Recovery Hub */}
                  <div className="pt-2 border-t border-brand-border/20 space-y-2.5 align-left">
                    <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8]/70 font-mono">
                      System Backup Hub
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsBackupModalOpen(true)}
                      className="w-full py-2 bg-gradient-to-r from-emerald-500/10 to-brand/5 hover:from-emerald-500/20 hover:to-brand/15 border border-emerald-500/25 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 font-sans text-[10.5px] font-bold tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/5 h-8.5"
                      title="Launch advanced visual selective backup and restore configuration utility."
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Backup & Move Studio</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleExportBackup}
                        className="py-1.5 px-2 bg-zinc-950 border border-zinc-900 hover:border-brand/40 text-[#94a3b8] hover:text-white rounded flex items-center justify-center gap-1.5 font-sans text-[10px] font-medium transition-all cursor-pointer hover:bg-brand/5"
                        title="Export all custom presets, recent files, and setup to an external JSON configuration backup."
                      >
                        <Download className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Export</span>
                      </button>
                      
                      <label
                        htmlFor="apex-backup-upload"
                        className="py-1.5 px-2 bg-zinc-950 border border-zinc-900 hover:border-brand/40 text-[#94a3b8] hover:text-white rounded flex items-center justify-center gap-1.5 font-sans text-[10px] font-medium transition-all cursor-pointer select-none text-center hover:bg-brand/5"
                        title="Import custom presets, recent history, and setup from an external JSON file."
                      >
                        <Upload className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="truncate">Import</span>
                      </label>
                      <input
                        id="apex-backup-upload"
                        type="file"
                        accept=".json"
                        onChange={handleImportBackup}
                        className="hidden"
                      />
                    </div>
                    {backupStatus && (
                      <div className={`text-[9.5px] font-mono py-1 px-1.5 rounded border text-center transition-all ${
                        backupStatus.type === 'success'
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-950/20 border-red-500/30 text-red-400'
                      }`}>
                        {backupStatus.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Mechanical Button Plates */}
        <nav className="space-y-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="w-full text-left focus:outline-none group relative block"
              >
                {/* 3D Physical Illusion Wrapper */}
                <motion.div
                  className={`beveled-panel p-3.5 transition-all duration-300 flex items-center gap-3.5 ${
                    isActive
                      ? 'border-brand bg-brand/10 shadow-[inner_0_0_12px_var(--theme-glow)]'
                      : 'border-zinc-800 hover:border-brand/40 hover:bg-[#0c0c10]'
                  }`}
                  whileHover={{ translateZ: 8 }}
                  whileTap={{ translateZ: -2 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div
                    className={`p-2 rounded-md transition-all duration-500 ${
                      isActive ? 'bg-brand/10 text-brand' : 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <p
                      className={`font-heading text-xs font-semibold tracking-wide transition-all duration-500 ${
                        isActive ? 'text-brand' : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="font-mono text-[9px] text-zinc-600 group-hover:text-zinc-500 mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  {/* Mechanical LED indicator */}
                  <div className="relative flex items-center justify-center w-2 h-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        isActive ? 'bg-brand led-active' : 'bg-zinc-800'
                      }`}
                    />
                  </div>
                </motion.div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Persistent Ambient focus generator */}
      <div className="border-t border-brand-border/20 pt-4 mt-2 px-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {activeSound ? (
              <span className="relative flex h-2 w-2 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
              </span>
            ) : (
              <Music className="w-3.5 h-3.5 text-zinc-500" />
            )}
            <span className="font-heading text-[10px] uppercase tracking-wider font-bold text-zinc-400">
              {ambientLabels[language as keyof typeof ambientLabels]?.title || ambientLabels.en.title}
            </span>
          </div>
          {activeSound && (
            <button
              onClick={handleMute}
              className="p-1 rounded hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-zinc-500 hover:text-brand transition-all cursor-pointer"
              title={ambientLabels[language as keyof typeof ambientLabels]?.stop || ambientLabels.en.stop}
            >
              <VolumeX className="w-3 h-3 text-red-500" />
            </button>
          )}
        </div>

        {/* 3 Option Plates */}
        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
          {(['noise', 'rain', 'beats'] as const).map((soundType) => {
            const isSelected = activeSound === soundType;
            return (
              <button
                key={soundType}
                type="button"
                onClick={() => handleSoundToggle(soundType)}
                className={`py-1 rounded text-[9px] font-mono border transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-brand/10 border-brand text-brand shadow-[0_0_8px_var(--theme-glow)] font-bold'
                    : 'bg-zinc-950/50 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
                }`}
              >
                {ambientLabels[language as keyof typeof ambientLabels]?.[soundType] || ambientLabels.en[soundType]}
              </button>
            );
          })}
        </div>

        {/* Volume Level bar slider */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={ambientVolume}
            onChange={handleVolumeChange}
            className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-brand"
            title="Adjust ambient level"
          />
          <span className="font-mono text-[8px] text-zinc-500 w-5 text-right shrink-0">
            {Math.round(ambientVolume * 100)}%
          </span>
        </div>
      </div>

      {/* Footer Technical Matrix Panel */}
      <div className="border-t border-brand-border/30 pt-6">
        <div className={`beveled-panel p-4 border-brand-border transition-all duration-500 relative overflow-hidden ${secretDevMode ? 'bg-zinc-950/45 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-[#0a0a0f]'}`}>
          {secretDevMode && (
            <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none animate-pulse" />
          )}
          <div className="flex items-center justify-between mb-2 relative">
            <div className="flex items-center gap-2">
              <Terminal className={`w-4.5 h-4.5 transition-colors duration-500 ${secretDevMode ? 'text-emerald-400 animate-bounce' : 'text-brand'}`} />
              <span className={`font-heading text-[11px] uppercase tracking-wider font-bold transition-colors duration-500 ${secretDevMode ? 'text-emerald-400' : 'text-brand animate-pulse'}`}>
                {secretDevMode ? 'Quantum Sandbox' : 'Local Sandbox'}
              </span>
            </div>
            {secretDevMode && (
              <span className="font-mono text-[8px] text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                SYS_OK
              </span>
            )}
          </div>
          <p className="font-mono text-[9px] leading-normal mb-2.5 relative transition-colors duration-500 text-zinc-400">
            {secretDevMode 
              ? 'Entropy rate: [0.9942] // RAM registers clear. Active pipeline: WebAssembly.'
              : 'Decentralized client-side pipeline. Files do not touch cloud nodes.'}
          </p>
          <div className="flex items-center gap-1.5 text-[9px] font-mono relative transition-colors duration-500 text-emerald-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{secretDevMode ? 'Quantum Protected & Isolated' : '100% Secure & Offline'}</span>
          </div>
        </div>
      </div>

      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onSuccess={(msg) => {
          setBackupStatus({ message: msg, type: 'success' });
          setTimeout(() => setBackupStatus(null), 5000);
        }}
        onError={(msg) => {
          setBackupStatus({ message: msg, type: 'error' });
          setTimeout(() => setBackupStatus(null), 5000);
        }}
      />
    </motion.aside>
  );
}

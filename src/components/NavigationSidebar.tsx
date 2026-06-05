import React, { useState } from 'react';
import { LayoutGrid, FileText, Image as ImageIcon, FileImage, Braces, Globe, Terminal, ShieldCheck, Settings, Search, Layers, Monitor, Trash2, Plus, Check, X, Sparkles, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { usePresets } from '../context/PresetContext';

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
  const { language, setLanguage, t } = useLanguage();
  const { presets, activePresetId, loadPreset, saveNewPreset, deletePreset } = usePresets();
  const [newPresetName, setNewPresetName] = useState('');
  const [backupStatus, setBackupStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleExportBackup = () => {
    try {
      const keysToBackup = [
        'apex_custom_presets',
        'apex_recent_ops',
        'apex_active_settings',
        'apex_active_preset_id',
        'apex_language',
        'apex_theme_mode',
        'apex_theme'
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
          'apex_theme'
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
    { id: 'ai-writer' as ActiveTab, label: t.navigation.aiWriter, icon: Sparkles, description: t.navigation.aiWriterDesc },
  ];

  return (
    <aside className={`fixed top-0 h-screen w-64 bg-[#060608]/98 backdrop-blur-md p-6 flex flex-col justify-between z-40 transition-transform duration-300 right-0 left-auto border-l border-brand-border/30 lg:left-0 lg:right-auto lg:border-r lg:border-l-0 ${isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
      <div>
        {/* Master Branding Logo Plate with settings gear */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-brand-border/35">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-brand/80 to-[#0e0c0c] border border-brand/30 shadow-[0_0_15px_var(--theme-glow)] transition-all duration-500">
              <span className="font-heading font-bold text-white tracking-widest text-lg">A</span>
              <div className="absolute inset-0 bg-white/10 rounded-lg animate-pulse" />
            </div>
            <div className="flex items-center">
              <h1 className="font-heading font-black text-base tracking-wider uppercase color-shift-text-3d select-none">
                APEX UTILITY
              </h1>
            </div>
          </div>

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

                  <button
                    type="button"
                    onClick={() => onThemeChange('auto')}
                    className={`w-full p-2 rounded flex items-center justify-between border transition-all cursor-pointer ${
                      theme === 'auto'
                        ? 'bg-brand/10 border-brand text-brand shadow-[0_0_8px_var(--theme-glow)]'
                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Monitor className="w-3.5 h-3.5" />
                      <span className="font-heading text-[9px] font-medium tracking-tight uppercase">{t.settings.systemTheme}</span>
                    </div>
                    <div className="relative flex items-center justify-center w-2 h-2 mr-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          theme === 'auto' ? 'bg-brand led-active animate-pulse' : 'bg-transparent'
                        }`}
                      />
                    </div>
                  </button>

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
                  <div className="pt-2 border-t border-brand-border/20 space-y-1.5 align-left">
                    <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8]/70 font-mono">
                      System Backup Hub
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleExportBackup}
                        className="py-1.5 px-2 bg-zinc-950 border border-zinc-900 hover:border-brand/40 text-[#94a3b8] hover:text-white rounded flex items-center justify-center gap-1.5 font-sans text-[10px] font-medium transition-all cursor-pointer hover:bg-brand/5"
                        title="Export all custom presets, recent files, and setup to an external JSON configuration backup."
                      >
                        <Download className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Export Backup</span>
                      </button>
                      
                      <label
                        htmlFor="apex-backup-upload"
                        className="py-1.5 px-2 bg-zinc-950 border border-zinc-900 hover:border-brand/40 text-[#94a3b8] hover:text-white rounded flex items-center justify-center gap-1.5 font-sans text-[10px] font-medium transition-all cursor-pointer select-none text-center hover:bg-brand/5"
                        title="Import custom presets, recent history, and setup from an external JSON file."
                      >
                        <Upload className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="truncate">Import Backup</span>
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

      {/* Footer Technical Matrix Panel */}
      <div className="border-t border-brand-border/30 pt-6">
        <div className="beveled-panel bg-[#0a0a0f] p-4 border-brand-border transition-all duration-500">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-4.5 h-4.5 text-brand transition-colors duration-500" />
            <span className="font-heading text-[11px] uppercase tracking-wider text-brand font-bold transition-colors duration-500 animate-pulse">Local Sandbox</span>
          </div>
          <p className="font-mono text-[9px] text-[#94a3b8] leading-normal mb-2.5">
            Decentralized client-side pipeline. Files do not touch cloud nodes.
          </p>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Secure & Offline</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

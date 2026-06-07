import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  Upload,
  RefreshCw,
  X,
  FileCode,
  ShieldCheck,
  AlertCircle,
  Clock,
  Info,
  CheckCircle,
  Database,
  Trash2,
  FileText,
  Sliders,
  Palette,
  LayoutGrid
} from 'lucide-react';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface ImportPreview {
  app: string;
  version?: string;
  exportedAt?: string;
  meta: {
    hasPresets: boolean;
    presetCount: number;
    hasActiveSettings: boolean;
    hasRecentOps: boolean;
    recentOpsCount: number;
    hasUiPrefs: boolean;
    themeDetected?: string;
    langDetected?: string;
    hasDashboardLayout: boolean;
  };
  rawPayload: any;
}

export default function BackupRestoreModal({ isOpen, onClose, onSuccess, onError }: BackupRestoreModalProps) {
  // Selective export state toggles
  const [exportPresets, setExportPresets] = useState(true);
  const [exportActiveSettings, setExportActiveSettings] = useState(true);
  const [exportUiPrefs, setExportUiPrefs] = useState(true);
  const [exportHistory, setExportHistory] = useState(true);
  const [exportLayout, setExportLayout] = useState(true);

  // Import staging files
  const [isDragging, setIsDragging] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importedPreview, setImportedPreview] = useState<ImportPreview | null>(null);
  const [importMergeMode, setImportMergeMode] = useState<'overwrite' | 'merge'>('merge');
  const [importError, setImportError] = useState<string | null>(null);

  // System statistics inside localStorage
  const [stats, setStats] = useState({
    presetsCount: 0,
    historyCount: 0,
    hasActiveSettings: false,
    themeMode: 'auto',
    lang: 'en',
    hasLayout: false
  });

  // Factory reset state
  const [confirmReset, setConfirmReset] = useState(false);

  // Calculate local stats on mount or when modal opens
  const calculateLocalStats = () => {
    try {
      const presetsRaw = localStorage.getItem('apex_custom_presets');
      const historyRaw = localStorage.getItem('apex_recent_ops');
      const activeSettingsRaw = localStorage.getItem('apex_active_settings');
      const lang = localStorage.getItem('apex_language') || 'en';
      const themeMode = localStorage.getItem('apex_theme_mode') || 'auto';
      const dashboardLayoutRaw = localStorage.getItem('apex_dashboard_layout');

      const presetsCount = presetsRaw ? JSON.parse(presetsRaw).length : 0;
      const historyCount = historyRaw ? JSON.parse(historyRaw).length : 0;

      setStats({
        presetsCount,
        historyCount,
        hasActiveSettings: !!activeSettingsRaw,
        themeMode,
        lang,
        hasLayout: !!dashboardLayoutRaw
      });
    } catch (e) {
      console.error('Failed to parse local metadata stats', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      calculateLocalStats();
      // Reset staging uploads when opened
      setImportFile(null);
      setImportedPreview(null);
      setImportError(null);
      setConfirmReset(false);
    }
  }, [isOpen]);

  // Compute live export data weight bytes
  const liveExportPayload = useMemo(() => {
    const backupData: Record<string, string | null> = {};

    if (exportPresets) {
      backupData['apex_custom_presets'] = localStorage.getItem('apex_custom_presets');
      backupData['apex_active_preset_id'] = localStorage.getItem('apex_active_preset_id');
    }
    if (exportActiveSettings) {
      backupData['apex_active_settings'] = localStorage.getItem('apex_active_settings');
    }
    if (exportUiPrefs) {
      backupData['apex_language'] = localStorage.getItem('apex_language');
      backupData['apex_theme_mode'] = localStorage.getItem('apex_theme_mode');
      backupData['apex_theme'] = localStorage.getItem('apex_theme');
    }
    if (exportHistory) {
      backupData['apex_recent_ops'] = localStorage.getItem('apex_recent_ops');
    }
    if (exportLayout) {
      backupData['apex_dashboard_layout'] = localStorage.getItem('apex_dashboard_layout');
    }

    const payload = {
      app: 'APEX UTILITY',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      creator: 'Yasinalam67@gmail.com',
      data: backupData
    };

    const strJson = JSON.stringify(payload, null, 2);
    // Estimate raw byte length
    const byteLength = new TextEncoder().encode(strJson).length;

    return {
      jsonString: strJson,
      sizeBytes: byteLength
    };
  }, [exportPresets, exportActiveSettings, exportUiPrefs, exportHistory, exportLayout]);

  const handleExportDownload = () => {
    try {
      const blob = new Blob([liveExportPayload.jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().slice(0, 10);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `apex_suite_backup_${today}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onSuccess('Custom presets and preferences exported successfully.');
    } catch (e: any) {
      onError(`Failed to download backup: ${e.message || 'unknown file failure'}`);
    }
  };

  // Safe validation and staging parsing for imported config
  const handleFileStaging = (file: File) => {
    setImportError(null);
    setImportedPreview(null);
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Config file is not a valid JSON structure.');
        }

        const sourceData = parsed.data || parsed;
        if (!sourceData || typeof sourceData !== 'object') {
          throw new Error('No configuration data found inside target payload.');
        }

        // Schema metrics checks
        const presetsRaw = sourceData['apex_custom_presets'];
        let presetCount = 0;
        try {
          if (presetsRaw) {
            presetCount = JSON.parse(presetsRaw).length;
          }
        } catch {}

        const recentRaw = sourceData['apex_recent_ops'];
        let recentCount = 0;
        try {
          if (recentRaw) {
            recentCount = JSON.parse(recentRaw).length;
          }
        } catch {}

        setImportedPreview({
          app: parsed.app || 'APEX UTILITY (Generic)',
          version: parsed.version || '1.0.0',
          exportedAt: parsed.exportedAt || 'Unknown Date',
          meta: {
            hasPresets: !!presetsRaw,
            presetCount,
            hasActiveSettings: !!sourceData['apex_active_settings'],
            hasRecentOps: !!recentRaw,
            recentOpsCount: recentCount,
            hasUiPrefs: !!sourceData['apex_language'] || !!sourceData['apex_theme_mode'],
            themeDetected: sourceData['apex_theme_mode'] ? String(sourceData['apex_theme_mode']).replace(/["]/g, '') : undefined,
            langDetected: sourceData['apex_language'] ? String(sourceData['apex_language']).replace(/["]/g, '') : undefined,
            hasDashboardLayout: !!sourceData['apex_dashboard_layout']
          },
          rawPayload: sourceData
        });

      } catch (err: any) {
        setImportError(err.message || 'Corrupt JSON parser configuration error.');
      }
    };

    reader.onerror = () => {
      setImportError('Failed to read configuration backup file.');
    };

    reader.readAsText(file);
  };

  // Drag handles
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileStaging(e.dataTransfer.files[0]);
    }
  };

  const handleApplyImport = () => {
    if (!importedPreview) return;

    try {
      const source = importedPreview.rawPayload;
      let importedCount = 0;

      // Rule: Handle Custom Presets Merge vs Overwrite
      if ('apex_custom_presets' in source) {
        const incomingRaw = source['apex_custom_presets'];
        if (incomingRaw) {
          const incomingObj = JSON.parse(incomingRaw);
          if (Array.isArray(incomingObj)) {
            if (importMergeMode === 'merge') {
              // Read existing custom presets
              const existingRaw = localStorage.getItem('apex_custom_presets');
              const existingObj = existingRaw ? JSON.parse(existingRaw) : [];
              
              // Filter duplicates by name or id
              const mergedObj = [...existingObj];
              incomingObj.forEach((p: any) => {
                if (!mergedObj.some((ex: any) => ex.name === p.name || ex.id === p.id)) {
                  mergedObj.push(p);
                }
              });

              localStorage.setItem('apex_custom_presets', JSON.stringify(mergedObj));
            } else {
              // Completely Overwrite
              localStorage.setItem('apex_custom_presets', incomingRaw);
            }
            importedCount++;
          }
        }
      }

      // Rest of simple parameters
      const simpleKeys = [
        'apex_active_settings',
        'apex_active_preset_id',
        'apex_language',
        'apex_theme_mode',
        'apex_theme',
        'apex_recent_ops',
        'apex_dashboard_layout'
      ];

      simpleKeys.forEach((key) => {
        if (key in source) {
          const value = source[key];
          if (value === null) {
            localStorage.removeItem(key);
          } else if (typeof value === 'string') {
            localStorage.setItem(key, value);
            importedCount++;
          } else {
            localStorage.setItem(key, JSON.stringify(value));
            importedCount++;
          }
        }
      });

      if (importedCount === 0) {
        throw new Error('This configuration package contains no compatible parameters.');
      }

      onSuccess('Preferences updated successfully! Re-initializing workstation environment...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err: any) {
      onError(`Workflow restore error: ${err.message || 'unknown sync'}`);
    }
  };

  // Clear workspace presets and defaults
  const handleFactoryReset = () => {
    try {
      const keysToClear = [
        'apex_custom_presets',
        'apex_recent_ops',
        'apex_active_settings',
        'apex_active_preset_id',
        'apex_language',
        'apex_theme_mode',
        'apex_theme',
        'apex_dashboard_layout',
        'apex_active_tab'
      ];

      keysToClear.forEach((k) => localStorage.removeItem(k));
      onSuccess('Workstation credentials wiped. Environment restarted.');
      
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (e: any) {
      onError(`Failed to flush workspace: ${e.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="apex-backup-move-studio" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#030305]/85 backdrop-blur-sm"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          className="relative max-w-4xl w-full max-h-[92vh] overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#08090c] shadow-[0_30px_70px_rgba(0,0,0,0.85)] flex flex-col z-10"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-900 bg-[#060609]/80 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider">Preferences & Move Studio</h3>
                <p className="font-sans text-[11px] text-zinc-500">Back up or seamlessly transfer all custom presets, layouts, and tools setups between devices.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-zinc-850 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
            
            {/* LEFT COLUMN: EXPORT CONFIG CREATION DECK (Col Span: 6) */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-4">
              <div className="bg-[#050508]/80 p-4 rounded-xl border border-zinc-900/90 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span className="font-heading text-xs font-bold text-white uppercase tracking-wider">Backup Config Deck</span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed leading-normal">
                  Toggle what elements of your browser system directory to package into your JSON configuration backup.
                </p>

                {/* Checklist options */}
                <div className="space-y-3">
                  
                  {/* Tool Presets Option */}
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-zinc-900/60 bg-zinc-950/40 hover:bg-zinc-950/80 cursor-pointer select-none transition">
                    <input
                      type="checkbox"
                      checked={exportPresets}
                      onChange={(e) => setExportPresets(e.target.checked)}
                      className="rounded border-zinc-800 bg-[#050508] text-emerald-400 focus:ring-0 focus:ring-offset-0 w-4 h-4 mt-0.5"
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1.5 font-sans text-[11.5px] font-bold text-zinc-200">
                        <Sliders className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Saved Tool Presets</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {stats.presetsCount} custom presets configured
                      </p>
                    </div>
                  </label>

                  {/* Active configs parameters Option */}
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-zinc-900/60 bg-zinc-950/40 hover:bg-zinc-950/80 cursor-pointer select-none transition">
                    <input
                      type="checkbox"
                      checked={exportActiveSettings}
                      onChange={(e) => setExportActiveSettings(e.target.checked)}
                      className="rounded border-zinc-800 bg-[#050508] text-emerald-400 focus:ring-0 focus:ring-offset-0 w-4 h-4 mt-0.5"
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1.5 font-sans text-[11.5px] font-bold text-zinc-200">
                        <FileCode className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Active Tool Parameters</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {stats.hasActiveSettings ? 'Standard values overridden' : 'Default settings applied'}
                      </p>
                    </div>
                  </label>

                  {/* Themes Aesthetics preferences Option */}
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-zinc-900/60 bg-zinc-950/40 hover:bg-zinc-950/80 cursor-pointer select-none transition">
                    <input
                      type="checkbox"
                      checked={exportUiPrefs}
                      onChange={(e) => setExportUiPrefs(e.target.checked)}
                      className="rounded border-zinc-800 bg-[#050508] text-emerald-400 focus:ring-0 focus:ring-offset-0 w-4 h-4 mt-0.5"
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1.5 font-sans text-[11.5px] font-bold text-zinc-200">
                        <Palette className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Aesthetic & Theme Preferences</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        Theme: {stats.themeMode.toUpperCase()} | Locale: {stats.lang.toUpperCase()}
                      </p>
                    </div>
                  </label>

                  {/* Past operations lists */}
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-zinc-900/60 bg-zinc-950/40 hover:bg-zinc-950/80 cursor-pointer select-none transition">
                    <input
                      type="checkbox"
                      checked={exportHistory}
                      onChange={(e) => setExportHistory(e.target.checked)}
                      className="rounded border-zinc-800 bg-[#050508] text-emerald-400 focus:ring-0 focus:ring-offset-0 w-4 h-4 mt-0.5"
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1.5 font-sans text-[11.5px] font-bold text-zinc-200">
                        <FileText className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Recent Operations Registry</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {stats.historyCount} historical processes saved
                      </p>
                    </div>
                  </label>

                  {/* Dashboard dynamic workspace layout ordering */}
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-zinc-900/60 bg-zinc-950/40 hover:bg-zinc-950/80 cursor-pointer select-none transition">
                    <input
                      type="checkbox"
                      checked={exportLayout}
                      onChange={(e) => setExportLayout(e.target.checked)}
                      className="rounded border-zinc-800 bg-[#050508] text-emerald-400 focus:ring-0 focus:ring-offset-0 w-4 h-4 mt-0.5"
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1.5 font-sans text-[11.5px] font-bold text-zinc-200">
                        <LayoutGrid className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Dashboard Panel Customizations</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {stats.hasLayout ? 'Custom positions saved' : 'Standard flow layout'}
                      </p>
                    </div>
                  </label>

                </div>

                {/* Interactive size estimation card */}
                <div className="p-3 rounded-xl border border-zinc-900 bg-zinc-950/70 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono text-zinc-455">Estimated File Weight</span>
                  </div>
                  <strong className="font-mono text-emerald-400">{formatBytes(liveExportPayload.sizeBytes)}</strong>
                </div>

              </div>

              {/* Master backup trigger download button */}
              <button
                type="button"
                onClick={handleExportDownload}
                disabled={!exportPresets && !exportActiveSettings && !exportUiPrefs && !exportHistory && !exportLayout}
                className="w-full py-3 px-4 rounded-xl font-heading text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-center gap-2 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <Download className="w-4 h-4 text-zinc-950 shrink-0" />
                <span>Download Configuration Backups</span>
              </button>
            </div>

            {/* RIGHT COLUMN: SECURE IMPORT STAGING ZONE (Col Span: 6) */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-4">
              
              <div className="bg-[#050508]/80 p-4 rounded-xl border border-zinc-900/90 flex-1 flex flex-col justify-between min-h-0 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#bf9443]" />
                    <span className="font-heading text-xs font-bold text-white uppercase tracking-wider">Device Restore Deck</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-650 shrink-0">Safe JSON Schema validation</span>
                </div>

                {!importFile ? (
                  /* Drag and drop playground block */
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`flex-1 min-h-[160px] border border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6 relative transition ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-500/[0.04]'
                        : 'border-zinc-800 bg-[#050508]/40 hover:bg-[#050508]/80'
                    }`}
                  >
                    <div className="pointer-events-none space-y-3">
                      <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-full w-fit mx-auto text-zinc-400">
                        <Upload className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-200 font-semibold">Drop backups or browse JSON file</p>
                        <p className="text-[9.5px] text-zinc-500 font-mono">Compatible file extension: .json</p>
                      </div>
                    </div>

                    <label htmlFor="apex-modal-import-uploader" className="absolute inset-0 cursor-pointer opacity-0 text-[0px]">
                      <input
                        id="apex-modal-import-uploader"
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileStaging(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                      Browse backup file
                    </label>
                  </div>
                ) : (
                  /* Review and validator output area */
                  <div className="flex-1 space-y-4 text-left min-h-0 overflow-y-auto">
                    
                    {importError ? (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl space-y-2 font-sans">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-300">
                          <AlertCircle className="w-4 h-4" />
                          <span>Validation Interrupted</span>
                        </div>
                        <p className="text-[11px] leading-relaxed font-mono">{importError}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setImportFile(null);
                            setImportedPreview(null);
                            setImportError(null);
                          }}
                          className="px-3 py-1 bg-zinc-950 border border-zinc-850 text-[10px] font-mono text-zinc-300 rounded hover:bg-zinc-900"
                        >
                          Clear & Retry Upload
                        </button>
                      </div>
                    ) : importedPreview ? (
                      /* Show Stage Preview Details Cards */
                      <div className="space-y-3.5">
                        <div className="p-3 rounded-lg bg-zinc-950 border border-emerald-500/10 flex justify-between items-center">
                          <div>
                            <span className="text-[9px] font-mono text-zinc-500 block">Package Signature</span>
                            <span className="text-[11.5px] font-sans font-extrabold text-white">{importedPreview.app}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-mono text-zinc-500 block">Version</span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">v{importedPreview.version}</span>
                          </div>
                        </div>

                        {/* Staged Data Checks */}
                        <div className="space-y-1.5 pt-1.5 border-t border-zinc-900">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">Configuration Contents found:</span>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                            
                            {/* Custom presets found */}
                            <div className="bg-[#050508] border border-zinc-900/80 p-2 rounded-lg flex items-center justify-between">
                              <span className="text-zinc-400">Presets:</span>
                              <strong className="text-zinc-200">
                                {importedPreview.meta.hasPresets ? `${importedPreview.meta.presetCount} units` : 'None'}
                              </strong>
                            </div>

                            {/* Active tools found */}
                            <div className="bg-[#050508] border border-zinc-900/80 p-2 rounded-lg flex items-center justify-between">
                              <span className="text-zinc-400">Tool Parameters:</span>
                              <strong className={importedPreview.meta.hasActiveSettings ? "text-emerald-400" : "text-zinc-500"}>
                                {importedPreview.meta.hasActiveSettings ? 'Detected' : 'None'}
                              </strong>
                            </div>

                            {/* UI preferences theme/lang */}
                            <div className="bg-[#050508] border border-zinc-900/80 p-2 rounded-lg flex items-center justify-between">
                              <span className="text-zinc-400">Aesthetics / Lang:</span>
                              <strong className={importedPreview.meta.hasUiPrefs ? "text-cyan-400 uppercase" : "text-zinc-500"}>
                                {importedPreview.meta.hasUiPrefs 
                                  ? `${importedPreview.meta.themeDetected || 'Cobalt'} / ${importedPreview.meta.langDetected || 'EN'}` 
                                  : 'None'}
                              </strong>
                            </div>

                            {/* Recent histories log length */}
                            <div className="bg-[#050508] border border-zinc-900/80 p-2 rounded-lg flex items-center justify-between">
                              <span className="text-zinc-400">Process History:</span>
                              <strong className="text-zinc-200 font-mono">
                                {importedPreview.meta.hasRecentOps ? `${importedPreview.meta.recentOpsCount} logs` : 'None'}
                              </strong>
                            </div>

                          </div>
                        </div>

                        {/* Date metadata timestamp */}
                        <div className="font-mono text-[9px] text-[#8492a6] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Export Timestamp: {new Date(importedPreview.exportedAt || '').toLocaleString()}</span>
                        </div>

                        {/* Merge or Overwrite option sliders */}
                        {importedPreview.meta.hasPresets && (
                          <div className="pt-2 border-t border-zinc-900 space-y-1.5">
                            <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-mono block">Preset Resolution Strategy</label>
                            <div className="flex bg-[#050508] border border-zinc-900 p-1 rounded-lg">
                              <button
                                type="button"
                                onClick={() => setImportMergeMode('merge')}
                                className={`flex-1 py-1.5 text-[10px] font-mono rounded-lg transition-all border ${
                                  importMergeMode === 'merge'
                                    ? 'bg-[#142323] border-[#34d399]/40 text-emerald-450 font-bold'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-350'
                                }`}
                              >
                                Merge Presets (Keep Existing)
                              </button>
                              <button
                                type="button"
                                onClick={() => setImportMergeMode('overwrite')}
                                className={`flex-1 py-1.5 text-[10px] font-mono rounded-lg transition-all border ${
                                  importMergeMode === 'overwrite'
                                    ? 'bg-[#291717] border-rose-500/40 text-rose-400 font-bold'
                                    : 'border-transparent text-zinc-500 hover:text-rose-500'
                                }`}
                              >
                                Overwrite Presets Wipes Entirely
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Secondary utility reset staging block */}
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setImportFile(null);
                              setImportedPreview(null);
                            }}
                            className="text-[10px] font-mono text-zinc-500 hover:text-rose-400 transition"
                          >
                            ✖ Discard File Loading Stage
                          </button>
                        </div>

                      </div>
                    ) : (
                      /* Staging is loading or calculating bytes */
                      <div className="flex flex-col items-center justify-center p-8 font-mono text-xs text-zinc-500 text-center space-y-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                        <span>Validating JSON configuration standards...</span>
                      </div>
                    )}

                  </div>
                )}

              </div>

              {/* Master apply configs restore trigger */}
              <button
                type="button"
                disabled={!importedPreview}
                onClick={handleApplyImport}
                className="w-full py-3 px-4 rounded-xl font-heading text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-center gap-2 bg-[#df9c2c] text-zinc-950 hover:bg-[#ffa710] shadow-[0_0_20px_rgba(242,156,17,0.1)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-zinc-950 shrink-0" />
                <span>Import & Overwrite Device Presets</span>
              </button>

            </div>

          </div>

          {/* Footnotes Panel and Hard reset buttons */}
          <div className="border-t border-zinc-900 bg-[#060609]/95 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            
            <div className="flex items-center gap-2 font-mono text-[9px] text-zinc-600 leading-normal max-w-lg">
              <Info className="w-3.5 h-3.5 text-brand shrink-0" />
              <span>Backups execute offline in browser RAM. Always backing up before wiping workspace variables is highly recommended.</span>
            </div>

            {/* Standard Wiping utilities resets */}
            <div className="shrink-0 relative">
              {confirmReset ? (
                <div className="flex gap-1.5 items-center bg-rose-950/20 border border-rose-500/30 p-1 rounded-lg">
                  <span className="font-mono text-[9px] text-rose-400 px-1 font-bold">WIPE DECK DIRECTORY COMPLETELY?</span>
                  <button
                    onClick={handleFactoryReset}
                    className="px-2 py-1 bg-rose-500 text-white text-[9.5px] font-bold rounded hover:bg-rose-650 transition cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-2 py-1 bg-zinc-900 text-zinc-350 text-[9.5px] font-bold rounded hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="px-3.5 py-1.5 border border-rose-500/10 text-rose-400 font-mono text-[9.5px] font-bold rounded-lg hover:bg-rose-500/5 hover:border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
                  title="Flush and reset local storage to clear environment completely."
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Factory Reset Workspace</span>
                </button>
              )}
            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

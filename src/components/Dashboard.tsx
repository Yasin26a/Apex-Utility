import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { FileDown, Image, Sparkles, Braces, ArrowRight, ShieldCheck, Zap, Globe, Cpu, Clock, Download, CheckCircle, FileText, FileImage, Trash2, Camera, Loader2, Search, Copy, Check, Info, Activity, AlertCircle, Layers } from 'lucide-react';
import { ActiveTab } from '../types';
import html2canvas from 'html2canvas';
import { getRecentOperations, getSessionDownloadUrl, RecentOperation } from '../utils/recentOperations';
import DashboardCaptureModal from './DashboardCaptureModal';
import { useLanguage } from '../context/LanguageContext';

interface DashboardProps {
  onTabChange: (tab: ActiveTab) => void;
}

// Interactive Tilt Card Component
function ThreeDTiltCard({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Map mouse coordinate ratios to rotation degrees
  const rotateX = useTransform(y, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 15px 35px var(--theme-glow)',
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`perspective-container cursor-pointer text-left ${className}`}
    >
      <div 
         className="beveled-panel p-6 h-full flex flex-col justify-between border-neutral-800/80 hover:border-brand/70 transition-colors duration-300"
        style={{ transform: 'translateZ(20px)' }}
      >
        {children}
      </div>
    </motion.div>
  );
}

export default function Dashboard({ onTabChange }: DashboardProps) {
  const { t } = useLanguage();
  const [recentOps, setRecentOps] = useState<RecentOperation[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'PDF Compression' | 'WebP Conversion' | 'Image to PDF'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => prev?.message === message ? null : prev);
    }, 4500);
  };

  const parseSizeToBytes = (sizeStr: string): number => {
    if (!sizeStr) return 0;
    const match = sizeStr.trim().match(/^([\d.]+)\s*(KB|MB|GB|B)?$/i);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();
    if (unit === 'KB') return val * 1024;
    if (unit === 'MB') return val * 1024 * 1024;
    if (unit === 'GB') return val * 1024 * 1024 * 1024;
    return val;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCopyFilename = (opId: string, filename: string) => {
    navigator.clipboard.writeText(filename).then(() => {
      setCopiedId(opId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Calculate cumulative stats from all recentOps in history
  const historyStats = React.useMemo(() => {
    let totalOriginal = 0;
    let totalNew = 0;
    let savingsCount = 0;

    recentOps.forEach((op) => {
      const orig = parseSizeToBytes(op.originalSize);
      const updated = parseSizeToBytes(op.newSize);
      
      if (orig > 0 && updated > 0) {
        totalOriginal += orig;
        totalNew += updated;
        savingsCount++;
      }
    });

    const totalSavedBytes = Math.max(0, totalOriginal - totalNew);
    const avgSavingsPercent = totalOriginal > 0 ? Math.round((totalSavedBytes / totalOriginal) * 100) : 0;

    return {
      totalSavedStr: formatBytes(totalSavedBytes),
      avgSavingsPercent,
      hasCompressionData: savingsCount > 0 && totalSavedBytes > 0
    };
  }, [recentOps]);

  const handleExportImage = () => {
    setIsCaptureModalOpen(true);
  };

  useEffect(() => {
    // Collect pre-existing processed files from localStorage
    setRecentOps(getRecentOperations());

    // Setup real-time callback when new transformations are generated
    const handleOpsChanged = () => {
      setRecentOps(getRecentOperations());
    };

    window.addEventListener('apex_recent_ops_updated', handleOpsChanged);
    return () => {
      window.removeEventListener('apex_recent_ops_updated', handleOpsChanged);
    };
  }, []);

  const clearSessionActivity = () => {
    try {
      localStorage.removeItem('apex_recent_ops');
      setRecentOps([]);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOps = recentOps.filter((op) => {
    const matchesSearch = op.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || op.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div id="workspace-dashboard-layout" className="space-y-12 p-1.5 rounded-2xl">
      {/* Premium Hero Banner */}
      <div id="dashboard-hero-banner" className="relative rounded-2xl border border-brand-border/40 bg-gradient-to-br from-[#0c0c10] to-[#050505] p-8 md:p-12 overflow-hidden shadow-2xl transition-all duration-500">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-all duration-700" style={{ backgroundColor: 'var(--theme-glow)', opacity: 0.6 }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none transition-all duration-700" style={{ backgroundColor: 'var(--theme-glow)', opacity: 0.4 }} />

        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold uppercase tracking-wider transition-all duration-500">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apex Processing Labs</span>
          </div>
          
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight uppercase">
            {t.dashboard.welcome}
          </h1>
          
          <p className="font-sans text-[#94a3b8] text-sm sm:text-base max-w-2xl leading-relaxed">
            {t.dashboard.subtitle}
          </p>

          <div className="pt-4 flex flex-wrap gap-4 font-mono text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Full Local Isolation</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>WASM-Engine Power</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800">
              <Globe className="w-4 h-4 text-emerald-500" />
              <span>100% Free Service</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Core Utilities Matrix */}
      <div id="dashboard-core-vault">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
          <div>
            <h2 className="font-heading text-xl font-bold text-white uppercase tracking-wider">Core Infrastructure Vault</h2>
            <p className="font-sans text-xs text-zinc-500">Select an operational terminal below to boot local processing canvas.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportImage}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#16161c] hover:bg-[#20202a] border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer"
              title="Save active workspace layout and metrics as a high-resolution PNG image"
            >
              <Camera className="w-3.5 h-3.5 text-brand" />
              <span>Export as Image</span>
            </button>
            <div className="flex items-center gap-2 text-brand text-xs font-mono font-bold bg-brand/10 px-3 py-1.5 rounded border border-brand/30 transition-all duration-500">
              <Cpu className="w-4 h-4 animate-spin [animation-duration:8s]" />
              <span>CHIPSETS: WASM CORE-ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {/* COLUMN A: Media Production Engine */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pl-2">
              <Image className="w-4.5 h-4.5 text-brand transition-colors duration-500" />
              <h3 className="font-heading text-xs uppercase font-bold text-[#f8fafc] tracking-widest">Media Lab</h3>
            </div>
            
            <ThreeDTiltCard onClick={() => onTabChange('webp-converter')} className="h-72">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Image className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">Interactive WebP Converter</h4>
                  <p className="font-sans text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                    Instantly read WebP vectors and convert to crisp PNG or compressed JPG quality locally.
                  </p>
                </div>
                <div className="border-t border-zinc-900 pt-3">
                  <p className="font-mono text-[9px] text-[#94a3b8] uppercase tracking-wider mb-1">Target Capability</p>
                  <p className="font-sans text-[11px] text-zinc-500 italic">"convert webp to jpg instantly without registration"</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-brand font-bold group-hover:text-brand transition-all duration-500 mt-4 pt-2 border-t border-brand-border/10">
                <span>Engage Canvas Engine</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </ThreeDTiltCard>
          </div>

          {/* COLUMN B: Document Optimization Forge */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pl-2">
              <FileDown className="w-4.5 h-4.5 text-brand transition-colors duration-500" />
              <h3 className="font-heading text-xs uppercase font-bold text-[#f8fafc] tracking-widest">Document Optimization</h3>
            </div>

            <ThreeDTiltCard onClick={() => onTabChange('compress-pdf')} className="h-72">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-red-400/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <FileDown className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">Smart PDF Compressor</h4>
                  <p className="font-sans text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                    Compress and structurally shrink document payload sizes without rasterization errors.
                  </p>
                </div>
                <div className="border-t border-zinc-900 pt-3">
                  <p className="font-mono text-[9px] text-[#94a3b8] uppercase tracking-wider mb-1">Target Capability</p>
                  <p className="font-sans text-[11px] text-zinc-500 italic">"compress pdf to 2mb for job application online free"</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-brand font-bold group-hover:text-brand transition-all duration-500 mt-4 pt-2 border-t border-brand-border/10">
                <span>Deploy Compressor Forge</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </ThreeDTiltCard>
          </div>

          {/* COLUMN C: Image to PDF Merge Module */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pl-2">
              <FileImage className="w-4.5 h-4.5 text-brand transition-colors duration-500" />
              <h3 className="font-heading text-xs uppercase font-bold text-[#f8fafc] tracking-widest">PDF Compilation</h3>
            </div>

            <ThreeDTiltCard onClick={() => onTabChange('image-to-pdf')} className="h-72">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FileImage className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">JPG/PNG to PDF Converter</h4>
                  <p className="font-sans text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                    Merge multiple JPG, JPEG, and PNG images into a single highly optimized PDF document locally.
                  </p>
                </div>
                <div className="border-t border-zinc-900 pt-3">
                  <p className="font-mono text-[9px] text-[#94a3b8] uppercase tracking-wider mb-1">Target Capability</p>
                  <p className="font-sans text-[11px] text-zinc-500 italic">"merge and compile raster designs into pdf portfolio"</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-brand font-bold group-hover:text-brand transition-all duration-500 mt-4 pt-2 border-t border-brand-border/10">
                <span>Engage Compilation Forge</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </ThreeDTiltCard>
          </div>

          {/* COLUMN D: PDF Joiner and Page Reordering */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pl-2">
              <Layers className="w-4.5 h-4.5 text-brand transition-colors duration-500" />
              <h3 className="font-heading text-xs uppercase font-bold text-[#f8fafc] tracking-widest">PDF Joiner</h3>
            </div>

            <ThreeDTiltCard onClick={() => onTabChange('join-pdf')} className="h-72">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">PDF Joiner & Reorder</h4>
                  <p className="font-sans text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                    Upload multiple existing PDF documents and merge them into a single file with page-by-page drag-and-drop reordering.
                  </p>
                </div>
                <div className="border-t border-zinc-900 pt-3">
                  <p className="font-mono text-[9px] text-[#94a3b8] uppercase tracking-wider mb-1">Target Capability</p>
                  <p className="font-sans text-[11px] text-zinc-500 italic">"combine multiple pdf documents and reorder pages free"</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-brand font-bold group-hover:text-brand transition-all duration-500 mt-4 pt-2 border-t border-brand-border/10">
                <span>Engage Joining Forge</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </ThreeDTiltCard>
          </div>

          {/* COLUMN D: Developer Operations Core */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pl-2">
              <Braces className="w-4.5 h-4.5 text-brand transition-colors duration-500" />
              <h3 className="font-heading text-xs uppercase font-bold text-[#f8fafc] tracking-widest">Developer Operations</h3>
            </div>

            <ThreeDTiltCard onClick={() => onTabChange('json-beautifier')} className="h-72">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Braces className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">JSON Parser & Beautifier</h4>
                  <p className="font-sans text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                    Validate structural arrays and format complex unreadable telemetry blocks instantly with clean layouts.
                  </p>
                </div>
                <div className="border-t border-zinc-900 pt-3">
                  <p className="font-mono text-[9px] text-[#94a3b8] uppercase tracking-wider mb-1">Target Capability</p>
                  <p className="font-sans text-[11px] text-zinc-500 italic">"format unreadable json data tool"</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-brand font-bold group-hover:text-brand transition-all duration-500 mt-4 pt-2 border-t border-brand-border/10">
                <span>Boot Formatting Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </ThreeDTiltCard>
          </div>

          {/* COLUMN F: AI Content Writer Engine */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pl-2">
              <Sparkles className="w-4.5 h-4.5 text-brand transition-colors duration-500" />
              <h3 className="font-heading text-xs uppercase font-bold text-[#f8fafc] tracking-widest">AI Copywriting</h3>
            </div>

            <ThreeDTiltCard onClick={() => onTabChange('ai-writer')} className="h-72">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">Apex AI Content Writer</h4>
                  <p className="font-sans text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                    Draft publications, articles, formal emails, or markdown instantly and refine their structure using Gemini.
                  </p>
                </div>
                <div className="border-t border-zinc-900 pt-3">
                  <p className="font-mono text-[9px] text-[#94a3b8] uppercase tracking-wider mb-1">Target Capability</p>
                  <p className="font-sans text-[11px] text-zinc-500 italic">"ai copywriter and professional editor"</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-brand font-bold group-hover:text-brand transition-all duration-500 mt-4 pt-2 border-t border-brand-border/10">
                <span>Boot Writing Forge</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </ThreeDTiltCard>
          </div>
        </div>
      </div>

      {/* Recent Files & Sandbox Downloads Ledger */}
      <div id="dashboard-files-ledger" className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/60 space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-brand-border/20 pb-5">
          <div className="space-y-1.5 flex-1 select-none">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand transition-colors duration-500 animate-pulse" />
              <h2 className="font-heading text-lg font-bold text-white uppercase tracking-wider">Recent Files Ledger</h2>
            </div>
            <p className="font-sans text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Durable local session registry auditing files processed in your browser. Active conversions can be re-downloaded instantly without repeating the WASM pipeline.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {recentOps.length > 0 && (
              <button
                onClick={clearSessionActivity}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-zinc-950 border border-zinc-800/80 text-xs font-mono font-bold text-zinc-400 hover:text-red-400 hover:border-red-900/50 transition-all cursor-pointer shadow-md select-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Format Ledger History</span>
              </button>
            )}
          </div>
        </div>

        {recentOps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
            {/* STAT A: Operations Audited */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-900/60 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-brand" />
                <span>Audited Transactions</span>
              </div>
              <div className="font-mono text-xl font-bold text-white flex items-baseline gap-1">
                <span>{recentOps.length}</span>
                <span className="text-zinc-600 text-xs font-normal">/ 5 max</span>
              </div>
            </div>

            {/* STAT B: Total Savings Metrics */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-900/60 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Local Optimizer Impact</span>
              </div>
              <div className="font-mono text-xl font-bold text-emerald-400 flex items-baseline gap-1.5">
                <span>{historyStats.hasCompressionData ? historyStats.totalSavedStr : "N/A"}</span>
                {historyStats.hasCompressionData && (
                  <span className="text-emerald-500 text-xs bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    ~{historyStats.avgSavingsPercent}% saved
                  </span>
                )}
              </div>
            </div>

            {/* STAT C: Registry Sandbox Durability */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-900/60 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                <span>Ledger Security Matrix</span>
              </div>
              <div className="font-mono text-xs font-bold text-zinc-300 h-7 flex items-center">
                <span className="bg-[#0c0c10] border border-brand/20 text-brand px-2 py-0.5 rounded text-[10px] uppercase font-semibold">
                  100% Client-Side Isolated
                </span>
              </div>
            </div>
          </div>
        )}

        {recentOps.length > 0 && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1 bg-[#09090d]/30 p-3 rounded-lg border border-zinc-900/50">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', 'PDF Compression', 'WebP Conversion', 'Image to PDF'] as const).map((type) => {
                const isActive = filterType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded text-xs font-heading font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-brand text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {type === 'All' ? 'All Formats' : type}
                  </button>
                );
              })}
            </div>

            {/* Live Search bar */}
            <div className="relative flex-1 max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Lookup processed files by name..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand/50 font-sans transition-colors"
              />
            </div>
          </div>
        )}

        {recentOps.length === 0 ? (
          <div className="py-16 text-center rounded-xl bg-zinc-950/25 border border-dashed border-zinc-900/60 max-w-lg mx-auto space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-500 border border-zinc-800/80 animate-pulse">
              <Clock className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="font-heading text-sm font-bold text-zinc-300">Sandbox Ledger Idle</p>
              <p className="font-sans text-xs text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                No files processed during this runtime loop. Initialize any process from the utility deck above to populate history.
              </p>
            </div>
            <div className="pt-2">
              <span className="font-mono text-[9px] text-zinc-600 bg-zinc-950 border border-zinc-900/80 px-2 py-1 rounded">
                DURABLE LOCALSTORAGE ENGINE STANDBY
              </span>
            </div>
          </div>
        ) : filteredOps.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-zinc-950/15 border border-dashed border-zinc-900/40 max-w-md mx-auto space-y-3">
            <div className="mx-auto w-10 h-10 rounded-full bg-zinc-900/50 flex items-center justify-center text-zinc-600">
              <Search className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="font-heading text-xs font-bold text-zinc-400">No matching operations found</p>
              <p className="font-sans text-[11px] text-zinc-500 mt-1">
                Refine your lookup keyword or format criteria.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredOps.map((op) => {
              const liveUrl = getSessionDownloadUrl(op.id);
              const isPdf = op.type === 'PDF Compression' || op.type === 'Image to PDF';
              const isImageToPdf = op.type === 'Image to PDF';
              const Icon = isImageToPdf ? FileImage : (isPdf ? FileText : Image);

              // Calculate individual conversion savings if any
              const origBytes = parseSizeToBytes(op.originalSize);
              const newBytes = parseSizeToBytes(op.newSize);
              const savedBytes = origBytes > newBytes ? origBytes - newBytes : 0;
              const individualSavingsPercent = origBytes > 0 && savedBytes > 0 
                ? Math.round((savedBytes / origBytes) * 100) 
                : 0;

              return (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="beveled-panel bg-zinc-950/45 border-zinc-900/50 hover:border-brand-border/20 p-4.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 transition-all duration-300"
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                    <div className={`p-3 rounded-xl border flex-shrink-0 ${
                      op.type === 'PDF Compression'
                        ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' 
                        : op.type === 'Image to PDF'
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                          : 'bg-orange-500/5 border-orange-500/20 text-orange-400'
                    }`}>
                      <Icon className="w-5.5 h-5.5" />
                    </div>
                    
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-xs font-bold text-white truncate max-w-[220px] sm:max-w-md block" title={op.name}>
                          {op.name}
                        </span>
                        
                        <span className={`font-mono text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${
                          op.type === 'PDF Compression'
                            ? 'bg-rose-950/25 border border-rose-900/35 text-rose-400' 
                            : op.type === 'Image to PDF'
                              ? 'bg-emerald-950/25 border border-emerald-900/35 text-emerald-400'
                              : 'bg-orange-950/25 border border-orange-900/35 text-orange-400'
                        }`}>
                          {op.type}
                        </span>
                        
                        <span className="font-mono text-[9px] text-zinc-600">
                          {op.timestamp}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-zinc-400 leading-none">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-600">Scale Delta:</span>
                          <span className="text-zinc-500 line-through">{op.originalSize}</span>
                          <span className="text-zinc-600">&rarr;</span>
                          <span className={`${savedBytes > 0 ? 'text-emerald-400 font-bold' : 'text-zinc-300 font-semibold'}`}>
                            {op.newSize}
                          </span>
                        </div>
                        
                        {individualSavingsPercent > 0 && (
                          <div className="flex items-center gap-1 text-emerald-500/90 font-medium bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] uppercase">
                            <span>-{individualSavingsPercent}%</span>
                            <span className="text-zinc-600 text-[8px] font-normal font-sans">Compacted</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:items-center justify-between lg:justify-end gap-3 border-t lg:border-t-0 border-zinc-900/60 pt-3 lg:pt-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyFilename(op.id, op.name)}
                        className="p-2 rounded bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer animate-none"
                        title="Copy filename to clipboard"
                      >
                        {copiedId === op.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 scale-105" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Display active status pulse */}
                      {liveUrl ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 font-mono text-[9px] uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                          <span>Session Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-950 border border-zinc-900 text-zinc-500 font-mono text-[9px] uppercase">
                          <span>Session Expired</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {liveUrl ? (
                        <a
                          href={liveUrl}
                          download={op.downloadName}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 font-heading font-extrabold text-xs transition-all uppercase tracking-wider cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.02)]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Re-download</span>
                        </a>
                      ) : (
                        <div 
                          className="group relative cursor-help inline-flex items-center justify-center p-2 rounded bg-zinc-950 border border-zinc-900 text-zinc-600"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span className="pointer-events-none absolute bottom-full right-0 mb-2 w-48 scale-0 transition-all rounded bg-zinc-950 border border-zinc-800 p-2 text-[9px] font-mono text-zinc-400 leading-relaxed shadow-xl group-hover:scale-100 z-30">
                            Blob memory was garbage collected upon tab reload. Re-convert your source file to recover download.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEO Compliance Monitor and Search Engine Keywords Panel */}
      <div id="dashboard-seo-indicators" className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/60">
        <h3 className="font-heading text-xs uppercase font-bold text-brand tracking-wider mb-3 transition-colors duration-500">Principal Technical SEO Indicators</h3>
        <p className="font-sans text-xs text-zinc-400 leading-relaxed mb-4">
          This hub provides integrated semantic metadata models, JSON-LD structured schemas, and strict, crawls-compliant DOM layouts mapped directly into the static routes. No heavy script hydration to secure absolute indexing capabilities.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-[10px]">
          <div className="p-3 bg-zinc-950 rounded border border-zinc-900">
            <span className="text-zinc-500 block mb-1">Targeting Payload 1:</span>
            <span className="text-zinc-300 font-semibold uppercase">PDF Compressor</span>
          </div>
          <div className="p-3 bg-zinc-950 rounded border border-zinc-900">
            <span className="text-zinc-500 block mb-1">Targeting Payload 2:</span>
            <span className="text-zinc-300 font-semibold uppercase">WebP Converter</span>
          </div>
          <div className="p-3 bg-zinc-950 rounded border border-zinc-900">
            <span className="text-zinc-500 block mb-1">Targeting Payload 3:</span>
            <span className="text-brand font-semibold uppercase font-bold transition-colors duration-500">Client-Side WASM</span>
          </div>
          <div className="p-3 bg-zinc-950 rounded border border-zinc-900">
            <span className="text-zinc-500 block mb-1">Sitemap Priority Weights:</span>
            <span className="text-emerald-400 font-bold">1.0 / 0.8 Weekly</span>
          </div>
        </div>
      </div>

      {/* Workspace Capture Studio Modal */}
      <DashboardCaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        targetElementId="workspace-dashboard-layout"
        onSuccess={(msg) => showNotification(msg, 'success')}
        onError={(msg) => showNotification(msg, 'error')}
      />

      {/* Toast Notification HUD */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full shadow-2xl pointer-events-auto"
          >
            <div className={`p-4 rounded-xl border flex items-start gap-3 bg-[#0a0a0f] ${
              notification.type === 'success' 
                ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] text-emerald-400'
                : notification.type === 'error'
                  ? 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)] text-red-400'
                  : 'border-brand/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] text-brand'
            }`}>
              <div className="flex-shrink-0 mt-0.5 animate-pulse">
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : notification.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <Info className="w-5 h-5 text-brand" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading text-xs uppercase font-extrabold tracking-wider leading-none mb-1">
                  System Notification
                </p>
                <p className="font-sans text-xs text-zinc-300 leading-normal">
                  {notification.message}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

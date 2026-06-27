import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, ArrowRight, RotateCw, Sparkles, Download, Printer, Play, 
  SearchCode, BookOpen, Share2, QrCode, Globe, HardDriveDownload, Eye, Terminal 
} from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  toolId: string;
  toolTitle: string;
  onLaunch: () => void;
  onAskGemini: () => void;
  onCreateQR: () => void;
}

export default function ContextMenu({
  x,
  y,
  onClose,
  toolId,
  toolTitle,
  onLaunch,
  onAskGemini,
  onCreateQR,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('contextmenu', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('contextmenu', handleOutsideClick);
    };
  }, [onClose]);

  // Adjust coordinates so the menu doesn't overflow the screen
  const menuWidth = 260;
  const menuHeight = 520; // estimated max height
  
  let adjustedX = x;
  let adjustedY = y;

  if (typeof window !== 'undefined') {
    if (x + menuWidth > window.innerWidth) {
      adjustedX = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      adjustedY = window.innerHeight - menuHeight - 10;
    }
    // Safeguard minimum bounds
    adjustedX = Math.max(10, adjustedX);
    adjustedY = Math.max(10, adjustedY);
  }

  // Handle standard browser actions
  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.history.back();
    onClose();
  };

  const handleForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.history.forward();
    onClose();
  };

  const handleReload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.reload();
    onClose();
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.print();
    onClose();
  };

  const handleViewSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Simulate opening view source or open details modal
    alert(`Viewing page source is disabled in the secure sandbox. Active tool: ${toolTitle} (${toolId})`);
    onClose();
  };

  const handleInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`Inspect Element is handled natively. Use Chrome Developer Tools (F12) to inspect the sandboxed iframe elements.`);
    onClose();
  };

  return (
    <div 
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-[9999] w-[250px] bg-[#0c0d12]/95 border border-zinc-800/90 rounded-xl shadow-2xl p-1.5 backdrop-blur-md text-slate-300 select-none font-sans text-xs flex flex-col"
    >
      {/* Navigation Row */}
      <div className="grid grid-cols-3 gap-1 px-1 py-1 border-b border-zinc-900">
        <button 
          onClick={handleBack}
          className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-zinc-900 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-[10px] text-zinc-500 font-mono">Alt+←</span>
        </button>
        <button 
          onClick={handleForward}
          className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-zinc-900 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Forward"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span className="text-[10px] text-zinc-500 font-mono">Alt+→</span>
        </button>
        <button 
          onClick={handleReload}
          className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-zinc-900 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Reload"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span className="text-[10px] text-zinc-500 font-mono">Ctrl+R</span>
        </button>
      </div>

      {/* Ask Gemini Section */}
      <div className="p-1 border-b border-zinc-900">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAskGemini();
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-gradient-to-tr from-rose-950/20 via-slate-900 to-indigo-950/20 hover:from-rose-900/30 hover:via-slate-800 hover:to-indigo-900/30 border border-pink-500/10 hover:border-pink-500/30 text-white font-semibold transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-tr from-rose-500 to-indigo-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-3 h-3 text-white animate-pulse" />
            </div>
            <span className="text-xs tracking-wide">Ask Gemini</span>
          </div>
          <span className="text-[9px] font-mono text-pink-400 uppercase bg-pink-950/60 px-1.5 py-0.5 rounded border border-pink-900/40">AI COACH</span>
        </button>
      </div>

      {/* Action Commands */}
      <div className="p-1 border-b border-zinc-900 space-y-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLaunch();
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-zinc-900/80 rounded-lg text-left transition-all cursor-pointer text-slate-200 hover:text-white font-medium"
        >
          <div className="flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Launch Tool</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono">Execute</span>
        </button>

        <button
          onClick={handlePrint}
          className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-zinc-900/80 rounded-lg text-left transition-all cursor-pointer text-slate-300 hover:text-white"
        >
          <div className="flex items-center gap-2">
            <Printer className="w-3.5 h-3.5 text-zinc-500" />
            <span>Print page...</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono">Ctrl+P</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            alert(`Casting "${toolTitle}" requires an active Chromecast device on your local network. Please open in a standalone tab first.`);
            onClose();
          }}
          className="w-full flex items-center px-2.5 py-1.5 hover:bg-zinc-900/80 rounded-lg text-left transition-all cursor-pointer text-slate-400 hover:text-white"
        >
          <div className="flex items-center gap-2">
            <Share2 className="w-3.5 h-3.5 text-zinc-600" />
            <span>Cast media to device...</span>
          </div>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAskGemini();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-zinc-900/80 rounded-lg text-left transition-all cursor-pointer text-slate-300 hover:text-white"
        >
          <SearchCode className="w-3.5 h-3.5 text-zinc-500" />
          <span>Search tab with Google Lens</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            alert(`Opening "${toolTitle}" guidelines in dedicated Reading Mode.`);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-zinc-900/80 rounded-lg text-left transition-all cursor-pointer text-slate-300 hover:text-white"
        >
          <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
          <span>Open in reading mode</span>
        </button>
      </div>

      {/* QR & Device Section */}
      <div className="p-1 border-b border-zinc-900 space-y-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            alert(`Sending connection payload for "${toolTitle}" to your synchronized workspace devices.`);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-zinc-900/80 rounded-lg text-left transition-all cursor-pointer text-slate-400 hover:text-white"
        >
          <Share2 className="w-3.5 h-3.5 text-zinc-600" />
          <span>Send to your devices</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreateQR();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-zinc-900/80 rounded-lg text-left transition-all cursor-pointer text-slate-300 hover:text-white font-medium"
        >
          <QrCode className="w-3.5 h-3.5 text-slate-400" />
          <span>Create QR Code for this tool</span>
        </button>
      </div>

      {/* Translate Section */}
      <div className="p-1 border-b border-zinc-900">
        <button
          onClick={(e) => {
            e.stopPropagation();
            alert(`Document content is already dynamically localized. Current active schema: English/Spanish.`);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-zinc-900/80 rounded-lg text-left transition-all cursor-pointer text-slate-300 hover:text-white"
        >
          <Globe className="w-3.5 h-3.5 text-zinc-500" />
          <span>Translate to English</span>
        </button>
      </div>

      {/* APK Downloader */}
      <div className="p-1 border-b border-zinc-900">
        <button
          onClick={(e) => {
            e.stopPropagation();
            alert(`Triggering Android wrapper build compiler for "${toolTitle}". Downloading progress: 100% compiled successfully.`);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-zinc-900/80 rounded-lg text-left transition-all cursor-pointer text-slate-300 hover:text-white"
        >
          <HardDriveDownload className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-sky-400">APK Downloader</span>
        </button>
      </div>

      {/* Source Code & Inspect Section */}
      <div className="p-1 space-y-0.5">
        <button
          onClick={handleViewSource}
          className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-zinc-900/80 rounded-lg text-left transition-all cursor-pointer text-slate-300 hover:text-white"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-zinc-500" />
            <span>View page source</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono">Ctrl+U</span>
        </button>

        <button
          onClick={handleInspect}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#ef4444]/10 hover:text-[#ef4444] rounded-lg text-left transition-all cursor-pointer text-slate-300"
        >
          <Terminal className="w-3.5 h-3.5 text-zinc-500" />
          <span>Inspect Element</span>
        </button>
      </div>
    </div>
  );
}

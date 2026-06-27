import { useEffect, useRef, useState } from 'react';
import { 
  ExternalLink, Maximize2, Columns, EyeOff, ChevronRight, 
  Download, Copy, Sparkles, Terminal, Shield, BookOpen, Layers
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
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

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
  const menuWidth = 240;
  const menuHeight = 380; // estimated height
  
  let adjustedX = x;
  let adjustedY = y;

  if (typeof window !== 'undefined') {
    if (x + menuWidth > window.innerWidth) {
      adjustedX = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      adjustedY = window.innerHeight - menuHeight - 10;
    }
    adjustedX = Math.max(10, adjustedX);
    adjustedY = Math.max(10, adjustedY);
  }

  const toolUrl = `${window.location.origin}/${toolId}`;

  // Actions
  const handleOpenNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(toolUrl, '_blank');
    onClose();
  };

  const handleOpenNewWindow = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(toolUrl, '_blank', 'width=1200,height=800,noopener,noreferrer');
    onClose();
  };

  const handleOpenSplitView = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Dispatch split-view custom event to App.tsx
    window.dispatchEvent(new CustomEvent('trigger-split-view', {
      detail: { toolId }
    }));
    onClose();
  };

  const handleOpenIncognito = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`${toolUrl}?incognito=true`, '_blank', 'width=1200,height=800,noopener,noreferrer');
    onClose();
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(toolUrl).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => {
        setCopiedSuccess(false);
        onClose();
      }, 800);
    });
  };

  const handleSaveLinkAs = (e: React.MouseEvent) => {
    e.stopPropagation();
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Deep Link: ${toolTitle}</title>
  <meta charset="utf-8">
  <style>
    body {
      background: #09090b;
      color: #fafafa;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      padding: 24px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: bold;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
  <script>
    setTimeout(function() {
      window.location.href = "${toolUrl}";
    }, 1200);
  </script>
</head>
<body>
  <div class="card">
    <h2>Launching "${toolTitle}"...</h2>
    <p>Redirecting you to <a href="${toolUrl}">${toolUrl}</a></p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${toolId}_deep_link.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInspector(true);
  };

  return (
    <>
      <div 
        ref={menuRef}
        style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
        className="fixed z-[9999] w-[240px] bg-[#101014]/98 border border-zinc-800/80 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-1.5 backdrop-blur-xl text-[#d4d4d8] select-none font-sans text-[13px] flex flex-col gap-0.5"
      >
        {/* Open in new tab */}
        <a
          href={toolUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#ef4444]/10 hover:text-white rounded-lg text-left transition-colors cursor-pointer group no-underline"
        >
          <div className="flex items-center gap-2.5">
            <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-[#ef4444]" />
            <span>Open in New Tab</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">Ctrl+T</span>
        </a>

        {/* Open in new window */}
        <button
          onClick={handleOpenNewWindow}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#ef4444]/10 hover:text-white rounded-lg text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Maximize2 className="w-4 h-4 text-zinc-400 group-hover:text-[#ef4444]" />
            <span>Open link in new window</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">Ctrl+N</span>
        </button>

        {/* Open in split view */}
        <button
          onClick={handleOpenSplitView}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-indigo-500/15 hover:text-indigo-200 rounded-lg text-left transition-colors cursor-pointer group font-medium"
        >
          <div className="flex items-center gap-2.5">
            <Columns className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
            <span>Open link in split view</span>
          </div>
          <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900/40 uppercase">Dock</span>
        </button>

        {/* Open in incognito window */}
        <button
          onClick={handleOpenIncognito}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#a855f7]/15 hover:text-[#f3e8ff] rounded-lg text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <EyeOff className="w-4 h-4 text-[#a855f7] group-hover:text-[#c084fc]" />
            <span>Open link in incognito window</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">Ctrl+Shift+N</span>
        </button>

        {/* Open link as submenu trigger */}
        <div 
          className="relative"
          onMouseEnter={() => setShowSubmenu(true)}
          onMouseLeave={() => setShowSubmenu(false)}
        >
          <button
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#ef4444]/10 hover:text-white rounded-lg text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-zinc-400 group-hover:text-[#ef4444]" />
              <span>Open link as</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {/* Side Submenu */}
          {showSubmenu && (
            <div className="absolute top-0 left-[230px] w-[180px] bg-[#101014]/98 border border-zinc-800/80 rounded-xl shadow-2xl p-1 backdrop-blur-xl flex flex-col gap-0.5 z-[10000]">
              <button 
                onClick={handleOpenNewTab}
                className="w-full px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg text-left transition-colors text-xs text-slate-300 hover:text-white"
              >
                Standard Workspace
              </button>
              <button 
                onClick={handleOpenIncognito}
                className="w-full px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg text-left transition-colors text-xs text-slate-300 hover:text-white"
              >
                Isolated Sandbox
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`Starting custom focus-aligned reading mode for "${toolTitle}".`);
                  onClose();
                }}
                className="w-full px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg text-left transition-colors text-xs text-slate-300 hover:text-white"
              >
                Reading Mode
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-zinc-800/60 my-1 mx-1.5" />

        {/* Save link as... */}
        <button
          onClick={handleSaveLinkAs}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-800/80 rounded-lg text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
            <span>Save link as...</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">Ctrl+S</span>
        </button>

        {/* Copy Tool Link */}
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-800/80 rounded-lg text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Copy className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
            <span>{copiedSuccess ? 'Copied to clipboard!' : 'Copy Tool Link'}</span>
          </div>
        </button>

        {/* Ask Gemini */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAskGemini();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-800/80 rounded-lg text-left transition-all cursor-pointer group border border-pink-500/10 bg-gradient-to-tr from-pink-950/10 via-zinc-950/50 to-indigo-950/10 hover:from-pink-950/20 hover:to-indigo-950/20"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-500 flex items-center justify-center shadow-[0_2px_8px_rgba(239,68,68,0.25)]">
              <Sparkles className="w-3 h-3 text-white animate-pulse" />
            </div>
            <span className="font-semibold text-zinc-100 group-hover:text-white">Ask Gemini</span>
          </div>
          <span className="text-[9px] font-mono text-pink-400 font-bold bg-pink-950/40 px-1.5 py-0.5 rounded border border-pink-900/30">AI COACH</span>
        </button>

        {/* Divider */}
        <div className="h-[1px] bg-zinc-800/60 my-1 mx-1.5" />

        {/* Inspect */}
        <button
          onClick={handleInspect}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-800/80 rounded-lg text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
            <span>Inspect</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">F12</span>
        </button>
      </div>

      {/* Code Inspector / Component Details Modal */}
      {showInspector && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#09090c] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#0c0c10]">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="font-mono text-xs font-bold text-slate-300">DOM Inspector: {toolTitle} ({toolId})</span>
              </div>
              <button 
                onClick={() => {
                  setShowInspector(false);
                  onClose();
                }}
                className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
            
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-emerald-400 space-y-4 leading-relaxed bg-[#050507]">
              <div>
                <span className="text-zinc-500">// Route & Component Schema Details</span>
                <p className="text-white"><span className="text-pink-500">const</span> componentName = <span className="text-sky-300">"{toolTitle.replace(/\s+/g, '')}"</span>;</p>
                <p className="text-white"><span className="text-pink-500">const</span> targetRoute = <span className="text-sky-300">"/{toolId}"</span>;</p>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 text-zinc-300 text-[11px] space-y-1.5">
                <div className="flex justify-between border-b border-zinc-900 pb-1 text-zinc-500">
                  <span>Attribute</span>
                  <span>Value</span>
                </div>
                <div className="flex justify-between">
                  <span>ID Segment</span>
                  <span className="font-bold text-[#ef4444]">{toolId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Compilation Mode</span>
                  <span className="text-emerald-500 font-bold">Local WebAssembly Thread (React.Suspense)</span>
                </div>
                <div className="flex justify-between">
                  <span>Security Sandbox</span>
                  <span className="text-sky-400">Isolated Frame Container</span>
                </div>
                <div className="flex justify-between">
                  <span>Local Cache Buffer</span>
                  <span className="text-amber-500">localStorage.getItem('apex_tool_cache_{toolId}')</span>
                </div>
              </div>

              <div>
                <span className="text-zinc-500">// Simulated Native HTML Structure</span>
                <pre className="text-[#a78bfa] overflow-x-auto p-3 bg-zinc-950/60 rounded-xl border border-zinc-900/40">
{`<!-- Local WebAssembly Component Shell -->
<div id="${toolId}-wrapper" class="beveled-panel relative w-full h-full">
  <header class="flex items-center justify-between pb-4 border-b border-red-950/40">
    <div class="space-y-1">
      <span class="text-[10px] font-mono font-bold tracking-widest text-brand uppercase">Webmaster Tool</span>
      <h2 class="text-2xl font-extrabold text-white tracking-tight">${toolTitle}</h2>
    </div>
  </header>
  <main class="mt-6 flex-1 w-full relative">
    <!-- Local secure iframe sandbox mounting component execution stack -->
  </main>
</div>`}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-[#0c0c10] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>Status: Clean Build</span>
              <span>Workspace: sandboxed-iframe-host</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

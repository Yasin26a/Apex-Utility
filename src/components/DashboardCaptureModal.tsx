import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Download, Sliders, CheckCircle, Cpu, ShieldAlert, FileImage, Image as ImageIcon, Sparkles, Loader2, Info, FileText, LayoutGrid } from 'lucide-react';
import html2canvas from 'html2canvas';

interface DashboardCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetElementId: string;
  userEmail?: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function DashboardCaptureModal({
  isOpen,
  onClose,
  targetElementId,
  userEmail = "Yasinalam67@gmail.com",
  onSuccess,
  onError
}: DashboardCaptureModalProps) {
  // Capture preferences
  const [selectedSection, setSelectedSection] = useState<string>('full');
  const [scale, setScale] = useState<number>(2); // Default is 2x for high resolution
  const [includeHeader, setIncludeHeader] = useState<boolean>(true);
  const [customSubject, setCustomSubject] = useState<string>("System Workspace Snapshot");
  const [hideInteractive, setHideInteractive] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg'>('png');

  // Compilation state
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compilingStep, setCompilingStep] = useState<string>("");
  const [compiledSrc, setCompiledSrc] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; sizeStr: string } | null>(null);

  // Clean raw bytes formatter
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCapture = async () => {
    let resolvedId = targetElementId;
    if (selectedSection === 'hero') resolvedId = "dashboard-hero-banner";
    else if (selectedSection === 'vault') resolvedId = "dashboard-core-vault";
    else if (selectedSection === 'ledger') resolvedId = "dashboard-files-ledger";
    else if (selectedSection === 'seo') resolvedId = "dashboard-seo-indicators";
    else resolvedId = "workspace-dashboard-layout";

    const targetElement = document.getElementById(resolvedId) || document.getElementById(targetElementId);
    if (!targetElement) {
      onError("Capture Target layout element not found.");
      return;
    }

    setIsCompiling(true);
    setCompiledSrc(null);
    setImageMeta(null);
    setCompilingStep("Initializing sandbox capture environment...");

    try {
      // Small pause to let state paint properly
      await new Promise((resolve) => setTimeout(resolve, 300));
      setCompilingStep("Cloning workspace layout tree into rendering memory...");

      const canvas = await html2canvas(targetElement, {
        backgroundColor: '#050508',
        scale: scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          setCompilingStep("Injecting documentation layout layers & watermarks...");
          const clonedElement = clonedDoc.getElementById(resolvedId) || clonedDoc.getElementById(targetElementId);
          if (!clonedElement) return;

          // Apply clean workspace styles on clone
          clonedElement.style.padding = '40px';
          clonedElement.style.background = '#050508';
          if (selectedSection === 'full') {
            clonedElement.style.width = '1280px';
          } else {
            clonedElement.style.maxWidth = '1280px';
            clonedElement.style.width = '100%';
          }
          clonedElement.style.borderRadius = '12px'; // Rounded edge for beautiful frames

          // Remove border glowing properties on screenshot if needed
          clonedElement.style.boxShadow = 'none';

          // Option: Hide interactive controls for a pure documentation layout
          if (hideInteractive) {
            // Select and hide all buttons, inputs, headers within buttons, copy and delete targets
            const buttons = clonedElement.querySelectorAll('button, input, a, .flex-shrink-0 button, [role="button"]');
            buttons.forEach((el: any) => {
              el.style.display = 'none';
            });

            // Specific utility click footer rows
            const triggerFooters = clonedElement.querySelectorAll('.group-hover\\:text-brand, .border-t\\/10');
            triggerFooters.forEach((el: any) => {
              el.style.opacity = '0.3';
            });
          }

          // Option: Append customized professional header block
          if (includeHeader) {
            const headerContainer = clonedDoc.createElement('div');
            headerContainer.id = 'apex-capture-custom-header';
            headerContainer.className = 'beveled-panel mb-8 p-6 bg-[#09090d] border border-zinc-900 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4';
            headerContainer.style.background = '#09090d';
            headerContainer.style.border = '1px solid #18181b';
            headerContainer.style.padding = '24px';
            headerContainer.style.marginBottom = '32px';
            headerContainer.style.borderRadius = '12px';
            headerContainer.style.display = 'flex';
            headerContainer.style.justifyContent = 'space-between';
            headerContainer.style.alignItems = 'center';
            headerContainer.style.fontFamily = 'Inter, sans-serif';

            const leftBlock = clonedDoc.createElement('div');
            leftBlock.style.display = 'flex';
            leftBlock.style.flexDirection = 'column';
            leftBlock.style.gap = '4px';

            const titleLabel = clonedDoc.createElement('h1');
            titleLabel.innerText = "APEX CORE LABS — WORKSPACE AUDIT";
            titleLabel.style.fontSize = '14px';
            titleLabel.style.letterSpacing = '0.15em';
            titleLabel.style.fontWeight = '900';
            titleLabel.style.color = '#ffffff';
            titleLabel.style.margin = '0';
            titleLabel.style.fontFamily = 'monospace';

            const subLabel = clonedDoc.createElement('p');
            subLabel.innerText = `Subject: ${customSubject || 'Live Sandbox Snapshot'}`;
            subLabel.style.fontSize = '12px';
            subLabel.style.color = '#f59e0b';
            subLabel.style.margin = '0';
            subLabel.style.fontWeight = '700';

            leftBlock.appendChild(titleLabel);
            leftBlock.appendChild(subLabel);

            const rightBlock = clonedDoc.createElement('div');
            rightBlock.style.textAlign = 'right';
            rightBlock.style.fontSize = '10px';
            rightBlock.style.color = '#71717a';
            rightBlock.style.fontFamily = 'monospace';
            rightBlock.style.display = 'flex';
            rightBlock.style.flexDirection = 'column';
            rightBlock.style.gap = '2px';

            const emailText = clonedDoc.createElement('div');
            emailText.innerText = `OPERATIVE: ${userEmail}`;
            emailText.style.color = '#e4e4e7';

            const stampText = clonedDoc.createElement('div');
            stampText.innerText = `TIMESTAMP: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC`;

            const specText = clonedDoc.createElement('div');
            specText.innerText = `INTEGRITY: LOCALHOST CLIENT ISOLATED (SECURE)`;
            specText.style.color = '#10b981';

            rightBlock.appendChild(emailText);
            rightBlock.appendChild(stampText);
            rightBlock.appendChild(specText);

            headerContainer.appendChild(leftBlock);
            headerContainer.appendChild(rightBlock);

            clonedElement.insertBefore(headerContainer, clonedElement.firstChild);
          }
        }
      });

      setCompilingStep("Rendering canvas bytes into image matrix...");
      const formatString = `image/${outputFormat}`;
      const dataUrl = canvas.toDataURL(formatString);

      // Estimate byte size from Base64 string length
      const approxBytes = Math.floor((dataUrl.length - 22) * 3 / 4);

      setCompiledSrc(dataUrl);
      setImageMeta({
        width: canvas.width,
        height: canvas.height,
        sizeStr: formatBytes(approxBytes)
      });
      setCompilingStep("");
      setIsCompiling(false);
      onSuccess("Dashboard workspace compiled successfully.");

    } catch (err: any) {
      console.error(err);
      setIsCompiling(false);
      setCompilingStep("");
      onError(`Layout Capture Failed: ${err.message || 'Rendering context interrupted.'}`);
    }
  };

  const downloadCompiled = () => {
    if (!compiledSrc) return;
    const link = document.createElement('a');
    const sanitName = (customSubject || "System_Workspace_Layout")
      .replace(/[^a-z0-9_-]/gi, '_')
      .toLowerCase();
    link.download = `apex_${sanitName}_${Date.now()}.${outputFormat}`;
    link.href = compiledSrc;
    link.click();
    onSuccess("Image saved to your local drive.");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#030305]/80 backdrop-blur-sm"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#09090d] shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col z-10"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-900 bg-zinc-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-brand/10 border border-brand/20 text-brand">
                <Camera className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider">Workspace Capture Studio</h3>
                <p className="font-sans text-[11px] text-zinc-500">Render your interactive sandbox dashboard into high-fidelity documents.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
            {/* Left Controls Column */}
            <div className="md:col-span-12 lg:col-span-5 space-y-5">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900/80 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                  <Sliders className="w-4 h-4 text-brand" />
                  <span className="font-heading text-xs font-bold text-white uppercase tracking-wider">Adjustment Console</span>
                </div>

                {/* Section selection */}
                <div className="space-y-2">
                  <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-mono">Select Target Area</label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'full', label: 'Full Dashboard Canvas', desc: 'All rows, operational metrics, and SEO indicators combined', icon: LayoutGrid },
                      { id: 'hero', label: 'Hero Welcome Banner', desc: 'System header presentation card and active engine tags', icon: ImageIcon },
                      { id: 'vault', label: 'Core Utilities Vault', desc: 'Interactive media and file processing grid', icon: Cpu },
                      { id: 'ledger', label: 'Recent Files Ledger', desc: 'Browser registry logging historical transformations', icon: FileText },
                      { id: 'seo', label: 'Technical SEO Compliance', desc: 'Semantic indicators and metadata trackers', icon: Sliders }
                    ].map((sec) => {
                      const IconComp = sec.icon;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => setSelectedSection(sec.id)}
                          className={`w-full p-2.5 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer ${
                            selectedSection === sec.id
                              ? 'bg-brand/10 border-brand/50 text-white shadow-[0_0_10px_rgba(245,158,11,0.05)]'
                              : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <div className={`p-1.5 rounded mt-0.5 ${selectedSection === sec.id ? 'bg-brand/20 text-brand' : 'bg-zinc-950 text-zinc-500'}`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-heading text-[11px] font-bold uppercase tracking-wider">{sec.label}</div>
                            <div className="text-[9px] text-[#8e9cae] leading-snug font-sans mt-0.5">{sec.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Resolution configuration */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-mono">Render Pixel Scale</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "1x (Standard)", v: 1 },
                      { l: "2x (HD Render)", v: 2 },
                      { l: "4x (Ultra HD)", v: 4 }
                    ].map((item) => (
                      <button
                        key={item.v}
                        type="button"
                        onClick={() => setScale(item.v)}
                        className={`py-2 px-1.5 rounded-lg border text-center font-mono text-[9px] font-bold transition-all cursor-pointer ${
                          scale === item.v
                            ? 'bg-brand/15 border-brand/60 text-brand shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                            : 'bg-zinc-900/60 border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {item.l}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-normal">
                    Higher scale multipliers generate extra crisp vector rendering for text widgets and images. Note that 4x requires more processing power.
                  </p>
                </div>

                {/* Switch compression formats */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-mono">Image Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { l: "Lossless PNG", v: "png" as const },
                      { l: "Standard JPG", v: "jpeg" as const }
                    ].map((itm) => (
                      <button
                        key={itm.v}
                        type="button"
                        onClick={() => setOutputFormat(itm.v)}
                        className={`py-2 px-2.5 rounded-lg border text-center font-mono text-[10px] font-bold transition-all cursor-pointer ${
                          outputFormat === itm.v
                            ? 'bg-brand/15 border-brand/60 text-brand'
                            : 'bg-zinc-900/60 border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {itm.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subheader switch check */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 font-sans cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeHeader}
                      onChange={(e) => setIncludeHeader(e.target.checked)}
                      className="rounded border-zinc-800 bg-[#050508] text-brand focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                    />
                    <span>Inject Custom Documentation Heading</span>
                  </label>

                  {includeHeader && (
                    <div className="pl-5 space-y-1">
                      <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8] font-mono">Document Title Label</label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="w-full bg-[#050508] border border-zinc-850 rounded px-2.5 py-1.5 text-white font-mono text-[10px] focus:outline-none focus:border-brand/40"
                        placeholder="e.g., Audit Ledger Output Alpha"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-xs text-zinc-300 font-sans cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideInteractive}
                      onChange={(e) => setHideInteractive(e.target.checked)}
                      className="rounded border-zinc-800 bg-[#050508] text-brand focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                    />
                    <span>Hide Interactive Buttons & Input Controls</span>
                  </label>
                  <p className="text-[10px] text-zinc-500 pl-5 leading-normal">
                    Hides action targets, inputs, and clear buttons to yield a clean presentation layout.
                  </p>
                </div>
              </div>

              {/* Master action trigger button */}
              <button
                type="button"
                onClick={handleCapture}
                disabled={isCompiling}
                className="w-full py-3 px-4 rounded-xl font-heading text-xs uppercase font-extrabold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 bg-brand text-zinc-950 hover:bg-[#ffb526] shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-35 disabled:pointer-events-none"
              >
                {isCompiling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>RENDERING PNG MATRIX...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-zinc-950" />
                    <span>CREATE CANVAS snapshots</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Output/Preview Column */}
            <div className="md:col-span-12 lg:col-span-7 flex flex-col justify-between h-full bg-[#040407] rounded-xl border border-zinc-900 p-4.5 min-h-[320px] md:min-h-0">
              <div className="flex-1 flex flex-col justify-center min-h-0">
                {isCompiling ? (
                  /* Loading visual */
                  <div className="text-center p-8 space-y-4">
                    <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-brand/10 border-t-brand animate-spin" />
                      <Camera className="w-5 h-5 text-brand animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-heading text-xs font-bold text-zinc-300 uppercase tracking-widest">Compiling Capture Output</p>
                      <p className="font-mono text-[9px] text-zinc-500 break-all">{compilingStep}</p>
                    </div>
                  </div>
                ) : compiledSrc ? (
                  /* Formatted output success inspect frame */
                  <div className="space-y-3.5 h-full flex flex-col justify-between min-h-0">
                    <div className="flex items-center justify-between text-[10px] font-mono border-b border-zinc-900 pb-2">
                      <span className="text-zinc-500 uppercase">Screenshot Preview</span>
                      <div className="flex gap-2">
                        <span className="text-zinc-600">Dims: <strong className="text-zinc-300">{imageMeta?.width}px &times; {imageMeta?.height}px</strong></span>
                        <span className="text-zinc-600">|</span>
                        <span className="text-zinc-650">Payload Size: <strong className="text-brand">{imageMeta?.sizeStr}</strong></span>
                      </div>
                    </div>

                    <div className="flex-1 bg-zinc-950/80 border border-zinc-850 rounded-lg overflow-hidden flex items-center justify-center p-2 relative group max-h-[220px] sm:max-h-[280px]">
                      <img 
                        src={compiledSrc} 
                        alt="Captured Workspace Preview" 
                        className="max-h-full max-w-full object-contain rounded select-none filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] border border-zinc-900"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={downloadCompiled}
                      className="w-full py-2.5 px-4 rounded-xl font-heading text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-center gap-1.5 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download {outputFormat.toUpperCase()} Snapshot</span>
                    </button>
                  </div>
                ) : (
                  /* Idle Workspace state */
                  <div className="text-center p-8 space-y-3 select-none">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900/60 border border-zinc-850 text-zinc-600 flex items-center justify-center mx-auto">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <h4 className="font-heading text-xs font-bold text-zinc-300 uppercase tracking-wide">Image Matrix Ledger Standby</h4>
                      <p className="font-sans text-[11px] text-zinc-500 leading-normal">
                        Click "Create Canvas Snapshots" in the Adjustment Console to trigger offline workspace synthesis.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Offline safety warnings */}
              <div className="mt-4 pt-3.5 border-t border-zinc-900 flex items-center gap-2 font-mono text-[9px] text-zinc-600">
                <Info className="w-3.5 h-3.5 text-brand" />
                <span>Processing runs natively on clients. Captures exact browser layout bounds.</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

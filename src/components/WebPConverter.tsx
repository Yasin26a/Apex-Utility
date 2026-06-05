import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Download, RefreshCw, AlertCircle, Sparkles, Image as ImageIcon, Sliders, CheckCircle, HelpCircle, ChevronDown, Cpu, Loader2, Zap } from 'lucide-react';
import { WebPConverterState } from '../types';
import { addRecentOperation } from '../utils/recentOperations';
import { usePresets } from '../context/PresetContext';

export default function WebPConverter() {
  const { activeSettings, updateActiveSettings } = usePresets();

  const [state, setState] = useState<WebPConverterState>({
    file: null,
    previewUrl: null,
    outputFormat: 'jpg',
    quality: 85,
    isProcessing: false,
    downloadUrl: null,
    originalSizeStr: '',
    convertedSizeStr: '',
  });

  const [isAutoCompress, setIsAutoCompress] = useState(false);
  const [targetSizeKb, setTargetSizeKb] = useState<number>(500);

  // Sync state with active settings when preset changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      outputFormat: activeSettings.webpFormat,
      quality: activeSettings.webpQuality,
    }));
    setIsAutoCompress(activeSettings.webpAutoCompress);
    setTargetSizeKb(activeSettings.webpTargetSizeKb);
  }, [activeSettings.webpFormat, activeSettings.webpQuality, activeSettings.webpAutoCompress, activeSettings.webpTargetSizeKb]);
  const [isSearchingQuality, setIsSearchingQuality] = useState(false);

  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true,
    1: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      loadWebPImage(files[0]);
    }
  };

  const runAutoCompressBinarySearch = (previewUrl: string, targetKb: number) => {
    if (!previewUrl) return;
    setIsSearchingQuality(true);

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const targetBytes = targetKb * 1024;
        let low = 5;
        let high = 100;
        let bestQuality = 85;
        let foundAny = false;

        // Binary search conversion iterations on jpeg compression setting
        for (let i = 0; i < 8; i++) {
          if (low > high) break;
          const mid = Math.floor((low + high) / 2);
          const qParam = mid / 100;
          const dataUrl = canvas.toDataURL('image/jpeg', qParam);
          const lengthOfBase64 = dataUrl.length - dataUrl.indexOf(',') - 1;
          const estimatedSize = Math.round(lengthOfBase64 * 3 / 4);

          if (estimatedSize <= targetBytes) {
            bestQuality = mid;
            foundAny = true;
            low = mid + 1; // Attempt higher quality bounds
          } else {
            high = mid - 1; // Downward size optimization
          }
        }

        const finalQuality = foundAny ? bestQuality : 5;
        setState((prev) => ({
          ...prev,
          quality: finalQuality,
        }));
      } catch (err) {
        console.error('Binary search compression auto-calibration failed:', err);
      } finally {
        setIsSearchingQuality(false);
      }
    };
    img.src = previewUrl;
  };

  const handleToggleAutoCompress = () => {
    const nextValue = !isAutoCompress;
    setIsAutoCompress(nextValue);
    updateActiveSettings({
      webpAutoCompress: nextValue,
      ...(nextValue ? { webpFormat: 'jpg' } : {})
    });
    if (nextValue) {
      // Auto compress requires lossy JPEG representation
      setState(prev => ({ ...prev, outputFormat: 'jpg' }));
      if (state.previewUrl) {
        runAutoCompressBinarySearch(state.previewUrl, targetSizeKb);
      }
    }
  };

  const handleTargetSizeChange = (kb: number) => {
    setTargetSizeKb(kb);
    updateActiveSettings({ webpTargetSizeKb: kb });
    if (state.previewUrl) {
      runAutoCompressBinarySearch(state.previewUrl, kb);
    }
  };

  const loadWebPImage = (file: File) => {
    // Validate WebP format
    if (!file.name.toLowerCase().endsWith('.webp') && file.type !== 'image/webp') {
      alert('APEX Media Lab expects valid .webp files as initial vector inputs.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const previewUrl = e.target.result as string;
        setState((prev) => ({
          ...prev,
          file,
          previewUrl,
          downloadUrl: null,
          originalSizeStr: formatBytes(file.size),
          convertedSizeStr: '',
        }));

        if (isAutoCompress) {
          runAutoCompressBinarySearch(previewUrl, targetSizeKb);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const performConversion = () => {
    if (!state.previewUrl || !state.file) return;

    setState((prev) => ({ ...prev, isProcessing: true }));

    // Set a tiny simulation delay for authentic client-side mechanics
    setTimeout(() => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Unassigned 2D Canvas context');

          // Draw the loaded WebP into pristine 2D state context
          ctx.drawImage(img, 0, 0);

          const mimeType = state.outputFormat === 'jpg' ? 'image/jpeg' : 'image/png';
          const qualityParam = state.outputFormat === 'jpg' ? state.quality / 100 : 1.0;

          const dataUrl = canvas.toDataURL(mimeType, qualityParam);
          
          // Estimate converted size (dataURL base64 is roughly 1.33 times bigger than binary bytes)
          const estimatedSize = Math.round((dataUrl.length - 22) * 3 / 4);
          const finishedSizeStr = formatBytes(estimatedSize);

          if (state.file) {
            addRecentOperation(
              state.file.name,
              'WebP Conversion',
              state.originalSizeStr,
              finishedSizeStr,
              `APEX_Rasterized_${state.file.name.replace(/\.webp$/i, `.${state.outputFormat}`)}`,
              dataUrl
            );
          }

          setState((prev) => ({
            ...prev,
            isProcessing: false,
            downloadUrl: dataUrl,
            convertedSizeStr: finishedSizeStr,
          }));
        } catch (error) {
          console.error('Error during Canvas rasterization:', error);
          setState((prev) => ({ ...prev, isProcessing: false }));
        }
      };
      
      img.src = state.previewUrl as string;
    }, 850);
  };

  const triggerReset = () => {
    setState({
      file: null,
      previewUrl: null,
      outputFormat: 'jpg',
      quality: 85,
      isProcessing: false,
      downloadUrl: null,
      originalSizeStr: '',
      convertedSizeStr: '',
    });
    setIsAutoCompress(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleFaq = (idx: number) => {
    setFaqOpen(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      loadWebPImage(files[0]);
    }
  };

  // Structured markup payload for WebP conversions
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "APEX WebP Image Converter",
    "operatingSystem": "All Web Browsers",
    "applicationCategory": "GraphicsApplication",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    },
    "description": "Premium browser utility. Convert WebP vectors directly into standard JPEG or high-definition PNG format without server registrations."
  };

  return (
    <div className="space-y-12">
      <script type="application/ld+json">
        {JSON.stringify(jsonLdSchema)}
      </script>

      {/* SEO Optimized Header Column */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-orange-500/15 border border-orange-500/25 text-orange-400 text-xs font-mono font-bold uppercase">
          <Cpu className="w-3.5 h-3.5" />
          <span>Interactive Canvas Module Active</span>
        </div>
        <h1 className="font-heading text-3xl font-black text-white tracking-tight">
          Convert Webp to Jpg Instantly Without Registration
        </h1>
        <p className="font-sans text-sm text-[#94a3b8] max-w-2xl leading-relaxed">
          The premium browser utility. Convert modern WebP files directly into highly compatible standard JPG backgrounds or lossless transparent PNG configurations in real-time. Fast, direct, and completely free.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Core Canvas Work Desk */}
        <div className="lg:col-span-7 space-y-6">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="beveled-panel p-8 min-h-[350px] border-rose-950/15 hover:border-orange-500/40 transition-all duration-300 flex flex-col items-center justify-center text-center relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/[0.01] to-transparent pointer-events-none" />

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".webp"
              className="hidden"
            />

            <AnimatePresence mode="wait">
              {!state.file && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-orange-505/5 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.05)] transition-all">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-white tracking-wide">
                      Drag & Drop WebP Image or Click to browse
                    </h3>
                    <p className="font-sans text-xs text-zinc-500 mt-2 max-w-sm mx-auto">
                      Compatible with compressed WebP files exported from smart devices, Google Search, and Figma layouts.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-orange-400 font-mono font-bold bg-orange-950/20 border border-orange-955/30 px-3 py-1.5 rounded">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>Instant Local JPG Pipeline</span>
                  </div>
                </motion.div>
              )}

              {state.file && (
                <motion.div
                  key="has-file"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full space-y-6"
                >
                  {/* File Profile Details */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 rounded-lg bg-zinc-950/40 border border-zinc-900 max-w-lg mx-auto">
                    {state.previewUrl && (
                      <div className="relative w-32 h-24 rounded border border-zinc-800 bg-zinc-900 overflow-hidden flex items-center justify-center">
                        <img
                          src={state.previewUrl}
                          alt="WebP preview"
                          className="max-w-full max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="text-center sm:text-left flex-1 min-w-0">
                      <h4 className="font-heading text-sm font-bold text-white truncate max-w-[200px]">{state.file.name}</h4>
                      <p className="font-mono text-[10px] text-zinc-500 mt-1">Size: {state.originalSizeStr} | WEBP</p>
                    </div>
                  </div>

                  {/* Processing diagnostics */}
                  {state.isProcessing && (
                    <div className="text-center max-w-xs mx-auto space-y-3">
                      <div className="inline-flex items-center gap-2 text-orange-400 font-mono text-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                        <span>Rendering Canvas Layers...</span>
                      </div>
                    </div>
                  )}

                  {/* Converters controller dials when ready */}
                  {!state.isProcessing && !state.downloadUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-xs mx-auto space-y-4 pt-2"
                    >
                      <button
                        onClick={performConversion}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-heading font-bold text-sm shadow-[0_4px_20px_rgba(249,115,22,0.25)] hover:shadow-[0_4px_25px_rgba(249,115,22,0.35)] transition-all uppercase tracking-wide cursor-pointer text-center"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Rasterize Now</span>
                      </button>

                      <button
                        onClick={triggerReset}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase cursor-pointer"
                      >
                        <span>Cancel Input</span>
                      </button>
                    </motion.div>
                  )}

                  {/* Download interface once converting delivers download link */}
                  {state.downloadUrl && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-4 max-w-sm mx-auto pt-2"
                    >
                      <div className="grid grid-cols-2 gap-3 font-mono text-center">
                        <div className="p-3 rounded bg-zinc-950 border border-zinc-900">
                          <p className="text-[10px] text-zinc-500 uppercase">Input Size</p>
                          <p className="text-xs font-bold text-zinc-400 mt-1">{state.originalSizeStr}</p>
                        </div>
                        <div className="p-3 rounded bg-orange-950/10 border border-orange-500/20">
                          <p className="text-[10px] text-orange-400 uppercase font-bold">Output Size</p>
                          <p className="text-xs font-black text-orange-400 mt-1">{state.convertedSizeStr}</p>
                        </div>
                      </div>

                      <a
                        href={state.downloadUrl}
                        download={`APEX_Rasterized_${state.file.name.replace(/\.webp$/i, `.${state.outputFormat}`)}`}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-heading font-bold text-sm shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] transition-all uppercase tracking-wide cursor-pointer text-center animate-bounce"
                      >
                        <Download className="w-4.5 h-4.5" />
                        <span>Download Converted {state.outputFormat.toUpperCase()}</span>
                      </a>

                      <button
                        onClick={triggerReset}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Start New Session</span>
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Controls Console Panels */}
        <div className="lg:col-span-5 space-y-6">
          <div className="beveled-panel p-6 border-zinc-800 bg-[#07070a]/60 space-y-5">
            <h3 className="font-heading text-xs uppercase font-bold text-orange-450 tracking-wider border-b border-zinc-900 pb-2">
              Pipeline Parameters
            </h3>

            {/* Target output selector */}
            <div className="space-y-2">
              <label id="lbl-target-output" className="font-heading text-[11px] uppercase tracking-wider text-zinc-400 font-bold">Target Output</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-webp-format-jpg"
                  onClick={() => {
                    setState(prev => ({ ...prev, outputFormat: 'jpg' }));
                    updateActiveSettings({ webpFormat: 'jpg' });
                  }}
                  disabled={!!state.downloadUrl}
                  className={`py-2 px-3 rounded text-center font-mono text-xs font-bold border transition-all cursor-pointer ${
                    state.outputFormat === 'jpg'
                      ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]'
                      : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  JPG Form
                </button>
                <button
                  id="btn-webp-format-png"
                  onClick={() => {
                    setState(prev => ({ ...prev, outputFormat: 'png' }));
                    setIsAutoCompress(false);
                    updateActiveSettings({ webpFormat: 'png', webpAutoCompress: false });
                  }}
                  disabled={!!state.downloadUrl}
                  className={`py-2 px-3 rounded text-center font-mono text-xs font-bold border transition-all cursor-pointer ${
                    state.outputFormat === 'png'
                      ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]'
                      : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  PNG Form (Lossless)
                </button>
              </div>
            </div>

            {/* Auto-Compress Agent Toggle Card */}
            <div id="webp-auto-compress-widget" className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={`w-3.5 h-3.5 transition-colors ${isAutoCompress ? 'text-orange-400 animate-pulse' : 'text-zinc-500'}`} />
                  <div>
                    <span className="block text-[10px] font-heading font-black uppercase tracking-wider text-zinc-300">
                      Auto-Compress Target
                    </span>
                    <span className="block text-[8px] font-mono text-zinc-500">
                      Smart slider calibration
                    </span>
                  </div>
                </div>

                <button
                  id="btn-auto-compress-toggle"
                  type="button"
                  onClick={handleToggleAutoCompress}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                    isAutoCompress ? 'bg-orange-500' : 'bg-zinc-800'
                  }`}
                  aria-label="Toggle Auto-Compress option"
                >
                  <motion.div
                    layout
                    className="w-4 h-4 rounded-full bg-black shadow-md border border-neutral-800/40"
                    animate={{ x: isAutoCompress ? 16 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <AnimatePresence>
                {isAutoCompress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 border-t border-zinc-900/60 pt-3 overflow-hidden"
                  >
                    <label id="lbl-target-size-preset" className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500">
                      Target File Size Limit
                    </label>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: '<150K', value: 150 },
                        { label: '<300K', value: 300 },
                        { label: '<500K', value: 500 },
                        { label: '<1M', value: 1000 }
                      ].map((preset) => (
                        <button
                          key={preset.value}
                          id={`preset-size-${preset.value}`}
                          type="button"
                          onClick={() => handleTargetSizeChange(preset.value)}
                          className={`py-1.5 px-0.5 rounded font-mono text-[9px] font-extrabold uppercase transition-all border cursor-pointer text-center ${
                            targetSizeKb === preset.value
                              ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-bold shadow-[0_0_8px_rgba(249,115,22,0.15)]'
                              : 'bg-zinc-900/40 border-zinc-850 hover:border-zinc-700 text-zinc-500 hover:text-zinc-400'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {isSearchingQuality ? (
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-orange-400 animate-pulse bg-orange-500/5 p-2 rounded border border-orange-500/15">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Searching canvas configurations...</span>
                      </div>
                    ) : state.previewUrl ? (
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 bg-emerald-500/5 p-2 rounded border border-emerald-500/15 animate-fade-in">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>Optimized quality target: <strong>{state.quality}%</strong></span>
                      </div>
                    ) : (
                      <div className="text-[9px] font-mono text-zinc-650 leading-normal italic">
                        Upload WebP file to test caliber calculation.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quality Slider - relative to JPEG output strictly */}
            <div className={`space-y-3 transition-all duration-300 ${state.outputFormat === 'png' ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center text-[11px] uppercase tracking-wider font-bold text-zinc-400">
                <span className="flex items-center gap-1">
                  <span>Raster Compression Ratio</span>
                  {isAutoCompress && (
                    <span className="text-[9px] text-orange-400 font-mono tracking-tight bg-orange-500/10 border border-orange-500/20 px-1 py-0.5 rounded">AUTO</span>
                  )}
                </span>
                <span className="font-mono text-orange-400 font-bold text-xs">{state.quality}%</span>
              </div>
              <input
                id="inp-raster-compression-ratio"
                type="range"
                min="10"
                max="100"
                value={state.quality}
                onChange={(e) => {
                  const q = parseInt(e.target.value);
                  setState(prev => ({ ...prev, quality: q }));
                  setIsAutoCompress(false);
                  updateActiveSettings({ webpQuality: q, webpAutoCompress: false });
                }}
                disabled={!!state.downloadUrl}
                className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[8px] font-mono text-zinc-650">
                <span>Compact (Max Compression)</span>
                <span>Balanced (Optimal)</span>
                <span>HD (No Loss)</span>
              </div>
            </div>

            {state.outputFormat === 'png' && (
              <p className="font-sans text-[10px] text-zinc-500 leading-normal italic">
                Note: Lossless PNG outputs prioritize depth rendering. The compression slider represents lossy JPG parameters strictly.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* FAQs blocks section */}
      <section className="border-t border-rose-950/20 pt-12 space-y-8">
        <div className="max-w-3xl">
          <h2 className="font-heading text-2xl font-black text-white tracking-tight">
            Convert WebP to JPG Instantly Without Registration - Comprehensive Guide
          </h2>
          <p className="font-sans text-xs text-zinc-500 mt-2">
            Read technical insights into image rendering formats on modern web canvases below.
          </p>
        </div>

        <div className="max-w-3xl space-y-4">
          {[
            {
              q: "Why should I convert WebP images back into JPG or PNG formats?",
              a: "While WebP is excellent for modern web layouts, it is completely unsupported by legacy graphic editors, outdated email software, and strict corporate systems. Converting WebP back into high-fidelity JPG or standard PNG ensures seamless compatibility for layouts and file shares without risking format errors."
            },
            {
              q: "Does image rasterization happen in the cloud?",
              a: "No. The APEX media platform leverages HTML5 canvas contexts locally inside your browser framework. Image rendering, pixels rasterization, and download compilation run fully in the local memory of your desktop or mobile, ensuring extreme security."
            }
          ].map((item, idx) => (
            <div key={idx} className="beveled-panel border-zinc-900 bg-zinc-950/40 overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 flex justify-between items-center text-left focus:outline-none transition-colors hover:bg-zinc-900/40"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4.5 h-4.5 text-zinc-400" />
                  <span className="font-heading text-xs font-semibold text-white tracking-wide">{item.q}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${faqOpen[idx] ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {faqOpen[idx] && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-zinc-900/60"
                  >
                    <div className="p-4 bg-zinc-950/80">
                      <p className="font-sans text-xs text-zinc-400 leading-relaxed font-normal">{item.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

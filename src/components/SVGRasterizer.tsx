import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileCode, Upload, Code, Clipboard, Check, RefreshCw, Layers, Sliders, 
  Download, Image as ImageIcon, Copy, AlertCircle, Info, Maximize2, Shield, Eye, Settings
} from 'lucide-react';
import { addRecentOperation } from '../utils/recentOperations';
import { usePresets } from '../context/PresetContext';

const SAMPLES = [
  {
    name: 'Shield Emblem',
    code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
    <linearGradient id="innerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="none" />
  <polygon points="50,10 85,25 85,65 50,90 15,65 15,25" fill="url(#shieldGrad)" stroke="#60a5fa" stroke-width="2" stroke-linejoin="round" />
  <polygon points="50,15 80,28 80,62 50,85 20,62 20,28" fill="url(#innerGrad)" stroke="#3b82f6" stroke-width="1.5" stroke-linejoin="round" />
  <circle cx="50" cy="50" r="18" fill="none" stroke="#60a5fa" stroke-width="2" stroke-dasharray="4,2" />
  <polygon points="50,38 60,48 54,48 54,62 46,62 46,48 40,48" fill="#60a5fa" />
</svg>`
  },
  {
    name: 'Gold Mandala',
    code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">
  <rect width="100" height="100" fill="none" />
  <circle cx="50" cy="50" r="45" fill="none" stroke="#f59e0b" stroke-width="0.7" opacity="0.3"/>
  <circle cx="50" cy="50" r="35" fill="none" stroke="#f59e0b" stroke-width="1" opacity="0.5"/>
  <circle cx="50" cy="50" r="25" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.8"/>
  <circle cx="50" cy="50" r="15" fill="none" stroke="#fbbf24" stroke-width="2" />
  <line x1="50" y1="5" x2="50" y2="95" stroke="#f59e0b" stroke-width="0.5" opacity="0.4"/>
  <line x1="5" y1="50" x2="95" y2="50" stroke="#f59e0b" stroke-width="0.5" opacity="0.4"/>
  <line x1="18.18" y1="18.18" x2="81.82" y2="81.82" stroke="#f59e0b" stroke-width="0.5" opacity="0.4"/>
  <line x1="18.18" y1="81.82" x2="81.82" y2="18.18" stroke="#f59e0b" stroke-width="0.5" opacity="0.4"/>
  <polygon points="50,15 60,35 80,35 65,48 70,68 50,55 30,68 35,48 20,35 40,35" fill="none" stroke="#d97706" stroke-width="0.8" />
  <polygon points="50,25 56,38 70,38 59,46 62,60 50,50 38,60 41,46 30,38 44,38" fill="none" stroke="#fbbf24" stroke-width="0.8" />
</svg>`
  },
  {
    name: 'Digital Waves',
    code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">
  <defs>
    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#14b8a6" />
      <stop offset="50%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="none" />
  <path d="M 10,50 Q 30,20 50,50 T 90,50" fill="none" stroke="url(#waveGrad)" stroke-width="3" stroke-linecap="round" />
  <path d="M 10,55 Q 30,25 50,55 T 90,55" fill="none" stroke="url(#waveGrad)" stroke-width="1.5" stroke-linecap="round" opacity="0.6" />
  <path d="M 10,45 Q 30,15 50,45 T 90,45" fill="none" stroke="url(#waveGrad)" stroke-width="1" stroke-linecap="round" opacity="0.4" />
  <circle cx="10" cy="50" r="2" fill="#14b8a6" />
  <circle cx="30" cy="35" r="3" fill="#06b6d4" opacity="0.8"/>
  <circle cx="50" cy="50" r="2.5" fill="#3b82f6" />
  <circle cx="70" cy="65" r="3.5" fill="#3b82f6" opacity="0.7" />
  <circle cx="90" cy="50" r="2" fill="#3b82f6" />
</svg>`
  }
];

export default function SVGRasterizer() {
  const { activeSettings, updateActiveSettings } = usePresets();

  // Load or set SVG settings
  const [svgInput, setSvgInput] = useState<string>(
    () => activeSettings.svgInput || SAMPLES[0].code
  );
  const [outputWidth, setOutputWidth] = useState<number>(
    () => activeSettings.svgWidth || 800
  );
  const [outputHeight, setOutputHeight] = useState<number>(
    () => activeSettings.svgHeight || 800
  );
  const [scale, setScale] = useState<number>(
    () => activeSettings.svgScale || 2
  );
  const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>(
    () => activeSettings.svgOutputFormat || 'png'
  );
  const [bgColorMode, setBgColorMode] = useState<'transparent' | 'color'>(
    () => (activeSettings.svgBgColor ? 'color' : 'transparent')
  );
  const [customBgColor, setCustomBgColor] = useState<string>(
    () => activeSettings.svgBgColor || '#ffffff'
  );

  // SVG metrics parsed live
  const [nativeWidth, setNativeWidth] = useState<number>(400);
  const [nativeHeight, setNativeHeight] = useState<number>(400);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [lockRatio, setLockRatio] = useState<boolean>(true);

  // Runtime statuses
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [rasterResultUrl, setRasterResultUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [notif, setNotif] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotif({ message, type });
    setTimeout(() => setNotif(null), 3000);
  };

  // Safe preset update trigger
  useEffect(() => {
    updateActiveSettings({
      svgInput,
      svgWidth: outputWidth,
      svgHeight: outputHeight,
      svgScale: scale,
      svgOutputFormat: format,
      svgBgColor: bgColorMode === 'color' ? customBgColor : undefined
    });
  }, [svgInput, outputWidth, outputHeight, scale, format, bgColorMode, customBgColor]);

  // Read dimensions from parsed SVG XML string
  const parseSvgMetrics = (rawXml: string) => {
    try {
      if (!rawXml.trim()) {
        setValidationError('SVG source text is empty.');
        return;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(rawXml, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      
      if (parserError) {
        setValidationError(parserError.textContent || 'XML Parsing syntax error.');
        return;
      }

      const svgElement = doc.querySelector('svg');
      if (!svgElement) {
        setValidationError('Could not find wrapping <svg> element tag.');
        return;
      }

      setValidationError(null);

      // Extract raw measurements
      let width = 0;
      let height = 0;

      const widthAttr = svgElement.getAttribute('width');
      const heightAttr = svgElement.getAttribute('height');

      if (widthAttr && !widthAttr.includes('%')) {
        width = parseFloat(widthAttr);
      }
      if (heightAttr && !heightAttr.includes('%')) {
        height = parseFloat(heightAttr);
      }

      // Check viewBox configuration
      const viewBoxAttr = svgElement.getAttribute('viewBox');
      if (viewBoxAttr) {
        const parts = viewBoxAttr.trim().split(/\s+|,/);
        if (parts.length === 4) {
          const vbWidth = parseFloat(parts[2]);
          const vbHeight = parseFloat(parts[3]);
          if (!width) width = vbWidth;
          if (!height) height = vbHeight;
        }
      }

      // Fallbacks if not configured
      if (!width) width = 400;
      if (!height) height = 400;

      setNativeWidth(width);
      setNativeHeight(height);
      const ratio = width / height;
      setAspectRatio(ratio);

      // Adjust output metrics safely conserving lock values
      if (lockRatio) {
        setOutputWidth(Math.round(width * scale));
        setOutputHeight(Math.round((width * scale) / ratio));
      } else {
        setOutputWidth(Math.round(width * scale));
        setOutputHeight(Math.round(height * scale));
      }

    } catch (err: any) {
      setValidationError(err?.message || 'Unexpected SVG reading error occurred');
    }
  };

  // Re-run dimension parsing on XML update
  useEffect(() => {
    parseSvgMetrics(svgInput);
  }, [svgInput]);

  // Adjust aspect ratios on locked constraints changes
  const handleWidthChange = (val: number) => {
    setOutputWidth(val);
    if (lockRatio && aspectRatio) {
      setOutputHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setOutputHeight(val);
    if (lockRatio && aspectRatio) {
      setOutputWidth(Math.round(val * aspectRatio));
    }
  };

  // Triggers conversion internally on canvas context
  const convertSvgToRaster = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        if (validationError) {
          reject(new Error('Fix XML validation errors before conversion.'));
          return;
        }

        setIsProcessing(true);

        // Standardize the XML string check
        if (!svgInput.includes('xmlns=')) {
          // Injection guard to make certain background decoders read namespace correctly
          const injectNamespace = svgInput.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
          setSvgInput(injectNamespace);
        }

        // Draw image structure
        const canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = outputHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to acquire 2D hardware acceleration context.'));
          return;
        }

        // Fill custom backdrop color if selected
        if (bgColorMode === 'color') {
          ctx.fillStyle = customBgColor;
          ctx.fillRect(0, 0, outputWidth, outputHeight);
        } else {
          ctx.clearRect(0, 0, outputWidth, outputHeight);
        }

        // Enable HD rendering filters
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Set up the blob model safely
        const svgBlob = new Blob([svgInput], { type: 'image/svg+xml;charset=utf-8' });
        const blobUrl = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            ctx.drawImage(img, 0, 0, outputWidth, outputHeight);
            
            // Acquire Data URI based on choices
            const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
            const qualityArg = format === 'png' ? undefined : 0.95;
            const dataUrl = canvas.toDataURL(mime, qualityArg);

            URL.revokeObjectURL(blobUrl);
            resolve(dataUrl);
          } catch (drawingErr) {
            URL.revokeObjectURL(blobUrl);
            reject(drawingErr);
          }
        };

        img.onerror = (e) => {
          URL.revokeObjectURL(blobUrl);
          reject(new Error('Rendering issue. The SVG may contain remote image URLs or fonts that are inaccessible offline.'));
        };

        img.src = blobUrl;

      } catch (err) {
        reject(err);
      }
    });
  };

  // Automatically trigger real-time live preview update
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (!validationError) {
        convertSvgToRaster()
          .then((url) => {
            if (active) {
              setRasterResultUrl(url);
              setIsProcessing(false);
            }
          })
          .catch((err) => {
            console.warn('Real-time raster preview skipped:', err.message);
            if (active) setIsProcessing(false);
          });
      }
    }, 450); // Debounce to allow seamless text edits

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [svgInput, outputWidth, outputHeight, format, bgColorMode, customBgColor]);

  // Drag and drop controls
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readSvgFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readSvgFile(file);
    }
  };

  const readSvgFile = (file: File) => {
    if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) {
      triggerNotification('Please upload a valid .svg vector file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setSvgInput(text);
        triggerNotification(`Loaded vector file: ${file.name}`, 'success');
      }
    };
    reader.onerror = () => {
      triggerNotification('Failed to read uploaded SVG file.', 'error');
    };
    reader.readAsText(file);
  };

  // Action: Copy raster bytes to clipboard
  const handleCopyClipboard = async () => {
    if (!rasterResultUrl) {
      triggerNotification('No compiled image available to copy.', 'error');
      return;
    }

    try {
      setCopied(true);
      const response = await fetch(rasterResultUrl);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      triggerNotification('Copied high-res image bytes directly to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      try {
        // Fallback: Copy raw SVG string
        await navigator.clipboard.writeText(svgInput);
        triggerNotification('Copied raw SVG string to clipboard (Raster clipboard not supported in browser)', 'info');
      } catch {
        triggerNotification('Failed to execute copy action.', 'error');
      }
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Action: Execute file download safely
  const handleDownloadRaster = async () => {
    try {
      setIsProcessing(true);
      const dataUrl = await convertSvgToRaster();
      
      const filename = `apex_vector_raster_${Date.now()}.${format}`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Register into recent operations telemetry queue
      addRecentOperation(
        `Rasterized Vector (${format.toUpperCase()})`,
        'Media Processing' as any,
        `${(svgInput.length / 1024).toFixed(1)} KB SVG`,
        `${outputWidth}x${outputHeight}`,
        filename,
        dataUrl
      );

      // Trigger standard local state sync
      window.dispatchEvent(new Event('apex_recent_ops_updated'));
      triggerNotification('High-resolution raster downloaded successfully!', 'success');
      setIsProcessing(false);
    } catch (err: any) {
      console.error(err);
      triggerNotification(err.message || 'Rasterized download sequence failed.', 'error');
      setIsProcessing(false);
    }
  };

  return (
    <div id="svg-rasterizer-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8 select-none">
      
      {/* Toast Notification popup */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border font-mono text-xs shadow-2xl flex items-center gap-3 backdrop-blur-md ${
              notif.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-350' 
                : notif.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-300'
                : 'bg-zinc-950/90 border-zinc-500/30 text-zinc-300'
            }`}
          >
            <Shield className="w-5 h-5 text-emerald-400 rotate-180 animate-pulse" />
            <span>{notif.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: Input form, Code editor, file upload -- Col 7 */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Card 1: Select/Paste Source */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-widest uppercase">SVG Vector Source Code</h3>
            <span className="text-[10px] font-mono font-semibold bg-brand/10 border border-brand/20 text-brand px-2 py-0.5 rounded uppercase">
              Offline Parser
            </span>
          </div>

          {/* Preset Buttons for Fast Demo */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Sandbox Preset Templates</span>
            <div className="flex flex-wrap gap-2">
              {SAMPLES.map((smp) => (
                <button
                  key={smp.name}
                  onClick={() => {
                    setSvgInput(smp.code);
                    triggerNotification(`Loaded vector template: ${smp.name}`, 'info');
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    svgInput === smp.code
                      ? 'bg-brand/15 border-brand/40 text-brand shadow-sm'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
                  }`}
                >
                  {smp.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setSvgInput('');
                  triggerNotification('Code area cleared.', 'info');
                }}
                className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-950/15 text-rose-400 text-[10px] font-mono font-bold hover:bg-rose-950/25 cursor-pointer ml-auto"
              >
                Clear XML
              </button>
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border border-dashed rounded-xl p-4 transition-all duration-300 flex flex-col items-center justify-center text-center gap-1.5 select-none ${
              isDragging
                ? 'bg-brand/15 border-brand/70 scale-98 shadow-md'
                : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".svg"
              className="hidden"
            />
            <Upload className={`w-6 h-6 ${isDragging ? 'text-brand animate-bounce' : 'text-zinc-650'}`} />
            <span className="text-[11px] font-mono text-zinc-400 font-bold">
              {isDragging ? 'RELEASE VECTOR HERE' : 'Drag & Drop .svg file or click to browse'}
            </span>
            <span className="text-[9px] text-zinc-550 font-sans block">
              File runs purely on local web sandboxing. Security compliant.
            </span>
          </div>

          {/* Raw Text Editor Textarea */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Edit raw SVG XML contents</label>
              <span className="text-[10px] font-mono text-zinc-500">{svgInput.length} chars</span>
            </div>
            
            <div className="relative">
              <textarea
                value={svgInput}
                onChange={(e) => setSvgInput(e.target.value)}
                placeholder="<svg ...> \n  <!-- Paste your XML here --> \n</svg>"
                rows={9}
                className="w-full bg-[#030305] border border-zinc-850 focus:border-brand/60 rounded-xl p-4 font-mono text-[11px] text-zinc-300 outline-none transition-all resize-none leading-relaxed overflow-x-auto whitespace-pre tab-size"
              />
              <FileCode className="absolute bottom-3 right-3 text-zinc-800 w-5 h-5 pointer-events-none" />
            </div>

            {/* Parsing Validation Check */}
            {validationError ? (
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-rose-400 block">Syntax validation warning</span>
                  <p className="text-[9px] text-zinc-500 font-sans leading-normal break-words">{validationError}</p>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-950/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-mono text-emerald-400 tracking-wide">
                  COMPLIANT: No active XML errors found. Rendering dynamic vector map.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Custom Resolution Controls & Settings */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-6">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-widest uppercase">Target Dimensions & Upscaling</h3>
            <div className="flex items-center gap-1 text-zinc-500">
              <Sliders className="w-3.5 h-3.5 text-brand" />
              <span className="text-[10px] font-mono uppercase">Upscale Matrix</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Dimensions inputs */}
            <div className="space-y-4">
              <div className="flex justify-between items-center select-none">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Output Dimensions</span>
                <button
                  onClick={() => {
                    setLockRatio(!lockRatio);
                    triggerNotification(lockRatio ? 'Dimensions unlocked.' : 'Dimensions locked to aspect ratio.', 'info');
                  }}
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                    lockRatio 
                      ? 'bg-brand/10 border border-brand/20 text-brand' 
                      : 'bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-zinc-400'
                  }`}
                >
                  {lockRatio ? '🔒 Lock Aspect Ratio' : '🔓 Unlock Dimensions'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase text-zinc-650 block">Width (px)</label>
                  <input
                    type="number"
                    value={outputWidth || ''}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                    min={10}
                    max={8192}
                    className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2.5 rounded-lg text-xs font-mono text-white outline-none focus:border-brand/60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase text-zinc-650 block">Height (px)</label>
                  <input
                    type="number"
                    value={outputHeight || ''}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                    min={10}
                    max={8192}
                    className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2.5 rounded-lg text-xs font-mono text-white outline-none focus:border-brand/60"
                  />
                </div>
              </div>

              {/* Native dimensions indicators */}
              <div className="flex items-center gap-1.5 py-1.5 text-[9px] font-mono text-zinc-500">
                <Info className="w-3.5 h-3.5 text-zinc-600" />
                <span>Original SVG properties: {nativeWidth} × {nativeHeight} px ({lockRatio ? 'conserving ratio' : 'manual mode'})</span>
              </div>
            </div>

            {/* Quick Resolution Factor multipliers */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Quick HD Scale Multipliers</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 1, label: '1x (Orig)' },
                  { value: 2, label: '2x (HD)' },
                  { value: 4, label: '4x (UHD)' },
                  { value: 8, label: '8x (8K)' }
                ].map((scaleOpt) => {
                  const isActive = scale === scaleOpt.value;
                  return (
                    <button
                      key={scaleOpt.value}
                      onClick={() => {
                        setScale(scaleOpt.value);
                        setOutputWidth(Math.round(nativeWidth * scaleOpt.value));
                        setOutputHeight(Math.round(nativeHeight * scaleOpt.value));
                        triggerNotification(`Dimensions set to ${scaleOpt.value}x upscale factor`, 'info');
                      }}
                      className={`py-2 rounded-lg border text-[10px] font-mono font-bold uppercase cursor-pointer text-center transition-all ${
                        isActive
                          ? 'bg-brand/10 border-brand/40 text-brand shadow-sm'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-805'
                      }`}
                    >
                      {scaleOpt.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[8px] text-zinc-550 leading-relaxed font-sans mt-1">
                Vector scaling preserves path vectors without pixelation during upscale. Enjoy crisp curves and solid colors!
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-900">
            
            {/* Background transparent toggle */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Background Backdrop</span>
              <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-900">
                <button
                  onClick={() => {
                    setBgColorMode('transparent');
                    triggerNotification('Backdrop transparency enabled', 'info');
                  }}
                  className={`py-1.5 rounded-md text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    bgColorMode === 'transparent'
                      ? 'bg-brand/10 text-brand shadow-sm'
                      : 'bg-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Transparent
                </button>
                <button
                  onClick={() => {
                    setBgColorMode('color');
                    triggerNotification('Solid backdrop color enabled', 'info');
                  }}
                  className={`py-1.5 rounded-md text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    bgColorMode === 'color'
                      ? 'bg-brand/10 text-brand shadow-sm'
                      : 'bg-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Solid Color
                </button>
              </div>
            </div>

            {/* Custom solid color background hex value */}
            <AnimatePresence mode="wait">
              {bgColorMode === 'color' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-1.5"
                >
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">Solid Color Hex</label>
                  <div className="flex gap-2.5">
                    <input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="w-10 h-10 rounded border border-zinc-800 bg-zinc-950 p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="bg-[#030305] border border-zinc-850 px-3.5 py-2 text-xs font-mono text-zinc-300 rounded-lg outline-none uppercase flex-1 focus:border-brand/40"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Action render, Image preview, compiling diagnostics -- Col 5 */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Card 3: Visual Output Monitor */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between border-b border-brand-border/10 pb-3">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="font-heading text-xs font-bold text-zinc-300 tracking-wider uppercase">Raster Signal View</h3>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              HD Raster output
            </span>
          </div>

          {/* Interactive Bounding Canvas Frame */}
          <div className="relative group w-full max-w-[280px] aspect-square rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4 flex items-center justify-center overflow-hidden flex-col">
            
            {/* Transparent checkers pattern backdrop if option transparent is selected */}
            {bgColorMode === 'transparent' ? (
              <div 
                className="absolute inset-0 opacity-45 pointer-events-none" 
                style={{
                  backgroundImage: 'radial-gradient(#1e1e24 1px, transparent 0), radial-gradient(#1e1e24 1px, transparent 0)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 8px 8px'
                }}
              />
            ) : (
              <div className="absolute inset-0 transition-colors pointer-events-none" style={{ backgroundColor: customBgColor }} />
            )}

            {isProcessing ? (
              <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center space-y-2">
                <RefreshCw className="w-8 h-8 text-brand animate-spin" />
                <span className="text-[10px] font-mono text-zinc-500">Compiling high fidelity layout...</span>
              </div>
            ) : rasterResultUrl ? (
              <div className="relative z-10 p-2 bg-zinc-900/40 border border-zinc-800/50 rounded-xl shadow-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-102">
                <img
                  src={rasterResultUrl}
                  alt="Apex rasterized high-resolution custom outputs"
                  className="w-full h-full max-w-[220px] aspect-square block rounded-lg select-all object-contain shadow-inner"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center select-none">
                <ImageIcon className="w-10 h-10 text-zinc-800 mb-2 stroke-1" />
                <span className="text-[10px] font-mono text-zinc-500">Preview pending</span>
                <p className="text-[8px] text-zinc-600 max-w-[180px] leading-normal pt-1">
                  Adjust metrics or samples above to automatically compose local raster canvas.
                </p>
              </div>
            )}
          </div>

          {/* Diagnostics stats */}
          {!validationError && (
            <div className="w-full grid grid-cols-2 gap-2 text-center text-xs select-none">
              <div className="bg-zinc-950/60 p-2.5 border border-zinc-900 rounded-xl">
                <span className="text-[8px] font-mono text-zinc-600 uppercase block">Parsed Code Weight</span>
                <span className="font-mono text-white text-[11px] font-bold leading-normal">
                  {(svgInput.length / 1024).toFixed(2)} KB
                </span>
              </div>
              <div className="bg-zinc-950/60 p-2.5 border border-zinc-900 rounded-xl">
                <span className="text-[8px] font-mono text-zinc-600 uppercase block">Resolution Canvas</span>
                <span className="font-mono text-emerald-400 text-[11px] font-bold leading-normal">
                  {outputWidth} × {outputHeight} px
                </span>
              </div>
            </div>
          )}

          {/* Settings output configurations */}
          <div className="w-full space-y-4">
            
            {/* Selector formats */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block text-center">Output Format Selection</span>
              <div className="grid grid-cols-3 gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-900">
                {[
                  { id: 'png', label: 'PNG Image' },
                  { id: 'jpg', label: 'JPEG Solid' },
                  { id: 'webp', label: 'WebP Scale' }
                ].map((opt) => {
                  const isActive = format === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setFormat(opt.id as any);
                        triggerNotification(`Output format updated to ${opt.id.toUpperCase()}`, 'info');
                      }}
                      className={`py-1.5 rounded text-[10px] font-mono font-semibold uppercase cursor-pointer text-center transition-all ${
                        isActive
                          ? 'bg-brand/10 border border-brand/20 text-brand shadow-sm'
                          : 'bg-transparent text-zinc-500 hover:text-zinc-350'
                      }`}
                    >
                      {opt.id.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Core Action Command triggers */}
            <div className="space-y-2">
              <button
                onClick={handleCopyClipboard}
                disabled={Boolean(validationError) || !rasterResultUrl}
                className={`w-full py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider select-none border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  copied
                    ? 'bg-emerald-900/40 hover:bg-emerald-900/50 border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-850 text-zinc-300 hover:text-white hover:border-brand/40'
                }`}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-brand" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy High-Res Raster'}</span>
              </button>

              <button
                onClick={handleDownloadRaster}
                disabled={Boolean(validationError) || !rasterResultUrl || isProcessing}
                className="w-full py-3 rounded-xl bg-brand hover:bg-blue-700 disabled:opacity-40 border border-brand/20 text-white text-xs font-bold font-mono uppercase tracking-wider select-none transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand/15 hover:shadow-brand/25"
              >
                <Download className="w-4 h-4" />
                <span>Rasterize & Download HD</span>
              </button>
            </div>

          </div>
        </div>

        {/* Card 4: Hardware security guidelines info panel */}
        <div className="beveled-panel p-5 border-brand-border/30 bg-[#07070a]/80 space-y-2">
          <div className="flex items-center gap-2 text-zinc-400 border-b border-brand-border/10 pb-2">
            <Shield className="w-4 h-4 text-brand" />
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider">Enterprise Security Guard</h4>
          </div>
          <p className="font-sans text-[10px] text-zinc-500 leading-normal">
            Calculations are performed 100% inside your HTML5 Canvas subsystem sandboxing natively. Vector payloads never pass to external cloud API endpoints, bypassing confidentiality leaks. Excellent for securing design blueprints.
          </p>
        </div>

      </div>

    </div>
  );
}

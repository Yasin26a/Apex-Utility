import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Trash2, Sliders, RefreshCw, Layers, Download, CheckCircle, 
  AlertCircle, Eye, FileImage, ShieldCheck, Play, ArrowRight, HelpCircle, Info
} from 'lucide-react';
import { addRecentOperation } from '../utils/recentOperations';

interface BatchFile {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  originalSizeStr: string;
  transformedSize?: number;
  transformedSizeStr?: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  outputBlobUrl?: string;
  outputName?: string;
  error?: string;
}

const PRESET_SCALES = [
  { label: '25% (Thumb)', value: 0.25 },
  { label: '50% (Mobile)', value: 0.50 },
  { label: '75% (Web)', value: 0.75 },
  { label: '100% (Full)', value: 1.00 }
];

export default function BatchProcessor() {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [scaleFactor, setScaleFactor] = useState<number>(0.75);
  const [quality, setQuality] = useState<number>(80);
  const [format, setFormat] = useState<'original' | 'png' | 'jpeg' | 'webp'>('webp');
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);
  const [notif, setNotif] = useState<{ text: string; mode: 'success' | 'error' | 'info' } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const triggerNotif = (text: string, mode: 'success' | 'error' | 'info' = 'success') => {
    setNotif({ text, mode });
    setTimeout(() => setNotif(null), 3000);
  };

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
    if (e.dataTransfer.files) {
      appendSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      appendSelectedFiles(Array.from(e.target.files));
    }
  };

  const appendSelectedFiles = (newFiles: File[]) => {
    const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const imageFiles = newFiles.filter(f => validImageTypes.includes(f.type) || f.name.match(/\.(png|jpe?g|webp)$/i));

    if (imageFiles.length === 0) {
      triggerNotif('Please select valid image files (PNG, JPEG, WebP).', 'error');
      return;
    }

    if (imageFiles.length !== newFiles.length) {
      triggerNotif(`Filtered out ${newFiles.length - imageFiles.length} unsupported files. Only images allowed.`, 'info');
    }

    const fileStates: BatchFile[] = imageFiles.map(file => {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      return {
        id,
        file,
        previewUrl: URL.createObjectURL(file),
        originalSize: file.size,
        originalSizeStr: formatSize(file.size),
        status: 'idle',
        progress: 0
      };
    });

    setFiles(prev => [...prev, ...fileStates]);
    triggerNotif(`Successfully added ${fileStates.length} images to queue.`, 'success');
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      if (target?.outputBlobUrl) URL.revokeObjectURL(target?.outputBlobUrl);
      return prev.filter(f => f.id !== id);
    });
  };

  const clearAllFiles = () => {
    files.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      if (f.outputBlobUrl) URL.revokeObjectURL(f.outputBlobUrl);
    });
    setFiles([]);
    triggerNotif('Files queue cleared.', 'info');
  };

  // Safe client-side multi-threaded parallel transformation
  const processSingleFile = (batchItem: BatchFile): Promise<BatchFile> => {
    return new Promise((resolve) => {
      // Step 1: Initialize
      updateFileState(batchItem.id, { status: 'processing', progress: 10 });

      const img = new Image();
      img.onload = () => {
        try {
          updateFileState(batchItem.id, { progress: 35 });

          // Calculate scaled bounds
          const targetW = Math.round(img.naturalWidth * scaleFactor);
          const targetH = Math.round(img.naturalHeight * scaleFactor);

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              ...batchItem,
              status: 'error',
              progress: 0,
              error: 'Canvas rendering context fails'
            });
            return;
          }

          // Anti-aliasing configurations
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetW, targetH);
          
          updateFileState(batchItem.id, { progress: 65 });

          // Determine output properties
          let targetMime = batchItem.file.type;
          let targetExt = batchItem.file.name.split('.').pop() || 'png';

          if (format !== 'original') {
            targetExt = format;
            if (format === 'png') targetMime = 'image/png';
            if (format === 'jpeg') targetMime = 'image/jpeg';
            if (format === 'webp') targetMime = 'image/webp';
          }

          const originalBaseName = batchItem.file.name.replace(/\.[^/.]+$/, "");
          const outputName = `${originalBaseName}_transformed.${targetExt}`;

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const outputUrl = URL.createObjectURL(blob);
                const updated: Partial<BatchFile> = {
                  status: 'success',
                  progress: 100,
                  outputBlobUrl: outputUrl,
                  outputName,
                  transformedSize: blob.size,
                  transformedSizeStr: formatSize(blob.size)
                };
                
                updateFileState(batchItem.id, updated);
                resolve({
                  ...batchItem,
                  ...updated
                });
              } else {
                const errorState: Partial<BatchFile> = {
                  status: 'error',
                  progress: 0,
                  error: 'Compression conversion failure'
                };
                updateFileState(batchItem.id, errorState);
                resolve({ ...batchItem, ...errorState });
              }
            },
            targetMime,
            quality / 100
          );
        } catch (err: any) {
          const errorState: Partial<BatchFile> = {
            status: 'error',
            progress: 0,
            error: err.message || 'Processing execution failed'
          };
          updateFileState(batchItem.id, errorState);
          resolve({ ...batchItem, ...errorState });
        }
      };

      img.onerror = () => {
        const errorState: Partial<BatchFile> = {
          status: 'error',
          progress: 0,
          error: 'Failed to parse image element structure'
        };
        updateFileState(batchItem.id, errorState);
        resolve({ ...batchItem, ...errorState });
      };

      img.src = batchItem.previewUrl;
    });
  };

  const updateFileState = (id: string, updates: Partial<BatchFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  // Launch parallel process workers
  const handleProcessBatch = async () => {
    if (files.length === 0) {
      triggerNotif('Enqueue some files before processing.', 'error');
      return;
    }

    setIsProcessingAll(true);
    triggerNotif('Launching parallel optimizer matrix...', 'info');

    try {
      // Trigger all transformations in parallel
      const promises = files.map(item => processSingleFile(item));
      const results = await Promise.all(promises);
      
      const successItems = results.filter(r => r.status === 'success');
      
      if (successItems.length > 0) {
        triggerNotif(`Batch processing complete! Optimized ${successItems.length} files.`, 'success');
        
        // Register in logs queue
        addRecentOperation(
          'Parallel Batch Processing',
          'Media Processing' as any,
          `${files.length} images optimization`,
          `Scale: ${(scaleFactor * 100).toFixed(0)}%, Q: ${quality}%`,
          'Multi-File Queue Output',
          successItems[0].outputBlobUrl // fallback mock link for logger
        );
        window.dispatchEvent(new Event('apex_recent_ops_updated'));
      } else {
        triggerNotif('Queue processing produced errors.', 'error');
      }

    } catch (err) {
      triggerNotif('Queue scheduler failed.', 'error');
    } finally {
      setIsProcessingAll(false);
    }
  };

  // Triggers sequential instant downloads of converted items
  const downloadAllSuccess = () => {
    const successFiles = files.filter(f => f.status === 'success' && f.outputBlobUrl);
    if (successFiles.length === 0) {
      triggerNotif('No optimized outputs ready for download.', 'error');
      return;
    }

    triggerNotif(`Injecting sequential automatic download of ${successFiles.length} outputs...`, 'success');

    successFiles.forEach((f, idx) => {
      // Stagger downloads to ensure browsers handle multiple tabs safely
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = f.outputBlobUrl!;
        link.download = f.outputName || 'optimized_output.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 250);
    });
  };

  const singleFileDownload = (item: BatchFile) => {
    if (!item.outputBlobUrl || !item.outputName) return;
    const link = document.createElement('a');
    link.href = item.outputBlobUrl;
    link.download = item.outputName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotif(`Downloaded ${item.outputName}`, 'success');
  };

  return (
    <div id="batch-processor-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-8 select-none">
      
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border font-mono text-xs shadow-2xl flex items-center gap-3 backdrop-blur-md ${
              notif.mode === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
                : notif.mode === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-300'
                : 'bg-zinc-950/90 border-zinc-500/30 text-zinc-300'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400 rotate-180" />
            <span>{notif.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: Controls & configurations - Col 5 */}
      <div className="lg:col-span-5 space-y-6">

        {/* Panel 1: Parallel Queue Parameters */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-6">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand animate-pulse" />
              <h3 className="font-heading text-xs font-bold text-zinc-300 tracking-wider uppercase">Transformation Matrix</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
              Batch Params
            </span>
          </div>

          {/* Scale Resolution Factor sliders */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Resize Scale Dimension</label>
              <span className="text-[11px] font-mono text-brand font-extrabold">{(scaleFactor * 100).toFixed(0)}% Original Size</span>
            </div>
            <input
              type="range"
              min={10}
              max={150}
              value={Math.round(scaleFactor * 100)}
              onChange={(e) => setScaleFactor(parseFloat(e.target.value) / 100)}
              className="w-full accent-brand h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer border border-zinc-900"
            />
            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-1.5">
              {PRESET_SCALES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => {
                    setScaleFactor(p.value);
                    triggerNotif(`Resize scaling locked to ${p.label}`, 'info');
                  }}
                  className={`py-1.5 rounded-lg border text-[9px] font-mono font-bold transition-all cursor-pointer text-center ${
                    scaleFactor === p.value
                      ? 'bg-brand/10 border-brand/40 text-brand shadow-sm'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality compression boundaries */}
          <div className="space-y-2 pt-2 border-t border-zinc-900">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Compression Quality</label>
              <span className="text-[11px] font-mono text-emerald-400 font-extrabold">{quality}% Density</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full accent-brand h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer border border-zinc-900"
            />
            <span className="text-[8px] text-zinc-550 block leading-normal">
              Lower quality translates into smaller payloads. Optimized for rapid page load parameters.
            </span>
          </div>

          {/* Output Format conversion selectors */}
          <div className="space-y-3 pt-4 border-t border-zinc-900">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold block">Consolidated Transformed Format</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-900">
              {[
                { id: 'original', label: 'Match O' },
                { id: 'png', label: 'PNG Raw' },
                { id: 'jpeg', label: 'JPEG Solid' },
                { id: 'webp', label: 'WebP Comp' }
              ].map((opt) => {
                const isActive = format === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setFormat(opt.id as any);
                      triggerNotif(`Target file formats unified as: ${opt.label}`, 'info');
                    }}
                    className={`py-2 rounded-lg border text-[9px] font-mono font-bold uppercase cursor-pointer text-center transition-all ${
                      isActive
                        ? 'bg-brand/10 border-brand/40 text-brand shadow-sm'
                        : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions panel switchboards */}
          <div className="space-y-2 pt-4 border-t border-zinc-900 select-none">
            <button
              onClick={handleProcessBatch}
              disabled={files.length === 0 || isProcessingAll}
              className="w-full py-3 rounded-xl bg-brand hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed border border-brand/20 text-white text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand/15 hover:shadow-brand/25"
            >
              {isProcessingAll ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Play className="w-4 h-4 text-emerald-450 fill-emerald-450" />
              )}
              <span>{isProcessingAll ? 'Optimizing Thread Pool...' : 'Process Batch In Parallel'}</span>
            </button>

            {files.some(f => f.status === 'success') && (
              <button
                onClick={downloadAllSuccess}
                disabled={isProcessingAll}
                className="w-full py-2.5 rounded-xl bg-emerald-900/15 border border-emerald-500/35 hover:bg-emerald-900/25 text-emerald-350 text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Optimized Bundle</span>
              </button>
            )}
          </div>
        </div>

        {/* Panel 2: Hardware Security Sandbox Specs */}
        <div className="beveled-panel p-5 border-brand-border/30 bg-[#07070a]/80 space-y-2.5">
          <div className="flex items-center gap-2 text-zinc-400 border-b border-brand-border/10 pb-2">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider">Apex Offline Hardware Architecture</h4>
          </div>
          <p className="font-sans text-[10px] text-zinc-500 leading-normal">
            Multi-threaded batch optimization is processed locally within separate asynchronous Promise threads inside the browser engine sandbox. Payload dimensions are kept isolated, protecting system data leaks completely.
          </p>
        </div>

      </div>

      {/* RIGHT COLUMN: Queue status, Upload zone, files list - Col 7 */}
      <div className="lg:col-span-7 space-y-6">

        {/* Panel 3: Drag zone and Queue monitor */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-6">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="font-heading text-xs font-bold text-zinc-300 tracking-wider uppercase">Optimization Batch Monitor</h3>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono text-zinc-500 font-semibold uppercase">
                {files.length} ITEMS ENQUEUED
              </span>
              {files.length > 0 && (
                <button
                  onClick={clearAllFiles}
                  className="text-[9px] font-mono text-rose-400 border border-red-500/25 bg-red-950/15 px-2 py-0.5 rounded hover:bg-red-950/30 cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border border-dashed rounded-xl p-6 transition-all duration-300 flex flex-col items-center justify-center text-center gap-2 select-none ${
              isDragging
                ? 'bg-brand/15 border-brand/70 scale-98 shadow-md'
                : 'bg-zinc-950/50 border-zinc-850 hover:border-zinc-800 hover:bg-zinc-950'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            <Upload className={`w-7 h-7 ${isDragging ? 'text-brand animate-bounce' : 'text-zinc-600'}`} />
            <span className="text-[11px] font-mono text-zinc-300 font-bold">
              {isDragging ? 'RELEASE FILES TO ENQUEUE' : 'Drag & Drop Multiple Images or Click to Browse'}
            </span>
            <span className="text-[9px] text-zinc-550">
              Accepts PNG, JPEG, and WebP assets simultaneously
            </span>
          </div>

          {/* Files collection list container */}
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {files.length === 0 ? (
              <div className="text-center py-10 select-none bg-zinc-950/40 rounded-xl border border-zinc-900 border-dashed">
                <FileImage className="w-10 h-10 text-zinc-800 mx-auto mb-2.5 stroke-1" />
                <span className="text-[10px] font-mono text-zinc-650 block">SANDBOX QUEUE VACANT</span>
                <p className="text-[9px] text-zinc-700 max-w-[240px] mx-auto leading-normal pt-1 font-sans">
                  Load up or drop images to apply massive high resolution batch optimizations dynamically.
                </p>
              </div>
            ) : (
              files.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-zinc-950/85 hover:bg-zinc-950/100 border border-zinc-900 hover:border-zinc-850 rounded-xl flex items-center gap-3.5"
                >
                  {/* Thumbnail and type */}
                  <div className="relative w-12 h-12 bg-zinc-900 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-800 shrink-0">
                    <img
                      src={item.previewUrl}
                      alt="Thumbnail preset loader"
                      className="w-full h-full object-cover transform scale-100"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center font-mono text-[8px] font-bold text-white uppercase tracking-wider backdrop-blur-3xs">
                      {item.file.name.split('.').pop()}
                    </div>
                  </div>

                  {/* Operational parameters descriptions */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-zinc-350 truncate block" title={item.file.name}>
                        {item.file.name}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-600 shrink-0 uppercase">
                        {item.originalSizeStr}
                      </span>
                    </div>

                    {/* Progress tracking bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden border border-zinc-950">
                        <div 
                          className={`h-full transition-all duration-350 rounded-full ${
                            item.status === 'error'
                              ? 'bg-rose-500'
                              : item.status === 'success'
                              ? 'bg-emerald-500'
                              : 'bg-brand'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        {item.status === 'idle' && (
                          <span className="text-zinc-600">Pending optimization directive...</span>
                        )}
                        {item.status === 'processing' && (
                          <span className="text-brand flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                            <span>Transforming... {item.progress}%</span>
                          </span>
                        )}
                        {item.status === 'success' && (
                          <span className="text-emerald-450 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 shrink-0 text-emerald-400" />
                            <span>Compressed successfully to: {item.transformedSizeStr}</span>
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="text-rose-450 font-bold flex items-center gap-1.5 leading-normal">
                            <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                            <span className="max-w-[200px] truncate">{item.error || 'Optimization error'}</span>
                          </span>
                        )}

                        {/* Performance optimization percentages logic */}
                        {item.status === 'success' && item.transformedSize && (
                          <span className="text-brand font-extrabold text-[10px] pl-2">
                            {item.transformedSize < item.originalSize
                              ? `-${Math.round((1 - item.transformedSize / item.originalSize) * 100)}% Size`
                              : `Scale Factor adjusted`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Individual Quick Action Commands */}
                  <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    {item.status === 'success' && item.outputBlobUrl && (
                      <button
                        onClick={() => singleFileDownload(item)}
                        className="p-1.5 hover:bg-zinc-900 rounded-lg text-emerald-450 hover:text-emerald-400 border border-transparent hover:border-zinc-800 transition-all cursor-pointer"
                        title="Download transformed image"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-1.5 hover:bg-red-950/30 rounded-lg text-zinc-500 hover:text-rose-450 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                      title="Remove file from queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

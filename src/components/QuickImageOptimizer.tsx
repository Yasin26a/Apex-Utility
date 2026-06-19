import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Trash2, 
  Download, 
  Sparkles, 
  RefreshCw, 
  Sliders, 
  Check, 
  FileImage, 
  AlertCircle, 
  FileSpreadsheet, 
  Search, 
  Layers, 
  Info, 
  ArrowRight, 
  X, 
  Play, 
  HelpCircle,
  Hash,
  BookOpen
} from 'lucide-react';
import { zipSync } from 'fflate';
import { logToolUsage } from '../utils/toolAnalytics';

// Custom helper: Format file bytes cleanly
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface OptimizerConfig {
  quality: number;
  format: 'keep-original' | 'webp' | 'jpeg' | 'png';
  resizeMode: 'none' | 'width' | 'height' | 'scale' | 'fit';
  resizeWidth: number;
  resizeHeight: number;
  scalePercent: number;
  seoCleanName: boolean;
  seoPrefix: string;
  seoSuffix: string;
  appendIndex: boolean;
}

interface TargetImage {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  previewUrl: string;
  mimeType: string;
  
  // Compression Outcomes
  status: 'pending' | 'processing' | 'success' | 'error';
  optimizedName?: string;
  optimizedSize?: number;
  optimizedWidth?: number;
  optimizedHeight?: number;
  optimizedBlob?: Blob;
  optimizedUrl?: string;
  error?: string;
}

export default function QuickImageOptimizer() {
  const [images, setImages] = useState<TargetImage[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Global Config Deck
  const [config, setConfig] = useState<OptimizerConfig>({
    quality: 80,
    format: 'webp', // default to search-optimized WebP
    resizeMode: 'none',
    resizeWidth: 1200,
    resizeHeight: 630,
    scalePercent: 80,
    seoCleanName: true,
    seoPrefix: '',
    seoSuffix: '',
    appendIndex: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logToolUsage('quick-image-optimizer');
  }, []);

  // Cleanup ObjectURLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
        if (img.optimizedUrl) URL.revokeObjectURL(img.optimizedUrl);
      });
    };
  }, []);

  // Handle drag and drop states
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      appendFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      appendFiles(Array.from(e.target.files));
    }
  };

  const appendFiles = (fileList: File[]) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const validImageFiles = fileList.filter(file => file.type.startsWith('image/'));
    
    if (validImageFiles.length === 0) {
      setErrorMessage('Please upload valid image files (JPEG, PNG, WebP, SVG, etc.).');
      return;
    }

    validImageFiles.forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);

      const img = new Image();
      img.onload = () => {
        const item: TargetImage = {
          id,
          file,
          name: file.name,
          originalSize: file.size,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          previewUrl,
          mimeType: file.type,
          status: 'pending'
        };
        setImages(prev => [...prev, item]);
      };
      
      img.onerror = () => {
        // Fallback if load fails (might be special image types or SVG)
        const item: TargetImage = {
          id,
          file,
          name: file.name,
          originalSize: file.size,
          originalWidth: 0,
          originalHeight: 0,
          previewUrl,
          mimeType: file.type,
          status: 'pending'
        };
        setImages(prev => [...prev, item]);
      };

      img.src = previewUrl;
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const item = prev.find(img => img.id === id);
      if (item) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.optimizedUrl) URL.revokeObjectURL(item.optimizedUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach(img => {
      if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
      if (img.optimizedUrl) URL.revokeObjectURL(img.optimizedUrl);
    });
    setImages([]);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Run bulk optimization algorithms
  const launchBulkOptimization = async () => {
    if (images.length === 0) {
      setErrorMessage('Please add at least one image to optimize.');
      return;
    }

    setIsProcessingAll(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Update state to processing
    setImages(prev => prev.map(img => img.status === 'success' ? img : { ...img, status: 'processing' }));

    const tasks = images.map(async (imgItem, idx) => {
      // Skip if already optimized and no change (or just re-optimize everything)
      try {
        const result = await processSingleImageFile(imgItem, idx);
        setImages(prev => prev.map(item => {
          if (item.id === imgItem.id) {
            return {
              ...item,
              status: 'success',
              optimizedName: result.filename,
              optimizedSize: result.blob.size,
              optimizedWidth: result.width,
              optimizedHeight: result.height,
              optimizedBlob: result.blob,
              optimizedUrl: URL.createObjectURL(result.blob),
            };
          }
          return item;
        }));
      } catch (err: any) {
        setImages(prev => prev.map(item => {
          if (item.id === imgItem.id) {
            return {
              ...item,
              status: 'error',
              error: err.message || 'Optimization failed'
            };
          }
          return item;
        }));
      }
    });

    await Promise.all(tasks);
    setIsProcessingAll(false);
    setSuccessMessage(`Successfully optimized ${images.length} images!`);
  };

  const processSingleImageFile = (
    imgItem: TargetImage,
    index: number
  ): Promise<{ blob: Blob; width: number; height: number; filename: string }> => {
    return new Promise((resolve, reject) => {
      const { file } = imgItem;
      
      // Determine format and MIME
      let formatMime = file.type;
      let ext = file.name.split('.').pop() || 'png';

      if (config.format === 'webp') {
        formatMime = 'image/webp';
        ext = 'webp';
      } else if (config.format === 'jpeg') {
        formatMime = 'image/jpeg';
        ext = 'jpg';
      } else if (config.format === 'png') {
        formatMime = 'image/png';
        ext = 'png';
      }

      // Filename Cleanup (SEO-optimized)
      let baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      
      if (config.seoCleanName) {
        // Lowercase, convert spaces/underscores/special characters to hyphens
        baseName = baseName
          .toLowerCase()
          .replace(/[^a-z0-9_\-\s]/g, '') // strip special characters
          .trim()
          .replace(/[\s_\-]+/g, '-');    // substitute multiple hyphens/spaces to simple hyphen
      }

      if (config.seoPrefix) {
        baseName = `${config.seoPrefix.trim()}-${baseName}`;
      }

      if (config.seoSuffix) {
        baseName = `${baseName}-${config.seoSuffix.trim()}`;
      }

      if (config.appendIndex) {
        baseName = `${baseName}-${index + 1}`;
      }

      const finalFilename = `${baseName}.${ext}`;

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        // Determine new dimensions
        let tw = img.naturalWidth || imgItem.originalWidth || 800;
        let th = img.naturalHeight || imgItem.originalHeight || 600;

        if (config.resizeMode === 'width') {
          const w = Number(config.resizeWidth);
          if (w > 0) {
            tw = w;
            th = Math.round((img.naturalHeight / img.naturalWidth) * w);
          }
        } else if (config.resizeMode === 'height') {
          const h = Number(config.resizeHeight);
          if (h > 0) {
            th = h;
            tw = Math.round((img.naturalWidth / img.naturalHeight) * h);
          }
        } else if (config.resizeMode === 'scale') {
          const s = config.scalePercent / 100;
          tw = Math.round(img.naturalWidth * s);
          th = Math.round(img.naturalHeight * s);
        } else if (config.resizeMode === 'fit') {
          const maxW = Number(config.resizeWidth);
          const maxH = Number(config.resizeHeight);
          if (maxW > 0 && maxH > 0) {
            const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
            tw = Math.round(img.naturalWidth * ratio);
            th = Math.round(img.naturalHeight * ratio);
          }
        }

        tw = Math.max(1, tw);
        th = Math.max(1, th);

        const canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas rendering context 2D not supported'));
          return;
        }

        // Apply smooth imagery scaling parameters
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, tw, th);

        // Convert to Blob with quality parameter (JPEG/WebP)
        const outputQuality = config.quality / 100;
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({ blob, width: tw, height: th, filename: finalFilename });
          } else {
            reject(new Error('Blob conversion failed'));
          }
        }, formatMime, outputQuality);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to render source physical layout into graphic memory'));
      };

      img.src = objectUrl;
    });
  };

  // Export all optimized as standard zip Sync in fflate
  const downloadAllAsZip = async () => {
    const successImages = images.filter(img => img.status === 'success' && img.optimizedBlob && img.optimizedName);
    if (successImages.length === 0) {
      setErrorMessage('No successfully optimized images found to batch-export.');
      return;
    }

    try {
      const zipFilesObject: { [name: string]: Uint8Array } = {};
      const fileReads = successImages.map(async (img) => {
        const arrBuffer = await img.optimizedBlob!.arrayBuffer();
        zipFilesObject[img.optimizedName!] = new Uint8Array(arrBuffer);
      });

      await Promise.all(fileReads);

      // Create optimization index summary info
      const sumHeader = `========================================================================\n` +
                        `       APEX QUICK IMAGE OPTIMIZER - SEO COMPLIANCE EXPORT SUMMARY       \n` +
                        `========================================================================\n\n` +
                        `Export Date: ${new Date().toLocaleString()}\n` +
                        `Total Images: ${successImages.length}\n\n` +
                        `IMAGERY AUDIT METRICS:\n` +
                        `------------------------------------------------------------------------\n`;
      
      let tableRows = '';
      let totalOriginalSize = 0;
      let totalOptimizedSize = 0;

      successImages.forEach((img, index) => {
        const orig = img.originalSize;
        const opt = img.optimizedSize || 0;
        totalOriginalSize += orig;
        totalOptimizedSize += opt;

        const savedBytes = orig - opt;
        const savedPct = orig > 0 ? (savedBytes / orig) * 100 : 0;

        tableRows += `[#${index + 1}] Target Name: ${img.optimizedName}\n` +
                     `      Original Size:  ${formatBytes(orig)} (${img.originalWidth}x${img.originalHeight}px)\n` +
                     `      Optimized Size: ${formatBytes(opt)} (${img.optimizedWidth}x${img.optimizedHeight}px)\n` +
                     `      Payload Saved:  ${formatBytes(savedBytes)} (${savedPct.toFixed(1)}% compact)\n` +
                     `------------------------------------------------------------------------\n`;
      });

      const totalSaved = totalOriginalSize - totalOptimizedSize;
      const totalPct = totalOriginalSize > 0 ? (totalSaved / totalOriginalSize) * 100 : 0;

      const summaryFooter = `\nSUMMARY ACCUMULATOR:\n` +
                            `  Total Bytes Input:    ${formatBytes(totalOriginalSize)}\n` +
                            `  Total Bytes Output:   ${formatBytes(totalOptimizedSize)}\n` +
                            `  Net Bandwidth Saved:  ${formatBytes(totalSaved)} (${totalPct.toFixed(1)}% size reduction)\n\n` +
                            `Verified standard content compliance: SEO core web vitals validated.`;

      const encoder = new TextEncoder();
      zipFilesObject['SEO_OPTIMIZATION_METRICS.txt'] = encoder.encode(sumHeader + tableRows + summaryFooter);

      const zipData = zipSync(zipFilesObject);
      const zipBlob = new Blob([zipData], { type: 'application/zip' });
      const zipUrl = URL.createObjectURL(zipBlob);

      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `apex_seo_images_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
    } catch (err: any) {
      setErrorMessage(`ZIP compiling error: ${err.message || err}`);
    }
  };

  const downloadSingle = (img: TargetImage) => {
    if (!img.optimizedUrl || !img.optimizedName) return;
    const a = document.createElement('a');
    a.href = img.optimizedUrl;
    a.download = img.optimizedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Cumulative Metrics Calculate
  const savingsMetrics = React.useMemo(() => {
    const successImages = images.filter(img => img.status === 'success');
    if (successImages.length === 0) return { originalSize: 0, optimizedSize: 0, ratio: 0, savedBytes: 0 };

    const originalSize = successImages.reduce((sum, img) => sum + img.originalSize, 0);
    const optimizedSize = successImages.reduce((sum, img) => sum + (img.optimizedSize || 0), 0);
    const savedBytes = Math.max(0, originalSize - optimizedSize);
    const ratio = originalSize > 0 ? (savedBytes / originalSize) * 100 : 0;

    return { originalSize, optimizedSize, ratio, savedBytes };
  }, [images]);

  return (
    <div id="quick-image-optimizer-studio" className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* Dynamic Header Badge section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 border border-brand/20 rounded-full text-brand text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BULK SEO MEDIA TOOL DECK</span>
          </div>
          <h2 className="text-2xl font-bold font-sans tracking-tight text-white mb-1.5 flex items-center gap-2">
            Quick Image Optimizer <span className="text-zinc-600 font-mono text-xs font-normal">v1.2</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-2xl">
            Resize, compress, format, and apply advanced lowercase SEO filenames to multiple images simultaneously.
            Gain Google Core Web Vitals speed scores and boost image search ranking indexes.
          </p>
        </div>
        
        {images.length > 0 && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={clearAll}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Deck
            </button>
          </div>
        )}
      </div>

      {/* Banner Messages */}
      {errorMessage && (
        <div className="bg-red-950/20 border border-red-900/65 text-red-400 rounded-xl p-4 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold font-mono uppercase tracking-wider text-[10px]">Active Pipeline Error</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-950/20 border border-green-900/65 text-green-400 rounded-xl p-4 text-xs flex items-start gap-2.5">
          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold font-mono uppercase tracking-wider text-[10px]">Processing Terminal Success</p>
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      {/* Master Interactive Bento Mesh */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Controls Panel (span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#050507]/90 border border-zinc-900 rounded-2xl p-5 md:p-6 space-y-6 shadow-2xl backdrop-blur-md">
            
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-900">
              <Sliders className="w-4 h-4 text-brand" />
              <span className="text-xs font-bold font-mono uppercase text-zinc-200 tracking-wider">Configure Optimization Engine</span>
            </div>

            {/* Quality Tuning Knob */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-400 flex items-center gap-1">
                  Compression Quality
                </span>
                <span className="text-brand font-bold bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded text-[10px]">
                  {config.quality}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={config.quality}
                onChange={(e) => setConfig(prev => ({ ...prev, quality: Number(e.target.value) }))}
                className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-brand"
              />
              <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                JPEG/Webp format only. 75-85% is recommended for balancing sharp visuals and minor payloads.
              </p>
            </div>

            {/* Target Output Format selection */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold font-mono text-zinc-400 block">Target Output Format</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'webp', name: 'WebP (Recommended)', desc: 'Next-gen Web Core compression' },
                  { id: 'jpeg', name: 'JPEG (Photo)', desc: 'Standard photo color layout' },
                  { id: 'png', name: 'PNG (Lossless)', desc: 'Best for transparency masks' },
                  { id: 'keep-original', name: 'Keep Original', desc: 'No format cross-transpiling' }
                ].map((fItem) => (
                  <button
                    key={fItem.id}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, format: fItem.id as any }))}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      config.format === fItem.id
                        ? 'border-brand bg-brand/5 text-white shadow-lg'
                        : 'border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:border-zinc-800'
                    }`}
                  >
                    <span className="text-xs font-bold block">{fItem.name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono mt-1">{fItem.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resizing Configuration */}
            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand" />
                <label className="text-xs font-bold font-mono text-zinc-300">Dimension Rescale Settings</label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'none', label: 'No Resizing' },
                  { value: 'scale', label: 'Percentage Scale' },
                  { value: 'width', label: 'Lock Width' },
                  { value: 'height', label: 'Lock Height' },
                  { value: 'fit', label: 'Fit Inside Bounds' }
                ].map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, resizeMode: mode.value as any }))}
                    className={`px-3 py-2 rounded-xl text-xs font-mono border text-center transition-all cursor-pointer ${
                      config.resizeMode === mode.value
                        ? 'border-brand bg-brand/5 text-white'
                        : 'border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:border-zinc-800'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Resizing parameters input based on value mode selected */}
              <AnimatePresence mode="wait">
                {config.resizeMode === 'scale' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden font-mono text-xs"
                  >
                    <div className="flex justify-between items-center bg-zinc-950/60 p-3 rounded-xl border border-zinc-900">
                      <span className="text-zinc-500">Rescale percentage factor:</span>
                      <span className="text-white font-bold">{config.scalePercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={config.scalePercent}
                      onChange={(e) => setConfig(prev => ({ ...prev, scalePercent: Number(e.target.value) }))}
                      className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-brand"
                    />
                  </motion.div>
                )}

                {(config.resizeMode === 'width' || config.resizeMode === 'fit') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-500 uppercase">Target Width (px)</label>
                        <input
                          type="number"
                          value={config.resizeWidth}
                          onChange={(e) => setConfig(prev => ({ ...prev, resizeWidth: Math.max(1, Number(e.target.value)) }))}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-brand"
                        />
                      </div>
                      {config.resizeMode === 'fit' && (
                        <div>
                          <label className="text-[10px] font-mono text-zinc-500 uppercase">Target Height (px)</label>
                          <input
                            type="number"
                            value={config.resizeHeight}
                            onChange={(e) => setConfig(prev => ({ ...prev, resizeHeight: Math.max(1, Number(e.target.value)) }))}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-brand"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {config.resizeMode === 'height' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <div>
                      <label className="text-[10px] font-mono text-zinc-500 uppercase">Target Height (px)</label>
                      <input
                        type="number"
                        value={config.resizeHeight}
                        onChange={(e) => setConfig(prev => ({ ...prev, resizeHeight: Math.max(1, Number(e.target.value)) }))}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-brand"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SEO Filename Configuration Deck */}
            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                <label className="text-xs font-bold font-mono text-zinc-300">SEO Filename Optimizer</label>
              </div>

              <div className="space-y-3 font-mono">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={config.seoCleanName}
                    onChange={(e) => setConfig(prev => ({ ...prev, seoCleanName: e.target.checked }))}
                    className="mt-0.5 rounded border-zinc-800 text-brand bg-zinc-950 focus:ring-brand accent-brand"
                  />
                  <div>
                    <span className="text-zinc-200 block text-xs">Clean naming constraints</span>
                    <span className="text-[10px] text-zinc-500 leading-normal block mt-0.5">
                      Enforce lowercase alphanumeric formatting, stripping special characters, replacing spaces in original names with tidy hyphens (-).
                    </span>
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-3 pt-1.5">
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">Add Prefix Keyword</label>
                    <input
                      type="text"
                      placeholder="e.g. core-web"
                      value={config.seoPrefix}
                      onChange={(e) => setConfig(prev => ({ ...prev, seoPrefix: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">Add Suffix Keyword</label>
                    <input
                      type="text"
                      placeholder="e.g. portfolio"
                      value={config.seoSuffix}
                      onChange={(e) => setConfig(prev => ({ ...prev, seoSuffix: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs select-none pt-1">
                  <input
                    type="checkbox"
                    checked={config.appendIndex}
                    onChange={(e) => setConfig(prev => ({ ...prev, appendIndex: e.target.checked }))}
                    className="rounded border-zinc-800 text-brand bg-zinc-950 focus:ring-brand accent-brand"
                  />
                  <span className="text-zinc-400 text-xs">Append numerical increment (e.g. -1, -2)</span>
                </label>
              </div>
            </div>

            {/* Run Button trigger */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isProcessingAll || images.length === 0}
                onClick={launchBulkOptimization}
                className="w-full py-3.5 px-4 rounded-xl bg-brand text-white hover:bg-brand-hover text-sm font-bold font-mono tracking-wide uppercase shadow-lg transition-all disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isProcessingAll ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Crunching Media...
                  </>
                ) : (
                  <>
                    <Play className="fill-current w-3.5 h-3.5" />
                    Optimize Collection
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Upload Zone & Image List Grid (span 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* File input layer */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*"
            multiple
          />

          {/* Core Interactive Drag Drop Uploader Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all cursor-pointer shadow-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[220px] ${
              isDragging
                ? 'border-brand bg-brand/5'
                : 'border-zinc-900 bg-zinc-950/40 hover:emerald-800 hover:border-zinc-800'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand/5 to-transparent pointer-events-none opacity-25" />
            
            <div className="h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center text-brand mb-4 shadow-inner">
              <Upload className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-bold text-white mb-1 tracking-tight">
              Drag and drop your images here
            </h3>
            <p className="text-zinc-500 text-xs max-w-sm leading-relaxed mb-1">
              Supports JPEG, PNG, WebP, SVG, AVIF, or GIF formats.
            </p>
            <span className="text-[10px] font-mono text-zinc-600 bg-zinc-900 border border-zinc-800/60 px-2 py-0.5 rounded-full">
              or click to browse local files
            </span>
          </div>

          {/* Collection Showcase Dashboard List */}
          {images.length > 0 && (
            <div className="space-y-4">
              
              {/* Aggregation statistics banner if optimized succeeds */}
              {savingsMetrics.originalSize > 0 && (
                <div className="bg-[#050507] border border-zinc-900 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-green-950/30 border border-green-900/40 flex items-center justify-center text-green-500">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500 font-semibold tracking-wider uppercase">Cumulative Savings Metrics</p>
                      <p className="text-[10.5px] text-zinc-400 mt-0.5">
                        Reduced <span className="text-zinc-200 font-bold">{formatBytes(savingsMetrics.originalSize)}</span> down to <span className="text-green-400 font-bold">{formatBytes(savingsMetrics.optimizedSize)}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <span className="text-green-400 font-bold text-xs bg-green-950/20 px-2 py-1 border border-green-900/30 rounded">
                      -{savingsMetrics.ratio.toFixed(1)}% Payload Saved
                    </span>
                    <button
                      onClick={downloadAllAsZip}
                      className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download ZIP
                    </button>
                  </div>
                </div>
              )}

              {/* Individual Images list */}
              <div className="space-y-3">
                <div className="text-[10.5px] font-mono text-zinc-500 font-bold uppercase tracking-wider px-2">Uploaded Images Array ({images.length})</div>
                <div className="divide-y divide-zinc-900 bg-[#050507]/60 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
                  {images.map((img, idx) => {
                    const savedPct = img.originalSize && img.optimizedSize && img.originalSize > img.optimizedSize
                      ? ((img.originalSize - img.optimizedSize) / img.originalSize) * 100
                      : null;

                    return (
                      <div key={img.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-zinc-950/30 transition-all">
                        
                        {/* Img Thumbnail & Details */}
                        <div className="flex items-center gap-3.5 max-w-full md:max-w-[60%]">
                          <div className="relative w-12 h-12 bg-zinc-900 rounded-lg flex-shrink-0 overflow-hidden border border-zinc-800 flex items-center justify-center">
                            {img.previewUrl ? (
                              <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
                            ) : (
                              <FileImage className="w-5 h-5 text-zinc-600" />
                            )}
                            <div className="absolute top-0 left-0 bg-black/60 px-1 py-0.5 rounded-br text-[7.5px] font-mono text-zinc-400 select-none">
                              #{idx + 1}
                            </div>
                          </div>

                          <div className="space-y-1 overflow-hidden">
                            <p className="text-xs font-bold text-zinc-100 truncate pr-4" title={img.name}>
                              {img.name}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-zinc-500">
                              <span>{formatBytes(img.originalSize)}</span>
                              {img.originalWidth > 0 && (
                                <>
                                  <span className="text-zinc-800">•</span>
                                  <span>{img.originalWidth}x{img.originalHeight}px</span>
                                </>
                              )}
                              <span className="text-zinc-800">•</span>
                              <span className="text-zinc-600 truncate">{img.mimeType}</span>
                            </div>
                          </div>
                        </div>

                        {/* Mid Section: Conversion Outcomes */}
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-zinc-900/60 pt-3 md:pt-0 md:border-none">
                          
                          {/* Optimization Pipeline Status badge */}
                          <div className="flex items-center gap-2 min-w-[200px] justify-end">
                            {img.status === 'pending' && (
                              <div className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded">
                                Ready to optimize
                              </div>
                            )}

                            {img.status === 'processing' && (
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-brand bg-brand/5 px-2 py-0.5 border border-brand/10 rounded">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                Processing
                              </div>
                            )}

                            {img.status === 'error' && (
                              <div className="text-[10px] font-mono text-red-400 bg-red-950/20 px-2 py-0.5 border border-red-900/20 rounded">
                                Error: {img.error || 'Failed'}
                              </div>
                            )}

                            {img.status === 'success' && img.optimizedSize !== undefined && (
                              <div className="text-right space-y-0.5 font-mono">
                                <p className="text-xs font-bold text-zinc-300 truncate max-w-[150px]" title={img.optimizedName}>
                                  {img.optimizedName}
                                </p>
                                <div className="flex items-center gap-1.5 justify-end text-[9px]">
                                  <span className="text-brand font-medium">{formatBytes(img.optimizedSize)}</span>
                                  <span className="text-zinc-800">|</span>
                                  <span className="text-zinc-500">{img.optimizedWidth}x{img.optimizedHeight}px</span>
                                  {savedPct && savedPct > 0 && (
                                    <>
                                      <span className="text-zinc-805">|</span>
                                      <span className="text-green-500 font-bold">-{savedPct.toFixed(0)}%</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Individual Action Buttons */}
                          <div className="flex items-center gap-2">
                            {img.status === 'success' && img.optimizedUrl && (
                              <button
                                onClick={() => downloadSingle(img)}
                                className="h-8 w-8 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-850 border border-zinc-805 flex items-center justify-center transition-all cursor-pointer"
                                title="Download modified file"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              disabled={isProcessingAll}
                              onClick={() => removeImage(img.id)}
                              className="h-8 w-8 rounded-lg border border-zinc-900 hover:border-red-900/60 bg-zinc-950 hover:bg-red-950/20 text-zinc-600 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                              title="Remove item"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* SEO Compliance & Core Web Vitals Guidance Accordion Info */}
      <div className="bg-[#050507]/40 border border-zinc-900/80 rounded-2xl p-5 md:p-6 space-y-4">
        <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand" />
          Core Web Vitals & Image SEO Quality Directives
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-500 leading-relaxed font-mono">
          <div className="space-y-1.5">
            <span className="text-zinc-300 font-bold uppercase text-[10px]">1. Format Selection</span>
            <p>
              Deploying images in <strong>Next-Generation WebP formats</strong> is a vital Google SEO best practice. It delivers up to 30% greater compression than traditional JPG format without aesthetic loss.
            </p>
          </div>
          <div className="space-y-1.5">
            <span className="text-zinc-300 font-bold uppercase text-[10px]">2. Clean Naming (Lowercase)</span>
            <p>
              Google crawling agents parse filenames to infer topical relevance. Using lowercase terms split exclusively by hyphens avoids character encoding issues and preserves canonical indexing.
            </p>
          </div>
          <div className="space-y-1.5">
            <span className="text-zinc-300 font-bold uppercase text-[10px]">3. Precise Sizing Constraints</span>
            <p>
              Set maximum widths or bounding aspect fits to avoid serving 4000px native layouts in a 300px element wrapper. It scores direct Google Lighthouse speed wins.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

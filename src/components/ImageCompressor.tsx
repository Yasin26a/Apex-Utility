import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shrink,
  Upload,
  Download,
  Copy,
  Check,
  RefreshCw,
  FileImage,
  Sliders,
  Sparkles,
  CheckCircle,
  Lock,
  Unlock,
  Layers,
  Info,
  ArrowLeftRight,
  Eye,
  Trash2,
  Minimize2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { logToolUsage } from '../utils/toolAnalytics';

// Helper to format bytes cleanly
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface ImageState {
  file: File;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalUrl: string;
  originalMime: string;
}

export default function ImageCompressor() {
  const [image, setImage] = useState<ImageState | null>(null);
  
  // Compression control deck states
  const [quality, setQuality] = useState<number>(80); // 1 to 100
  const [targetFormat, setTargetFormat] = useState<string>('match-original'); // 'match-original', 'image/jpeg', 'image/png', 'image/webp'
  const [scaleFactor, setScaleFactor] = useState<number>(100); // 10% to 100%
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  
  // Real output results
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressedWidth, setCompressedWidth] = useState<number>(0);
  const [compressedHeight, setCompressedHeight] = useState<number>(0);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Visual GUI Toggles
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [compareMode, setCompareMode] = useState<'side-by-side' | 'split-slider'>('side-by-side');
  const [splitPosition, setSplitPosition] = useState<number>(50); // 0 to 100 for visual compare
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logToolUsage('image-compressor');
  }, []);

  // Cleanup blob URLs on unmount or file reset
  useEffect(() => {
    return () => {
      if (image?.originalUrl) {
        URL.revokeObjectURL(image.originalUrl);
      }
      if (compressedUrl) {
        URL.revokeObjectURL(compressedUrl);
      }
    };
  }, [image, compressedUrl]);

  // Read files and gather original visual metrics
  const processImageFile = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      setImage({
        file,
        name: file.name,
        originalSize: file.size,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        originalUrl: objectUrl,
        originalMime: file.type
      });

      // Default customized height / width state values to original sizes
      setCustomWidth(String(img.naturalWidth));
      setCustomHeight(String(img.naturalHeight));
      setScaleFactor(100);
    };

    img.onerror = () => {
      setErrorMessage('Failed to load the image into memory.');
    };

    img.src = objectUrl;
  };

  // Change of custom Width automatically maps Height when lock aspect ratio is activated
  const handleWidthChange = (valStr: string) => {
    setCustomWidth(valStr);
    const num = parseInt(valStr);
    if (isNaN(num) || !image) return;

    if (lockAspectRatio) {
      const ratio = image.originalHeight / image.originalWidth;
      setCustomHeight(String(Math.round(num * ratio)));
    }
    // Set scale slider to match percentage
    setScaleFactor(Math.round((num / image.originalWidth) * 100));
  };

  // Change of custom Height automatically maps Width when lock aspect ratio is activated
  const handleHeightChange = (valStr: string) => {
    setCustomHeight(valStr);
    const num = parseInt(valStr);
    if (isNaN(num) || !image) return;

    if (lockAspectRatio) {
      const ratio = image.originalWidth / image.originalHeight;
      setCustomWidth(String(Math.round(num * ratio)));
    }
    // Set scale slider to match percentage
    setScaleFactor(Math.round((num / image.originalHeight) * 100));
  };

  // Sizing adjust slider triggers updates to concrete pixel size parameters
  const handleScaleSliderChange = (percent: number) => {
    setScaleFactor(percent);
    if (!image) return;

    const w = Math.max(1, Math.round((image.originalWidth * percent) / 100));
    const h = Math.max(1, Math.round((image.originalHeight * percent) / 100));
    setCustomWidth(String(w));
    setCustomHeight(String(h));
  };

  // Primary rendering compressor execution block
  const runOfflineCompression = async () => {
    if (!image) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const startTime = performance.now();

    try {
      const img = new Image();
      img.src = image.originalUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const targetW = parseInt(customWidth) || image.originalWidth;
      const targetH = parseInt(customHeight) || image.originalHeight;

      canvas.width = targetW;
      canvas.height = targetH;

      if (!ctx) {
        throw new Error('Failed to acquire canvas 2D rendering buffer context.');
      }

      // Smooth canvas rendering overrides
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw original image into scaled dimension constraints
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Resolve format parameter
      const format = targetFormat === 'match-original' ? image.originalMime : targetFormat;
      const qualityPercentage = quality / 100;

      // Output blobs using compatible mime types
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setErrorMessage('Canvas compilation failure to create image stream block.');
            setIsProcessing(false);
            return;
          }

          if (compressedUrl) {
            URL.revokeObjectURL(compressedUrl);
          }

          setCompressedBlob(blob);
          setCompressedUrl(URL.createObjectURL(blob));
          setCompressedSize(blob.size);
          setCompressedWidth(targetW);
          setCompressedHeight(targetH);

          const endTime = performance.now();
          setProcessingTime(Math.round(endTime - startTime));
          setIsProcessing(false);
        },
        format,
        format === 'image/png' ? undefined : qualityPercentage
      );

    } catch (err: any) {
      setErrorMessage(err.message || 'Fatal background rendering error on canvas compilation.');
      setIsProcessing(false);
    }
  };

  // Automatically execute compression when compression presets change
  useEffect(() => {
    if (!image) return;
    const delayDebounceFn = setTimeout(() => {
      runOfflineCompression();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [image, quality, targetFormat, scaleFactor, customWidth, customHeight]);

  // Drag and drop event traps
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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  // Manual split slider interaction controls
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setSplitPosition(percent);
  };

  const handleSplitTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!splitContainerRef.current || e.touches.length === 0) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setSplitPosition(percent);
  };

  const handleDownload = () => {
    if (!compressedUrl || !image) return;
    const ext = targetFormat === 'match-original' 
      ? image.name.split('.').pop() 
      : targetFormat.split('/')[1];

    const link = document.createElement('a');
    link.href = compressedUrl;
    link.download = `optimized_${image.name.replace(/\.[^/.]+$/, "")}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearWorkspace = () => {
    setImage(null);
    setCompressedBlob(null);
    setCompressedUrl(null);
    setCompressedSize(0);
    setCompressedWidth(0);
    setCompressedHeight(0);
    setProcessingTime(0);
  };

  // Calculate stats
  const compressionRatio = useMemo(() => {
    if (!image || compressedSize === 0) return 0;
    const reduction = ((image.originalSize - compressedSize) / image.originalSize) * 100;
    return Math.max(0, parseFloat(reduction.toFixed(1)));
  }, [image, compressedSize]);

  return (
    <div id="image-compressor-studio" className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-brand-border/30">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shadow-lg shadow-emerald-500/5">
              <Shrink className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-emerald-400 tracking-widest block uppercase">Apex Optimizer Deck</span>
              <h1 className="text-3xl font-sans font-medium tracking-tight text-white mb-1">Image Compressor Studio</h1>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2 max-w-xl">
            Real-time client-side image optimization. Drop JPEG, PNG, or WebP files to resize, compress target formats, and observe comparative results instantly.
          </p>
        </div>

        {image && (
          <button
            onClick={clearWorkspace}
            className="px-4 py-2 text-xs font-mono border border-rose-500/20 text-rose-400 hover:bg-rose-500/5 rounded-xl transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Workspace
          </button>
        )}
      </div>

      {/* Main Drag-and-Drop Area when empty */}
      {!image && (
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border border-dashed rounded-2xl p-12 text-center transition duration-305 relative ${
            isDragging 
              ? 'border-emerald-500 bg-emerald-500/[0.04]' 
              : 'border-brand-border/30 bg-[#07080b]/50 hover:bg-[#07080b]/80'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none py-8">
            <div className="p-4 bg-brand-surface/80 border border-brand-border/20 rounded-full text-emerald-400 shadow-xl">
              <Upload className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-base text-gray-200">
                Drag and drop your image assets anywhere
              </p>
              <p className="text-xs text-gray-500">Supports JPEG, PNG, and WebP, safely computed directly in your browser.</p>
            </div>
            <button className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-black text-xs font-semibold rounded-xl tracking-wide transition shadow-lg shadow-emerald-500/10">
              Browse Local Files
            </button>
          </div>

          {/* Real hidden file input */}
          <label htmlFor="image-compressor-uploader" className="absolute inset-0 w-full h-full cursor-pointer opacity-0">
            <input 
              id="image-compressor-uploader"
              type="file" 
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Image Compressor Active Workspace */}
      {image && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Control settings parameters (Col span: 4) */}
          <div className="lg:col-span-4 bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-6 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-brand-border/20">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-mono text-gray-200 uppercase tracking-wider">Compression settings</h2>
            </div>

            {/* Target Output Format */}
            <div className="space-y-2">
              <label htmlFor="target-format-select" className="text-xs font-mono text-gray-400 block">Target File Format</label>
              <select
                id="target-format-select"
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                className="w-full bg-[#050608] border border-brand-border/40 hover:border-brand-border/80 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none transition"
              >
                <option value="match-original">Match Original ({image.originalMime.split('/')[1].toUpperCase()})</option>
                <option value="image/jpeg">Convert to JPEG</option>
                <option value="image/png">Convert to PNG (Lossless)</option>
                <option value="image/webp">Convert to WebP</option>
              </select>
            </div>

            {/* Quality Slider - hidden for lossless PNG unless using a lossy format */}
            {targetFormat !== 'image/png' && (targetFormat !== 'match-original' || image.originalMime !== 'image/png') && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <label htmlFor="compression-quality-slider" className="text-gray-400">Quality Factor</label>
                  <span className="text-emerald-400 font-semibold">{quality}%</span>
                </div>
                <input
                  id="compression-quality-slider"
                  type="range"
                  min="5"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#050608] rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[10px] font-mono text-gray-600">
                  <span>Max Compress</span>
                  <span>Balance</span>
                  <span>Best Visual</span>
                </div>
              </div>
            )}

            {/* Scale Options */}
            <div className="space-y-4 pt-3 border-t border-brand-border/15">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-gray-400">Dimensions Optimizer</span>
                {lockAspectRatio ? (
                  <button 
                    onClick={() => setLockAspectRatio(false)} 
                    className="p-1 hover:bg-brand-surface/80 rounded border border-emerald-500/20 text-emerald-400 transition"
                    title="Unlock Aspect Ratio"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setLockAspectRatio(true);
                      // Force update height based on current width immediately on re-lock
                      const num = parseInt(customWidth);
                      if (!isNaN(num)) {
                        const ratio = image.originalHeight / image.originalWidth;
                        setCustomHeight(String(Math.round(num * ratio)));
                      }
                    }} 
                    className="p-1 hover:bg-brand-surface/80 rounded border border-gray-600 text-gray-400 transition"
                    title="Lock Aspect Ratio"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Slider scale factor */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <label htmlFor="dimension-scale-slider" className="text-gray-500">Quick Scale Factor</label>
                  <span className="text-gray-300">{scaleFactor}%</span>
                </div>
                <input
                  id="dimension-scale-slider"
                  type="range"
                  min="10"
                  max="100"
                  value={scaleFactor}
                  onChange={(e) => handleScaleSliderChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#050608] rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              {/* Custom exact dimensions inputs */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label htmlFor="custom-width-input" className="font-mono text-gray-500 block">Width (px)</label>
                  <input
                    id="custom-width-input"
                    type="number"
                    value={customWidth}
                    max={image.originalWidth * 3}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    className="w-full bg-[#050608] border border-brand-border/40 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="custom-height-input" className="font-mono text-gray-500 block">Height (px)</label>
                  <input
                    id="custom-height-input"
                    type="number"
                    value={customHeight}
                    max={image.originalHeight * 3}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    className="w-full bg-[#050608] border border-brand-border/40 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>

            {/* Original specs descriptors summary */}
            <div className="pt-4 border-t border-brand-border/15 space-y-2 text-[11px] font-mono text-gray-500">
              <span className="text-gray-400 block font-semibold">Original Metadata</span>
              <div className="grid grid-cols-2 gap-y-1">
                <span>File Name:</span>
                <span className="text-gray-300 text-right truncate" title={image.name}>{image.name}</span>
                <span>File Format:</span>
                <span className="text-gray-300 text-right">{image.originalMime.split('/')[1].toUpperCase()}</span>
                <span>Dimensions:</span>
                <span className="text-gray-300 text-right">{image.originalWidth} × {image.originalHeight} px</span>
                <span>Original Size:</span>
                <span className="text-gray-300 text-right">{formatBytes(image.originalSize)}</span>
              </div>
            </div>

          </div>

          {/* Right panel: Side-by-side Interactive comparison screen (Col span: 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Real compressed metrics scorecard rows */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Size before */}
              <div className="bg-[#0b0c10]/40 border border-brand-border/25 rounded-xl p-3.5 flex flex-col justify-between shadow">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Before Size</span>
                <span className="text-lg font-sans text-gray-100 font-medium">{formatBytes(image.originalSize)}</span>
                <span className="text-[10px] font-mono text-gray-500 mt-1 block truncate">{image.originalWidth}×{image.originalHeight} px</span>
              </div>

              {/* Size after */}
              <div className="bg-[#0b0c10]/40 border border-brand-border/25 rounded-xl p-3.5 flex flex-col justify-between shadow">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">After Size</span>
                {isProcessing ? (
                  <span className="text-lg font-sans text-emerald-400/50 animate-pulse flex items-center gap-1">
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    optimizing...
                  </span>
                ) : (
                  <span className="text-lg font-sans text-emerald-400 font-semibold">
                    {compressedSize > 0 ? formatBytes(compressedSize) : 'Analyzing...'}
                  </span>
                )}
                <span className="text-[10px] font-mono text-gray-500 mt-1 block truncate">
                  {compressedWidth > 0 ? `${compressedWidth}×${compressedHeight} px` : '--'}
                </span>
              </div>

              {/* Total Saved badges */}
              <div className="bg-[#0b0c10]/40 border border-emerald-500/10 rounded-xl p-3.5 flex flex-col justify-between shadow">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Size reduction</span>
                <div className="flex items-baseline gap-1">
                  {isProcessing ? (
                    <span className="text-lg font-sans text-gray-400">--</span>
                  ) : compressionRatio > 0 ? (
                    <>
                      <span className="text-xl font-sans text-emerald-400 font-bold">-{compressionRatio}%</span>
                      <span className="text-[10px] font-mono text-emerald-500 font-semibold uppercase">saved</span>
                    </>
                  ) : (
                    <span className="text-xs font-mono text-yellow-500">Unchanged</span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-gray-500 mt-1 block">
                  Saved {compressedSize > 0 ? formatBytes(Math.max(0, image.originalSize - compressedSize)) : '--'}
                </span>
              </div>

              {/* Compression actions Download */}
              <div className="bg-[#0b0c10]/40 border border-brand-border/25 rounded-xl p-3.5 flex flex-col justify-between shadow">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Process time</span>
                <span className="text-xs font-mono text-zinc-400 block">{processingTime > 0 ? `${processingTime}ms` : 'Instantaneous'}</span>
                
                <button
                  onClick={handleDownload}
                  disabled={!compressedUrl || isProcessing}
                  className="w-full mt-2.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-450 text-black text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-40 shadow-md shadow-emerald-500/5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Optimized
                </button>
              </div>

            </div>

            {/* Interactive Compare Workspace screen wrapper */}
            <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-4 space-y-4 shadow-xl">
              
              {/* Tab toggles compare modes */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-brand-border/15">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-gray-400">Interactive Image comparator</span>
                </div>

                <div className="flex bg-[#050608] border border-brand-border/30 p-1 rounded-xl">
                  <button
                    onClick={() => setCompareMode('side-by-side')}
                    className={`px-3 py-1.5 text-[10px] font-mono rounded-lg transition-all ${
                      compareMode === 'side-by-side'
                        ? 'bg-[#1b2221] border border-emerald-500/25 text-emerald-300'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    onClick={() => setCompareMode('split-slider')}
                    className={`px-3 py-1.5 text-[10px] font-mono rounded-lg transition-all ${
                      compareMode === 'split-slider'
                        ? 'bg-[#1b2221] border border-emerald-500/25 text-emerald-300'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Split Splitter
                  </button>
                </div>
              </div>

              {/* Render Comparative Screens */}
              {compareMode === 'side-by-side' ? (
                
                /* Mode A: Side-by-Side screens comparative grids */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left Side: Original */}
                  <div className="space-y-1.5 relative group">
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/75 tracking-wider font-mono text-[9px] uppercase border border-brand-border/35 text-zinc-300 rounded-md shadow backdrop-blur-sm z-10">
                      Original
                    </span>
                    <div className="border border-brand-border/20 rounded-xl bg-[#090b0e] p-2 aspect-[4/3] flex items-center justify-center overflow-hidden relative">
                      <img
                        src={image.originalUrl}
                        alt="Original visual preview"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-500 px-1">
                      <span>Ref Dimensions: {image.originalWidth} × {image.originalHeight}</span>
                      <span>Weight: {formatBytes(image.originalSize)}</span>
                    </div>
                  </div>

                  {/* Right Side: Optimised */}
                  <div className="space-y-1.5 relative group">
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/75 tracking-wider font-mono text-[9px] uppercase border border-emerald-500/20 text-emerald-450 rounded-md shadow backdrop-blur-sm z-10">
                      Optimized
                    </span>
                    <div className="border border-brand-border/20 rounded-xl bg-[#090b0e] p-2 aspect-[4/3] flex items-center justify-center overflow-hidden relative">
                      {isProcessing ? (
                        <div className="flex flex-col items-center justify-center space-y-2 font-mono text-xs text-gray-500 text-center">
                          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                          <span>Generating compressed layers...</span>
                        </div>
                      ) : compressedUrl ? (
                        <img
                          src={compressedUrl}
                          alt="Optimized visual preview"
                          className="max-w-full max-h-full object-contain rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="font-mono text-xs text-brand-text-dim text-center">Awaiting processing configuration...</div>
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400 px-1">
                      <span className="text-zinc-500">Optimized Size: {compressedWidth} × {compressedHeight}</span>
                      <span className="text-emerald-400 font-semibold">{formatBytes(compressedSize)}</span>
                    </div>
                  </div>

                </div>
              ) : (

                /* Mode B: Visual Split slider compare screens overlay */
                <div className="space-y-2">
                  <div 
                    ref={splitContainerRef}
                    onMouseMove={handleSplitMouseMove}
                    onTouchMove={handleSplitTouchMove}
                    className="relative w-full aspect-[16/9] border border-brand-border/30 rounded-xl overflow-hidden bg-[#07080b] cursor-col-resize select-none"
                  >
                    {/* Background Original Image */}
                    <img
                      src={image.originalUrl}
                      alt="Original overlay canvas"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none p-4"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 font-mono text-[9px] uppercase border border-brand-border/30 text-white rounded pointer-events-none backdrop-blur-sm z-10">
                      Original
                    </div>

                    {/* Foreground Slider Container which clips the compressed image */}
                    {compressedUrl && (
                      <div 
                        className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
                        style={{ clipPath: `polygon(0 0, ${splitPosition}% 0, ${splitPosition}% 100%, 0 100%)` }}
                      >
                        <div className="absolute inset-0 bg-[#07080b] p-4">
                          <img
                            src={compressedUrl}
                            alt="Optimized overlay canvas"
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-500/80 font-mono text-[9px] uppercase border border-emerald-400 text-black font-semibold rounded backdrop-blur-sm z-10">
                          Optimized
                        </div>
                      </div>
                    )}

                    {/* Drag divider border indicator */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-emerald-400 pointer-events-none shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                      style={{ left: `${splitPosition}%` }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-400 text-black border-2 border-zinc-950 rounded-full flex items-center justify-center shadow-lg pointer-events-none">
                        <ArrowLeftRight className="w-3 h-3 text-black shrink-0" />
                      </div>
                    </div>

                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 px-1 pt-1">
                    <span>← Swipe mouse or touch across image overlays to analyze pixel compression</span>
                    <span>Slider placement: {Math.round(splitPosition)}%</span>
                  </div>
                </div>

              )}

            </div>

          </div>

        </div>
      )}

      {/* Guide Card Box Section */}
      <div className="bg-[#0b0c10]/40 border border-brand-border/20 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-mono text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
          <Info className="w-4 h-4 text-emerald-400" />
          Offline Security Pledge & Compression Mechanics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-400 leading-relaxed font-sans">
          <div className="space-y-1">
            <span className="font-semibold text-zinc-300 block">🔒 Local Processing</span>
            <p>Your media layers never leave this machine. All parsing, canvas scaling, and compression algorithms execute entirely in your web sandbox offline.</p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-zinc-300 block">🖼️ Intelligent Codecs</span>
            <p>Lossless formats (PNG) decrease byte sizes primarily through aspect-ratio downscaling, whereas lossy codecs (JPEG/WebP) utilize matrix quality quantizations.</p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-zinc-300 block">⚡ Accelerated Hardware</span>
            <p>Leverages native GPU-bound Canvas standard context wrappers to deliver instant operations, delivering parallelized exports inside low-spec browsers.</p>
          </div>
        </div>
      </div>

    </div>
  );
}

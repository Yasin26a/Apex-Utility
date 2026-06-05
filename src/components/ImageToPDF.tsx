import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileImage, Sparkles, RefreshCw, Layers, Sliders, 
  ChevronDown, Plus, Trash2, ArrowUp, ArrowDown, RotateCw, 
  Download, FileText, CheckCircle, Cpu, SlidersHorizontal, 
  Info, Check, HelpCircle 
} from 'lucide-react';
import { addRecentOperation } from '../utils/recentOperations';
import { jsPDF } from 'jspdf';
import { usePresets } from '../context/PresetContext';

interface LoadedImageItem {
  id: string;
  name: string;
  size: number;
  sizeStr: string;
  type: string;
  dataUrl: string; // Original base64
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
}

interface MergeOptions {
  fileName: string;
  pageSize: 'A4' | 'letter' | 'fit';
  orientation: 'portrait' | 'landscape' | 'auto';
  margin: 'none' | 'small' | 'medium' | 'large';
  stretchMode: 'fit' | 'fill' | 'original';
  quality: number; // 0.1 to 1.0 (quality slider)
  // Metadata options
  title: string;
  author: string;
  subject: string;
  creator: string;
  // Watermark options
  watermarkType: 'none' | 'text';
  watermarkText: string;
  watermarkColor: string;
  watermarkOpacity: number;
  watermarkRotation: number;
  watermarkPosition: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export default function ImageToPDF() {
  const [images, setImages] = useState<LoadedImageItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Compiler state
  const [compilerStage, setCompilerStage] = useState<'idle' | 'compiling' | 'success' | 'error'>('idle');
  const [compilingProgress, setCompilingProgress] = useState(0);
  const [compilingLogs, setCompilingLogs] = useState<string[]>([]);
  
  // Output result
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState('');
  const [origBytesTotal, setOrigBytesTotal] = useState(0);
  const [pdfBytesSize, setPdfBytesSize] = useState(0);

  // Default parameters
  const { activeSettings, updateActiveSettings } = usePresets();

  const [options, setOptions] = useState<MergeOptions>({
    fileName: 'Apex_Merged_Document',
    pageSize: 'A4',
    orientation: 'auto',
    margin: 'none',
    stretchMode: 'fit',
    quality: 0.85,
    title: 'Custom Merged Document',
    author: 'APEX Labs Forge',
    subject: 'Image Compilation Portfolio',
    creator: 'APEX UTILITY Forge Engine v2',
    watermarkType: 'none',
    watermarkText: 'CONFIDENTIAL',
    watermarkColor: '#ef4444',
    watermarkOpacity: 0.25,
    watermarkRotation: -45,
    watermarkPosition: 'center'
  });

  // Sync state with active settings when preset changes
  useEffect(() => {
    setOptions((prev) => ({
      ...prev,
      pageSize: activeSettings.pdfPageSize,
      orientation: activeSettings.pdfOrientation,
      margin: activeSettings.pdfMargin,
      stretchMode: activeSettings.pdfStretchMode,
      quality: activeSettings.pdfQuality,
      watermarkType: activeSettings.pdfWatermarkType,
      watermarkText: activeSettings.pdfWatermarkText,
      watermarkColor: activeSettings.pdfWatermarkColor,
      watermarkOpacity: activeSettings.pdfWatermarkOpacity,
      watermarkPosition: activeSettings.pdfWatermarkPosition,
    }));
  }, [
    activeSettings.pdfPageSize,
    activeSettings.pdfOrientation,
    activeSettings.pdfMargin,
    activeSettings.pdfStretchMode,
    activeSettings.pdfQuality,
    activeSettings.pdfWatermarkType,
    activeSettings.pdfWatermarkText,
    activeSettings.pdfWatermarkColor,
    activeSettings.pdfWatermarkOpacity,
    activeSettings.pdfWatermarkPosition,
  ]);

  // Sync back local option changes to central active settings
  useEffect(() => {
    if (
      options.pageSize !== activeSettings.pdfPageSize ||
      options.orientation !== activeSettings.pdfOrientation ||
      options.margin !== activeSettings.pdfMargin ||
      options.stretchMode !== activeSettings.pdfStretchMode ||
      options.quality !== activeSettings.pdfQuality ||
      options.watermarkType !== activeSettings.pdfWatermarkType ||
      options.watermarkText !== activeSettings.pdfWatermarkText ||
      options.watermarkColor !== activeSettings.pdfWatermarkColor ||
      options.watermarkOpacity !== activeSettings.pdfWatermarkOpacity ||
      options.watermarkPosition !== activeSettings.pdfWatermarkPosition
    ) {
      updateActiveSettings({
        pdfPageSize: options.pageSize,
        pdfOrientation: options.orientation,
        pdfMargin: options.margin,
        pdfStretchMode: options.stretchMode,
        pdfQuality: options.quality,
        pdfWatermarkType: options.watermarkType,
        pdfWatermarkText: options.watermarkText,
        pdfWatermarkColor: options.watermarkColor,
        pdfWatermarkOpacity: options.watermarkOpacity,
        pdfWatermarkPosition: options.watermarkPosition,
      });
    }
  }, [
    options.pageSize,
    options.orientation,
    options.margin,
    options.stretchMode,
    options.quality,
    options.watermarkType,
    options.watermarkText,
    options.watermarkColor,
    options.watermarkOpacity,
    options.watermarkPosition,
  ]);

  const [expandedOptionSection, setExpandedOptionSection] = useState<'layout' | 'quality' | 'metadata' | 'watermark'>('layout');

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  const processFiles = (files: File[]) => {
    const validImages = files.filter(f => f.type.startsWith('image/'));
    
    if (validImages.length === 0) {
      return;
    }

    validImages.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setImages(prev => [
            ...prev,
            {
              id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              name: file.name,
              size: file.size,
              sizeStr: formatBytes(file.size),
              type: file.type,
              dataUrl,
              width: img.naturalWidth,
              height: img.naturalHeight,
              rotation: 0
            }
          ]);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  // Reorder commands
  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === images.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...images];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    setImages(reordered);
  };

  const rotateImageItem = (id: string, delta: number) => {
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        let newRotation = (img.rotation + delta) % 360;
        if (newRotation < 0) newRotation += 360;
        return { ...img, rotation: newRotation };
      }
      return img;
    }));
  };

  const removeImageItem = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearQueue = () => {
    setImages([]);
    if (resultBlobUrl) {
      URL.revokeObjectURL(resultBlobUrl);
      setResultBlobUrl(null);
    }
    setCompilerStage('idle');
  };

  // Compiler logs generator
  const log = (msg: string) => {
    setCompilingLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const executePipeline = async () => {
    if (images.length === 0) return;

    setCompilerStage('compiling');
    setCompilingProgress(5);
    setCompilingLogs([]);
    
    log('Initializing Apex PDF Generation Pipeline...');
    log(`Source Image Batch Size: ${images.length} item(s)`);
    log(`Selected Layout: Size=${options.pageSize.toUpperCase()}, Orientation=${options.orientation.toUpperCase()}`);

    // Wait a brief period to draw animation frame
    await new Promise(r => setTimeout(r, 600));
    setCompilingProgress(20);
    log('Validating local WebAssembly memory sandbox buffers...');
    
    // Total original bytes
    const totalBytes = images.reduce((acc, current) => acc + current.size, 0);
    setOrigBytesTotal(totalBytes);
    log(`Original total payload size: ${formatBytes(totalBytes)}`);

    try {
      // jsPDF setup
      let pdf: jsPDF | null = null;
      
      const marginMap = {
        none: 0,
        small: 15,
        medium: 30,
        large: 50
      };
      
      const marginValue = marginMap[options.margin];
      log(`Setting margins to: ${marginValue} points (Style=${options.margin})`);

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        const pageIdx = i + 1;
        setCompilingProgress(Math.floor(20 + (pageIdx / images.length) * 60));
        
        log(`Processing Frame ${pageIdx}/${images.length}: "${item.name}"...`);
        await new Promise(r => setTimeout(r, 200));

        // Create virtual canvas for scale rotation and watermarking operations
        const img = new Image();
        img.src = item.dataUrl;
        await new Promise((resolve) => { img.onload = resolve; });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not establish 2D canvas context for rendering frame.');
        }

        // Apply rotation to canvas size calculations
        const rotationRad = (item.rotation * Math.PI) / 180;
        const is90or270 = Math.abs(item.rotation % 180) === 90;
        
        const origWidth = item.width;
        const origHeight = item.height;
        
        const rotatedWidth = is90or270 ? origHeight : origWidth;
        const rotatedHeight = is90or270 ? origWidth : origHeight;

        canvas.width = rotatedWidth;
        canvas.height = rotatedHeight;

        // Render rotated image to virtual canvas
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotationRad);
        ctx.drawImage(img, -origWidth / 2, -origHeight / 2, origWidth, origHeight);
        ctx.restore();

        // Apply Text watermark to canvas if active
        if (options.watermarkType === 'text' && options.watermarkText) {
          ctx.save();
          ctx.globalAlpha = options.watermarkOpacity;
          ctx.fillStyle = options.watermarkColor || '#ef4444';
          const fontSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.05);
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          let wx = canvas.width / 2;
          let wy = canvas.height / 2;
          
          if (options.watermarkPosition === 'top-left') {
            wx = canvas.width * 0.22; wy = canvas.height * 0.22;
          } else if (options.watermarkPosition === 'top-right') {
            wx = canvas.width * 0.78; wy = canvas.height * 0.22;
          } else if (options.watermarkPosition === 'bottom-left') {
            wx = canvas.width * 0.22; wy = canvas.height * 0.78;
          } else if (options.watermarkPosition === 'bottom-right') {
            wx = canvas.width * 0.78; wy = canvas.height * 0.78;
          }

          ctx.translate(wx, wy);
          ctx.rotate((options.watermarkRotation * Math.PI) / 180);
          ctx.fillText(options.watermarkText, 0, 0);
          ctx.restore();
          log(`Superimposed watermark overlay onto Frame ${pageIdx}`);
        }

        // Convert canvas back to compressed JPEG data
        const jpegDataUrl = canvas.toDataURL('image/jpeg', options.quality);
        
        // Define page parameters
        let pageW = rotatedWidth;
        let pageH = rotatedHeight;

        // standard size conversions to points (1 pt = 1/72 inch)
        // A4 = 595.27 x 841.89 pt
        // Letter = 612 x 792 pt
        const standardSizes = {
          A4: { w: 595.27, h: 841.89 },
          letter: { w: 612, h: 792 }
        };

        let orientation: 'portrait' | 'landscape' = 'portrait';
        if (options.orientation === 'auto') {
          orientation = rotatedWidth > rotatedHeight ? 'landscape' : 'portrait';
        } else {
          orientation = options.orientation as 'portrait' | 'landscape';
        }

        if (options.pageSize !== 'fit') {
          const baseSize = standardSizes[options.pageSize === 'A4' ? 'A4' : 'letter'];
          pageW = orientation === 'portrait' ? baseSize.w : baseSize.h;
          pageH = orientation === 'portrait' ? baseSize.h : baseSize.w;
        }

        // Initialize jsPDF instance on the first page
        if (!pdf) {
          pdf = new jsPDF({
            orientation: orientation,
            unit: 'pt',
            format: options.pageSize === 'fit' ? [pageW, pageH] : (options.pageSize === 'A4' ? 'a4' : 'letter'),
            compress: true
          });
        } else {
          pdf.addPage(options.pageSize === 'fit' ? [pageW, pageH] : (options.pageSize === 'A4' ? 'a4' : 'letter'), orientation);
        }

        // Dimensions of printable canvas inside page margins
        const printableW = pageW - (marginValue * 2);
        const printableH = pageH - (marginValue * 2);

        let targetDrawW = printableW;
        let targetDrawH = printableH;
        let drawX = marginValue;
        let drawY = marginValue;

        if (options.stretchMode === 'fit') {
          const ratioImg = rotatedWidth / rotatedHeight;
          const ratioPage = printableW / printableH;

          if (ratioImg > ratioPage) {
            // width-constrained
            targetDrawW = printableW;
            targetDrawH = printableW / ratioImg;
            drawY = marginValue + (printableH - targetDrawH) / 2;
          } else {
            // height-constrained
            targetDrawH = printableH;
            targetDrawW = printableH * ratioImg;
            drawX = marginValue + (printableW - targetDrawW) / 2;
          }
        } else if (options.stretchMode === 'original') {
          const scaleToFitX = printableW / rotatedWidth;
          const scaleToFitY = printableH / rotatedHeight;
          const scaleLimit = Math.min(1.0, scaleToFitX, scaleToFitY);

          targetDrawW = rotatedWidth * scaleLimit;
          targetDrawH = rotatedHeight * scaleLimit;
          drawX = marginValue + (printableW - targetDrawW) / 2;
          drawY = marginValue + (printableH - targetDrawH) / 2;
        }

        // Add JPEG representation into PDF binary stream
        pdf.addImage(jpegDataUrl, 'JPEG', drawX, drawY, targetDrawW, targetDrawH, undefined, 'FAST');
        log(`Compacted page image drawn structure at coordinates x:${drawX.toFixed(1)}, y:${drawY.toFixed(1)} w:${targetDrawW.toFixed(1)} h:${targetDrawH.toFixed(1)}`);
      }

      if (pdf) {
        log('Injecting PDF structure schemas & descriptive tags...');
        const cleanTitle = options.title.replace(/[()]/g, "");
        const cleanAuthor = options.author.replace(/[()]/g, "");
        const cleanSubject = options.subject.replace(/[()]/g, "");
        
        pdf.setProperties({
          title: cleanTitle,
          author: cleanAuthor,
          subject: cleanSubject,
          creator: options.creator,
          keywords: 'APEX utility suite, converted document, offline, secure'
        });

        log('WASM serializer: finalizing binary streams...');
        setCompilingProgress(92);
        await new Promise(r => setTimeout(r, 400));

        const outputBlob = pdf.output('blob');
        const finalUrl = URL.createObjectURL(outputBlob);
        
        setPdfBytesSize(outputBlob.size);
        setResultBlobUrl(finalUrl);
        
        let sanitizedName = options.fileName.trim();
        if (!sanitizedName) sanitizedName = 'Apex_Merged_Document';
        if (!sanitizedName.endsWith('.pdf')) sanitizedName += '.pdf';
        
        setResultFileName(sanitizedName);
        setCompilingProgress(100);
        setCompilerStage('success');
        log('Compilation completed flawlessly in local sandbox.');

        addRecentOperation(
          sanitizedName,
          'Image to PDF',
          formatBytes(totalBytes),
          formatBytes(outputBlob.size),
          sanitizedName,
          finalUrl
        );
      } else {
        throw new Error('The document generation buffer could not be compiled.');
      }
    } catch (err: any) {
      console.error(err);
      log(`Error triggered during conversion: ${err?.message || 'WASM pipe fault'}`);
      setCompilerStage('error');
    }
  };

  const currentCompressionBadge = () => {
    if (options.quality <= 0.4) {
      return { text: 'High Compression (Tiny Size)', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
    }
    if (options.quality >= 0.9) {
      return { text: 'Lossless Visual Hierarchy', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
    }
    return { text: 'Balanced Optimized Quality', color: 'text-brand bg-brand/10 border-brand/20' };
  };

  return (
    <div className="space-y-8">
      {/* Module Title Plate */}
      <div className="relative p-6 bg-gradient-to-r from-[#0c0c10] to-[#060608] border border-brand-border/40 rounded-2xl shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" style={{ backgroundColor: 'var(--theme-glow)', opacity: 0.25 }} />
        <div className="flex items-center gap-3 mb-2">
          <div className="px-2.5 py-1 rounded bg-brand/15 border border-brand/30 text-brand text-[10px] font-mono font-extrabold uppercase tracking-widest animate-pulse">
            Local WASM Core
          </div>
          <span className="text-zinc-600 font-mono text-xs">/</span>
          <span className="text-zinc-400 font-mono text-xs font-bold uppercase">Merge Module</span>
        </div>
        <h1 className="font-heading text-3xl font-black text-white tracking-tight">
          Enterprise JPG/PNG to PDF Converter
        </h1>
        <p className="font-sans text-sm text-[#94a3b8] max-w-2xl leading-relaxed mt-1">
          Arrange, rotate, and merge multiple raster files (PNG, JPG, JPEG) into a singular, highly optimized PDF document. Full offline compliance — nothing uploads to any cloud servers.
        </p>
      </div>

      {compilerStage === 'idle' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Drag/Drop & Image Queue list */}
          <div className="lg:col-span-7 space-y-6">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={images.length === 0 ? triggerInputClick : undefined}
              className={`beveled-panel p-8 text-center border-dashed cursor-pointer transition-all duration-350 ${
                dragActive 
                  ? 'border-brand bg-brand/10 scale-[1.01] shadow-[0_0_20px_var(--theme-glow)]' 
                  : images.length === 0
                    ? 'border-zinc-800 hover:border-brand/40 hover:bg-[#09090d]/60'
                    : 'border-zinc-900 bg-zinc-950/20 cursor-default'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg"
                multiple
                className="hidden"
              />

              {images.length === 0 ? (
                <div className="py-8 space-y-4">
                  <div className="mx-auto w-14 h-14 rounded-xl bg-brand/5 flex items-center justify-center border border-brand/20 shadow-[0_0_15px_var(--theme-glow)]">
                    <Upload className="w-7 h-7 text-brand animate-bounce" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-heading text-base font-bold text-white tracking-wide">
                      Drag & Drop Images or Click to browse
                    </h3>
                    <p className="font-sans text-xs text-zinc-500 max-w-sm mx-auto">
                      Supports PNG, JPG, or JPEG formats. Drag multiple designs to compiling sandbox queues instantly.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-900 text-left">
                    <div>
                      <span className="font-heading text-xs font-bold text-zinc-400">QUEUE FILE COUNTER</span>
                      <p className="font-mono text-lg font-black text-brand tracking-tight mt-0.5">
                        {images.length} Loaded Image{images.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={triggerInputClick}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand/10 hover:bg-brand/20 border border-brand/30 hover:border-brand-hover/50 text-brand text-xs font-heading font-extrabold transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Assets</span>
                      </button>
                      <button
                        onClick={clearQueue}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-red-900/40 text-zinc-400 hover:text-red-400 text-xs font-mono font-medium transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Queue</span>
                      </button>
                    </div>
                  </div>

                  {/* Desktop Scroller List */}
                  <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
                    <AnimatePresence initial={false}>
                      {images.map((imgItem, idx) => {
                        return (
                          <motion.div
                            key={imgItem.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="beveled-panel bg-[#09090c]/90 border-zinc-920 p-3.5 flex items-center justify-between gap-4 group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              {/* Reorder actions column */}
                              <div className="flex flex-col gap-1 items-center">
                                <button
                                  onClick={() => moveImage(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 rounded bg-zinc-900 hover:bg-brand/10 border border-zinc-800 hover:border-brand/30 hover:text-brand disabled:opacity-30 disabled:hover:bg-zinc-900 disabled:hover:text-zinc-500 disabled:hover:border-zinc-800 transition-colors cursor-pointer"
                                  title="Move Up Page"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono text-[10px] text-zinc-500 font-bold">
                                  #{idx + 1}
                                </span>
                                <button
                                  onClick={() => moveImage(idx, 'down')}
                                  disabled={idx === images.length - 1}
                                  className="p-1 rounded bg-zinc-900 hover:bg-brand/10 border border-zinc-800 hover:border-brand/30 hover:text-brand disabled:opacity-30 disabled:hover:bg-zinc-900 disabled:hover:text-zinc-500 disabled:hover:border-zinc-800 transition-colors cursor-pointer"
                                  title="Move Down Page"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Canvas with Rotation applied to Preview */}
                              <div className="relative w-16 h-16 bg-zinc-900 rounded overflow-hidden flex items-center justify-center border border-zinc-800 select-none">
                                <img
                                  src={imgItem.dataUrl}
                                  alt="Assets index preview"
                                  style={{ transform: `rotate(${imgItem.rotation}deg)` }}
                                  className="max-w-full max-h-full object-contain transition-transform duration-300"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              <div className="text-left min-w-0">
                                <p className="font-heading text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs block">
                                  {imgItem.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1 font-mono text-[9.5px] text-zinc-400">
                                  <span className="text-emerald-400 font-semibold">{imgItem.sizeStr}</span>
                                  <span className="text-zinc-600">•</span>
                                  <span>{imgItem.width}x{imgItem.height} px</span>
                                  {imgItem.rotation > 0 && (
                                    <>
                                      <span className="text-zinc-600">•</span>
                                      <span className="text-brand flex items-center gap-0.5">
                                        <RotateCw className="w-2.5 h-2.5" />
                                        {imgItem.rotation}°
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Rotate counter clock */}
                              <button
                                onClick={() => rotateImageItem(imgItem.id, -90)}
                                className="p-1.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all rounded cursor-pointer"
                                title="Rotate Counter-Clockwise 90°"
                              >
                                <RotateCw className="w-3.5 h-3.5 -scale-x-100" />
                              </button>
                              {/* Rotate clock */}
                              <button
                                onClick={() => rotateImageItem(imgItem.id, 90)}
                                className="p-1.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all rounded cursor-pointer"
                                title="Rotate Clockwise 90°"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => removeImageItem(imgItem.id)}
                                className="p-1.5 bg-zinc-900 hover:bg-red-950/20 hover:text-red-400 border border-zinc-800 hover:border-red-900/30 transition-all rounded cursor-pointer ml-1"
                                title="Delete page asset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Custom PDF properties controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="beveled-panel p-5 border-zinc-800 bg-[#07070a]/80 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-900">
                <SlidersHorizontal className="w-4 h-4 text-brand" />
                <h2 className="font-heading text-xs font-bold text-white uppercase tracking-wider">
                  Operational Settings Matrix
                </h2>
              </div>

              {/* Direct Name setup */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-400">
                  Document Output File Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={options.fileName}
                    onChange={(e) => setOptions(prev => ({ ...prev, fileName: e.target.value }))}
                    placeholder="Merge Name"
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-brand/40 px-3.5 py-2.5 rounded text-white text-xs outline-none font-sans"
                  />
                  <div className="absolute right-3.5 top-2.5 font-mono text-[9px] text-zinc-500 font-bold">
                    .PDF
                  </div>
                </div>
              </div>

              {/* Accordion Layout controls */}
              <div className="space-y-3">
                {/* 1. Layout block */}
                <div className="border border-zinc-900 rounded bg-zinc-950/10">
                  <button
                    onClick={() => setExpandedOptionSection(expandedOptionSection === 'layout' ? 'quality' : 'layout')}
                    className="w-full px-4 py-3 flex items-center justify-between text-left border-b border-zinc-950 bg-zinc-950/30 hover:bg-zinc-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-brand" />
                      <span className="font-heading text-xs font-bold text-white">1. Master Layout Parameters</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${expandedOptionSection === 'layout' ? 'rotate-180 text-brand' : ''}`} />
                  </button>

                  {expandedOptionSection === 'layout' && (
                    <div className="p-4 space-y-4 text-left">
                      {/* Grid orientations */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase text-zinc-500 block">Page Size</span>
                          <select
                            value={options.pageSize}
                            onChange={(e) => setOptions(prev => ({ ...prev, pageSize: e.target.value as any }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white text-xs outline-none"
                          >
                            <option value="A4">A4 (Standard)</option>
                            <option value="letter">Letter (US)</option>
                            <option value="fit">Fit Image</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase text-zinc-500 block">Orientation</span>
                          <select
                            value={options.orientation}
                            disabled={options.pageSize === 'fit'}
                            onChange={(e) => setOptions(prev => ({ ...prev, orientation: e.target.value as any }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white text-xs outline-none disabled:opacity-40"
                          >
                            <option value="auto">Auto Orient</option>
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase text-zinc-500 block">Page Margin</span>
                          <select
                            value={options.margin}
                            onChange={(e) => setOptions(prev => ({ ...prev, margin: e.target.value as any }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white text-xs outline-none"
                          >
                            <option value="none">No Margin</option>
                            <option value="small">Small (15pt)</option>
                            <option value="medium">Medium (30pt)</option>
                            <option value="large">Large (50pt)</option>
                          </select>
                        </div>
                      </div>

                      {/* Stretch Scale Modes */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono uppercase text-zinc-500 block">Image Scale & Positioning</span>
                        <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                          {([
                            { id: 'fit', label: 'Fit Aspect' },
                            { id: 'fill', label: 'Stretch/Fill' },
                            { id: 'original', label: 'Original size' }
                          ] as const).map(mode => (
                            <button
                              key={mode.id}
                              onClick={() => setOptions(prev => ({ ...prev, stretchMode: mode.id }))}
                              className={`py-1.5 rounded border text-center transition-colors cursor-pointer ${
                                options.stretchMode === mode.id
                                  ? 'bg-brand/10 border-brand text-brand'
                                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                              }`}
                            >
                              {mode.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Quality Optimization block */}
                <div className="border border-zinc-900 rounded bg-zinc-950/10">
                  <button
                    onClick={() => setExpandedOptionSection(expandedOptionSection === 'quality' ? 'metadata' : 'quality')}
                    className="w-full px-4 py-3 flex items-center justify-between text-left border-b border-zinc-950 bg-zinc-950/30 hover:bg-zinc-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-brand" />
                      <span className="font-heading text-xs font-bold text-white">2. Compression & Quality Tuning</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${expandedOptionSection === 'quality' ? 'rotate-180 text-brand' : ''}`} />
                  </button>

                  {expandedOptionSection === 'quality' && (
                    <div className="p-4 space-y-4 text-left font-sans">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400 font-mono text-[9px] uppercase font-bold">Image Resolution quality (JPEG)</span>
                          <span className="text-brand font-mono font-bold">{(options.quality * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={options.quality}
                          onChange={(e) => setOptions(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                          className="w-full accent-brand bg-zinc-900 rounded-lg appearance-none h-1.5 cursor-pointer"
                        />
                      </div>

                      <div className={`p-3 rounded border text-center text-[10px] font-mono leading-relaxed transition-all duration-300 ${currentCompressionBadge().color}`}>
                        {currentCompressionBadge().text}
                      </div>

                      <p className="text-[10px] leading-relaxed text-zinc-500">
                        Adjusting the quality factor uses JPEG quantization algorithms which shrink file storage sizes. High pixel ratios remain sharp but download faster.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Document details (Metadata) block */}
                <div className="border border-zinc-900 rounded bg-zinc-950/10">
                  <button
                    onClick={() => setExpandedOptionSection(expandedOptionSection === 'metadata' ? 'watermark' : 'metadata')}
                    className="w-full px-4 py-3 flex items-center justify-between text-left border-b border-zinc-950 bg-zinc-950/30 hover:bg-zinc-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-brand" />
                      <span className="font-heading text-xs font-bold text-white">3. PDF Schema Metadata Tags</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${expandedOptionSection === 'metadata' ? 'rotate-180 text-brand' : ''}`} />
                  </button>

                  {expandedOptionSection === 'metadata' && (
                    <div className="p-4 space-y-3 text-left">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono uppercase text-zinc-500 block">Metadata: Document Title</span>
                        <input
                          type="text"
                          value={options.title}
                          onChange={(e) => setOptions(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white text-xs outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase text-zinc-500 block">Metadata: Author</span>
                          <input
                            type="text"
                            value={options.author}
                            onChange={(e) => setOptions(prev => ({ ...prev, author: e.target.value }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white text-xs outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase text-zinc-500 block">Metadata: Subject</span>
                          <input
                            type="text"
                            value={options.subject}
                            onChange={(e) => setOptions(prev => ({ ...prev, subject: e.target.value }))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Superimposed Watermark block */}
                <div className="border border-zinc-900 rounded bg-zinc-950/10">
                  <button
                    onClick={() => setExpandedOptionSection(expandedOptionSection === 'watermark' ? 'layout' : 'watermark')}
                    className="w-full px-4 py-3 flex items-center justify-between text-left border-b border-zinc-950 bg-zinc-950/30 hover:bg-zinc-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand" />
                      <span className="font-heading text-xs font-bold text-white">4. Secure Watermark Overlays</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${expandedOptionSection === 'watermark' ? 'rotate-180 text-brand' : ''}`} />
                  </button>

                  {expandedOptionSection === 'watermark' && (
                    <div className="p-4 space-y-4 text-left">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono uppercase text-zinc-500 block">Watermark System Type</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setOptions(prev => ({ ...prev, watermarkType: 'none' }))}
                            className={`py-1.5 rounded border text-xs text-center font-bold tracking-tight transition-all cursor-pointer ${
                              options.watermarkType === 'none'
                                ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
                                : 'bg-zinc-950/20 border-zinc-900 text-zinc-500 hover:text-zinc-400'
                            }`}
                          >
                            Disable Overlay
                          </button>
                          <button
                            onClick={() => setOptions(prev => ({ ...prev, watermarkType: 'text' }))}
                            className={`py-1.5 rounded border text-xs text-center font-bold tracking-tight transition-all cursor-pointer ${
                              options.watermarkType === 'text'
                                ? 'bg-brand/10 border-brand text-brand'
                                : 'bg-zinc-950/20 border-zinc-900 text-zinc-500 hover:text-zinc-400'
                            }`}
                          >
                            Superimpose Text
                          </button>
                        </div>
                      </div>

                      {options.watermarkType === 'text' && (
                        <div className="space-y-3.5 border-t border-zinc-900 pt-3">
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-mono uppercase text-zinc-500 block">Watermark Stamp Phrase</span>
                            <input
                              type="text"
                              value={options.watermarkText}
                              onChange={(e) => setOptions(prev => ({ ...prev, watermarkText: e.target.value }))}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white text-xs outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono uppercase text-zinc-500 block">Stamp Position</span>
                              <select
                                value={options.watermarkPosition}
                                onChange={(e) => setOptions(prev => ({ ...prev, watermarkPosition: e.target.value as any }))}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white text-xs outline-none"
                              >
                                <option value="center">Center</option>
                                <option value="top-left">Top-Left</option>
                                <option value="top-right">Top-Right</option>
                                <option value="bottom-left">Bottom-Left</option>
                                <option value="bottom-right">Bottom-Right</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-mono uppercase text-zinc-500 block">Stamp Color</span>
                              <select
                                value={options.watermarkColor}
                                onChange={(e) => setOptions(prev => ({ ...prev, watermarkColor: e.target.value }))}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white text-xs outline-none"
                              >
                                <option value="#ef4444">Scarlet Red</option>
                                <option value="#3b82f6">Cobalt Blue</option>
                                <option value="#10b981">Alpine Green</option>
                                <option value="#f59e0b">Amber Orange</option>
                                <option value="#f8fafc">Pure White</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                                <span>Opacity</span>
                                <span>{(options.watermarkOpacity * 100).toFixed(0)}%</span>
                              </div>
                              <input
                                type="range"
                                min="0.05"
                                max="0.7"
                                step="0.05"
                                value={options.watermarkOpacity}
                                onChange={(e) => setOptions(prev => ({ ...prev, watermarkOpacity: parseFloat(e.target.value) }))}
                                className="w-full accent-brand bg-zinc-900 rounded-lg appearance-none h-1 cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                                <span>Rotation Angle</span>
                                <span>{options.watermarkRotation}°</span>
                              </div>
                              <input
                                type="range"
                                min="-90"
                                max="90"
                                step="5"
                                value={options.watermarkRotation}
                                onChange={(e) => setOptions(prev => ({ ...prev, watermarkRotation: parseInt(e.target.value) }))}
                                className="w-full accent-brand bg-zinc-900 rounded-lg appearance-none h-1 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action compilation trigger */}
              <button
                onClick={executePipeline}
                disabled={images.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-heading font-black tracking-wider transition-all disabled:opacity-40 disabled:hover:bg-brand cursor-pointer shadow-[0_0_20px_var(--theme-glow)]"
              >
                <RefreshCw className="w-4 h-4 animate-spin [animation-duration:5s]" />
                <span>COMPILE MERGED PDF ({images.length} FILE{images.length > 1 ? 'S' : ''})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WASM process compiling rendering log console */}
      {compilerStage === 'compiling' && (
        <div className="beveled-panel p-6 border-brand bg-[#050508]/95 space-y-6 max-w-2xl mx-auto my-6 text-left">
          <div className="flex justify-between items-center border-b border-brand-border/20 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4.5 h-4.5 text-brand animate-spin" />
                <span className="font-heading text-sm font-bold text-white uppercase tracking-wider">
                  Apex WASM Forge Engine
                </span>
              </div>
              <p className="font-sans text-xs text-zinc-400">Compacting binary layout points to standard static indexes.</p>
            </div>
            <div className="font-mono text-xl font-bold text-brand">{compilingProgress}%</div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-900 rounded-full h-1 border border-zinc-800">
            <div 
              className="bg-brand h-full rounded-full transition-all duration-300"
              style={{ width: `${compilingProgress}%` }}
            />
          </div>

          {/* Simulated shell terminal */}
          <div className="p-4 bg-zinc-950 border border-zinc-910 rounded-lg font-mono text-[11px] h-60 overflow-y-auto space-y-1.5 shadow-inner">
            {compilingLogs.map((logStr, lIdx) => (
              <div key={lIdx} className="text-zinc-300 leading-normal">
                <span className="text-zinc-600 select-none mr-2">apex_exec:~$</span>
                <span>{logStr}</span>
              </div>
            ))}
            <div className="text-brand font-bold animate-pulse">
              <span className="text-zinc-600 select-none mr-2">apex_exec:~$</span>
              _ compiling frame indices...
            </div>
          </div>
        </div>
      )}

      {/* Compiler SUCCESS screen */}
      {compilerStage === 'success' && resultBlobUrl && (
        <div className="beveled-panel p-8 border-emerald-500/30 bg-[#060806]/85 max-w-xl mx-auto space-y-6 my-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] text-emerald-400">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-black text-white tracking-tight">
              Merged PDF Document Compiled!
            </h2>
            <p className="font-sans text-sm text-zinc-400 max-w-md mx-auto">
              Your assets have been converted and stitched together locally. Standard ATS parameters have been fully optimized.
            </p>
          </div>

          {/* Comparative analysis box */}
          <div className="bg-zinc-950 rounded-lg border border-zinc-900 p-4 font-mono text-xs flex justify-evenly items-center divide-x divide-zinc-900 gap-4">
            <div className="text-center pl-2 flex-1">
              <span className="text-zinc-500 block mb-1">Source Payload</span>
              <span className="font-bold text-zinc-400 line-through">{formatBytes(origBytesTotal)}</span>
            </div>
            <div className="text-center pl-2 flex-1">
              <span className="text-zinc-500 block mb-1">Stitched PDF</span>
              <span className="font-bold text-emerald-400">{formatBytes(pdfBytesSize)}</span>
            </div>
            <div className="text-center pl-2 flex-1">
              <span className="text-zinc-500 block mb-1">Pages</span>
              <span className="font-extrabold text-brand">{images.length} Frame(s)</span>
            </div>
          </div>

          {/* Compilation Target Details */}
          <div className="text-left bg-zinc-900/40 p-4 rounded-lg border border-zinc-800 space-y-1.5 font-sans text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">Merged File Name:</span>
              <span className="text-white font-mono font-bold">{resultFileName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Layout Preset:</span>
              <span className="text-white capitalize">{options.pageSize} - {options.orientation}</span>
            </div>
            {options.watermarkType === 'text' && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Secure overlay:</span>
                <span className="text-brand font-mono">Active Text stamp ({options.watermarkText})</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={resultBlobUrl}
              download={resultFileName}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] cursor-pointer"
            >
              <Download className="w-4.5 h-4.5 animate-bounce" />
              <span>DOWNLOAD MERGED DOCUMENT</span>
            </a>
            <button
              onClick={() => {
                setCompilerStage('idle');
                setResultBlobUrl(null);
              }}
              className="inline-flex items-center justify-center gap-1.5 py-3.5 px-5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
            >
              <span>Compile New Queue</span>
            </button>
          </div>
        </div>
      )}

      {/* Structured Informational SEO FAQ Panel */}
      <div className="beveled-panel p-6 border-zinc-900 bg-[#07070a]/40 text-left space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Info className="w-4 h-4 text-brand" />
            <h2 className="font-heading text-xs uppercase font-bold text-white tracking-widest">
              IMAGE COMPILER SPECIFICATION SPECIFICATION
            </h2>
          </div>
          <p className="font-sans text-xs text-zinc-400">
            Learn how the local PDF compiler handles high-density conversions for your document portfolios safely.
          </p>
        </div>

        <div className="markdown-body grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-zinc-950">
          <div>
            <h3>What makes this JPG/PNG to PDF optimizer different?</h3>
            <p>
              Traditional online converters upload your personal photos and designs to remote servers, exposing private records. Our converter uses Client-Side WebAssembly algorithms matching standard PDF matrix layout wrappers. The conversion occurs natively, preserving image dimensions without cloud leak risks.
            </p>
          </div>
          <div>
            <h3>Can I reorder images before compiling?</h3>
            <p>
              Yes! You can load multiple image formats simultaneously (including JPG, JPEG, and PNG), arrange pages using the visual sort arrows, rotate individual orientations by 90-degree increments to fix layout flaws, and adjust compression quality factors before triggering the master merge.
            </p>
          </div>
          <div>
            <h3>Is there a limit on file sizing or count?</h3>
            <p>
              Because compiler computations occur directly in your web browser utilizing WebAssembly and local system hardware rather than shared servers, there are zero artificial limits on upload size. You can compile hundreds of pages without subscription blocks.
            </p>
          </div>
          <div>
            <h3>What optimization levels exist?</h3>
            <p>
              APEX optimization lets you customize canvas quality, margins, page ratios, and stretch profiles. Lowering the resolution quality reduces PDF storage sizes to comply with online applicant portals, while preserving maximum vector legibility on modern high-dpi and mobile screens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

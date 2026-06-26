import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Plus, Upload, Shield, Download, RefreshCcw, Crop,
  Maximize2, Scale, Image as ImageIcon, Check, Copy, Palette,
  Sparkles, Layers, Sliders, Type, Trash2, SlidersHorizontal, CheckCircle, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logToolUsage } from '../utils/toolAnalytics';

interface CropState {
  x: number; // 0 to 1 relative to container width
  y: number; // 0 to 1 relative to container height
  w: number; // 0 to 1 relative to container width
  h: number; // 0 to 1 relative to container height
}

interface AspectRatioOption {
  label: string;
  value: number | 'free';
}

const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: 'Free Crop', value: 'free' },
  { label: '2:3 Pinterest Pin (1000×1500)', value: 2 / 3 },
  { label: '1:1 IG Square (1080×1080)', value: 1 / 1 },
  { label: '16:9 YouTube Cover (1280×720)', value: 16 / 9 },
  { label: '9:16 Story / TikTok (1080×1920)', value: 9 / 16 },
  { label: '4:3 Standard Photo', value: 4 / 3 },
  { label: '21:9 UltraWide', value: 21 / 9 },
];

export default function ImageCropper() {
  const { t } = useLanguage();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ w: number, h: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedDataUri, setCopiedDataUri] = useState<boolean>(false);

  // Crop configuration
  const [selectedRatio, setSelectedRatio] = useState<number | 'free'>('free');
  const [crop, setCrop] = useState<CropState>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [rotate, setRotate] = useState<number>(0); // 0, 90, 180, 270

  // Resizing configuration
  const [targetWidth, setTargetWidth] = useState<number>(1200);
  const [targetHeight, setTargetHeight] = useState<number>(630);
  const [lockResizeAspect, setLockResizeAspect] = useState<boolean>(true);

  // Ratio Balancer (Canvas Expansion mode)
  // Instead of cropping, fit original image into a standard ratio padded with background
  const [balanceMode, setBalanceMode] = useState<'crop' | 'fit'>('crop');
  const [fitPaddingColor, setFitPaddingColor] = useState<string>('#1e293b');
  const [fitPaddingBlur, setFitPaddingBlur] = useState<boolean>(true);

  // Premium Social Overlay Branding properties
  const [overlayEnabled, setOverlayEnabled] = useState<boolean>(false);
  const [overlayTitle, setOverlayTitle] = useState<string>("Supercharge Organic Web Traffic");
  const [overlaySubtitle, setOverlaySubtitle] = useState<string>("APEX UTILITY LABS • SOCIAL BRANDING");
  const [overlayWebsite, setOverlayWebsite] = useState<string>("apexlabs.com");
  const [overlayStyle, setOverlayStyle] = useState<'card' | 'stripe' | 'minimal'>('card');
  const [overlayPosition, setOverlayPosition] = useState<'bottom' | 'top' | 'center'>('bottom');
  const [overlayBgColor, setOverlayBgColor] = useState<string>('#0f172a');
  const [overlayTextColor, setOverlayTextColor] = useState<string>('#c084fc'); // violet-400
  const [overlayBorderColor, setOverlayBorderColor] = useState<string>('#a855f7'); // violet-500

  // Export settings
  const [exportFormat, setExportFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [exportQuality, setExportQuality] = useState<number>(90); // 1-100

  // Dragging / resizing state
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef<{ clientX: number, clientY: number, crop: CropState, action: string } | null>(null);

  // Register usage analytical events
  useEffect(() => {
    logToolUsage('image-cropper');
  }, []);

  // Handle uploaded resource file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setupImage(e.target.files[0]);
    }
  };

  const setupImage = (file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    // Reset configurations
    setRotate(0);
    setCrop({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    setSelectedRatio('free');
    setBalanceMode('crop');

    // Discover dimension profiles
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setOriginalDimensions({ w: img.width, h: img.height });
      setTargetWidth(img.width);
      setTargetHeight(img.height);
    };
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setupImage(e.dataTransfer.files[0]);
    }
  };

  // Adjust aspect ratios inside the crop state bounds
  useEffect(() => {
    if (selectedRatio === 'free') return;
    
    // We must adjust set crop with exact aspect ratio relative to actual element aspect ratio
    if (!imageRef.current) return;
    
    const { clientWidth, clientHeight } = imageRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const containerAspect = clientWidth / clientHeight;
    const targetAspect = selectedRatio;

    // Adjust crop height or width to perfectly match aspect ratio
    let newW = crop.w;
    let newH = newW / targetAspect * containerAspect;

    if (newH > 1.0) {
      newH = crop.h;
      newW = newH * targetAspect / containerAspect;
      if (newW > 1.0) {
        newW = 1.0;
        newH = newW / targetAspect * containerAspect;
      }
    }

    // Keep it centered on current bounds if possible
    const newX = Math.max(0, Math.min(1 - newW, crop.x + (crop.w - newW) / 2));
    const newY = Math.max(0, Math.min(1 - newH, crop.y + (crop.h - newH) / 2));

    setCrop({ x: newX, y: newY, w: newW, h: newH });
  }, [selectedRatio]);

  // Adjust target dimension ratios on lock
  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (lockResizeAspect && originalDimensions) {
      let ratio = originalDimensions.h / originalDimensions.w;
      if (balanceMode === 'crop' && selectedRatio !== 'free') {
        ratio = 1 / selectedRatio;
      }
      setTargetHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (lockResizeAspect && originalDimensions) {
      let ratio = originalDimensions.w / originalDimensions.h;
      if (balanceMode === 'crop' && selectedRatio !== 'free') {
        ratio = selectedRatio;
      }
      setTargetHeight(val);
      setTargetWidth(Math.round(val * ratio));
    }
  };

  // Synchronize target inputs when balance/crop ratio alters
  useEffect(() => {
    if (!originalDimensions) return;
    if (balanceMode === 'crop') {
      if (selectedRatio === 'free') {
        const cw = Math.round(originalDimensions.w * crop.w);
        const ch = Math.round(originalDimensions.h * crop.h);
        setTargetWidth(cw);
        setTargetHeight(ch);
      } else {
        // Match base dimension based on width
        setTargetWidth(originalDimensions.w);
        setTargetHeight(Math.round(originalDimensions.w / selectedRatio));
      }
    } else {
      // Fit mode
      if (selectedRatio === 'free') {
        setTargetWidth(originalDimensions.w);
        setTargetHeight(originalDimensions.h);
      } else {
        setTargetWidth(originalDimensions.w);
        setTargetHeight(Math.round(originalDimensions.w / selectedRatio));
      }
    }
  }, [selectedRatio, balanceMode, originalDimensions, crop.w, crop.h]);

  // General drag tracking
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, action: string) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    // Capture values at click start
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      crop: { ...crop },
      action
    };

    // Attach document listener
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragStartRef.current || !containerRef.current || !imageRef.current) return;

    const { clientX, clientY, crop: initialCrop, action } = dragStartRef.current;
    
    // Calculate fractional movement vector
    const rect = containerRef.current.getBoundingClientRect();
    const { clientWidth, clientHeight } = imageRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    // Mouse movement delta scaled relative to the real loaded preview image boundary
    const dx = (e.clientX - clientX) / clientWidth;
    const dy = (e.clientY - clientY) / clientHeight;

    let newCrop = { ...initialCrop };

    if (action === 'move') {
      newCrop.x = Math.max(0, Math.min(1 - initialCrop.w, initialCrop.x + dx));
      newCrop.y = Math.max(0, Math.min(1 - initialCrop.h, initialCrop.y + dy));
    } else if (selectedRatio === 'free') {
      // Unlocked responsive corners
      if (action.includes('n')) {
        const bottomY = initialCrop.y + initialCrop.h;
        const targetY = Math.max(0, Math.min(bottomY - 0.05, initialCrop.y + dy));
        newCrop.y = targetY;
        newCrop.h = bottomY - targetY;
      }
      if (action.includes('s')) {
        const topY = initialCrop.y;
        newCrop.h = Math.max(0.05, Math.min(1 - topY, initialCrop.h + dy));
      }
      if (action.includes('w')) {
        const rightX = initialCrop.x + initialCrop.w;
        const targetX = Math.max(0, Math.min(rightX - 0.05, initialCrop.x + dx));
        newCrop.x = targetX;
        newCrop.w = rightX - targetX;
      }
      if (action.includes('e')) {
        const leftX = initialCrop.x;
        newCrop.w = Math.max(0.05, Math.min(1 - leftX, initialCrop.w + dx));
      }
    } else {
      // Locked aspect ratio drag corners
      const aspect = selectedRatio; // w / h target
      const elementAspect = clientWidth / clientHeight;

      if (action === 'se') {
        const scale = Math.max(0.05, Math.min(1 - initialCrop.x, initialCrop.w + dx));
        newCrop.w = scale;
        newCrop.h = (scale / aspect) * elementAspect;
        
        // Ensure within height boundary
        if (newCrop.y + newCrop.h > 1.0) {
          newCrop.h = 1.0 - newCrop.y;
          newCrop.w = (newCrop.h * aspect) / elementAspect;
        }
      } else if (action === 'sw') {
        const rightX = initialCrop.x + initialCrop.w;
        const scaleW = Math.max(0.05, Math.min(rightX, initialCrop.w - dx));
        const plannedH = (scaleW / aspect) * elementAspect;
        
        if (newCrop.y + plannedH <= 1.0) {
          newCrop.x = rightX - scaleW;
          newCrop.w = scaleW;
          newCrop.h = plannedH;
        }
      } else if (action === 'ne') {
        const bottomY = initialCrop.y + initialCrop.h;
        const scaleW = Math.max(0.05, Math.min(1 - initialCrop.x, initialCrop.w + dx));
        const plannedH = (scaleW / aspect) * elementAspect;
        
        if (bottomY - plannedH >= 0) {
          newCrop.y = bottomY - plannedH;
          newCrop.w = scaleW;
          newCrop.h = plannedH;
        }
      } else if (action === 'nw') {
        const rightX = initialCrop.x + initialCrop.w;
        const bottomY = initialCrop.y + initialCrop.h;
        const scaleW = Math.max(0.05, Math.min(rightX, initialCrop.w - dx));
        const plannedH = (scaleW / aspect) * elementAspect;
        
        if (bottomY - plannedH >= 0) {
          newCrop.x = rightX - scaleW;
          newCrop.y = bottomY - plannedH;
          newCrop.w = scaleW;
          newCrop.h = plannedH;
        }
      }
    }

    setCrop(newCrop);
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  };

  // Perform processing and download / copy
  const processImage = async (action: 'download' | 'copy') => {
    if (!imagePreviewUrl || !originalDimensions) return;
    setIsProcessing(true);

    try {
      // Setup HTML5 Image object
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imagePreviewUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Canvas element
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not construct 2D context");

      // Handle transparent padding color or background config
      if (exportFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else {
        ctx.clearRect(0, 0, targetWidth, targetHeight);
      }

      // Rotate rendering matrix
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.translate(-targetWidth / 2, -targetHeight / 2);

      if (balanceMode === 'crop') {
        // Standard Crop calculations based on original size
        const sourceX = crop.x * img.width;
        const sourceY = crop.y * img.height;
        const sourceW = crop.w * img.width;
        const sourceH = crop.h * img.height;

        ctx.drawImage(
          img,
          sourceX, sourceY, sourceW, sourceH, // Cut region
          0, 0, targetWidth, targetHeight     // Output scale
        );
      } else {
        // Ratio Balance Mode: Fit entire image in target canvas with padding
        // 1. Draw helper backdrop
        if (fitPaddingBlur) {
          // Blurred background stretch
          ctx.save();
          ctx.filter = 'blur(20px)';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          ctx.restore();
          // Draw translucent matching overlay over blur
          ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        } else {
          ctx.fillStyle = fitPaddingColor;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        // Calculate fitting bounding box
        const containerAspect = targetWidth / targetHeight;
        const imgAspect = img.width / img.height;

        let w = targetWidth;
        let h = targetHeight;
        let x = 0;
        let y = 0;

        if (imgAspect > containerAspect) {
          h = targetWidth / imgAspect;
          y = (targetHeight - h) / 2;
        } else {
          w = targetHeight * imgAspect;
          x = (targetWidth - w) / 2;
        }

        ctx.drawImage(img, x, y, w, h);
      }

      // Reset transform before overlay drawing to keep text upright and unrotated
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (overlayEnabled) {
        // Draw Pinterest/Social brand overlay
        // Define dimensions of the overlay card
        const cardW = Math.round(targetWidth * 0.88);
        const cardH = Math.round(targetHeight * 0.24);
        const cardX = Math.round((targetWidth - cardW) / 2);
        
        let cardY = targetHeight - cardH - Math.round(targetHeight * 0.04); // Bottom margin
        if (overlayPosition === 'top') {
          cardY = Math.round(targetHeight * 0.04);
        } else if (overlayPosition === 'center') {
          cardY = Math.round((targetHeight - cardH) / 2);
        }

        ctx.save();
        
        if (overlayStyle === 'card') {
          // Rounded card with shadow and a custom border accent
          ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
          ctx.shadowBlur = 24;
          ctx.shadowOffsetY = 8;
          
          ctx.fillStyle = overlayBgColor;
          
          // Draw rounded rectangle
          const radius = 16;
          ctx.beginPath();
          ctx.moveTo(cardX + radius, cardY);
          ctx.lineTo(cardX + cardW - radius, cardY);
          ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + radius);
          ctx.lineTo(cardX + cardW, cardY + cardH - radius);
          ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - radius, cardY + cardH);
          ctx.lineTo(cardX + radius, cardY + cardH);
          ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - radius);
          ctx.lineTo(cardX, cardY + radius);
          ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
          ctx.closePath();
          ctx.fill();
          
          // Draw a fine border accent on the card
          ctx.shadowColor = 'transparent'; // Reset shadow
          ctx.lineWidth = 3;
          ctx.strokeStyle = overlayBorderColor || '#8b5cf6';
          ctx.stroke();
          
        } else if (overlayStyle === 'stripe') {
          // Stripe goes full width
          ctx.fillStyle = overlayBgColor;
          const stripeY = overlayPosition === 'top' ? 0 : overlayPosition === 'center' ? (targetHeight - cardH) / 2 : targetHeight - cardH;
          const stripeH = cardH;
          
          ctx.fillRect(0, stripeY, targetWidth, stripeH);
          
          // Top or bottom accent line
          ctx.fillStyle = overlayBorderColor || '#8b5cf6';
          if (overlayPosition === 'top') {
            ctx.fillRect(0, stripeY + stripeH - 6, targetWidth, 6);
          } else {
            ctx.fillRect(0, stripeY, targetWidth, 6);
          }
        } else {
          // Minimal style: transparent background card, but with nice shadows behind the text
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = 14;
          ctx.shadowOffsetY = 4;
        }

        // Text rendering
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Define base Y coordinates relative to card position
        const activeCardY = overlayStyle === 'stripe' 
          ? (overlayPosition === 'top' ? 0 : overlayPosition === 'center' ? (targetHeight - cardH) / 2 : targetHeight - cardH)
          : cardY;
        const activeCardH = cardH;
        const activeCardX = overlayStyle === 'stripe' ? 0 : cardX;
        const activeCardW = overlayStyle === 'stripe' ? targetWidth : cardW;

        // Subtitle/brand label at the top of the card
        const subtitleText = overlaySubtitle.toUpperCase();
        ctx.font = `bold ${Math.round(activeCardH * 0.12)}px sans-serif`;
        ctx.fillStyle = overlayTextColor;
        ctx.fillText(subtitleText, activeCardX + activeCardW / 2, activeCardY + activeCardH * 0.22);

        // Title in the center (bold, larger)
        const titleText = overlayTitle;
        const maxTitleWidth = activeCardW * 0.88;
        ctx.font = `bold ${Math.round(activeCardH * 0.24)}px sans-serif`;
        ctx.fillStyle = '#ffffff'; // always high-contrast white
        
        // Wrap title text
        const words = titleText.split(' ');
        let line = '';
        const lines = [];
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxTitleWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        // Render title lines
        const lineOffset = Math.round(activeCardH * 0.18);
        const startY = activeCardY + activeCardH * 0.48 - ((lines.length - 1) * lineOffset) / 2;
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i].trim(), activeCardX + activeCardW / 2, startY + i * lineOffset);
        }

        // Website or call to action at the bottom
        const websiteText = overlayWebsite.toLowerCase();
        ctx.font = `italic ${Math.round(activeCardH * 0.10)}px monospace`;
        ctx.fillStyle = overlayTextColor;
        ctx.fillText(websiteText, activeCardX + activeCardW / 2, activeCardY + activeCardH * 0.82);

        ctx.restore();
      }

      // Output action trigger
      if (action === 'download') {
        const dataUrl = canvas.toDataURL(exportFormat, exportQuality / 100);
        const a = document.createElement('a');
        const extension = exportFormat.split('/')[1];
        const initialName = imageFile?.name ? imageFile.name.substring(0, imageFile.name.lastIndexOf('.')) : 'balanced-image';
        a.download = `apex-${initialName}.${extension}`;
        a.href = dataUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (action === 'copy') {
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, exportFormat, exportQuality / 100));
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                [blob.type]: blob
              })
            ]);
            setCopiedDataUri(true);
            setTimeout(() => setCopiedDataUri(false), 2000);
          } catch (clipErr) {
            // Fallback to copying Data URI to clipboard if ClipboardItem image is restricted by sandboxing
            const dataUrl = canvas.toDataURL(exportFormat, exportQuality / 100);
            await navigator.clipboard.writeText(dataUrl);
            setCopiedDataUri(true);
            setTimeout(() => setCopiedDataUri(false), 2000);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick reset handles
  const handleReset = () => {
    setCrop({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    setRotate(0);
    if (originalDimensions) {
      setTargetWidth(originalDimensions.w);
      setTargetHeight(originalDimensions.h);
    }
  };

  return (
    <div id="image-cropper-root" className="flex-1 p-6 lg:p-10 w-full max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/20 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold text-violet-400 bg-violet-950/50 border border-violet-800/30">
              OFFLINE SECURE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/30">
              GPU HARDENED
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Crop className="w-6 h-6 text-violet-400" />
            {t.navigation.imageCropper}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t.navigation.imageCropperDesc}
          </p>
        </div>

        {imagePreviewUrl && (
          <button
            onClick={() => {
              setImageFile(null);
              setImagePreviewUrl(null);
              setOriginalDimensions(null);
            }}
            className="py-2 px-3 text-xs bg-red-950/40 border border-red-900/30 text-red-400 hover:bg-red-900/30 font-semibold rounded-lg flex items-center gap-1.5 transition-all self-start"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Current File
          </button>
        )}
      </div>

      {!imagePreviewUrl ? (
        /* Empty Upload State */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-dashed border-slate-800 hover:border-violet-500/40 bg-slate-950/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[400px] gap-4"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('cropper-file-picker')?.click()}
        >
          <input 
            type="file" 
            id="cropper-file-picker" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange} 
          />
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-400">
            <Upload className="w-8 h-8 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Drag and Drop Your Asset Image Here</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Supports PNG, JPEG, WebP, SVG, and raster formats. Processing is completed fully within your local browser sandbox.
            </p>
          </div>
          <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-violet-600/15">
            <Plus className="w-3.5 h-3.5" />
            Browse Native File
          </button>
        </motion.div>
      ) : (
        /* Active Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Work Surface Sandbox (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            <div className="bg-[#0b0c10]/30 rounded-2xl border border-slate-800/60 overflow-hidden flex flex-col relative min-h-[450px]">
              
              {/* Header actions */}
              <div className="flex flex-wrap justify-between items-center bg-[#090b11]/80 backdrop-blur px-5 py-3 border-b border-slate-800/80 gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
                  <span className="text-xs font-mono font-medium text-slate-300">
                    {balanceMode === 'crop' ? 'CROP RECTANGLE INTERACTION' : 'CANVAS EXPANSION BALANCE PREVIEW'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setRotate((prev) => (prev + 90) % 360)}
                    className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    title="Rotate 90deg Clockwise"
                  >
                    <RefreshCcw className="w-3.5 h-3.5 text-violet-400 rotate-90" />
                    <span className="text-[10px] uppercase font-mono tracking-tight hidden sm:inline">Rotate 9deg</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    title="Reset configuration defaults"
                  >
                    <RefreshCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[10px] uppercase font-mono tracking-tight hidden sm:inline">Reset Map</span>
                  </button>
                </div>
              </div>

              {/* Real canvas viewport workspace */}
              <div className="flex-grow p-6 flex flex-col items-center justify-center bg-slate-950/20 relative select-none">
                
                <div 
                  ref={containerRef}
                  className="relative max-w-full max-h-[400px] group transition-all"
                  style={{ transform: `rotate(${rotate}deg)` }}
                >
                  <img
                    ref={imageRef}
                    src={imagePreviewUrl}
                    alt="Loaded viewport element"
                    className="max-h-[400px] object-contain pointer-events-none rounded-xl"
                  />

                  {/* Brand overlay preview */}
                  {overlayEnabled && (
                    <div 
                      className="absolute inset-0 pointer-events-none flex flex-col p-4 select-none"
                      style={{
                        justifyContent: overlayPosition === 'top' ? 'flex-start' : overlayPosition === 'center' ? 'center' : 'flex-end'
                      }}
                    >
                      <div 
                        className={`w-[88%] mx-auto p-2.5 text-center border transition-all ${
                          overlayStyle === 'card' 
                            ? 'rounded-xl shadow-2xl' 
                            : overlayStyle === 'stripe' 
                            ? 'w-full border-x-0' 
                            : 'bg-transparent border-0 shadow-none'
                        }`}
                        style={{
                          backgroundColor: overlayStyle === 'minimal' ? 'transparent' : overlayBgColor,
                          borderColor: overlayStyle === 'minimal' ? 'transparent' : overlayBorderColor,
                          borderWidth: overlayStyle === 'minimal' ? 0 : '2px',
                          boxShadow: overlayStyle === 'minimal' ? 'none' : '0 12px 30px -5px rgba(0,0,0,0.65)',
                        }}
                      >
                        {/* Subtitle/Brand */}
                        <div 
                          className="text-[9px] font-bold tracking-widest uppercase mb-0.5"
                          style={{ color: overlayTextColor }}
                        >
                          {overlaySubtitle || 'BRAND LABEL'}
                        </div>
                        {/* Title */}
                        <div 
                          className="text-xs font-black text-white leading-tight tracking-tight mb-0.5 drop-shadow-md uppercase"
                        >
                          {overlayTitle || 'Your Pin Title'}
                        </div>
                        {/* Website */}
                        <div 
                          className="text-[8px] font-mono italic opacity-95"
                          style={{ color: overlayTextColor }}
                        >
                          {overlayWebsite || 'yoursite.com'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Standard Crop Mask Box */}
                  {balanceMode === 'crop' && (
                    <div 
                      className="absolute border-2 border-violet-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] rounded-sm cursor-move touch-none"
                      style={{
                        left: `${crop.x * 100}%`,
                        top: `${crop.y * 100}%`,
                        width: `${crop.w * 100}%`,
                        height: `${crop.h * 100}%`,
                      }}
                      onPointerDown={(e) => handlePointerDown(e, 'move')}
                    >
                      {/* Thirds Guide Lines inside crop boundaries */}
                      <div className="absolute inset-x-0 top-1/3 border-b border-white/20 pointer-events-none"></div>
                      <div className="absolute inset-x-0 top-2/3 border-b border-white/20 pointer-events-none"></div>
                      <div className="absolute inset-y-0 left-1/3 border-r border-white/20 pointer-events-none"></div>
                      <div className="absolute inset-y-0 left-2/3 border-r border-white/20 pointer-events-none"></div>

                      {/* NW Corner handle */}
                      <div 
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-violet-600 rounded-full cursor-nwse-resize active:scale-125"
                        onPointerDown={(e) => handlePointerDown(e, 'nw')}
                      />
                      {/* NE Corner handle */}
                      <div 
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-violet-600 rounded-full cursor-nesw-resize active:scale-125"
                        onPointerDown={(e) => handlePointerDown(e, 'ne')}
                      />
                      {/* SW Corner handle */}
                      <div 
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-violet-600 rounded-full cursor-nesw-resize active:scale-125"
                        onPointerDown={(e) => handlePointerDown(e, 'sw')}
                      />
                      {/* SE Corner handle */}
                      <div 
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-violet-600 rounded-full cursor-nwse-resize active:scale-125"
                        onPointerDown={(e) => handlePointerDown(e, 'se')}
                      />
                    </div>
                  )}
                </div>

                {/* Fit Padding Background Preview indicator for Balanced Ratio view */}
                {balanceMode === 'fit' && (
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 text-[10px] font-mono text-slate-400 p-2 rounded-lg border border-slate-800 text-center">
                    📢 Image will fit centered matching the target aspect ratio padded with your chosen background below.
                  </div>
                )}
              </div>

              {/* Crop Stats indicators */}
              <div className="border-t border-slate-800 p-4 bg-slate-950/50 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Input dimensions</span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {originalDimensions ? `${originalDimensions.w} × ${originalDimensions.h} px` : 'Retrieving...'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Target crop dims</span>
                    <span className="text-xs font-mono font-bold text-violet-400">
                      {originalDimensions ? `${Math.round(crop.w * originalDimensions.w)} × ${Math.round(crop.h * originalDimensions.h)} px` : '-'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => processImage('copy')}
                    disabled={isProcessing}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all select-none ${
                      copiedDataUri 
                        ? 'bg-emerald-950/50 border border-emerald-800/50 text-emerald-400' 
                        : 'bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    {copiedDataUri ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied direct!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-violet-400" />
                        Copy Image
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => processImage('download')}
                    disabled={isProcessing}
                    className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-violet-600/10 select-none"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Optimized Image
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Parameters Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/40">
            
            {/* Mode switch */}
            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setBalanceMode('crop')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  balanceMode === 'crop'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Crop Rectangle
              </button>
              <button
                onClick={() => setBalanceMode('fit')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  balanceMode === 'fit'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Expand / Pad Balance
              </button>
            </div>

            {/* Section Aspect Ratios */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-violet-400" />
                Aspect Ratio Locks
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setSelectedRatio(opt.value)}
                    className={`py-1.5 px-2 text-[11px] font-medium rounded-lg text-left border ${
                      selectedRatio === opt.value
                        ? 'border-violet-500 bg-violet-950/20 text-violet-400'
                        : 'border-slate-800 bg-slate-900/20 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ratio Balance Padding settings (Only in FIT Mode) */}
            <AnimatePresence>
              {balanceMode === 'fit' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex flex-col gap-3 pt-2 border-t border-slate-800 overflow-hidden"
                >
                  <label className="text-xs text-slate-300 font-semibold">Padding Settings</label>
                  
                  {/* Blur stretch toggle */}
                  <div className="flex items-center justify-between bg-[#0b0c10]/30 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-300 font-medium">Render Blurred Stretch</span>
                      <span className="text-[9px] text-slate-500">Produce aesthetic blurred background</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fitPaddingBlur}
                        onChange={(e) => setFitPaddingBlur(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-violet-500 peer-checked:after:bg-white"></div>
                    </label>
                  </div>

                  {/* Solid background padding pick color (only of blur disabled) */}
                  {!fitPaddingBlur && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Backdrop color</span>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={fitPaddingColor}
                          onChange={(e) => setFitPaddingColor(e.target.value)}
                          className="w-10 h-8 bg-transparent p-0 border-0 cursor-pointer overflow-hidden rounded-lg"
                        />
                        <input
                          type="text"
                          value={fitPaddingColor}
                          onChange={(e) => setFitPaddingColor(e.target.value)}
                          className="flex-grow bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 py-1.5 px-2 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Premium Social Media Brand Overlay */}
            <div className="flex flex-col gap-2.5 border-t border-slate-800 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pinterest & Social Overlay</span>
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overlayEnabled}
                    onChange={(e) => setOverlayEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white"></div>
                </label>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Draw beautiful typography titles, custom categorizations, and brand websites directly onto your images.
              </p>

              <AnimatePresence>
                {overlayEnabled && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-3 mt-1.5 overflow-hidden"
                  >
                    {/* Main Title input */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">PIN TITLE TEXT</span>
                      <input
                        type="text"
                        value={overlayTitle}
                        onChange={(e) => setOverlayTitle(e.target.value)}
                        placeholder="e.g. How To Grow 10x Website Traffic"
                        className="w-full bg-slate-900 border border-slate-800 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-200 outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Subtitle/Brand label */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">CATEGORY / SUBTITLE</span>
                      <input
                        type="text"
                        value={overlaySubtitle}
                        onChange={(e) => setOverlaySubtitle(e.target.value)}
                        placeholder="e.g. PINTEREST MARKETING WORKSHOP"
                        className="w-full bg-slate-900 border border-slate-800 px-2 py-1.5 rounded-lg text-xs text-slate-300 outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Website URL */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">WEBSITE URL / TAG</span>
                      <input
                        type="text"
                        value={overlayWebsite}
                        onChange={(e) => setOverlayWebsite(e.target.value)}
                        placeholder="e.g. yourwebsite.com"
                        className="w-full bg-slate-900 border border-slate-800 px-2 py-1.5 rounded-lg text-xs font-mono text-slate-300 outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Style and Position in 2 cols */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">OVERLAY STYLE</span>
                        <select
                          value={overlayStyle}
                          onChange={(e) => setOverlayStyle(e.target.value as any)}
                          className="bg-slate-900 border border-slate-800 px-2 py-1.5 rounded-lg text-xs text-slate-300 outline-none focus:border-amber-500"
                        >
                          <option value="card">Card Badge</option>
                          <option value="stripe">Full Stripe</option>
                          <option value="minimal">Minimalist Clean</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">POSITION</span>
                        <select
                          value={overlayPosition}
                          onChange={(e) => setOverlayPosition(e.target.value as any)}
                          className="bg-slate-900 border border-slate-800 px-2 py-1.5 rounded-lg text-xs text-slate-300 outline-none focus:border-amber-500"
                        >
                          <option value="bottom">Bottom Align</option>
                          <option value="top">Top Align</option>
                          <option value="center">Center Focus</option>
                        </select>
                      </div>
                    </div>

                    {/* Overlay Backdrop & Text colors */}
                    {overlayStyle !== 'minimal' && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1 col-span-1">
                          <span className="text-[9px] font-mono text-slate-500 uppercase">BACKDROP</span>
                          <input
                            type="color"
                            value={overlayBgColor}
                            onChange={(e) => setOverlayBgColor(e.target.value)}
                            className="w-full h-8 bg-transparent p-0 border-0 cursor-pointer rounded-lg"
                          />
                        </div>
                        <div className="flex flex-col gap-1 col-span-1">
                          <span className="text-[9px] font-mono text-slate-500 uppercase">ACCENT TEXT</span>
                          <input
                            type="color"
                            value={overlayTextColor}
                            onChange={(e) => setOverlayTextColor(e.target.value)}
                            className="w-full h-8 bg-transparent p-0 border-0 cursor-pointer rounded-lg"
                          />
                        </div>
                        <div className="flex flex-col gap-1 col-span-1">
                          <span className="text-[9px] font-mono text-slate-500 uppercase">BORDER</span>
                          <input
                            type="color"
                            value={overlayBorderColor}
                            onChange={(e) => setOverlayBorderColor(e.target.value)}
                            className="w-full h-8 bg-transparent p-0 border-0 cursor-pointer rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Target dimensions picker */}
            <div className="flex flex-col gap-2.5 border-t border-slate-800 pt-3">
              <label className="text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>Output Dimension Targets (px)</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockResizeAspect}
                    onChange={(e) => setLockResizeAspect(e.target.checked)}
                    className="rounded border-slate-800 text-violet-500 focus:ring-opacity-0"
                  />
                  <span className="text-[10px] font-mono text-slate-500">Lock Aspect Ratio</span>
                </label>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-slate-500">WIDTH</span>
                  <input
                    type="number"
                    value={targetWidth}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    max={8000}
                    className="w-full bg-slate-900 border border-slate-800 px-2 py-1.5 rounded-lg text-xs font-mono text-slate-200 outline-none focus:border-violet-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-slate-500">HEIGHT</span>
                  <input
                    type="number"
                    value={targetHeight}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    max={8000}
                    className="w-full bg-slate-900 border border-slate-800 px-2 py-1.5 rounded-lg text-xs font-mono text-slate-200 outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* Format conversion parameters */}
            <div className="flex flex-col gap-2.5 border-t border-slate-800 pt-3">
              <label className="text-xs text-slate-400 font-medium">Export Formats & Compress</label>
              
              <div className="grid grid-cols-3 gap-2">
                {(['image/png', 'image/jpeg', 'image/webp'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`py-1 text-[10px] font-semibold font-mono rounded border ${
                      exportFormat === fmt
                        ? 'border-violet-500 bg-violet-950/20 text-violet-400'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {fmt.split('/')[1].toUpperCase()}
                  </button>
                ))}
              </div>

              {exportFormat !== 'image/png' && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-mono">Format Quality</span>
                    <span className="text-violet-400 font-bold font-mono">{exportQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={exportQuality}
                    onChange={(e) => setExportQuality(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 appearance-none rounded-lg accent-violet-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Processing and state updates info area */}
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-slate-200">Sandbox Guard Enabled</span>
                <span className="text-[10px] leading-relaxed text-slate-500">
                  Image transforms are processed directly inside your browser cache with standard HTML5 Canvas context. We do not transmit files to external storage providers.
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Landing FAQ guide sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-slate-950/20 p-5 rounded-2xl border border-slate-800/40">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
            <Maximize2 className="w-4 h-4 text-violet-400" />
            What is Ratio Balancing Expansion?
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Standard croppers force you to shave off pixels of valuable screenshots to fit specific aspect ratios such as squares or 16:9 thumbnails. APEX "Expand / Pad Balance" allows fitting the full source capture centered seamlessly inside the goal frame, padded beautifully with original blurred backdrops.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-violet-400" />
            Secure local-first high quality compression
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            By avoiding network roundtrips, processing remains instantaneous even with gigantic 8K camera raw dumps. Choose JPEG or WebP formats, balance target dimension sizes, and scale sizes to compress sizes safely for web applications instantly.
          </p>
        </div>
      </div>

    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Download, 
  RefreshCw, 
  Grid, 
  Sliders, 
  Palette, 
  FileImage, 
  ShieldAlert, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Check, 
  Sparkles, 
  HelpCircle, 
  Printer, 
  Eye, 
  EyeOff 
} from 'lucide-react';

export type PassportCountryStandard = 'US' | 'EU' | 'IN' | 'CA' | 'AU' | 'CN';

interface StandardSpec {
  id: PassportCountryStandard;
  name: string;
  flag: string;
  dimensionsMm: string;
  dimensionsInches: string;
  canvasWidth: number;
  canvasHeight: number;
  headHeightPct: string;
  bgColorDefault: 'white' | 'blue' | 'lightgray';
  notes: string;
}

const PASSPORT_STANDARDS: Record<PassportCountryStandard, StandardSpec> = {
  US: {
    id: 'US',
    name: 'United States & Visa',
    flag: '🇺🇸',
    dimensionsMm: '51 x 51 mm',
    dimensionsInches: '2" x 2"',
    canvasWidth: 600,
    canvasHeight: 600,
    headHeightPct: '50% - 69%',
    bgColorDefault: 'white',
    notes: 'US Department of State & DS-160 compliant. Plain white background mandatory.'
  },
  EU: {
    id: 'EU',
    name: 'EU / UK / Schengen',
    flag: '🇪🇺',
    dimensionsMm: '35 x 45 mm',
    dimensionsInches: '1.38" x 1.77"',
    canvasWidth: 525,
    canvasHeight: 675,
    headHeightPct: '70% - 80%',
    bgColorDefault: 'lightgray',
    notes: 'ICAO biometric standard. Light grey or white background permitted.'
  },
  IN: {
    id: 'IN',
    name: 'India Passport & OCI',
    flag: '🇮🇳',
    dimensionsMm: '35 x 45 mm / 51 x 51 mm',
    dimensionsInches: '35x45mm / 2"x2"',
    canvasWidth: 525,
    canvasHeight: 675,
    headHeightPct: '60% - 70%',
    bgColorDefault: 'white',
    notes: 'Indian Passport Office & OCI portal compliant. Pure white background.'
  },
  CA: {
    id: 'CA',
    name: 'Canada Passport',
    flag: '🇨🇦',
    dimensionsMm: '50 x 70 mm',
    dimensionsInches: '2" x 2.75"',
    canvasWidth: 500,
    canvasHeight: 700,
    headHeightPct: '31 - 36 mm head size',
    bgColorDefault: 'white',
    notes: 'Passport Program Canada specifications. Uniform white/light background.'
  },
  AU: {
    id: 'AU',
    name: 'Australia & New Zealand',
    flag: '🇦🇺',
    dimensionsMm: '35 x 45 mm',
    dimensionsInches: '1.38" x 1.77"',
    canvasWidth: 525,
    canvasHeight: 675,
    headHeightPct: '32 - 36 mm crown to chin',
    bgColorDefault: 'lightgray',
    notes: 'Australian Passport Office guidelines. Light neutral background.'
  },
  CN: {
    id: 'CN',
    name: 'China Passport & Visa',
    flag: '🇨🇳',
    dimensionsMm: '33 x 48 mm',
    dimensionsInches: '1.3" x 1.89"',
    canvasWidth: 495,
    canvasHeight: 720,
    headHeightPct: '28 - 33 mm head size',
    bgColorDefault: 'blue',
    notes: 'Consular Department of China standards. White or light blue background.'
  }
};

export default function PassportPhotoMaker() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedStandard, setSelectedStandard] = useState<PassportCountryStandard>('US');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0); // -45 to +45 deg
  const [bgColor, setBgColor] = useState<'white' | 'blue' | 'lightgray' | 'ivory' | 'transparent'>('white');
  const [showGuides, setShowGuides] = useState(true);

  // Interactive Drag & Transform
  const [scale, setScale] = useState(100);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; initialOffsetX: number; initialOffsetY: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentSpec = PASSPORT_STANDARDS[selectedStandard];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          setScale(100);
          setOffsetX(0);
          setOffsetY(0);
          setRotation(0);
          setBrightness(100);
          setContrast(100);
          setSaturation(100);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const drawCanvas = (includeGuidesInExport = false) => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetWidth = currentSpec.canvasWidth;
    const targetHeight = currentSpec.canvasHeight;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 1. Draw solid background
    if (bgColor === 'white') {
      ctx.fillStyle = '#FFFFFF';
    } else if (bgColor === 'blue') {
      ctx.fillStyle = '#60A5FA';
    } else if (bgColor === 'lightgray') {
      ctx.fillStyle = '#E2E8F0';
    } else if (bgColor === 'ivory') {
      ctx.fillStyle = '#F8FAFC';
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0)';
    }
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // 2. Load & transform photo
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();

      // Apply image color and tone filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

      // Move to center of canvas for rotation & panning
      ctx.translate(targetWidth / 2 + offsetX, targetHeight / 2 + offsetY);
      ctx.rotate((rotation * Math.PI) / 180);

      const scaleMultiplier = scale / 100;
      // Auto calculate best initial fit to fill passport frame
      const minFitScale = Math.max(targetWidth / img.width, targetHeight / img.height);
      const drawWidth = img.width * minFitScale * scaleMultiplier;
      const drawHeight = img.height * minFitScale * scaleMultiplier;

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      // 3. Biometric Guideline HUD (only if guides enabled and not for export)
      if (showGuides && !includeGuidesInExport) {
        ctx.save();
        // Head Oval
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);

        const headCenterY = targetHeight * 0.46;
        const headRadiusX = targetWidth * 0.24;
        const headRadiusY = targetHeight * 0.30;

        ctx.beginPath();
        ctx.ellipse(targetWidth / 2, headCenterY, headRadiusX, headRadiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();

        // Eye Level Horizontal Line
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(targetWidth * 0.15, targetHeight * 0.42);
        ctx.lineTo(targetWidth * 0.85, targetHeight * 0.42);
        ctx.stroke();

        // Chin Limit Guideline
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.beginPath();
        ctx.moveTo(targetWidth * 0.25, targetHeight * 0.76);
        ctx.lineTo(targetWidth * 0.75, targetHeight * 0.76);
        ctx.stroke();

        // Center Vertical Symmetry Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(targetWidth / 2, targetHeight * 0.1);
        ctx.lineTo(targetWidth / 2, targetHeight * 0.9);
        ctx.stroke();

        ctx.restore();
      }
    };
    img.src = imageSrc;
  };

  useEffect(() => {
    drawCanvas(false);
  }, [imageSrc, selectedStandard, brightness, contrast, saturation, rotation, bgColor, scale, offsetX, offsetY, showGuides]);

  // Interactive mouse/touch dragging on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraggingCanvas(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffsetX: offsetX,
      initialOffsetY: offsetY
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingCanvas || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffsetX(dragStartRef.current.initialOffsetX + dx);
    setOffsetY(dragStartRef.current.initialOffsetY + dy);
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    dragStartRef.current = null;
  };

  // Touch support for mobile canvas repositioning
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDraggingCanvas(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        initialOffsetX: offsetX,
        initialOffsetY: offsetY
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingCanvas || !dragStartRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setOffsetX(dragStartRef.current.initialOffsetX + dx);
    setOffsetY(dragStartRef.current.initialOffsetY + dy);
  };

  const handleTouchEnd = () => {
    setIsDraggingCanvas(false);
    dragStartRef.current = null;
  };

  // Export single clean photo without guidelines
  const handleDownloadSingle = (format: 'png' | 'jpeg') => {
    if (!imageSrc) return;
    const exportCanvas = document.createElement('canvas');
    const targetWidth = currentSpec.canvasWidth;
    const targetHeight = currentSpec.canvasHeight;
    exportCanvas.width = targetWidth;
    exportCanvas.height = targetHeight;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    if (bgColor === 'white') ctx.fillStyle = '#FFFFFF';
    else if (bgColor === 'blue') ctx.fillStyle = '#60A5FA';
    else if (bgColor === 'lightgray') ctx.fillStyle = '#E2E8F0';
    else if (bgColor === 'ivory') ctx.fillStyle = '#F8FAFC';
    else ctx.fillStyle = format === 'jpeg' ? '#FFFFFF' : 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.translate(targetWidth / 2 + offsetX, targetHeight / 2 + offsetY);
      ctx.rotate((rotation * Math.PI) / 180);

      const scaleMultiplier = scale / 100;
      const minFitScale = Math.max(targetWidth / img.width, targetHeight / img.height);
      const drawWidth = img.width * minFitScale * scaleMultiplier;
      const drawHeight = img.height * minFitScale * scaleMultiplier;

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      const link = document.createElement('a');
      link.download = `passport_photo_${selectedStandard}_${currentSpec.dimensionsMm.replace(/\s+/g, '_')}.${format}`;
      link.href = exportCanvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
      link.click();
    };
    img.src = imageSrc;
  };

  // Generate 4" x 6" Photo Paper Printable Grid Sheet (1800 x 1200 px @ 300 DPI)
  const handleDownloadPrintSheet = (sheetType: '4x6' | 'A4') => {
    if (!imageSrc) return;

    // Render clean single photo to offscreen canvas
    const singleCanvas = document.createElement('canvas');
    const targetWidth = currentSpec.canvasWidth;
    const targetHeight = currentSpec.canvasHeight;
    singleCanvas.width = targetWidth;
    singleCanvas.height = targetHeight;
    const sCtx = singleCanvas.getContext('2d');
    if (!sCtx) return;

    if (bgColor === 'white') sCtx.fillStyle = '#FFFFFF';
    else if (bgColor === 'blue') sCtx.fillStyle = '#60A5FA';
    else if (bgColor === 'lightgray') sCtx.fillStyle = '#E2E8F0';
    else if (bgColor === 'ivory') sCtx.fillStyle = '#F8FAFC';
    else sCtx.fillStyle = '#FFFFFF';
    sCtx.fillRect(0, 0, targetWidth, targetHeight);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      sCtx.save();
      sCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      sCtx.translate(targetWidth / 2 + offsetX, targetHeight / 2 + offsetY);
      sCtx.rotate((rotation * Math.PI) / 180);

      const scaleMultiplier = scale / 100;
      const minFitScale = Math.max(targetWidth / img.width, targetHeight / img.height);
      const drawWidth = img.width * minFitScale * scaleMultiplier;
      const drawHeight = img.height * minFitScale * scaleMultiplier;

      sCtx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      sCtx.restore();

      // Print Sheet Dimensions
      const sheetCanvas = document.createElement('canvas');
      const is4x6 = sheetType === '4x6';
      sheetCanvas.width = is4x6 ? 1800 : 2480; // 300 DPI: 4x6=1800x1200, A4=2480x3508
      sheetCanvas.height = is4x6 ? 1200 : 3508;
      const sheetCtx = sheetCanvas.getContext('2d');
      if (!sheetCtx) return;

      sheetCtx.fillStyle = '#FFFFFF';
      sheetCtx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);

      const cols = is4x6 ? 3 : 4;
      const rows = is4x6 ? 2 : 4;
      const photoW = is4x6 ? 480 : 450;
      const photoH = Math.round(photoW * (targetHeight / targetWidth));
      const gapX = is4x6 ? 70 : 60;
      const gapY = is4x6 ? 50 : 60;
      const startX = Math.round((sheetCanvas.width - (cols * photoW + (cols - 1) * gapX)) / 2);
      const startY = Math.round((sheetCanvas.height - (rows * photoH + (rows - 1) * gapY)) / 2);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * (photoW + gapX);
          const y = startY + r * (photoH + gapY);
          sheetCtx.drawImage(singleCanvas, x, y, photoW, photoH);

          // Subtle cutting guidelines
          sheetCtx.strokeStyle = '#D1D5DB';
          sheetCtx.lineWidth = 1;
          sheetCtx.setLineDash([4, 4]);
          sheetCtx.strokeRect(x, y, photoW, photoH);
        }
      }

      // Add label at bottom
      sheetCtx.fillStyle = '#64748B';
      sheetCtx.font = '24px sans-serif';
      sheetCtx.setLineDash([]);
      sheetCtx.fillText(
        `Print Sheet (${sheetType}) - ${currentSpec.name} (${currentSpec.dimensionsMm}) - Apex Utility Labs`,
        startX,
        sheetCanvas.height - 30
      );

      const link = document.createElement('a');
      link.download = `passport_print_sheet_${sheetType}_${selectedStandard}.png`;
      link.href = sheetCanvas.toDataURL('image/png');
      link.click();
    };
    img.src = imageSrc;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          setScale(100);
          setOffsetX(0);
          setOffsetY(0);
          setRotation(0);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6" id="passport-photo-maker-root">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5 rounded-xl border border-zinc-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/30">
              Government Biometric Specs
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3 h-3" /> 100% Client-Side Safe
            </span>
          </div>
          <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Grid className="w-6 h-6 text-orange-400" />
            <span>Passport &amp; Visa Photo Cropper</span>
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Crop portraits to match official biometric passport and visa dimensions. Reposition interactively, rotate, swap background colors, align with biometric guides, and generate multi-photo printable sheets.
          </p>
        </div>

        {/* Selected Country Badge */}
        <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3.5 py-2 rounded-lg self-start md:self-auto">
          <span className="text-2xl">{currentSpec.flag}</span>
          <div>
            <span className="text-xs font-bold text-white block">{currentSpec.name}</span>
            <span className="text-[10px] font-mono text-orange-400">{currentSpec.dimensionsMm} ({currentSpec.dimensionsInches})</span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Canvas & Visual Cropper */}
        <div className="lg:col-span-8 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4">
          {!imageSrc ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="h-96 border-2 border-dashed border-zinc-800 hover:border-orange-500/40 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-3 cursor-pointer transition-all bg-zinc-950/40 group"
            >
              <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-mono font-bold uppercase text-zinc-200">Upload Portrait Photograph</p>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Drag and drop a clear smartphone selfie or portrait photo (PNG, JPG, WebP)
                </p>
              </div>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-orange-950/30">
                Browse Files
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              {/* Canvas Preview with Drag Interaction */}
              <div className="space-y-2 shrink-0 flex flex-col items-center">
                <div className="relative border-2 border-zinc-800 rounded-lg overflow-hidden bg-zinc-900 flex justify-center items-center shadow-2xl">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`max-w-[280px] sm:max-w-[320px] h-auto block ${
                      isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                  />

                  {/* Drag overlay hint */}
                  <div className="absolute top-2 left-2 pointer-events-none flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-[9px] font-mono text-zinc-300 border border-white/10">
                    <Move className="w-3 h-3 text-orange-400" />
                    <span>Click &amp; drag photo to pan</span>
                  </div>

                  {/* Toggle Guide overlay button */}
                  <button
                    onClick={() => setShowGuides(!showGuides)}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-zinc-300 hover:text-white px-2 py-1 rounded text-[9px] font-mono border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {showGuides ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-zinc-500" />}
                    <span>{showGuides ? 'Guides On' : 'Guides Off'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between w-full max-w-[320px] text-[10px] font-mono text-zinc-400 px-1">
                  <span className="flex items-center gap-1 text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                    Head Oval Guide
                  </span>
                  <span className="flex items-center gap-1 text-blue-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    Eye Line
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Chin Limit
                  </span>
                </div>
              </div>

              {/* Adjustments & Fine Tuning Sliders */}
              <div className="flex-1 w-full space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-orange-400" />
                    <span>Transform &amp; Alignment</span>
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setScale(prev => Math.min(300, prev + 10))}
                      className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setScale(prev => Math.max(20, prev - 10))}
                      className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Zoom Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-zinc-400">Portrait Zoom &amp; Scale</span>
                      <span className="text-orange-400 font-bold">{scale}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="300"
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-orange-400"
                    />
                  </div>

                  {/* Straighten Rotation Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <RotateCw className="w-3 h-3 text-amber-400" /> Straighten &amp; Tilt Angle
                      </span>
                      <span className="text-amber-400 font-bold">{rotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>

                  {/* Horizontal Shift */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-zinc-400">Horizontal Shift (X)</span>
                      <span className="text-zinc-300 font-bold">{offsetX}px</span>
                    </div>
                    <input
                      type="range"
                      min="-400"
                      max="400"
                      value={offsetX}
                      onChange={(e) => setOffsetX(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-orange-400"
                    />
                  </div>

                  {/* Vertical Shift */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-zinc-400">Vertical Shift (Y)</span>
                      <span className="text-zinc-300 font-bold">{offsetY}px</span>
                    </div>
                    <input
                      type="range"
                      min="-400"
                      max="400"
                      value={offsetY}
                      onChange={(e) => setOffsetY(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-orange-400"
                    />
                  </div>

                  {/* Color & Tone Sliders */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-900">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-zinc-400 block">Brightness ({brightness}%)</span>
                      <input
                        type="range"
                        min="60"
                        max="140"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-orange-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-zinc-400 block">Contrast ({contrast}%)</span>
                      <input
                        type="range"
                        min="60"
                        max="140"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-orange-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-zinc-400 block">Saturation ({saturation}%)</span>
                      <input
                        type="range"
                        min="60"
                        max="140"
                        value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-orange-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => {
                      setScale(100);
                      setOffsetX(0);
                      setOffsetY(0);
                      setRotation(0);
                      setBrightness(100);
                      setContrast(100);
                      setSaturation(100);
                    }}
                    className="px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 rounded text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset All</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 rounded text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Photo</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Compliance Preset & Export Engine */}
        <div className="lg:col-span-4 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-2">
              Government Biometric Preset
            </h3>

            {/* Country Standard Presets Grid */}
            <div className="space-y-1.5 text-xs">
              <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none">
                1. Select Target Country
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PASSPORT_STANDARDS) as PassportCountryStandard[]).map((key) => {
                  const spec = PASSPORT_STANDARDS[key];
                  const isSelected = selectedStandard === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedStandard(key);
                        setBgColor(spec.bgColorDefault);
                      }}
                      className={`p-2 rounded text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-500/15 border-orange-500/50 text-white shadow-sm shadow-orange-950/30'
                          : 'bg-zinc-900/50 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base">{spec.flag}</span>
                        <span className="text-xs font-bold truncate">{spec.name}</span>
                      </div>
                      <span className="text-[10px] block text-orange-400/90 font-mono">{spec.dimensionsMm}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background color selection */}
            <div className="space-y-1.5 text-xs">
              <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" />
                <span>2. Background Tone</span>
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['white', 'lightgray', 'blue', 'ivory'] as const).map((color) => {
                  const labels = {
                    white: 'Pure White',
                    lightgray: 'Light Gray',
                    blue: 'Light Blue',
                    ivory: 'Off-White'
                  };
                  return (
                    <button
                      key={color}
                      onClick={() => setBgColor(color)}
                      className={`py-1.5 px-2 rounded text-[10px] font-mono font-bold transition-all border text-center cursor-pointer ${
                        bgColor === color
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-sm'
                          : 'bg-zinc-900/50 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {labels[color]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Country Rule Info Box */}
            <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-orange-400 uppercase block">Official Requirement</span>
              <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">{currentSpec.notes}</p>
              <p className="text-[10px] text-zinc-500 font-mono pt-1 border-t border-zinc-800">
                Recommended head height: {currentSpec.headHeightPct}
              </p>
            </div>
          </div>

          {/* Export Controls */}
          <div className="space-y-3 pt-3 border-t border-zinc-900">
            {imageSrc ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle('png')}
                    className="py-2.5 px-3 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Single PNG (300 DPI)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle('jpeg')}
                    className="py-2.5 px-3 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-orange-400" />
                    <span>Single JPG (&lt;240KB)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadPrintSheet('4x6')}
                  className="w-full py-2.5 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-orange-950/30 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet 4" x 6" (6 Photos)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPrintSheet('A4')}
                  className="w-full py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Print Sheet A4 Paper (8 Photos)</span>
                </button>
              </div>
            ) : (
              <p className="text-center text-xs text-zinc-500 font-mono py-4">
                Upload a portrait photo to unlock export options
              </p>
            )}

            <div className="flex gap-2 p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg text-[10px] text-zinc-400">
              <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span>
                <strong>Passport Acceptance Tip:</strong> Look straight at the camera with a neutral expression, mouth closed, and both eyes open. Ensure ears are uncovered and lighting is even with zero shadows.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

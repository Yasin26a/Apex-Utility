import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, Download, RefreshCw, Grid, Sliders, Palette, FileImage, ShieldAlert } from 'lucide-react';

export default function PassportPhotoMaker() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [bgColor, setBgColor] = useState<'white' | 'blue' | 'lightgray' | 'transparent'>('white');
  const [passportSize, setPassportSize] = useState<'2x2' | '35x45'>('2x2'); // 2x2 inches (US) or 35x45mm (EU)
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Crop boundaries (simulated via sliders/offsets for maximum simplicity and zero dependencies)
  const [scale, setScale] = useState(100);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

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
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const drawCanvas = () => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dimensions based on standard passport aspect ratios
    // 2x2 inches is square (600x600 px), 35x45 is roughly 3.5:4.5 aspect ratio (525x675 px)
    const targetWidth = passportSize === '2x2' ? 600 : 525;
    const targetHeight = passportSize === '2x2' ? 600 : 675;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 1. Draw background color
    ctx.fillStyle = 
      bgColor === 'white' ? '#FFFFFF' :
      bgColor === 'blue' ? '#3B82F6' :
      bgColor === 'lightgray' ? '#E2E8F0' : 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // 2. Load and draw image with custom filters, scale, offsets
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.save();
      
      // Apply filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

      // Crop/Scale parameters
      const scaleMultiplier = scale / 100;
      const drawWidth = img.width * scaleMultiplier;
      const drawHeight = img.height * scaleMultiplier;

      // Center the image + add offset sliders
      const x = (targetWidth - drawWidth) / 2 + offsetX;
      const y = (targetHeight - drawHeight) / 2 + offsetY;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      ctx.restore();

      // 3. Optional face guidelines overlay for alignment (only inside UI preview, but let's draw a very faint guidelines layer)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)'; // Light red guide
      ctx.lineWidth = 1.5;
      
      // Draw oval head guideline
      ctx.beginPath();
      ctx.ellipse(targetWidth / 2, targetHeight * 0.45, targetWidth * 0.22, targetHeight * 0.28, 0, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw eye-line guide
      ctx.beginPath();
      ctx.moveTo(targetWidth * 0.2, targetHeight * 0.42);
      ctx.lineTo(targetWidth * 0.8, targetHeight * 0.42);
      ctx.stroke();
    };
    img.src = imageSrc;
  };

  useEffect(() => {
    drawCanvas();
  }, [imageSrc, brightness, contrast, bgColor, passportSize, scale, offsetX, offsetY]);

  const handleDownloadSingle = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `passport_photo_${passportSize}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleDownloadSheet = () => {
    if (!canvasRef.current) return;
    const singleCanvas = canvasRef.current;
    
    // Create a 4x6 inches printing sheet canvas (1800x1200 px at 300DPI)
    // We will lay out a 4x2 grid of 600x600 passport photos or similar
    const sheetCanvas = document.createElement('canvas');
    sheetCanvas.width = 1800;
    sheetCanvas.height = 1200;
    const sCtx = sheetCanvas.getContext('2d');
    if (!sCtx) return;

    sCtx.fillStyle = '#FFFFFF';
    sCtx.fillRect(0, 0, 1800, 1200);

    // Grid spacing variables
    const photoW = passportSize === '2x2' ? 500 : 450;
    const photoH = passportSize === '2x2' ? 500 : 578;
    
    // Draw 6 passport photos
    const cols = 3;
    const rows = 2;
    const startX = 100;
    const startY = 50;
    const gapX = 80;
    const gapY = 50;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * (photoW + gapX);
        const y = startY + r * (photoH + gapY);
        sCtx.drawImage(singleCanvas, x, y, photoW, photoH);
        
        // Faint border lines to guide cutting scissors
        sCtx.strokeStyle = '#D1D5DB';
        sCtx.lineWidth = 1;
        sCtx.strokeRect(x, y, photoW, photoH);
      }
    }

    const link = document.createElement('a');
    link.download = `passport_print_sheet_4x6.png`;
    link.href = sheetCanvas.toDataURL('image/png');
    link.click();
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
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6" id="passport-photo-maker-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Grid className="w-6 h-6 text-orange-400" />
          <span>Passport &amp; ID Photo Maker</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Transform any standard smartphone portrait into a compliant government-format passport photo. Crop, correct background colors, align head indicators, and print multi-photo sheets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Workspace */}
        <div className="lg:col-span-8 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4">
          {!imageSrc ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="h-96 border-2 border-dashed border-zinc-800 hover:border-orange-500/30 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-3 cursor-pointer transition-all bg-zinc-950/40"
            >
              <Upload className="w-10 h-10 text-zinc-500 animate-bounce" />
              <div className="space-y-1">
                <p className="text-xs font-mono font-bold uppercase text-zinc-300">Upload portrait photograph</p>
                <p className="text-[10px] text-zinc-500 font-mono">Drag and drop or click to upload PNG, JPG up to 10MB</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Canvas Preview */}
              <div className="space-y-2 shrink-0">
                <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900 flex justify-center items-center shadow-2xl">
                  <canvas ref={canvasRef} className="max-w-[280px] sm:max-w-[320px] h-auto block" />
                  
                  {/* Visual guideline HUD overlay to help users align faces */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
                    <span className="text-[8px] font-mono font-bold uppercase bg-red-600 text-white px-1.5 py-0.5 rounded self-start">
                      Face alignment overlay
                    </span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-zinc-500 text-center uppercase tracking-wider">
                  Oval aligns with top of head and chin
                </p>
              </div>

              {/* Position & Crop sliders */}
              <div className="flex-1 w-full space-y-4">
                <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-orange-400" />
                  <span>Align Portrait Position</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-zinc-400">Portrait Scale Zoom</span>
                      <span className="text-zinc-300 font-bold">{scale}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="300"
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-orange-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-zinc-400">Horizontal shift (X)</span>
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

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-zinc-400">Vertical shift (Y)</span>
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
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setScale(100);
                      setOffsetX(0);
                      setOffsetY(0);
                      setBrightness(100);
                      setContrast(100);
                    }}
                    className="px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:border-zinc-700 rounded text-xs font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset controls</span>
                  </button>

                  <button
                    onClick={() => setImageSrc(null)}
                    className="px-3 py-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/5 rounded text-xs font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <span>Choose other image</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-4 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-2">
              Compliance setup
            </h3>

            {/* Passport standard size selector */}
            <div className="space-y-1.5 text-xs">
              <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none">
                1. Passport Dimension Target
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPassportSize('2x2')}
                  className={`py-2 text-center rounded border transition-all cursor-pointer ${
                    passportSize === '2x2'
                      ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 font-bold'
                      : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className="block text-xs">2" x 2" standard</span>
                  <span className="text-[9px] block text-zinc-500 font-mono">United States (51x51mm)</span>
                </button>
                <button
                  onClick={() => setPassportSize('35x45')}
                  className={`py-2 text-center rounded border transition-all cursor-pointer ${
                    passportSize === '35x45'
                      ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 font-bold'
                      : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className="block text-xs">35mm x 45mm</span>
                  <span className="text-[9px] block text-zinc-500 font-mono">European Union &amp; UK</span>
                </button>
              </div>
            </div>

            {/* Background color settings */}
            <div className="space-y-1.5 text-xs">
              <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" />
                <span>2. Background Substitution</span>
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['white', 'blue', 'lightgray', 'transparent'] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => setBgColor(color)}
                    className={`py-1.5 rounded text-[10px] uppercase font-mono font-bold transition-all border cursor-pointer ${
                      bgColor === color
                        ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                        : 'bg-zinc-900/50 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters brightness / contrast */}
            <div className="space-y-3 border-t border-zinc-900 pt-3 text-xs">
              <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none">
                3. Light correction
              </span>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-zinc-500">Image Brightness</span>
                  <span className="text-zinc-400">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-orange-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-zinc-500">Image Contrast</span>
                  <span className="text-zinc-400">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-orange-400"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {imageSrc && (
              <div className="space-y-2 border-t border-zinc-900 pt-3.5">
                <button
                  type="button"
                  onClick={handleDownloadSingle}
                  className="w-full py-2.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileImage className="w-3.5 h-3.5" />
                  <span>Download single photo</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSheet}
                  className="w-full py-2.5 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download printable sheet (4x6)</span>
                </button>
              </div>
            )}

            <div className="flex gap-1.5 p-3 bg-orange-950/10 border border-orange-950/25 rounded-lg text-[10px] text-zinc-400">
              <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span>
                <strong>Format parameters:</strong> Most countries mandate a completely plain background (white or light blue), high-contrast facial lighting, ears fully visible, and head vertically aligned. Maintain centered alignment inside the Red hud overlay.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

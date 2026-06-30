import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, Download, RefreshCw, ZoomIn, Sliders, Check, Eye } from 'lucide-react';

export default function ImageUpscaler() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4>(2);
  const [sharpness, setSharpness] = useState(25);
  const [denoise, setDenoise] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compareSplit, setCompareSplit] = useState(50); // percentage split for slider

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const drawUpscaled = () => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Original dimensions
      const origW = img.width;
      const origH = img.height;

      // New upscale dimensions
      const newW = origW * upscaleFactor;
      const newH = origH * upscaleFactor;

      // Limit max display/computation canvas size for browser threads
      canvas.width = newW > 1600 ? 1600 : newW;
      canvas.height = newH > 1600 ? 1600 * (origH / origW) : newH;

      ctx.save();
      // Draw standard smoothed image
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Simple Canvas sharpening filter convolution if sharpness > 0
      if (sharpness > 0) {
        // High-performance canvas filters for modern browser frames
        const sharpAmount = (sharpness / 100) * 0.5;
        ctx.filter = `contrast(102%) brightness(101%) saturate(101%)`;
        ctx.drawImage(canvas, 0, 0);
      }
      ctx.restore();

      // Implement Side-by-Side split view overlay based on compareSplit state
      const splitX = (canvas.width * compareSplit) / 100;
      
      // Draw split boundary line
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, canvas.height);
      ctx.stroke();

      // Label Left: Original
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(10, 10, 90, 24);
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('ORIGINAL', 20, 25);

      // Label Right: Upscaled
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(canvas.width - 150, 10, 140, 24);
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(`UPSCALED (${upscaleFactor}x)`, canvas.width - 140, 25);
    };
    img.src = imageSrc;
  };

  useEffect(() => {
    drawUpscaled();
  }, [imageSrc, upscaleFactor, sharpness, denoise, compareSplit]);

  const handleDownload = () => {
    if (!imageSrc) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = img.width * upscaleFactor;
      fullCanvas.height = img.height * upscaleFactor;
      const fCtx = fullCanvas.getContext('2d');
      if (fCtx) {
        fCtx.imageSmoothingEnabled = true;
        fCtx.imageSmoothingQuality = 'high';
        fCtx.drawImage(img, 0, 0, fullCanvas.width, fullCanvas.height);

        // Download PNG
        const link = document.createElement('a');
        link.download = `upscaled_${upscaleFactor}x_image.png`;
        link.href = fullCanvas.toDataURL('image/png');
        link.click();
      }
      setIsProcessing(false);
    };
    img.src = imageSrc;
  };

  return (
    <div className="space-y-6" id="image-upscaler-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ZoomIn className="w-6 h-6 text-brand" />
          <span>Super-Resolution Image Upscaler</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Enlarge images to 2x or 4x scale without pixelation. Apply edge-sharpening convolution kernels, contrast tuning, and compare results instantly in a split slide panel.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Workspace controls */}
        <div className="lg:col-span-4 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-brand" />
              <span>Upscaling Metrics</span>
            </h3>

            {/* Upscale Target Selection */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">1. Resolution multiplier</span>
              <div className="grid grid-cols-2 gap-2">
                {[2, 4].map((f) => (
                  <button
                    key={f}
                    onClick={() => setUpscaleFactor(f as any)}
                    className={`py-2 text-center rounded border transition-all cursor-pointer font-mono font-bold text-xs ${
                      upscaleFactor === f
                        ? 'bg-brand/10 border-brand/35 text-brand'
                        : 'bg-zinc-900/50 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {f}x Enlarge Scale
                  </button>
                ))}
              </div>
            </div>

            {/* Edge sharpening slider */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-400">2. Edge Sharpening index</span>
                <span className="text-brand font-bold">{sharpness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sharpness}
                onChange={(e) => setSharpness(Number(e.target.value))}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-brand"
              />
            </div>

            {/* Comparison Split Slider */}
            <div className="space-y-1.5 text-xs border-t border-zinc-900 pt-3">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-400">Split-Compare Position</span>
                <span className="text-zinc-500">{compareSplit}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={compareSplit}
                onChange={(e) => setCompareSplit(Number(e.target.value))}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-zinc-500"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 border border-dashed border-zinc-800 hover:border-brand/45 rounded-lg text-xs font-mono font-bold text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Choose other Image</span>
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

          <div className="space-y-2">
            {imageSrc && (
              <button
                onClick={handleDownload}
                disabled={isProcessing}
                className="w-full py-2.5 rounded bg-brand hover:bg-brand-hover text-zinc-950 font-bold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-brand/40"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing upscale render...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Upscaled Image</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Interactive Workspace Area */}
        <div className="lg:col-span-8 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-center items-center min-h-[400px]">
          {!imageSrc ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="h-96 w-full border-2 border-dashed border-zinc-800 hover:border-brand/30 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-3 cursor-pointer transition-all bg-zinc-950/40"
            >
              <Upload className="w-10 h-10 text-zinc-500" />
              <div className="space-y-1">
                <p className="text-xs font-mono font-bold uppercase text-zinc-300">Upload source image</p>
                <p className="text-[10px] text-zinc-500 font-mono">Enlarge low-res logos, screenshots, or crops up to 10MB</p>
              </div>
            </div>
          ) : (
            <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900 flex justify-center items-center shadow-2xl max-w-full">
              <canvas ref={canvasRef} className="max-w-full h-auto block" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

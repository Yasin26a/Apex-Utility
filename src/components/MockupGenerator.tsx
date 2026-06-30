import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, Download, RefreshCw, Laptop, Smartphone, Tablet, Monitor, Palette, Image as ImageIcon } from 'lucide-react';

export default function MockupGenerator() {
  const [screenshotSrc, setScreenshotSrc] = useState<string | null>(null);
  const [device, setDevice] = useState<'macbook' | 'iphone' | 'ipad'>('macbook');
  const [bgColor, setBgColor] = useState<'gradient-indigo' | 'gradient-sunset' | 'charcoal' | 'transparent'>('gradient-indigo');
  const [deviceColor, setDeviceColor] = useState<'space-gray' | 'silver' | 'gold'>('space-gray');
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setScreenshotSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const drawMockup = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Define mock dimensions (1200x800 for high resolution)
    canvas.width = 1200;
    canvas.height = 800;

    // 1. Draw Background
    ctx.save();
    if (bgColor === 'gradient-indigo') {
      const grad = ctx.createLinearGradient(0, 0, 1200, 800);
      grad.addColorStop(0, '#312E81'); // Indigo 900
      grad.addColorStop(1, '#06B6D4'); // Cyan 500
      ctx.fillStyle = grad;
    } else if (bgColor === 'gradient-sunset') {
      const grad = ctx.createLinearGradient(0, 0, 1200, 800);
      grad.addColorStop(0, '#BE185D'); // Pink 700
      grad.addColorStop(1, '#F59E0B'); // Amber 500
      ctx.fillStyle = grad;
    } else if (bgColor === 'charcoal') {
      ctx.fillStyle = '#0F172A'; // Slate 900
    } else {
      ctx.clearRect(0, 0, 1200, 800);
      ctx.fillStyle = 'rgba(0,0,0,0)';
    }
    ctx.fillRect(0, 0, 1200, 800);
    ctx.restore();

    // 2. Load screenshot and draw device frame
    const bezelColor = deviceColor === 'space-gray' ? '#1E293B' : deviceColor === 'silver' ? '#94A3B8' : '#D97706';
    const drawContentAndFrame = (screenImage: HTMLImageElement | null) => {
      ctx.save();
      
      // Shadow for device
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;

      if (device === 'macbook') {
        // Draw MacBook Outer Lid/Bezel
        const devX = 250;
        const devY = 180;
        const devW = 700;
        const devH = 420;
        const radius = 18;

        ctx.fillStyle = bezelColor;
        ctx.beginPath();
        ctx.roundRect(devX, devY, devW, devH, [radius, radius, 0, 0]);
        ctx.fill();

        // Draw inner camera circle
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(250 + 350, 180 + 10, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw laptop keyboard base
        ctx.fillStyle = deviceColor === 'space-gray' ? '#334155' : deviceColor === 'silver' ? '#CBD5E1' : '#F59E0B';
        ctx.beginPath();
        ctx.roundRect(200, 180 + 420, 800, 24, [4, 4, 12, 12]);
        ctx.fill();

        // Draw bottom tray notch
        ctx.fillStyle = '#000000';
        ctx.fillRect(550, 180 + 420, 100, 4);

        // Screen Area boundaries
        const sX = devX + 20;
        const sY = devY + 25;
        const sW = devW - 40;
        const sH = devH - 45;

        // Draw black screen backing
        ctx.fillStyle = '#000000';
        ctx.fillRect(sX, sY, sW, sH);

        // Clip and Draw user screenshot
        if (screenImage) {
          ctx.beginPath();
          ctx.rect(sX, sY, sW, sH);
          ctx.clip();
          ctx.drawImage(screenImage, sX, sY, sW, sH);
        } else {
          // Draw generic placeholder
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(sX + 50, sY + 50, sW - 100, sH - 100);
          ctx.fillStyle = '#94A3B8';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('UPLOAD PORTRAIT OR LANDSCAPE SCREENSHOT', sX + sW/2, sY + sH/2);
        }
      } else if (device === 'iphone') {
        // Draw iPhone Bezel
        const devX = 420;
        const devY = 100;
        const devW = 360;
        const devH = 600;
        const radius = 45;

        ctx.fillStyle = bezelColor;
        ctx.beginPath();
        ctx.roundRect(devX, devY, devW, devH, radius);
        ctx.fill();

        // Screen Area boundaries
        const sX = devX + 15;
        const sY = devY + 15;
        const sW = devW - 30;
        const sH = devH - 30;

        // Draw black screen backing
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.roundRect(sX, sY, sW, sH, radius - 10);
        ctx.fill();

        // Clip and Draw screenshot
        if (screenImage) {
          ctx.beginPath();
          ctx.roundRect(sX, sY, sW, sH, radius - 10);
          ctx.clip();
          ctx.drawImage(screenImage, sX, sY, sW, sH);
        } else {
          // Draw placeholder
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(sX, sY, sW, sH);
          ctx.fillStyle = '#94A3B8';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('UPLOAD PORTRAIT', sX + sW/2, sY + sH/2 - 20);
          ctx.fillText('SCREENSHOT', sX + sW/2, sY + sH/2 + 10);
        }

        // Draw Dynamic Island Pill notch on top of screenshot clip
        ctx.restore();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.roundRect(devX + (devW/2) - 45, devY + 28, 90, 22, 11);
        ctx.fill();
      } else {
        // Draw iPad Bezel
        const devX = 320;
        const devY = 120;
        const devW = 560;
        const devH = 560;
        const radius = 30;

        ctx.fillStyle = bezelColor;
        ctx.beginPath();
        ctx.roundRect(devX, devY, devW, devH, radius);
        ctx.fill();

        // Screen Area boundaries
        const sX = devX + 22;
        const sY = devY + 22;
        const sW = devW - 44;
        const sH = devH - 44;

        // Draw black backing
        ctx.fillStyle = '#000000';
        ctx.fillRect(sX, sY, sW, sH);

        // Clip and Draw screenshot
        if (screenImage) {
          ctx.beginPath();
          ctx.rect(sX, sY, sW, sH);
          ctx.clip();
          ctx.drawImage(screenImage, sX, sY, sW, sH);
        } else {
          // Draw placeholder
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(sX, sY, sW, sH);
          ctx.fillStyle = '#94A3B8';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('UPLOAD IPAD SCREENSHOT', sX + sW/2, sY + sH/2);
        }
      }
      ctx.restore();
    };

    if (screenshotSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        drawContentAndFrame(img);
      };
      img.src = screenshotSrc;
    } else {
      drawContentAndFrame(null);
    }
  };

  useEffect(() => {
    drawMockup();
  }, [screenshotSrc, device, bgColor, deviceColor]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `mockup_${device}_frame.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-6" id="mockup-generator-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Laptop className="w-6 h-6 text-brand" />
          <span>Device Mockup Frame Generator</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Superimpose screenshots and portfolio screens inside elegant MacBook Pro, iPhone 15, or iPad Air device bezels complete with organic gradients and realistic shadows.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mock settings controls */}
        <div className="lg:col-span-4 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4 flex flex-col justify-between">
          <div className="space-y-4 text-xs">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5">
              Device Bezels Setup
            </h3>

            {/* Device Type Selectors */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">1. Device Template Frame</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setDevice('macbook')}
                  className={`py-2 text-center rounded border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    device === 'macbook'
                      ? 'bg-brand/10 border-brand/35 text-brand font-bold'
                      : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono uppercase">MacBook</span>
                </button>

                <button
                  onClick={() => setDevice('iphone')}
                  className={`py-2 text-center rounded border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    device === 'iphone'
                      ? 'bg-brand/10 border-brand/35 text-brand font-bold'
                      : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono uppercase">iPhone 15</span>
                </button>

                <button
                  onClick={() => setDevice('ipad')}
                  className={`py-2 text-center rounded border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    device === 'ipad'
                      ? 'bg-brand/10 border-brand/35 text-brand font-bold'
                      : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono uppercase">iPad Air</span>
                </button>
              </div>
            </div>

            {/* Device Finish color select */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">2. Device Finish Color</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['space-gray', 'silver', 'gold'] as const).map((col) => (
                  <button
                    key={col}
                    onClick={() => setDeviceColor(col)}
                    className={`py-1 rounded border transition-all cursor-pointer text-[10px] font-mono uppercase ${
                      deviceColor === col
                        ? 'bg-brand/10 border-brand/35 text-brand font-bold'
                        : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {col.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Style Selection */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-900">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" />
                <span>3. Backdrop Canvas</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'gradient-indigo', name: 'Cosmic Blue' },
                  { id: 'gradient-sunset', name: 'Amber Sunset' },
                  { id: 'charcoal', name: 'Dark Slate' },
                  { id: 'transparent', name: 'Transparent' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setBgColor(g.id as any)}
                    className={`py-1.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                      bgColor === g.id
                        ? 'border-brand text-zinc-200 font-bold'
                        : 'border-zinc-900 text-zinc-500 hover:text-zinc-400'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 border border-dashed border-zinc-800 hover:border-brand/45 rounded-lg text-xs font-mono font-bold text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Upload Screenshot</span>
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

          <div className="space-y-3 pt-3">
            <button
              onClick={handleDownload}
              className="w-full py-2.5 rounded bg-brand hover:bg-brand-hover text-zinc-950 font-bold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Mockup PNG</span>
            </button>
          </div>
        </div>

        {/* Live Preview Display */}
        <div className="lg:col-span-8 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-center items-center min-h-[400px]">
          <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900 flex justify-center items-center shadow-2xl max-w-full">
            <canvas ref={canvasRef} className="max-w-full h-auto block" style={{ maxHeight: '420px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

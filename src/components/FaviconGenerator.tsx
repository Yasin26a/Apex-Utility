import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, Download, RefreshCw, Smile, Image as ImageIcon, Sparkles, Code, Check } from 'lucide-react';

export default function FaviconGenerator() {
  const [sourceType, setSourceType] = useState<'emoji' | 'image'>('emoji');
  const [emojiInput, setEmojiInput] = useState('⚡');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#4F46E5'); // Indigo default
  const [borderRadius, setBorderRadius] = useState<number>(50); // circle/rounded/square percentage
  const [copiedCode, setCopiedCode] = useState(false);

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

  const drawFavicon = (size: number, outCanvas?: HTMLCanvasElement) => {
    const canvas = outCanvas || canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    // Draw background with borders
    ctx.clearRect(0, 0, size, size);
    
    ctx.save();
    ctx.fillStyle = bgColor;
    const rx = (size * borderRadius) / 100;
    
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, rx);
    ctx.fill();
    ctx.restore();

    // Draw Content
    if (sourceType === 'emoji') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${size * 0.6}px sans-serif`;
      ctx.fillText(emojiInput, size / 2, size / 2);
      ctx.restore();
    } else if (sourceType === 'image' && imageSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.save();
        // Clip to rounded border
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, rx);
        ctx.clip();
        ctx.drawImage(img, 0, 0, size, size);
        ctx.restore();
      };
      img.src = imageSrc;
    }
  };

  useEffect(() => {
    drawFavicon(256); // Big preview size
  }, [sourceType, emojiInput, imageSrc, bgColor, borderRadius]);

  const handleDownload = (size: number) => {
    const tempCanvas = document.createElement('canvas');
    drawFavicon(size, tempCanvas);
    
    // Create image download
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `favicon-${size}x${size}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
    }, 100);
  };

  const handleCopyLinkCode = () => {
    const code = `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6" id="favicon-generator-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Smile className="w-6 h-6 text-indigo-400" />
          <span>Professional Favicon Generator</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Enforce consistent visual branding on desktop search indexers. Forge favicons from responsive symbols, modern emojis, or custom logo images across all standard dimension packs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings column */}
        <div className="lg:col-span-5 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4 flex flex-col justify-between">
          <div className="space-y-4 text-xs">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5">
              Favicon Design Parameters
            </h3>

            {/* Source Type selectors */}
            <div className="flex gap-1 border border-zinc-900 p-1 rounded-lg bg-zinc-950/40">
              {(['emoji', 'image'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSourceType(tab)}
                  className={`flex-1 py-1.5 rounded font-mono font-bold text-[10px] uppercase transition-all cursor-pointer ${
                    sourceType === tab ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Input Emojis */}
            {sourceType === 'emoji' && (
              <div className="space-y-1 bg-zinc-950/50 p-3 rounded-lg border border-zinc-900 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="block font-bold text-zinc-300">Emoji icon</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Insert any single emoji</span>
                </div>
                <input
                  type="text"
                  maxLength={2}
                  value={emojiInput}
                  onChange={(e) => setEmojiInput(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-xl font-bold font-sans rounded p-1.5 w-20 text-center"
                />
              </div>
            )}

            {/* Input Custom Image upload */}
            {sourceType === 'image' && (
              <div className="pt-1.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 border border-dashed border-zinc-800 hover:border-indigo-500/45 rounded-lg text-xs font-mono font-bold text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Choose Image File</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            )}

            {/* Background Color selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                Favicon Background color
              </span>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-8 bg-zinc-950 border border-zinc-900 rounded p-0.5 cursor-pointer"
                />
                <span className="font-mono text-zinc-400">{bgColor}</span>
              </div>
            </div>

            {/* Border radius percentage */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-400">Favicon border-radius rounding</span>
                <span className="text-zinc-500">{borderRadius}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={borderRadius}
                onChange={(e) => setBorderRadius(Number(e.target.value))}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>
          </div>

          <div className="space-y-3.5 border-t border-zinc-900 pt-3">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              <span>HTML Meta Integration</span>
            </h3>
            <pre className="bg-zinc-950/80 border border-zinc-900 text-[10px] font-mono text-zinc-400 p-3 rounded-lg overflow-x-auto whitespace-pre">
              {`<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">`}
            </pre>
            <button
              onClick={handleCopyLinkCode}
              className="w-full py-1.5 border border-zinc-800 text-zinc-400 hover:text-zinc-300 rounded text-xs font-mono flex items-center justify-center gap-1 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy HTML tag block'}</span>
            </button>
          </div>
        </div>

        {/* Live Preview Display */}
        <div className="lg:col-span-7 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between items-center min-h-[400px]">
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="relative p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-center shadow-2xl">
              <canvas ref={canvasRef} className="max-w-[140px] h-auto block" />
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-center">
              Large resolution vector render preview
            </span>
          </div>

          {/* Quick sizes download pack */}
          <div className="w-full space-y-2 border-t border-zinc-900 pt-4">
            <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1 text-center">
              Export standard formats
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleDownload(16)}
                className="py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded text-xs font-mono font-bold cursor-pointer"
              >
                16 x 16 px (Classic)
              </button>
              <button
                onClick={() => handleDownload(32)}
                className="py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded text-xs font-mono font-bold cursor-pointer"
              >
                32 x 32 px (Standard)
              </button>
              <button
                onClick={() => handleDownload(180)}
                className="py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-mono font-bold cursor-pointer shadow-lg"
              >
                180 x 180 px (Apple)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

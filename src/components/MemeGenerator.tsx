import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, Download, RefreshCw, Type, Smile, HelpCircle } from 'lucide-react';

interface MemeTemplate {
  name: string;
  url: string;
  topDefault?: string;
  bottomDefault?: string;
}

const TEMPLATE_PRESETS: MemeTemplate[] = [
  {
    name: 'Drake Hotline Bling',
    url: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=800&q=80',
    topDefault: 'CODING ALL NIGHT',
    bottomDefault: 'COMPILING SUCCESS ON FIRST TRY'
  },
  {
    name: 'Distracted Boyfriend',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    topDefault: 'NEW COMPILER ERRORS',
    bottomDefault: 'THE WORKING DRAFT CODE'
  },
  {
    name: 'Two Buttons Matrix',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    topDefault: 'FIX BUG MANUALLY',
    bottomDefault: 'REWRITE THE CORE DATABASE'
  },
  {
    name: 'Success Kid',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    topDefault: 'LINTER GAVE 100 ERRORS',
    bottomDefault: 'ALL REMOVED IN SECONDS'
  }
];

export default function MemeGenerator() {
  const [imageSrc, setImageSrc] = useState<string | null>(TEMPLATE_PRESETS[0].url);
  const [topText, setTopText] = useState(TEMPLATE_PRESETS[0].topDefault || 'TOP STATEMENT');
  const [bottomText, setBottomText] = useState(TEMPLATE_PRESETS[0].bottomDefault || 'BOTTOM STATEMENT');
  const [fontSize, setFontSize] = useState(40);
  const [fontColor, setFontColor] = useState('#FFFFFF');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState<'Impact' | 'Arial' | 'Comic Sans MS' | 'Montserrat'>('Impact');

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

  const drawMeme = () => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Set canvas size based on loaded image
      canvas.width = img.width > 800 ? 800 : img.width;
      canvas.height = img.height > 800 ? 800 * (img.height / img.width) : img.height;

      // Draw background meme canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Text configurations
      ctx.font = `900 ${fontSize}px ${fontFamily}, sans-serif`;
      ctx.fillStyle = fontColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = fontSize / 8;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Draw Top Text
      if (topText) {
        ctx.strokeText(topText.toUpperCase(), canvas.width / 2, 20);
        ctx.fillText(topText.toUpperCase(), canvas.width / 2, 20);
      }

      // Draw Bottom Text
      ctx.textBaseline = 'bottom';
      if (bottomText) {
        ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 20);
        ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 20);
      }
    };
    img.src = imageSrc;
  };

  useEffect(() => {
    drawMeme();
  }, [imageSrc, topText, bottomText, fontSize, fontColor, strokeColor, fontFamily]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'generated_meme.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-6" id="meme-generator-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Smile className="w-6 h-6 text-brand" />
          <span>Technical Meme Builder</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Craft custom reaction cards and technical memes. Choose pre-packaged blank layouts, adjust impact typography alignments, and download memes instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Template Selectors & Settings */}
        <div className="lg:col-span-4 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5">
              Template Choice
            </h3>

            {/* Popular Presets */}
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATE_PRESETS.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setImageSrc(tpl.url);
                    setTopText(tpl.topDefault || '');
                    setBottomText(tpl.bottomDefault || '');
                  }}
                  className={`p-2 rounded text-left border transition-all text-[11px] font-sans flex flex-col gap-1.5 cursor-pointer ${
                    imageSrc === tpl.url
                      ? 'bg-brand/10 border-brand/30 text-brand font-bold'
                      : 'bg-zinc-900/50 border-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <img src={tpl.url} alt={tpl.name} className="h-12 w-full object-cover rounded opacity-85" referrerPolicy="no-referrer" />
                  <span className="truncate block">{tpl.name}</span>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 border border-dashed border-zinc-800 hover:border-brand/45 rounded-lg text-xs font-mono font-bold text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Custom Image</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5 pt-2 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-brand" />
              <span>Configure Typography</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                  Top Text Overlay
                </label>
                <input
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  placeholder="TOP STATEMENTS GO HERE..."
                  className="w-full bg-zinc-950 border border-zinc-900 text-sm font-sans text-zinc-200 rounded p-2 focus:outline-none focus:border-brand/45"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                  Bottom Text Overlay
                </label>
                <input
                  type="text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  placeholder="BOTTOM COMMENTS GO HERE..."
                  className="w-full bg-zinc-950 border border-zinc-900 text-sm font-sans text-zinc-200 rounded p-2 focus:outline-none focus:border-brand/45"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                    Font Family
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 rounded p-1.5 focus:outline-none"
                  >
                    <option value="Impact">Impact Classic</option>
                    <option value="Arial">Arial Bold</option>
                    <option value="Comic Sans MS">Comic Relief</option>
                    <option value="Montserrat">Montserrat Black</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                    Text Font Size
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="100"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 rounded p-1.5 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                    Font Color
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      className="w-8 h-7 bg-zinc-950 border border-zinc-900 rounded p-0.5 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-zinc-400">{fontColor}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                    Stroke Color
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="w-8 h-7 bg-zinc-950 border border-zinc-900 rounded p-0.5 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-zinc-400">{strokeColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3">
            <button
              onClick={handleDownload}
              className="w-full py-2.5 rounded bg-brand hover:bg-brand-hover text-zinc-950 font-bold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Meme JPG</span>
            </button>
          </div>
        </div>

        {/* Live Preview Display */}
        <div className="lg:col-span-8 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900 flex justify-center items-center shadow-2xl max-w-full">
            <canvas ref={canvasRef} className="max-w-full h-auto block" />
          </div>
        </div>
      </div>
    </div>
  );
}

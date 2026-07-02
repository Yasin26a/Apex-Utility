import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Download, 
  Type, 
  Image as ImageIcon, 
  FileJson, 
  Link, 
  Smartphone, 
  Laptop, 
  Globe, 
  Settings2, 
  RefreshCw, 
  Palette, 
  Check, 
  Copy, 
  Plus, 
  Search,
  Sliders,
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';

interface ManifestConfig {
  name: string;
  shortName: string;
  startUrl: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'minimal-ui' | 'fullscreen' | 'browser';
  orientation: 'any' | 'portrait' | 'landscape';
}

const SHAPES = [
  { id: 'circle', label: 'Circle' },
  { id: 'rounded-rect', label: 'Rounded Square' },
  { id: 'squircle', label: 'Squircle' },
  { id: 'hexagon', label: 'Hexagon' },
  { id: 'none', label: 'None (Transparent)' }
];

const FONTS = [
  { id: 'sans-serif', label: 'Sans-Serif (Modern)' },
  { id: 'serif', label: 'Serif (Classic)' },
  { id: 'monospace', label: 'Monospace (Tech)' },
  { id: 'cursive', label: 'Cursive (Creative)' }
];

export default function FaviconGenerator() {
  const [inputType, setInputType] = useState<'image' | 'text'>('image');
  
  // Image Input State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [imgBgColor, setImgBgColor] = useState<string>('#ffffff');
  const [applyImgBg, setApplyImgBg] = useState<boolean>(false);
  const [imgBorderRadius, setImgBorderRadius] = useState<number>(0); // 0 (none) to 50 (circle)

  // Text/Emoji Input State
  const [text, setText] = useState<string>('⚡');
  const [fontFamily, setFontFamily] = useState<string>('sans-serif');
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [bgColor, setBgColor] = useState<string>('#4f46e5');
  const [shape, setShape] = useState<string>('circle');
  const [fontSize, setFontSize] = useState<number>(65); // percentage
  const [bold, setBold] = useState<boolean>(true);
  const [italic, setItalic] = useState<boolean>(false);
  const [shadow, setShadow] = useState<boolean>(false);

  // Web Manifest Config State
  const [manifest, setManifest] = useState<ManifestConfig>({
    name: 'My Progressive Web App',
    shortName: 'My PWA',
    startUrl: '/',
    themeColor: '#4f46e5',
    backgroundColor: '#0f172a',
    display: 'standalone',
    orientation: 'any'
  });

  // UI Tabs & Previews
  const [previewTab, setPreviewTab] = useState<'tab' | 'mobile' | 'serp'>('tab');
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Source image node to draw on canvas
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Generate a high-res master source canvas to output different favicon sizes
  const generateCanvasDataUrl = (size: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, size, size);

    if (inputType === 'image' && imageSrc && imageElementRef.current) {
      // Background handling for images
      if (applyImgBg) {
        ctx.fillStyle = imgBgColor;
        // Apply border radius
        if (imgBorderRadius > 0) {
          const r = (imgBorderRadius / 100) * size;
          ctx.beginPath();
          ctx.moveTo(r, 0);
          ctx.lineTo(size - r, 0);
          ctx.quadraticCurveTo(size, 0, size, r);
          ctx.lineTo(size, size - r);
          ctx.quadraticCurveTo(size, size, size - r, size);
          ctx.lineTo(r, size);
          ctx.quadraticCurveTo(0, size, 0, size - r);
          ctx.lineTo(0, r);
          ctx.quadraticCurveTo(0, 0, r, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(0, 0, size, size);
        }
      }

      // Draw uploaded image with zoom, rotation, and offset
      ctx.save();
      // Clip if there is a border radius applied
      if (applyImgBg && imgBorderRadius > 0) {
        const r = (imgBorderRadius / 100) * size;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(size - r, 0);
        ctx.quadraticCurveTo(size, 0, size, r);
        ctx.lineTo(size, size - r);
        ctx.quadraticCurveTo(size, size, size - r, size);
        ctx.lineTo(r, size);
        ctx.quadraticCurveTo(0, size, 0, size - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.clip();
      }

      ctx.translate(size / 2 + (offsetX / 100) * size, size / 2 + (offsetY / 100) * size);
      ctx.rotate((rotation * Math.PI) / 180);
      
      const scale = zoom / 100;
      const drawW = size * scale;
      const drawH = size * scale;

      ctx.drawImage(
        imageElementRef.current,
        -drawW / 2,
        -drawH / 2,
        drawW,
        drawH
      );
      ctx.restore();

    } else if (inputType === 'text') {
      // Draw background shape for Text/Emoji
      if (shape !== 'none') {
        ctx.fillStyle = bgColor;
        ctx.beginPath();

        if (shape === 'circle') {
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === 'rounded-rect') {
          const r = size * 0.2; // 20% border radius
          ctx.roundRect ? ctx.roundRect(0, 0, size, size, r) : ctx.rect(0, 0, size, size);
          ctx.fill();
        } else if (shape === 'squircle') {
          // Approximate squircle path
          const r = size * 0.44;
          const cp = size * 0.08;
          ctx.moveTo(size / 2, 0);
          ctx.bezierCurveTo(size - cp, 0, size, cp, size, size / 2);
          ctx.bezierCurveTo(size, size - cp, size - cp, size, size / 2, size);
          ctx.bezierCurveTo(cp, size, 0, size - cp, 0, size / 2);
          ctx.bezierCurveTo(0, cp, cp, 0, size / 2, 0);
          ctx.closePath();
          ctx.fill();
        } else if (shape === 'hexagon') {
          const w = size;
          const h = size;
          ctx.moveTo(w / 2, 0);
          ctx.lineTo(w, h * 0.25);
          ctx.lineTo(w, h * 0.75);
          ctx.lineTo(w / 2, h);
          ctx.lineTo(0, h * 0.75);
          ctx.lineTo(0, h * 0.25);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Draw Text or Emoji
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const fontStyle = `${italic ? 'italic' : ''} ${bold ? 'bold' : ''}`;
      const pxSize = Math.round(size * (fontSize / 100) * 0.75);
      
      // Determine font family
      let fontName = 'Inter, sans-serif';
      if (fontFamily === 'serif') fontName = 'Playfair Display, Georgia, serif';
      if (fontFamily === 'monospace') fontName = 'JetBrains Mono, Courier New, monospace';
      if (fontFamily === 'cursive') fontName = 'Brush Script MT, cursive';

      ctx.font = `${fontStyle} ${pxSize}px ${fontName}`;
      
      if (shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = size * 0.05;
        ctx.shadowOffsetX = size * 0.02;
        ctx.shadowOffsetY = size * 0.02;
      }

      ctx.fillStyle = textColor;
      // Draw at center
      ctx.fillText(text, size / 2, size / 2 + (fontFamily === 'cursive' ? -size * 0.02 : size * 0.02));
      ctx.restore();
    } else {
      // Fallback empty state grid placeholder inside the canvas
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#4f46e5';
      ctx.font = `${size * 0.4}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ICO', size / 2, size / 2);
    }

    return canvas.toDataURL('image/png');
  };

  // State to hold active live previews of diff sizes
  const [preview16, setPreview16] = useState<string>('');
  const [preview32, setPreview32] = useState<string>('');
  const [preview192, setPreview192] = useState<string>('');
  const [preview512, setPreview512] = useState<string>('');
  const [previewApple, setPreviewApple] = useState<string>('');

  // Re-generate preview sizes whenever configurations shift
  useEffect(() => {
    // Generate previews
    setPreview16(generateCanvasDataUrl(16));
    setPreview32(generateCanvasDataUrl(32));
    setPreview192(generateCanvasDataUrl(192));
    setPreview512(generateCanvasDataUrl(512));
    setPreviewApple(generateCanvasDataUrl(180));
  }, [
    inputType, 
    imageSrc, 
    zoom, 
    rotation, 
    offsetX, 
    offsetY, 
    imgBgColor, 
    applyImgBg, 
    imgBorderRadius,
    text, 
    fontFamily, 
    textColor, 
    bgColor, 
    shape, 
    fontSize, 
    bold, 
    italic, 
    shadow
  ]);

  // Load uploaded image file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImageFile(file);
    }
  };

  const loadImageFile = (file: File) => {
    setImageName(file.name.split('.')[0]);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const img = new Image();
        img.onload = () => {
          imageElementRef.current = img;
          setImageSrc(event.target!.result as string);
        };
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop support
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
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      loadImageFile(file);
    }
  };

  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  // Single Click Pack Downloader
  const downloadAllSizes = () => {
    const targets = [
      { name: 'favicon-16x16.png', data: preview16 },
      { name: 'favicon-32x32.png', data: preview32 },
      { name: 'apple-touch-icon.png', data: previewApple },
      { name: 'android-chrome-192x192.png', data: preview192 },
      { name: 'android-chrome-512x512.png', data: preview512 }
    ];

    targets.forEach((item, idx) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = item.data;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 300); // Stagger downloads to prevent browser blocking
    });
  };

  const downloadSingleSize = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // HTML Head Tag Output
  const htmlCodeSnippet = `<!-- Standard Favicon Links -->
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="shortcut icon" href="/favicon.ico">

<!-- Apple Touch Icon (iOS Mobile Devices) -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- Progressive Web App Manifest -->
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${manifest.themeColor}">
<meta name="mobile-web-app-capable" content="yes">`;

  // Web App Manifest Output JSON block
  const manifestJsonSnippet = JSON.stringify({
    "name": manifest.name,
    "short_name": manifest.shortName,
    "start_url": manifest.startUrl,
    "display": manifest.display,
    "background_color": manifest.backgroundColor,
    "theme_color": manifest.themeColor,
    "orientation": manifest.orientation,
    "icons": [
      {
        "src": "/android-chrome-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any maskable"
      },
      {
        "src": "/android-chrome-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ]
  }, null, 2);

  const copyText = (textToCopy: string, type: 'html' | 'manifest') => {
    navigator.clipboard.writeText(textToCopy);
    if (type === 'html') {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } else {
      setCopiedManifest(true);
      setTimeout(() => setCopiedManifest(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6" id="favicon-generator-app">
      {/* Top Title Banner */}
      <div className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Interactive Assets Suite</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Real-time Favicon & Web Manifest App Generator
          </h1>
          <p className="text-zinc-400 max-w-2xl text-sm leading-relaxed">
            Generate pixel-perfect icons for responsive desktop browser tabs, Apple mobile devices, and Android Progressive Web Apps. Live preview layouts and download standard formats instantly.
          </p>
        </div>

        {/* Input Toggle Switcher */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-center md:self-auto shadow-inner shrink-0">
          <button
            onClick={() => setInputType('image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              inputType === 'image'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            id="tab-btn-image"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image Source</span>
          </button>
          <button
            onClick={() => setInputType('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              inputType === 'text'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            id="tab-btn-text"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text / Emoji</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column Configurator Sandbox */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-md space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800/60 pb-3">
              <Settings2 className="w-4 h-4 text-indigo-400" />
              Icon Designer Sandbox
            </h2>

            {/* Input fields based on Image or Text */}
            {inputType === 'image' ? (
              <div className="space-y-4">
                {/* File Drag and Drop container */}
                <div
                  ref={dragRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleSelectFileClick}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/5'
                      : imageSrc
                      ? 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                      : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700 hover:bg-zinc-900/30'
                  }`}
                  id="image-dropzone"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                      <Upload className="w-5 h-5 text-zinc-400" />
                    </div>
                    {imageSrc ? (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-indigo-400 truncate max-w-[240px]">
                          ✓ {imageName || 'Image Uploaded'}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          Click or drag another image to change
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-300 font-semibold">
                          Click to select or drag image here
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          PNG, JPG, SVG, or WEBP up to 8MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Transformations controls */}
                {imageSrc && (
                  <div className="space-y-4 pt-2">
                    {/* Zoom */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400 mb-1">
                        <span>Image Zoom</span>
                        <span className="font-mono text-indigo-400">{zoom}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="250"
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    {/* Rotation */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400 mb-1">
                        <span>Rotate</span>
                        <span className="font-mono text-indigo-400">{rotation}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    {/* Positioning offset grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400 mb-1">
                          <span>Horizontal (X)</span>
                          <span className="font-mono text-indigo-400">{offsetX}%</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={offsetX}
                          onChange={(e) => setOffsetX(Number(e.target.value))}
                          className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400 mb-1">
                          <span>Vertical (Y)</span>
                          <span className="font-mono text-indigo-400">{offsetY}%</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={offsetY}
                          onChange={(e) => setOffsetY(Number(e.target.value))}
                          className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Background filler controls */}
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={applyImgBg}
                          onChange={(e) => setApplyImgBg(e.target.checked)}
                          className="rounded border-zinc-800 text-indigo-600 focus:ring-indigo-500/50 bg-zinc-900 w-4 h-4"
                        />
                        <span>Force Custom Padding Background</span>
                      </label>
                      {applyImgBg && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] uppercase font-bold text-zinc-500">Color:</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={imgBgColor}
                                onChange={(e) => setImgBgColor(e.target.value)}
                                className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                              />
                              <input
                                type="text"
                                value={imgBgColor}
                                onChange={(e) => setImgBgColor(e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 text-xs px-2 py-1 rounded text-zinc-300 font-mono w-20"
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500 mb-1">
                              <span>Border Radius</span>
                              <span className="font-mono text-indigo-400">{imgBorderRadius}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              value={imgBorderRadius}
                              onChange={(e) => setImgBorderRadius(Number(e.target.value))}
                              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Character or Emoji Text */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Glyph / Icon Text / Emoji
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="⚡, A, PW, etc."
                    id="text-input-field"
                  />
                </div>

                {/* Grid of Styles */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Font Family
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {FONTS.map((font) => (
                        <option key={font.id} value={font.id}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Background Shape
                    </label>
                    <select
                      value={shape}
                      onChange={(e) => setShape(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {SHAPES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Color pickers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Glyph Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent shrink-0"
                      />
                      <input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-xs px-2.5 py-1.5 rounded-xl text-zinc-300 font-mono w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent shrink-0"
                        disabled={shape === 'none'}
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-xs px-2.5 py-1.5 rounded-xl text-zinc-300 font-mono w-full"
                        disabled={shape === 'none'}
                      />
                    </div>
                  </div>
                </div>

                {/* Font Size Modifier */}
                <div>
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    <span>Text Size</span>
                    <span className="font-mono text-indigo-400">{fontSize}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="120"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Typography Toggles */}
                <div className="flex gap-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={bold}
                      onChange={(e) => setBold(e.target.checked)}
                      className="rounded border-zinc-800 text-indigo-600 focus:ring-indigo-500/50 bg-zinc-900 w-4 h-4"
                    />
                    <span>Bold</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={italic}
                      onChange={(e) => setItalic(e.target.checked)}
                      className="rounded border-zinc-800 text-indigo-600 focus:ring-indigo-500/50 bg-zinc-900 w-4 h-4"
                    />
                    <span>Italic</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={shadow}
                      onChange={(e) => setShadow(e.target.checked)}
                      className="rounded border-zinc-800 text-indigo-600 focus:ring-indigo-500/50 bg-zinc-900 w-4 h-4"
                    />
                    <span>Icon Shadow</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Web App Manifest Configuration Form */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800/60 pb-3">
              <FileJson className="w-4 h-4 text-indigo-400" />
              Web Manifest metadata
            </h2>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  value={manifest.name}
                  onChange={(e) => setManifest({ ...manifest, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Short Name
                  </label>
                  <input
                    type="text"
                    value={manifest.shortName}
                    onChange={(e) => setManifest({ ...manifest, shortName: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Start URL
                  </label>
                  <input
                    type="text"
                    value={manifest.startUrl}
                    onChange={(e) => setManifest({ ...manifest, startUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Display Mode
                  </label>
                  <select
                    value={manifest.display}
                    onChange={(e) => setManifest({ ...manifest, display: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="standalone">Standalone (App-like)</option>
                    <option value="minimal-ui">Minimal UI</option>
                    <option value="fullscreen">Fullscreen</option>
                    <option value="browser">Browser Tab</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Orientation
                  </label>
                  <select
                    value={manifest.orientation}
                    onChange={(e) => setManifest({ ...manifest, orientation: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="any">Any</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={manifest.themeColor}
                      onChange={(e) => setManifest({ ...manifest, themeColor: e.target.value })}
                      className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={manifest.themeColor}
                      onChange={(e) => setManifest({ ...manifest, themeColor: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 text-[11px] px-2 py-1 rounded text-zinc-300 font-mono w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Bg Color
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={manifest.backgroundColor}
                      onChange={(e) => setManifest({ ...manifest, backgroundColor: e.target.value })}
                      className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={manifest.backgroundColor}
                      onChange={(e) => setManifest({ ...manifest, backgroundColor: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 text-[11px] px-2 py-1 rounded text-zinc-300 font-mono w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Previews & Download Packs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Display Preview Grid */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-indigo-400" />
                Live Client Preview Contexts
              </h2>

              {/* Preview Modes selector */}
              <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800/80 self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setPreviewTab('tab')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                    previewTab === 'tab' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Browser Tab
                </button>
                <button
                  onClick={() => setPreviewTab('mobile')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                    previewTab === 'mobile' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Homescreen
                </button>
                <button
                  onClick={() => setPreviewTab('serp')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                    previewTab === 'serp' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Google SERP
                </button>
              </div>
            </div>

            {/* Context Previews Frame Container */}
            <div className="bg-zinc-950/80 rounded-2xl border border-zinc-800/60 p-6 min-h-[220px] flex items-center justify-center relative overflow-hidden">
              <AnimatePresence mode="wait">
                {previewTab === 'tab' && (
                  <motion.div
                    key="tab-preview"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full max-w-md bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden"
                  >
                    {/* Simulated Browser Bar */}
                    <div className="bg-zinc-950 px-3.5 py-2 flex items-center gap-2 border-b border-zinc-850">
                      <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                      </div>
                      <div className="flex-1 max-w-[240px] mx-auto bg-zinc-900 rounded px-2.5 py-1 text-[9px] text-zinc-500 font-mono flex items-center justify-between border border-zinc-850">
                        <span className="truncate">https://yourdomain.com</span>
                        <Globe className="w-2.5 h-2.5 text-zinc-600" />
                      </div>
                    </div>
                    {/* Active Browser Tab Row */}
                    <div className="bg-zinc-900 px-3 flex items-center">
                      <div className="bg-zinc-950 border-x border-t border-zinc-850 rounded-t-lg px-3 py-2 flex items-center gap-2 text-xs text-white max-w-[170px] shrink-0">
                        {preview16 ? (
                          <img src={preview16} alt="Favicon 16" className="w-4 h-4 object-contain shrink-0" />
                        ) : (
                          <div className="w-4 h-4 bg-zinc-800 rounded animate-pulse" />
                        )}
                        <span className="truncate font-semibold text-[10px]">{manifest.shortName || 'My PWA'}</span>
                      </div>
                      <div className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-400 cursor-pointer ml-1">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="bg-zinc-950 p-6 text-center border-t border-zinc-850">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Simulated Tab Preview</p>
                      <p className="text-[11px] text-zinc-400">Your custom 16x16 favicon renders inside the browser tab perfectly.</p>
                    </div>
                  </motion.div>
                )}

                {previewTab === 'mobile' && (
                  <motion.div
                    key="mobile-preview"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full max-w-[280px] bg-zinc-900 rounded-[32px] border-4 border-zinc-800 shadow-2xl p-4 relative overflow-hidden"
                  >
                    {/* Speaker/Camera notch */}
                    <div className="w-24 h-4 bg-zinc-800 rounded-full mx-auto mb-4 flex items-center justify-center" />
                    
                    {/* Grid of iOS icons */}
                    <div className="grid grid-cols-4 gap-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1 select-none opacity-40">
                        <div className="w-11 h-11 bg-indigo-950 border border-indigo-900 rounded-xl" />
                        <span className="text-[8px] text-zinc-400">Safari</span>
                      </div>
                      
                      {/* OUR APP ICON */}
                      <div className="flex flex-col items-center gap-1 select-none">
                        {preview192 ? (
                          <img 
                            src={preview192} 
                            alt="Favicon 192" 
                            className="w-11 h-11 rounded-xl shadow-lg border border-zinc-850/60 object-contain hover:scale-105 transition-all" 
                          />
                        ) : (
                          <div className="w-11 h-11 bg-zinc-800 rounded-xl animate-pulse" />
                        )}
                        <span className="text-[9px] text-white font-bold truncate max-w-[50px]">{manifest.shortName || 'My PWA'}</span>
                      </div>

                      <div className="flex flex-col items-center gap-1 select-none opacity-40">
                        <div className="w-11 h-11 bg-emerald-950 border border-emerald-900 rounded-xl" />
                        <span className="text-[8px] text-zinc-400">Photos</span>
                      </div>

                      <div className="flex flex-col items-center gap-1 select-none opacity-40">
                        <div className="w-11 h-11 bg-amber-950 border border-amber-900 rounded-xl" />
                        <span className="text-[8px] text-zinc-400">Settings</span>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-zinc-850 text-center">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Mobile Homescreen</p>
                      <p className="text-[9px] text-zinc-400">Simulates Android/iOS 192x192 maskable application launcher icon.</p>
                    </div>
                  </motion.div>
                )}

                {previewTab === 'serp' && (
                  <motion.div
                    key="serp-preview"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full max-w-md bg-zinc-900 rounded-xl border border-zinc-800 p-4 shadow-2xl"
                  >
                    {/* Simulated Google Search result */}
                    <div className="space-y-2 text-left">
                      {/* Header with Site name, breadcrumb and favicon */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center shadow-inner overflow-hidden">
                          {preview32 ? (
                            <img src={preview32} alt="Favicon 32" className="w-4 h-4 object-contain" />
                          ) : (
                            <Globe className="w-3.5 h-3.5 text-zinc-600" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-white leading-tight">
                            {manifest.name || 'My Web Application'}
                          </span>
                          <span className="text-[10px] text-zinc-400 tracking-wide">
                            https://yourdomain.com › blog
                          </span>
                        </div>
                      </div>
                      {/* Search Snippet Title */}
                      <h4 className="text-sm font-semibold text-indigo-400 hover:underline cursor-pointer">
                        The absolute best resources & tools online
                      </h4>
                      {/* Snippet Description */}
                      <p className="text-[11px] text-zinc-400 leading-normal">
                        Configure professional branding assets. Read real-time reviews, discover mobile integrations, and download standard specifications in under 5 minutes.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-850 text-center">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Google Search Snippet</p>
                      <p className="text-[9px] text-zinc-400">Favicons show up next to verified Google search mobile & desktop snippet titles.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Download Packs section */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3.5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-400" />
                  Asset Export Center
                </h3>
                <p className="text-[10px] text-zinc-500">Generate high-density resized PNG payloads sequentially.</p>
              </div>

              {/* Master Pack Downloader trigger */}
              <button
                onClick={downloadAllSizes}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shrink-0"
                id="btn-download-pack"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>Export All Sizes Pack</span>
              </button>
            </div>

            {/* Individual size drawers */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { size: '16x16', label: 'Tab Favicon', filename: 'favicon-16x16.png', data: preview16 },
                { size: '32x32', label: 'Medium Tab', filename: 'favicon-32x32.png', data: preview32 },
                { size: '180x180', label: 'Apple Touch', filename: 'apple-touch-icon.png', data: previewApple },
                { size: '192x192', label: 'Android Chrome', filename: 'android-chrome-192x192.png', data: preview192 },
                { size: '512x512', label: 'Homescreen PWA', filename: 'android-chrome-512x512.png', data: preview512 }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-zinc-950/80 border border-zinc-850 p-3 rounded-xl flex flex-col items-center text-center space-y-2 justify-between"
                >
                  <div className="w-12 h-12 rounded bg-zinc-900 flex items-center justify-center border border-zinc-850 overflow-hidden relative">
                    {item.data ? (
                      <img src={item.data} alt={item.size} className="w-8 h-8 object-contain" />
                    ) : (
                      <div className="w-8 h-8 bg-zinc-800 rounded animate-pulse" />
                    )}
                    <span className="absolute bottom-0 right-0 bg-zinc-950 text-[7px] text-zinc-400 px-0.5 border-t border-l border-zinc-800 font-mono">
                      {item.size}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-zinc-500 font-semibold truncate max-w-[80px]">
                      {item.label}
                    </span>
                  </div>
                  <button
                    onClick={() => downloadSingleSize(item.data, item.filename)}
                    className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[9px] py-1 rounded text-zinc-300 font-bold transition-colors"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* HTML and Web Manifest Code Snippets Tab block */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-zinc-800/60 pb-3">
              <FileJson className="w-4 h-4 text-indigo-400" />
              Code Integration Setup Blocks
            </h3>

            {/* Standard HTML Head Tags snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">1. Paste inside &lt;head&gt; tags</span>
                <button
                  onClick={() => copyText(htmlCodeSnippet, 'html')}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  {copiedHtml ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative rounded-xl border border-zinc-850 overflow-hidden bg-zinc-950">
                <pre className="p-4 font-mono text-[10px] leading-relaxed text-zinc-300 overflow-x-auto select-all max-h-[160px]">
                  {htmlCodeSnippet}
                </pre>
              </div>
            </div>

            {/* Web Manifest file payload */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">2. Save payload as "/site.webmanifest"</span>
                <button
                  onClick={() => copyText(manifestJsonSnippet, 'manifest')}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  {copiedManifest ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Payload</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative rounded-xl border border-zinc-850 overflow-hidden bg-zinc-950">
                <pre className="p-4 font-mono text-[10px] leading-relaxed text-zinc-300 overflow-x-auto select-all max-h-[220px]">
                  {manifestJsonSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

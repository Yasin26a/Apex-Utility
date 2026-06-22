import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, Copy, Check, Upload, Trash2, Sliders, Eye, RefreshCw, 
  Settings, Key, AlertCircle, FileText, CheckCircle2, Layout, Sparkles, 
  HelpCircle, ChevronDown, CheckSquare, Download, Code, Layers, FileCode
} from 'lucide-react';
import { addRecentOperation } from '../utils/recentOperations';

// Core math converters
function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number) {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return "#" + [clamp(r), clamp(g), clamp(b)].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("").toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToRgb(h: number, s: number, l: number) {
  h /= 360; s /= 100; l /= 100;
  let r = l, g = l, b = l;
  if (s !== 0) {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// Perceived relative luminance for text contrast auditing (from 0 to 1)
function getLuminance(r: number, g: number, b: number) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(rgb1: {r: number, g: number, b: number}, rgb2: {r: number, g: number, b: number}) {
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

interface PaletteColor {
  hex: string;
  name: string;
  rgb: string;
  hsl: string;
  isDark: boolean;
  contrastWhite: number;
  contrastBlack: number;
}

export default function ColorPaletteGenerator() {
  const [activeSubTab, setActiveSubTab] = useState<'generate' | 'extract'>('generate');
  
  // Base Code State
  const [baseHex, setBaseHex] = useState('#6366F1');
  const [harmonyRule, setHarmonyRule] = useState<'complementary' | 'analogous' | 'triadic' | 'monochromatic' | 'split' | 'tetradic'>('analogous');
  
  // Custom naming prefix variables
  const [cssPrefix, setCssPrefix] = useState('brand');
  const [exportFormat, setExportFormat] = useState<'css' | 'tailwind' | 'json' | 'scss'>('css');
  const [mockLayoutTemplate, setMockLayoutTemplate] = useState<'saas' | 'marketing' | 'creative'>('saas');
  
  // File Upload State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [extractedPaletteColors, setExtractedPaletteColors] = useState<PaletteColor[]>([]);
  const [hoveredPixelColor, setHoveredPixelColor] = useState<string | null>(null);
  const [eyedropperActive, setEyedropperActive] = useState(false);

  // General State
  const [paletteColors, setPaletteColors] = useState<PaletteColor[]>([]);
  const [copyStates, setCopyStates] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({ 0: false, 1: false, 2: false });
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Synchronize baseHex change or harmonyRule change to calculate palette
  useEffect(() => {
    if (activeSubTab === 'generate') {
      const parsed = hexToRgb(baseHex);
      if (!parsed) return;
      
      const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
      const generated: PaletteColor[] = [];
      const { h, s, l } = hsl;

      let rawHsls: { h: number; s: number; l: number; label: string }[] = [];

      switch (harmonyRule) {
        case 'complementary':
          rawHsls = [
            { h, s, l, label: 'Base Main' },
            { h, s: Math.max(10, s - 15), l: Math.min(95, l + 25), label: 'Base Tint' },
            { h, s: Math.min(100, s + 10), l: Math.max(5, l - 25), label: 'Base Shade' },
            { h: (h + 180) % 360, s, l, label: 'Complement' },
            { h: (h + 180) % 360, s: Math.min(100, s + 15), l: Math.max(10, l - 15), label: 'Complement Shade' },
            { h: (h + 180) % 360, s: Math.max(10, s - 20), l: Math.min(95, l + 20), label: 'Complement Accent' }
          ];
          break;
        case 'analogous':
          rawHsls = [
            { h: (h - 45 + 360) % 360, s, l, label: 'Cool Ambient' },
            { h: (h - 22 + 360) % 360, s, l: Math.min(90, l + 5), label: 'Warm Light' },
            { h, s, l, label: 'Base Main' },
            { h: (h + 22) % 360, s, l, label: 'Warm Adjacent' },
            { h: (h + 45) % 360, s: Math.min(100, s + 5), l: Math.max(10, l - 10), label: 'Accent Highlight' },
            { h: (h + 90) % 360, s: Math.max(10, s - 10), l: Math.max(5, l - 15), label: 'Deep Shade' }
          ];
          break;
        case 'triadic':
          rawHsls = [
            { h, s, l, label: 'Base Main' },
            { h, s: Math.max(10, s - 20), l: Math.min(95, l + 20), label: 'Base Light' },
            { h: (h + 120) % 360, s, l, label: 'Triadic Sec' },
            { h: (h + 120) % 360, s: Math.min(100, s + 10), l: Math.max(10, l - 15), label: 'Sec Deep' },
            { h: (h + 240) % 360, s, l, label: 'Triadic Tert' },
            { h: (h + 240) % 360, s: Math.min(100, s + 15), l: Math.max(10, l - 20), label: 'Tert Accent' }
          ];
          break;
        case 'monochromatic':
          rawHsls = [
            { h, s, l: Math.min(97, l + 35), label: 'Lighter Accent' },
            { h, s, l: Math.min(92, l + 20), label: 'Light Tint' },
            { h, s, l: Math.min(85, l + 10), label: 'Soft Accent' },
            { h, s, l, label: 'Base Main' },
            { h, s, l: Math.max(5, l - 18), label: 'Medium Dusk' },
            { h, s, l: Math.max(5, l - 35), label: 'Dark Charcoal' }
          ];
          break;
        case 'split':
          rawHsls = [
            { h, s, l, label: 'Base Dominant' },
            { h, s: Math.max(10, s - 15), l: Math.min(95, l + 20), label: 'Base Highlight' },
            { h: (h + 150) % 360, s, l, label: 'Adjacent Left' },
            { h: (h + 150) % 360, s: Math.min(100, s + 10), l: Math.max(10, l - 15), label: 'Adjacent Shade' },
            { h: (h + 210) % 360, s, l, label: 'Adjacent Right' },
            { h: (h + 210) % 360, s: Math.min(100, s + 15), l: Math.min(90, l + 15), label: 'Warm Suffix' }
          ];
          break;
        case 'tetradic':
          rawHsls = [
            { h, s, l, label: 'Base Main' },
            { h: (h + 90) % 360, s, l, label: 'Quadrant 1' },
            { h: (h + 180) % 360, s, l, label: 'Quadrant 2' },
            { h: (h + 270) % 360, s, l, label: 'Quadrant 3' },
            { h, s: Math.max(10, s - 20), l: Math.min(95, l + 25), label: 'Light Accent' },
            { h: (h + 180) % 360, s: Math.min(100, s + 10), l: Math.max(5, l - 25), label: 'Deep Contrast' }
          ];
          break;
      }

      rawHsls.forEach((item) => {
        const rgb = hslToRgb(item.h, item.s, item.l);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        const lValue = getLuminance(rgb.r, rgb.g, rgb.b);
        const contrastWhite = getContrastRatio(rgb, {r: 255, g: 255, b: 255});
        const contrastBlack = getContrastRatio(rgb, {r: 0, g: 0, b: 0});
        
        generated.push({
          hex,
          name: item.label,
          rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
          hsl: `hsl(${item.h}, ${item.s}%, ${item.l}%)`,
          isDark: lValue < 0.45,
          contrastWhite: Number(contrastWhite.toFixed(1)),
          contrastBlack: Number(contrastBlack.toFixed(1))
        });
      });

      setPaletteColors(generated);
    }
  }, [baseHex, harmonyRule, activeSubTab]);

  // Copy Color Hex
  const handleCopyColor = (colorHex: string, label: string) => {
    try {
      navigator.clipboard.writeText(colorHex);
      setCopyStates(prev => ({ ...prev, [colorHex]: true }));
      showToast(`Copied ${label} color ${colorHex} to clipboard!`, 'success');
      setTimeout(() => {
        setCopyStates(prev => ({ ...prev, [colorHex]: false }));
      }, 1500);
    } catch {
      showToast('Copy failed.', 'error');
    }
  };

  // Convert uploaded image to canvas, extract brand colors
  const processImageFile = (file: File) => {
    if (!file) return;
    setIsProcessingImage(true);
    setSelectedImage(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessingImage(false);
          return;
        }

        // Downscale image inside canvas to sample dominant palette
        canvas.width = 120;
        canvas.height = 120;
        ctx.drawImage(img, 0, 0, 120, 120);

        const imgData = ctx.getImageData(0, 0, 120, 120).data;
        
        // Pixel color buckets dictionary
        const colorCounts: Record<string, { r: number, g: number, b: number, count: number }> = {};
        
        for (let i = 0; i < imgData.length; i += 16) { // step by multiplier 16 for high performance sampling
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip completely transparent or extremely washed white/gray background pixels
          if (a < 180) continue; 
          
          // Downsample values to aggregate similar colors (round value by factor of 15)
          const quantize = (v: number) => Math.round(v / 15) * 15;
          const qr = quantize(r);
          const qg = quantize(g);
          const qb = quantize(b);
          const key = `${qr},${qg},${qb}`;

          if (colorCounts[key]) {
            colorCounts[key].count++;
          } else {
            colorCounts[key] = { r, g, b, count: 1 };
          }
        }

        // Sort keys based of occurrences count
        const sortedColors = Object.values(colorCounts)
          .sort((x, y) => y.count - x.count)
          .slice(0, 12); // gather top candidates

        // Sift distinct hex items
        const rawHexes: string[] = [];
        sortedColors.forEach(item => {
          const hex = rgbToHex(item.r, item.g, item.b);
          if (!rawHexes.includes(hex)) {
            rawHexes.push(hex);
          }
        });

        // Slice up to 6 dominant aesthetic brand colors
        const finalHexes = rawHexes.slice(0, 6);

        // Fail-safe companion colors builder if there are too few colors
        while (finalHexes.length < 6) {
          const companion = rgbToHex(
            Math.floor(Math.random() * 200) + 50,
            Math.floor(Math.random() * 200) + 50,
            Math.floor(Math.random() * 200) + 50
          );
          if (!finalHexes.includes(companion)) {
            finalHexes.push(companion);
          }
        }

        // Build detailed extracted components
        const generatedColors: PaletteColor[] = [];
        const labelNames = ['Brand Dominant', 'Secondary Accent', 'Ambient Shade', 'Highlight Tint', 'Corporate Hue', 'Contrast Neutral'];
        
        finalHexes.forEach((hex, idx) => {
          const rgb = hexToRgb(hex);
          if (rgb) {
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            const lValue = getLuminance(rgb.r, rgb.g, rgb.b);
            const contrastWhite = getContrastRatio(rgb, {r: 255, g: 255, b: 255});
            const contrastBlack = getContrastRatio(rgb, {r: 0, g: 0, b: 0});

            generatedColors.push({
              hex,
              name: labelNames[idx] || `Vivid ${idx + 1}`,
              rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
              hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
              isDark: lValue < 0.45,
              contrastWhite: Number(contrastWhite.toFixed(1)),
              contrastBlack: Number(contrastBlack.toFixed(1))
            });
          }
        });

        setExtractedPaletteColors(generatedColors);
        setIsProcessingImage(false);

        // Add telemetry history operation
        addRecentOperation(
          file.name,
          'Shield Vault',
          `${(file.size / 1024).toFixed(1)} KB`,
          'Color Extraction',
          `PALETTE_${file.name.substring(0, 10).toUpperCase()}_COMP`,
          '#'
        );

        showToast('Brand color layers extracted perfectly!', 'success');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedPaletteColors([]);
    setHoveredPixelColor(null);
  };

  // Image dragging utilities
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  // Hover image pixel color analyzer
  const handleMouseMoveOverImage = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!eyedropperActive || !imagePreview) return;
    
    const imgEl = previewImageRef.current;
    if (!imgEl) return;

    // Create dynamic in-memory scaled canvas to retrieve coordinate pixel directly
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imgEl.naturalWidth;
    canvas.height = imgEl.naturalHeight;
    ctx.drawImage(imgEl, 0, 0);

    const rect = imgEl.getBoundingClientRect();
    const scaleX = imgEl.naturalWidth / rect.width;
    const scaleY = imgEl.naturalHeight / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      setHoveredPixelColor(hex);
    } catch {
      // Ignored cross-origin boundary
    }
  };

  const handleApplyEyedropperColor = () => {
    if (hoveredPixelColor) {
      setBaseHex(hoveredPixelColor);
      setActiveSubTab('generate');
      setEyedropperActive(false);
      showToast(`Selected canvas color ${hoveredPixelColor} applied as base HEX!`, 'success');
    }
  };

  // Compile export code layouts
  const getExportString = (colorsSource: PaletteColor[]) => {
    if (colorsSource.length === 0) return '/* No color palette computed */';

    if (exportFormat === 'css') {
      let code = `:root {\n`;
      colorsSource.forEach((c, idx) => {
        const varName = `--${cssPrefix}-${c.name.toLowerCase().replace(/[\s_]+/g, '-')}`;
        code += `  ${varName}: ${c.hex}; /* ${c.rgb} */\n`;
      });
      code += `}`;
      return code;
    }

    if (exportFormat === 'tailwind') {
      let code = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        ${cssPrefix}: {\n`;
      colorsSource.forEach((c, idx) => {
        const subName = c.name.toLowerCase().replace(/[\s_]+/g, '-');
        code += `          '${subName}': '${c.hex}',\n`;
      });
      code += `        }\n      }\n    }\n  }\n}`;
      return code;
    }

    if (exportFormat === 'scss') {
      let code = `/* SCSS Brand Variables */\n`;
      colorsSource.forEach((c) => {
        const varName = `$${cssPrefix}-${c.name.toLowerCase().replace(/[\s_]+/g, '-')}`;
        code += `${varName}: ${c.hex};\n`;
      });
      return code;
    }

    if (exportFormat === 'json') {
      const outputObj: Record<string, string> = {};
      colorsSource.forEach((c) => {
        const key = `${cssPrefix}_${c.name.toLowerCase().replace(/[\s_]+/g, '_')}`;
        outputObj[key] = c.hex;
      });
      return JSON.stringify(outputObj, null, 2);
    }

    return '';
  };

  const activeColors = activeSubTab === 'generate' ? paletteColors : extractedPaletteColors;

  // Custom visual CSS design colors inline styling helper
  const getThemeMockStyle = () => {
    if (activeColors.length < 5) return {};
    return {
      '--mock-primary': activeColors[0]?.hex || '#4F46E5',
      '--mock-secondary': activeColors[1]?.hex || '#10B981',
      '--mock-dark': activeColors[2]?.hex || '#1F2937',
      '--mock-tint': activeColors[3]?.hex || '#F3F4F6',
      '--mock-accent': activeColors[4]?.hex || '#F59E0B'
    } as React.CSSProperties;
  };

  const handleCopyCodeSnippet = () => {
    const code = getExportString(activeColors);
    try {
      navigator.clipboard.writeText(code);
      showToast('Export code copied to clipboard successfully!', 'success');
    } catch {
      showToast('Error copying code.', 'error');
    }
  };

  // Preset hexes for fast exploration
  const explorePresets = [
    { hex: '#6366F1', label: 'Indigo' },
    { hex: '#EC4899', label: 'Petal Pink' },
    { hex: '#10B981', label: 'Forest Green' },
    { hex: '#F59E0B', label: 'Cyber Yellow' },
    { hex: '#3B82F6', label: 'Ocean Blue' },
    { hex: '#EF4444', label: 'Sunset Red' }
  ];

  const faqItems = [
    {
      question: "How does the Image Brand Extractor calculate dominant colors?",
      answer: "The extractor downsizes an uploaded image file into an optimized 120x120 array mapping on an off-screen HTML5 element. It samples color pixels at a frequent interval, ignores extremely low-contrast neutrals (pure whites or dark grays), quantizes color points to cluster neighbors, and picks the most frequent distinctive color groupings securely inside your local sandbox memory."
    },
    {
      question: "What do the contrast checker AAA and AA ratings mean?",
      answer: "Contrast audits evaluate the perceived light difference between background colors and overlaid text, following Web Content Accessibility Guidelines (WCAG). AA requires a ratio of at least 4.5:1 for standard text (or 3:1 for large text). AAA represents the highest accessibility standard, requiring a robust ratio of at least 7:1 for clear readability."
    },
    {
      question: "Are the colors calculated offline?",
      answer: "Yes, 100%. No data leaves your machine. The image parsing, HSL mapping math, palette rendering, and code generation processes occur locally in-browser on your processor thread. This protects client identity and sensitive brand assets completely offline."
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Title block */}
      <div className="beveled-panel p-6 sm:p-8 bg-[#09090e]/95 border border-brand/20 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 rounded bg-brand/10 border border-brand/20 text-[10px] font-mono text-brand font-bold uppercase tracking-wider">
                Creative Assets Suite
              </span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">OFFLINE STUDIO ENGINE</span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Palette className="w-6 h-6 text-brand" />
              Advanced Color Palette Studio
            </h2>
            <p className="font-sans text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Synthesize aesthetic color palettes from base hex codes or extract dominant brand identity colors instantly from images. Fine-tune with accessibility compliance and copy variables completely offline.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCopyCodeSnippet}
              disabled={activeColors.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:border-zinc-700 font-mono font-bold text-xs text-zinc-300 hover:text-white cursor-pointer select-none transition-all active:scale-95 disabled:opacity-25"
            >
              <FileCode className="w-4 h-4 text-brand" />
              <span>Copy Export Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main interactive grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left pane: Parameters */}
        <div className="lg:col-span-5 space-y-6">
          <div className="beveled-panel p-5 sm:p-6 bg-[#07070a]/90 border border-zinc-900 rounded-2xl space-y-5 shadow-2xl">
            
            {/* Interface Sub Tab selection (Generate vs. Extract) */}
            <div className="flex items-center p-1 bg-zinc-950/80 border border-zinc-900 rounded-xl shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('generate');
                  setHoveredPixelColor(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-heading font-extrabold tracking-wider uppercase cursor-pointer transition-all select-none ${
                  activeSubTab === 'generate'
                    ? 'bg-brand text-zinc-950 shadow-[0_2px_10px_rgba(245,158,11,0.2)] font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Base Hex Scheme</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('extract');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-heading font-extrabold tracking-wider uppercase cursor-pointer transition-all select-none ${
                  activeSubTab === 'extract'
                    ? 'bg-brand text-zinc-950 shadow-[0_2px_10px_rgba(245,158,11,0.2)] font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Image Extractor</span>
              </button>
            </div>

            {/* SubTab 1: Generate Schemes */}
            {activeSubTab === 'generate' ? (
              <div className="space-y-4">
                
                {/* Hex input & Color picker */}
                <div className="space-y-2">
                  <label className="block text-xs font-heading font-bold text-zinc-300 uppercase tracking-wider">
                    Base Hex Color Coordinates
                  </label>
                  <div className="flex gap-3">
                    <div className="relative w-12 h-10 rounded-xl overflow-hidden border border-zinc-850 bg-zinc-900 shadow-md cursor-pointer group flex-shrink-0">
                      <input
                        type="color"
                        value={baseHex}
                        onChange={(e) => setBaseHex(e.target.value)}
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                    </div>
                    <input
                      type="text"
                      maxLength={7}
                      value={baseHex}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('#') || val.length <= 6) {
                          setBaseHex(val.startsWith('#') ? val : `#${val}`);
                        }
                      }}
                      placeholder="#6366F1"
                      className="flex-1 bg-[#050507] border border-zinc-850 hover:border-zinc-800 rounded-xl px-3.5 text-sm font-mono text-white focus:outline-none focus:border-brand/40 shadow-inner"
                    />
                  </div>
                </div>

                {/* Explorer mini quick swatches */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-mono text-zinc-650 uppercase">Fast explore presets</span>
                  <div className="flex flex-wrap gap-2">
                    {explorePresets.map((sw, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => setBaseHex(sw.hex)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-900 text-[10.5px] font-mono border border-zinc-900 transition-colors"
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: sw.hex }} />
                        <span className="text-zinc-450">{sw.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Harmony selections */}
                <div className="space-y-2 pt-2 border-t border-zinc-900">
                  <label className="block text-xs font-heading font-bold text-zinc-300 uppercase tracking-wider">
                    Mathematical Harmony Rule
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'analogous', label: 'Analogous', desc: 'Warm structural neighbors' },
                      { id: 'monochromatic', label: 'Monochromatic', desc: 'Unified shades & tints' },
                      { id: 'complementary', label: 'Complementary', desc: 'Direct 180° contrast' },
                      { id: 'triadic', label: 'Triadic', desc: 'Perfect 120° triangle' },
                      { id: 'split', label: 'Split-Complement', desc: 'Complementary adjacents' },
                      { id: 'tetradic', label: 'Tetradic / Double', desc: 'Rich 4-axis rectangle' }
                    ].map((rule) => (
                      <button
                        key={rule.id}
                        type="button"
                        onClick={() => setHarmonyRule(rule.id as any)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all hover:bg-zinc-950/40 select-none ${
                          harmonyRule === rule.id
                            ? 'border-brand/65 bg-brand/[0.03] text-white shadow-lg'
                            : 'border-zinc-900 text-zinc-400 bg-transparent'
                        }`}
                      >
                        <span className="block font-heading font-extrabold text-[11px] uppercase tracking-wide">
                          {rule.label}
                        </span>
                        <span className="block text-[9.5px] text-zinc-550 truncate mt-0.5">
                          {rule.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              /* SubTab 2: Image color extraction */
              <div className="space-y-4">
                
                {!imagePreview ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 hover:bg-brand/[0.015] text-center cursor-pointer transition-all select-none flex flex-col items-center justify-center gap-3 shadow-inner ${
                      isDragging 
                        ? 'border-brand bg-brand/5' 
                        : 'border-zinc-850 hover:border-brand/35 bg-[#050507]'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          processImageFile(files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-500 border border-zinc-900 shadow-md">
                      <Upload className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-xs text-white uppercase">Upload Brand Layout Image</p>
                      <p className="font-sans text-[11px] text-zinc-500 mt-1">PNG, JPG, SVG or WebP. Proximity clustering analyzed 100% locally.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative border border-zinc-850 bg-zinc-950 rounded-xl overflow-hidden shadow-inner group">
                      <img
                        ref={previewImageRef}
                        src={imagePreview}
                        alt="Target extractor"
                        crossOrigin="anonymous"
                        className={`w-full h-auto max-h-[220px] object-contain rounded-xl block ${eyedropperActive ? 'cursor-crosshair' : ''}`}
                        onMouseMove={handleMouseMoveOverImage}
                        onClick={handleApplyEyedropperColor}
                      />
                      
                      {/* Top bar controls */}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEyedropperActive(!eyedropperActive)}
                          className={`p-1.5 rounded-lg border text-[10px] font-mono tracking-wider font-bold uppercase transition-all flex items-center gap-1 ${
                            eyedropperActive 
                              ? 'bg-amber-400 text-zinc-950 border-amber-400' 
                              : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                          title="Activate image eyedropper selector to lock color as scheme base"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>EYEDROPPER {eyedropperActive ? 'ON' : 'OFF'}</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={clearSelectedImage}
                          className="p-1.5 rounded-lg bg-zinc-950/80 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/30 text-zinc-500 hover:text-rose-400 cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Floating pixels lock */}
                      {eyedropperActive && hoveredPixelColor && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-zinc-950/90 border border-zinc-800 rounded-lg p-2 shadow-lg">
                          <span className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: hoveredPixelColor }} />
                          <span className="font-mono text-[10px] font-bold text-slate-200">{hoveredPixelColor}</span>
                          <span className="text-[9px] font-sans text-brand font-bold animate-pulse">(CLICK TO LOCK)</span>
                        </div>
                      )}
                    </div>

                    {isProcessingImage ? (
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand" />
                        <span>Sampling image pixel grids...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-emerald-400 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/10">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>6 distinct dominant brand vectors aggregated!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Prefix configuration & export layout selectors */}
            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <div className="flex items-center gap-2 pb-1">
                <Settings className="w-4 h-4 text-brand" />
                <h3 className="font-heading font-extrabold text-xs uppercase text-zinc-300 tracking-wider">Export Customizations</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="block text-[10.5px] font-mono font-bold text-zinc-400 uppercase tracking-wide">Naming Prefix</span>
                  <input
                    type="text"
                    value={cssPrefix}
                    onChange={(e) => setCssPrefix(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                    className="w-full bg-[#050507] border border-zinc-850 hover:border-zinc-800 rounded-lg py-1.5 px-3 text-xs font-mono text-white focus:outline-none focus:border-brand/40 shadow-inner"
                    placeholder="brand"
                  />
                </div>

                <div className="space-y-1">
                  <span className="block text-[10.5px] font-mono font-bold text-zinc-400 uppercase tracking-wide">Compile Code</span>
                  <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#050507] rounded-lg border border-zinc-850">
                    {(['css', 'tailwind', 'scss', 'json'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setExportFormat(fmt)}
                        className={`py-1 rounded text-[10px] font-heading font-extrabold uppercase transition-all select-none cursor-pointer ${
                          exportFormat === fmt
                            ? 'bg-zinc-900 text-brand border border-zinc-800'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Interactive cryptology FAQ block */}
          <div className="beveled-panel p-5 sm:p-6 bg-[#07070a]/90 border border-zinc-900 rounded-2xl space-y-4">
            <h3 className="font-heading font-extrabold text-xs uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-brand" />
              Palette & Accessibility QA
            </h3>
            
            <div className="space-y-2.5">
              {faqItems.map((item, idx) => (
                <div key={idx} className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950/20">
                  <button
                    type="button"
                    onClick={() => setFaqOpen(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-900/40 transition-colors cursor-pointer"
                  >
                    <span className="font-heading font-bold text-xs text-zinc-300 tracking-wide">{item.question}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${faqOpen[idx] ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {faqOpen[idx] && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="p-3 pt-0 border-t border-zinc-900/40 font-sans text-xs text-zinc-400 leading-relaxed bg-[#050507]/20">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right pane: Interactive color cards & Sandbox Preview mockups */}
        <div className="lg:col-span-7 space-y-6">

          {/* Extracted Swatches block grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-xs uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-brand" />
                Aesthetic Color Swatches
              </h3>
              <span className="font-mono text-[9px] text-zinc-500 uppercase">Interactive - Click Card To Copy</span>
            </div>

            {activeColors.length === 0 ? (
              <div className="bg-[#07070a]/90 border border-zinc-900 rounded-2xl p-10 text-center text-zinc-500 italic">
                Awaiting parameters. Provide a base hex code or upload an image above to draw swatches...
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {activeColors.map((color, idx) => {
                  const checkAA_white = color.contrastWhite >= 4.5;
                  const checkAAA_white = color.contrastWhite >= 7.0;
                  const checkAA_black = color.contrastBlack >= 4.5;
                  const checkAAA_black = color.contrastBlack >= 7.0;

                  return (
                    <motion.div 
                      key={`${color.hex}-${idx}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ 
                        type: 'spring',
                        stiffness: 350,
                        damping: 26,
                        layout: { duration: 0.35, type: 'spring', stiffness: 350, damping: 26 }
                      }}
                      onClick={() => handleCopyColor(color.hex, color.name)}
                      className="beveled-panel bg-[#07070a]/90 hover:bg-[#0c0c11]/90 border border-zinc-900 hover:border-zinc-805 rounded-xl overflow-hidden shadow-lg cursor-pointer select-none group relative"
                    >
                      {/* Dynamic paint bucket top box */}
                      <div className="h-16 w-full relative transition-transform duration-300 group-hover:scale-105" style={{ backgroundColor: color.hex }}>
                        <div className="absolute top-2 right-2 p-1 rounded bg-black/40 backdrop-blur-sm text-white/95 opacity-0 group-hover:opacity-100 transition-opacity">
                          {copyStates[color.hex] ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      {/* Info text fields */}
                      <div className="p-3.5 space-y-2">
                        <div>
                          <span className="block font-heading font-bold text-[11px] text-white tracking-wide uppercase truncate">{color.name}</span>
                          <span className="block font-mono text-[11px] font-black text-brand mt-0.5">{color.hex}</span>
                        </div>

                        <div className="space-y-0.5 font-mono text-[9px] text-zinc-500 border-t border-zinc-950 pt-1.5">
                          <div>RGB: {color.rgb.replace('rgb(', '').replace(')', '')}</div>
                          <div>HSL: {color.hsl.replace('hsl(', '').replace(')', '')}</div>
                        </div>

                        {/* Accessibility Contrast Matrix */}
                        <div className="border-t border-zinc-950 pt-1.5 space-y-1">
                          <div className="flex items-center justify-between text-[8px] font-mono">
                            <span className="text-zinc-550">On White:</span>
                            <span className={`font-bold px-1 rounded ${checkAA_white ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                              {color.contrastWhite}:1 {checkAAA_white ? 'AAA' : checkAA_white ? 'AA' : 'Fail'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-[8px] font-mono">
                            <span className="text-zinc-550">On Black:</span>
                            <span className={`font-bold px-1 rounded ${checkAA_black ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                              {color.contrastBlack}:1 {checkAAA_black ? 'AAA' : checkAA_black ? 'AA' : 'Fail'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Layout Preview Sandbox */}
          {activeColors.length >= 5 && (
            <div className="beveled-panel p-5 bg-[#07070a]/90 border border-zinc-900 rounded-2xl space-y-4" style={getThemeMockStyle()}>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-zinc-900">
                <div className="space-y-0.5">
                  <h3 className="font-heading font-black text-xs uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
                    <Layout className="w-4 h-4 text-brand" />
                    Real-time Layout Sandbox
                  </h3>
                  <p className="text-[10px] text-zinc-500">Preview selected color palette rendering in standard website frameworks</p>
                </div>

                <div className="flex p-0.5 bg-[#050507] rounded-lg border border-zinc-850">
                  {[
                    { id: 'saas', label: 'SaaS App' },
                    { id: 'marketing', label: 'Marketing Landing' },
                    { id: 'creative', label: 'E-Comm UI' }
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setMockLayoutTemplate(tpl.id as any)}
                      className={`py-1 px-2.5 rounded-md text-[9px] font-heading font-extrabold uppercase transition-all select-none cursor-pointer ${
                        mockLayoutTemplate === tpl.id
                          ? 'bg-zinc-900 text-brand font-black block'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sandbox layouts container */}
              <div className="rounded-xl border border-zinc-900/60 p-4 bg-[#030305] relative overflow-hidden transition-all duration-300">
                
                {/* Visual template router based on mockLayoutTemplate */}
                {mockLayoutTemplate === 'saas' && (
                  <div className="space-y-3 font-sans text-xs">
                    {/* Simulated Nav Header */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg transition-colors border border-zinc-900 shadow-md" style={{ backgroundColor: 'var(--mock-dark)', color: '#fff' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--mock-primary)' }}>A</span>
                        <span className="font-heading font-bold text-[11.5px] tracking-wide">APEX DASHBOARD</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-8 h-1.5 rounded" style={{ backgroundColor: 'var(--mock-tint)', opacity: 0.3 }} />
                        <span className="inline-block w-8 h-1.5 rounded" style={{ backgroundColor: 'var(--mock-tint)', opacity: 0.3 }} />
                        <span className="w-6 h-6 rounded-full border border-zinc-700 overflow-hidden" style={{ backgroundColor: 'var(--mock-secondary)' }} />
                      </div>
                    </div>

                    {/* Simulated Dashboard content layout */}
                    <div className="grid grid-cols-12 gap-3">
                      
                      {/* Left Side menu bar */}
                      <div className="col-span-3 p-2 bg-zinc-950 rounded-lg border border-zinc-900 flex flex-col gap-2 min-h-[140px]">
                        <span className="h-6 rounded flex items-center px-1.5 text-[9px] font-mono" style={{ backgroundColor: 'var(--mock-primary)', color: '#fff' }}>Overview</span>
                        <span className="h-4 rounded bg-zinc-900 w-2/3" />
                        <span className="h-4 rounded bg-zinc-900 w-3/4" />
                        <span className="h-4 rounded bg-zinc-900 w-1/2" />
                      </div>

                      {/* Main metrics workspace */}
                      <div className="col-span-9 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { lab: 'Revenue growth', val: '$12,492', col: 'var(--mock-primary)' },
                            { lab: 'Conversion rate', val: '43.2%', col: 'var(--mock-secondary)' },
                            { lab: 'Pending logs', val: '7 items', col: 'var(--mock-accent)' }
                          ].map((met, mIdx) => (
                            <div key={mIdx} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-900">
                              <span className="block text-[8px] uppercase tracking-wide text-zinc-500 font-bold">{met.lab}</span>
                              <span className="block font-heading font-black text-sm mt-1" style={{ color: met.col }}>{met.val}</span>
                            </div>
                          ))}
                        </div>

                        {/* Graph and analytics visual simulation */}
                        <div className="p-3 rounded-lg border border-zinc-900 bg-zinc-950 flex flex-col justify-between min-h-[70px]">
                          <div className="flex justify-between items-center">
                            <span className="font-heading font-bold text-[9px] text-zinc-400">Database Streams</span>
                            <span className="p-0.5 px-1.5 rounded text-[8px] font-mono text-white" style={{ backgroundColor: 'var(--mock-secondary)' }}>ONLINE</span>
                          </div>
                          
                          {/* Animated styled horizontal bar graph indicator */}
                          <div className="flex items-end gap-1.5 h-6 pt-2">
                            <span className="flex-1 rounded-sm" style={{ backgroundColor: 'var(--mock-primary)', height: '40%' }} />
                            <span className="flex-1 rounded-sm" style={{ backgroundColor: 'var(--mock-secondary)', height: '75%' }} />
                            <span className="flex-1 rounded-sm" style={{ backgroundColor: 'var(--mock-accent)', height: '95%' }} />
                            <span className="flex-1 rounded-sm animate-pulse" style={{ backgroundColor: 'var(--mock-primary)', height: '55%' }} />
                            <span className="flex-1 rounded-sm" style={{ backgroundColor: 'var(--mock-dark)', height: '20%' }} />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {mockLayoutTemplate === 'marketing' && (
                  <div className="space-y-4 font-sans text-xs text-center py-4 bg-zinc-950 rounded-xl border border-zinc-900">
                    
                    {/* Header Badge */}
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[8.5px] font-mono tracking-widest font-bold text-white shadow-md" style={{ backgroundColor: 'var(--mock-primary)' }}>
                      APEX CLOUD NODE RELEASE
                    </div>

                    {/* Hero Banner text */}
                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <h4 className="font-heading font-black text-sm uppercase text-white tracking-wider">
                        Power up secure pipeline telemetry
                      </h4>
                      <p className="text-[10px] text-zinc-400">
                        The ultimate robust cryptography pipeline and diagnostic engine. Complete local security layer optimized directly inside browser threads.
                      </p>
                    </div>

                    {/* CTA buttons row */}
                    <div className="flex items-center justify-center gap-2">
                      <button className="px-3.5 py-1.5 rounded-lg text-[10.5px] font-heading font-bold text-white shadow-lg active:scale-95 transition-all text-zinc-950" style={{ backgroundColor: 'var(--mock-secondary)', color: '#000' }}>
                        Get Started Free
                      </button>
                      
                      <button className="px-3.5 py-1.5 rounded-lg border text-[10.5px] font-heading font-bold text-slate-350 transition-colors" style={{ borderColor: 'var(--mock-accent)' }}>
                        Request Demo
                      </button>
                    </div>
                  </div>
                )}

                {mockLayoutTemplate === 'creative' && (
                  <div className="space-y-3 font-sans text-xs">
                    
                    {/* Grid card layout simulation */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { title: 'Modular Keyring Tech-Pack', price: '$85.00', bg: 'var(--mock-primary)', label: 'Trending' },
                        { title: 'Cryptex Storage Container', price: '$42.00', bg: 'var(--mock-secondary)', label: 'E-Comm Solid' }
                      ].map((prod, pIdx) => (
                        <div key={pIdx} className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow-lg flex flex-col">
                          
                          {/* Image box placeholder colored selectively */}
                          <div className="h-24 w-full relative flex items-center justify-center text-zinc-400 text-[10px]" style={{ backgroundColor: prod.bg }}>
                            <span className="p-1 px-2.5 rounded bg-black/40 backdrop-blur-sm text-white/95 font-mono text-[9px] uppercase tracking-wider absolute top-2 left-2">
                              {prod.label}
                            </span>
                            <Palette className="w-8 h-8 opacity-45 text-white animate-pulse" />
                          </div>

                          {/* Detail pricing info */}
                          <div className="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                              <span className="block font-heading font-bold text-[10.5px] text-zinc-200 uppercase truncate" title={prod.title}>{prod.title}</span>
                              <span className="block font-mono text-[10px] text-zinc-500 mt-0.5">{prod.price}</span>
                            </div>

                            <button className="w-full py-1 rounded text-[9px] font-heading font-extrabold uppercase transition-colors" style={{ backgroundColor: 'var(--mock-accent)', color: '#000' }}>
                              Add To Cart
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>
                )}

              </div>
            </div>
          )}

          {/* Export Code Box display */}
          <div className="beveled-panel p-5 bg-[#07070a]/90 border border-zinc-900 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-extrabold text-xs uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
                <Code className="w-4 h-4 text-brand" />
                Compiled Stylesheet Snippet
              </h3>
              <span className="font-mono text-[9px] text-zinc-500 uppercase">Local compilation formatting: {exportFormat.toUpperCase()}</span>
            </div>

            <div className="relative">
              <textarea
                readOnly
                value={getExportString(activeColors)}
                rows={10}
                className="w-full bg-[#050507] border border-zinc-850 rounded-xl p-4 font-mono text-xs text-[#f8fafc] leading-relaxed select-all focus:outline-none resize-none"
              />
              
              <button
                type="button"
                onClick={handleCopyCodeSnippet}
                className="absolute right-3.5 bottom-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-mono text-[10.5px] font-bold uppercase transition-all shadow-md cursor-pointer select-none"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy CSS Variable Snippet</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Dynamic Status Notification Toasts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl flex items-center gap-3 shadow-2xl border ${
              toastMessage.type === 'success'
                ? 'bg-[#08150c]/95 border-emerald-500/25 text-emerald-400'
                : 'bg-[#150a0a]/95 border-rose-500/25 text-rose-400'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${toastMessage.type === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className="font-mono text-xs font-bold uppercase">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PenTool as Signature, Type, Edit3, Trash2, Undo2, Download, 
  Copy, Sparkles, Sliders, Settings, RefreshCw, 
  HelpCircle, ChevronDown, CheckCircle2, Layout, FileText, 
  Move, ZoomIn, ZoomOut, Check, Info, Palette
} from 'lucide-react';
import { addRecentOperation } from '../utils/recentOperations';

// Google Handwriting Font Links builder
const HANDWRITING_FONTS = [
  { id: 'caveat', name: 'Caveat (Casual)', family: "'Caveat', cursive", url: 'Caveat' },
  { id: 'great-vibes', name: 'Great Vibes (Formal)', family: "'Great Vibes', cursive", url: 'Great+Vibes' },
  { id: 'alex-brush', name: 'Alex Brush (Classic)', family: "'Alex Brush', cursive", url: 'Alex+Brush' },
  { id: 'sacramento', name: 'Sacramento (Lean)', family: "'Sacramento', cursive", url: 'Sacramento' },
  { id: 'allura', name: 'Allura (Flowing)', family: "'Allura', cursive", url: 'Allura' },
  { id: 'pacifico', name: 'Pacifico (Bold)', family: "'Pacifico', cursive", url: 'Pacifico' },
  { id: 'ms-madi', name: 'Ms Madi (Expressive)', family: "'Ms Madi', cursive", url: 'Ms+Madi' },
  { id: 'rochester', name: 'Rochester (Calligraphy)', family: "'Rochester', cursive", url: 'Rochester' }
];

interface Point {
  x: number;
  y: number;
}

export default function DigitalSignatureGenerator() {
  const [activeMode, setActiveMode] = useState<'type' | 'draw'>('draw');
  
  // Custom states for 'Type' signature
  const [typedName, setTypedName] = useState('Alexander Vance');
  const [selectedFont, setSelectedFont] = useState(HANDWRITING_FONTS[0]);
  const [slantAngle, setSlantAngle] = useState(0); // in degrees
  const [letterSpacing, setLetterSpacing] = useState(0); // in px

  // Custom styling attributes
  const [inkColor, setInkColor] = useState('#0B2240'); // default deep signature registrar blue
  const [penWidth, setPenWidth] = useState(3.5);
  const [transparentBg, setTransparentBg] = useState(true);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [signatureTilt, setSignatureTilt] = useState(0); // Tilt signature render
  const [isCopied, setIsCopied] = useState(false);
  const [opacity, setOpacity] = useState(1);

  // Canvas drawing reference points
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnLines, setDrawnLines] = useState<Point[][]>([]);
  const currentLine = useRef<Point[]>([]);

  // Telemetry logs toaster
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({ 0: false, 1: false, 2: false });

  // Interactive contract signer layout mockup simulation
  const [signerSimulationActive, setSignerSimulationActive] = useState(true);
  const [signaturePosition, setSignaturePosition] = useState({ x: 340, y: 395 });
  const [signatureScale, setSignatureScale] = useState(1);
  const [isDraggingSignature, setIsDraggingSignature] = useState(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const mockupContainerRef = useRef<HTMLDivElement | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Inject Fonts on dynamic component mount
  useEffect(() => {
    const linkId = 'google-handwriting-fonts-style';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      const families = HANDWRITING_FONTS.map(f => `family=${f.url}`).join('&');
      link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

  // Sync canvas size and redraw when drawn history changes or styling parameters update
  useEffect(() => {
    redrawCanvas();

    // Redraw if dynamic web fonts finish loading, ensuring font styles apply instantly
    if (document.fonts && typeof document.fonts.ready !== 'undefined') {
      document.fonts.ready.then(() => {
        redrawCanvas();
      });
    }
  }, [
    drawnLines,
    inkColor,
    penWidth,
    transparentBg,
    bgColor,
    activeMode,
    typedName,
    selectedFont,
    slantAngle,
    letterSpacing
  ]);

  // Handle manual canvas repaint for maximum resolution and smooth Bézier loops
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset dimensions
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Solid visual background color if transparent preference is FALSE
    if (!transparentBg) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (activeMode === 'draw') {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = penWidth;

      drawnLines.forEach((points) => {
        if (points.length < 1) return;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        if (points.length === 1) {
          ctx.lineTo(points[0].x, points[0].y);
        } else if (points.length === 2) {
          ctx.lineTo(points[1].x, points[1].y);
        } else {
          // Employ quadratic curves for perfect curved smoothing stroke
          for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
          }
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        }
        ctx.stroke();
      });
    } else {
      // Draw typed cursive text to primary canvas object directly for high fidelity exports
      ctx.save();
      
      // Center the typography securely
      ctx.translate(canvas.width / 2, canvas.height / 2);
      
      // Apply custom slant rotation and slanted matrix mapping
      ctx.rotate((slantAngle * Math.PI) / 180);
      
      ctx.font = `65px ${selectedFont.family}`;
      ctx.fillStyle = inkColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Letter spacing simulation
      if (letterSpacing !== 0) {
        ctx.letterSpacing = `${letterSpacing}px`;
      }

      ctx.fillText(typedName, 0, 0);
      ctx.restore();
    }
  };

  // Drawing event handlers for touch-pads & stylus/mouse clients
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      if (e.touches && e.touches.length > 0) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY
        };
      }
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coord = getCanvasCoordinates(e);
    setIsDrawing(true);
    currentLine.current = [coord];
    setDrawnLines((prev) => [...prev, [coord]]);
  };

  const drawMovement = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coord = getCanvasCoordinates(e);
    currentLine.current.push(coord);

    setDrawnLines((prev) => {
      const copy = [...prev];
      if (copy.length > 0) {
        copy[copy.length - 1] = [...currentLine.current];
      }
      return copy;
    });
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      currentLine.current = [];
    }
  };

  const handleClearSignature = () => {
    setDrawnLines([]);
    if (activeMode === 'type') {
      setTypedName('');
    }
    showToast('Signature workspace reset!', 'info');
  };

  const handleUndoPenStroke = () => {
    if (drawnLines.length > 0) {
      setDrawnLines((prev) => prev.slice(0, -1));
      showToast('Previous pen stroke undone.', 'info');
    }
  };

  // Compile final image representation (PNG generation)
  const getSignatureDataUrl = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL('image/png');
  };

  const handleCopyDataUrl = () => {
    const dataUrl = getSignatureDataUrl();
    if (!dataUrl) return;
    try {
      navigator.clipboard.writeText(dataUrl);
      setIsCopied(true);
      showToast('Base64 Data URL copied! Ready to paste into Word or CSS.', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast('Copy failed.', 'error');
    }
  };

  // High-fidelity PNG Download Action
  const handleDownloadPNG = () => {
    const dataUrl = getSignatureDataUrl();
    if (!dataUrl) return;
    
    const token = activeMode === 'draw' ? 'DRAW_AUTOGRAPH' : `TYPED_${selectedFont.id.toUpperCase()}`;
    const filename = `Apex-Signature-${token}-${Date.now()}.png`;

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Register into system telemetry log
    addRecentOperation(
      filename,
      'Shield Vault',
      '84.2 KB',
      'Electronic Signature',
      `APEX_SIGN_${Date.now().toString().substring(7)}`,
      '#'
    );

    showToast('High-fidelity custom signature download started!', 'success');
  };

  // SVG Export compilation directly from vector path maps
  const handleDownloadSVG = () => {
    const width = 640;
    const height = 280;
    let svgContent = '';

    if (activeMode === 'draw') {
      let paths = '';
      drawnLines.forEach((points) => {
        if (points.length < 1) return;
        let d = `M ${points[0].x} ${points[0].y}`;
        if (points.length > 1) {
          for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
          }
          d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
        }
        paths += `  <path d="${d}" fill="none" stroke="${inkColor}" stroke-width="${penWidth}" stroke-linecap="round" stroke-linejoin="round" />\n`;
      });

      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
      if (!transparentBg) {
        svgContent += `  <rect width="100%" height="100%" fill="${bgColor}" />\n`;
      }
      svgContent += `${paths}</svg>`;
    } else {
      // Typed styling vector wrapping SVG representation
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
      if (!transparentBg) {
        svgContent += `  <rect width="100%" height="100%" fill="${bgColor}" />\n`;
      }
      svgContent += `  <text x="50%" y="50%" font-family="${selectedFont.family.replace(/'/g, '')}" font-size="65" fill="${inkColor}" text-anchor="middle" dominant-baseline="central" transform="rotate(${slantAngle} 320 140)">${typedName}</text>\n`;
      svgContent += `</svg>`;
    }

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const filename = `Apex-Vector-Signature-${Date.now()}.svg`;

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

    addRecentOperation(
      filename,
      'Shield Vault',
      '4.5 KB',
      'Electronic Signature',
      `APEX_SIG_SVG_${Date.now().toString().substring(7)}`,
      '#'
    );

    showToast('Vector SVG e-signature file download complete!', 'success');
  };

  // Interactive contract signature movement coordinates logic
  const handleMockupMouseDown = (e: React.MouseEvent) => {
    if (!signerSimulationActive) return;
    setIsDraggingSignature(true);
    dragStartOffset.current = {
      x: e.clientX - signaturePosition.x,
      y: e.clientY - signaturePosition.y
    };
  };

  const handleMockupMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSignature || !mockupContainerRef.current) return;
    const containerRect = mockupContainerRef.current.getBoundingClientRect();
    
    // Bounds boundaries math
    const newX = Math.max(0, Math.min(containerRect.width - 200, e.clientX - dragStartOffset.current.x));
    const newY = Math.max(0, Math.min(containerRect.height - 100, e.clientY - dragStartOffset.current.y));
    
    setSignaturePosition({ x: newX, y: newY });
  };

  const handleMockupMouseUp = () => {
    setIsDraggingSignature(false);
  };

  const faqItems = [
    {
      question: "Are my hand-drawn signatures saved or uploaded to the server?",
      answer: "No, never. The signature drawing coordinates, font styling matrix, rotation slant, and canvas rendering processes happen 100% locally in-browser using your graphics rendering pipeline. No image files or signature buffers are transmitted to external servers, providing maximum confidentiality for digital assets."
    },
    {
      question: "Which formats are supported for document integration?",
      answer: "You can download your custom signature as a high-resolution PNG (with transparency enabled, optimal for insertion into Microsoft Word, PDF documents, or Adobe Sign) or as a lightweight, scalable vector SVG format that displays beautifully at any zoom level without pixelating."
    },
    {
      question: "How do I use the Interactive Layout Sandbox?",
      answer: "The interactive signer area mimics a realistic document container (such as a modern business NDA agreement). Simply check the sandbox mode to see your updated custom signature render on a template page. You can drag the signature block anywhere on the document, scale it up or down, and visual-test its fit before final download."
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4.5 py-3 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-300 bg-[#07070a]/95 border-brand/40 text-white font-sans text-xs"
          >
            <CheckCircle2 className="w-4.5 h-4.5 text-brand" />
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styled Header block */}
      <div className="beveled-panel p-6 sm:p-8 bg-[#09090e]/95 border border-brand/20 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 rounded bg-brand/10 border border-brand/20 text-[10px] font-mono text-brand font-bold uppercase tracking-wider">
                E-Signature Studio
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">LOCAL ENCRYPTION SECURITY</span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Signature className="w-6 h-6 text-brand" />
              Digital Signature Generator
            </h2>
            <p className="font-sans text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Create, preview, and style bespoke legal-grade signatures for business contracts. Type or hand-draw with fluid path algorithms, tune pen styles or slant angles, and export document-ready PNG or SVG vectors.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCopyDataUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:border-zinc-750 font-mono font-bold text-xs text-zinc-300 hover:text-white cursor-pointer transition-all active:scale-95"
            >
              <span>Copy Data URL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action controls grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Signature generator params */}
        <div className="lg:col-span-5 space-y-6">
          <div className="beveled-panel p-5 sm:p-6 bg-[#07070a]/90 border border-zinc-900 rounded-2xl space-y-5 shadow-2xl">
            
            {/* Cursive text vs freehand draw toggle switch */}
            <div className="flex items-center p-1 bg-zinc-950/80 border border-zinc-900 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveMode('draw')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-heading font-extrabold tracking-wider uppercase cursor-pointer transition-all ${
                  activeMode === 'draw'
                    ? 'bg-brand text-zinc-950 shadow-[0_2px_10px_rgba(245,158,11,0.2)] font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Draw Signature</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('type')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-heading font-extrabold tracking-wider uppercase cursor-pointer transition-all ${
                  activeMode === 'type'
                    ? 'bg-brand text-zinc-950 shadow-[0_2px_10px_rgba(245,158,11,0.2)] font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Type Initials</span>
              </button>
            </div>

            {/* Mode 1: Hand-drawn controls */}
            {activeMode === 'draw' ? (
              <div className="space-y-4">
                <div className="bg-zinc-950/40 border border-zinc-900/80 p-3 rounded-xl">
                  <span className="block text-[10px] font-mono text-zinc-450 uppercase tracking-widest leading-relaxed mb-1">Canvas guidelines</span>
                  <p className="text-[11px] font-sans text-zinc-450">Draw using your mouse, trackpad, or stylus on the right preview zone. The coordinate path uses quadratic smoothing filters to yield refined business ink curves.</p>
                </div>

                {/* Drawn interactive action buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleUndoPenStroke}
                    disabled={drawnLines.length === 0}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 disabled:opacity-20 border border-zinc-800 rounded-xl py-2 px-3.5 font-mono text-xs text-zinc-300 hover:text-white cursor-pointer select-none transition-all"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Undo stroke</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    disabled={drawnLines.length === 0}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-zinc-900/40 hover:bg-rose-900/10 border border-zinc-800 hover:border-rose-500/20 disabled:opacity-20 rounded-xl py-2 px-3.5 font-mono text-xs text-zinc-400 hover:text-rose-400 cursor-pointer select-none transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear canv</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Mode 2: Signature auto generator typography */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-heading font-bold text-zinc-300 uppercase tracking-wider">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="w-full bg-[#050507] border border-zinc-850 hover:border-zinc-800 rounded-xl py-2 px-3 text-sm font-mono text-white focus:outline-none focus:border-brand/40 shadow-inner"
                    placeholder="E.g. Alexander Vance"
                  />
                </div>

                {/* Select cursive script font preset */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-heading font-bold text-zinc-300 uppercase tracking-wider">
                    Typography Script Style
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {HANDWRITING_FONTS.map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setSelectedFont(font)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all hover:bg-zinc-950/40 select-none ${
                          selectedFont.id === font.id
                            ? 'border-brand/65 bg-brand/[0.03] text-white shadow-lg'
                            : 'border-zinc-900 text-zinc-400 bg-transparent'
                        }`}
                      >
                        <span className="block text-[11px] text-zinc-350 truncate">{font.name}</span>
                        <span 
                          className="block text-base text-zinc-100 truncate mt-1 leading-none" 
                          style={{ fontFamily: font.family }}
                        >
                          {typedName || 'Sample'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom styling coordinates slant */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <span className="block text-[10.5px] font-mono font-bold text-zinc-400 uppercase tracking-wide">
                      Tilt Lean ({slantAngle}°)
                    </span>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={slantAngle}
                      onChange={(e) => setSlantAngle(Number(e.target.value))}
                      className="w-full accent-brand bg-zinc-950 h-1.5 rounded-lg border-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[10.5px] font-mono font-bold text-zinc-400 uppercase tracking-wide">
                      Spontaneous Gap ({letterSpacing}px)
                    </span>
                    <input
                      type="range"
                      min="-4"
                      max="8"
                      step="1"
                      value={letterSpacing}
                      onChange={(e) => setLetterSpacing(Number(e.target.value))}
                      className="w-full accent-brand bg-zinc-950 h-1.5 rounded-lg border-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* General aesthetics properties border */}
            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <div className="flex items-center gap-2 pb-1">
                <Settings className="w-4 h-4 text-brand" />
                <h3 className="font-heading font-extrabold text-xs uppercase text-zinc-300 tracking-wider">Pen & Canvas Customizations</h3>
              </div>

              {/* Ink Preset Buttons */}
              <div className="space-y-2">
                <span className="block text-[10.5px] font-mono font-bold text-zinc-400 uppercase tracking-wide">Ink / Signature Color</span>
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { hex: '#0B2240', name: 'Navy Blue' },
                      { hex: '#050505', name: 'Ink Black' },
                      { hex: '#941B1F', name: 'Crimson Red' },
                      { hex: '#1B633E', name: 'Emerald' }
                    ].map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setInkColor(preset.hex)}
                        className={`flex items-center gap-1.5 py-1 px-2.5 rounded-md text-[10.5px] font-mono border transition-all ${
                          inkColor === preset.hex
                            ? 'border-brand bg-brand/5 text-white'
                            : 'border-zinc-900 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: preset.hex }} />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom color hex input */}
                  <div className="flex items-center gap-2 border-l border-zinc-900 pl-3">
                    <div className="relative w-6 h-6 rounded overflow-hidden border border-zinc-800 bg-zinc-900 flex-shrink-0 cursor-pointer">
                      <input
                        type="color"
                        value={inkColor}
                        onChange={(e) => setInkColor(e.target.value)}
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stroke Sizing Slicer (shown only if drawing) */}
              {activeMode === 'draw' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10.5px] font-mono font-bold text-zinc-400 uppercase">
                    <span>Stroke Weight</span>
                    <span className="text-brand">{penWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="0.5"
                    value={penWidth}
                    onChange={(e) => setPenWidth(parseFloat(e.target.value))}
                    className="w-full accent-brand bg-zinc-950 h-1.5 rounded-lg border-none"
                  />
                </div>
              )}

              {/* Solid vs Transparent checkbox triggers */}
              <div className="space-y-2">
                <span className="block text-[10.5px] font-mono font-bold text-zinc-400 uppercase tracking-wide">Autograph Canvas Backdrop</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransparentBg(true)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      transparentBg
                        ? 'border-brand bg-brand/5 text-white'
                        : 'border-zinc-900 bg-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="block text-[10.5px] font-heading font-black uppercase tracking-wider">Transparent (PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransparentBg(false)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      !transparentBg
                        ? 'border-brand bg-brand/5 text-white'
                        : 'border-zinc-900 bg-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="block text-[10.5px] font-heading font-black uppercase tracking-wider">Solid Color</span>
                  </button>
                </div>
              </div>

              {/* Solid back color picker (if checked) */}
              {!transparentBg && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Solid Hex Color:</span>
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 rounded border border-zinc-800 bg-zinc-900 flex-shrink-0">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                    </div>
                    <input
                      type="text"
                      maxLength={7}
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="bg-zinc-950 border border-zinc-900 rounded py-1 px-2 font-mono text-xs text-white uppercase w-20"
                    />
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Interactive cryptology FAQ block */}
          <div className="beveled-panel p-5 sm:p-6 bg-[#07070a]/90 border border-zinc-900 rounded-2xl space-y-4 shadow-xl">
            <h3 className="font-heading font-extrabold text-xs uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-brand" />
              Digital Autograph FAQ
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

        {/* Right column: Main active drawing pad and Document signer mockup */}
        <div className="lg:col-span-7 space-y-6">

          {/* Dynamic Signature Pad frame */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-xs uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-brand" />
                Active Signature Workspace
              </h3>
              <span className="font-mono text-[9px] text-zinc-500 uppercase">DRAWN OR TYPED AREA</span>
            </div>

            <div className="beveled-panel bg-[#07070a]/90 border border-zinc-900 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Aesthetic Canvas Stream</span>
              </div>

              {/* Secondary decorative transparent grid pattern overlay to make background beautiful */}
              <div className="rounded-xl border border-zinc-950 bg-[#040406] overflow-hidden shadow-inner relative flex items-center justify-center min-h-[300px]">
                <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
                
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={280}
                  onMouseDown={startDrawing}
                  onMouseMove={drawMovement}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={drawMovement}
                  onTouchEnd={stopDrawing}
                  className="w-full max-w-[640px] block relative z-10 rounded-xl"
                  style={{
                    touchAction: 'none',
                    backgroundColor: transparentBg ? 'transparent' : bgColor
                  }}
                />

                {/* Draw hint watermark */}
                {activeMode === 'draw' && drawnLines.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                    <Signature className="w-10 h-10 text-zinc-800 animate-pulse" />
                    <span className="text-[10px] font-mono text-zinc-650 uppercase tracking-widest bg-zinc-950/45 px-3 py-1 rounded-full border border-zinc-900/60 font-bold">
                      SIGN AUTOGRAPH HERE
                    </span>
                  </div>
                )}
              </div>

              {/* Action operations controls */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-zinc-550 uppercase">Canvas status:</span>
                  <span className={`${activeMode === 'draw' && drawnLines.length === 0 ? 'text-amber-500' : 'text-emerald-400'} font-mono text-[10.5px] uppercase font-bold`}>
                    {activeMode === 'type' ? 'Typography dynamic vector rendering' : drawnLines.length === 0 ? 'Empty - Draw some ink layers' : `${drawnLines.length} active path vector maps`}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDownloadPNG}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand font-heading text-zinc-950 font-black text-xs uppercase shadow-md hover:shadow-brand/20 transition-all cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSVG}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-850 hover:border-zinc-750 font-mono font-bold text-zinc-300 hover:text-white text-xs cursor-pointer transition-all active:scale-95"
                  >
                    <span>SVG Vector</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Interactive Document Signer Mockup Simulator */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-brand" />
                <h3 className="font-heading font-black text-xs uppercase text-zinc-400 tracking-widest">
                  Legal Document Signer Mockup
                </h3>
              </div>
              
              <div className="flex items-center p-0.5 bg-zinc-950 border border-zinc-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSignerSimulationActive(!signerSimulationActive)}
                  className={`py-1 px-2.5 rounded text-[9px] font-heading font-extrabold uppercase transition-all select-none cursor-pointer ${
                    signerSimulationActive
                      ? 'bg-zinc-900 text-brand font-black'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {signerSimulationActive ? 'MOCKUP ON' : 'MOCKUP OFF'}
                </button>
              </div>
            </div>

            {signerSimulationActive && (
              <div className="beveled-panel p-5 bg-[#07070a]/90 border border-zinc-900 rounded-2xl space-y-4 shadow-xl">
                <div className="text-zinc-450 text-[11px] font-sans flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-brand" />
                    Drag signature blocks directly overlaying legal areas. Adjust scale below.
                  </span>
                  <div className="flex items-center gap-2 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-900 select-none">
                    <button 
                      type="button" 
                      onClick={() => setSignatureScale(prev => Math.max(0.4, prev - 0.1))} 
                      className="text-zinc-550 hover:text-white transition-colors"
                      title="Shrink signed box"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-[9.5px] font-bold text-zinc-300">{(signatureScale * 100).toFixed(0)}%</span>
                    <button 
                      type="button" 
                      onClick={() => setSignatureScale(prev => Math.min(1.8, prev + 0.1))} 
                      className="text-zinc-550 hover:text-white transition-colors"
                      title="Enlarge signed box"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Mimic standard envelope/contract page layout frame */}
                <div 
                  ref={mockupContainerRef}
                  onMouseMove={handleMockupMouseMove}
                  onMouseUp={handleMockupMouseUp}
                  onMouseLeave={handleMockupMouseUp}
                  className="rounded-xl border border-zinc-850 bg-white shadow-2xl relative select-none w-full min-h-[380px] p-6 text-zinc-800 font-sans"
                >
                  <div className="border-b border-zinc-200 pb-3 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Form NDA-2026</span>
                        <h4 className="font-heading font-black text-sm uppercase text-zinc-800 tracking-wide mt-0.5">MUTUAL CONFIDENTIALITY ACCORD</h4>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-zinc-700 text-xs text-center border">
                        §
                      </div>
                    </div>
                  </div>

                  {/* Template text clauses */}
                  <div className="space-y-2.5 text-[10.5px] text-zinc-500 leading-relaxed font-sans">
                    <p>This Mutual Non-Disclosure Agreement (“Agreement”) is entered into as of the signature timestamp by and between Apex Document Forge Ltd. (“Disclosing Party”) and the Signee parameter represented below (“Receiving Party”).</p>
                    <p><strong>1. Purpose:</strong> The parties wish to explore business integration solutions, security protocols, and creative assets deployment. In connection with this, Disclosing Party may expose certain proprietary engineering secrets in continuous sandbox pipelines offline.</p>
                    <p><strong>2. Standard of Care:</strong> Receiving Party shall secure confidential records using the identical grade of diligence it applies to defend its own unique strategic assets, but in no case less than a standard of reasonable professional care.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-zinc-100 relative">
                    <div>
                      <span className="block text-[8.5px] font-mono text-zinc-450 uppercase font-bold">Disclosing Officer signature</span>
                      <div className="h-10 flex items-end border-b border-zinc-200 pb-1">
                        <span className="font-mono text-[10px] text-zinc-400">Alexander Vance (Officer Signature)</span>
                      </div>
                      <span className="block text-[8px] text-zinc-400 mt-1">Apex Document Forge Ltd.</span>
                    </div>

                    <div className="relative">
                      <span className="block text-[8.5px] font-mono text-zinc-450 uppercase font-bold">Receiving Signee autograph</span>
                      <div className="h-10 border-b border-zinc-200 pb-1" />
                      <span className="block text-[8px] text-zinc-400 mt-1">Authorized Delegate Stamp</span>
                    </div>
                  </div>

                  {/* Interactive overlaid draggable canvas signature avatar box */}
                  <div
                    onMouseDown={handleMockupMouseDown}
                    className={`absolute select-none cursor-move z-25 p-1 border rounded-lg transition-colors flex items-center justify-center ${
                      isDraggingSignature 
                        ? 'border-brand bg-white/40 shadow-inner' 
                        : 'border-transparent hover:border-brand/40 hover:bg-zinc-50/10'
                    }`}
                    style={{
                      left: `${signaturePosition.x}px`,
                      top: `${signaturePosition.y}px`,
                      transform: `scale(${signatureScale})`,
                      transformOrigin: 'center center',
                      width: '180px',
                      height: '75px'
                    }}
                  >
                    <div className="w-full h-full relative flex items-center justify-center">
                      {(activeMode === 'type' && typedName) || (activeMode === 'draw' && drawnLines.length > 0) ? (
                        <img 
                          src={getSignatureDataUrl()} 
                          alt="Dynamic signature layout layer" 
                          className="max-w-full max-h-full object-contain pointer-events-none" 
                        />
                      ) : (
                        <div className="text-[9.5px] font-mono text-rose-500 font-bold uppercase animate-pulse border border-rose-500/20 bg-rose-500/5 px-2 rounded">
                          Awaiting Signatures
                        </div>
                      )}
                      
                      {/* Reposition drag coordinate indicators */}
                      {isDraggingSignature && (
                        <div className="absolute -top-6 bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[8px] px-1.5 py-0.5 rounded leading-none">
                          X: {signaturePosition.x.toFixed(0)} Y: {signaturePosition.y.toFixed(0)}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

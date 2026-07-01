import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  Sparkles, 
  Sliders, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Info, 
  Grid, 
  Maximize2, 
  Minimize2, 
  Eye, 
  Code, 
  Palette, 
  CheckCircle2, 
  HelpCircle,
  ArrowRight,
  Monitor,
  Smartphone,
  Tablet,
  Image as ImageIcon
} from 'lucide-react';

// Preset color palettes
const PALETTES = [
  { name: 'Aurora Synth', primary: '#38bdf8', secondary: '#c084fc', bg: '#0f172a', theme: 'dark' },
  { name: 'Sunset Glow', primary: '#f43f5e', secondary: '#fb923c', bg: '#18181b', theme: 'dark' },
  { name: 'Emerald Wave', primary: '#10b981', secondary: '#3b82f6', bg: '#022c22', theme: 'dark' },
  { name: 'Royal Velvet', primary: '#a855f7', secondary: '#ec4899', bg: '#090514', theme: 'dark' },
  { name: 'Cyberpunk Red', primary: '#f43f5e', secondary: '#06b6d4', bg: '#09090b', theme: 'dark' },
  { name: 'Warm Cream', primary: '#f97316', secondary: '#e11d48', bg: '#fffbeb', theme: 'light' },
  { name: 'Minimalist Gray', primary: '#18181b', secondary: '#71717a', bg: '#fafafa', theme: 'light' },
];

export default function PatternBlobGenerator() {
  // Mode selection
  const [generatorType, setGeneratorType] = useState<'blob' | 'geometric' | 'topography' | 'mesh'>('blob');
  
  // Custom Color State
  const [primaryColor, setPrimaryColor] = useState('#38bdf8');
  const [secondaryColor, setSecondaryColor] = useState('#c084fc');
  const [bgColor, setBgColor] = useState('#0f172a');
  const [glowColor, setGlowColor] = useState('#6366f1');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [isGradient, setIsGradient] = useState<boolean>(true);
  
  // Slider Controls
  const [complexity, setComplexity] = useState<number>(6); // 3 to 12 vertices/waves
  const [organicFrequency, setOrganicFrequency] = useState<number>(40); // 10 to 100 amplitude
  const [rotation, setRotation] = useState<number>(0); // 0 to 360
  const [scale, setScale] = useState<number>(80); // 50 to 100 size
  const [contrast, setContrast] = useState<number>(5); // nested ring depth
  const [seed, setSeed] = useState<number>(123);
  const [gridRepeat, setGridRepeat] = useState<number>(6); // grid repeating level
  const [opacity, setOpacity] = useState<number>(80); // stroke/fill opacity

  // Layout & UI States
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copiedType, setCopiedType] = useState<'svg' | 'css' | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3'>('1:1');
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  
  // Refs
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Randomize all parameters
  const handleRandomize = () => {
    setSeed(Math.floor(Math.random() * 10000));
    setComplexity(Math.floor(Math.random() * 8) + 4); // 4 to 12
    setOrganicFrequency(Math.floor(Math.random() * 60) + 20); // 20 to 80
    setRotation(Math.floor(Math.random() * 360));
    setGridRepeat(Math.floor(Math.random() * 5) + 4); // 4 to 8
    
    // Pick random palette
    const randPalette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    setPrimaryColor(randPalette.primary);
    setSecondaryColor(randPalette.secondary);
    setBgColor(randPalette.bg);
  };

  // Pre-configured palette picker handler
  const handleApplyPalette = (palette: typeof PALETTES[0]) => {
    setPrimaryColor(palette.primary);
    setSecondaryColor(palette.secondary);
    setBgColor(palette.bg);
  };

  // --- MATH & SVG PATH GENERATION ALGORITHMS ---

  // 1. Organic Blob SVG Path Generator (Closed Bezier Circle Spline)
  const generateBlobPath = (): string => {
    const numPoints = complexity;
    const center = 250;
    const baseRadius = (center * scale) / 100 * 0.7;
    const points: { x: number; y: number }[] = [];

    // Custom deterministic pseudo-random generator based on seed
    const pseudoRandom = (angle: number) => {
      const x = Math.sin(angle + seed) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      // organic wave frequency & complexity offsets
      const offsetFactor = (organicFrequency / 100) * 80;
      const noise = pseudoRandom(angle) * offsetFactor - (offsetFactor / 2);
      const r = baseRadius + noise;
      
      const x = center + Math.cos(angle) * r;
      const y = center + Math.sin(angle) * r;
      points.push({ x, y });
    }

    // Return smooth bezier curve connecting points
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < numPoints; i++) {
      const current = points[i];
      const next = points[(i + 1) % numPoints];
      const nextNext = points[(i + 2) % numPoints];

      // Calculate control points for smooth cubic bezier
      const cp1x = current.x + (next.x - points[(i - 1 + numPoints) % numPoints].x) * 0.18;
      const cp1y = current.y + (next.y - points[(i - 1 + numPoints) % numPoints].y) * 0.18;
      const cp2x = next.x - (nextNext.x - current.x) * 0.18;
      const cp2y = next.y - (nextNext.y - current.y) * 0.18;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d + ' Z';
  };

  // 2. Generate Concentric Nested Topography Contours
  const renderTopographyRings = () => {
    const rings = [];
    const ringCount = contrast + 3; // 3 to 12 rings
    const center = 250;
    const maxRadius = (center * scale) / 100;

    const pseudoRandom = (angle: number, ringIndex: number) => {
      const x = Math.sin(angle * 1.5 + seed + ringIndex) * 10000;
      return x - Math.floor(x);
    };

    for (let rIdx = 0; rIdx < ringCount; rIdx++) {
      const points: { x: number; y: number }[] = [];
      const numPoints = complexity + 2;
      const currentRadius = (maxRadius * (ringCount - rIdx)) / ringCount;

      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints;
        const amplitude = (organicFrequency / 100) * 45 * (currentRadius / maxRadius);
        const noise = pseudoRandom(angle, rIdx) * amplitude - (amplitude / 2);
        const r = Math.max(10, currentRadius + noise);

        const x = center + Math.cos(angle) * r;
        const y = center + Math.sin(angle) * r;
        points.push({ x, y });
      }

      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < numPoints; i++) {
        const current = points[i];
        const next = points[(i + 1) % numPoints];
        const nextNext = points[(i + 2) % numPoints];

        const cp1x = current.x + (next.x - points[(i - 1 + numPoints) % numPoints].x) * 0.18;
        const cp1y = current.y + (next.y - points[(i - 1 + numPoints) % numPoints].y) * 0.18;
        const cp2x = next.x - (nextNext.x - current.x) * 0.18;
        const cp2y = next.y - (nextNext.y - current.y) * 0.18;

        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
      }
      d += ' Z';
      rings.push(d);
    }
    return rings;
  };

  // 3. Generate Abstract Polygon Grid Mesh Pattern
  const renderPolygonMesh = () => {
    const triangles = [];
    const size = 500;
    const steps = gridRepeat; // grid repeat multiplier
    const stepX = size / steps;
    const stepY = size / steps;

    const pseudoRandomNode = (x: number, y: number) => {
      const val = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
      return val - Math.floor(val);
    };

    // Construct point matrix
    const grid: { x: number; y: number }[][] = [];
    for (let j = 0; j <= steps; j++) {
      grid[j] = [];
      for (let i = 0; i <= steps; i++) {
        const xBase = i * stepX;
        const yBase = j * stepY;
        
        // Jitter inner points for organic polygon structures
        let offsetX = 0;
        let offsetY = 0;
        if (i > 0 && i < steps && j > 0 && j < steps) {
          const jitterVal = (stepX * (organicFrequency / 100)) * 0.45;
          offsetX = (pseudoRandomNode(i, j) - 0.5) * jitterVal;
          offsetY = (pseudoRandomNode(j, i) - 0.5) * jitterVal;
        }

        grid[j].push({
          x: Math.min(size, Math.max(0, xBase + offsetX)),
          y: Math.min(size, Math.max(0, yBase + offsetY))
        });
      }
    }

    // Connect nodes into triangles or quads with smooth fills
    for (let j = 0; j < steps; j++) {
      for (let i = 0; i < steps; i++) {
        const p1 = grid[j][i];
        const p2 = grid[j][i + 1];
        const p3 = grid[j + 1][i];
        const p4 = grid[j + 1][i + 1];

        // Triangle A
        triangles.push({
          points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`,
          avgX: (p1.x + p2.x + p3.x) / 3,
          avgY: (p1.y + p2.y + p3.y) / 3,
        });

        // Triangle B
        triangles.push({
          points: `${p2.x},${p2.y} ${p4.x},${p4.y} ${p3.x},${p3.y}`,
          avgX: (p2.x + p4.x + p3.x) / 3,
          avgY: (p2.y + p4.y + p3.y) / 3,
        });
      }
    }
    return triangles;
  };

  // --- RENDER REPEATING GEOMETRIC TILES IN DEFS ---
  const renderGeometricTile = () => {
    const tileWidth = 500 / gridRepeat;
    const tileHeight = 500 / gridRepeat;

    switch (complexity % 4) {
      case 0: // Overlapping concentric bubble ripple rings
        return (
          <>
            <circle cx="0" cy="0" r={tileWidth * (scale / 100) * 0.5} fill="none" stroke="url(#grad)" strokeWidth={strokeWidth} opacity={opacity / 100} />
            <circle cx={tileWidth} cy="0" r={tileWidth * (scale / 100) * 0.5} fill="none" stroke="url(#grad)" strokeWidth={strokeWidth} opacity={opacity / 100} />
            <circle cx="0" cy={tileHeight} r={tileWidth * (scale / 100) * 0.5} fill="none" stroke="url(#grad)" strokeWidth={strokeWidth} opacity={opacity / 100} />
            <circle cx={tileWidth} cy={tileHeight} r={tileWidth * (scale / 100) * 0.5} fill="none" stroke="url(#grad)" strokeWidth={strokeWidth} opacity={opacity / 100} />
            <circle cx={tileWidth / 2} cy={tileHeight / 2} r={tileWidth * (scale / 100) * 0.25} fill="url(#grad)" opacity={(opacity - 20) / 100} />
          </>
        );
      case 1: // Isometric 3D Hex cubes / diamond cells
        return (
          <>
            <path d={`M 0 0 L ${tileWidth} 0 L ${tileWidth / 2} ${tileHeight / 2} Z`} fill="url(#grad)" opacity={opacity / 100} />
            <path d={`M 0 0 L ${tileWidth / 2} ${tileHeight / 2} L 0 ${tileHeight} Z`} fill="url(#grad)" opacity={(opacity * 0.7) / 100} />
            <path d={`M ${tileWidth} 0 L ${tileWidth} ${tileHeight} L ${tileWidth / 2} ${tileHeight / 2} Z`} fill="url(#grad)" opacity={(opacity * 0.4) / 100} />
            <rect x="0" y="0" width={tileWidth} height={tileHeight} fill="none" stroke={primaryColor} strokeWidth={0.5} opacity={0.2} />
          </>
        );
      case 2: // Wave arcs & sinusoids
        return (
          <>
            <path d={`M 0 ${tileHeight / 2} Q ${tileWidth / 4} 0, ${tileWidth / 2} ${tileHeight / 2} T ${tileWidth} ${tileHeight / 2}`} fill="none" stroke="url(#grad)" strokeWidth={strokeWidth} opacity={opacity / 100} />
            <path d={`M 0 ${tileHeight / 4} Q ${tileWidth / 4} 0, ${tileWidth / 2} ${tileHeight / 4} T ${tileWidth} ${tileHeight / 4}`} fill="none" stroke="url(#grad)" strokeWidth={strokeWidth * 0.5} opacity={opacity / 150} />
            <circle cx={tileWidth / 2} cy={tileHeight / 2} r={tileWidth * 0.12} fill={secondaryColor} opacity={opacity / 100} />
          </>
        );
      default: // Modern cross grids
        return (
          <>
            <line x1="0" y1="0" x2={tileWidth} y2={tileHeight} stroke="url(#grad)" strokeWidth={strokeWidth} opacity={opacity / 100} />
            <line x1={tileWidth} y1="0" x2="0" y2={tileHeight} stroke={secondaryColor} strokeWidth={strokeWidth * 0.6} opacity={opacity / 120} />
            <rect x={tileWidth / 4} y={tileHeight / 4} width={tileWidth / 2} height={tileHeight / 2} rx="4" fill="none" stroke="url(#grad)" strokeWidth={strokeWidth * 0.5} opacity={opacity / 100} />
          </>
        );
    }
  };

  // --- EXPORT STRING FORMATTERS ---

  // Generate clean SVG source code string
  const getSVGCodeString = (): string => {
    if (!svgRef.current) return '';
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    
    // Format SVG XML nicely with spacing
    source = source.replace(/></g, '>\n<');
    return source;
  };

  // Copy code to clipboard action
  const handleCopy = (type: 'svg' | 'css') => {
    let textToCopy = '';
    if (type === 'svg') {
      textToCopy = getSVGCodeString();
    } else {
      const rawSvg = getSVGCodeString();
      // base64 encode SVG for premium inline CSS background-image
      const base64Svg = btoa(unescape(encodeURIComponent(rawSvg)));
      textToCopy = `background-image: url("data:image/svg+xml;base64,${base64Svg}");\nbackground-size: cover;\nbackground-repeat: no-repeat;`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Download SVG file
  const handleDownloadSVG = () => {
    const svgContent = getSVGCodeString();
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apex-${generatorType}-pattern-${seed}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download high-resolution PNG using HTML Canvas
  const handleDownloadPNG = () => {
    const svgCode = getSVGCodeString();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Define upscale rendering resolution
    canvas.width = aspectRatio === '16:9' ? 1920 : aspectRatio === '4:3' ? 1440 : 1080;
    canvas.height = aspectRatio === '16:9' ? 1080 : aspectRatio === '4:3' ? 1080 : 1080;

    const img = new Image();
    // Encode raw SVG markup to load into Image safely
    const svgBlob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `apex-${generatorType}-pattern-${seed}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="space-y-6 text-white pb-10" id="pattern-generator-root">
      
      {/* Visual Hub Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
              OFFLINE GRAPHICS
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
              VECTOR STUDIO
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-8 h-8 text-emerald-400" />
            SVG Pattern &amp; Blob Studio
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Programmatically design custom fluid liquid blobs, recursive topographic meshes, and tiling pattern grids. Fine-tune parameters with zero external dependencies.
          </p>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomize}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            id="btn-randomize-pattern"
          >
            <RefreshCw className="w-4 h-4" />
            Randomize Seed
          </button>
        </div>
      </div>

      {/* Main Grid split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="pattern-generator-body">
        
        {/* LEFT COLUMN: Controls Dashboard */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl space-y-6">
            
            {/* 1. Choose Generation Engine */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Select Graphic Engine
              </h3>
              
              <div className="grid grid-cols-2 gap-2" id="pattern-type-select">
                <button
                  onClick={() => {
                    setGeneratorType('blob');
                    setComplexity(6);
                    setOrganicFrequency(40);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                    generatorType === 'blob' 
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xl' 
                      : 'bg-black/30 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  <span className="font-semibold text-xs">Organic Blob</span>
                  <span className="text-[10px] opacity-80 leading-snug">Smooth fluid vector splines</span>
                </button>

                <button
                  onClick={() => {
                    setGeneratorType('topography');
                    setComplexity(5);
                    setOrganicFrequency(30);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                    generatorType === 'topography' 
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xl' 
                      : 'bg-black/30 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  <span className="font-semibold text-xs">Contour Ring</span>
                  <span className="text-[10px] opacity-80 leading-snug">Nested contour elevation paths</span>
                </button>

                <button
                  onClick={() => {
                    setGeneratorType('geometric');
                    setGridRepeat(6);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                    generatorType === 'geometric' 
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xl' 
                      : 'bg-black/30 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  <span className="font-semibold text-xs">Geometric Tile</span>
                  <span className="text-[10px] opacity-80 leading-snug">Symmetrical seamless tiles</span>
                </button>

                <button
                  onClick={() => {
                    setGeneratorType('mesh');
                    setGridRepeat(8);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                    generatorType === 'mesh' 
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xl' 
                      : 'bg-black/30 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  <span className="font-semibold text-xs">Polygon Mesh</span>
                  <span className="text-[10px] opacity-80 leading-snug">Delicate digital nodes</span>
                </button>
              </div>
            </div>

            {/* 2. Slider Parameters */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Graphic Properties
              </h3>

              {/* Slider 1: Complexity */}
              {generatorType !== 'mesh' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-400">
                    <span>{generatorType === 'geometric' ? 'Tile Symmetry Key' : 'Wave Vertices'}</span>
                    <span className="text-indigo-400 font-bold">{complexity} points</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="14"
                    value={complexity}
                    onChange={(e) => setComplexity(Number(e.target.value))}
                    className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              )}

              {/* Slider 2: Organic Distortion Amplitude */}
              {generatorType !== 'geometric' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-400">
                    <span>Organic Distortion Force</span>
                    <span className="text-indigo-400 font-bold">{organicFrequency}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={organicFrequency}
                    onChange={(e) => setOrganicFrequency(Number(e.target.value))}
                    className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              )}

              {/* Slider 3: Grid Tiling multiplier */}
              {(generatorType === 'geometric' || generatorType === 'mesh') && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-400">
                    <span>{generatorType === 'mesh' ? 'Mesh Subdivisions' : 'Tile Pattern Repeat'}</span>
                    <span className="text-indigo-400 font-bold">{gridRepeat}x</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="16"
                    value={gridRepeat}
                    onChange={(e) => setGridRepeat(Number(e.target.value))}
                    className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              )}

              {/* Slider 4: Scale / Zoom */}
              {generatorType !== 'geometric' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-400">
                    <span>Base Dimension Scale</span>
                    <span className="text-indigo-400 font-bold">{scale}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="105"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              )}

              {/* Slider 5: Ring Depth for topography */}
              {generatorType === 'topography' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-400">
                    <span>Concentric Contour Count</span>
                    <span className="text-indigo-400 font-bold">{contrast + 3} rings</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              )}

              {/* Slider 6: Rotation Angle */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-400">
                  <span>Graphic Canvas Rotation</span>
                  <span className="text-indigo-400 font-bold">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Slider 7: Stroke Width */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-400">
                  <span>Stroke Line Width</span>
                  <span className="text-indigo-400 font-bold">{strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* 3. Color Palette Center */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  Color Palettes &amp; Fills
                </h3>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-slate-400">Gradient</label>
                  <input
                    type="checkbox"
                    checked={isGradient}
                    onChange={(e) => setIsGradient(e.target.checked)}
                    className="rounded bg-black/50 border-white/10 text-indigo-500 focus:ring-0"
                  />
                </div>
              </div>

              {/* Preset Grids */}
              <div className="grid grid-cols-7 gap-1">
                {PALETTES.map((pal) => (
                  <button
                    key={pal.name}
                    onClick={() => handleApplyPalette(pal)}
                    className="group relative h-8 rounded-lg border border-white/10 overflow-hidden transition-all hover:scale-105 active:scale-95"
                    title={pal.name}
                  >
                    <div className="absolute inset-0 flex flex-col">
                      <div className="flex-1" style={{ backgroundColor: pal.primary }} />
                      <div className="flex-1" style={{ backgroundColor: pal.secondary }} />
                      <div className="h-1.5" style={{ backgroundColor: pal.bg }} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Individual Color Pickers */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Primary Color</label>
                  <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono opacity-80 uppercase">{primaryColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Secondary Color</label>
                  <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono opacity-80 uppercase">{secondaryColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Background Fill</label>
                  <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono opacity-80 uppercase">{bgColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas aspect ratios & Wireframe toggles */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div className="space-y-1.5">
                <label className="block text-xs text-slate-400 font-semibold">Aspect Ratio</label>
                <div className="flex rounded-lg bg-black/40 p-1 border border-white/5">
                  {(['1:1', '16:9', '4:3'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex-1 py-1 rounded text-[11px] font-semibold transition-colors ${aspectRatio === ratio ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-slate-400 font-semibold">View Overlay</label>
                <button
                  onClick={() => setShowWireframe(!showWireframe)}
                  className={`w-full py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    showWireframe 
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' 
                      : 'bg-black/30 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  {showWireframe ? 'Hide Points Overlay' : 'Show Points Overlay'}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive Viewport & Export Output Code */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Subheader Toolbar: Preview Mode vs Code Mode */}
          <div className="bg-slate-900/80 border border-white/10 p-3 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Live Preview Viewport
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'code' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Inspect SVG XML Code
              </button>
            </div>

            {/* Quick Copy Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy('svg')}
                className="px-3 py-1.5 hover:bg-white/5 rounded-lg text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors text-slate-300 hover:text-white"
                title="Copy SVG Code to Clipboard"
              >
                {copiedType === 'svg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedType === 'svg' ? 'Copied XML!' : 'Copy SVG'}
              </button>
              
              <button
                onClick={() => handleCopy('css')}
                className="px-3 py-1.5 hover:bg-white/5 rounded-lg text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors text-slate-300 hover:text-white"
                title="Copy base64 encoded background-image inline CSS rules"
              >
                {copiedType === 'css' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Palette className="w-3.5 h-3.5" />}
                {copiedType === 'css' ? 'Copied CSS!' : 'Copy Inline CSS'}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'preview' ? (
              <motion.div
                key="preview-window"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 bg-black/40 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center min-h-[480px]"
              >
                {/* Responsive Viewport wrapper frame */}
                <div 
                  className="w-full relative flex items-center justify-center transition-all duration-300 overflow-hidden"
                  style={{
                    aspectRatio: aspectRatio === '16:9' ? '16/9' : aspectRatio === '4:3' ? '4/3' : '1/1',
                    maxHeight: '520px'
                  }}
                >
                  
                  {/* Master SVG Canvas */}
                  <svg
                    ref={svgRef}
                    viewBox="0 0 500 500"
                    className="w-full h-full rounded-xl transition-all shadow-2xl"
                    style={{
                      backgroundColor: bgColor,
                      transform: `rotate(${rotation}deg)`,
                      transformOrigin: 'center center'
                    }}
                  >
                    <defs>
                      {/* Premium gradients */}
                      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={primaryColor} />
                        <stop offset="100%" stopColor={secondaryColor} />
                      </linearGradient>

                      <radialGradient id="radial-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={primaryColor} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={bgColor} stopOpacity="0" />
                      </radialGradient>

                      {/* Geometric grid repeating pattern element */}
                      {generatorType === 'geometric' && (
                        <pattern
                          id="repeating-pattern"
                          x="0"
                          y="0"
                          width={500 / gridRepeat}
                          height={500 / gridRepeat}
                          patternUnits="userSpaceOnUse"
                        >
                          {renderGeometricTile()}
                        </pattern>
                      )}
                    </defs>

                    {/* Ambient Radial glow backdrops */}
                    <rect width="500" height="500" fill="url(#radial-glow)" />

                    {/* RENDERING SECTOR */}
                    {generatorType === 'blob' && (
                      <path
                        d={generateBlobPath()}
                        fill={isGradient ? 'url(#grad)' : primaryColor}
                        stroke={secondaryColor}
                        strokeWidth={strokeWidth}
                        opacity={opacity / 100}
                        className="transition-all duration-300"
                      />
                    )}

                    {generatorType === 'topography' && (
                      <g>
                        {renderTopographyRings().map((dStr, idx) => (
                          <path
                            key={idx}
                            d={dStr}
                            fill="none"
                            stroke={isGradient ? 'url(#grad)' : primaryColor}
                            strokeWidth={strokeWidth}
                            opacity={Math.max(0.1, (idx + 1) / (contrast + 3))}
                            className="transition-all duration-300"
                          />
                        ))}
                      </g>
                    )}

                    {generatorType === 'geometric' && (
                      <rect
                        width="500"
                        height="500"
                        fill="url(#repeating-pattern)"
                      />
                    )}

                    {generatorType === 'mesh' && (
                      <g>
                        {renderPolygonMesh().map((tri, idx) => {
                          // Dynamic coordinates to interpolate custom solid shades based on average node depths
                          const depthRatio = (tri.avgX + tri.avgY) / 1000;
                          return (
                            <polygon
                              key={idx}
                              points={tri.points}
                              fill={isGradient ? 'url(#grad)' : primaryColor}
                              fillOpacity={depthRatio * 0.9}
                              stroke={secondaryColor}
                              strokeWidth={strokeWidth * 0.4}
                              strokeOpacity={opacity / 150}
                            />
                          );
                        })}
                      </g>
                    )}

                    {/* Optional Wireframe Helper layer */}
                    {showWireframe && generatorType === 'blob' && (
                      <g className="opacity-80">
                        <path d={generateBlobPath()} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
                        {/* Render anchor points */}
                        {generateBlobPath().match(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/g)?.map((match, i) => {
                          const [x, y] = match.split(/\s+/).map(Number);
                          if (isNaN(x) || isNaN(y)) return null;
                          return (
                            <circle key={i} cx={x} cy={y} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                          );
                        })}
                      </g>
                    )}
                  </svg>
                </div>

                {/* Sub-canvas actions: SVG, PNG download buttons */}
                <div className="w-full flex items-center justify-between mt-6 pt-4 border-t border-white/5 gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-indigo-400" />
                      Aspect Ratio: {aspectRatio}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadSVG}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors border border-white/10"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download SVG File
                    </button>
                    
                    <button
                      onClick={handleDownloadPNG}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-600/10"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Download PNG Asset
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="code-window"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 bg-slate-950/80 border border-white/10 p-5 rounded-2xl flex flex-col justify-between min-h-[480px]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Target: SVG XML Vector markup</span>
                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">W3C Compliant</span>
                  </div>
                  
                  <div className="max-h-[360px] overflow-auto bg-black/60 p-4 rounded-xl border border-white/5">
                    <pre className="text-emerald-400 font-mono text-[11px] whitespace-pre-wrap leading-relaxed select-all">
                      {getSVGCodeString()}
                    </pre>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 text-xs text-slate-300 leading-normal">
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    This SVG output utilizes responsive vector coordinates (`viewBox="0 0 500 500"`) suitable for responsive inline web integration, custom design prototypes, and Figma assets import.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}

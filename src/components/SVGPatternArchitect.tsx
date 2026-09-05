import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Waves, Sparkles, Copy, Download, RefreshCw, Check, Eye, Sliders, 
  Code, Grid, Layers, Palette, Monitor, Smartphone, Tablet, Sun, Moon, 
  Maximize2, ZoomIn, ZoomOut, CheckCircle2, FileCode, Image as ImageIcon,
  Layout, Play, Square, Circle, HelpCircle
} from 'lucide-react';
import { addRecentOperation } from '../utils/recentOperations';

type GeneratorMode = 'wave' | 'mesh' | 'pattern';

interface WaveLayer {
  amplitude: number;
  frequency: number;
  phase: number;
  opacity: number;
  color1: string;
  color2: string;
}

interface MeshPoint {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  color: string;
  radius: number; // percentage 10-80
}

interface GeometricPatternConfig {
  type: 'dots' | 'isometric' | 'grid' | 'circles' | 'crosshatch' | 'hex' | 'zigzag' | 'stripes';
  tileWidth: number;
  tileHeight: number;
  strokeWidth: number;
  strokeColor: string;
  strokeOpacity: number;
  fillColor: string;
  bgColor: string;
  rotation: number;
}

const PRESET_DESIGNS = [
  {
    name: 'Cyberpunk Neon Wave',
    mode: 'wave' as const,
    desc: 'Multi-layer high-contrast cyan & magenta fluid wave header',
    setup: () => ({
      waves: [
        { amplitude: 60, frequency: 2, phase: 0, opacity: 0.8, color1: '#06b6d4', color2: '#3b82f6' },
        { amplitude: 80, frequency: 1.5, phase: 45, opacity: 0.6, color1: '#ec4899', color2: '#8b5cf6' },
        { amplitude: 40, frequency: 3, phase: 90, opacity: 0.4, color1: '#10b981', color2: '#06b6d4' }
      ]
    })
  },
  {
    name: 'Aurora Borealis Mesh',
    mode: 'mesh' as const,
    desc: 'Soft blurred vibrant gradient aura mesh for modern SaaS backgrounds',
    setup: () => ({
      meshPoints: [
        { id: '1', x: 20, y: 30, color: '#06b6d4', radius: 60 },
        { id: '2', x: 80, y: 20, color: '#8b5cf6', radius: 70 },
        { id: '3', x: 50, y: 80, color: '#ec4899', radius: 65 },
        { id: '4', x: 10, y: 90, color: '#10b981', radius: 50 }
      ],
      blur: 60,
      noise: 15
    })
  },
  {
    name: 'Isometric Tech Matrix',
    mode: 'pattern' as const,
    desc: 'Clean 3D isometric grid tile pattern for developer tools',
    setup: () => ({
      pattern: {
        type: 'isometric' as const,
        tileWidth: 40,
        tileHeight: 40,
        strokeWidth: 1.5,
        strokeColor: '#06b6d4',
        strokeOpacity: 0.4,
        fillColor: '#09090b',
        bgColor: '#09090b',
        rotation: 0
      }
    })
  },
  {
    name: 'Subtle Dot Matrix Grid',
    mode: 'pattern' as const,
    desc: 'Minimalist dot grid background for dashboards and doc pages',
    setup: () => ({
      pattern: {
        type: 'dots' as const,
        tileWidth: 24,
        tileHeight: 24,
        strokeWidth: 2.5,
        strokeColor: '#a1a1aa',
        strokeOpacity: 0.35,
        fillColor: '#09090b',
        bgColor: '#09090b',
        rotation: 0
      }
    })
  }
];

export default function SVGPatternArchitect() {
  const [activeMode, setActiveMode] = useState<GeneratorMode>('wave');

  // Preview Stage State
  const [bgPreviewTheme, setBgPreviewTheme] = useState<'dark' | 'light' | 'transparent'>('dark');
  const [showSampleHeroUI, setShowSampleHeroUI] = useState<boolean>(true);
  const [deviceFrame, setDeviceFrame] = useState<'full' | 'desktop' | 'mobile'>('full');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [exportTab, setExportTab] = useState<'svg' | 'css' | 'tailwind'>('svg');

  // WAVE GENERATOR STATE
  const [waveCount, setWaveCount] = useState<number>(3);
  const [waveHeight, setWaveHeight] = useState<number>(320); // total SVG height
  const [waveWidth] = useState<number>(1200);
  const [waveType, setWaveType] = useState<'sine' | 'cubic' | 'steps'>('sine');
  const [waveOrientation, setWaveOrientation] = useState<'bottom' | 'top'>('bottom');
  const [waveLayers, setWaveLayers] = useState<WaveLayer[]>([
    { amplitude: 50, frequency: 2, phase: 0, opacity: 0.9, color1: '#06b6d4', color2: '#2563eb' },
    { amplitude: 70, frequency: 1.5, phase: 60, opacity: 0.65, color1: '#8b5cf6', color2: '#d946ef' },
    { amplitude: 40, frequency: 2.8, phase: 120, opacity: 0.4, color1: '#10b981', color2: '#06b6d4' },
    { amplitude: 60, frequency: 1.2, phase: 180, opacity: 0.25, color1: '#f59e0b', color2: '#ef4444' },
    { amplitude: 35, frequency: 3.5, phase: 240, opacity: 0.15, color1: '#3b82f6', color2: '#8b5cf6' }
  ]);

  // MESH GRADIENT STATE
  const [meshPoints, setMeshPoints] = useState<MeshPoint[]>([
    { id: '1', x: 25, y: 30, color: '#06b6d4', radius: 60 },
    { id: '2', x: 75, y: 25, color: '#8b5cf6', radius: 70 },
    { id: '3', x: 50, y: 75, color: '#ec4899', radius: 65 },
    { id: '4', x: 15, y: 80, color: '#10b981', radius: 55 }
  ]);
  const [meshBlur, setMeshBlur] = useState<number>(50);
  const [meshBgColor, setMeshBgColor] = useState<string>('#09090b');

  // GEOMETRIC PATTERN STATE
  const [patternConfig, setPatternConfig] = useState<GeometricPatternConfig>({
    type: 'isometric',
    tileWidth: 36,
    tileHeight: 36,
    strokeWidth: 1.5,
    strokeColor: '#06b6d4',
    strokeOpacity: 0.4,
    fillColor: '#09090b',
    bgColor: '#09090b',
    rotation: 0
  });

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // WAVE PATH BUILDER
  const waveSvgCode = useMemo(() => {
    const activeLayers = waveLayers.slice(0, waveCount);
    const width = waveWidth;
    const height = waveHeight;

    const layerPaths = activeLayers.map((layer, idx) => {
      const gradId = `waveGrad_${idx}`;
      const points: { x: number; y: number }[] = [];
      const steps = 60;
      const baseMidY = height * 0.5;

      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * width;
        const rad = (i / steps) * Math.PI * 2 * layer.frequency + (layer.phase * Math.PI) / 180;
        
        let y = baseMidY;
        if (waveType === 'sine') {
          y = baseMidY + Math.sin(rad) * layer.amplitude;
        } else if (waveType === 'cubic') {
          y = baseMidY + (Math.sin(rad) + Math.cos(rad * 0.5)) * layer.amplitude * 0.7;
        } else if (waveType === 'steps') {
          const stepVal = Math.floor(Math.sin(rad) * 4) / 4;
          y = baseMidY + stepVal * layer.amplitude;
        }
        points.push({ x, y });
      }

      let d = '';
      if (waveOrientation === 'bottom') {
        d = `M 0,${height} L ${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          const p0 = points[i - 1];
          const p1 = points[i];
          const cx = (p0.x + p1.x) / 2;
          d += ` Q ${p0.x},${p0.y} ${cx},${(p0.y + p1.y) / 2}`;
        }
        const lastP = points[points.length - 1];
        d += ` L ${lastP.x},${lastP.y} L ${width},${height} Z`;
      } else {
        d = `M 0,0 L ${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          const p0 = points[i - 1];
          const p1 = points[i];
          const cx = (p0.x + p1.x) / 2;
          d += ` Q ${p0.x},${p0.y} ${cx},${(p0.y + p1.y) / 2}`;
        }
        const lastP = points[points.length - 1];
        d += ` L ${lastP.x},${lastP.y} L ${width},0 Z`;
      }

      return {
        gradId,
        color1: layer.color1,
        color2: layer.color2,
        opacity: layer.opacity,
        d
      };
    });

    const defs = layerPaths.map(l => `
    <linearGradient id="${l.gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${l.color1}" />
      <stop offset="100%" stop-color="${l.color2}" />
    </linearGradient>`).join('');

    const paths = layerPaths.map(l => `
    <path d="${l.d}" fill="url(#${l.gradId})" opacity="${l.opacity}" />`).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="none">
  <defs>${defs}
  </defs>${paths}
</svg>`;
  }, [waveCount, waveHeight, waveWidth, waveType, waveOrientation, waveLayers]);

  // MESH SVG BUILDER
  const meshSvgCode = useMemo(() => {
    const width = 800;
    const height = 600;

    const defs = meshPoints.map((p, idx) => `
    <radialGradient id="meshGrad_${idx}" cx="${p.x}%" cy="${p.y}%" r="${p.radius}%">
      <stop offset="0%" stop-color="${p.color}" stop-opacity="1" />
      <stop offset="100%" stop-color="${p.color}" stop-opacity="0" />
    </radialGradient>`).join('');

    const rects = meshPoints.map((_, idx) => `
    <rect width="100%" height="100%" fill="url(#meshGrad_${idx})" />`).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="none">
  <defs>
    <filter id="meshBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${meshBlur}" />
    </filter>${defs}
  </defs>
  <rect width="100%" height="100%" fill="${meshBgColor}" />
  <g filter="url(#meshBlur)">${rects}
  </g>
</svg>`;
  }, [meshPoints, meshBlur, meshBgColor]);

  // GEOMETRIC PATTERN BUILDER
  const patternSvgCode = useMemo(() => {
    const { type, tileWidth, tileHeight, strokeWidth, strokeColor, strokeOpacity, fillColor, bgColor } = patternConfig;
    const pId = 'geoPatternTile';

    let patternInner = '';

    if (type === 'dots') {
      patternInner = `<circle cx="${tileWidth / 2}" cy="${tileHeight / 2}" r="${strokeWidth}" fill="${strokeColor}" fill-opacity="${strokeOpacity}" />`;
    } else if (type === 'grid') {
      patternInner = `<path d="M ${tileWidth} 0 L 0 0 0 ${tileHeight}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" />`;
    } else if (type === 'isometric') {
      const w = tileWidth;
      const h = tileHeight;
      patternInner = `
        <path d="M 0,${h / 2} L ${w / 2},0 L ${w},${h / 2} L ${w / 2},${h} Z" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" />
        <path d="M ${w / 2},0 L ${w / 2},${h}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" />
      `;
    } else if (type === 'circles') {
      patternInner = `<circle cx="${tileWidth / 2}" cy="${tileHeight / 2}" r="${tileWidth / 2 - 2}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" />`;
    } else if (type === 'crosshatch') {
      patternInner = `<path d="M 0,0 L ${tileWidth},${tileHeight} M ${tileWidth},0 L 0,${tileHeight}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" />`;
    } else if (type === 'zigzag') {
      patternInner = `<path d="M 0,${tileHeight / 2} L ${tileWidth / 2},0 L ${tileWidth},${tileHeight / 2}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" />`;
    } else if (type === 'stripes') {
      patternInner = `<line x1="0" y1="0" x2="${tileWidth}" y2="${tileHeight}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" />`;
    } else if (type === 'hex') {
      const w = tileWidth;
      const h = tileHeight;
      patternInner = `<path d="M ${w*0.25},0 L ${w*0.75},0 L ${w},${h*0.5} L ${w*0.75},${h} L ${w*0.25},${h} L 0,${h*0.5} Z" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" />`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <defs>
    <pattern id="${pId}" width="${tileWidth}" height="${tileHeight}" patternUnits="userSpaceOnUse">
      ${patternInner}
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="${bgColor}" />
  <rect width="100%" height="100%" fill="url(#${pId})" />
</svg>`;
  }, [patternConfig]);

  // Current Active SVG string
  const activeSvgString = useMemo(() => {
    if (activeMode === 'wave') return waveSvgCode;
    if (activeMode === 'mesh') return meshSvgCode;
    return patternSvgCode;
  }, [activeMode, waveSvgCode, meshSvgCode, patternSvgCode]);

  // CSS Data URI string
  const cssDataUri = useMemo(() => {
    const encoded = encodeURIComponent(activeSvgString.replace(/\s+/g, ' '));
    return `background-image: url("data:image/svg+xml;utf8,${encoded}");`;
  }, [activeSvgString]);

  // Tailwind CSS snippet
  const tailwindSnippet = useMemo(() => {
    const encoded = encodeURIComponent(activeSvgString.replace(/\s+/g, ' '));
    return `bg-[url('data:image/svg+xml;utf8,${encoded}')] bg-cover bg-no-repeat`;
  }, [activeSvgString]);

  // Copy handlers
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(label);
    setTimeout(() => setCopiedType(null), 2500);

    addRecentOperation(
      `SVG Pattern Code (${label})`,
      'Shield Vault',
      'N/A',
      'N/A',
      'Clipboard Snippet',
      '#'
    );
  };

  // Download SVG
  const handleDownloadSVG = () => {
    const blob = new Blob([activeSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `apex_${activeMode}_pattern.svg`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addRecentOperation(
      `SVG Graphic (${activeMode})`,
      'Shield Vault',
      'N/A',
      'N/A',
      'SVG File Export',
      '#'
    );
  };

  // Download High-Res PNG
  const handleDownloadPNG = () => {
    const img = new Image();
    const svgBlob = new Blob([activeSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 1920, 1080);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.setAttribute('download', `apex_${activeMode}_1080p.png`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addRecentOperation(
          `PNG Render 1080p (${activeMode})`,
          'Shield Vault',
          'N/A',
          'N/A',
          'PNG Image Export',
          '#'
        );
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 font-sans text-slate-100">
      
      {/* Header Studio Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-inner">
              <Waves className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  SVG Pattern & Wave Architect
                </h1>
                <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-500/30">
                  Vector Design Studio
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                Architect fluid multi-layered SVG waves, mesh gradients, isometric grids, and tileable geometric UI backgrounds.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleDownloadSVG}
              className="flex items-center space-x-1.5 rounded-xl bg-cyan-500/20 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition border border-cyan-500/40"
            >
              <Download className="h-4 w-4" />
              <span>Download SVG</span>
            </button>
            <button
              onClick={handleDownloadPNG}
              className="flex items-center space-x-1.5 rounded-xl bg-purple-500/20 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/30 transition border border-purple-500/40"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Export High-Res PNG</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-cyan-500/20 pt-4">
          <div className="flex items-center space-x-2 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveMode('wave')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${activeMode === 'wave' ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              <Waves className="h-3.5 w-3.5" />
              <span>Multi-Layer Wave</span>
            </button>
            <button
              onClick={() => setActiveMode('mesh')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${activeMode === 'mesh' ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Mesh Gradient Studio</span>
            </button>
            <button
              onClick={() => setActiveMode('pattern')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${activeMode === 'pattern' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Geometric Pattern Tile</span>
            </button>
          </div>

          {/* Quick Presets Bar */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Presets:</span>
            {PRESET_DESIGNS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveMode(p.mode);
                  const res = p.setup() as any;
                  if (p.mode === 'wave' && res.waves) {
                    setWaveLayers(res.waves);
                    setWaveCount(res.waves.length);
                  } else if (p.mode === 'mesh' && res.meshPoints) {
                    setMeshPoints(res.meshPoints);
                    if (res.blur) setMeshBlur(res.blur);
                  } else if (p.mode === 'pattern' && res.pattern) {
                    setPatternConfig(res.pattern);
                  }
                }}
                className="rounded-lg bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 border border-zinc-700/80 transition"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split: Controls (Left 5) vs Canvas Preview & Code Export (Right 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Controls for Active Generator Mode */}
        <div className="lg:col-span-5 space-y-6">

          {/* WAVE CONTROLS */}
          {activeMode === 'wave' && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-5">
              <h3 className="text-sm font-semibold text-white flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="flex items-center space-x-2">
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  <span>Wave Parameters</span>
                </span>
                <span className="text-xs text-slate-400">{waveCount} Active Layers</span>
              </h3>

              {/* Wave Count & Shape Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Layer Count (1-5):</label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={waveCount}
                    onChange={(e) => setWaveCount(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Wave Shape:</label>
                  <select
                    value={waveType}
                    onChange={(e) => setWaveType(e.target.value as any)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="sine">Smooth Sine</option>
                    <option value="cubic">Organic Cubic</option>
                    <option value="steps">Sharp Steps</option>
                  </select>
                </div>
              </div>

              {/* Height & Orientation */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Canvas Height (px):</label>
                  <input
                    type="number"
                    value={waveHeight}
                    onChange={(e) => setWaveHeight(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    step={20}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Orientation:</label>
                  <button
                    onClick={() => setWaveOrientation(waveOrientation === 'bottom' ? 'top' : 'bottom')}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-zinc-800 text-cyan-300 border border-zinc-700 hover:bg-zinc-700 transition"
                  >
                    {waveOrientation === 'bottom' ? 'Bottom Flow' : 'Top Flow'}
                  </button>
                </div>
              </div>

              {/* Layer Color & Amplitude Fine-Tuning */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-semibold text-slate-300 block">Layer Fine-Tuning:</label>
                {waveLayers.slice(0, waveCount).map((layer, idx) => (
                  <div key={idx} className="rounded-lg bg-zinc-950/80 p-3 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-cyan-400">
                      <span>Layer {idx + 1}</span>
                      <span className="text-[10px] text-slate-400">Opacity: {Math.round(layer.opacity * 100)}%</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                      <div className="flex items-center space-x-1">
                        <input
                          type="color"
                          value={layer.color1}
                          onChange={(e) => {
                            const newLayers = [...waveLayers];
                            newLayers[idx].color1 = e.target.value;
                            setWaveLayers(newLayers);
                          }}
                          className="h-6 w-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-slate-400">{layer.color1}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <input
                          type="color"
                          value={layer.color2}
                          onChange={(e) => {
                            const newLayers = [...waveLayers];
                            newLayers[idx].color2 = e.target.value;
                            setWaveLayers(newLayers);
                          }}
                          className="h-6 w-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-slate-400">{layer.color2}</span>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={layer.opacity}
                          onChange={(e) => {
                            const newLayers = [...waveLayers];
                            newLayers[idx].opacity = Number(e.target.value);
                            setWaveLayers(newLayers);
                          }}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MESH GRADIENT CONTROLS */}
          {activeMode === 'mesh' && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-5">
              <h3 className="text-sm font-semibold text-white flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span>Mesh Control Points</span>
                </span>
                <button
                  onClick={() => {
                    if (meshPoints.length < 8) {
                      setMeshPoints([
                        ...meshPoints,
                        { id: Date.now().toString(), x: Math.floor(Math.random() * 80) + 10, y: Math.floor(Math.random() * 80) + 10, color: '#f59e0b', radius: 50 }
                      ]);
                    }
                  }}
                  className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition"
                >
                  + Add Color Spot
                </button>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Blur Radius ({meshBlur}px):</label>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    value={meshBlur}
                    onChange={(e) => setMeshBlur(Number(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Background Canvas Color:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={meshBgColor}
                      onChange={(e) => setMeshBgColor(e.target.value)}
                      className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-300">{meshBgColor}</span>
                  </div>
                </div>
              </div>

              {/* List of Mesh Points */}
              <div className="space-y-3">
                {meshPoints.map((pt, idx) => (
                  <div key={pt.id} className="rounded-lg bg-zinc-950/80 p-3 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-purple-300">
                      <span>Spot {idx + 1} (X: {pt.x}%, Y: {pt.y}%)</span>
                      {meshPoints.length > 2 && (
                        <button
                          onClick={() => setMeshPoints(meshPoints.filter(p => p.id !== pt.id))}
                          className="text-[10px] text-rose-400 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div className="flex items-center space-x-1">
                        <input
                          type="color"
                          value={pt.color}
                          onChange={(e) => {
                            const newPts = [...meshPoints];
                            newPts[idx].color = e.target.value;
                            setMeshPoints(newPts);
                          }}
                          className="h-6 w-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-slate-400">{pt.color}</span>
                      </div>

                      <div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={pt.x}
                          onChange={(e) => {
                            const newPts = [...meshPoints];
                            newPts[idx].x = Number(e.target.value);
                            setMeshPoints(newPts);
                          }}
                          className="w-full accent-purple-400 cursor-pointer"
                          title="Position X"
                        />
                      </div>

                      <div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={pt.y}
                          onChange={(e) => {
                            const newPts = [...meshPoints];
                            newPts[idx].y = Number(e.target.value);
                            setMeshPoints(newPts);
                          }}
                          className="w-full accent-purple-400 cursor-pointer"
                          title="Position Y"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GEOMETRIC PATTERN CONTROLS */}
          {activeMode === 'pattern' && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-5">
              <h3 className="text-sm font-semibold text-white flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="flex items-center space-x-2">
                  <Grid className="h-4 w-4 text-emerald-400" />
                  <span>Geometric Tile Settings</span>
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Pattern Type:</label>
                  <select
                    value={patternConfig.type}
                    onChange={(e) => setPatternConfig({ ...patternConfig, type: e.target.value as any })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="isometric">Isometric Grid</option>
                    <option value="dots">Dot Matrix</option>
                    <option value="grid">Grid Lines</option>
                    <option value="circles">Concentric Circles</option>
                    <option value="crosshatch">Crosshatch</option>
                    <option value="hex">Hexagonal Mesh</option>
                    <option value="zigzag">Zigzag Chevron</option>
                    <option value="stripes">Diagonal Stripes</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Tile Size ({patternConfig.tileWidth}px):</label>
                  <input
                    type="range"
                    min={12}
                    max={120}
                    value={patternConfig.tileWidth}
                    onChange={(e) => setPatternConfig({ ...patternConfig, tileWidth: Number(e.target.value), tileHeight: Number(e.target.value) })}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Stroke/Dot Size ({patternConfig.strokeWidth}px):</label>
                  <input
                    type="range"
                    min={0.5}
                    max={10}
                    step={0.5}
                    value={patternConfig.strokeWidth}
                    onChange={(e) => setPatternConfig({ ...patternConfig, strokeWidth: Number(e.target.value) })}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Opacity ({Math.round(patternConfig.strokeOpacity * 100)}%):</label>
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={patternConfig.strokeOpacity}
                    onChange={(e) => setPatternConfig({ ...patternConfig, strokeOpacity: Number(e.target.value) })}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Stroke Color:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={patternConfig.strokeColor}
                      onChange={(e) => setPatternConfig({ ...patternConfig, strokeColor: e.target.value })}
                      className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-300">{patternConfig.strokeColor}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 block">Background Color:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={patternConfig.bgColor}
                      onChange={(e) => setPatternConfig({ ...patternConfig, bgColor: e.target.value })}
                      className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-300">{patternConfig.bgColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Interactive Live Canvas & Code Export Studio */}
        <div className="lg:col-span-7 space-y-6">

          {/* Interactive Live Preview Box */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Live Design Preview Stage</h3>
              </div>

              {/* View Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Background Theme Switcher */}
                <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                  <button
                    onClick={() => setBgPreviewTheme('dark')}
                    className={`p-1 rounded transition ${bgPreviewTheme === 'dark' ? 'bg-zinc-800 text-cyan-300' : 'text-slate-500'}`}
                    title="Dark Preview"
                  >
                    <Moon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setBgPreviewTheme('light')}
                    className={`p-1 rounded transition ${bgPreviewTheme === 'light' ? 'bg-zinc-200 text-zinc-900' : 'text-slate-500'}`}
                    title="Light Preview"
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Sample UI Overlay Toggle */}
                <button
                  onClick={() => setShowSampleHeroUI(!showSampleHeroUI)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${showSampleHeroUI ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-zinc-800 text-slate-400 border-zinc-700'}`}
                >
                  {showSampleHeroUI ? 'UI Overlay ON' : 'UI Overlay OFF'}
                </button>
              </div>
            </div>

            {/* Canvas Rendering Box */}
            <div 
              ref={previewContainerRef}
              className={`relative overflow-hidden rounded-xl border border-zinc-800 min-h-[320px] max-h-[420px] flex items-center justify-center transition-colors ${
                bgPreviewTheme === 'dark' ? 'bg-zinc-950' : bgPreviewTheme === 'light' ? 'bg-slate-100' : 'bg-transparent'
              }`}
            >
              {/* SVG Background Layer */}
              <div 
                className="absolute inset-0 w-full h-full pointer-events-none"
                dangerouslySetInnerHTML={{ __html: activeSvgString }}
              />

              {/* Optional UI Hero Overlay Mockup */}
              {showSampleHeroUI && (
                <div className="relative z-10 p-6 max-w-md text-center space-y-3 bg-zinc-900/70 backdrop-blur-md rounded-2xl border border-zinc-700/60 shadow-2xl m-4">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Next-Gen Web Platform
                  </span>
                  <h4 className="text-lg font-extrabold text-white tracking-tight">
                    Build Scalable SaaS Systems
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Test how your generated SVG pattern responds when layered beneath UI card components, text typography, and interactive buttons.
                  </p>
                  <div className="pt-1 flex items-center justify-center space-x-2">
                    <button className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-zinc-950 text-xs font-bold shadow-lg hover:bg-cyan-400 transition">
                      Get Started
                    </button>
                    <button className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-slate-200 text-xs font-semibold border border-zinc-700 hover:bg-zinc-700 transition">
                      Documentation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Export Code Studio Tabs */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setExportTab('svg')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${exportTab === 'svg' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
                >
                  Raw SVG
                </button>
                <button
                  onClick={() => setExportTab('css')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${exportTab === 'css' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
                >
                  CSS Data URI
                </button>
                <button
                  onClick={() => setExportTab('tailwind')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${exportTab === 'tailwind' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
                >
                  Tailwind CSS
                </button>
              </div>

              <button
                onClick={() => {
                  const text = exportTab === 'svg' ? activeSvgString : exportTab === 'css' ? cssDataUri : tailwindSnippet;
                  handleCopy(text, exportTab.toUpperCase());
                }}
                className="flex items-center space-x-1.5 rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition"
              >
                {copiedType === exportTab.toUpperCase() ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedType === exportTab.toUpperCase() ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code Output Box */}
            <div className="relative">
              <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-cyan-300/90 overflow-x-auto max-h-[180px] scrollbar-thin">
                {exportTab === 'svg' && activeSvgString}
                {exportTab === 'css' && cssDataUri}
                {exportTab === 'tailwind' && tailwindSnippet}
              </pre>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

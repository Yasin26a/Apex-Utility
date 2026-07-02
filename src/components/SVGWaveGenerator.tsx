import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, Palette, Copy, Check, Download, Layers, Eye, RefreshCw, 
  Sparkles, Code, FileCode, CheckSquare, Play, HelpCircle, Layout,
  Smartphone, Monitor, Moon, Sun, ArrowUp, ArrowDown, MoveHorizontal, MoveVertical
} from 'lucide-react';

type WaveType = 'smooth' | 'layered' | 'steps' | 'peaks' | 'curve' | 'slant';
type WaveDirection = 'top' | 'bottom';

interface GradientPreset {
  name: string;
  from: string;
  to: string;
}

const GRADIENT_PRESETS: GradientPreset[] = [
  { name: 'Emerald Mint', from: '#10b981', to: '#059669' },
  { name: 'Royal Sunset', from: '#f43f5e', to: '#fb7185' },
  { name: 'Cosmic Slate', from: '#6366f1', to: '#4f46e5' },
  { name: 'Neon Ocean', from: '#06b6d4', to: '#3b82f6' },
  { name: 'Warm Amber', from: '#f59e0b', to: '#d97706' },
  { name: 'Soft Purple', from: '#a855f7', to: '#7c3aed' },
  { name: 'Cyber Rose', from: '#ec4899', to: '#f43f5e' },
  { name: 'Deep Forest', from: '#10b981', to: '#047857' }
];

export default function SVGWaveGenerator() {
  // Wave configurations
  const [waveType, setWaveType] = useState<WaveType>('smooth');
  const [direction, setDirection] = useState<WaveDirection>('bottom');
  const [layerCount, setLayerCount] = useState<number>(3);
  const [points, setPoints] = useState<number>(6); // Complexity/Crests
  const [amplitude, setAmplitude] = useState<number>(120); // Height
  const [phase, setPhase] = useState<number>(0); // Phase shift / move
  const [opacityStep, setOpacityStep] = useState<number>(0.25); // Opacity drop per layer
  
  // Styling configurations
  const [colorMode, setColorMode] = useState<'solid' | 'gradient'>('gradient');
  const [solidColor, setSolidColor] = useState<string>('#10b981');
  const [gradStart, setGradStart] = useState<string>('#6366f1');
  const [gradEnd, setGradEnd] = useState<string>('#4f46e5');
  const [gradAngle, setGradAngle] = useState<number>(90);

  // Flip configurations
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Interactive preview presets
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [previewMode, setPreviewMode] = useState<'divider' | 'landing'>('divider');
  const [copiedType, setCopiedType] = useState<'svg' | 'css' | 'react' | null>(null);

  // Live generation seed for randomize action
  const [randomSeed, setRandomSeed] = useState<number>(42);

  // Randomize wave properties slightly for organic design sessions
  const handleRandomize = () => {
    setPoints(Math.floor(Math.random() * 8) + 4);
    setAmplitude(Math.floor(Math.random() * 120) + 60);
    setPhase(parseFloat((Math.random() * Math.PI * 2).toFixed(2)));
    
    // Pick a random gradient
    const randomGrad = GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)];
    setGradStart(randomGrad.from);
    setGradEnd(randomGrad.to);
    setSolidColor(randomGrad.from);
    
    // Update a random seed to recalculate random variation offsets
    setRandomSeed(Math.floor(Math.random() * 100));
  };

  // Generate deterministic height offsets using sine functions of the seed
  const getSeedOffset = (layerIndex: number, pointIndex: number) => {
    const value = Math.sin(layerIndex * 12.3 + pointIndex * 34.5 + randomSeed);
    return value; // Returns value between -1 and 1
  };

  // Calculate coordinates of the path layers
  const paths = useMemo(() => {
    const result: string[] = [];
    const width = 1440;
    const height = 320; // Canvas base height
    const baseLine = direction === 'bottom' ? height : 0;
    
    // Generate layered offsets
    for (let l = 0; l < layerCount; l++) {
      // Each layer has slight variations in frequency, amplitude, and phase
      const layerAmplitude = amplitude * (1 - l * 0.15);
      const layerPhase = phase + l * (Math.PI / 3.5);
      const layerPointsCount = points;
      const stepX = width / (layerPointsCount - 1);
      
      const layerPoints: { x: number; y: number }[] = [];

      for (let i = 0; i < layerPointsCount; i++) {
        const x = i * stepX;
        
        // Calculate deterministic organic wave height
        let waveY = 0;
        const seedMultiplier = getSeedOffset(l, i) * 15; // deterministic randomness

        if (waveType === 'smooth' || waveType === 'layered') {
          waveY = Math.sin((i / (layerPointsCount - 1)) * Math.PI * 2 + layerPhase) * layerAmplitude + seedMultiplier;
        } else if (waveType === 'steps') {
          waveY = (i % 2 === 0 ? layerAmplitude : -layerAmplitude / 2) + seedMultiplier;
        } else if (waveType === 'peaks') {
          waveY = (i % 2 === 0 ? layerAmplitude : 0) + seedMultiplier;
        } else if (waveType === 'curve') {
          // quadratic curve shape
          const progress = i / (layerPointsCount - 1);
          waveY = Math.sin(progress * Math.PI) * layerAmplitude;
        } else if (waveType === 'slant') {
          // linear slant
          const progress = i / (layerPointsCount - 1);
          waveY = progress * layerAmplitude;
        }

        // Adjust Y coordinate based on whether it is a top or bottom divider
        let y = 0;
        if (direction === 'bottom') {
          y = (height - 100) - waveY;
        } else {
          y = 100 + waveY;
        }

        // Clip within bounds
        y = Math.max(0, Math.min(height, y));

        layerPoints.push({ x, y });
      }

      // Turn coordinates into SVG path description strings
      let pathStr = '';
      if (layerPoints.length > 0) {
        // Start point
        pathStr += `M 0,${direction === 'bottom' ? height : 0} `;
        pathStr += `L ${layerPoints[0].x},${layerPoints[0].y} `;

        if (waveType === 'smooth' || waveType === 'layered' || waveType === 'curve') {
          // Cubic Bezier continuous smooth curves
          for (let i = 0; i < layerPoints.length - 1; i++) {
            const p0 = layerPoints[i];
            const p1 = layerPoints[i + 1];
            const cp1x = p0.x + stepX / 2;
            const cp1y = p0.y;
            const cp2x = p1.x - stepX / 2;
            const cp2y = p1.y;
            pathStr += `C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)} `;
          }
        } else if (waveType === 'steps') {
          // Castellation style sharp steps
          for (let i = 0; i < layerPoints.length - 1; i++) {
            const p0 = layerPoints[i];
            const p1 = layerPoints[i + 1];
            pathStr += `L ${p1.x.toFixed(1)},${p0.y.toFixed(1)} L ${p1.x.toFixed(1)},${p1.y.toFixed(1)} `;
          }
        } else {
          // Simple linear connections for peaks or slants
          for (let i = 1; i < layerPoints.length; i++) {
            pathStr += `L ${layerPoints[i].x.toFixed(1)},${layerPoints[i].y.toFixed(1)} `;
          }
        }

        // Close path
        pathStr += `L ${width},${direction === 'bottom' ? height : 0} Z`;
      }

      result.push(pathStr);
    }

    return result;
  }, [waveType, direction, layerCount, points, amplitude, phase, randomSeed]);

  // Gradient element helper IDs
  const gradientIds = useMemo(() => {
    return Array.from({ length: layerCount }).map((_, i) => `wave-grad-${i}`);
  }, [layerCount]);

  // Construct complete raw clean SVG code output
  const svgCode = useMemo(() => {
    const width = 1440;
    const height = 320;
    const flipStyle = (flipH || flipV) 
      ? ` style="transform: ${flipH ? 'scaleX(-1)' : ''} ${flipV ? 'scaleY(-1)' : ''}; transform-origin: center;"`
      : '';

    let defsCode = '';
    if (colorMode === 'gradient') {
      defsCode = `  <defs>\n`;
      gradientIds.forEach((id, idx) => {
        // Calculate slightly rotated/shifted gradients for layered visual depth
        const angleShift = idx * 10;
        const currentAngle = gradAngle + angleShift;
        const rad = (currentAngle * Math.PI) / 180;
        const x1 = Math.round(50 - Math.cos(rad) * 50);
        const y1 = Math.round(50 - Math.sin(rad) * 50);
        const x2 = Math.round(50 + Math.cos(rad) * 50);
        const y2 = Math.round(50 + Math.sin(rad) * 50);

        // Slightly shift color ends for multilayered translucency contrast
        defsCode += `    <linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">\n`;
        defsCode += `      <stop offset="0%" stop-color="${gradStart}" />\n`;
        defsCode += `      <stop offset="100%" stop-color="${gradEnd}" />\n`;
        defsCode += `    </linearGradient>\n`;
      });
      defsCode += `  </defs>\n`;
    }

    let pathsCode = '';
    paths.forEach((pathPath, idx) => {
      // Farther back layers have progressively lower opacities for visual dimension
      const opacity = parseFloat((1 - (layerCount - 1 - idx) * opacityStep).toFixed(2));
      const fillSource = colorMode === 'solid' ? solidColor : `url(#${gradientIds[idx]})`;
      pathsCode += `  <path d="${pathPath}" fill="${fillSource}" opacity="${Math.max(0.1, opacity)}" />\n`;
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"${flipStyle}>\n${defsCode}${pathsCode}</svg>`;
  }, [paths, colorMode, solidColor, gradStart, gradEnd, gradAngle, layerCount, opacityStep, flipH, flipV, gradientIds]);

  // React component code exporter helper
  const reactCode = useMemo(() => {
    // Generate simple React component template
    const componentName = `WaveDivider${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
    const flipStyle = (flipH || flipV)
      ? ` style={{ transform: '${flipH ? 'scaleX(-1)' : ''} ${flipV ? 'scaleY(-1)' : ''}', transformOrigin: 'center' }}`
      : '';

    let defsSection = '';
    if (colorMode === 'gradient') {
      defsSection = `      <defs>\n`;
      gradientIds.forEach((id, idx) => {
        const angleShift = idx * 10;
        const currentAngle = gradAngle + angleShift;
        const rad = (currentAngle * Math.PI) / 180;
        const x1 = Math.round(50 - Math.cos(rad) * 50);
        const y1 = Math.round(50 - Math.sin(rad) * 50);
        const x2 = Math.round(50 + Math.cos(rad) * 50);
        const y2 = Math.round(50 + Math.sin(rad) * 50);
        defsSection += `        <linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">\n`;
        defsSection += `          <stop offset="0%" stopColor="${gradStart}" />\n`;
        defsSection += `          <stop offset="100%" stopColor="${gradEnd}" />\n`;
        defsSection += `        </linearGradient>\n`;
      });
      defsSection += `      </defs>\n`;
    }

    let pathsSection = '';
    paths.forEach((p, idx) => {
      const opacity = parseFloat((1 - (layerCount - 1 - idx) * opacityStep).toFixed(2));
      const fillSource = colorMode === 'solid' ? solidColor : `url(#${gradientIds[idx]})`;
      pathsSection += `      <path d="${p}" fill="${fillSource}" opacity={${Math.max(0.1, opacity)}} />\n`;
    });

    return `import React from 'react';\n\nexport default function ${componentName}() {\n  return (\n    <div className="w-full overflow-hidden leading-none">\n      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="relative block w-full h-[320px]"${flipStyle}>\n${defsSection}${pathsSection}      </svg>\n    </div>\n  );\n}`;
  }, [paths, colorMode, solidColor, gradStart, gradEnd, gradAngle, layerCount, opacityStep, flipH, flipV, direction, gradientIds]);

  // CSS URL encoded background helper
  const cssBackgroundCode = useMemo(() => {
    // Encodes SVG block so it can be copy-pasted instantly in CSS `background-image`
    const cleanedSvg = svgCode.replace(/"/g, "'").replace(/\n/g, '').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23');
    return `background-image: url("data:image/svg+xml,${cleanedSvg}");\nbackground-repeat: no-repeat;\nbackground-size: cover;`;
  }, [svgCode]);

  // Copy clipboard handler
  const handleCopyCode = (text: string, type: 'svg' | 'css' | 'react') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  // Download SVG file handler
  const handleDownloadSVG = () => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `custom-wave-${waveType}-${direction}-${new Date().toISOString().slice(0,10)}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Quickly apply gradient preset
  const handlePresetSelect = (preset: GradientPreset) => {
    setGradStart(preset.from);
    setGradEnd(preset.to);
    setSolidColor(preset.from);
    setColorMode('gradient');
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-500 uppercase">Vector Art Generator</span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans flex items-center gap-2">
            <Layout className="w-6 h-6 text-emerald-400" />
            SVG Wave & Section Divider Generator
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Generate pixel-perfect organic SVG waves, multi-layered slants, and clean geometric curves with custom transparent linear gradients for high-converting landing pages.
          </p>
        </div>

        {/* Quick action actions */}
        <div className="flex gap-2">
          <button
            onClick={handleRandomize}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white rounded-xl flex items-center gap-2 transition-all hover:border-zinc-700"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            Randomize Seed
          </button>
        </div>
      </div>

      {/* Grid Canvas Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Controls Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Preset Shapes selector */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              1. Choose Divider Geometry
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['smooth', 'layered', 'steps', 'peaks', 'curve', 'slant'] as WaveType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setWaveType(type)}
                  className={`py-2 text-[11px] font-medium rounded-xl border capitalize transition-all ${
                    waveType === type 
                      ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400 font-bold' 
                      : 'bg-zinc-900/40 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Config parameters (amplitude, points, layers) */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              2. Shape Fine-Tuning
            </span>

            {/* Layout Direction switcher */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block">Page Alignment</label>
              <div className="grid grid-cols-2 gap-2 bg-zinc-900/40 p-1 rounded-xl text-center">
                <button
                  onClick={() => setDirection('top')}
                  className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    direction === 'top' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  Top Divider
                </button>
                <button
                  onClick={() => setDirection('bottom')}
                  className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    direction === 'bottom' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  Bottom Divider
                </button>
              </div>
            </div>

            {/* Slide 1: Amplitude Height */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">Divider Height</span>
                <span className="text-emerald-400 font-bold">{amplitude}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                value={amplitude}
                onChange={(e) => setAmplitude(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Slide 2: Points (Crests complexity) */}
            {waveType !== 'curve' && waveType !== 'slant' && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Wave Points / Crests</span>
                  <span className="text-emerald-400 font-bold">{points}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="18"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            )}

            {/* Slide 3: Layer Counts */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">Vector Layers</span>
                <span className="text-emerald-400 font-bold">{layerCount} layers</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={layerCount}
                onChange={(e) => setLayerCount(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Slide 4: Opacity Step */}
            {layerCount > 1 && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Layer Opacity Gap</span>
                  <span className="text-emerald-400 font-bold">-{Math.round(opacityStep * 100)}% per layer</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.4"
                  step="0.05"
                  value={opacityStep}
                  onChange={(e) => setOpacityStep(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            )}

            {/* Slide 5: Phase shift */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">Wave Phase Shift</span>
                <span className="text-emerald-400 font-bold">{Math.round((phase / (Math.PI * 2)) * 360)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="6.28"
                step="0.05"
                value={phase}
                onChange={(e) => setPhase(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Flip Mode Options */}
            <div className="pt-2 border-t border-zinc-900/60 flex items-center justify-between gap-4 text-xs">
              <span className="text-zinc-400 font-medium">Flip Transformations</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFlipH(!flipH)}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] flex items-center gap-1.5 transition-all ${
                    flipH 
                      ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400 font-bold' 
                      : 'bg-zinc-900/40 border-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <MoveHorizontal className="w-3.5 h-3.5" />
                  Flip Horizontal
                </button>
                <button
                  onClick={() => setFlipV(!flipV)}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] flex items-center gap-1.5 transition-all ${
                    flipV 
                      ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400 font-bold' 
                      : 'bg-zinc-900/40 border-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <MoveVertical className="w-3.5 h-3.5" />
                  Flip Vertical
                </button>
              </div>
            </div>

          </div>

          {/* Color & Aesthetic picker panel */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              3. Color Engine & Styling
            </span>

            {/* Mode selection toggle */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block">Color Filling Mode</label>
              <div className="grid grid-cols-2 gap-2 bg-zinc-900/40 p-1 rounded-xl text-center">
                <button
                  onClick={() => setColorMode('solid')}
                  className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                    colorMode === 'solid' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Solid Color
                </button>
                <button
                  onClick={() => setColorMode('gradient')}
                  className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                    colorMode === 'gradient' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Linear Gradient
                </button>
              </div>
            </div>

            {/* Custom inputs */}
            {colorMode === 'solid' ? (
              <div className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-900 p-3 rounded-xl">
                <input
                  type="color"
                  value={solidColor}
                  onChange={(e) => setSolidColor(e.target.value)}
                  className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent"
                />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Hex Value</span>
                  <input
                    type="text"
                    value={solidColor}
                    onChange={(e) => setSolidColor(e.target.value)}
                    className="bg-transparent text-xs font-mono text-white focus:outline-none border-b border-zinc-800"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-zinc-900/40 border border-zinc-900 p-2.5 rounded-xl">
                    <input
                      type="color"
                      value={gradStart}
                      onChange={(e) => setGradStart(e.target.value)}
                      className="w-8 h-8 border-0 rounded bg-transparent cursor-pointer"
                    />
                    <div className="text-[10px] font-mono">
                      <span className="text-zinc-500 block">From</span>
                      <span className="text-white font-bold">{gradStart}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-zinc-900/40 border border-zinc-900 p-2.5 rounded-xl">
                    <input
                      type="color"
                      value={gradEnd}
                      onChange={(e) => setGradEnd(e.target.value)}
                      className="w-8 h-8 border-0 rounded bg-transparent cursor-pointer"
                    />
                    <div className="text-[10px] font-mono">
                      <span className="text-zinc-500 block">To</span>
                      <span className="text-white font-bold">{gradEnd}</span>
                    </div>
                  </div>
                </div>

                {/* Gradient angle slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">Gradient Angle</span>
                    <span className="text-emerald-400 font-bold">{gradAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={gradAngle}
                    onChange={(e) => setGradAngle(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Color Presets shortcuts */}
            <div className="space-y-2 pt-2 border-t border-zinc-900/60">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block">Gradient Presets</label>
              <div className="grid grid-cols-4 gap-2">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className="h-8 rounded-lg border border-zinc-900 relative overflow-hidden group transition-all hover:border-zinc-700"
                    title={preset.name}
                  >
                    <div 
                      className="absolute inset-0" 
                      style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }} 
                    />
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Real-time Display and Code exporters (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Main Visual Preview Area */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            
            {/* Toggle header between light/dark or landing frame */}
            <div className="px-5 py-3.5 bg-zinc-900/20 border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Live Interactive Sandbox Preview
              </span>

              {/* Controls */}
              <div className="flex items-center gap-3">
                
                {/* Contrast Toggle */}
                <div className="flex bg-zinc-900/60 p-0.5 rounded-lg border border-zinc-800">
                  <button
                    onClick={() => setPreviewTheme('dark')}
                    className={`p-1.5 rounded text-zinc-400 hover:text-white transition-all ${
                      previewTheme === 'dark' ? 'bg-zinc-800 text-emerald-400 shadow' : ''
                    }`}
                    title="Dark Background Contrast"
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewTheme('light')}
                    className={`p-1.5 rounded text-zinc-400 hover:text-white transition-all ${
                      previewTheme === 'light' ? 'bg-zinc-800 text-emerald-400 shadow' : ''
                    }`}
                    title="Light Background Contrast"
                  >
                    <Sun className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Preview layout style toggle */}
                <div className="flex bg-zinc-900/60 p-0.5 rounded-lg border border-zinc-800 text-xs">
                  <button
                    onClick={() => setPreviewMode('divider')}
                    className={`px-2.5 py-1 rounded transition-all ${
                      previewMode === 'divider' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400'
                    }`}
                  >
                    Isolated
                  </button>
                  <button
                    onClick={() => setPreviewMode('landing')}
                    className={`px-2.5 py-1 rounded transition-all ${
                      previewMode === 'landing' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400'
                    }`}
                  >
                    Landing Page Separator
                  </button>
                </div>

              </div>
            </div>

            {/* Display stage */}
            <div className={`p-6 sm:p-10 transition-colors duration-300 min-h-[360px] flex items-center justify-center relative ${
              previewTheme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'
            }`}>
              
              {previewMode === 'divider' ? (
                /* Isolated Wave block display */
                <div className="w-full max-w-2xl bg-zinc-900/20 border border-zinc-900/60 rounded-xl overflow-hidden shadow-lg p-1 relative min-h-[220px] flex items-end">
                  
                  {/* Outer boundary checker style lines */}
                  <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
                  
                  {/* Wave itself rendered here inside scaled svg container */}
                  <div className="w-full relative overflow-hidden leading-none z-10">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 1440 320" 
                      className="w-full h-auto block"
                      style={{ 
                        transform: `${flipH ? 'scaleX(-1)' : ''} ${flipV ? 'scaleY(-1)' : ''}`,
                        transformOrigin: 'center'
                      }}
                    >
                      {colorMode === 'gradient' && (
                        <defs>
                          {gradientIds.map((id, idx) => {
                            const angleShift = idx * 10;
                            const currentAngle = gradAngle + angleShift;
                            const rad = (currentAngle * Math.PI) / 180;
                            const x1 = Math.round(50 - Math.cos(rad) * 50);
                            const y1 = Math.round(50 - Math.sin(rad) * 50);
                            const x2 = Math.round(50 + Math.cos(rad) * 50);
                            const y2 = Math.round(50 + Math.sin(rad) * 50);
                            return (
                              <linearGradient key={id} id={id} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}>
                                <stop offset="0%" stopColor={gradStart} />
                                <stop offset="100%" stopColor={gradEnd} />
                              </linearGradient>
                            );
                          })}
                        </defs>
                      )}
                      
                      {paths.map((p, idx) => {
                        const opacity = parseFloat((1 - (layerCount - 1 - idx) * opacityStep).toFixed(2));
                        const fillSource = colorMode === 'solid' ? solidColor : `url(#${gradientIds[idx]})`;
                        return (
                          <path key={idx} d={p} fill={fillSource} opacity={Math.max(0.1, opacity)} />
                        );
                      })}
                    </svg>
                  </div>

                  {/* Dimension marker */}
                  <span className="absolute bottom-2 left-3 text-[9px] font-mono text-zinc-500 z-20 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800">
                    1440 × 320 viewBox (Responsive fluid ratio)
                  </span>

                </div>
              ) : (
                /* Interactive Landing Page Divider preview mockup */
                <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl text-left flex flex-col font-sans">
                  
                  {/* Mock browser titlebar */}
                  <div className="bg-zinc-950 px-4 py-2 flex items-center gap-1.5 border-b border-zinc-900 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-red-500/80" />
                    <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                    <span className="text-[10px] text-zinc-600 font-mono ml-2">https://www.your-landing-page.com</span>
                  </div>

                  {/* Simulated Top Section */}
                  <div className={`p-8 space-y-2 relative transition-colors ${
                    direction === 'top' ? 'bg-zinc-950 text-white' : 'bg-emerald-950/15'
                  }`}>
                    {direction === 'top' && (
                      <div className="absolute inset-x-0 bottom-0 overflow-hidden leading-none">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 1440 320" 
                          className="w-full h-auto block"
                          style={{ 
                            transform: `${flipH ? 'scaleX(-1)' : ''} ${flipV ? 'scaleY(-1)' : ''}`,
                            transformOrigin: 'center'
                          }}
                        >
                          {colorMode === 'gradient' && (
                            <defs>
                              {gradientIds.map((id, idx) => {
                                const angleShift = idx * 10;
                                const currentAngle = gradAngle + angleShift;
                                const rad = (currentAngle * Math.PI) / 180;
                                const x1 = Math.round(50 - Math.cos(rad) * 50);
                                const y1 = Math.round(50 - Math.sin(rad) * 50);
                                const x2 = Math.round(50 + Math.cos(rad) * 50);
                                const y2 = Math.round(50 + Math.sin(rad) * 50);
                                return (
                                  <linearGradient key={id} id={id} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}>
                                    <stop offset="0%" stopColor={gradStart} />
                                    <stop offset="100%" stopColor={gradEnd} />
                                  </linearGradient>
                                );
                              })}
                            </defs>
                          )}
                          {paths.map((p, idx) => {
                            const opacity = parseFloat((1 - (layerCount - 1 - idx) * opacityStep).toFixed(2));
                            const fillSource = colorMode === 'solid' ? solidColor : `url(#${gradientIds[idx]})`;
                            return <path key={idx} d={p} fill={fillSource} opacity={Math.max(0.1, opacity)} />;
                          })}
                        </svg>
                      </div>
                    )}

                    <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase font-mono">Enterprise Platform</span>
                    <h4 className="text-lg font-extrabold text-white leading-tight tracking-tight">Accelerate Cloud Execution</h4>
                    <p className="text-[11px] text-zinc-400 max-w-sm">
                      Distribute serverless micro-environments with instant low-latency delivery, integrated database scaling, and intelligent threat audits.
                    </p>
                  </div>

                  {/* Simulated Bottom Section */}
                  <div className={`p-8 space-y-2 relative transition-colors ${
                    direction === 'bottom' ? 'bg-zinc-950 text-white' : 'bg-emerald-950/15'
                  }`}>
                    {direction === 'bottom' && (
                      <div className="absolute inset-x-0 top-0 overflow-hidden leading-none transform translate-y-[-99%]">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 1440 320" 
                          className="w-full h-auto block"
                          style={{ 
                            transform: `${flipH ? 'scaleX(-1)' : ''} ${flipV ? 'scaleY(-1)' : ''}`,
                            transformOrigin: 'center'
                          }}
                        >
                          {colorMode === 'gradient' && (
                            <defs>
                              {gradientIds.map((id, idx) => {
                                const angleShift = idx * 10;
                                const currentAngle = gradAngle + angleShift;
                                const rad = (currentAngle * Math.PI) / 180;
                                const x1 = Math.round(50 - Math.cos(rad) * 50);
                                const y1 = Math.round(50 - Math.sin(rad) * 50);
                                const x2 = Math.round(50 + Math.cos(rad) * 50);
                                const y2 = Math.round(50 + Math.sin(rad) * 50);
                                return (
                                  <linearGradient key={id} id={id} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}>
                                    <stop offset="0%" stopColor={gradStart} />
                                    <stop offset="100%" stopColor={gradEnd} />
                                  </linearGradient>
                                );
                              })}
                            </defs>
                          )}
                          {paths.map((p, idx) => {
                            const opacity = parseFloat((1 - (layerCount - 1 - idx) * opacityStep).toFixed(2));
                            const fillSource = colorMode === 'solid' ? solidColor : `url(#${gradientIds[idx]})`;
                            return <path key={idx} d={p} fill={fillSource} opacity={Math.max(0.1, opacity)} />;
                          })}
                        </svg>
                      </div>
                    )}

                    <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase font-mono">Scale Securely</span>
                    <h4 className="text-lg font-extrabold text-white leading-tight tracking-tight">Decentralized Global Database</h4>
                    <p className="text-[11px] text-zinc-400 max-w-sm">
                      Leverage robust, fully managed relational schemas with auto-failovers, continuous replication backlogs, and military-grade encryption flags.
                    </p>
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* Export Code Panels */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
            
            {/* Tab choices for code */}
            <div className="border-b border-zinc-900 bg-zinc-900/20 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                Copy SVG & Style Code Exporter
              </span>
              <button
                onClick={handleDownloadSVG}
                className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 self-start"
              >
                <Download className="w-3.5 h-3.5" />
                Download raw .svg file
              </button>
            </div>

            {/* Three copy panels split */}
            <div className="p-5 space-y-4">
              
              {/* Box 1: Raw SVG Code */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500 font-mono">Raw Inline SVG Elements</span>
                  <button
                    onClick={() => handleCopyCode(svgCode, 'svg')}
                    className="text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
                  >
                    {copiedType === 'svg' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedType === 'svg' ? 'Copied code' : 'Copy SVG Tag'}
                  </button>
                </div>
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900/80 max-h-[140px] overflow-auto">
                  <pre className="text-[10px] font-mono text-zinc-300 leading-normal whitespace-pre">{svgCode}</pre>
                </div>
              </div>

              {/* Box 2: React Component (JSX) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500 font-mono">React JSX Functional Component Code</span>
                  <button
                    onClick={() => handleCopyCode(reactCode, 'react')}
                    className="text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
                  >
                    {copiedType === 'react' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedType === 'react' ? 'Copied component' : 'Copy React Code'}
                  </button>
                </div>
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900/80 max-h-[140px] overflow-auto">
                  <pre className="text-[10px] font-mono text-zinc-300 leading-normal whitespace-pre">{reactCode}</pre>
                </div>
              </div>

              {/* Box 3: CSS Background-Image style */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500 font-mono">CSS Background Inline Data-URI</span>
                  <button
                    onClick={() => handleCopyCode(cssBackgroundCode, 'css')}
                    className="text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
                  >
                    {copiedType === 'css' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedType === 'css' ? 'Copied CSS class' : 'Copy CSS rule'}
                  </button>
                </div>
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900/80 max-h-[100px] overflow-auto">
                  <pre className="text-[10px] font-mono text-zinc-300 leading-normal whitespace-pre">{cssBackgroundCode}</pre>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

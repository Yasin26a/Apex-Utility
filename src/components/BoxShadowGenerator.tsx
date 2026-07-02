import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  RotateCcw, 
  Layers, 
  Eye, 
  EyeOff, 
  Sun, 
  Sliders, 
  LayoutGrid, 
  Square, 
  Sparkles, 
  Move, 
  ChevronUp, 
  ChevronDown, 
  Code, 
  Info, 
  Zap,
  Grid
} from 'lucide-react';

interface ShadowLayer {
  id: string;
  active: boolean;
  inset: boolean;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string; // hex
  opacity: number; // 0 to 1
}

interface Preset {
  name: string;
  description: string;
  layers: ShadowLayer[];
  isGlass?: boolean;
}

const PRESETS: Preset[] = [
  {
    name: 'Smooth Ambient',
    description: 'Beautiful multi-layered diffused shadow for modern interfaces',
    isGlass: false,
    layers: [
      { id: '1', active: true, inset: false, x: 0, y: 1, blur: 2, spread: 0, color: '#000000', opacity: 0.05 },
      { id: '2', active: true, inset: false, x: 0, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.05 },
      { id: '3', active: true, inset: false, x: 0, y: 12, blur: 24, spread: -4, color: '#000000', opacity: 0.10 },
      { id: '4', active: true, inset: false, x: 0, y: 24, blur: 48, spread: -8, color: '#000000', opacity: 0.15 }
    ]
  },
  {
    name: 'Neumorphic Soft',
    description: 'Soft extrusion effect blending into light or dark canvas',
    isGlass: false,
    layers: [
      { id: '1', active: true, inset: false, x: -8, y: -8, blur: 16, spread: 0, color: '#ffffff', opacity: 0.8 },
      { id: '2', active: true, inset: false, x: 8, y: 8, blur: 16, spread: 0, color: '#000000', opacity: 0.15 }
    ]
  },
  {
    name: 'Glassmorphism Glow',
    description: 'Subtle light refraction with backdrop filter border',
    isGlass: true,
    layers: [
      { id: '1', active: true, inset: false, x: 0, y: 8, blur: 32, spread: 0, color: '#000000', opacity: 0.15 },
      { id: '2', active: true, inset: true, x: 0, y: 0, blur: 0, spread: 1, color: '#ffffff', opacity: 0.25 }
    ]
  },
  {
    name: 'High-Contrast Brutalist',
    description: 'Thick, retro-modern solid offset shadows with zero blur',
    isGlass: false,
    layers: [
      { id: '1', active: true, inset: false, x: 8, y: 8, blur: 0, spread: 0, color: '#000000', opacity: 1 },
      { id: '2', active: true, inset: true, x: 0, y: 0, blur: 0, spread: 2, color: '#000000', opacity: 1 }
    ]
  },
  {
    name: 'Cyberpunk Neon Glow',
    description: 'Intense dual-color outer glowing shadow',
    isGlass: false,
    layers: [
      { id: '1', active: true, inset: false, x: 0, y: 0, blur: 15, spread: 0, color: '#ec4899', opacity: 0.5 },
      { id: '2', active: true, inset: false, x: 0, y: 0, blur: 30, spread: 4, color: '#3b82f6', opacity: 0.3 },
      { id: '3', active: true, inset: false, x: 0, y: 0, blur: 50, spread: 10, color: '#a855f7', opacity: 0.2 }
    ]
  },
  {
    name: 'Deep Soft Focus',
    description: 'Dramatic elevation shadow representing high-altitude cards',
    isGlass: false,
    layers: [
      { id: '1', active: true, inset: false, x: 0, y: 2, blur: 4, spread: -1, color: '#0f172a', opacity: 0.08 },
      { id: '2', active: true, inset: false, x: 0, y: 10, blur: 20, spread: -3, color: '#0f172a', opacity: 0.12 },
      { id: '3', active: true, inset: false, x: 0, y: 25, blur: 50, spread: -12, color: '#0f172a', opacity: 0.25 }
    ]
  },
  {
    name: 'Concave Inset Frame',
    description: 'Recessed window cutout into the interface canvas',
    isGlass: false,
    layers: [
      { id: '1', active: true, inset: true, x: 4, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.25 },
      { id: '2', active: true, inset: true, x: -4, y: -4, blur: 8, spread: 0, color: '#ffffff', opacity: 0.6 }
    ]
  }
];

export default function BoxShadowGenerator() {
  const [layers, setLayers] = useState<ShadowLayer[]>(JSON.parse(JSON.stringify(PRESETS[0].layers)));
  const [selectedPreset, setSelectedPreset] = useState<string>('Smooth Ambient');
  const [activeLayerId, setActiveLayerId] = useState<string>('1');
  
  // Custom Card Options
  const [borderRadius, setBorderRadius] = useState<number>(16);
  const [cardColor, setCardColor] = useState<string>('#ffffff');
  const [cardOpacity, setCardOpacity] = useState<number>(1);
  const [isGlass, setIsGlass] = useState<boolean>(false);
  const [backdropBlur, setBackdropBlur] = useState<number>(12);
  const [borderOpacity, setBorderOpacity] = useState<number>(15); // 0 to 100
  
  // Preview Canvas Settings
  const [canvasBg, setCanvasBg] = useState<'light' | 'dark' | 'grid-light' | 'grid-dark' | 'sunset' | 'indigo'>('grid-light');
  const [previewView, setPreviewView] = useState<'card' | 'bento'>('card');
  
  // Directional Light Engine state
  const [lightX, setLightX] = useState<number>(0); // -100 to 100
  const [lightY, setLightY] = useState<number>(-50); // -100 to 100
  const [enableLightEngine, setEnableLightEngine] = useState<boolean>(false);
  const [lightIntensity, setLightIntensity] = useState<number>(1); // factor for multipliers
  
  // Copy indicators
  const [copiedCSS, setCopiedCSS] = useState<boolean>(false);
  const [copiedTailwind, setCopiedTailwind] = useState<boolean>(false);

  const lightPadRef = useRef<HTMLDivElement>(null);

  // Apply Preset
  const applyPreset = (preset: Preset) => {
    setSelectedPreset(preset.name);
    setLayers(JSON.parse(JSON.stringify(preset.layers)));
    setIsGlass(!!preset.isGlass);
    if (preset.name === 'Neumorphic Soft') {
      setCanvasBg('light');
      setCardColor('#e0e0e0');
    } else {
      setCardColor('#ffffff');
    }
    if (preset.layers.length > 0) {
      setActiveLayerId(preset.layers[0].id);
    }
  };

  // Convert HEX to RGBA string helper
  const hexToRgba = (hex: string, opacity: number) => {
    let c = hex.substring(1);
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Generate CSS box-shadow string
  const getBoxShadowValue = () => {
    const activeLayers = layers.filter(l => l.active);
    if (activeLayers.length === 0) return 'none';

    return activeLayers.map(l => {
      // If directional light engine is enabled, calculate offsets based on light position
      let xOffset = l.x;
      let yOffset = l.y;

      if (enableLightEngine) {
        // Light X / Y position creates offsets:
        // If light is on the top-left (-50, -50), shadows cast down-right (+X, +Y)
        // Offset is calculated using percentage direction * default offset magnitude (or a computed factor)
        // Let's compute offsets based on light coordinates relative to center (0,0)
        // distance from light to card dictates spread or blur naturally, but we can do offsets:
        const angle = Math.atan2(lightY, lightX); // angle of light source
        const shadowAngle = angle + Math.PI; // shadow casts in opposite direction
        const intensityFactor = (Math.sqrt(lightX * lightX + lightY * lightY) / 100) * lightIntensity;
        
        // Base distance of shadow scale:
        const shadowDistance = (l.inset ? -1 : 1) * intensityFactor * (Math.max(Math.abs(l.x), Math.abs(l.y)) || 8);
        xOffset = Math.round(Math.cos(shadowAngle) * shadowDistance);
        yOffset = Math.round(Math.sin(shadowAngle) * shadowDistance);
      }

      return `${l.inset ? 'inset ' : ''}${xOffset}px ${yOffset}px ${l.blur}px ${l.spread}px ${hexToRgba(l.color, l.opacity)}`;
    }).join(',\n  ');
  };

  // Get inline styles for preview card
  const getCardStyle = () => {
    const shadowStyle = getBoxShadowValue();
    const style: React.CSSProperties = {
      borderRadius: `${borderRadius}px`,
      boxShadow: shadowStyle,
      transition: 'box-shadow 0.15s ease, background 0.2s ease, border-color 0.2s ease',
    };

    if (isGlass) {
      style.background = `rgba(255, 255, 255, ${cardOpacity * 0.4})`;
      style.backdropFilter = `blur(${backdropBlur}px)`;
      style.WebkitBackdropFilter = `blur(${backdropBlur}px)`;
      style.borderColor = `rgba(255, 255, 255, ${borderOpacity / 100})`;
      style.borderWidth = '1px';
    } else {
      // Normal card
      style.backgroundColor = hexToRgba(cardColor, cardOpacity);
      style.borderColor = `rgba(120, 120, 120, ${borderOpacity / 200})`;
      style.borderWidth = borderOpacity > 0 ? '1px' : '0px';
    }

    return style;
  };

  // Shadow manipulations
  const handleAddLayer = () => {
    const newId = (Math.max(...layers.map(l => parseInt(l.id) || 0)) + 1).toString();
    const newLayer: ShadowLayer = {
      id: newId,
      active: true,
      inset: false,
      x: 0,
      y: 6,
      blur: 12,
      spread: 0,
      color: '#000000',
      opacity: 0.12
    };
    setLayers([...layers, newLayer]);
    setActiveLayerId(newId);
    setSelectedPreset('Custom');
  };

  const handleRemoveLayer = (id: string) => {
    if (layers.length <= 1) return;
    const remaining = layers.filter(l => l.id !== id);
    setLayers(remaining);
    if (activeLayerId === id) {
      setActiveLayerId(remaining[0].id);
    }
    setSelectedPreset('Custom');
  };

  const updateLayer = (id: string, updates: Partial<ShadowLayer>) => {
    setLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l));
    setSelectedPreset('Custom');
  };

  const moveLayer = (index: number, direction: 'up' | 'down') => {
    const newLayers = [...layers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLayers.length) return;
    
    // Swap
    const temp = newLayers[index];
    newLayers[index] = newLayers[targetIndex];
    newLayers[targetIndex] = temp;
    setLayers(newLayers);
  };

  const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0];

  // Light joystick dragging
  const handleLightMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    updateLightPosition(e);
    window.addEventListener('mousemove', handleLightMouseMove);
    window.addEventListener('mouseup', handleLightMouseUp);
  };

  const handleLightMouseMove = (e: MouseEvent) => {
    updateLightPosition(e);
  };

  const handleLightMouseUp = () => {
    window.removeEventListener('mousemove', handleLightMouseMove);
    window.removeEventListener('mouseup', handleLightMouseUp);
  };

  const updateLightPosition = (e: MouseEvent | React.MouseEvent) => {
    if (!lightPadRef.current) return;
    const rect = lightPadRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate vector from center
    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
    
    // Normalize to -100 to 100 within circular radius
    const maxRadius = rect.width / 2;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }
    
    const pctX = Math.round((dx / maxRadius) * 100);
    const pctY = Math.round((dy / maxRadius) * 100);
    
    setLightX(pctX);
    setLightY(pctY);
    setEnableLightEngine(true);
  };

  // Reset Light Engine
  const resetLightEngine = () => {
    setEnableLightEngine(false);
    setLightX(0);
    setLightY(-50);
  };

  // Copy CSS Code
  const copyCSSCode = () => {
    const rawVal = getBoxShadowValue();
    const formattedCode = `box-shadow: ${rawVal};
${isGlass ? `background: rgba(255, 255, 255, ${cardOpacity * 0.4});
backdrop-filter: blur(${backdropBlur}px);
-webkit-backdrop-filter: blur(${backdropBlur}px);` : `background-color: ${hexToRgba(cardColor, cardOpacity)};`}
border-radius: ${borderRadius}px;
${borderOpacity > 0 ? `border: 1px solid ${isGlass ? `rgba(255, 255, 255, ${borderOpacity / 100})` : `rgba(120, 120, 120, ${borderOpacity / 200})`};` : ''}`;
    
    navigator.clipboard.writeText(formattedCode);
    setCopiedCSS(true);
    setTimeout(() => setCopiedCSS(false), 2000);
  };

  // Copy Tailwind class code
  const copyTailwindCode = () => {
    const rawVal = getBoxShadowValue().replace(/\s+/g, ' ').trim();
    const tailwindClass = `shadow-[${rawVal}] rounded-[${borderRadius}px] ${
      isGlass 
        ? `bg-white/40 backdrop-blur-[${backdropBlur}px] border border-white/20` 
        : `bg-[${cardColor}]`
    }`;
    navigator.clipboard.writeText(tailwindClass);
    setCopiedTailwind(true);
    setTimeout(() => setCopiedTailwind(false), 2000);
  };

  return (
    <div id="box-shadow-playground" className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-zinc-100 p-0 md:p-2">
      {/* Header Panel */}
      <div className="col-span-1/1 lg:col-span-12 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-brand/10 border border-brand/30 text-brand rounded-lg">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                Box-Shadow & Bento Designer
              </h1>
            </div>
            <p className="text-sm text-zinc-400 max-w-2xl">
              Visually craft advanced multi-layered, smooth ambient shadows, diffused depths, or brutalist frames. Preview designs on responsive Bento grids and generate clean CSS and Tailwind configurations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p.name}
                id={`preset-${p.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => applyPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPreset === p.name
                    ? 'bg-brand text-white shadow-lg shadow-brand/20'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LEFT: Controls Panel */}
      <div className="lg:col-span-5 space-y-6">
        {/* Layer Manager Box */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Shadow Layers</h2>
            </div>
            <button
              id="add-layer-btn"
              onClick={handleAddLayer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-brand border border-brand/20 rounded-lg text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Layer
            </button>
          </div>

          {/* Layer List */}
          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
            {layers.map((layer, index) => (
              <div
                key={layer.id}
                id={`layer-item-${layer.id}`}
                onClick={() => setActiveLayerId(layer.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeLayerId === layer.id
                    ? 'bg-brand/10 border-brand text-white shadow-[inset_0_1px_3px_rgba(239,68,68,0.1)]'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-[10px] bg-zinc-800 text-zinc-300 w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold">
                    #{index + 1}
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-zinc-200">
                      {layer.inset ? 'Inset ' : 'Outer'} 
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono ml-1.5">
                      {layer.x}px, {layer.y}px, {layer.blur}px
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  {/* Toggle Layer Visibility */}
                  <button
                    id={`toggle-layer-${layer.id}`}
                    onClick={() => updateLayer(layer.id, { active: !layer.active })}
                    title={layer.active ? "Mute Shadow Layer" : "Unmute Shadow Layer"}
                    className={`p-1.5 rounded-lg transition-all ${
                      layer.active ? 'text-zinc-300 hover:bg-zinc-800' : 'text-zinc-650 hover:bg-zinc-800'
                    }`}
                  >
                    {layer.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
                  </button>

                  {/* Move Up */}
                  <button
                    id={`move-up-layer-${layer.id}`}
                    disabled={index === 0}
                    onClick={() => moveLayer(index, 'up')}
                    className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none"
                    title="Move Layer Up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    id={`move-down-layer-${layer.id}`}
                    disabled={index === layers.length - 1}
                    onClick={() => moveLayer(index, 'down')}
                    className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none"
                    title="Move Layer Down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Layer */}
                  <button
                    id={`delete-layer-${layer.id}`}
                    disabled={layers.length <= 1}
                    onClick={() => handleRemoveLayer(layer.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg disabled:opacity-20 disabled:pointer-events-none transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Layer Properties */}
        {activeLayer && (
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Editing Layer #{layers.findIndex(l => l.id === activeLayer.id) + 1}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-zinc-400">
                  <input
                    type="checkbox"
                    checked={activeLayer.inset}
                    onChange={e => updateLayer(activeLayer.id, { inset: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-900 text-brand focus:ring-brand focus:ring-offset-zinc-900 w-3.5 h-3.5"
                  />
                  Inset Shadow
                </label>
              </div>
            </div>

            {/* Slider Properties */}
            <div className="space-y-3.5">
              {/* Offset X Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Offset X</span>
                  <span className="font-mono text-brand font-semibold">{activeLayer.x}px</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={activeLayer.x}
                  onChange={e => updateLayer(activeLayer.id, { x: parseInt(e.target.value) })}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-brand"
                  disabled={enableLightEngine}
                />
                {enableLightEngine && (
                  <p className="text-[10px] text-yellow-500/80 flex items-center gap-1">
                    <Sun className="w-3 h-3" /> Light Directional Engine overriding individual offsets
                  </p>
                )}
              </div>

              {/* Offset Y Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Offset Y</span>
                  <span className="font-mono text-brand font-semibold">{activeLayer.y}px</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={activeLayer.y}
                  onChange={e => updateLayer(activeLayer.id, { y: parseInt(e.target.value) })}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-brand"
                  disabled={enableLightEngine}
                />
              </div>

              {/* Blur Radius */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Blur Radius</span>
                  <span className="font-mono text-brand font-semibold">{activeLayer.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={activeLayer.blur}
                  onChange={e => updateLayer(activeLayer.id, { blur: parseInt(e.target.value) })}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-brand"
                />
              </div>

              {/* Spread Radius */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Spread Radius</span>
                  <span className="font-mono text-brand font-semibold">{activeLayer.spread}px</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={activeLayer.spread}
                  onChange={e => updateLayer(activeLayer.id, { spread: parseInt(e.target.value) })}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-brand"
                />
              </div>

              {/* Opacity Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Shadow Color Opacity</span>
                  <span className="font-mono text-brand font-semibold">{Math.round(activeLayer.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(activeLayer.opacity * 100)}
                  onChange={e => updateLayer(activeLayer.id, { opacity: parseFloat(e.target.value) / 100 })}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-brand"
                />
              </div>

              {/* Color Hex Input */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-zinc-500 uppercase block mb-1">Shadow Color</span>
                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5">
                    <input
                      type="color"
                      value={activeLayer.color}
                      onChange={e => updateLayer(activeLayer.id, { color: e.target.value })}
                      className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer outline-none"
                    />
                    <input
                      type="text"
                      value={activeLayer.color.toUpperCase()}
                      onChange={e => updateLayer(activeLayer.id, { color: e.target.value })}
                      className="bg-transparent text-xs text-zinc-200 outline-none w-16 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-zinc-500 uppercase block mb-1">Presets Quick Color</span>
                  <div className="flex gap-1.5 items-center mt-1">
                    {['#000000', '#1e293b', '#3b82f6', '#ec4899'].map(c => (
                      <button
                        key={c}
                        onClick={() => updateLayer(activeLayer.id, { color: c })}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-md border transition-transform ${
                          activeLayer.color.toLowerCase() === c.toLowerCase() 
                            ? 'scale-125 border-white' 
                            : 'border-zinc-800 hover:scale-110'
                        }`}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Dynamic Light Source Engine */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Directional Light Joystick</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="toggle-light-engine"
                onClick={() => setEnableLightEngine(!enableLightEngine)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  enableLightEngine 
                    ? 'bg-amber-950/80 border border-amber-900/50 text-amber-400'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                }`}
              >
                {enableLightEngine ? 'ENGINE ACTIVE' : 'ENGINE MUTED'}
              </button>
              {enableLightEngine && (
                <button
                  id="reset-light-engine-btn"
                  onClick={resetLightEngine}
                  className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white"
                  title="Reset light"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            Drag the sun on the interactive pad below. The light engine calculates casting angles in real time, automatically setting the X & Y offsets of your shadow layers in opposite directions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Joystick Area */}
            <div className="md:col-span-6 flex justify-center">
              <div 
                ref={lightPadRef}
                onMouseDown={handleLightMouseDown}
                className="relative w-36 h-36 rounded-full bg-zinc-900 border border-zinc-800/80 cursor-crosshair flex items-center justify-center overflow-hidden shadow-inner"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(63,63,70,0.1) 1px, transparent 1.5px)',
                  backgroundSize: '12px 12px'
                }}
              >
                {/* Center point marker */}
                <div className="absolute w-2 h-2 rounded-full bg-zinc-700/60" />
                
                {/* Cross lines */}
                <div className="absolute h-full w-px bg-zinc-800/50" />
                <div className="absolute w-full h-px bg-zinc-800/50" />

                {/* Ambient glow from light position */}
                <div 
                  className="absolute w-24 h-24 rounded-full bg-amber-500/10 blur-xl transition-all duration-300"
                  style={{
                    transform: `translate(${lightX * 0.4}px, ${lightY * 0.4}px)`
                  }}
                />

                {/* Draggable Sun Element */}
                <motion.div 
                  className="absolute w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing border border-white/40"
                  style={{
                    left: `calc(50% - 12px + ${lightX * 0.5}px)`,
                    top: `calc(50% - 12px + ${lightY * 0.5}px)`
                  }}
                  animate={{ scale: enableLightEngine ? 1.1 : 0.95 }}
                >
                  <div className="w-2 h-2 rounded-full bg-white" />
                </motion.div>
              </div>
            </div>

            {/* Light Settings */}
            <div className="md:col-span-6 space-y-3">
              <div className="bg-zinc-900/60 border border-zinc-800/60 p-2.5 rounded-xl space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-zinc-500">
                  <span>Light Angle:</span>
                  <span className="text-zinc-300 font-semibold">
                    {Math.round(Math.atan2(lightY, lightX) * (180 / Math.PI)) + 180}°
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Sun Distance:</span>
                  <span className="text-zinc-300 font-semibold">
                    {Math.round(Math.sqrt(lightX * lightX + lightY * lightY))}%
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Shadow Direction:</span>
                  <span className="text-brand font-semibold">
                    {lightX > 0 ? 'Left ⬅️' : 'Right ➡️'} {lightY > 0 ? 'Up ⬆️' : 'Down ⬇️'}
                  </span>
                </div>
              </div>

              {/* Light multiplier */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Shadow Pitch / Multiplier</span>
                  <span className="font-mono text-zinc-200">{lightIntensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={lightIntensity}
                  onChange={e => {
                    setLightIntensity(parseFloat(e.target.value));
                    setEnableLightEngine(true);
                  }}
                  className="w-full h-1 rounded appearance-none cursor-pointer bg-zinc-800 accent-amber-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card Customize & Glassmorphism */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Card & Glass Options</h3>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-zinc-300">
              <input
                type="checkbox"
                checked={isGlass}
                onChange={e => setIsGlass(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-brand focus:ring-brand focus:ring-offset-zinc-900 w-3.5 h-3.5"
              />
              Glassmorphism
            </label>
          </div>

          <div className="space-y-3.5">
            {/* Border Radius */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Border Radius</span>
                <span className="font-mono text-zinc-200">{borderRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={borderRadius}
                onChange={e => setBorderRadius(parseInt(e.target.value))}
                className="w-full h-1 appearance-none cursor-pointer bg-zinc-800 accent-brand"
              />
            </div>

            {/* Card Opacity */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Card Fill Opacity</span>
                <span className="font-mono text-zinc-200">{Math.round(cardOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(cardOpacity * 100)}
                onChange={e => setCardOpacity(parseFloat(e.target.value) / 100)}
                className="w-full h-1 appearance-none cursor-pointer bg-zinc-800 accent-brand"
              />
            </div>

            {!isGlass ? (
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-500 uppercase block mb-1">Card Background Fill</span>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 w-1/2">
                  <input
                    type="color"
                    value={cardColor}
                    onChange={e => setCardColor(e.target.value)}
                    className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer outline-none"
                  />
                  <input
                    type="text"
                    value={cardColor.toUpperCase()}
                    onChange={e => setCardColor(e.target.value)}
                    className="bg-transparent text-xs text-zinc-200 outline-none w-16 font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* Backdrop blur */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Backdrop Blur</span>
                    <span className="font-mono text-zinc-300">{backdropBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={backdropBlur}
                    onChange={e => setBackdropBlur(parseInt(e.target.value))}
                    className="w-full h-1 appearance-none cursor-pointer bg-zinc-800 accent-brand"
                  />
                </div>

                {/* Border opacity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Glow Outline</span>
                    <span className="font-mono text-zinc-300">{borderOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={borderOpacity}
                    onChange={e => setBorderOpacity(parseInt(e.target.value))}
                    className="w-full h-1 appearance-none cursor-pointer bg-zinc-800 accent-brand"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Preview & Code block panel */}
      <div className="lg:col-span-7 space-y-6">
        {/* View mode toggle & Canvas styling */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <button
              id="view-card-btn"
              onClick={() => setPreviewView('card')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                previewView === 'card'
                  ? 'bg-zinc-800 text-brand shadow-md font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Square className="w-3.5 h-3.5" /> Single Focus Card
            </button>
            <button
              id="view-bento-btn"
              onClick={() => setPreviewView('bento')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                previewView === 'bento'
                  ? 'bg-zinc-800 text-brand shadow-md font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Bento Grid Layout
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">Canvas:</span>
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
              {(['grid-light', 'grid-dark', 'sunset', 'indigo', 'light', 'dark'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => setCanvasBg(style)}
                  className={`w-6 h-6 rounded-md transition-all border ${
                    canvasBg === style 
                      ? 'border-brand scale-110 shadow-lg' 
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{
                    background: 
                      style === 'grid-light' ? '#f4f4f5' :
                      style === 'grid-dark' ? '#09090b' :
                      style === 'sunset' ? 'linear-gradient(135deg, #f43f5e, #fb923c)' :
                      style === 'indigo' ? 'linear-gradient(135deg, #4f46e5, #06b6d4)' :
                      style === 'light' ? '#ffffff' : '#18181b',
                    backgroundImage: 
                      style === 'grid-light' ? 'radial-gradient(#e4e4e7 1px, transparent 1px)' :
                      style === 'grid-dark' ? 'radial-gradient(#27272a 1px, transparent 1px)' : undefined,
                    backgroundSize: (style === 'grid-light' || style === 'grid-dark') ? '16px 16px' : undefined
                  }}
                  title={`Canvas: ${style}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Stage */}
        <div 
          className="relative min-h-[360px] md:min-h-[460px] rounded-2xl flex items-center justify-center p-6 md:p-12 overflow-hidden border border-zinc-800 transition-all duration-300 shadow-2xl"
          style={{
            background: 
              canvasBg === 'grid-light' ? '#f4f4f5' :
              canvasBg === 'grid-dark' ? '#09090b' :
              canvasBg === 'sunset' ? 'linear-gradient(135deg, #f43f5e, #fb923c)' :
              canvasBg === 'indigo' ? 'linear-gradient(135deg, #4f46e5, #06b6d4)' :
              canvasBg === 'light' ? '#ffffff' : '#18181b',
            backgroundImage: 
              canvasBg === 'grid-light' ? 'radial-gradient(#d4d4d8 1.5px, transparent 1.5px)' :
              canvasBg === 'grid-dark' ? 'radial-gradient(#27272a 1.5px, transparent 1.5px)' : undefined,
            backgroundSize: (canvasBg === 'grid-light' || canvasBg === 'grid-dark') ? '20px 20px' : undefined
          }}
        >
          {/* Virtual Sun Ambient Vector to represent light source on canvas */}
          {enableLightEngine && (
            <div 
              className="absolute pointer-events-none w-56 h-56 rounded-full transition-all duration-300 mix-blend-screen opacity-25"
              style={{
                left: `calc(50% - 112px + ${lightX * 2}px)`,
                top: `calc(50% - 112px + ${lightY * 2}px)`,
                background: 'radial-gradient(circle, rgba(251,146,60,0.6) 0%, transparent 70%)',
                filter: 'blur(10px)'
              }}
            />
          )}

          {/* VIEW 1: Focus Card */}
          {previewView === 'card' && (
            <div 
              className="w-full max-w-sm p-8 transition-all relative border border-transparent select-none group"
              style={getCardStyle()}
            >
              <div className="absolute top-4 right-4 bg-zinc-900/40 text-[10px] text-zinc-400 border border-zinc-800/40 px-2 py-0.5 rounded-full font-mono font-bold tracking-tight">
                Preview Object
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand to-rose-400 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-zinc-900 group-hover:text-black transition-colors" style={{ color: canvasBg === 'light' || canvasBg === 'grid-light' ? '#09090b' : '#ffffff' }}>
                    Aesthetic Card Block
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed" style={{ color: canvasBg === 'light' || canvasBg === 'grid-light' ? '#4b5563' : '#a1a1aa' }}>
                    This card showcases your designed {layers.filter(l => l.active).length}-layer smooth box-shadow. Turn on the light joystick to animate custom casting offsets.
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-200/20 flex gap-2">
                  <div className="w-full h-2 rounded bg-zinc-200/50" />
                  <div className="w-2/3 h-2 rounded bg-zinc-200/50" />
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: Bento Grid Layout */}
          {previewView === 'bento' && (
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 max-w-2xl">
              {/* Card 1: Banner / Wide block */}
              <div 
                className="md:col-span-2 p-6 transition-all border border-transparent select-none relative"
                style={getCardStyle()}
              >
                <div className="space-y-3">
                  <span className="text-[10px] bg-brand/10 border border-brand/20 text-brand px-2 py-0.5 rounded-full font-mono font-bold">
                    Wide Module
                  </span>
                  <h4 className="text-base font-bold" style={{ color: canvasBg === 'light' || canvasBg === 'grid-light' ? '#09090b' : '#ffffff' }}>
                    Interactive Bento Column
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: canvasBg === 'light' || canvasBg === 'grid-light' ? '#4b5563' : '#a1a1aa' }}>
                    Adjust custom border-radius properties to blend shadows beautifully with container shapes.
                  </p>
                </div>
              </div>

              {/* Card 2: Small Square Info */}
              <div 
                className="p-6 transition-all border border-transparent select-none relative flex flex-col justify-between min-h-[140px]"
                style={getCardStyle()}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold font-mono text-sm">
                  99%
                </div>
                <div>
                  <h4 className="text-sm font-bold" style={{ color: canvasBg === 'light' || canvasBg === 'grid-light' ? '#09090b' : '#ffffff' }}>
                    Efficiency
                  </h4>
                  <p className="text-[10px] mt-0.5" style={{ color: canvasBg === 'light' || canvasBg === 'grid-light' ? '#4b5563' : '#a1a1aa' }}>
                    Minimal layout sizes
                  </p>
                </div>
              </div>

              {/* Card 3: Vertical Block */}
              <div 
                className="p-6 transition-all border border-transparent select-none relative flex flex-col justify-between min-h-[180px]"
                style={getCardStyle()}
              >
                <div className="space-y-2">
                  <div className="w-7 h-7 rounded bg-brand/10 text-brand flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold" style={{ color: canvasBg === 'light' || canvasBg === 'grid-light' ? '#09090b' : '#ffffff' }}>
                    Ambient Light
                  </h4>
                  <p className="text-[10px] leading-relaxed" style={{ color: canvasBg === 'light' || canvasBg === 'grid-light' ? '#4b5563' : '#a1a1aa' }}>
                    Calculates soft dynamic shadow distributions.
                  </p>
                </div>
                <div className="w-full h-1 bg-zinc-200/50 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-brand rounded-full" />
                </div>
              </div>

              {/* Card 4: Detailed Block */}
              <div 
                className="md:col-span-2 p-6 transition-all border border-transparent select-none relative flex flex-col justify-between"
                style={getCardStyle()}
              >
                <div className="space-y-2">
                  <h4 className="text-base font-bold" style={{ color: canvasBg === 'light' || canvasBg === 'grid-light' ? '#09090b' : '#ffffff' }}>
                    Multi-Layer Refraction
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: canvasBg === 'light' || canvasBg === 'grid-light' ? '#4b5563' : '#a1a1aa' }}>
                    Our advanced canvas stacks layers sequentially, creating smooth 3D offsets instead of single harsh black bands.
                  </p>
                </div>
                <div className="flex gap-1 pt-2">
                  {layers.map((l, i) => (
                    <div 
                      key={l.id} 
                      className={`h-1.5 rounded-full flex-1 ${l.active ? 'bg-brand' : 'bg-zinc-800'}`} 
                      title={`Layer ${i+1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Code Generation Output Panel */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Generated Code</h3>
            </div>
            <div className="flex gap-2">
              <button
                id="copy-css-btn"
                onClick={copyCSSCode}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-all"
              >
                {copiedCSS ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied CSS!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy CSS</span>
                  </>
                )}
              </button>

              <button
                id="copy-tailwind-btn"
                onClick={copyTailwindCode}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-all"
              >
                {copiedTailwind ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied Tailwind!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Tailwind</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code blocks */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block mb-1">STANDARD CSS PROPERTIES</span>
              <pre className="p-3 bg-zinc-900 border border-zinc-850 rounded-xl overflow-x-auto text-[11px] md:text-xs text-brand font-mono max-h-48 whitespace-pre-wrap leading-relaxed select-all">
                {`box-shadow: ${getBoxShadowValue()};
${isGlass ? `background: rgba(255, 255, 255, ${cardOpacity * 0.4});
backdrop-filter: blur(${backdropBlur}px);
-webkit-backdrop-filter: blur(${backdropBlur}px);` : `background-color: ${hexToRgba(cardColor, cardOpacity)};`}
border-radius: ${borderRadius}px;
${borderOpacity > 0 ? `border: 1px solid ${isGlass ? `rgba(255, 255, 255, ${borderOpacity / 100})` : `rgba(120, 120, 120, ${borderOpacity / 200})`};` : ''}`}
              </pre>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 font-mono block mb-1">TAILWIND UTILITY CLASSES</span>
              <pre className="p-3 bg-zinc-900 border border-zinc-850 rounded-xl overflow-x-auto text-[11px] md:text-xs text-amber-300 font-mono max-h-24 whitespace-pre-wrap leading-relaxed break-all select-all">
                {`shadow-[${getBoxShadowValue().replace(/\s+/g, ' ').trim()}] rounded-[${borderRadius}px] ${
                  isGlass 
                    ? `bg-white/40 backdrop-blur-[${backdropBlur}px] border border-white/20` 
                    : `bg-[${cardColor}]`
                }`}
              </pre>
            </div>
          </div>
        </div>

        {/* Detailed Explanation */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-brand mt-0.5 shrink-0" />
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                What makes smooth ambient shadows unique?
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Standard CSS generators typically output a single layer shadow (e.g. <code>box-shadow: 0 10px 15px rgba(0,0,0,0.1)</code>). In production web design, shadows are crafted by stacking <strong>multiple overlapping semi-transparent layers</strong>. 
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                By combining a tight high-opacity layer for a sharp base occlusion, a mid-tier layer for bulk shadow form, and a broad zero-spread layer with very high blur and low opacity, you get a realistic 3D shadow representing natural light dispersion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

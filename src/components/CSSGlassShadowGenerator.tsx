import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, RotateCcw, Sliders, Layers, Eye, EyeOff, Code, Sparkles, Info, Palette } from 'lucide-react';

interface CSSGlassShadowGeneratorProps {
  onBack?: () => void;
  clearInterface: boolean;
  setClearInterface: (v: boolean) => void;
}

export default function CSSGlassShadowGenerator({ 
  onBack, 
  clearInterface, 
  setClearInterface 
}: CSSGlassShadowGeneratorProps) {

  // Tabs: 'glass' or 'shadow'
  const [activeSubTab, setActiveSubTab] = useState<'glass' | 'shadow'>('glass');
  
  // Custom templates inside preview
  const [previewTemplate, setPreviewTemplate] = useState<'card' | 'credit' | 'login'>('card');
  
  // Preview Backdrops
  const [backdropTheme, setBackdropTheme] = useState<'mesh' | 'grid' | 'vibrant' | 'dark'>('mesh');

  // Copy success indicator
  const [copied, setCopied] = useState(false);
  const [codeType, setCodeType] = useState<'css' | 'tailwind'>('css');

  // --- Glassmorphism State Variables ---
  const [glassBgColor, setGlassBgColor] = useState('#ffffff');
  const [glassBgOpacity, setGlassBgOpacity] = useState(0.15);
  const [glassBlur, setGlassBlur] = useState(16);
  const [glassBorderColor, setGlassBorderColor] = useState('#ffffff');
  const [glassBorderOpacity, setGlassBorderOpacity] = useState(0.25);
  const [glassBorderWidth, setGlassBorderWidth] = useState(1);
  const [glassShadowOpacity, setGlassShadowOpacity] = useState(0.2);
  const [glassShadowBlur, setGlassShadowBlur] = useState(24);
  const [glassShadowSpread, setGlassShadowSpread] = useState(0);

  // --- Advanced Box Shadow State Variables ---
  const [shadowColor, setShadowColor] = useState('#000000');
  const [shadowOpacity, setShadowOpacity] = useState(0.4);
  const [shadowInset, setShadowInset] = useState(false);
  const [shadowOffsetX, setShadowOffsetX] = useState(0);
  const [shadowOffsetY, setShadowOffsetY] = useState(12);
  const [shadowBlur, setShadowBlurState] = useState(28);
  const [shadowSpread, setShadowSpreadState] = useState(-5);
  const [shadowBgColor, setShadowBgColor] = useState('#1e293b'); // slate-800
  const [shadowCardColor, setShadowCardColor] = useState('#334155'); // slate-700
  const [shadowCardRadius, setShadowCardRadius] = useState(16);

  // Reset logic
  const handleReset = () => {
    if (activeSubTab === 'glass') {
      setGlassBgColor('#ffffff');
      setGlassBgOpacity(0.15);
      setGlassBlur(16);
      setGlassBorderColor('#ffffff');
      setGlassBorderOpacity(0.25);
      setGlassBorderWidth(1);
      setGlassShadowOpacity(0.2);
      setGlassShadowBlur(24);
      setGlassShadowSpread(0);
    } else {
      setShadowColor('#000000');
      setShadowOpacity(0.4);
      setShadowInset(false);
      setShadowOffsetX(0);
      setShadowOffsetY(12);
      setShadowBlurState(28);
      setShadowSpreadState(-5);
      setShadowBgColor('#1e293b');
      setShadowCardColor('#334155');
      setShadowCardRadius(16);
    }
  };

  // Hex to RGBA conversion helper
  const hexToRgba = (hex: string, alpha: number) => {
    let r = 0, g = 0, b = 0;
    // 3 digits
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    }
    // 6 digits
    else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Generate Glassmorphism CSS styles
  const getGlassStyle = () => {
    const bgRGBA = hexToRgba(glassBgColor, glassBgOpacity);
    const borderRGBA = hexToRgba(glassBorderColor, glassBorderOpacity);
    return {
      background: bgRGBA,
      backdropFilter: `blur(${glassBlur}px)`,
      WebkitBackdropFilter: `blur(${glassBlur}px)`,
      border: `${glassBorderWidth}px solid ${borderRGBA}`,
      boxShadow: `0 8px ${glassShadowBlur}px ${glassShadowSpread}px rgba(0, 0, 0, ${glassShadowOpacity})`,
      borderRadius: '24px',
    };
  };

  // Generate Shadow CSS styles
  const getShadowStyle = () => {
    const rgba = hexToRgba(shadowColor, shadowOpacity);
    const insetStr = shadowInset ? 'inset ' : '';
    const shadowValue = `${insetStr}${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowSpread}px ${rgba}`;
    return {
      backgroundColor: shadowCardColor,
      boxShadow: shadowValue,
      borderRadius: `${shadowCardRadius}px`,
    };
  };

  // Formatted Code outputs
  const getCSSCode = () => {
    if (activeSubTab === 'glass') {
      const bgRGBA = hexToRgba(glassBgColor, glassBgOpacity);
      const borderRGBA = hexToRgba(glassBorderColor, glassBorderOpacity);
      return `/* Glassmorphism Compound Styling */
background: ${bgRGBA};
backdrop-filter: blur(${glassBlur}px);
-webkit-backdrop-filter: blur(${glassBlur}px);
border: ${glassBorderWidth}px solid ${borderRGBA};
box-shadow: 0 8px ${glassShadowBlur}px ${glassShadowSpread}px rgba(0, 0, 0, ${glassShadowOpacity});
border-radius: 24px;`;
    } else {
      const rgba = hexToRgba(shadowColor, shadowOpacity);
      const insetStr = shadowInset ? 'inset ' : '';
      return `/* Advanced Box Shadow Styling */
background-color: ${shadowCardColor};
border-radius: ${shadowCardRadius}px;
box-shadow: ${insetStr}${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowSpread}px ${rgba};`;
    }
  };

  const getTailwindCode = () => {
    if (activeSubTab === 'glass') {
      const bgRGBA = hexToRgba(glassBgColor, glassBgOpacity).replace(/\s+/g, '');
      const borderRGBA = hexToRgba(glassBorderColor, glassBorderOpacity).replace(/\s+/g, '');
      return `<!-- Glassmorphism Tailwind Classes -->
<div className="bg-[${bgRGBA}] backdrop-blur-[${glassBlur}px] border-[${glassBorderWidth}px] border-[${borderRGBA}] shadow-[0_8px_${glassShadowBlur}px_${glassShadowSpread}px_rgba(0,0,0,${glassShadowOpacity})] rounded-[24px]">
  <!-- Card Content -->
</div>`;
    } else {
      const rgba = hexToRgba(shadowColor, shadowOpacity).replace(/\s+/g, '');
      const insetStr = shadowInset ? 'inset_' : '';
      return `<!-- Box Shadow Tailwind Classes -->
<div className="bg-[${shadowCardColor}] rounded-[${shadowCardRadius}px] shadow-[${insetStr}${shadowOffsetX}px_${shadowOffsetY}px_${shadowBlur}px_${shadowSpread}px_${rgba}]">
  <!-- Card Content -->
</div>`;
    }
  };

  const handleCopyCode = () => {
    const code = codeType === 'css' ? getCSSCode() : getTailwindCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 relative">
      {/* Subtle Floating Controls Switcher when Zen Clear mode is enabled */}
      {clearInterface && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setClearInterface(false)}
            className="opacity-25 hover:opacity-100 focus:opacity-100 transition-opacity duration-300 px-4 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-1.5 cursor-pointer"
            title="Restore full configuration controls"
          >
            <Eye className="w-3.5 h-3.5 text-brand" />
            Show Controls
          </button>
        </div>
      )}

      {/* Title block */}
      {!clearInterface && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 beveled-panel bg-neutral-950/40 border border-neutral-900 rounded-2xl">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-brand" />
              CSS Glassmorphism &amp; Shadow Generator
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Design highly responsive CSS depth parameters, preview live interactive variations offline, and copy production-ready code blocks.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 text-neutral-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Dashboard
              </button>
            )}
            <button
              onClick={() => setClearInterface(!clearInterface)}
              className={`px-4 py-2 border text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer ${
                clearInterface 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                  : 'bg-neutral-900 border-neutral-850 hover:bg-neutral-850 text-neutral-300 hover:text-white'
              }`}
              title="Toggle clear interface mode by hiding configuration sliders"
            >
              {clearInterface ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {clearInterface ? "Standard Interface" : "Clear Interface"}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 text-neutral-300 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer"
              title="Reset to default presets"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Presets
            </button>
          </div>
        </div>
      )}

      {/* Main Tabs Selection / Workspace Type */}
      {!clearInterface && (
        <div className="flex border-b border-neutral-800">
          <button
            onClick={() => { setActiveSubTab('glass'); }}
            className={`px-6 py-3.5 text-sm font-semibold tracking-wider transition-all duration-300 border-b-2 relative ${
              activeSubTab === 'glass'
                ? 'text-brand border-brand bg-brand/5'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Glassmorphism Mode
            </span>
          </button>
          <button
            onClick={() => { setActiveSubTab('shadow'); }}
            className={`px-6 py-3.5 text-sm font-semibold tracking-wider transition-all duration-300 border-b-2 relative ${
              activeSubTab === 'shadow'
                ? 'text-brand border-brand bg-brand/5'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Advanced Box Shadow
            </span>
          </button>
        </div>
      )}

      {/* Core Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls Panel (5 Columns) */}
        {!clearInterface && (
          <div className="lg:col-span-5 space-y-6">
          <div className="beveled-panel bg-neutral-950/50 border border-neutral-850 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-neutral-850 pb-3">
              <Sliders className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                Adjust Variables
              </h3>
            </div>

            {/* Render GLASS Controls */}
            {activeSubTab === 'glass' && (
              <div className="space-y-5">
                {/* Background Color & Opacity Row */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300 font-medium">Glass Color</span>
                    <span className="text-neutral-400 font-mono">{glassBgColor}</span>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={glassBgColor}
                      onChange={(e) => setGlassBgColor(e.target.value)}
                      className="w-10 h-8 rounded border border-neutral-800 cursor-pointer bg-transparent"
                    />
                    <div className="flex-1 flex gap-1.5">
                      {['#ffffff', '#000000', '#3b82f6', '#ec4899', '#10b981'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setGlassBgColor(c)}
                          style={{ backgroundColor: c }}
                          className={`flex-1 h-8 rounded-md border text-[10px] text-transparent hover:border-white/50 transition cursor-pointer ${
                            glassBgColor === c ? 'border-brand' : 'border-neutral-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Glass Opacity Range */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300">Glass Opacity (Alpha)</span>
                    <span className="text-brand font-mono font-bold">{(glassBgOpacity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={glassBgOpacity}
                    onChange={(e) => setGlassBgOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>

                {/* Backdrop Blur Range */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300">Backdrop Blur Strength</span>
                    <span className="text-brand font-mono font-bold">{glassBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    value={glassBlur}
                    onChange={(e) => setGlassBlur(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>

                {/* Border Options */}
                <div className="border-t border-neutral-900 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Border settings</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-300">Border Color</span>
                      <span className="text-neutral-400 font-mono">{glassBorderColor}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={glassBorderColor}
                        onChange={(e) => setGlassBorderColor(e.target.value)}
                        className="w-8 h-7 rounded border border-neutral-800 cursor-pointer bg-transparent"
                      />
                      <div className="flex-1 flex gap-1">
                        {['#ffffff', '#000000', '#e2e8f0', '#3b82f6'].map((c) => (
                          <button
                            key={c}
                            onClick={() => setGlassBorderColor(c)}
                            style={{ backgroundColor: c }}
                            className={`flex-1 h-7 rounded border hover:border-white/40 transition cursor-pointer ${
                              glassBorderColor === c ? 'border-brand' : 'border-neutral-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-300">Width</span>
                        <span className="text-white font-mono font-medium">{glassBorderWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="1"
                        value={glassBorderWidth}
                        onChange={(e) => setGlassBorderWidth(parseInt(e.target.value))}
                        className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-brand"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-300">Opacity</span>
                        <span className="text-white font-mono font-medium">{(glassBorderOpacity * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={glassBorderOpacity}
                        onChange={(e) => setGlassBorderOpacity(parseFloat(e.target.value))}
                        className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-brand"
                      />
                    </div>
                  </div>
                </div>

                {/* Ambient Shadow Options */}
                <div className="border-t border-neutral-900 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Ambient Shadow</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-300">Shadow Opacity</span>
                      <span className="text-white font-mono">{(glassShadowOpacity * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.8"
                      step="0.01"
                      value={glassShadowOpacity}
                      onChange={(e) => setGlassShadowOpacity(parseFloat(e.target.value))}
                      className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-300">Blur</span>
                        <span className="text-white font-mono">{glassShadowBlur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={glassShadowBlur}
                        onChange={(e) => setGlassShadowBlur(parseInt(e.target.value))}
                        className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-brand"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-300">Spread</span>
                        <span className="text-white font-mono">{glassShadowSpread}px</span>
                      </div>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        step="1"
                        value={glassShadowSpread}
                        onChange={(e) => setGlassShadowSpread(parseInt(e.target.value))}
                        className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-brand"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Render ADVANCED BOX SHADOW Controls */}
            {activeSubTab === 'shadow' && (
              <div className="space-y-5">
                {/* Shadow Card Color & Inset */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-300">Card Base Color</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={shadowCardColor}
                        onChange={(e) => setShadowCardColor(e.target.value)}
                        className="w-8 h-8 rounded border border-neutral-800 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={shadowCardColor}
                        onChange={(e) => setShadowCardColor(e.target.value)}
                        className="flex-1 min-w-0 bg-neutral-900 border border-neutral-800 px-2 py-1 text-xs text-white rounded font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-300">Radius</span>
                      <span className="text-brand font-mono font-bold">{shadowCardRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="48"
                      step="1"
                      value={shadowCardRadius}
                      onChange={(e) => setShadowCardRadius(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                  </div>
                </div>

                {/* Shadow Color & Opacity */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300">Shadow Ambient Color</span>
                    <span className="text-neutral-400 font-mono">{shadowColor}</span>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={shadowColor}
                      onChange={(e) => setShadowColor(e.target.value)}
                      className="w-10 h-8 rounded border border-neutral-800 cursor-pointer bg-transparent"
                    />
                    <div className="flex-1 flex gap-2">
                      {['#000000', '#2563eb', '#db2777', '#059669'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setShadowColor(c)}
                          style={{ backgroundColor: c }}
                          className={`flex-1 h-8 rounded-md border hover:border-white/50 transition cursor-pointer ${
                            shadowColor === c ? 'border-brand' : 'border-neutral-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Inset and Opacity */}
                <div className="flex items-center justify-between border-t border-b border-neutral-900 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-300 text-xs font-medium">Render as Inset Shadow</span>
                  </div>
                  <button
                    onClick={() => setShadowInset(!shadowInset)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                      shadowInset
                        ? 'bg-brand/20 border-brand text-brand hover:bg-brand/30'
                        : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {shadowInset ? 'INSET: TRUE' : 'INSET: FALSE'}
                  </button>
                </div>

                {/* Shadow Opacity */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300">Shadow Opacity (Alpha)</span>
                    <span className="text-brand font-mono font-bold">{(shadowOpacity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={shadowOpacity}
                    onChange={(e) => setShadowOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>

                {/* Offset Controls X & Y */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-300">Offset X</span>
                      <span className="text-white font-mono font-medium">{shadowOffsetX}px</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={shadowOffsetX}
                      onChange={(e) => setShadowOffsetX(parseInt(e.target.value))}
                      className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-300">Offset Y</span>
                      <span className="text-white font-mono font-medium">{shadowOffsetY}px</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={shadowOffsetY}
                      onChange={(e) => setShadowOffsetY(parseInt(e.target.value))}
                      className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                  </div>
                </div>

                {/* Blur & Spread */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-300">Blur Radius</span>
                      <span className="text-white font-mono font-medium">{shadowBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={shadowBlur}
                      onChange={(e) => setShadowBlurState(parseInt(e.target.value))}
                      className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-300">Shadow Spread</span>
                      <span className="text-white font-mono font-medium">{shadowSpread}px</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={shadowSpread}
                      onChange={(e) => setShadowSpreadState(parseInt(e.target.value))}
                      className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                  </div>
                </div>

                {/* Canvas Background Color */}
                <div className="border-t border-neutral-900 pt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-300">Canvas Backdrop Match</span>
                    <span className="text-neutral-400 font-mono">{shadowBgColor}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={shadowBgColor}
                      onChange={(e) => setShadowBgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-neutral-800 cursor-pointer bg-transparent"
                    />
                    <div className="flex-1 flex gap-1">
                      {['#1e293b', '#0f172a', '#171717', '#ffffff'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setShadowBgColor(c)}
                          style={{ backgroundColor: c }}
                          className={`flex-1 h-8 rounded border hover:border-white/40 transition cursor-pointer ${
                            shadowBgColor === c ? 'border-brand' : 'border-neutral-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

        {/* RIGHT COLUMN: Interactive Preview & Code Export (7 Columns to 12 Columns when Zen) */}
        <div className={`${clearInterface ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-6`}>
          {/* Section A: Live Stage */}
          <div className="beveled-panel bg-neutral-950/40 border border-neutral-850 rounded-2xl overflow-hidden p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-850 pb-3">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-brand" />
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest">
                  Live Stage Preview
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Selector for Template inside the Card */}
                <span className="text-[10px] uppercase font-bold text-neutral-500">Preset Widget:</span>
                <div className="inline-flex rounded-lg p-0.5 bg-neutral-900 border border-neutral-800">
                  {(['card', 'credit', 'login'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPreviewTemplate(t)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md capitalize transition cursor-pointer ${
                        previewTemplate === t
                          ? 'bg-neutral-800 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {t === 'card' ? 'Minimal' : t === 'credit' ? 'Visa Card' : 'Sign In'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas Area with beautiful texture */}
            <div
              style={{
                backgroundColor: activeSubTab === 'shadow' ? shadowBgColor : undefined,
              }}
              className={`relative h-[340px] rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
                activeSubTab === 'glass' ? (
                  backdropTheme === 'mesh'
                    ? 'bg-gradient-to-tr from-rose-500 via-indigo-600 to-teal-500'
                    : backdropTheme === 'grid'
                    ? 'bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]'
                    : backdropTheme === 'vibrant'
                    ? 'bg-neutral-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-teal-500/5'
                    : 'bg-neutral-950'
                ) : ''
              }`}
            >
              {/* Decorative moving blur circles only for Glass view to show premium contrast */}
              {activeSubTab === 'glass' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {/* Neon Blob 1 */}
                  <div className="absolute top-1/4 left-1/3 w-32 h-32 rounded-full bg-pink-500/40 mix-blend-screen filter blur-xl animate-pulse" />
                  {/* Neon Blob 2 */}
                  <div className="absolute bottom-1/4 right-1/4 w-36 h-36 rounded-full bg-cyan-400/40 mix-blend-screen filter blur-xl" />
                  {/* High Quality Textured Mesh Backdrop */}
                  {backdropTheme === 'mesh' && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,0,0.2),transparent_40%),radial-gradient(circle_at_top_right,rgba(0,255,255,0.2),transparent_45%)]" />
                  )}
                </div>
              )}

              {/* The Central Visual Component Subject to CSS Parameters */}
              <div
                style={activeSubTab === 'glass' ? getGlassStyle() : getShadowStyle()}
                className="w-11/12 max-w-sm p-6 sm:p-7 select-none transition-all duration-100 z-10 text-left border"
              >
                {/* RENDER TEMPLATE CONTENT: MINIMAL CARD */}
                {previewTemplate === 'card' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        activeSubTab === 'glass'
                          ? 'bg-white/10 text-white/90 border border-white/20'
                          : 'bg-neutral-900/60 text-white border border-neutral-700/60'
                      }`}>
                        Premium Interface
                      </span>
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-white leading-tight">
                        Perfect Backdrop Refraction
                      </h4>
                      <p className={`text-xs mt-1.5 leading-relaxed ${
                        activeSubTab === 'glass' ? 'text-white/70' : 'text-neutral-300'
                      }`}>
                        This interactive layer generates pixel-perfect shadows and blur properties targeting production designs.
                      </p>
                    </div>
                    <div className="flex gap-2.5 pt-1.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activeSubTab === 'glass' ? 'bg-white/10 text-white' : 'bg-neutral-800 text-neutral-300'
                      }`}>
                        🎨
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] uppercase font-bold text-neutral-400">Rendering Engine</p>
                        <p className="text-xs font-bold text-white">GPU-Accelerated CSS</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* RENDER TEMPLATE CONTENT: MODERN CREDIT CARD */}
                {previewTemplate === 'credit' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold tracking-widest text-neutral-400">APEX SECURE</span>
                      <div className="w-9 h-6 bg-amber-400/80 rounded-md border border-amber-300/30 flex items-center justify-center text-[10px] font-bold text-amber-950 font-mono">
                        CHIP
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Credit Card Number</div>
                      <div className="text-lg sm:text-xl font-mono text-white tracking-widest font-semibold flex justify-between">
                        <span>4000</span> <span>1234</span> <span>5678</span> <span>9010</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end pt-2">
                      <div>
                        <div className="text-[9px] uppercase text-neutral-400 font-medium">Cardholder</div>
                        <div className="text-xs font-bold text-white font-mono tracking-wider">YASIN ALAM</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] uppercase text-neutral-400 font-medium">Expires</div>
                        <div className="text-xs font-bold text-white font-mono">06/28</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* RENDER TEMPLATE CONTENT: LOGIN FORM */}
                {previewTemplate === 'login' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="text-sm font-bold text-white tracking-wide">Enter Secure Workspace</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Please authorize credential locks</p>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Username"
                        disabled
                        className={`w-full text-xs px-3 py-2 rounded-lg bg-white/5 border text-white placeholder-white/30 outline-none leading-none ${
                          activeSubTab === 'glass' ? 'border-white/10' : 'border-neutral-700'
                        }`}
                      />
                      <input
                        type="password"
                        placeholder="••••••••"
                        disabled
                        className={`w-full text-xs px-3 py-2 rounded-lg bg-white/5 border text-white placeholder-white/30 outline-none leading-none ${
                          activeSubTab === 'glass' ? 'border-white/10' : 'border-neutral-700'
                        }`}
                      />
                    </div>
                    <button
                      disabled
                      className="w-full text-[11px] font-bold py-2 bg-brand/80 hover:bg-brand text-white rounded-lg uppercase tracking-wider transition opacity-80"
                    >
                      Authenticate Security Box
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Backdrop controls info only for Glass tab */}
            {activeSubTab === 'glass' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 bg-neutral-900/60 p-3 rounded-xl border border-neutral-850">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-brand" />
                  Try Live Contrast Backdrops:
                </span>
                <div className="flex gap-1.5 select-none">
                  {[
                    { id: 'mesh', label: 'Sunset Mesh' },
                    { id: 'grid', label: 'Cosmic Ray' },
                    { id: 'vibrant', label: 'Dotted Grid' },
                    { id: 'dark', label: 'Pitch Black' },
                  ].map((backdrop) => (
                    <button
                      key={backdrop.id}
                      onClick={() => setBackdropTheme(backdrop.id as any)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                        backdropTheme === backdrop.id
                          ? 'bg-neutral-800 border-neutral-700 text-white'
                          : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {backdrop.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section B: Export and Code Output */}
          <div className="beveled-panel bg-neutral-950/50 border border-neutral-850 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-brand" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Export Production Code
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCodeType('css')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    codeType === 'css'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Standard CSS
                </button>
                <button
                  onClick={() => setCodeType('tailwind')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    codeType === 'tailwind'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Tailwind CSS (Inline Style)
                </button>
              </div>
            </div>

            {/* Generated Code Window */}
            <div className="relative">
              <pre className="p-4 bg-neutral-950 border border-neutral-900 rounded-xl font-mono text-[11px] sm:text-xs text-brand overflow-x-auto leading-relaxed max-h-[160px] whitespace-pre-wrap select-all">
                <code>{codeType === 'css' ? getCSSCode() : getTailwindCode()}</code>
              </pre>

              <button
                onClick={handleCopyCode}
                className="absolute top-2 right-2 p-2 bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg flex items-center gap-1.5 transition text-xs font-semibold cursor-pointer select-none"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            {/* Friendly security notice/usage advice */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-900/30 border border-neutral-850 text-neutral-400 text-xs leading-relaxed">
              <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-300">Implementation Guideline</p>
                <p className="text-[11px] mt-0.5">
                  {activeSubTab === 'glass'
                    ? 'Ensure you have backdrop-filter enabled in your environment. Older Safari browsers require `-webkit-backdrop-filter` which is auto-generated inside this output code block.'
                    : 'Leverage ambient offsets and negative spread values to compile organic soft shadows that mesh perfectly with light or dark base backgrounds.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

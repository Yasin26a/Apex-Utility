import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Palette,
  Sparkles,
  Sliders,
  Copy,
  Check,
  RotateCcw,
  Layout,
  Layers,
  FileCode,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  Type,
  Square,
  Compass,
  ArrowRight,
  Info
} from 'lucide-react';

type EngineType = 'glass' | 'brutalist';

interface GlassConfig {
  blur: number;
  saturation: number;
  bgOpacity: number;
  bgColor: string;
  borderColor: string;
  borderOpacity: number;
  borderWidth: number;
  shadowColor: string;
  shadowBlur: number;
  shadowSpread: number;
  shadowOpacity: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  titleText: string;
  bodyText: string;
  badgeText: string;
  buttonText: string;
}

interface BrutalistConfig {
  bgColor: string;
  borderColor: string;
  borderWidth: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  borderRadius: number;
  titleText: string;
  bodyText: string;
  badgeText: string;
  buttonText: string;
  buttonBgColor: string;
  badgeBgColor: string;
  padding: number;
  isInteractive: boolean;
}

const PRESET_GLASS_BG = [
  'radial-gradient(circle at 10% 20%, rgb(253, 193, 104) 0%, rgb(251, 128, 128) 90%)',
  'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #10b981 100%)',
  'linear-gradient(45deg, #8b5cf6 0%, #ec4899 50%, #f43f5e 100%)',
  'radial-gradient(circle at top left, #34d399, #3b82f6, #ec4899)',
  'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 40px 40px'
];

const PRESETS_GLASS: Record<string, { name: string; config: GlassConfig }> = {
  frost: {
    name: 'Classic Frost',
    config: {
      blur: 16,
      saturation: 110,
      bgOpacity: 12,
      bgColor: '#ffffff',
      borderColor: '#ffffff',
      borderOpacity: 25,
      borderWidth: 1,
      shadowColor: '#000000',
      shadowBlur: 25,
      shadowSpread: 0,
      shadowOpacity: 15,
      shadowOffsetX: 0,
      shadowOffsetY: 8,
      titleText: 'Aura Interface',
      bodyText: 'Sleek backdrop filter styling for high-contrast translucent cards, headers, and UI sidebars.',
      badgeText: 'GLASSMorphic v2',
      buttonText: 'Initialize Core'
    }
  },
  aurora: {
    name: 'Vibrant Aurora',
    config: {
      blur: 24,
      saturation: 160,
      bgOpacity: 8,
      bgColor: '#1e1b4b',
      borderColor: '#c084fc',
      borderOpacity: 35,
      borderWidth: 1.5,
      shadowColor: '#a855f7',
      shadowBlur: 30,
      shadowSpread: 2,
      shadowOpacity: 25,
      shadowOffsetX: 0,
      shadowOffsetY: 12,
      titleText: 'Ethereal Space',
      bodyText: 'Intense background saturation with a soft colored border glint for rich cosmic applications.',
      badgeText: 'AURA SHIELD',
      buttonText: 'Launch Terminal'
    }
  },
  neon: {
    name: 'Cyberpunk Glow',
    config: {
      blur: 10,
      saturation: 130,
      bgOpacity: 20,
      bgColor: '#090d16',
      borderColor: '#06b6d4',
      borderOpacity: 60,
      borderWidth: 2,
      shadowColor: '#06b6d4',
      shadowBlur: 20,
      shadowSpread: 1,
      shadowOpacity: 45,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      titleText: 'Neon Grid Node',
      bodyText: 'High opacity futuristic viewport with neon border-glow and fast tactile action triggers.',
      badgeText: 'SYSTEM ACTIVE',
      buttonText: 'Execute Uplink'
    }
  }
};

const PRESETS_BRUTALIST: Record<string, { name: string; config: BrutalistConfig }> = {
  cyberLime: {
    name: 'Cyber Lime',
    config: {
      bgColor: '#a3e635',
      borderColor: '#000000',
      borderWidth: 4,
      shadowColor: '#000000',
      shadowOffsetX: 8,
      shadowOffsetY: 8,
      borderRadius: 0,
      titleText: 'VECTOR PARADIGM',
      bodyText: 'Neo-brutalism relies on stark layout elements, massive plain shadows, structural monospace labels, and extreme high-saturation contrast blocks.',
      badgeText: 'SYS_LOG_V1',
      buttonText: 'COMPILE SYSTEM',
      buttonBgColor: '#facc15',
      badgeBgColor: '#ffffff',
      padding: 24,
      isInteractive: true
    }
  },
  hotPink: {
    name: 'Retro Bubble',
    config: {
      bgColor: '#ec4899',
      borderColor: '#000000',
      borderWidth: 3,
      shadowColor: '#000000',
      shadowOffsetX: 6,
      shadowOffsetY: 6,
      borderRadius: 16,
      titleText: 'Bubble Core',
      bodyText: 'A slightly rounded playful alternative incorporating comic-bold aesthetics, vibrant pastel pinks, and solid hard button states.',
      badgeText: 'RETRO_PLAY',
      buttonText: 'BOOT CONSOLE',
      buttonBgColor: '#38bdf8',
      badgeBgColor: '#fef08a',
      padding: 20,
      isInteractive: true
    }
  },
  starkMinimal: {
    name: 'Monochrome Stark',
    config: {
      bgColor: '#ffffff',
      borderColor: '#000000',
      borderWidth: 5,
      shadowColor: '#000000',
      shadowOffsetX: 12,
      shadowOffsetY: 12,
      borderRadius: 4,
      titleText: 'MANIFESTO 02',
      bodyText: 'Zero gradients, zero soft blurs. Only absolute solid geometries, heavy pitch-black offsets, and strict layout honesty.',
      badgeText: 'ISSUE #42',
      buttonText: 'PROCEED NOW',
      buttonBgColor: '#ffffff',
      badgeBgColor: '#000000',
      padding: 28,
      isInteractive: true
    }
  }
};

export default function GlassBrutalistGenerator() {
  const [engine, setEngine] = useState<EngineType>('glass');

  // Preview options state
  const [glassBgIndex, setGlassBgIndex] = useState<number>(0);
  const [customGlassBg, setCustomGlassBg] = useState<string>('');

  // Engines configuration state
  const [glass, setGlass] = useState<GlassConfig>(PRESETS_GLASS.frost.config);
  const [brutalist, setBrutalist] = useState<BrutalistConfig>(PRESETS_BRUTALIST.cyberLime.config);

  // Copy success indicator state
  const [copiedFormat, setCopiedFormat] = useState<'css' | 'tailwind' | null>(null);

  // Load Presets handlers
  const handleLoadGlassPreset = (key: keyof typeof PRESETS_GLASS) => {
    setGlass({ ...PRESETS_GLASS[key].config });
  };

  const handleLoadBrutalistPreset = (key: keyof typeof PRESETS_BRUTALIST) => {
    setBrutalist({ ...PRESETS_BRUTALIST[key].config });
  };

  // Hex color utility helper
  const hexToRgba = (hex: string, opacityPercent: number): string => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(char => char + char).join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    const alpha = (opacityPercent / 100).toFixed(2);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Format generated raw CSS code output
  const generateCSSCode = (): string => {
    if (engine === 'glass') {
      const bgColorRgba = hexToRgba(glass.bgColor, glass.bgOpacity);
      const borderColorRgba = hexToRgba(glass.borderColor, glass.borderOpacity);
      const shadowRgba = hexToRgba(glass.shadowColor, glass.shadowOpacity);
      return `.glass-card {
  background: ${bgColorRgba};
  backdrop-filter: blur(${glass.blur}px) saturate(${glass.saturation}%);
  -webkit-backdrop-filter: blur(${glass.blur}px) saturate(${glass.saturation}%);
  border: ${glass.borderWidth}px solid ${borderColorRgba};
  border-radius: 24px;
  box-shadow: ${glass.shadowOffsetX}px ${glass.shadowOffsetY}px ${glass.shadowBlur}px ${glass.shadowSpread}px ${shadowRgba};
}`;
    } else {
      return `.brutalist-card {
  background-color: ${brutalist.bgColor};
  color: #000000;
  border: ${brutalist.borderWidth}px solid ${brutalist.borderColor};
  border-radius: ${brutalist.borderRadius}px;
  padding: ${brutalist.padding}px;
  box-shadow: ${brutalist.shadowOffsetX}px ${brutalist.shadowOffsetY}px 0px 0px ${brutalist.shadowColor};
  font-family: monospace;
}`;
    }
  };

  // Format generated Tailwind classes layout code
  const generateTailwindCode = (): string => {
    if (engine === 'glass') {
      // Approximate translation using tailwind configuration tokens
      return `<div class="bg-[${glass.bgColor}]/\[${glass.bgOpacity / 100}\] backdrop-blur-[${glass.blur}px] backdrop-saturate-[${glass.saturation}%] border-[${glass.borderWidth}px] border-[${glass.borderColor}]/\[${glass.borderOpacity / 100}\] rounded-3xl shadow-[${glass.shadowOffsetX}px_${glass.shadowOffsetY}px_${glass.shadowBlur}px_${glass.shadowSpread}px_rgba(0,0,0,0.15)]">
  <!-- Content -->
</div>`;
    } else {
      return `<div class="bg-[${brutalist.bgColor}] text-black border-[${brutalist.borderWidth}px] border-[${brutalist.borderColor}] rounded-[${brutalist.borderRadius}px] p-[${brutalist.padding}px] shadow-[${brutalist.shadowOffsetX}px_${brutalist.shadowOffsetY}px_0px_0px_${brutalist.shadowColor}] font-mono">
  <!-- Content -->
</div>`;
    }
  };

  const handleCopyCode = (format: 'css' | 'tailwind') => {
    const text = format === 'css' ? generateCSSCode() : generateTailwindCode();
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="space-y-6 text-white pb-10" id="glass-brutalist-workspace">
      
      {/* Header section with brand tags */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
              CSS ENGINE v4
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
              DOUBLE ARCHITECTURE
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Palette className="w-8 h-8 text-indigo-400" />
            CSS Glassmorphic &amp; Neo-Brutalist Generator
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Fine-tune modern translucent backdrops with high blur and vibrant saturations, or compose stark play-brutalist layouts with solid offsets and thick dark borders.
          </p>
        </div>

        {/* Engine picker tabs */}
        <div className="flex bg-slate-900 border border-white/10 p-1 rounded-2xl shrink-0 self-start md:self-center">
          <button
            onClick={() => setEngine('glass')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              engine === 'glass'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Engine A: Glassmorphism
          </button>
          <button
            onClick={() => setEngine('brutalist')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              engine === 'brutalist'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Square className="w-4 h-4" />
            Engine B: Neo-Brutalism
          </button>
        </div>
      </div>

      {/* Main split grid workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="style-generator-body">
        
        {/* LEFT COLUMN: LIVE CONTROLLERS & CONFIGURATION SLIDERS (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Preset templates selector bar */}
          <div className="bg-slate-900/80 border border-white/10 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Aesthetic Presets:</span>
            </div>

            {engine === 'glass' ? (
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(PRESETS_GLASS) as Array<keyof typeof PRESETS_GLASS>).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleLoadGlassPreset(key)}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-white/5 text-center truncate"
                  >
                    {PRESETS_GLASS[key].name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(PRESETS_BRUTALIST) as Array<keyof typeof PRESETS_BRUTALIST>).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleLoadBrutalistPreset(key)}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-white/5 text-center truncate"
                  >
                    {PRESETS_BRUTALIST[key].name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ENGINE A: GLASSMORPHIC PARAMETERS */}
          {engine === 'glass' && (
            <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Glass Backdrop Parameters
                </h3>
                <button
                  onClick={() => setGlass({ ...PRESETS_GLASS.frost.config })}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors"
                  title="Reset to defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>

              {/* Slider blur */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Backdrop Blur Filter:</span>
                  <span className="font-mono text-white font-bold">{glass.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={glass.blur}
                  onChange={(e) => setGlass({ ...glass, blur: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider Saturation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Backdrop Color Saturation:</span>
                  <span className="font-mono text-white font-bold">{glass.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="250"
                  step="5"
                  value={glass.saturation}
                  onChange={(e) => setGlass({ ...glass, saturation: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Background Color & Opacity Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-400 font-semibold uppercase">Backdrop Color:</label>
                  <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    <input
                      type="color"
                      value={glass.bgColor}
                      onChange={(e) => setGlass({ ...glass, bgColor: e.target.value })}
                      className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={glass.bgColor}
                      onChange={(e) => setGlass({ ...glass, bgColor: e.target.value })}
                      className="w-full bg-transparent border-0 font-mono text-xs text-white focus:outline-none focus:ring-0 uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold uppercase">
                    <span>Alpha Opacity:</span>
                    <span className="font-mono text-white">{glass.bgOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={glass.bgOpacity}
                    onChange={(e) => setGlass({ ...glass, bgOpacity: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg mt-2 cursor-pointer"
                  />
                </div>
              </div>

              {/* Border Color, Opacity & Width row */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-400 font-semibold uppercase">Border Glint Color:</label>
                  <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    <input
                      type="color"
                      value={glass.borderColor}
                      onChange={(e) => setGlass({ ...glass, borderColor: e.target.value })}
                      className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={glass.borderColor}
                      onChange={(e) => setGlass({ ...glass, borderColor: e.target.value })}
                      className="w-full bg-transparent border-0 font-mono text-xs text-white focus:outline-none focus:ring-0 uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold uppercase">
                    <span>Border Opacity:</span>
                    <span className="font-mono text-white">{glass.borderOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={glass.borderOpacity}
                    onChange={(e) => setGlass({ ...glass, borderOpacity: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg mt-2 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold uppercase">
                    <span>Border Width:</span>
                    <span className="font-mono text-white">{glass.borderWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.5"
                    value={glass.borderWidth}
                    onChange={(e) => setGlass({ ...glass, borderWidth: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg mt-2 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold uppercase">
                    <span>Glow Shadow Blur:</span>
                    <span className="font-mono text-white">{glass.shadowBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={glass.shadowBlur}
                    onChange={(e) => setGlass({ ...glass, shadowBlur: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg mt-2 cursor-pointer"
                  />
                </div>
              </div>

              {/* Shadow Color & Spread details row */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-400 font-semibold uppercase">Glow Shadow Color:</label>
                  <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    <input
                      type="color"
                      value={glass.shadowColor}
                      onChange={(e) => setGlass({ ...glass, shadowColor: e.target.value })}
                      className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={glass.shadowColor}
                      onChange={(e) => setGlass({ ...glass, shadowColor: e.target.value })}
                      className="w-full bg-transparent border-0 font-mono text-xs text-white focus:outline-none focus:ring-0 uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold uppercase">
                    <span>Glow Shadow Opacity:</span>
                    <span className="font-mono text-white">{glass.shadowOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={glass.shadowOpacity}
                    onChange={(e) => setGlass({ ...glass, shadowOpacity: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg mt-2 cursor-pointer"
                  />
                </div>
              </div>

              {/* Text customizable fields */}
              <div className="border-t border-white/5 pt-4 space-y-3">
                <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">Customizable Preview Content:</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500">Badge Text:</span>
                    <input
                      type="text"
                      value={glass.badgeText}
                      onChange={(e) => setGlass({ ...glass, badgeText: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500">Title Text:</span>
                    <input
                      type="text"
                      value={glass.titleText}
                      onChange={(e) => setGlass({ ...glass, titleText: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500">Paragraph Content:</span>
                  <input
                    type="text"
                    value={glass.bodyText}
                    onChange={(e) => setGlass({ ...glass, bodyText: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ENGINE B: NEO-BRUTALIST PARAMETERS */}
          {engine === 'brutalist' && (
            <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  Brutalist Layout Parameters
                </h3>
                <button
                  onClick={() => setBrutalist({ ...PRESETS_BRUTALIST.cyberLime.config })}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors"
                  title="Reset to defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>

              {/* Bold background color selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-400 font-semibold uppercase">Solid Card Background:</label>
                  <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    <input
                      type="color"
                      value={brutalist.bgColor}
                      onChange={(e) => setBrutalist({ ...brutalist, bgColor: e.target.value })}
                      className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brutalist.bgColor}
                      onChange={(e) => setBrutalist({ ...brutalist, bgColor: e.target.value })}
                      className="w-full bg-transparent border-0 font-mono text-xs text-white focus:outline-none focus:ring-0 uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-400 font-semibold uppercase">Solid Border Color:</label>
                  <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    <input
                      type="color"
                      value={brutalist.borderColor}
                      onChange={(e) => setBrutalist({ ...brutalist, borderColor: e.target.value })}
                      className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brutalist.borderColor}
                      onChange={(e) => setBrutalist({ ...brutalist, borderColor: e.target.value })}
                      className="w-full bg-transparent border-0 font-mono text-xs text-white focus:outline-none focus:ring-0 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Border Width & Border Radius Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold uppercase">
                    <span>Thick Border Stroke:</span>
                    <span className="font-mono text-white font-bold">{brutalist.borderWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={brutalist.borderWidth}
                    onChange={(e) => setBrutalist({ ...brutalist, borderWidth: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold uppercase">
                    <span>Border Corner Radius:</span>
                    <span className="font-mono text-white font-bold">{brutalist.borderRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    step="2"
                    value={brutalist.borderRadius}
                    onChange={(e) => setBrutalist({ ...brutalist, borderRadius: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Hard shadow offsets configuration */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold uppercase">
                    <span>Hard Shadow X:</span>
                    <span className="font-mono text-white font-bold">{brutalist.shadowOffsetX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-24"
                    max="24"
                    value={brutalist.shadowOffsetX}
                    onChange={(e) => setBrutalist({ ...brutalist, shadowOffsetX: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold uppercase">
                    <span>Hard Shadow Y:</span>
                    <span className="font-mono text-white font-bold">{brutalist.shadowOffsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-24"
                    max="24"
                    value={brutalist.shadowOffsetY}
                    onChange={(e) => setBrutalist({ ...brutalist, shadowOffsetY: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Shadow & Accent colors picker */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-400 font-semibold uppercase">Solid Shadow Color:</label>
                  <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    <input
                      type="color"
                      value={brutalist.shadowColor}
                      onChange={(e) => setBrutalist({ ...brutalist, shadowColor: e.target.value })}
                      className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brutalist.shadowColor}
                      onChange={(e) => setBrutalist({ ...brutalist, shadowColor: e.target.value })}
                      className="w-full bg-transparent border-0 font-mono text-xs text-white focus:outline-none focus:ring-0 uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-400 font-semibold uppercase">Solid Button Bg:</label>
                  <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    <input
                      type="color"
                      value={brutalist.buttonBgColor}
                      onChange={(e) => setBrutalist({ ...brutalist, buttonBgColor: e.target.value })}
                      className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brutalist.buttonBgColor}
                      onChange={(e) => setBrutalist({ ...brutalist, buttonBgColor: e.target.value })}
                      className="w-full bg-transparent border-0 font-mono text-xs text-white focus:outline-none focus:ring-0 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic text customizers */}
              <div className="border-t border-white/5 pt-4 space-y-3">
                <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">Customizable Brutalist Content:</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500">Tag / Badge:</span>
                    <input
                      type="text"
                      value={brutalist.badgeText}
                      onChange={(e) => setBrutalist({ ...brutalist, badgeText: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500">Card Title:</span>
                    <input
                      type="text"
                      value={brutalist.titleText}
                      onChange={(e) => setBrutalist({ ...brutalist, titleText: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500">Body Text paragraph:</span>
                  <input
                    type="text"
                    value={brutalist.bodyText}
                    onChange={(e) => setBrutalist({ ...brutalist, bodyText: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: PREVIEW ENVIRONMENT & EXPORT PATH CODES (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          
          {/* Visual Canvas Sandbox */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden flex-1 flex flex-col">
            
            {/* Header controls of the preview */}
            <div className="bg-slate-950 px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                  {engine === 'glass' ? 'Glassmorphism Live Sandbox' : 'Neo-Brutalism Live Sandbox'}
                </span>
              </div>

              {/* If glass engine, provide backdrop picker */}
              {engine === 'glass' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Backdrop pattern:</span>
                  <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-white/5">
                    {PRESET_GLASS_BG.map((bg, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setGlassBgIndex(idx);
                          setCustomGlassBg('');
                        }}
                        className={`w-4 h-4 rounded-full border transition-all ${
                          glassBgIndex === idx && !customGlassBg
                            ? 'border-white scale-110 ring-2 ring-indigo-500/50'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ background: bg }}
                        title={`Pattern Preset ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stage itself */}
            <div
              className="relative p-8 flex items-center justify-center min-h-[360px] flex-1 overflow-hidden transition-all duration-500"
              style={{
                background: engine === 'glass' ? PRESET_GLASS_BG[glassBgIndex] : '#ffffff',
                backgroundImage: engine === 'glass' ? undefined : 'radial-gradient(#000000 1.5px, transparent 1.5px)',
                backgroundSize: engine === 'glass' ? undefined : '24px 24px',
                backgroundColor: engine === 'glass' ? undefined : '#f3f4f6'
              }}
              id="style-preview-stage"
            >
              {/* Optional retro grid background label in Neo-Brutalism mode */}
              {engine === 'brutalist' && (
                <div className="absolute top-3 left-3 bg-black text-[#a3e635] border-2 border-black font-mono text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider pointer-events-none">
                  GRID_STAGE_ONLINE
                </div>
              )}

              {/* RENDER ENGINE A: GLASSMORPHISM CARD COMPOSER */}
              {engine === 'glass' && (
                <div
                  className="w-full max-w-sm rounded-3xl p-6 border transition-all relative overflow-hidden flex flex-col justify-between min-h-[260px]"
                  style={{
                    backgroundColor: hexToRgba(glass.bgColor, glass.bgOpacity),
                    backdropFilter: `blur(${glass.blur}px) saturate(${glass.saturation}%)`,
                    WebkitBackdropFilter: `blur(${glass.blur}px) saturate(${glass.saturation}%)`,
                    borderColor: hexToRgba(glass.borderColor, glass.borderOpacity),
                    borderWidth: `${glass.borderWidth}px`,
                    boxShadow: `${glass.shadowOffsetX}px ${glass.shadowOffsetY}px ${glass.shadowBlur}px ${glass.shadowSpread}px ${hexToRgba(glass.shadowColor, glass.shadowOpacity)}`
                  }}
                >
                  {/* Glare flare highlights */}
                  <div className="absolute top-0 left-0 w-full h-[150px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none -skew-y-12 scale-150 origin-top-left" />

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white tracking-widest uppercase border border-white/10">
                        {glass.badgeText || 'Badge'}
                      </span>
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xl font-extrabold text-white tracking-tight">
                        {glass.titleText || 'Title'}
                      </h4>
                      <p className="text-xs text-white/80 leading-relaxed font-sans">
                        {glass.bodyText || 'Click options on the left control panel to adjust background opacity and ambient glow shadows.'}
                      </p>
                    </div>
                  </div>

                  {/* Glassmorphic button active */}
                  <div className="mt-6 relative z-10 pt-2">
                    <button
                      className="w-full py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all border border-white/20 active:scale-[0.98] shadow-md"
                      style={{
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      {glass.buttonText || 'Proceed'}
                    </button>
                  </div>
                </div>
              )}

              {/* RENDER ENGINE B: NEO-BRUTALIST STARK CARD */}
              {engine === 'brutalist' && (
                <div
                  className="w-full max-w-sm border-black transition-all flex flex-col justify-between min-h-[260px] font-mono relative"
                  style={{
                    backgroundColor: brutalist.bgColor,
                    borderWidth: `${brutalist.borderWidth}px`,
                    borderRadius: `${brutalist.borderRadius}px`,
                    boxShadow: `${brutalist.shadowOffsetX}px ${brutalist.shadowOffsetY}px 0px 0px ${brutalist.shadowColor}`,
                    padding: `${brutalist.padding}px`
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      {/* stark badge tag */}
                      <span
                        className="px-2.5 py-1 text-[10px] font-extrabold border-2 border-black uppercase text-black"
                        style={{
                          backgroundColor: brutalist.badgeBgColor,
                          boxShadow: '2px 2px 0px 0px #000000',
                          borderRadius: brutalist.borderRadius > 8 ? '9999px' : '0px'
                        }}
                      >
                        {brutalist.badgeText || 'LOG_TAG'}
                      </span>

                      {/* playful vector star shape */}
                      <div className="text-black font-extrabold text-xs">⊞ INTERACTIVE</div>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="text-lg font-black text-black uppercase tracking-tight leading-none">
                        {brutalist.titleText || 'STARK VECTOR'}
                      </h4>
                      <p className="text-xs text-black font-semibold leading-relaxed">
                        {brutalist.bodyText || 'Thick stark outline structures with monochrome offsets.'}
                      </p>
                    </div>
                  </div>

                  {/* interactive action button */}
                  <div className="mt-6">
                    <button
                      className="w-full py-3 text-black font-black text-xs uppercase border-2 border-black transition-all"
                      style={{
                        backgroundColor: brutalist.buttonBgColor,
                        borderRadius: brutalist.borderRadius > 12 ? '12px' : '0px',
                        boxShadow: brutalist.isInteractive ? '4px 4px 0px 0px #000000' : 'none',
                        transform: brutalist.isInteractive ? 'translate(-2px, -2px)' : 'none'
                      }}
                    >
                      {brutalist.buttonText || 'TRIGGER'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* CODE EXPORTER GENERATOR DRAWER */}
          <div className="bg-slate-900 border border-white/10 p-5 rounded-2xl space-y-4 mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Layout Export Code</h4>
                  <p className="text-[11px] text-slate-500">Copy either standard vanilla CSS values or Tailwind utility layouts.</p>
                </div>
              </div>

              {/* format buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyCode('css')}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-all border border-white/5 flex items-center gap-1.5"
                >
                  {copiedFormat === 'css' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied CSS!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Raw CSS
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleCopyCode('tailwind')}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-all border border-white/5 flex items-center gap-1.5"
                >
                  {copiedFormat === 'tailwind' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied Utility!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Tailwind Code
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code preview editor window block */}
            <div className="bg-slate-950 p-4 rounded-xl border border-white/5 relative group">
              <pre className="font-mono text-xs text-indigo-300 leading-relaxed overflow-x-auto max-h-[160px] scrollbar-thin">
                {generateCSSCode()}
              </pre>

              <div className="absolute bottom-2 right-2 bg-slate-900/90 text-slate-500 font-mono text-[9px] px-2 py-0.5 rounded border border-white/5 uppercase select-none">
                {engine === 'glass' ? 'Glassmorphic Class rules' : 'Neo-Brutalist rules'}
              </div>
            </div>

            {/* Micro details notice info bar */}
            <div className="flex items-start gap-2.5 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 text-xs text-indigo-300">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Integration Tip:</span>{' '}
                {engine === 'glass' 
                  ? 'To render glassmorphic effects correctly on Chrome or Safari, always verify that your parent container elements do not block nested backdrop-filters.'
                  : 'Stark Neo-brutalist buttons look incredibly satisfying when you add a slight hover translation like active:translate-x-0.5 active:translate-y-0.5.'}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

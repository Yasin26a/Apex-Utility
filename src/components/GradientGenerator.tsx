import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, RefreshCw, Palette, Settings, Code, Sparkles } from 'lucide-react';

export default function GradientGenerator() {
  const [color1, setColor1] = useState('#4F46E5'); // Indigo 600
  const [color2, setColor2] = useState('#06B6D4'); // Cyan 500
  const [angle, setAngle] = useState(135);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  
  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedTailwind, setCopiedTailwind] = useState(false);

  const getCssString = () => {
    if (gradientType === 'linear') {
      return `background: linear-gradient(${angle}deg, ${color1}, ${color2});`;
    }
    return `background: radial-gradient(circle, ${color1}, ${color2});`;
  };

  const getTailwindClass = () => {
    // Generate simulated closest tailwind equivalents or arbitrary bracket values
    if (gradientType === 'radial') {
      return `bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-[${color1}] to-[${color2}]`;
    }
    
    let direction = 'bg-gradient-to-r';
    if (angle > 100 && angle < 170) direction = 'bg-gradient-to-br';
    if (angle >= 170 && angle <= 200) direction = 'bg-gradient-to-b';
    if (angle > 200 && angle < 260) direction = 'bg-gradient-to-bl';
    if (angle >= 260 && angle <= 280) direction = 'bg-gradient-to-l';

    return `${direction} from-[${color1}] to-[${color2}]`;
  };

  const handleCopyCss = () => {
    navigator.clipboard.writeText(getCssString());
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
  };

  const handleCopyTailwind = () => {
    navigator.clipboard.writeText(getTailwindClass());
    setCopiedTailwind(true);
    setTimeout(() => setCopiedTailwind(false), 2000);
  };

  const randomizeColors = () => {
    const randomHex = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setColor1(randomHex());
    setColor2(randomHex());
    setAngle(Math.floor(Math.random() * 360));
  };

  return (
    <div className="space-y-6" id="gradient-generator-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Palette className="w-6 h-6 text-indigo-400" />
          <span>Interactive Gradient Generator</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Craft modern backdrop gradients, set multi-color hex coordinates, adjust angles, and synthesize responsive CSS styles or Tailwind configuration classes instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor controls */}
        <div className="lg:col-span-5 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4 flex flex-col justify-between">
          <div className="space-y-4 text-xs">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gradient Parameters</span>
            </h3>

            {/* Linear vs Radial select */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">1. Projection geometry</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGradientType('linear')}
                  className={`py-2 text-center rounded border transition-all cursor-pointer font-mono font-bold text-[10px] ${
                    gradientType === 'linear'
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                      : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Linear directional
                </button>
                <button
                  onClick={() => setGradientType('radial')}
                  className={`py-2 text-center rounded border transition-all cursor-pointer font-mono font-bold text-[10px] ${
                    gradientType === 'radial'
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                      : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Radial centered
                </button>
              </div>
            </div>

            {/* Colors Select */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="space-y-1 bg-zinc-950 p-2.5 rounded border border-zinc-900">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">From Color</span>
                <div className="flex gap-2 items-center pt-1">
                  <input
                    type="color"
                    value={color1}
                    onChange={(e) => setColor1(e.target.value)}
                    className="w-8 h-7 bg-zinc-950 border border-zinc-900 rounded p-0.5 cursor-pointer"
                  />
                  <span className="font-mono text-zinc-300 uppercase">{color1}</span>
                </div>
              </div>

              <div className="space-y-1 bg-zinc-950 p-2.5 rounded border border-zinc-900">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">To Color</span>
                <div className="flex gap-2 items-center pt-1">
                  <input
                    type="color"
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    className="w-8 h-7 bg-zinc-950 border border-zinc-900 rounded p-0.5 cursor-pointer"
                  />
                  <span className="font-mono text-zinc-300 uppercase">{color2}</span>
                </div>
              </div>
            </div>

            {/* Angle direction slider */}
            {gradientType === 'linear' && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-zinc-400">2. Linear Angle Degree</span>
                  <span className="text-indigo-400 font-bold">{angle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-zinc-900">
            <button
              onClick={randomizeColors}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Randomize parameters</span>
            </button>
          </div>
        </div>

        {/* Preview Frame & Output codes */}
        <div className="lg:col-span-7 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between min-h-[400px] space-y-4">
          {/* Main big display block */}
          <div
            className="flex-1 w-full rounded-2xl border border-zinc-800 shadow-2xl relative overflow-hidden flex items-end p-4 min-h-[220px]"
            style={{
              background: gradientType === 'linear'
                ? `linear-gradient(${angle}deg, ${color1}, ${color2})`
                : `radial-gradient(circle, ${color1}, ${color2})`
            }}
          >
            <span className="text-[9px] font-mono font-bold uppercase bg-zinc-950/75 text-zinc-200 px-2.5 py-1 rounded-full backdrop-blur">
              Gradience preview viewport
            </span>
          </div>

          {/* Export rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {/* Standard CSS */}
            <div className="space-y-1.5 p-3.5 bg-zinc-950 border border-zinc-900 rounded-lg text-xs flex flex-col justify-between">
              <div className="space-y-1">
                <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                  CSS standard code
                </span>
                <code className="text-[10px] font-mono text-zinc-300 break-all leading-relaxed block max-h-12 overflow-y-auto">
                  {getCssString()}
                </code>
              </div>
              <button
                onClick={handleCopyCss}
                className="w-full py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded text-[10px] font-mono font-bold cursor-pointer"
              >
                {copiedCss ? 'Copied!' : 'Copy CSS'}
              </button>
            </div>

            {/* Tailwind utility */}
            <div className="space-y-1.5 p-3.5 bg-zinc-950 border border-zinc-900 rounded-lg text-xs flex flex-col justify-between">
              <div className="space-y-1">
                <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                  Tailwind CSS class block
                </span>
                <code className="text-[10px] font-mono text-zinc-300 break-all leading-relaxed block max-h-12 overflow-y-auto">
                  {getTailwindClass()}
                </code>
              </div>
              <button
                onClick={handleCopyTailwind}
                className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-mono font-bold cursor-pointer"
              >
                {copiedTailwind ? 'Copied!' : 'Copy Classes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

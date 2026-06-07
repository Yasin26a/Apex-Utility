import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, Ruler, Droplets, Thermometer, Copy, Check, ArrowRightLeft, 
  HelpCircle, Info, RefreshCw, Calculator, ClipboardCheck, Layers
} from 'lucide-react';
import { usePresets } from '../context/PresetContext';

type ConversionCategory = 'length' | 'weight' | 'volume' | 'temperature';

interface UnitOption {
  value: string;
  label: string;
  symbol: string;
  baseMultiplier?: number; // Relative to default selection (m for length, g for weight, l for volume)
}

const CATEGORY_UNITS: Record<ConversionCategory, UnitOption[]> = {
  length: [
    { value: 'mm', label: 'Millimeters', symbol: 'mm', baseMultiplier: 0.001 },
    { value: 'cm', label: 'Centimeters', symbol: 'cm', baseMultiplier: 0.01 },
    { value: 'm', label: 'Meters', symbol: 'm', baseMultiplier: 1 },
    { value: 'km', label: 'Kilometers', symbol: 'km', baseMultiplier: 1000 },
    { value: 'in', label: 'Inches', symbol: 'in', baseMultiplier: 0.0254 },
    { value: 'ft', label: 'Feet', symbol: 'ft', baseMultiplier: 0.3048 },
    { value: 'yd', label: 'Yards', symbol: 'yd', baseMultiplier: 0.9144 },
    { value: 'mi', label: 'Miles', symbol: 'mi', baseMultiplier: 1609.344 },
  ],
  weight: [
    { value: 'mg', label: 'Milligrams', symbol: 'mg', baseMultiplier: 0.001 },
    { value: 'g', label: 'Grams', symbol: 'g', baseMultiplier: 1 },
    { value: 'kg', label: 'Kilograms', symbol: 'kg', baseMultiplier: 1000 },
    { value: 'oz', label: 'Ounces', symbol: 'oz', baseMultiplier: 28.349523125 },
    { value: 'lb', label: 'Pounds', symbol: 'lb', baseMultiplier: 453.59237 },
    { value: 't', label: 'Metric Tons', symbol: 't', baseMultiplier: 1000000 },
  ],
  volume: [
    { value: 'ml', label: 'Milliliters', symbol: 'ml', baseMultiplier: 0.001 },
    { value: 'l', label: 'Liters', symbol: 'l', baseMultiplier: 1 },
    { value: 'tsp', label: 'Teaspoons (US)', symbol: 'tsp', baseMultiplier: 0.00492892 },
    { value: 'tbsp', label: 'Tablespoons (US)', symbol: 'tbsp', baseMultiplier: 0.0147868 },
    { value: 'fl-oz', label: 'Fluid Ounces (US)', symbol: 'fl oz', baseMultiplier: 0.0295735 },
    { value: 'cup', label: 'Cups (US)', symbol: 'cup', baseMultiplier: 0.236588 },
    { value: 'pint', label: 'Pints (US)', symbol: 'pt', baseMultiplier: 0.473176 },
    { value: 'quart', label: 'Quarts (US)', symbol: 'qt', baseMultiplier: 0.946353 },
    { value: 'gal', label: 'Gallons (US)', symbol: 'gal', baseMultiplier: 3.78541 },
  ],
  temperature: [
    { value: 'C', label: 'Celsius', symbol: '°C' },
    { value: 'F', label: 'Fahrenheit', symbol: '°F' },
    { value: 'K', label: 'Kelvin', symbol: 'K' },
  ],
};

const DEFAULT_FROM_UNITS: Record<ConversionCategory, string> = {
  length: 'm',
  weight: 'kg',
  volume: 'l',
  temperature: 'C',
};

const DEFAULT_TO_UNITS: Record<ConversionCategory, string> = {
  length: 'in',
  weight: 'lb',
  volume: 'fl-oz',
  temperature: 'F',
};

export default function UnitConverter() {
  const { activeSettings, updateActiveSettings } = usePresets();

  const [category, setCategory] = useState<ConversionCategory>(
    () => (activeSettings.converterCategory as ConversionCategory) || 'length'
  );
  const [inputValue, setInputValue] = useState<string>(
    () => activeSettings.converterInputValue?.toString() || '1'
  );
  const [fromUnit, setFromUnit] = useState<string>(
    () => activeSettings.converterFromUnit || DEFAULT_FROM_UNITS.length
  );
  const [toUnit, setToUnit] = useState<string>(
    () => activeSettings.converterToUnit || DEFAULT_TO_UNITS.length
  );

  const [copyState, setCopyState] = useState<boolean>(false);
  const [notif, setNotif] = useState<{ text: string; mode: 'success' | 'info' } | null>(null);

  // Trigger quick ambient toast feedback
  const triggerFeedback = (text: string, mode: 'success' | 'info' = 'success') => {
    setNotif({ text, mode });
    setTimeout(() => setNotif(null), 2500);
  };

  // Keep local selections in-sync with global settings preset changes
  useEffect(() => {
    if (activeSettings) {
      if (activeSettings.converterCategory && activeSettings.converterCategory !== category) {
        setCategory(activeSettings.converterCategory);
      }
      if (activeSettings.converterFromUnit && activeSettings.converterFromUnit !== fromUnit) {
        setFromUnit(activeSettings.converterFromUnit);
      }
      if (activeSettings.converterToUnit && activeSettings.converterToUnit !== toUnit) {
        setToUnit(activeSettings.converterToUnit);
      }
      if (activeSettings.converterInputValue !== undefined && activeSettings.converterInputValue.toString() !== inputValue) {
        setInputValue(activeSettings.converterInputValue.toString());
      }
    }
  }, [activeSettings]);

  // Sync state back to global PresetContext so users retain settings between tool views
  useEffect(() => {
    updateActiveSettings({
      converterCategory: category,
      converterFromUnit: fromUnit,
      converterToUnit: toUnit,
      converterInputValue: parseFloat(inputValue) || 0,
    });
  }, [category, fromUnit, toUnit, inputValue]);

  // Category change resets unit pairings to correct categorydefaults
  const handleCategoryChange = (cat: ConversionCategory) => {
    setCategory(cat);
    setFromUnit(DEFAULT_FROM_UNITS[cat]);
    setToUnit(DEFAULT_TO_UNITS[cat]);
  };

  const getSymbol = (cat: ConversionCategory, val: string) => {
    return CATEGORY_UNITS[cat].find(u => u.value === val)?.symbol || '';
  };

  const getLabel = (cat: ConversionCategory, val: string) => {
    return CATEGORY_UNITS[cat].find(u => u.value === val)?.label || '';
  };

  // Master Conversion Calculator algorithm
  const performConvert = (val: number, from: string, to: string, cat: ConversionCategory): number => {
    if (isNaN(val)) return 0;
    if (from === to) return val;

    if (cat === 'temperature') {
      if (from === 'C') {
        if (to === 'F') return (val * 9/5) + 32;
        if (to === 'K') return val + 273.15;
      } else if (from === 'F') {
        if (to === 'C') return (val - 32) * 5/9;
        if (to === 'K') return (val - 32) * 5/9 + 273.15;
      } else if (from === 'K') {
        if (to === 'C') return val - 273.15;
        if (to === 'F') return (val - 273.15) * 9/5 + 32;
      }
      return val;
    }

    // Standard metric to multiplier ratios
    const list = CATEGORY_UNITS[cat];
    const fromUnitObj = list.find(u => u.value === from);
    const toUnitObj = list.find(u => u.value === to);

    if (!fromUnitObj || !toUnitObj || !fromUnitObj.baseMultiplier || !toUnitObj.baseMultiplier) {
      return val;
    }

    // Convert input to base unit first
    const baseValue = val * fromUnitObj.baseMultiplier;
    // Divides by destination multipliers to find target scale
    return baseValue / toUnitObj.baseMultiplier;
  };

  const parsedValue = parseFloat(inputValue);
  const activeValue = isNaN(parsedValue) ? 0 : parsedValue;
  const convertedResult = performConvert(activeValue, fromUnit, toUnit, category);

  // Formats final response with smart rounding bounds
  const formatResult = (res: number) => {
    if (res === 0) return '0';
    if (Math.abs(res) < 0.00001) return res.toExponential(5);
    // Standard round index formatting 
    return parseFloat(res.toFixed(6)).toString();
  };

  const resultString = formatResult(convertedResult);

  // Copy-to-clipboard function
  const handleCopy = () => {
    const fromSymbol = getSymbol(category, fromUnit);
    const toSymbol = getSymbol(category, toUnit);
    const clipboardText = `${inputValue} ${fromSymbol} = ${resultString} ${toSymbol}`;
    
    navigator.clipboard.writeText(clipboardText).then(() => {
      setCopyState(true);
      triggerFeedback('Conversion copied to clipboard!');
      setTimeout(() => setCopyState(false), 2000);
    });
  };

  // Swapping utility
  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    triggerFeedback('Swapped input/output units.', 'info');
  };

  // Matrix generation for ambient list showing ALL unit conversions instantly
  const getAllConversions = () => {
    const units = CATEGORY_UNITS[category];
    return units
      .filter(u => u.value !== fromUnit)
      .map(u => {
        const valueConverted = performConvert(activeValue, fromUnit, u.value, category);
        return {
          unit: u.value,
          label: u.label,
          symbol: u.symbol,
          result: formatResult(valueConverted),
        };
      });
  };

  // Helper labels for explaining formulas
  const getFormulaExplanation = (): string => {
    if (category === 'temperature') {
      if (fromUnit === 'C' && toUnit === 'F') return 'Formula: (°C × 9/5) + 32';
      if (fromUnit === 'C' && toUnit === 'K') return 'Formula: °C + 273.15';
      if (fromUnit === 'F' && toUnit === 'C') return 'Formula: (°F − 32) × 5/9';
      if (fromUnit === 'F' && toUnit === 'K') return 'Formula: (°F − 32) × 5/9 + 273.15';
      if (fromUnit === 'K' && toUnit === 'C') return 'Formula: K − 273.15';
      if (fromUnit === 'K' && toUnit === 'F') return 'Formula: (K − 273.15) × 9/5 + 32';
      return 'Identical temperature values';
    }

    const list = CATEGORY_UNITS[category];
    const fromObj = list.find(u => u.value === fromUnit);
    const toObj = list.find(u => u.value === toUnit);

    if (fromObj && toObj && fromObj.baseMultiplier && toObj.baseMultiplier) {
      const multiplier = fromObj.baseMultiplier / toObj.baseMultiplier;
      return `Conversion factor: 1 ${fromObj.symbol} = ${parseFloat(multiplier.toFixed(8))} ${toObj.symbol}`;
    }
    return '';
  };

  return (
    <div id="unit-converter-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-8 select-none">
      
      {/* Visual Ambient Notification */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border font-mono text-xs shadow-2xl flex items-center gap-3 backdrop-blur-md ${
              notif.mode === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
                : 'bg-zinc-950/90 border-zinc-500/30 text-zinc-300'
            }`}
          >
            <ClipboardCheck className="w-5 h-5 text-emerald-400" />
            <span>{notif.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN - CATEGORY SELECTOR AND ARITHMETIC INPUT FORM (COL-7) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Panel 1: Convert Category Selector Switchboard */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-widest uppercase">Metric Category Unit Selection</h3>
            <span className="text-[10px] font-mono bg-brand/10 border border-brand/20 text-brand px-2 py-0.5 rounded capitalize">
              Client-side Resolver
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-900">
            {[
              { id: 'length', label: 'Length', icon: Ruler, text: 'text-sky-400' },
              { id: 'weight', label: 'Weight', icon: Scale, text: 'text-amber-400' },
              { id: 'volume', label: 'Volume', icon: Droplets, text: 'text-teal-400' },
              { id: 'temperature', label: 'Temperature', icon: Thermometer, text: 'text-rose-400' },
            ].map((catItem) => {
              const Icon = catItem.icon;
              const isActive = category === catItem.id;
              return (
                <button
                  key={catItem.id}
                  onClick={() => handleCategoryChange(catItem.id as ConversionCategory)}
                  className={`flex flex-col items-center justify-center py-3 rounded-lg border text-xs font-mono font-bold uppercase transition-all duration-300 gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-brand/10 border-brand/40 text-brand shadow-[0_0_15px_-3px_rgba(37,99,235,0.25)]'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : 'text-zinc-500'}`} />
                  <span>{catItem.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel 2: Master Conversion Form Pairing Card */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-6">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-widest uppercase">Conversion Values</h3>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Input Bounds</span>
          </div>

          {/* Numeric Entry Box */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Value to Convert</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-600 font-mono text-xs">val=</span>
              <input
                type="number"
                placeholder="Enter conversion digits..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-brand/60 rounded-xl py-3 pl-14 pr-4 text-xs font-mono text-white outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Selector columns of source and destination with beautiful swap buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            
            {/* Source unit list dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">From Unit selection</label>
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand/45 rounded-xl px-3.5 py-3 text-xs font-mono text-zinc-300 outline-none transition-all cursor-pointer"
              >
                {CATEGORY_UNITS[category].map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination unit list dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">To Unit selection</label>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand/45 rounded-xl px-3.5 py-3 text-xs font-mono text-zinc-300 outline-none transition-all cursor-pointer"
              >
                {CATEGORY_UNITS[category].map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Floating control triggers */}
            <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
              <button
                type="button"
                onClick={handleSwap}
                className="w-8 h-8 rounded-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-804 hover:border-brand/40 text-brand transition-all flex items-center justify-center shadow-lg cursor-pointer"
                title="Swap source and destination metrics"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick interactive swap guide for responsive narrow displays */}
          <div className="md:hidden pt-1">
            <button
              type="button"
              onClick={handleSwap}
              className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded-lg flex items-center justify-center gap-2 text-xs font-mono text-zinc-400 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-brand" />
              <span>Swap Source / Target</span>
            </button>
          </div>
        </div>

        {/* Panel 3: Information & Formulas Explanations Card */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-3">
          <div className="flex items-center gap-2 text-zinc-400 border-b border-brand-border/10 pb-2.5">
            <Info className="w-4 h-4 text-brand" />
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider">Formula Logic Guide</h4>
          </div>
          <p className="font-mono text-[10px] text-zinc-400">
            {getFormulaExplanation()}
          </p>
          <div className="flex gap-2 p-3 bg-zinc-950/40 rounded-lg border border-zinc-900 leading-relaxed text-[10px] text-zinc-500 font-sans">
            <HelpCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <span>
              All scientific unit parameters are computed using IEEE 754 precision constraints directly on your client hardware, guaranteeing absolute privacy. No database connections are open during calculations.
            </span>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN - LIVE OUTPUT SCREEN & FULL GRID INTERACTIVE ARRAY (COL-5) */}
      <div className="lg:col-span-5 space-y-6">

        {/* Panel 4: Immersive Live Preview Output Console */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-6 flex flex-col">
          
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <div className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="font-heading text-xs font-bold text-zinc-300 tracking-wider uppercase">Live Output Monitor</h3>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
              Vector Output
            </span>
          </div>

          {/* Master Visual Result Card */}
          <div className="relative bg-zinc-950 rounded-2xl border border-zinc-900 p-5 overflow-hidden flex flex-col justify-center items-center min-h-[160px] text-center select-text">
            {/* Grids design backdrop */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:14px_24px] opacity-25" />
            
            <div className="relative z-10 space-y-3 w-full">
              {/* Input view */}
              <div className="space-y-0.5">
                <span className="font-mono text-xs text-zinc-500 uppercase block">Input Vector</span>
                <span className="font-mono text-sm text-zinc-300 font-medium">
                  {inputValue || '0'} {getSymbol(category, fromUnit)}
                </span>
              </div>

              {/* Huge directional marker sign */}
              <div className="flex items-center justify-center text-zinc-800">
                <div className="h-[2px] bg-zinc-900 w-12 flex-1" />
                <span className="text-[9px] font-mono px-3 uppercase text-zinc-650 bg-zinc-950 border border-zinc-900 rounded-full py-0.5">
                  resolved output
                </span>
                <div className="h-[2px] bg-zinc-900 w-12 flex-1" />
              </div>

              {/* Evaluated target view */}
              <div className="space-y-0.5">
                <span className="font-mono text-xs text-brand uppercase block font-semibold">Equivalent Output</span>
                <div className="flex items-baseline justify-center gap-1.5 flex-wrap">
                  <span className="font-mono text-3xl font-extrabold text-white tracking-tight word-breakbreak">
                    {resultString}
                  </span>
                  <span className="font-mono text-lg font-bold text-brand uppercase">
                    {getSymbol(category, toUnit)}
                  </span>
                </div>
                <span className="text-[9px] text-zinc-550 block font-sans truncate">
                  {getLabel(category, toUnit)}
                </span>
              </div>
            </div>
          </div>

          {/* Live Action copy buttons */}
          <button
            onClick={handleCopy}
            className={`w-full py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider select-none border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              copyState
                ? 'bg-emerald-900/40 hover:bg-emerald-900/50 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-brand/40'
            }`}
          >
            {copyState ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-brand" />}
            <span>{copyState ? 'Copied Resolution!' : 'Copy to Clipboard'}</span>
          </button>
        </div>

        {/* Panel 5: Complete Instant Conversion Grid Matrix of that Category */}
        <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/80 space-y-3.5 flex flex-col">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand animate-pulse" />
              <h3 className="font-heading text-xs font-bold text-zinc-400 tracking-widest uppercase">Instant Matrix Match</h3>
            </div>
            <span className="text-[8px] font-mono text-zinc-500 select-none">
              All Units Comparison
            </span>
          </div>

          {/* Matrix items comparing input to ALL standard alternate categories units */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {getAllConversions().map((item) => (
              <div
                key={item.unit}
                className="p-2.5 bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-900 hover:border-zinc-850 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 leading-tight flex-1 min-w-0">
                  <span className="font-mono text-zinc-400 font-semibold block truncate" title={item.label}>
                    {item.label}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-650 tracking-wider">
                    Computed relative scale
                  </span>
                </div>
                <div className="flex items-baseline gap-1 shrink-0 bg-zinc-900/40 border border-zinc-900/60 px-2.5 py-1 rounded-lg">
                  <span className="font-mono text-sm font-bold text-white max-w-[130px] truncate block" title={item.result}>
                    {item.result}
                  </span>
                  <span className="font-mono text-[10px] text-brand/90 font-extrabold uppercase shrink-0">
                    {item.symbol}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

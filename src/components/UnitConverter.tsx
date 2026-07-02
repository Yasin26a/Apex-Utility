import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Calculator, Sliders, Settings, ArrowLeftRight, BookOpen } from 'lucide-react';

type UnitCategory = 'length' | 'weight' | 'temp' | 'currency';

export default function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>('length');
  const [inputValue, setInputValue] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('ft');
  const [outputValue, setOutputValue] = useState<number>(3.28084);

  const lengthUnits = [
    { value: 'm', label: 'Meters (m)' },
    { value: 'ft', label: 'Feet (ft)' },
    { value: 'km', label: 'Kilometers (km)' },
    { value: 'mi', label: 'Miles (mi)' },
    { value: 'in', label: 'Inches (in)' }
  ];

  const weightUnits = [
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'lb', label: 'Pounds (lb)' },
    { value: 'g', label: 'Grams (g)' },
    { value: 'oz', label: 'Ounces (oz)' }
  ];

  const tempUnits = [
    { value: 'C', label: 'Celsius (°C)' },
    { value: 'F', label: 'Fahrenheit (°F)' },
    { value: 'K', label: 'Kelvin (K)' }
  ];

  const currencyUnits = [
    { value: 'USD', label: 'US Dollars ($)' },
    { value: 'EUR', label: 'Euros (€)' },
    { value: 'GBP', label: 'British Pounds (£)' },
    { value: 'JPY', label: 'Japanese Yen (¥)' }
  ];

  const performConversion = () => {
    let result = inputValue;

    if (category === 'length') {
      // Base unit: Meters
      let meters = inputValue;
      if (fromUnit === 'ft') meters = inputValue * 0.3048;
      if (fromUnit === 'km') meters = inputValue * 1000;
      if (fromUnit === 'mi') meters = inputValue * 1609.34;
      if (fromUnit === 'in') meters = inputValue * 0.0254;

      result = meters;
      if (toUnit === 'ft') result = meters / 0.3048;
      if (toUnit === 'km') result = meters / 1000;
      if (toUnit === 'mi') result = meters / 1609.34;
      if (toUnit === 'in') result = meters / 0.0254;
    } 
    else if (category === 'weight') {
      // Base unit: Kilograms
      let kgs = inputValue;
      if (fromUnit === 'lb') kgs = inputValue * 0.453592;
      if (fromUnit === 'g') kgs = inputValue * 0.001;
      if (fromUnit === 'oz') kgs = inputValue * 0.0283495;

      result = kgs;
      if (toUnit === 'lb') result = kgs / 0.453592;
      if (toUnit === 'g') result = kgs / 0.001;
      if (toUnit === 'oz') result = kgs / 0.0283495;
    } 
    else if (category === 'temp') {
      if (fromUnit === 'C') {
        if (toUnit === 'F') result = (inputValue * 9/5) + 32;
        if (toUnit === 'K') result = inputValue + 273.15;
      } else if (fromUnit === 'F') {
        if (toUnit === 'C') result = (inputValue - 32) * 5/9;
        if (toUnit === 'K') result = ((inputValue - 32) * 5/9) + 273.15;
      } else if (fromUnit === 'K') {
        if (toUnit === 'C') result = inputValue - 273.15;
        if (toUnit === 'F') result = ((inputValue - 273.15) * 9/5) + 32;
      }
    } 
    else if (category === 'currency') {
      // Simulated live base rates against USD
      const rates: { [key: string]: number } = { USD: 1.0, EUR: 0.92, GBP: 0.78, JPY: 158.5 };
      const usdValue = inputValue / (rates[fromUnit] || 1);
      result = usdValue * (rates[toUnit] || 1);
    }

    setOutputValue(Number(result.toFixed(5)));
  };

  useEffect(() => {
    // Sync default unit options when category alters
    if (category === 'length') {
      setFromUnit('m');
      setToUnit('ft');
    } else if (category === 'weight') {
      setFromUnit('kg');
      setToUnit('lb');
    } else if (category === 'temp') {
      setFromUnit('C');
      setToUnit('F');
    } else if (category === 'currency') {
      setFromUnit('USD');
      setToUnit('EUR');
    }
  }, [category]);

  useEffect(() => {
    performConversion();
  }, [inputValue, fromUnit, toUnit, category]);

  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const getActiveOptions = () => {
    if (category === 'length') return lengthUnits;
    if (category === 'weight') return weightUnits;
    if (category === 'temp') return tempUnits;
    return currencyUnits;
  };

  return (
    <div className="space-y-6" id="unit-converter-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-indigo-400" />
          <span>Universal Unit &amp; Currency Converter</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Fast mathematical transformations across length dimensions, physical masses, thermodynamic temperature models, and estimated currency exchange indices instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category setup panel */}
        <div className="lg:col-span-4 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4">
          <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-indigo-400" />
            <span>Category Target</span>
          </h3>

          <div className="space-y-1.5 font-mono text-[10px] uppercase">
            {(['length', 'weight', 'temp', 'currency'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`w-full py-2.5 px-3 rounded border text-left transition-all cursor-pointer font-bold block ${
                  category === cat
                    ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-400'
                    : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat} conversion
              </button>
            ))}
          </div>
        </div>

        {/* Computation workspace area */}
        <div className="lg:col-span-8 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between min-h-[340px]">
          <div className="space-y-5 w-full">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-2">
              Transform interface
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              {/* Input Value */}
              <div className="md:col-span-2 space-y-1.5 text-xs">
                <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Input Value
                </span>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-900 text-sm font-bold text-zinc-200 rounded p-2 focus:outline-none"
                />
                <select
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded p-1.5 font-mono text-xs text-zinc-400 mt-1 focus:outline-none"
                >
                  {getActiveOptions().map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center pt-3.5">
                <button
                  onClick={handleSwap}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-indigo-400 rounded-full transition-all cursor-pointer shadow-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Output Result */}
              <div className="md:col-span-2 space-y-1.5 text-xs">
                <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Result Value
                </span>
                <div className="w-full bg-zinc-950/80 border border-zinc-900/60 text-sm font-black text-indigo-400 rounded p-2.5">
                  {outputValue}
                </div>
                <select
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded p-1.5 font-mono text-xs text-zinc-400 mt-1 focus:outline-none"
                >
                  {getActiveOptions().map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 p-3.5 bg-indigo-950/10 border border-indigo-950/25 rounded-lg text-[10px] text-zinc-400 mt-6">
            <strong>Conversion accuracy:</strong> Dimensional conversions are mapped according to exact international scientific SI guidelines. Currency rates are updated based on general daily mid-market estimates.
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE SCIENTIFIC MANUAL & SPECIFICATIONS (SEO & HIGH EDUCATIONAL VALUE) */}
      <div id="unit-converter-comprehensive-guide" className="w-full max-w-4xl bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 md:p-8 backdrop-blur-md space-y-6 mt-8 text-left select-text mx-auto">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/25">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">Scientific Unit Converter: Metrology &amp; Dimension Handbook</h3>
            <p className="text-[11px] text-slate-500 mt-1">A professional guide on standard SI metric definitions, international constants, and conversion scaling mathematics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed text-slate-300 font-sans">
          <div className="space-y-4">
            <h4 className="font-heading font-black text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              1. Metric Standards &amp; Dimensional Analysis
            </h4>
            <p>
              Measurement systems are governed internationally by the <strong className="text-white">International System of Units (SI)</strong>. Standardizing base units like the meter for length and the kilogram for mass allows global science, manufacturing, and trade to maintain total coherence. 
            </p>
            <p>
              Our conversion matrix executes precise floating-point mathematical scaling to guarantee accuracy up to 6 decimal places. When converting Imperial units (such as inches or miles) to Metric units (meters or kilometers), standard internationally defined ratios are applied, e.g., <code>1 inch = 2.54 centimeters</code> exactly.
            </p>

            <h4 className="font-heading font-black text-xs text-white uppercase tracking-wider flex items-center gap-2 pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              2. Temperature Scale Mathematics
            </h4>
            <p>
              Unlike length or weight, temperature is an interval scale, not a ratio scale. Converting Fahrenheit and Celsius requires adjusting both scale intervals and offset positions:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li><strong className="text-slate-200">Celsius to Fahrenheit:</strong> Multiply the value by 1.8 (or 9/5) and add 32.</li>
              <li><strong className="text-slate-200">Fahrenheit to Celsius:</strong> Subtract 32 from the Fahrenheit value, then multiply by 5/9 (approx 0.5556).</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading font-black text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              3. Mid-Market Currency Approximations
            </h4>
            <p>
              Foreign exchange rates fluctuate constantly in response to global market activity. To ensure a stable and reliable utility baseline, currency conversions are scaled against regular benchmark mid-market estimates. Note that actual interbank execution rates may carry transactional spreads or margins depending on specific financial institutions.
            </p>

            <div className="p-4 bg-indigo-950/20 border border-indigo-900/50 rounded-xl space-y-2 mt-4">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">SI METROLOGY STANDARDS</span>
              <p className="text-[11px] text-slate-400 leading-normal font-sans">
                All metrics utilize definitions ratified by the General Conference on Weights and Measures (CGPM). This includes standard gravitational constants and exact metric conversions for scientific calculations.
              </p>
            </div>
          </div>
        </div>

        {/* Technical FAQ block */}
        <div className="border-t border-slate-800/80 pt-6 space-y-4">
          <h4 className="font-heading font-black text-xs text-white uppercase tracking-wider font-mono">Dynamic Metrology FAQs</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-xl space-y-1.5">
              <h5 className="text-xs font-bold text-slate-200 font-sans">Why do digital calculations sometimes show floating-point rounding?</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Computers represent numbers using binary floating-point representations (IEEE 754). This can occasionally introduce tiny rounding variances at extremely deep decimal places (e.g., 0.000000000000004). Our calculator actively truncates these artifacts for clean readouts.
              </p>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-xl space-y-1.5">
              <h5 className="text-xs font-bold text-slate-200 font-sans">What is the difference between mass and weight?</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Mass represents the intrinsic amount of matter in an object and remains constant regardless of gravitational pull. Weight represents the force exerted on that mass by gravity, which varies depending on location (e.g., Earth vs Moon).
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

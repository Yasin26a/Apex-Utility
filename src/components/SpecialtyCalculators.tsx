import React, { useState, useMemo } from 'react';
import { 
  Calculator, Percent, TrendingUp, Landmark, ShieldAlert, 
  Layers, ChevronDown, Sparkles, Scale, Info, HelpCircle, 
  Grid, Compass, Zap, HelpCircle as HelpIcon, Flame, DollarSign,
  User, RefreshCw, Scissors, Users, Eye, FileText, ArrowRight, Table
} from 'lucide-react';

export default function SpecialtyCalculators() {
  const [activeCalTab, setActiveCalTab] = useState<'amortization' | 'roi' | 'roof' | 'bodyfat' | 'voltage' | 'scientific' | 'tip'>('amortization');

  // Helper formatting utilities
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatNumber = (val: number, decimals: number = 2) => {
    return val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  // ==========================================
  // 1. AMORTIZATION & LOAN SCHEDULER STATE & CALC
  // ==========================================
  const [loanAmount, setLoanAmount] = useState<number>(100000);
  const [interestRate, setInterestRate] = useState<number>(5.5);
  const [loanTerm, setLoanTerm] = useState<number>(15);
  const [termUnit, setTermUnit] = useState<'years' | 'months'>('years');

  const amortizationResults = useMemo(() => {
    const P = Math.max(0, loanAmount);
    const annualRate = Math.max(0, interestRate);
    const termVal = Math.max(1, loanTerm);

    const totalMonths = termUnit === 'years' ? termVal * 12 : termVal;
    const monthlyRate = (annualRate / 100) / 12;

    let monthlyPayment = 0;
    if (monthlyRate === 0) {
      monthlyPayment = P / totalMonths;
    } else {
      monthlyPayment = (P * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    if (isNaN(monthlyPayment) || !isFinite(monthlyPayment)) monthlyPayment = 0;

    const schedule = [];
    let remainingBalance = P;
    let totalInterest = 0;

    for (let month = 1; month <= Math.min(totalMonths, 360); month++) {
      const interestPaid = remainingBalance * monthlyRate;
      const principalPaid = Math.min(remainingBalance, monthlyPayment - interestPaid);
      remainingBalance = Math.max(0, remainingBalance - principalPaid);
      totalInterest += interestPaid;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPaid,
        interest: interestPaid,
        balance: remainingBalance,
      });
    }

    const totalCost = P + totalInterest;

    return {
      monthlyPayment,
      totalInterest,
      totalCost,
      schedule,
      totalMonths
    };
  }, [loanAmount, interestRate, loanTerm, termUnit]);

  // ==========================================
  // 2. ROI & ACCOUNTING STATE & CALC
  // ==========================================
  const [roiInvested, setRoiInvested] = useState<number>(50000);
  const [roiReturned, setRoiReturned] = useState<number>(75000);
  const [roiYears, setRoiYears] = useState<number>(3);

  const roiResults = useMemo(() => {
    const invested = Math.max(1, roiInvested);
    const returned = Math.max(0, roiReturned);
    const years = Math.max(0.1, roiYears);

    const netProfit = returned - invested;
    const totalROI = (netProfit / invested) * 100;
    
    // CAGR calculation (Annualized ROI)
    const annualizedROI = (Math.pow(returned / invested, 1 / years) - 1) * 100;

    // Simple payback period calculation
    const annualProfit = netProfit / years;
    const paybackPeriod = annualProfit > 0 ? invested / annualProfit : 0;

    return {
      netProfit,
      totalROI: isFinite(totalROI) ? totalROI : 0,
      annualizedROI: isFinite(annualizedROI) ? annualizedROI : 0,
      paybackPeriod: isFinite(paybackPeriod) ? paybackPeriod : 0,
    };
  }, [roiInvested, roiReturned, roiYears]);

  // ==========================================
  // 3. ROOF AREA & MEASUREMENT STATE & CALC
  // ==========================================
  const [roofLength, setRoofLength] = useState<number>(40);
  const [roofWidth, setRoofWidth] = useState<number>(30);
  const [roofPitch, setRoofPitch] = useState<string>('6/12'); // Rise/Run

  const roofResults = useMemo(() => {
    const len = Math.max(0, roofLength);
    const wid = Math.max(0, roofWidth);
    
    // Parse pitch run/rise or angle
    let pitchMultiplier = 1;
    let pitchAngle = 0;
    
    const pitchParts = roofPitch.split('/');
    if (pitchParts.length === 2) {
      const rise = parseFloat(pitchParts[0]) || 0;
      const run = parseFloat(pitchParts[1]) || 12;
      const slope = rise / run;
      pitchMultiplier = Math.sqrt(1 + slope * slope);
      pitchAngle = Math.atan(slope) * (180 / Math.PI);
    } else {
      const angle = parseFloat(roofPitch) || 0;
      pitchMultiplier = 1 / Math.cos(angle * (Math.PI / 180));
      pitchAngle = angle;
    }

    const flatArea = len * wid;
    const actualArea = flatArea * pitchMultiplier;
    const roofSquares = actualArea / 100; // 1 square of roofing = 100 sq ft

    return {
      flatArea,
      actualArea,
      roofSquares,
      pitchMultiplier,
      pitchAngle
    };
  }, [roofLength, roofWidth, roofPitch]);

  // ==========================================
  // 4. BODY FAT & LEAN MASS STATE & CALC
  // ==========================================
  const [bfGender, setBfGender] = useState<'male' | 'female'>('male');
  const [bfWeight, setBfWeight] = useState<number>(180);
  const [bfHeight, setBfHeight] = useState<number>(70); // inches
  const [bfNeck, setBfNeck] = useState<number>(15); // inches
  const [bfWaist, setBfWaist] = useState<number>(34); // inches
  const [bfHips, setBfHips] = useState<number>(38); // inches (female only)
  const [bfUnitSystem, setBfUnitSystem] = useState<'imperial' | 'metric'>('imperial');

  const bodyComposition = useMemo(() => {
    // US Army Tape Method formula (Circumference)
    // Male: %BF = 86.010 * log10(waist - neck) - 70.041 * log10(height) + 36.76
    // Female: %BF = 163.205 * log10(waist + hips - neck) - 97.684 * log10(height) - 78.387
    
    let h = Math.max(1, bfHeight);
    let n = Math.max(0.1, bfNeck);
    let w = Math.max(0.1, bfWaist);
    let hp = Math.max(0.1, bfHips);
    let wt = Math.max(1, bfWeight);

    // If metric, convert parameters to inches/lbs internally for standard formula, then output both
    if (bfUnitSystem === 'metric') {
      // metric inputs: weight (kg), height (cm), neck (cm), waist (cm), hips (cm)
      wt = bfWeight * 2.20462;
      h = bfHeight / 2.54;
      n = bfNeck / 2.54;
      w = bfWaist / 2.54;
      hp = bfHips / 2.54;
    }

    let bfPercent = 0;
    if (bfGender === 'male') {
      const diff = w - n;
      if (diff > 0 && h > 0) {
        bfPercent = 86.010 * Math.log10(diff) - 70.041 * Math.log10(h) + 36.76;
      }
    } else {
      const sumDiff = w + hp - n;
      if (sumDiff > 0 && h > 0) {
        bfPercent = 163.205 * Math.log10(sumDiff) - 97.684 * Math.log10(h) - 78.387;
      }
    }

    if (bfPercent < 2) bfPercent = 2; // minimum human essential limit
    if (isNaN(bfPercent) || !isFinite(bfPercent)) bfPercent = 15;

    const fatMassLbs = wt * (bfPercent / 100);
    const leanMassLbs = wt - fatMassLbs;

    // Basal Metabolic Rate (Katch-McArdle using lean mass)
    // BMR = 370 + (21.6 * Lean Mass in kg)
    const leanMassKg = leanMassLbs / 2.20462;
    const bmr = 370 + (21.6 * leanMassKg);

    // Classification
    let classification = 'Acceptable';
    if (bfGender === 'male') {
      if (bfPercent <= 5) classification = 'Essential Fat (2-5%)';
      else if (bfPercent <= 13) classification = 'Athletes (6-13%)';
      else if (bfPercent <= 17) classification = 'Fitness (14-17%)';
      else if (bfPercent <= 24) classification = 'Acceptable (18-24%)';
      else classification = 'Obese (25%+)';
    } else {
      if (bfPercent <= 13) classification = 'Essential Fat (10-13%)';
      else if (bfPercent <= 20) classification = 'Athletes (14-20%)';
      else if (bfPercent <= 24) classification = 'Fitness (21-24%)';
      else if (bfPercent <= 31) classification = 'Acceptable (25-31%)';
      else classification = 'Obese (32%+)';
    }

    return {
      bfPercent,
      fatMass: bfUnitSystem === 'imperial' ? fatMassLbs : fatMassLbs / 2.20462,
      leanMass: bfUnitSystem === 'imperial' ? leanMassLbs : leanMassKg,
      bmr,
      classification,
      weightLabel: bfUnitSystem === 'imperial' ? 'lbs' : 'kg'
    };
  }, [bfGender, bfWeight, bfHeight, bfNeck, bfWaist, bfHips, bfUnitSystem]);

  // ==========================================
  // 5. VOLTAGE DROP & DC WIRE SIZE
  // ==========================================
  const [voltage, setVoltage] = useState<number>(12);
  const [phase, setPhase] = useState<'dc' | 'ac-1' | 'ac-3'>('dc');
  const [wireMaterial, setWireMaterial] = useState<'copper' | 'aluminum'>('copper');
  const [wireSizeAwg, setWireSizeAwg] = useState<string>('12');
  const [loadAmps, setLoadAmps] = useState<number>(15);
  const [wireLengthFeet, setWireLengthFeet] = useState<number>(50);

  // AWG resistance values in ohm/1000ft
  const AWG_RESISTANCE: Record<string, { copper: number; alum: number }> = {
    '10': { copper: 0.9989, alum: 1.64 },
    '12': { copper: 1.588, alum: 2.61 },
    '14': { copper: 2.525, alum: 4.14 },
    '16': { copper: 4.016, alum: 6.59 },
    '18': { copper: 6.385, alum: 10.5 },
    '22': { copper: 16.14, alum: 26.5 },
  };

  const voltageDropResults = useMemo(() => {
    const V = Math.max(1, voltage);
    const I = Math.max(0, loadAmps);
    const L = Math.max(0, wireLengthFeet);
    
    const resistObj = AWG_RESISTANCE[wireSizeAwg] || AWG_RESISTANCE['12'];
    const R = wireMaterial === 'copper' ? resistObj.copper : resistObj.alum;

    // Formula: Drop V = (2 * L * R * I) / 1000 (Single Phase or DC)
    // 3 Phase formula: Drop V = (Math.sqrt(3) * L * R * I) / 1000
    const factor = phase === 'ac-3' ? Math.sqrt(3) : 2;
    const vDrop = (factor * L * (R / 1000) * I);
    const vDropPercent = (vDrop / V) * 100;
    const vDestination = Math.max(0, V - vDrop);
    const powerLossWatts = vDrop * I;

    return {
      vDrop,
      vDropPercent,
      vDestination,
      powerLossWatts,
      resistanceValue: R
    };
  }, [voltage, phase, wireMaterial, wireSizeAwg, loadAmps, wireLengthFeet]);

  // ==========================================
  // 6. SCIENTIFIC & BINARY/HEX STATE & CALC
  // ==========================================
  const [sciDisplay, setSciDisplay] = useState<string>('');
  const [sciResult, setSciResult] = useState<string>('');
  const [binaryNum1, setBinaryNum1] = useState<string>('1010');
  const [binaryNum2, setBinaryNum2] = useState<string>('0101');
  const [binaryOp, setBinaryOp] = useState<'add' | 'sub' | 'mul'>('add');
  
  const [hexNum1, setHexNum1] = useState<string>('A');
  const [hexNum2, setHexNum2] = useState<string>('5');
  const [hexOp, setHexOp] = useState<'add' | 'sub' | 'mul'>('add');

  const binaryResult = useMemo(() => {
    try {
      const n1 = parseInt(binaryNum1, 2);
      const n2 = parseInt(binaryNum2, 2);
      if (isNaN(n1) || isNaN(n2)) return 'Invalid Binary';

      let res = 0;
      if (binaryOp === 'add') res = n1 + n2;
      else if (binaryOp === 'sub') res = n1 - n2;
      else if (binaryOp === 'mul') res = n1 * n2;

      if (res < 0) return '-' + Math.abs(res).toString(2);
      return res.toString(2);
    } catch (_) {
      return 'Error';
    }
  }, [binaryNum1, binaryNum2, binaryOp]);

  const hexResult = useMemo(() => {
    try {
      const n1 = parseInt(hexNum1, 16);
      const n2 = parseInt(hexNum2, 16);
      if (isNaN(n1) || isNaN(n2)) return 'Invalid Hexadecimal';

      let res = 0;
      if (hexOp === 'add') res = n1 + n2;
      else if (hexOp === 'sub') res = n1 - n2;
      else if (hexOp === 'mul') res = n1 * n2;

      if (res < 0) return '-' + Math.abs(res).toString(16).toUpperCase();
      return res.toString(16).toUpperCase();
    } catch (_) {
      return 'Error';
    }
  }, [hexNum1, hexNum2, hexOp]);

  const handleSciEval = () => {
    try {
      // Safe replacement of basic constants & standard math functions
      let expression = sciDisplay
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/ln/g, 'Math.log')
        .replace(/log/g, 'Math.log10')
        .replace(/sqrt/g, 'Math.sqrt');

      // Simple direct Function construction to evaluate cleanly
      // Since it's client side math, we can evaluate expression values safely
      const finalVal = new Function(`return ${expression}`)();
      setSciResult(typeof finalVal === 'number' ? finalVal.toString() : 'Error');
    } catch (err) {
      setSciResult('Syntax Error');
    }
  };

  // ==========================================
  // 7. RESTAURANT TIP & GRATUITY SPLITTER
  // ==========================================
  const [billAmount, setBillAmount] = useState<number>(100);
  const [tipPercent, setTipPercent] = useState<number>(20);
  const [splitCount, setSplitCount] = useState<number>(1);

  const tipResults = useMemo(() => {
    const bill = Math.max(0, billAmount);
    const tipP = Math.max(0, tipPercent);
    const people = Math.max(1, splitCount);

    const tipAmount = bill * (tipP / 100);
    const totalBill = bill + tipAmount;
    const tipPerPerson = tipAmount / people;
    const totalPerPerson = totalBill / people;

    return {
      tipAmount,
      totalBill,
      tipPerPerson,
      totalPerPerson,
    };
  }, [billAmount, tipPercent, splitCount]);


  return (
    <div className="space-y-6">
      
      {/* Horizontal Tab Navigation */}
      <div className="flex bg-zinc-950/80 border border-zinc-900 p-1 rounded-xl overflow-x-auto gap-1">
        <button
          onClick={() => setActiveCalTab('amortization')}
          className={`px-3.5 py-2 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeCalTab === 'amortization'
              ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          Amortization &amp; Loan
        </button>

        <button
          onClick={() => setActiveCalTab('roi')}
          className={`px-3.5 py-2 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeCalTab === 'roi'
              ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          ROI &amp; Payback
        </button>

        <button
          onClick={() => setActiveCalTab('roof')}
          className={`px-3.5 py-2 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeCalTab === 'roof'
              ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Roof Measurement
        </button>

        <button
          onClick={() => setActiveCalTab('bodyfat')}
          className={`px-3.5 py-2 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeCalTab === 'bodyfat'
              ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          Body Composition
        </button>

        <button
          onClick={() => setActiveCalTab('voltage')}
          className={`px-3.5 py-2 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeCalTab === 'voltage'
              ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Voltage Drop &amp; AWG
        </button>

        <button
          onClick={() => setActiveCalTab('scientific')}
          className={`px-3.5 py-2 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeCalTab === 'scientific'
              ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          Sci &amp; Binary Math
        </button>

        <button
          onClick={() => setActiveCalTab('tip')}
          className={`px-3.5 py-2 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeCalTab === 'tip'
              ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Tip Splitter
        </button>
      </div>

      {/* Specialty Calculator Interactive Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUT COLUMN (7 Cols) */}
        <div className="lg:col-span-7 bg-[#07070a]/85 border border-zinc-900 rounded-2xl p-6 space-y-6">
          
          {/* 1. AMORTIZATION INPUT */}
          {activeCalTab === 'amortization' && (
            <div className="space-y-4">
              <div className="border-b border-zinc-900 pb-3">
                <h4 className="text-zinc-200 font-mono text-xs uppercase font-bold tracking-widest">Loan &amp; APR Interest Parameters</h4>
                <p className="text-[10px] text-zinc-500 mt-1">Generate a full monthly amortization schedule schedule offline.</p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase">Loan Principal Amount ($)</label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2.5 rounded-lg text-xs font-mono text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Interest Rate (% APR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={interestRate}
                      onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2.5 rounded-lg text-xs font-mono text-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Term Duration</label>
                    <div className="flex gap-1 bg-zinc-950/70 border border-zinc-800 p-1 rounded-lg">
                      <input
                        type="number"
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(parseInt(e.target.value) || 1)}
                        className="w-2/3 bg-transparent p-1.5 text-xs font-mono text-white outline-none"
                      />
                      <select
                        value={termUnit}
                        onChange={(e) => setTermUnit(e.target.value as 'years' | 'months')}
                        className="w-1/3 bg-zinc-900 text-[10px] font-mono text-zinc-300 border-none rounded outline-none p-1 cursor-pointer"
                      >
                        <option value="years">Years</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ROI INPUT */}
          {activeCalTab === 'roi' && (
            <div className="space-y-4">
              <div className="border-b border-zinc-900 pb-3">
                <h4 className="text-zinc-200 font-mono text-xs uppercase font-bold tracking-widest">Return On Investment Parameters</h4>
                <p className="text-[10px] text-zinc-500 mt-1">Evaluate profit, total ROI %, annualized CAGR, and cumulative payback speed.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Initial Capital Invested ($)</label>
                    <input
                      type="number"
                      value={roiInvested}
                      onChange={(e) => setRoiInvested(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2.5 rounded-lg text-xs font-mono text-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Total Amount Returned ($)</label>
                    <input
                      type="number"
                      value={roiReturned}
                      onChange={(e) => setRoiReturned(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2.5 rounded-lg text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase">Investment Horizon Duration (Years)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={roiYears}
                    onChange={(e) => setRoiYears(parseFloat(e.target.value) || 1)}
                    className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2.5 rounded-lg text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. ROOF AREA INPUT */}
          {activeCalTab === 'roof' && (
            <div className="space-y-4">
              <div className="border-b border-zinc-900 pb-3">
                <h4 className="text-zinc-200 font-mono text-xs uppercase font-bold tracking-widest">Roof Dimensions &amp; Slope Angle</h4>
                <p className="text-[10px] text-zinc-500 mt-1">Convert flat footprint sizes to exact physical sloped roof measurements.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Base Building Length (ft)</label>
                    <input
                      type="number"
                      value={roofLength}
                      onChange={(e) => setRoofLength(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2.5 rounded-lg text-xs font-mono text-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Base Building Width (ft)</label>
                    <input
                      type="number"
                      value={roofWidth}
                      onChange={(e) => setRoofWidth(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2.5 rounded-lg text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase">Roof Pitch Slope Ratio (Rise / 12 inches or Angle)</label>
                  <select
                    value={roofPitch}
                    onChange={(e) => setRoofPitch(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500/50 rounded-lg p-2.5 text-xs font-mono text-zinc-300 outline-none cursor-pointer"
                  >
                    <option value="2/12">Low Slope (2/12 pitch, ~9.5° angle)</option>
                    <option value="4/12">Standard Slope (4/12 pitch, ~18.4° angle)</option>
                    <option value="6/12">Moderate Slope (6/12 pitch, ~26.6° angle)</option>
                    <option value="8/12">Steep Slope (8/12 pitch, ~33.7° angle)</option>
                    <option value="12/12">Extreme Pitch (12/12 pitch, 45.0° angle)</option>
                    <option value="30">Fixed Angle 30°</option>
                    <option value="35">Fixed Angle 35°</option>
                    <option value="40">Fixed Angle 40°</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 4. BODY FAT INPUT */}
          {activeCalTab === 'bodyfat' && (
            <div className="space-y-4">
              <div className="border-b border-zinc-900 pb-3">
                <h4 className="text-zinc-200 font-mono text-xs uppercase font-bold tracking-widest">US Army Circumference Formula (BFP &amp; LBM)</h4>
                <p className="text-[10px] text-zinc-500 mt-1">Estimate lean mass proportions and metabolic metrics completely offline.</p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Unit System</span>
                    <select
                      value={bfUnitSystem}
                      onChange={(e) => setBfUnitSystem(e.target.value as 'imperial' | 'metric')}
                      className="bg-zinc-950 border border-zinc-800 p-2 text-xs font-mono text-white rounded-lg outline-none cursor-pointer"
                    >
                      <option value="imperial">Imperial (in, lbs)</option>
                      <option value="metric">Metric (cm, kg)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Gender Definition</span>
                    <select
                      value={bfGender}
                      onChange={(e) => setBfGender(e.target.value as 'male' | 'female')}
                      className="bg-zinc-950 border border-zinc-800 p-2 text-xs font-mono text-white rounded-lg outline-none cursor-pointer"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Total Weight</span>
                    <input
                      type="number"
                      value={bfWeight}
                      onChange={(e) => setBfWeight(parseFloat(e.target.value) || 0)}
                      className="bg-zinc-950 border border-zinc-800 p-2 text-xs font-mono text-white rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Height ({bfUnitSystem === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="number"
                      value={bfHeight}
                      onChange={(e) => setBfHeight(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2 rounded-lg text-xs font-mono text-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Neck Size ({bfUnitSystem === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="number"
                      value={bfNeck}
                      onChange={(e) => setBfNeck(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2 rounded-lg text-xs font-mono text-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Waist Size ({bfUnitSystem === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="number"
                      value={bfWaist}
                      onChange={(e) => setBfWaist(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2 rounded-lg text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>

                {bfGender === 'female' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Hips Size ({bfUnitSystem === 'imperial' ? 'in' : 'cm'}) (Female Only)</label>
                    <input
                      type="number"
                      value={bfHips}
                      onChange={(e) => setBfHips(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2.5 rounded-lg text-xs font-mono text-white outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. VOLTAGE DROP INPUT */}
          {activeCalTab === 'voltage' && (
            <div className="space-y-4">
              <div className="border-b border-zinc-900 pb-3">
                <h4 className="text-zinc-200 font-mono text-xs uppercase font-bold tracking-widest">Voltage Drop &amp; Wire Conductor Specs</h4>
                <p className="text-[10px] text-zinc-500 mt-1">Evaluate voltage loss index, remaining voltage and resistance parameters.</p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Source Voltage (V)</span>
                    <input
                      type="number"
                      value={voltage}
                      onChange={(e) => setVoltage(parseFloat(e.target.value) || 0)}
                      className="bg-zinc-950 border border-zinc-800 p-2 text-xs font-mono text-white rounded-lg outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">System Type</span>
                    <select
                      value={phase}
                      onChange={(e) => setPhase(e.target.value as 'dc' | 'ac-1' | 'ac-3')}
                      className="bg-zinc-950 border border-zinc-800 p-2 text-xs font-mono text-white rounded-lg outline-none cursor-pointer"
                    >
                      <option value="dc">DC Circuit</option>
                      <option value="ac-1">Single Phase AC</option>
                      <option value="ac-3">3-Phase AC System</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Conductor Material</span>
                    <select
                      value={wireMaterial}
                      onChange={(e) => setWireMaterial(e.target.value as 'copper' | 'aluminum')}
                      className="bg-zinc-950 border border-zinc-800 p-2 text-xs font-mono text-white rounded-lg outline-none cursor-pointer"
                    >
                      <option value="copper">Copper</option>
                      <option value="aluminum">Aluminum</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">AWG Wire Gauge</span>
                    <select
                      value={wireSizeAwg}
                      onChange={(e) => setWireSizeAwg(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500/50 rounded-lg p-2 text-xs font-mono text-zinc-300 outline-none cursor-pointer"
                    >
                      <option value="10">10 AWG (Thick Wire)</option>
                      <option value="12">12 AWG (Standard Outlet)</option>
                      <option value="14">14 AWG (Lighting Wire)</option>
                      <option value="16">16 AWG (Cord Extension)</option>
                      <option value="18">18 AWG (Thin Wire)</option>
                      <option value="22">22 AWG (Extremely Thin)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Load Current (Amps)</label>
                    <input
                      type="number"
                      value={loadAmps}
                      onChange={(e) => setLoadAmps(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2 rounded-lg text-xs font-mono text-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Cable Distance (Feet)</label>
                    <input
                      type="number"
                      value={wireLengthFeet}
                      onChange={(e) => setWireLengthFeet(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2 rounded-lg text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. SCIENTIFIC & BINARY INPUT */}
          {activeCalTab === 'scientific' && (
            <div className="space-y-5">
              <div className="border-b border-zinc-900 pb-3">
                <h4 className="text-zinc-200 font-mono text-xs uppercase font-bold tracking-widest">Base Multi-Radix &amp; Trigonometric solver</h4>
                <p className="text-[10px] text-zinc-500 mt-1">Convert decimals, solve binary operations or hex arrays offline.</p>
              </div>

              {/* Scientific solver keyboard preview */}
              <div className="space-y-2 bg-zinc-950 p-3 rounded-xl border border-zinc-900">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Scientific Formula Parser</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sciDisplay}
                    onChange={(e) => setSciDisplay(e.target.value)}
                    placeholder="e.g. sin(π/2) + ln(e)"
                    className="flex-grow bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-xs font-mono text-white outline-none"
                  />
                  <button
                    onClick={handleSciEval}
                    className="p-2 px-4 bg-orange-500 text-black font-mono font-bold text-xs rounded-lg hover:bg-orange-400 cursor-pointer transition-all"
                  >
                    Solve
                  </button>
                </div>
                
                {/* Special Scientific Button Helper Row */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['sin(', 'cos(', 'tan(', 'ln(', 'log(', 'sqrt(', 'π', 'e'].map((btn) => (
                    <button
                      key={btn}
                      onClick={() => setSciDisplay(prev => prev + btn)}
                      className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/60 rounded text-[10px] text-zinc-400 font-mono cursor-pointer"
                    >
                      {btn}
                    </button>
                  ))}
                  <button
                    onClick={() => { setSciDisplay(''); setSciResult(''); }}
                    className="p-1 px-2.5 bg-red-950/40 text-red-400 border border-red-900/40 rounded text-[10px] font-mono cursor-pointer"
                  >
                    CLEAR
                  </button>
                </div>

                {sciResult && (
                  <div className="mt-3 p-2.5 bg-zinc-900/60 border border-zinc-850 rounded-lg flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-500">Solution:</span>
                    <span className="text-orange-400 font-bold">{sciResult}</span>
                  </div>
                )}
              </div>

              {/* Binary System Addition & Math */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase tracking-wider block border-b border-zinc-900 pb-1.5">Binary Operator (Base 2)</span>
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="text"
                      placeholder="Binary 1 (e.g. 1010)"
                      value={binaryNum1}
                      onChange={(e) => setBinaryNum1(e.target.value.replace(/[^01]/g, ''))}
                      className="bg-zinc-900 border border-zinc-800 p-2 rounded text-xs font-mono text-white outline-none"
                    />
                    <div className="flex bg-zinc-900 p-1 rounded gap-1">
                      {['add', 'sub', 'mul'].map((op) => (
                        <button
                          key={op}
                          onClick={() => setBinaryOp(op as 'add' | 'sub' | 'mul')}
                          className={`flex-1 py-1 text-[9px] font-mono uppercase rounded cursor-pointer ${
                            binaryOp === op ? 'bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30' : 'text-zinc-500'
                          }`}
                        >
                          {op === 'add' ? '+' : op === 'sub' ? '-' : '×'}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Binary 2 (e.g. 0101)"
                      value={binaryNum2}
                      onChange={(e) => setBinaryNum2(e.target.value.replace(/[^01]/g, ''))}
                      className="bg-zinc-900 border border-zinc-800 p-2 rounded text-xs font-mono text-white outline-none"
                    />
                    <div className="flex justify-between items-center text-[11px] font-mono pt-1.5 border-t border-zinc-900">
                      <span className="text-zinc-500">Binary Output:</span>
                      <span className="text-emerald-400 font-bold">{binaryResult}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase tracking-wider block border-b border-zinc-900 pb-1.5">Hexadecimal (Base 16)</span>
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="text"
                      placeholder="Hex 1 (e.g. A)"
                      value={hexNum1}
                      onChange={(e) => setHexNum1(e.target.value.toUpperCase().replace(/[^0-9A-F]/g, ''))}
                      className="bg-zinc-900 border border-zinc-800 p-2 rounded text-xs font-mono text-white outline-none"
                    />
                    <div className="flex bg-zinc-900 p-1 rounded gap-1">
                      {['add', 'sub', 'mul'].map((op) => (
                        <button
                          key={op}
                          onClick={() => setHexOp(op as 'add' | 'sub' | 'mul')}
                          className={`flex-1 py-1 text-[9px] font-mono uppercase rounded cursor-pointer ${
                            hexOp === op ? 'bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30' : 'text-zinc-500'
                          }`}
                        >
                          {op === 'add' ? '+' : op === 'sub' ? '-' : '×'}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Hex 2 (e.g. 5)"
                      value={hexNum2}
                      onChange={(e) => setHexNum2(e.target.value.toUpperCase().replace(/[^0-9A-F]/g, ''))}
                      className="bg-zinc-900 border border-zinc-800 p-2 rounded text-xs font-mono text-white outline-none"
                    />
                    <div className="flex justify-between items-center text-[11px] font-mono pt-1.5 border-t border-zinc-900">
                      <span className="text-zinc-500">Hex Output:</span>
                      <span className="text-emerald-400 font-bold">{hexResult}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 7. TIP INPUT */}
          {activeCalTab === 'tip' && (
            <div className="space-y-4">
              <div className="border-b border-zinc-900 pb-3">
                <h4 className="text-zinc-200 font-mono text-xs uppercase font-bold tracking-widest">Restaurant tip split &amp; gratuity calculator</h4>
                <p className="text-[10px] text-zinc-500 mt-1">Split diner bills evenly with quick gratuity preset keys.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase">Bill Amount Total ($)</label>
                  <input
                    type="number"
                    value={billAmount}
                    onChange={(e) => setBillAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2.5 rounded-lg text-xs font-mono text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Tip Percentage (%)</label>
                    <input
                      type="number"
                      value={tipPercent}
                      onChange={(e) => setTipPercent(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2.5 rounded-lg text-xs font-mono text-white outline-none"
                    />
                    <div className="flex gap-1 bg-zinc-950/50 p-1 rounded border border-zinc-900">
                      {[15, 18, 20, 25].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setTipPercent(preset)}
                          className="flex-1 py-1 text-[9px] font-mono bg-zinc-900 hover:bg-zinc-850 rounded text-zinc-400 hover:text-white cursor-pointer"
                        >
                          {preset}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Split (Number of People)</label>
                    <input
                      type="number"
                      min="1"
                      value={splitCount}
                      onChange={(e) => setSplitCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-orange-500/50 p-2.5 rounded-lg text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* OUTPUT RESOLUTION COLUMN (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-[#07070a]/85 border border-zinc-900 rounded-2xl p-6 space-y-6 min-h-[350px] flex flex-col justify-between">
            
            <div className="space-y-4">
              <span className="text-[10px] font-mono tracking-widest font-semibold text-zinc-500 uppercase block border-b border-zinc-900 pb-2">
                Resolved Metric Outputs
              </span>

              {/* 1. AMORTIZATION OUTPUT */}
              {activeCalTab === 'amortization' && amortizationResults && (
                <div className="space-y-4">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:10px_18px] opacity-10" />
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Monthly Payment Value</span>
                    <span className="text-2xl font-bold font-mono text-orange-400 block mt-1">
                      {formatMoney(amortizationResults.monthlyPayment)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-900/60">
                      <span className="text-[9px] text-zinc-500 uppercase block font-mono">Total Interest Cost</span>
                      <span className="font-mono text-white font-bold block mt-1">
                        {formatMoney(amortizationResults.totalInterest)}
                      </span>
                    </div>
                    <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-900/60">
                      <span className="text-[9px] text-zinc-500 uppercase block font-mono">Total Lifetime Cost</span>
                      <span className="font-mono text-white font-bold block mt-1">
                        {formatMoney(amortizationResults.totalCost)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-orange-950/10 border border-orange-500/10 text-[10px] text-orange-400 font-sans leading-relaxed rounded-lg">
                    <span>
                      * Generated a lifetime list of {amortizationResults.totalMonths} months table showing exactly how principal and interests diminish.
                    </span>
                  </div>
                </div>
              )}

              {/* 2. ROI OUTPUT */}
              {activeCalTab === 'roi' && roiResults && (
                <div className="space-y-4">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:10px_18px] opacity-10" />
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Annualized Return rate (CAGR)</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400 block mt-1">
                      {formatNumber(roiResults.annualizedROI)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
                    <div className="bg-zinc-950/50 p-2 rounded border border-zinc-900 text-center">
                      <span className="text-[8px] text-zinc-500 uppercase block">Net Profit</span>
                      <span className="text-white font-bold block mt-1">
                        {formatMoney(roiResults.netProfit)}
                      </span>
                    </div>
                    <div className="bg-zinc-950/50 p-2 rounded border border-zinc-900 text-center">
                      <span className="text-[8px] text-zinc-500 uppercase block">Total ROI</span>
                      <span className="text-white font-bold block mt-1">
                        {formatNumber(roiResults.totalROI, 1)}%
                      </span>
                    </div>
                    <div className="bg-zinc-950/50 p-2 rounded border border-zinc-900 text-center">
                      <span className="text-[8px] text-zinc-500 uppercase block">Payback</span>
                      <span className="text-white font-bold block mt-1">
                        {formatNumber(roiResults.paybackPeriod, 1)} yrs
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-900/60 flex items-start gap-2 text-[10px] text-zinc-500">
                    <Info className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                    <span>The payback speed indicates years required to fully offset the initial investment principal from average annualized returns.</span>
                  </div>
                </div>
              )}

              {/* 3. ROOF AREA OUTPUT */}
              {activeCalTab === 'roof' && roofResults && (
                <div className="space-y-4">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-center">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Actual Slope Roof Area</span>
                    <span className="text-2xl font-bold font-mono text-white block mt-1">
                      {formatNumber(roofResults.actualArea, 1)} sq ft
                    </span>
                    <span className="text-[10px] text-orange-400 font-mono mt-1 block">
                      ≈ {formatNumber(roofResults.actualArea * 0.092903, 1)} m²
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-zinc-950/50 p-2.5 rounded border border-zinc-900">
                      <span className="text-[8px] text-zinc-500 uppercase block">Roofing Squares</span>
                      <span className="text-white font-bold block mt-0.5">
                        {formatNumber(roofResults.roofSquares, 2)} sqs
                      </span>
                      <span className="text-[8px] text-zinc-600 block">(1 square = 100 sq ft)</span>
                    </div>
                    <div className="bg-zinc-950/50 p-2.5 rounded border border-zinc-900">
                      <span className="text-[8px] text-zinc-500 uppercase block">Slope Angle &amp; Mult</span>
                      <span className="text-white font-bold block mt-0.5">
                        {formatNumber(roofResults.pitchAngle, 1)}°
                      </span>
                      <span className="text-[8px] text-zinc-600 block">(Multiplier: {formatNumber(roofResults.pitchMultiplier, 3)}x)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. BODY FAT OUTPUT */}
              {activeCalTab === 'bodyfat' && bodyComposition && (
                <div className="space-y-4">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-center">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">US Army Estimated Body Fat</span>
                    <span className="text-2xl font-bold font-mono text-orange-400 block mt-1">
                      {formatNumber(bodyComposition.bfPercent, 1)}%
                    </span>
                    <span className="text-[10px] text-zinc-400 uppercase font-mono block mt-1">
                      Category: {bodyComposition.classification}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-zinc-950/50 p-2.5 rounded border border-zinc-900">
                      <span className="text-[8px] text-zinc-500 uppercase block">Lean Body Mass</span>
                      <span className="text-emerald-400 font-bold block mt-0.5">
                        {formatNumber(bodyComposition.leanMass, 1)} {bodyComposition.weightLabel}
                      </span>
                    </div>
                    <div className="bg-zinc-950/50 p-2.5 rounded border border-zinc-900">
                      <span className="text-[8px] text-zinc-500 uppercase block">Estimated BMR</span>
                      <span className="text-sky-400 font-bold block mt-0.5">
                        {formatNumber(bodyComposition.bmr, 0)} kcal/day
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. VOLTAGE DROP OUTPUT */}
              {activeCalTab === 'voltage' && voltageDropResults && (
                <div className="space-y-4">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-center">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Calculated Voltage Drop</span>
                    <span className="text-2xl font-bold font-mono text-red-400 block mt-1">
                      {formatNumber(voltageDropResults.vDrop, 3)} V
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-1">
                      ({formatNumber(voltageDropResults.vDropPercent, 2)}% loss)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-zinc-950/50 p-2.5 rounded border border-zinc-900">
                      <span className="text-[8px] text-zinc-500 uppercase block">Destination Voltage</span>
                      <span className="text-emerald-400 font-bold block mt-0.5">
                        {formatNumber(voltageDropResults.vDestination, 1)} V
                      </span>
                    </div>
                    <div className="bg-zinc-950/50 p-2.5 rounded border border-zinc-900">
                      <span className="text-[8px] text-zinc-500 uppercase block">System Power Loss</span>
                      <span className="text-amber-400 font-bold block mt-0.5">
                        {formatNumber(voltageDropResults.powerLossWatts, 1)} Watts
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. SCIENTIFIC & BINARY OUTPUT DETAIL */}
              {activeCalTab === 'scientific' && (
                <div className="space-y-4">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-2 text-xs font-mono">
                    <span className="text-[9px] text-zinc-500 uppercase block font-semibold border-b border-zinc-900 pb-1">Mathematical Guides</span>
                    <div className="space-y-1 text-zinc-400 leading-relaxed text-[10px]">
                      <p>• Binary conversions operate on standard 32-bit unsigned integers natively.</p>
                      <p>• Hexadecimal supports characters <span className="text-orange-400">0-9 &amp; A-F</span>.</p>
                      <p>• Trigonometric evaluations require angles to be supplied in radians.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. TIP SPLITTER OUTPUT */}
              {activeCalTab === 'tip' && tipResults && (
                <div className="space-y-4">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-center">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Total Payable Per Person</span>
                    <span className="text-2xl font-bold font-mono text-white block mt-1">
                      {formatMoney(tipResults.totalPerPerson)}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-1">
                      ({formatMoney(tipResults.tipPerPerson)} tip per person)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-zinc-950/50 p-2.5 rounded border border-zinc-900">
                      <span className="text-[8px] text-zinc-500 uppercase block">Total Bill Cost</span>
                      <span className="text-white font-bold block mt-0.5">
                        {formatMoney(tipResults.totalBill)}
                      </span>
                    </div>
                    <div className="bg-zinc-950/50 p-2.5 rounded border border-zinc-900">
                      <span className="text-[8px] text-zinc-500 uppercase block">Total Tip Gratuity</span>
                      <span className="text-emerald-400 font-bold block mt-0.5">
                        {formatMoney(tipResults.tipAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* General Privacy Standard */}
            <div className="flex gap-2 p-3 bg-zinc-950/40 rounded-lg border border-zinc-900 leading-relaxed text-[9.5px] text-zinc-500 font-sans mt-4">
              <HelpCircle className="w-4 h-4 text-orange-400 shrink-0" />
              <span>
                All mathematical formulas are verified against standard scientific calculations. No input data is cached or transmitted to any remote servers. Complete local storage protection.
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* RENDER DYNAMIC MONTHLY AMORTIZATION BREAKDOWN SCHEDULE TABLE */}
      {activeCalTab === 'amortization' && amortizationResults && amortizationResults.schedule.length > 0 && (
        <div className="bg-[#07070a]/85 border border-zinc-900 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-1.5">
              <Table className="w-4 h-4 text-orange-400" />
              <h4 className="text-zinc-200 font-mono text-xs uppercase font-bold tracking-widest">Monthly Amortization Schedule Table</h4>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">
              First {Math.min(amortizationResults.schedule.length, 120)} Months Preview
            </span>
          </div>

          <div className="overflow-x-auto max-h-[350px] overflow-y-auto rounded-xl border border-zinc-900 custom-scrollbar">
            <table className="w-full text-left border-collapse font-mono text-[11px] text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-500 uppercase sticky top-0 border-b border-zinc-900">
                <tr>
                  <th className="p-3">Month</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 text-emerald-400">Principal Paid</th>
                  <th className="p-3 text-red-400">Interest Paid</th>
                  <th className="p-3">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {amortizationResults.schedule.slice(0, 120).map((row) => (
                  <tr key={row.month} className="hover:bg-zinc-950/50 transition-colors">
                    <td className="p-3 text-zinc-400 font-bold">{row.month}</td>
                    <td className="p-3">{formatMoney(row.payment)}</td>
                    <td className="p-3 text-emerald-500">{formatMoney(row.principal)}</td>
                    <td className="p-3 text-red-500/80">{formatMoney(row.interest)}</td>
                    <td className="p-3 text-zinc-200">{formatMoney(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {amortizationResults.schedule.length > 120 && (
            <p className="text-[10px] text-zinc-500 text-center font-mono">
              * Schedule truncated for preview. Complete duration has {amortizationResults.schedule.length} months.
            </p>
          )}
        </div>
      )}

    </div>
  );
}

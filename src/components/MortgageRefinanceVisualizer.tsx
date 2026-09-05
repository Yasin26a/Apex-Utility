import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, DollarSign, Percent, Calendar, TrendingDown, TrendingUp, 
  ShieldCheck, Calculator, Download, Copy, Check, RefreshCw, 
  HelpCircle, Sliders, ChevronDown, ChevronUp, Layers, FileSpreadsheet, 
  ArrowRight, Award, AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import { addRecentOperation } from '../utils/recentOperations';

// Helper formula for standard monthly mortgage payment P&I
function calculateMonthlyPI(principal: number, annualRatePct: number, termYears: number): number {
  if (principal <= 0 || termYears <= 0) return 0;
  if (annualRatePct <= 0) return principal / (termYears * 12);
  const r = (annualRatePct / 100) / 12;
  const n = termYears * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// Preset Loan Profiles
interface RefiPreset {
  name: string;
  desc: string;
  currentBalance: number;
  currentRate: number;
  currentRemainingYears: number;
  newRate: number;
  newTermYears: number;
  closingCosts: number;
  pointsPct: number;
}

const PRESET_SCENARIOS: RefiPreset[] = [
  {
    name: '30-Yr to 15-Yr Rate Reduction',
    desc: 'Switch from 6.8% to 5.25% with 15-yr term to build equity fast & cut interest.',
    currentBalance: 380000,
    currentRate: 6.8,
    currentRemainingYears: 27,
    newRate: 5.25,
    newTermYears: 15,
    closingCosts: 4500,
    pointsPct: 0
  },
  {
    name: '30-Yr Rate Drop (Lower Monthly Payment)',
    desc: 'Lower interest rate from 7.2% to 5.75% while keeping 30-yr term to optimize monthly cash flow.',
    currentBalance: 420000,
    currentRate: 7.2,
    currentRemainingYears: 28,
    newRate: 5.75,
    newTermYears: 30,
    closingCosts: 3800,
    pointsPct: 0.5
  },
  {
    name: '5-Yr Rate Cut (Accelerated Payoff)',
    desc: 'Refinance balance after 5 years into 20-yr loan at 5.5% with extra $200/mo principal payments.',
    currentBalance: 320000,
    currentRate: 6.5,
    currentRemainingYears: 25,
    newRate: 5.5,
    newTermYears: 20,
    closingCosts: 3200,
    pointsPct: 0
  }
];

interface MonthlyScheduleRow {
  month: number;
  year: number;
  // Current Loan
  currentPayment: number;
  currentPrincipal: number;
  currentInterest: number;
  currentBalance: number;
  // Refinanced Loan
  newPayment: number;
  newPrincipal: number;
  newInterest: number;
  newBalance: number;
  // Cumulative & Tax
  cumulativeCurrentInterest: number;
  cumulativeNewInterest: number;
  taxSavingsCurrent: number;
  taxSavingsNew: number;
}

export default function MortgageRefinanceVisualizer() {
  // Current Loan State
  const [currentBalance, setCurrentBalance] = useState<number>(350000);
  const [currentRate, setCurrentRate] = useState<number>(6.75);
  const [currentRemainingYears, setCurrentRemainingYears] = useState<number>(27);

  // Refinanced Loan State
  const [newLoanAmount, setNewLoanAmount] = useState<number>(350000);
  const [newRate, setNewRate] = useState<number>(5.375);
  const [newTermYears, setNewTermYears] = useState<number>(30);
  const [closingCosts, setClosingCosts] = useState<number>(4200);
  const [pointsPct, setPointsPct] = useState<number>(0);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(0);

  // Tax Deduction Settings
  const [fedTaxBracket, setFedTaxBracket] = useState<number>(22); // %
  const [stateTaxBracket, setStateTaxBracket] = useState<number>(5); // %
  const [itemizingTaxes, setItemizingTaxes] = useState<boolean>(true);

  // Table view mode & filters
  const [tableScheduleView, setTableScheduleView] = useState<'annual' | 'monthly'>('annual');
  const [searchYear, setSearchYear] = useState<string>('');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Preset Applicator
  const applyPreset = (preset: RefiPreset) => {
    setCurrentBalance(preset.currentBalance);
    setCurrentRate(preset.currentRate);
    setCurrentRemainingYears(preset.currentRemainingYears);
    setNewLoanAmount(preset.currentBalance);
    setNewRate(preset.newRate);
    setNewTermYears(preset.newTermYears);
    setClosingCosts(preset.closingCosts);
    setPointsPct(preset.pointsPct);
  };

  // CALCULATIONS ENGINE
  const calculations = useMemo(() => {
    const pointsCost = (newLoanAmount * (pointsPct / 100));
    const totalUpfrontCosts = closingCosts + pointsCost;

    const currentMonthlyPI = calculateMonthlyPI(currentBalance, currentRate, currentRemainingYears);
    const newMonthlyPI = calculateMonthlyPI(newLoanAmount, newRate, newTermYears);

    const effectiveNewMonthlyPayment = newMonthlyPI + extraMonthlyPayment;

    // Monthly interest rates
    const rCurrent = (currentRate / 100) / 12;
    const rNew = (newRate / 100) / 12;

    const totalCurrentMonths = currentRemainingYears * 12;
    const totalNewMonths = newTermYears * 12;
    const maxMonths = Math.max(totalCurrentMonths, totalNewMonths);

    // Amortization Schedule Generation
    const schedule: MonthlyScheduleRow[] = [];
    
    let curBal = currentBalance;
    let newBal = newLoanAmount;

    let cumCurInterest = 0;
    let cumNewInterest = 0;

    const combinedMarginalTaxRate = itemizingTaxes ? (fedTaxBracket + stateTaxBracket) / 100 : 0;

    let breakEvenMonth = -1;
    let cumulativeNetMonthlySavings = 0;

    for (let m = 1; m <= maxMonths; m++) {
      // Current Loan
      let curInt = 0;
      let curPrin = 0;
      let curPmt = 0;
      if (curBal > 0 && m <= totalCurrentMonths) {
        curInt = curBal * rCurrent;
        curPmt = Math.min(currentMonthlyPI, curBal + curInt);
        curPrin = curPmt - curInt;
        curBal = Math.max(0, curBal - curPrin);
      }
      cumCurInterest += curInt;

      // Refinanced Loan
      let newInt = 0;
      let newPrin = 0;
      let newPmt = 0;
      if (newBal > 0) {
        newInt = newBal * rNew;
        newPmt = Math.min(effectiveNewMonthlyPayment, newBal + newInt);
        newPrin = newPmt - newInt;
        newBal = Math.max(0, newBal - newPrin);
      }
      cumNewInterest += newInt;

      // Monthly Savings
      const monthlyPmtDiff = currentMonthlyPI - newMonthlyPI;
      cumulativeNetMonthlySavings += monthlyPmtDiff;

      if (breakEvenMonth === -1 && cumulativeNetMonthlySavings >= totalUpfrontCosts) {
        breakEvenMonth = m;
      }

      // Tax Savings
      const taxSavingsCurrent = curInt * combinedMarginalTaxRate;
      const taxSavingsNew = newInt * combinedMarginalTaxRate;

      schedule.push({
        month: m,
        year: Math.ceil(m / 12),
        currentPayment: curPmt,
        currentPrincipal: curPrin,
        currentInterest: curInt,
        currentBalance: curBal,
        newPayment: newPmt,
        newPrincipal: newPrin,
        newInterest: newInt,
        newBalance: newBal,
        cumulativeCurrentInterest: cumCurInterest,
        cumulativeNewInterest: cumNewInterest,
        taxSavingsCurrent,
        taxSavingsNew
      });
    }

    const totalCurrentInterest = cumCurInterest;
    const totalNewInterest = cumNewInterest;
    const totalCurrentPaid = (currentMonthlyPI * totalCurrentMonths);
    const totalNewPaid = (newMonthlyPI * totalNewMonths) + totalUpfrontCosts;

    const monthlyPaymentSavings = currentMonthlyPI - newMonthlyPI;
    const lifetimeInterestSavings = totalCurrentInterest - totalNewInterest;
    const netLifetimeSavings = lifetimeInterestSavings - totalUpfrontCosts;

    // Cumulative Tax Deduction Savings
    const totalTaxSavingsCurrent = totalCurrentInterest * combinedMarginalTaxRate;
    const totalTaxSavingsNew = totalNewInterest * combinedMarginalTaxRate;
    const netTaxSavingsDiff = totalTaxSavingsCurrent - totalTaxSavingsNew;

    // Annual Schedule Rollup for Charting & Table
    const annualMap = new Map<number, {
      year: number;
      curBal: number;
      newBal: number;
      curPrinSum: number;
      curIntSum: number;
      newPrinSum: number;
      newIntSum: number;
      curTaxSaveSum: number;
      newTaxSaveSum: number;
    }>();

    schedule.forEach(row => {
      const yr = row.year;
      if (!annualMap.has(yr)) {
        annualMap.set(yr, {
          year: yr,
          curBal: row.currentBalance,
          newBal: row.newBalance,
          curPrinSum: 0,
          curIntSum: 0,
          newPrinSum: 0,
          newIntSum: 0,
          curTaxSaveSum: 0,
          newTaxSaveSum: 0
        });
      }
      const entry = annualMap.get(yr)!;
      entry.curBal = row.currentBalance;
      entry.newBal = row.newBalance;
      entry.curPrinSum += row.currentPrincipal;
      entry.curIntSum += row.currentInterest;
      entry.newPrinSum += row.newPrincipal;
      entry.newIntSum += row.newInterest;
      entry.curTaxSaveSum += row.taxSavingsCurrent;
      entry.newTaxSaveSum += row.taxSavingsNew;
    });

    const annualSchedule = Array.from(annualMap.values());

    return {
      totalUpfrontCosts,
      currentMonthlyPI,
      newMonthlyPI,
      monthlyPaymentSavings,
      totalCurrentInterest,
      totalNewInterest,
      lifetimeInterestSavings,
      netLifetimeSavings,
      totalCurrentPaid,
      totalNewPaid,
      breakEvenMonth,
      totalTaxSavingsCurrent,
      totalTaxSavingsNew,
      netTaxSavingsDiff,
      schedule,
      annualSchedule
    };
  }, [
    currentBalance, currentRate, currentRemainingYears, 
    newLoanAmount, newRate, newTermYears, closingCosts, 
    pointsPct, extraMonthlyPayment, fedTaxBracket, stateTaxBracket, itemizingTaxes
  ]);

  // Export Amortization Schedule to CSV
  const handleExportCSV = () => {
    const headers = [
      'Month', 'Year', 
      'Current Pmt ($)', 'Current Principal ($)', 'Current Interest ($)', 'Current Balance ($)',
      'Refi Pmt ($)', 'Refi Principal ($)', 'Refi Interest ($)', 'Refi Balance ($)',
      'Cum. Refi Interest ($)', 'Refi Tax Savings ($)'
    ];

    const rows = calculations.schedule.map(r => [
      r.month,
      r.year,
      r.currentPayment.toFixed(2),
      r.currentPrincipal.toFixed(2),
      r.currentInterest.toFixed(2),
      r.currentBalance.toFixed(2),
      r.newPayment.toFixed(2),
      r.newPrincipal.toFixed(2),
      r.newInterest.toFixed(2),
      r.newBalance.toFixed(2),
      r.cumulativeNewInterest.toFixed(2),
      r.taxSavingsNew.toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mortgage_refinance_amortization_schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addRecentOperation(
      'Mortgage Refi Amortization Schedule',
      'Shield Vault',
      'N/A',
      'N/A',
      'CSV File Export',
      '#'
    );
  };

  // Copy Summary
  const handleCopySummary = () => {
    const text = `
=== MORTGAGE REFINANCE & AMORTIZATION COMPARISON ===
Current Loan: $${currentBalance.toLocaleString()} @ ${currentRate}% (${currentRemainingYears} yrs remaining)
Current Monthly P&I: $${Math.round(calculations.currentMonthlyPI).toLocaleString()}/mo

Proposed Refinance: $${newLoanAmount.toLocaleString()} @ ${newRate}% (${newTermYears} yrs)
New Monthly P&I: $${Math.round(calculations.newMonthlyPI).toLocaleString()}/mo

--- FINANCIAL SAVINGS SUMMARY ---
• Monthly P&I Savings: $${Math.round(calculations.monthlyPaymentSavings).toLocaleString()}/mo
• Total Upfront Closing Costs: $${Math.round(calculations.totalUpfrontCosts).toLocaleString()}
• Break-Even Timeline: ${calculations.breakEvenMonth > 0 ? `${calculations.breakEvenMonth} months (~${(calculations.breakEvenMonth / 12).toFixed(1)} yrs)` : 'Never / High Closing Costs'}
• Lifetime Interest Savings: $${Math.round(calculations.lifetimeInterestSavings).toLocaleString()}
• Net Lifetime Savings (after costs): $${Math.round(calculations.netLifetimeSavings).toLocaleString()}
• Tax Deduction Savings Difference: $${Math.round(calculations.netTaxSavingsDiff).toLocaleString()}

Generated with APEX Mortgage Refinance & Amortization Schedule Visualizer.
`.trim();

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);

    addRecentOperation(
      'Mortgage Refi Summary',
      'Shield Vault',
      'N/A',
      'N/A',
      'Clipboard Text',
      '#'
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 font-sans text-slate-100">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-inner">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Mortgage Refinance & Amortization Visualizer
                </h1>
                <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-500/30">
                  Interactive Amortization
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                Compare current vs. new loan terms, principal decay curves, tax deduction savings, and break-even timelines.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopySummary}
              className="flex items-center space-x-1.5 rounded-xl bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-zinc-700 transition border border-zinc-700"
            >
              {copiedSummary ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-cyan-400" />}
              <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 rounded-xl bg-cyan-500/20 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition border border-cyan-500/40"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Preset Scenarios Quick Bar */}
        <div className="mt-4 pt-4 border-t border-cyan-500/20 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 flex items-center space-x-1 mr-2">
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>Load Preset Scenario:</span>
          </span>
          {PRESET_SCENARIOS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p)}
              className="rounded-lg bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 border border-zinc-700/80 transition"
              title={p.desc}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Comparison Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Payment Difference */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-2 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Monthly P&I Savings</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${calculations.monthlyPaymentSavings >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {calculations.monthlyPaymentSavings >= 0 ? 'Lower Payment' : 'Higher Payment'}
            </span>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold font-mono ${calculations.monthlyPaymentSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${Math.abs(Math.round(calculations.monthlyPaymentSavings)).toLocaleString()}
            <span className="text-xs font-normal text-slate-400">/mo</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Current: ${Math.round(calculations.currentMonthlyPI).toLocaleString()} → Refi: ${Math.round(calculations.newMonthlyPI).toLocaleString()}
          </p>
        </div>

        {/* Break-Even Timeline */}
        <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-zinc-900 to-zinc-950 p-4 space-y-2 shadow-xl relative overflow-hidden ring-1 ring-cyan-500/30">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold">
            <span>Break-Even Timeline</span>
            <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300">Upfront Costs</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono">
            {calculations.breakEvenMonth > 0 ? `${calculations.breakEvenMonth} mo` : 'N/A'}
            <span className="text-xs font-normal text-slate-400 ml-1">
              {calculations.breakEvenMonth > 0 ? `(~${(calculations.breakEvenMonth / 12).toFixed(1)} yrs)` : ''}
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            Recoups ${Math.round(calculations.totalUpfrontCosts).toLocaleString()} closing costs & points.
          </p>
        </div>

        {/* Net Lifetime Interest Savings */}
        <div className="rounded-xl border border-emerald-500/40 bg-zinc-900/80 p-4 space-y-2 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Net Lifetime Savings</span>
            <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">After Costs</span>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold font-mono ${calculations.netLifetimeSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${Math.abs(Math.round(calculations.netLifetimeSavings)).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">
            Gross Interest Savings: ${Math.round(calculations.lifetimeInterestSavings).toLocaleString()}
          </p>
        </div>

        {/* Tax Savings Difference */}
        <div className="rounded-xl border border-purple-500/40 bg-zinc-900/80 p-4 space-y-2 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-purple-400 font-medium">
            <span>Tax Deduction Value</span>
            <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded text-purple-300">Interest Deductible</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-300 font-mono">
            ${Math.round(calculations.totalTaxSavingsNew).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">
            Combined Marginal Bracket: {fedTaxBracket + stateTaxBracket}%
          </p>
        </div>
      </div>

      {/* Main Split: Controls (Left 6) vs Interactive Charts (Right 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Loan Input Controls */}
        <div className="lg:col-span-6 space-y-6">

          {/* Current Loan Parameters */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-zinc-800 pb-2">
              <Home className="h-4 w-4 text-cyan-400" />
              <span>Current Existing Loan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Remaining Balance ($):</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500">$</span>
                  <input
                    type="number"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-7 pr-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    step={5000}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Interest Rate (%):</label>
                <input
                  type="number"
                  value={currentRate}
                  onChange={(e) => setCurrentRate(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  step={0.125}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Remaining Term (yrs):</label>
                <input
                  type="number"
                  value={currentRemainingYears}
                  onChange={(e) => setCurrentRemainingYears(Math.max(1, Math.min(40, Number(e.target.value))))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Refinanced Loan Parameters */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-zinc-800 pb-2">
              <RefreshCw className="h-4 w-4 text-cyan-400" />
              <span>Proposed Refinanced Loan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">New Loan Amount ($):</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500">$</span>
                  <input
                    type="number"
                    value={newLoanAmount}
                    onChange={(e) => setNewLoanAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-7 pr-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    step={5000}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">New Interest Rate (%):</label>
                <input
                  type="number"
                  value={newRate}
                  onChange={(e) => setNewRate(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  step={0.125}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">New Loan Term:</label>
                <select
                  value={newTermYears}
                  onChange={(e) => setNewTermYears(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value={30}>30 Years</option>
                  <option value={20}>20 Years</option>
                  <option value={15}>15 Years</option>
                  <option value={10}>10 Years</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Closing Costs ($):</label>
                <input
                  type="number"
                  value={closingCosts}
                  onChange={(e) => setClosingCosts(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  step={250}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Discount Points (%):</label>
                <input
                  type="number"
                  value={pointsPct}
                  onChange={(e) => setPointsPct(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  step={0.25}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Extra Monthly Principal ($):</label>
                <input
                  type="number"
                  value={extraMonthlyPayment}
                  onChange={(e) => setExtraMonthlyPayment(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  step={50}
                />
              </div>
            </div>
          </div>

          {/* Tax Deduction Bracket Settings */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-zinc-800 pb-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Mortgage Interest Tax Savings Modeler</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Federal Tax Bracket (%):</label>
                <input
                  type="number"
                  value={fedTaxBracket}
                  onChange={(e) => setFedTaxBracket(Math.max(0, Math.min(50, Number(e.target.value))))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">State Tax Bracket (%):</label>
                <input
                  type="number"
                  value={stateTaxBracket}
                  onChange={(e) => setStateTaxBracket(Math.max(0, Math.min(20, Number(e.target.value))))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="text-xs font-medium text-slate-300 block">Itemize Deductions?</label>
                <button
                  onClick={() => setItemizingTaxes(!itemizingTaxes)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border transition ${itemizingTaxes ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-zinc-800 text-slate-400 border-zinc-700'}`}
                >
                  {itemizingTaxes ? 'Yes (Include Tax Savings)' : 'No (Standard Deduction)'}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Amortization Visualizer Charts */}
        <div className="lg:col-span-6 space-y-6">

          {/* Balance Decay Comparison Chart */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-zinc-800 pb-2">
              <TrendingDown className="h-4 w-4 text-cyan-400" />
              <span>Remaining Balance Amortization Decay</span>
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={calculations.annualSchedule}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="year" stroke="#a1a1aa" fontSize={11} tickFormatter={(v) => `Yr ${v}`} />
                  <YAxis stroke="#a1a1aa" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(val: any) => [`$${Math.round(Number(val)).toLocaleString()}`, 'Balance']}
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="curBal" name="Current Loan Balance" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="newBal" name="Refinanced Loan Balance" stroke="#10b981" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Principal vs Interest Area Stacked Chart */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-zinc-800 pb-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Refinanced Principal vs. Interest Split (Annual)</span>
            </h3>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calculations.annualSchedule}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="year" stroke="#a1a1aa" fontSize={11} tickFormatter={(v) => `Yr ${v}`} />
                  <YAxis stroke="#a1a1aa" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(val: any) => [`$${Math.round(Number(val)).toLocaleString()}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="newPrinSum" name="Principal Paid" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="newIntSum" name="Interest Paid" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* Complete Amortization Schedule Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Full Amortization Payment Schedule</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => setTableScheduleView('annual')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${tableScheduleView === 'annual' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Annual Summary
              </button>
              <button
                onClick={() => setTableScheduleView('monthly')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${tableScheduleView === 'monthly' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Monthly Schedule ({calculations.schedule.length} mo)
              </button>
            </div>

            {/* Filter Year Input */}
            <input
              type="text"
              placeholder="Filter year (e.g. 5)"
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
              className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Scrollable Schedule Table */}
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-zinc-950 text-slate-400 uppercase text-[10px] sticky top-0 z-10 border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3 text-right">Current Pmt ($)</th>
                <th className="py-2.5 px-3 text-right">Current Bal ($)</th>
                <th className="py-2.5 px-3 text-right">Refi Pmt ($)</th>
                <th className="py-2.5 px-3 text-right">Refi Principal ($)</th>
                <th className="py-2.5 px-3 text-right">Refi Interest ($)</th>
                <th className="py-2.5 px-3 text-right">Refi Bal ($)</th>
                <th className="py-2.5 px-3 text-right">Tax Savings ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {tableScheduleView === 'annual' ? (
                calculations.annualSchedule
                  .filter(row => !searchYear || row.year.toString().includes(searchYear))
                  .map((row) => (
                    <tr key={row.year} className="hover:bg-zinc-800/40 transition">
                      <td className="py-2 px-3 font-semibold text-white">Year {row.year}</td>
                      <td className="py-2 px-3 text-right text-slate-400">${Math.round(row.curPrinSum + row.curIntSum).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-rose-300">${Math.round(row.curBal).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-semibold">${Math.round(row.newPrinSum + row.newIntSum).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-blue-300">${Math.round(row.newPrinSum).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-purple-300">${Math.round(row.newIntSum).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-emerald-300 font-bold">${Math.round(row.newBal).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-amber-300">${Math.round(row.newTaxSaveSum).toLocaleString()}</td>
                    </tr>
                  ))
              ) : (
                calculations.schedule
                  .filter(row => !searchYear || row.year.toString().includes(searchYear))
                  .map((row) => (
                    <tr key={row.month} className="hover:bg-zinc-800/40 transition">
                      <td className="py-1.5 px-3 font-medium text-slate-200">Mo {row.month} (Yr {row.year})</td>
                      <td className="py-1.5 px-3 text-right text-slate-400">${row.currentPayment.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right text-rose-300">${row.currentBalance.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right text-emerald-400">${row.newPayment.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right text-blue-300">${row.newPrincipal.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right text-purple-300">${row.newInterest.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right text-emerald-300 font-bold">${row.newBalance.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right text-amber-300">${row.taxSavingsNew.toFixed(2)}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

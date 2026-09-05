import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, DollarSign, PieChart as PieChartIcon, ShieldCheck, 
  TrendingUp, Calendar, Clock, Percent, FileText, Download, 
  HelpCircle, RefreshCw, Plus, Trash2, Check, AlertCircle, 
  Briefcase, ArrowRight, Copy, ChevronDown, ChevronUp, Layers, Sliders
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { addRecentOperation } from '../utils/recentOperations';

// Tax Bracket Definitions (2025/2026 Single & Married Filing Jointly simplified estimation)
interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

const FEDERAL_BRACKETS_SINGLE: TaxBracket[] = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

const FEDERAL_BRACKETS_JOINT: TaxBracket[] = [
  { min: 0, max: 23200, rate: 0.10 },
  { min: 23200, max: 94300, rate: 0.12 },
  { min: 94300, max: 201050, rate: 0.22 },
  { min: 201050, max: 383900, rate: 0.24 },
  { min: 383900, max: 487450, rate: 0.32 },
  { min: 487450, max: 731200, rate: 0.35 },
  { min: 731200, max: Infinity, rate: 0.37 },
];

const STANDARD_DEDUCTION = {
  single: 14600,
  joint: 29200,
  head: 21900
};

// Preset States for State Tax Rates
const STATE_TAX_PRESETS: { label: string; rate: number }[] = [
  { label: 'California (CA) ~9.3%', rate: 9.3 },
  { label: 'New York (NY) ~6.5%', rate: 6.5 },
  { label: 'Texas / Florida / Washington (0%)', rate: 0.0 },
  { label: 'Illinois (IL) ~4.95%', rate: 4.95 },
  { label: 'Massachusetts (MA) ~5.0%', rate: 5.0 },
  { label: 'Custom Rate', rate: 5.0 }
];

interface ExpenseItem {
  id: string;
  name: string;
  monthlyAmount: number;
  category: 'software' | 'equipment' | 'insurance' | 'marketing' | 'accounting' | 'office' | 'other';
}

interface PresetProfile {
  name: string;
  desc: string;
  desiredSalary: number;
  profitMargin: number;
  weeksWorked: number;
  totalWeeklyHours: number;
  billableWeeklyHours: number;
  stateTaxRate: number;
  filingStatus: 'single' | 'joint' | 'head';
  expenses: ExpenseItem[];
}

const PRESET_PROFILES: PresetProfile[] = [
  {
    name: 'Mid-Level Freelance Designer / Dev',
    desc: '$75k target salary, 28 billable hrs/wk, moderate SaaS & equipment expenses.',
    desiredSalary: 75000,
    profitMargin: 15,
    weeksWorked: 48,
    totalWeeklyHours: 40,
    billableWeeklyHours: 28,
    stateTaxRate: 5.0,
    filingStatus: 'single',
    expenses: [
      { id: '1', name: 'Software & SaaS (Adobe, Figma, Hosting)', monthlyAmount: 180, category: 'software' },
      { id: '2', name: 'Health Insurance', monthlyAmount: 350, category: 'insurance' },
      { id: '3', name: 'Hardware & Equipment Reserve', monthlyAmount: 150, category: 'equipment' },
      { id: '4', name: 'Accounting & Tax Services', monthlyAmount: 100, category: 'accounting' }
    ]
  },
  {
    name: 'Senior Tech Consultant / Specialist',
    desc: '$130k target salary, high profit buffer, 25 billable hrs/wk, full business ops.',
    desiredSalary: 130000,
    profitMargin: 20,
    weeksWorked: 46,
    totalWeeklyHours: 40,
    billableWeeklyHours: 25,
    stateTaxRate: 6.5,
    filingStatus: 'single',
    expenses: [
      { id: '1', name: 'SaaS Suite & AI Tools', monthlyAmount: 300, category: 'software' },
      { id: '2', name: 'Health & Disability Insurance', monthlyAmount: 500, category: 'insurance' },
      { id: '3', name: 'Co-Working / Office Desk', monthlyAmount: 350, category: 'office' },
      { id: '4', name: 'Marketing, Legal & Accounting', monthlyAmount: 250, category: 'accounting' }
    ]
  },
  {
    name: 'Part-Time Side-Hustler',
    desc: '$30k supplementary target salary, 12 billable hrs/wk, minimal overhead.',
    desiredSalary: 30000,
    profitMargin: 10,
    weeksWorked: 48,
    totalWeeklyHours: 15,
    billableWeeklyHours: 12,
    stateTaxRate: 4.95,
    filingStatus: 'single',
    expenses: [
      { id: '1', name: 'Software Subscriptions', monthlyAmount: 80, category: 'software' }
    ]
  }
];

export default function FreelanceRateEstimator() {
  // Core State
  const [desiredSalary, setDesiredSalary] = useState<number>(85000);
  const [profitMargin, setProfitMargin] = useState<number>(15); // %
  const [retirementContribution, setRetirementContribution] = useState<number>(6000); // annual $/yr
  
  // Capacity State
  const [weeksWorked, setWeeksWorked] = useState<number>(48); // 4 weeks PTO/holidays
  const [totalWeeklyHours, setTotalWeeklyHours] = useState<number>(40);
  const [billableWeeklyHours, setBillableWeeklyHours] = useState<number>(28);

  // Tax Settings
  const [filingStatus, setFilingStatus] = useState<'single' | 'joint' | 'head'>('single');
  const [stateTaxRate, setStateTaxRate] = useState<number>(5.0);
  const [selectedStatePreset, setSelectedStatePreset] = useState<string>('Illinois (IL) ~4.95%');

  // Expenses list
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 'e1', name: 'Software & SaaS (Adobe, GitHub, Figma)', monthlyAmount: 150, category: 'software' },
    { id: 'e2', name: 'Health Insurance', monthlyAmount: 380, category: 'insurance' },
    { id: 'e3', name: 'Equipment & Hardware Depreciation', monthlyAmount: 120, category: 'equipment' },
    { id: 'e4', name: 'Legal, CPA & Tax Services', monthlyAmount: 90, category: 'accounting' }
  ]);

  // New Expense Input Modal/Inline Form
  const [newExpenseName, setNewExpenseName] = useState<string>('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number>(100);
  const [newExpenseCategory, setNewExpenseCategory] = useState<ExpenseItem['category']>('software');

  // Sensitivity Analysis Toggle
  const [sensitivityDropHours, setSensitivityDropHours] = useState<number>(20); // % drop in billable hours
  const [showSensitivity, setShowSensitivity] = useState<boolean>(false);

  // Copy Feedback
  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);

  // Load preset profile
  const applyPresetProfile = (preset: PresetProfile) => {
    setDesiredSalary(preset.desiredSalary);
    setProfitMargin(preset.profitMargin);
    setWeeksWorked(preset.weeksWorked);
    setTotalWeeklyHours(preset.totalWeeklyHours);
    setBillableWeeklyHours(preset.billableWeeklyHours);
    setStateTaxRate(preset.stateTaxRate);
    setFilingStatus(preset.filingStatus);
    setExpenses(preset.expenses);
  };

  // Add new expense item
  const handleAddExpense = () => {
    if (!newExpenseName.trim() || newExpenseAmount <= 0) return;
    const newItem: ExpenseItem = {
      id: `exp-${Date.now()}`,
      name: newExpenseName.trim(),
      monthlyAmount: newExpenseAmount,
      category: newExpenseCategory
    };
    setExpenses(prev => [...prev, newItem]);
    setNewExpenseName('');
    setNewExpenseAmount(100);
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // FINANCIAL CALCULATIONS ENGINE
  const calculations = useMemo(() => {
    // 1. Annual Business Overhead Expenses
    const totalMonthlyExpenses = expenses.reduce((acc, curr) => acc + curr.monthlyAmount, 0);
    const annualExpenses = totalMonthlyExpenses * 12;

    // 2. Total Net Personal Target (Salary + Retirement)
    const totalPersonalNetNeeds = desiredSalary + retirementContribution;

    // 3. Billable Capacity Metrics
    const annualBillableHours = weeksWorked * billableWeeklyHours;
    const annualTotalHours = weeksWorked * totalWeeklyHours;
    const utilizationRate = annualTotalHours > 0 ? (annualBillableHours / annualTotalHours) * 100 : 0;
    const unbillableWeeklyHours = Math.max(0, totalWeeklyHours - billableWeeklyHours);

    // 4. Tier-1 Self-Employment Tax (SECA)
    // SECA is calculated on 92.35% of Net Earnings.
    // 12.4% Social Security (up to ~$168,600 wage base) + 2.9% Medicare = 15.3%
    const seTaxableFactor = 0.9235;
    
    // We need gross revenue such that: Gross Revenue - Annual Expenses - Taxes = Net Personal Needs + Profit
    // Let's perform iterative or exact tax formula approximation:
    // Est Net Operating Income before Income Tax = Gross Revenue - Annual Expenses
    // SE Tax = Net Operating Income * 0.9235 * 0.153 (capped SS portion if applicable)
    // Half of SE Tax is deductible for Federal Income Tax calculations.

    // Let's run a precise solver function for Gross Revenue required:
    let estimatedGrossRevenue = totalPersonalNetNeeds + annualExpenses;
    
    // Iterative convergence solver (3 iterations is highly accurate)
    let seTax = 0;
    let federalTax = 0;
    let stateTax = 0;
    let profitBufferAmount = 0;

    for (let i = 0; i < 5; i++) {
      // Profit buffer on top of revenue
      profitBufferAmount = (estimatedGrossRevenue * (profitMargin / 100));
      
      const netProfitBeforeTax = Math.max(0, estimatedGrossRevenue - annualExpenses);
      
      // SE Tax
      const seNetEarnings = netProfitBeforeTax * seTaxableFactor;
      const ssTaxable = Math.min(seNetEarnings, 168600);
      const ssTax = ssTaxable * 0.124;
      const medicareTax = seNetEarnings * 0.029;
      seTax = ssTax + medicareTax;

      // Adjusted Gross Income (AGI) after 1/2 SE Tax deduction
      const halfSeDeduction = seTax / 2;
      const taxableIncomeBeforeDeduction = Math.max(0, netProfitBeforeTax - halfSeDeduction);
      const deduction = STANDARD_DEDUCTION[filingStatus];
      const taxableIncome = Math.max(0, taxableIncomeBeforeDeduction - deduction);

      // Federal Income Tax
      const brackets = filingStatus === 'joint' ? FEDERAL_BRACKETS_JOINT : FEDERAL_BRACKETS_SINGLE;
      federalTax = 0;
      for (const b of brackets) {
        if (taxableIncome > b.min) {
          const taxableInBracket = Math.min(taxableIncome, b.max) - b.min;
          federalTax += taxableInBracket * b.rate;
        }
      }

      // State Tax
      stateTax = taxableIncome * (stateTaxRate / 100);

      // Recalculate needed Gross Revenue
      const totalTaxes = seTax + federalTax + stateTax;
      estimatedGrossRevenue = totalPersonalNetNeeds + annualExpenses + totalTaxes + profitBufferAmount;
    }

    const totalTaxes = seTax + federalTax + stateTax;
    const requiredGrossRevenue = Math.max(0, estimatedGrossRevenue);

    // Hourly Rate Outputs
    const minBreakEvenHourlyRate = annualBillableHours > 0 ? (requiredGrossRevenue - profitBufferAmount) / annualBillableHours : 0;
    const targetRecommendedHourlyRate = annualBillableHours > 0 ? requiredGrossRevenue / annualBillableHours : 0;
    const valueBasedHourlyRate = targetRecommendedHourlyRate * 1.25; // +25% premium margin

    // Equivalents
    const dayRate = targetRecommendedHourlyRate * 8; // 8 hr billable day
    const monthlyRetainer = targetRecommendedHourlyRate * (annualBillableHours / 12);

    // Tax Retention Percentage (Amount to set aside from every invoice payment)
    const effectiveTaxRateOnGross = requiredGrossRevenue > 0 ? (totalTaxes / requiredGrossRevenue) * 100 : 0;
    const recommendedInvoiceTaxRetentionPct = Math.min(50, Math.max(15, effectiveTaxRateOnGross + 2)); // +2% buffer safety net

    // Quarterly Tax Voucher Estimates
    const quarterlyTaxPayment = totalTaxes / 4;

    // Chart Data
    const chartData = [
      { name: 'Take-Home Salary', value: Math.round(desiredSalary), color: '#10b981' },
      { name: 'Self-Emp & Income Taxes', value: Math.round(totalTaxes), color: '#ef4444' },
      { name: 'Business Overhead', value: Math.round(annualExpenses), color: '#3b82f6' },
      { name: 'Profit Buffer & Savings', value: Math.round(profitBufferAmount + retirementContribution), color: '#8b5cf6' },
    ];

    return {
      annualExpenses,
      annualBillableHours,
      annualTotalHours,
      utilizationRate,
      unbillableWeeklyHours,
      seTax,
      federalTax,
      stateTax,
      totalTaxes,
      requiredGrossRevenue,
      profitBufferAmount,
      minBreakEvenHourlyRate,
      targetRecommendedHourlyRate,
      valueBasedHourlyRate,
      dayRate,
      monthlyRetainer,
      effectiveTaxRateOnGross,
      recommendedInvoiceTaxRetentionPct,
      quarterlyTaxPayment,
      chartData
    };
  }, [
    desiredSalary, profitMargin, retirementContribution, weeksWorked, 
    totalWeeklyHours, billableWeeklyHours, filingStatus, stateTaxRate, expenses
  ]);

  // Sensitivity comparison calculation
  const sensitivityCalculations = useMemo(() => {
    const reducedWeeklyHours = Math.max(1, billableWeeklyHours * (1 - sensitivityDropHours / 100));
    const reducedAnnualBillableHours = weeksWorked * reducedWeeklyHours;
    const adjustedTargetRate = reducedAnnualBillableHours > 0 ? calculations.requiredGrossRevenue / reducedAnnualBillableHours : 0;

    return {
      reducedWeeklyHours,
      reducedAnnualBillableHours,
      adjustedTargetRate,
      rateDiff: adjustedTargetRate - calculations.targetRecommendedHourlyRate
    };
  }, [billableWeeklyHours, sensitivityDropHours, weeksWorked, calculations.requiredGrossRevenue, calculations.targetRecommendedHourlyRate]);

  // Copy Quote Breakdown
  const handleCopyQuoteSummary = () => {
    const summaryText = `
=== FREELANCE FINANCIAL & BILLABLE RATE SUMMARY ===
Target Net Salary: $${desiredSalary.toLocaleString()}/yr
Annual Business Overhead: $${calculations.annualExpenses.toLocaleString()}/yr
Calculated Gross Revenue Goal: $${Math.round(calculations.requiredGrossRevenue).toLocaleString()}/yr

--- BILLABLE RATE TIERS ---
• Minimum Break-Even Rate: $${calculations.minBreakEvenHourlyRate.toFixed(2)} / hr
• Recommended Target Rate: $${calculations.targetRecommendedHourlyRate.toFixed(2)} / hr
• Value-Based Premium Rate: $${calculations.valueBasedHourlyRate.toFixed(2)} / hr
• Day Rate Equivalent (8 hrs): $${Math.round(calculations.dayRate).toLocaleString()} / day
• Monthly Retainer (1/12th capacity): $${Math.round(calculations.monthlyRetainer).toLocaleString()} / mo

--- TAX RETENTION VOUCHERS ---
• Effective Combined Tax Liability: $${Math.round(calculations.totalTaxes).toLocaleString()} / yr (~${calculations.effectiveTaxRateOnGross.toFixed(1)}%)
• Recommended Invoice Tax Reserve: Set aside ${calculations.recommendedInvoiceTaxRetentionPct.toFixed(1)}% of every incoming invoice.
• Estimated Quarterly Taxes: $${Math.round(calculations.quarterlyTaxPayment).toLocaleString()} / quarter (Apr 15, Jun 15, Sep 15, Jan 15).

Generated with APEX Freelance Rate & Tax Retention Estimator.
`.trim();

    navigator.clipboard.writeText(summaryText);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);

    addRecentOperation(
      'Freelance Rate Summary',
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
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Freelance Rate & Tax Retention Estimator
                </h1>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                  SECA Tax Model
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                Determine your billable hourly rates based on business overhead, profit buffers, and Tier-1 self-employment taxes.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyQuoteSummary}
            className="flex items-center space-x-2 rounded-xl bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition border border-emerald-500/40 shrink-0"
          >
            {copiedQuote ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copiedQuote ? 'Summary Copied!' : 'Copy Rate Summary'}</span>
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-4 pt-4 border-t border-emerald-500/20 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 flex items-center space-x-1 mr-2">
            <Briefcase className="h-3.5 w-3.5 text-emerald-400" />
            <span>Load Quick Profile:</span>
          </span>
          {PRESET_PROFILES.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPresetProfile(p)}
              className="rounded-lg bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 border border-zinc-700/80 transition"
              title={p.desc}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Results Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Min Break-Even Rate */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-2 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Minimum Break-Even</span>
            <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-slate-300">Zero Profit</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-200 font-mono">
            ${calculations.minBreakEvenHourlyRate.toFixed(2)}
            <span className="text-xs font-normal text-slate-400">/hr</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Covers personal salary, overhead & taxes only.
          </p>
        </div>

        {/* Target Recommended Rate */}
        <div className="rounded-xl border border-emerald-500/50 bg-gradient-to-br from-emerald-950/30 via-zinc-900 to-zinc-950 p-4 space-y-2 shadow-xl relative overflow-hidden ring-1 ring-emerald-500/30">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span className="flex items-center space-x-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Target Recommended Rate</span>
            </span>
            <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/30">
              +{profitMargin}% Buffer
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            ${calculations.targetRecommendedHourlyRate.toFixed(2)}
            <span className="text-xs font-normal text-emerald-300/80">/hr</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Includes business profit buffer for cash flow & growth.
          </p>
        </div>

        {/* Premium Value-Based Rate */}
        <div className="rounded-xl border border-purple-500/40 bg-zinc-900/80 p-4 space-y-2 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-purple-400 font-medium">
            <span>Premium / Value Rate</span>
            <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded text-purple-300">+25% Margin</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-300 font-mono">
            ${calculations.valueBasedHourlyRate.toFixed(2)}
            <span className="text-xs font-normal text-slate-400">/hr</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Ideal for specialized expertise & high-value consulting.
          </p>
        </div>

        {/* Tax Retention Invoice Reserve % */}
        <div className="rounded-xl border border-amber-500/40 bg-zinc-900/80 p-4 space-y-2 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Tax Retention Reserve</span>
            </span>
            <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">Every Invoice</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
            {calculations.recommendedInvoiceTaxRetentionPct.toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-400">
            Set aside on every payment into dedicated tax savings account.
          </p>
        </div>
      </div>

      {/* Main Form & Financial Analytics Split (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Configuration Controls (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Section 1: Income Goals & Profit */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-zinc-800 pb-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span>1. Take-Home Salary & Profit Goals</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Desired Take-Home Salary */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Desired Net Annual Salary ($/yr):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500">$</span>
                  <input
                    type="number"
                    value={desiredSalary}
                    onChange={(e) => setDesiredSalary(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-7 pr-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    step={1000}
                  />
                </div>
              </div>

              {/* Profit Margin Buffer % */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Profit Margin Buffer (%):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">%</span>
                </div>
              </div>

              {/* Annual Retirement / IRA Contribution */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-slate-300 block">
                  Annual Retirement / IRA Contribution ($/yr):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500">$</span>
                  <input
                    type="number"
                    value={retirementContribution}
                    onChange={(e) => setRetirementContribution(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-7 pr-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    step={500}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Billable Capacity & Utilization */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-zinc-800 pb-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>2. Capacity & Utilization Ratio</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Weeks Worked */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Weeks Worked / yr:
                </label>
                <input
                  type="number"
                  value={weeksWorked}
                  onChange={(e) => setWeeksWorked(Math.max(1, Math.min(52, Number(e.target.value))))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">({52 - weeksWorked} wks PTO/leave)</span>
              </div>

              {/* Total Weekly Hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Total Hrs Worked / wk:
                </label>
                <input
                  type="number"
                  value={totalWeeklyHours}
                  onChange={(e) => setTotalWeeklyHours(Math.max(1, Math.min(80, Number(e.target.value))))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Billable Weekly Hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Billable Hrs / wk:
                </label>
                <input
                  type="number"
                  value={billableWeeklyHours}
                  onChange={(e) => setBillableWeeklyHours(Math.max(1, Math.min(totalWeeklyHours, Number(e.target.value))))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Utilization Bar */}
            <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Billable Utilization Ratio:</span>
                <span className="font-semibold text-emerald-400">{calculations.utilizationRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, calculations.utilizationRate)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>{calculations.annualBillableHours} Billable Hrs/yr</span>
                <span>{calculations.unbillableWeeklyHours} hrs/wk Admin & Sales</span>
              </div>
            </div>
          </div>

          {/* Section 3: Tax Structure & Filing Presets */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-zinc-800 pb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>3. Tax Structure & State Location</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Filing Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Filing Status:</label>
                <select
                  value={filingStatus}
                  onChange={(e) => setFilingStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="single">Single ($14,600 standard ded.)</option>
                  <option value="joint">Married Filing Jointly ($29,200 ded.)</option>
                  <option value="head">Head of Household ($21,900 ded.)</option>
                </select>
              </div>

              {/* State Preset */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">State Tax Preset:</label>
                <select
                  value={selectedStatePreset}
                  onChange={(e) => {
                    const found = STATE_TAX_PRESETS.find(p => p.label === e.target.value);
                    if (found) {
                      setSelectedStatePreset(found.label);
                      setStateTaxRate(found.rate);
                    }
                  }}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  {STATE_TAX_PRESETS.map((st, i) => (
                    <option key={i} value={st.label}>{st.label}</option>
                  ))}
                </select>
              </div>

              {/* Custom State Tax Rate */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-slate-300 block">
                  Effective State Income Tax Rate (%):
                </label>
                <input
                  type="number"
                  value={stateTaxRate}
                  onChange={(e) => setStateTaxRate(Math.max(0, Math.min(20, Number(e.target.value))))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  step={0.1}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Itemized Business Expenses */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                <span>4. Recurring Business Overhead</span>
              </h3>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                ${calculations.annualExpenses.toLocaleString()} / yr
              </span>
            </div>

            {/* Expenses List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {expenses.map((exp) => (
                <div 
                  key={exp.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950 p-2.5 text-xs text-slate-200"
                >
                  <div>
                    <span className="font-medium text-white">{exp.name}</span>
                    <span className="text-[10px] text-slate-500 block capitalize">{exp.category}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-emerald-400">${exp.monthlyAmount}/mo</span>
                    <button
                      onClick={() => handleRemoveExpense(exp.id)}
                      className="text-slate-500 hover:text-rose-400 transition"
                      title="Remove expense"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Expense Controls */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <span className="text-xs font-medium text-slate-300 block">Add New Recurring Expense:</span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Expense name (e.g. Adobe Creative Cloud)"
                  value={newExpenseName}
                  onChange={(e) => setNewExpenseName(e.target.value)}
                  className="sm:col-span-6 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Monthly $"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(Number(e.target.value))}
                  className="sm:col-span-4 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={handleAddExpense}
                  className="sm:col-span-2 flex items-center justify-center space-x-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition border border-emerald-500/30"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Visual Revenue Breakdown & Pricing Cards (6 cols) */}
        <div className="lg:col-span-6 space-y-6">

          {/* Pricing Equivalent Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-1">
              <span className="text-xs text-slate-400 block">Day Rate Equivalent (8 hrs):</span>
              <div className="text-xl font-bold text-white font-mono">
                ${Math.round(calculations.dayRate).toLocaleString()}
                <span className="text-xs font-normal text-slate-400">/day</span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-1">
              <span className="text-xs text-slate-400 block">Monthly Retainer (80 hrs):</span>
              <div className="text-xl font-bold text-white font-mono">
                ${Math.round(calculations.monthlyRetainer).toLocaleString()}
                <span className="text-xs font-normal text-slate-400">/mo</span>
              </div>
            </div>
          </div>

          {/* Revenue Allocation Donut Chart */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <PieChartIcon className="h-4 w-4 text-emerald-400" />
                <span>Gross Revenue Allocation Breakdown</span>
              </h3>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Goal: ${Math.round(calculations.requiredGrossRevenue).toLocaleString()} / yr
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={calculations.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {calculations.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Financial Summary Breakdown List */}
            <div className="space-y-2 border-t border-zinc-800 pt-3 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Net Take-Home Salary:</span>
                <span className="font-mono text-emerald-400 font-semibold">${desiredSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Total Tax Liability (SECA + Fed + State):</span>
                <span className="font-mono text-rose-400 font-semibold">${Math.round(calculations.totalTaxes).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Business Overhead Expenses:</span>
                <span className="font-mono text-blue-400 font-semibold">${calculations.annualExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Profit Buffer & Retirement Savings:</span>
                <span className="font-mono text-purple-400 font-semibold">${Math.round(calculations.profitBufferAmount + retirementContribution).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quarterly Tax Voucher Schedule Card */}
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-zinc-900 to-zinc-950 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-amber-300 flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                <span>Estimated Quarterly Tax Payment Vouchers</span>
              </h3>
              <span className="text-xs font-mono font-bold text-amber-400">
                ${Math.round(calculations.quarterlyTaxPayment).toLocaleString()} / quarter
              </span>
            </div>

            <p className="text-xs text-slate-300">
              IRS 1040-ES estimated quarterly payments based on SECA self-employment tax (15.3%) and standard income tax brackets:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-zinc-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Q1 (Jan - Mar)</span>
                <span className="text-xs font-bold text-amber-300 block mt-0.5">Apr 15</span>
                <span className="font-mono text-[11px] text-slate-300 block mt-1">${Math.round(calculations.quarterlyTaxPayment).toLocaleString()}</span>
              </div>
              <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-zinc-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Q2 (Apr - May)</span>
                <span className="text-xs font-bold text-amber-300 block mt-0.5">Jun 15</span>
                <span className="font-mono text-[11px] text-slate-300 block mt-1">${Math.round(calculations.quarterlyTaxPayment).toLocaleString()}</span>
              </div>
              <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-zinc-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Q3 (Jun - Aug)</span>
                <span className="text-xs font-bold text-amber-300 block mt-0.5">Sep 15</span>
                <span className="font-mono text-[11px] text-slate-300 block mt-1">${Math.round(calculations.quarterlyTaxPayment).toLocaleString()}</span>
              </div>
              <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-zinc-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Q4 (Sep - Dec)</span>
                <span className="text-xs font-bold text-amber-300 block mt-0.5">Jan 15</span>
                <span className="font-mono text-[11px] text-slate-300 block mt-1">${Math.round(calculations.quarterlyTaxPayment).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Interactive Sensitivity / Scenario Testing Accordion */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <button
              onClick={() => setShowSensitivity(!showSensitivity)}
              className="w-full flex items-center justify-between text-sm font-semibold text-white"
            >
              <span className="flex items-center space-x-2">
                <Sliders className="h-4 w-4 text-emerald-400" />
                <span>Scenario Testing: "What if billable hours drop?"</span>
              </span>
              {showSensitivity ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showSensitivity && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-2 border-t border-zinc-800"
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Simulated Drop in Billable Client Hours:</span>
                    <span className="font-bold text-rose-400">-{sensitivityDropHours}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={sensitivityDropHours}
                    onChange={(e) => setSensitivityDropHours(Number(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>

                <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Adjusted Billable Hours / Week:</span>
                    <span className="font-mono font-bold text-white">{sensitivityCalculations.reducedWeeklyHours.toFixed(1)} hrs/wk</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>New Required Hourly Rate:</span>
                    <span className="font-mono font-bold text-rose-400">${sensitivityCalculations.adjustedTargetRate.toFixed(2)}/hr</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-zinc-800/80">
                    <span>Rate Difference Needed to Maintain Income:</span>
                    <span className="font-mono text-emerald-400">+${sensitivityCalculations.rateDiff.toFixed(2)}/hr</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

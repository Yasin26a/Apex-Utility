import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Percent, RefreshCw, HelpCircle, DollarSign, Calendar, TrendingUp } from 'lucide-react';

export default function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState<number>(250000);
  const [interestRate, setInterestRate] = useState<number>(6.5);
  const [loanTerm, setLoanTerm] = useState<number>(15); // years

  const [monthlyEmi, setMonthlyEmi] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [amortization, setAmortization] = useState<{ month: number; emi: number; principal: number; interest: number; balance: number }[]>([]);

  const calculateLoan = () => {
    const P = loanAmount;
    const r = (interestRate / 12) / 100;
    const n = loanTerm * 12;

    // EMI = [P x r x (1+r)^n] / [((1+r)^n)-1]
    let emi = 0;
    if (r === 0) {
      emi = P / n;
    } else {
      emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const totalPayable = emi * n;
    const totalInt = totalPayable - P;

    setMonthlyEmi(Number(emi.toFixed(2)));
    setTotalInterest(Number(totalInt.toFixed(2)));
    setTotalPayment(Number(totalPayable.toFixed(2)));

    // Generate brief amortization sample points
    const schedule = [];
    let balance = P;
    const displayMonths = Math.min(n, 12); // Display first year amortization schedule

    for (let i = 1; i <= displayMonths; i++) {
      const interestPay = balance * r;
      const principalPay = emi - interestPay;
      balance -= principalPay;

      schedule.push({
        month: i,
        emi: Number(emi.toFixed(2)),
        principal: Number(principalPay.toFixed(2)),
        interest: Number(interestPay.toFixed(2)),
        balance: Number(Math.max(balance, 0).toFixed(2))
      });
    }
    setAmortization(schedule);
  };

  useEffect(() => {
    calculateLoan();
  }, [loanAmount, interestRate, loanTerm]);

  return (
    <div className="space-y-6" id="loan-calculator-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-400" />
          <span>Precision Loan &amp; EMI Calculator</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Compute monthly loan repayment installments, isolate overall lifetime interest payables, and model dynamic amortization structures for financing decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Setup sliders */}
        <div className="lg:col-span-5 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4">
          <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
            <span>Principal parameters</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Amount Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-400">1. Total Loan Principal</span>
                <span className="text-indigo-400 font-bold">${loanAmount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="1000000"
                step="5000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>

            {/* Interest Rate */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-400">2. Annual Interest Rate</span>
                <span className="text-indigo-400 font-bold">{interestRate}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>

            {/* Term years */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-400">3. Repayment Timeline Term</span>
                <span className="text-indigo-400 font-bold">{loanTerm} Years</span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>
          </div>
        </div>

        {/* Readout calculations */}
        <div className="lg:col-span-7 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between min-h-[400px]">
          <div className="space-y-4 w-full flex-1 flex flex-col">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-2">
              Amortization repayments matrix
            </h3>

            {/* Repayments summary blocks */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-zinc-950 rounded border border-zinc-900">
                <span className="block text-zinc-500 text-[8px] font-mono uppercase">Monthly EMI</span>
                <span className="font-mono text-indigo-400 text-sm font-black">${monthlyEmi.toLocaleString()}</span>
              </div>

              <div className="p-3 bg-zinc-950 rounded border border-zinc-900">
                <span className="block text-zinc-500 text-[8px] font-mono uppercase">Total Interest</span>
                <span className="font-mono text-zinc-300 text-sm font-bold">${totalInterest.toLocaleString()}</span>
              </div>

              <div className="p-3 bg-zinc-950 rounded border border-zinc-900">
                <span className="block text-zinc-500 text-[8px] font-mono uppercase">Total Payable</span>
                <span className="font-mono text-zinc-300 text-sm font-bold">${totalPayment.toLocaleString()}</span>
              </div>
            </div>

            {/* Brief Amortization Table */}
            <div className="space-y-2 flex-1 flex flex-col">
              <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                Principal Amortization Schedule (First 12 Months)
              </span>

              <div className="overflow-x-auto flex-1 border border-zinc-900 rounded-lg bg-zinc-950 max-h-56">
                <table className="w-full text-[10px] font-sans text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-500 font-mono uppercase text-[8px]">
                      <th className="p-2 border-r border-zinc-800">Month</th>
                      <th className="p-2 border-r border-zinc-800">EMI</th>
                      <th className="p-2 border-r border-zinc-800">Principal</th>
                      <th className="p-2 border-r border-zinc-800">Interest</th>
                      <th className="p-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortization.map((row) => (
                      <tr key={row.month} className="border-b border-zinc-900/50 hover:bg-zinc-900/10">
                        <td className="p-2 border-r border-zinc-900 font-mono font-bold text-zinc-500">#{row.month}</td>
                        <td className="p-2 border-r border-zinc-900 text-zinc-300 font-mono">${row.emi}</td>
                        <td className="p-2 border-r border-zinc-900 text-emerald-400 font-mono">${row.principal}</td>
                        <td className="p-2 border-r border-zinc-900 text-rose-400/80 font-mono">${row.interest}</td>
                        <td className="p-2 text-zinc-400 font-mono">${row.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

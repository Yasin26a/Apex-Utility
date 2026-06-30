import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, RefreshCw, Clock, Gift, ShieldCheck } from 'lucide-react';

export default function AgeCalculator() {
  const [birthdate, setBirthdate] = useState('1998-06-15');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCalculating, setIsCalculating] = useState(false);

  const [results, setResults] = useState<{
    years: number;
    months: number;
    days: number;
    totalDays: number;
    totalWeeks: number;
    totalHours: number;
    daysToNextBirthday: number;
  } | null>(null);

  const calculateAge = () => {
    if (!birthdate) return;
    setIsCalculating(true);

    const bDate = new Date(birthdate);
    const tDate = new Date(targetDate);

    // Standard age calculations
    let years = tDate.getFullYear() - bDate.getFullYear();
    let months = tDate.getMonth() - bDate.getMonth();
    let days = tDate.getDate() - bDate.getDate();

    if (days < 0) {
      months--;
      // Get days in previous month
      const prevMonth = new Date(tDate.getFullYear(), tDate.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    // Total elapsed calculations
    const diffMs = tDate.getTime() - bDate.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = totalDays * 24;

    // Remaining days to next birthday
    const nextBday = new Date(tDate.getFullYear(), bDate.getMonth(), bDate.getDate());
    if (tDate > nextBday) {
      nextBday.setFullYear(tDate.getFullYear() + 1);
    }
    const diffBdayMs = nextBday.getTime() - tDate.getTime();
    const daysToNextBirthday = Math.ceil(diffBdayMs / (1000 * 60 * 60 * 24));

    setTimeout(() => {
      setResults({
        years,
        months,
        days,
        totalDays,
        totalWeeks,
        totalHours,
        daysToNextBirthday
      });
      setIsCalculating(false);
    }, 400);
  };

  useEffect(() => {
    calculateAge();
  }, [birthdate, targetDate]);

  return (
    <div className="space-y-6" id="age-calculator-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-400" />
          <span>Precision Age &amp; Date Calculator</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Compute chronological age intervals between specific calendar nodes, map elapsed week/hour matrices, and trace remaining countdown targets before milestones.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input variables */}
        <div className="lg:col-span-5 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4">
          <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Timelines</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                1. Date of Birth
              </span>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 text-sm font-mono text-zinc-300 rounded p-2 focus:outline-none"
              />
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                2. Age At Target Date
              </span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 text-sm font-mono text-zinc-300 rounded p-2 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Results readout */}
        <div className="lg:col-span-7 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between min-h-[400px]">
          <div className="space-y-4 w-full flex-1 flex flex-col">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-2">
              Age Breakdown metrics
            </h3>

            {isCalculating && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs font-mono text-zinc-400 animate-pulse uppercase tracking-wider">Compiling chronological offsets...</p>
              </div>
            )}

            {!results && !isCalculating && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 space-y-2 border border-dashed border-zinc-900 rounded-lg w-full">
                <Calendar className="w-8 h-8 opacity-40 text-indigo-400" />
                <p className="text-xs">Provide birthdates on the left to reveal age timelines.</p>
              </div>
            )}

            {results && !isCalculating && (
              <div className="space-y-4 w-full text-xs">
                {/* Years, Months, Days breakdown card */}
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 flex justify-between items-center text-center">
                  <div className="space-y-1 flex-1">
                    <span className="block text-2xl font-mono font-black text-indigo-400">{results.years}</span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Years</span>
                  </div>
                  <div className="w-px h-10 bg-zinc-900"></div>
                  <div className="space-y-1 flex-1">
                    <span className="block text-2xl font-mono font-black text-indigo-400">{results.months}</span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Months</span>
                  </div>
                  <div className="w-px h-10 bg-zinc-900"></div>
                  <div className="space-y-1 flex-1">
                    <span className="block text-2xl font-mono font-black text-indigo-400">{results.days}</span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Days</span>
                  </div>
                </div>

                {/* Next birthday projection */}
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900/60 flex items-center gap-3.5">
                  <Gift className="w-5 h-5 text-indigo-400 animate-bounce" />
                  <div className="space-y-0.5 text-xs text-zinc-300">
                    <span className="block font-bold">Countdown to next birthday</span>
                    <span className="text-zinc-500">Only <strong>{results.daysToNextBirthday} days</strong> left until your next milestone celebration!</span>
                  </div>
                </div>

                {/* Total elapsed metrics grids */}
                <div className="grid grid-cols-3 gap-2 border-t border-zinc-900 pt-3">
                  <div className="p-3 bg-zinc-950 rounded border border-zinc-900 text-center">
                    <span className="block text-zinc-500 text-[9px] font-mono uppercase">Total Days</span>
                    <span className="font-mono text-zinc-300 font-bold">{results.totalDays.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded border border-zinc-900 text-center">
                    <span className="block text-zinc-500 text-[9px] font-mono uppercase">Total Weeks</span>
                    <span className="font-mono text-zinc-300 font-bold">{results.totalWeeks.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded border border-zinc-900 text-center">
                    <span className="block text-zinc-500 text-[9px] font-mono uppercase">Total Hours</span>
                    <span className="font-mono text-zinc-300 font-bold">{results.totalHours.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Calendar as CalendarIcon, Clock, Plus, Minus, ArrowRight, RefreshCcw, 
  Layers, CheckCircle, Info, Flame, Sparkles, Globe, CalendarDays, Hourglass, 
  Compass, Heart, Gift, Ship, HelpCircle, FastForward
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logToolUsage } from '../utils/toolAnalytics';

// Major global timezones for conversion list
const GLOBAL_TIMEZONES = [
  { name: 'UTC / GMT Offset', zone: 'UTC' },
  { name: 'New York (EST/EDT)', zone: 'America/New_York' },
  { name: 'Los Angeles (PST/PDT)', zone: 'America/Los_Zone' }, // Fallback America/Los_Angeles
  { name: 'London (GMT/BST)', zone: 'Europe/London' },
  { name: 'Berlin / Paris (CET/CEST)', zone: 'Europe/Paris' },
  { name: 'Tokyo (JST)', zone: 'Asia/Tokyo' },
  { name: 'Sydney (AEST/AEDT)', zone: 'Australia/Sydney' },
  { name: 'New Delhi (IST)', zone: 'Asia/Kolkata' },
  { name: 'Singapore (SGT)', zone: 'Asia/Singapore' },
  { name: 'Dubai (GST)', zone: 'Asia/Dubai' },
];

export default function DateCalculator() {
  const { t } = useLanguage();

  // Active calculator mode tab
  const [activeSubTab, setActiveSubTab] = useState<'difference' | 'add-subtract' | 'business-days' | 'age-calculator' | 'timezones'>('difference');

  // Register analytical usage
  useEffect(() => {
    logToolUsage('date-calculator');
  }, []);

  // --- MODE 1: DATE DIFFERENCE ---
  const [diffDate1, setDiffDate1] = useState<string>(new Date().toISOString().split('T')[0]);
  const [diffDate2, setDiffDate2] = useState<string>(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().split('T')[0];
  });
  const [includeEndDate, setIncludeEndDate] = useState<boolean>(false);

  // Computed results for Date Difference
  const diffResults = useMemo(() => {
    if (!diffDate1 || !diffDate2) return null;
    const d1 = new Date(diffDate1 + 'T00:00:00');
    const d2 = new Date(diffDate2 + 'T00:00:00');
    
    const start = d1 < d2 ? d1 : d2;
    const end = d1 < d2 ? d2 : d1;
    
    let endAdjusted = new Date(end);
    if (includeEndDate) {
      endAdjusted.setDate(endAdjusted.getDate() + 1);
    }

    const totalMs = endAdjusted.getTime() - start.getTime();
    const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const leftoverDays = totalDays % 7;

    // Direct Year / Month / Day accurate calendar calculation
    let years = endAdjusted.getFullYear() - start.getFullYear();
    let months = endAdjusted.getMonth() - start.getMonth();
    let days = endAdjusted.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      // Get days in previous month
      const prevMonth = new Date(endAdjusted.getFullYear(), endAdjusted.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    // Exact minutes/seconds breakdown
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;
    const totalSeconds = totalMinutes * 60;

    // Working Business Days calculation
    let businessDays = 0;
    let weekendDays = 0;
    const tempDate = new Date(start);
    while (tempDate < endAdjusted) {
      const day = tempDate.getDay();
      if (day === 0 || day === 6) {
        weekendDays++;
      } else {
        businessDays++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    return {
      isReverse: d1 > d2,
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      leftoverDays,
      totalHours,
      totalMinutes,
      totalSeconds,
      businessDays,
      weekendDays
    };
  }, [diffDate1, diffDate2, includeEndDate]);


  // --- MODE 2: ADD OR SUBTRACT INTERVALLS ---
  const [baseDate, setBaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [baseTime, setBaseTime] = useState<string>('09:00');
  const [intervalYears, setIntervalYears] = useState<number>(0);
  const [intervalMonths, setIntervalMonths] = useState<number>(0);
  const [intervalWeeks, setIntervalWeeks] = useState<number>(0);
  const [intervalDays, setIntervalDays] = useState<number>(0);
  const [intervalHours, setIntervalHours] = useState<number>(0);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(0);
  const [opDirection, setOpDirection] = useState<'add' | 'subtract'>('add');
  const [onlyBusinessOffset, setOnlyBusinessOffset] = useState<boolean>(false);

  const calculatedOffsetDate = useMemo(() => {
    if (!baseDate) return null;
    const sourceDateTime = new Date(`${baseDate}T${baseTime || '00:00'}:00`);
    if (isNaN(sourceDateTime.getTime())) return null;

    let target = new Date(sourceDateTime);
    const mult = opDirection === 'add' ? 1 : -1;

    if (onlyBusinessOffset) {
      // Add or Subtract business days one step at a time
      // Sum target days to iterate
      const absoluteDays = (intervalYears * 365) + (intervalMonths * 30.4) + (intervalWeeks * 7) + intervalDays;
      let steps = Math.round(absoluteDays);
      while (steps > 0) {
        target.setDate(target.getDate() + mult);
        const day = target.getDay();
        if (day !== 0 && day !== 6) {
          steps--;
        }
      }
      // Apply hours/minutes
      target.setHours(target.getHours() + (intervalHours * mult));
      target.setMinutes(target.getMinutes() + (intervalMinutes * mult));
    } else {
      // Standard absolute offset calculations
      target.setFullYear(target.getFullYear() + (intervalYears * mult));
      target.setMonth(target.getMonth() + (intervalMonths * mult));
      target.setDate(target.getDate() + (intervalWeeks * 7 * mult) + (intervalDays * mult));
      target.setHours(target.getHours() + (intervalHours * mult));
      target.setMinutes(target.getMinutes() + (intervalMinutes * mult));
    }

    // Format week day label
    const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return {
      formatted: formatter.format(target),
      isoDate: target.toISOString().split('T')[0],
      isoTime: target.toTimeString().substring(0, 5),
      raw: target
    };
  }, [baseDate, baseTime, intervalYears, intervalMonths, intervalWeeks, intervalDays, intervalHours, intervalMinutes, opDirection, onlyBusinessOffset]);


  // --- MODE 3: BUSINESS DAYS & WORKING INTERVAL COUNT ---
  const [busStartDate, setBusStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [busEndDate, setBusEndDate] = useState<string>(() => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 90); // 3 months later
    return nextMonth.toISOString().split('T')[0];
  });
  const [excludeSat, setExcludeSat] = useState<boolean>(true);
  const [excludeSun, setExcludeSun] = useState<boolean>(true);
  const [customHolidaysText, setCustomHolidaysText] = useState<string>(''); // comma separated dates

  const businessDaysMetrics = useMemo(() => {
    if (!busStartDate || !busEndDate) return null;
    const d1 = new Date(busStartDate + 'T00:00:00');
    const d2 = new Date(busEndDate + 'T00:00:00');

    const start = d1 < d2 ? d1 : d2;
    const end = d1 < d2 ? d2 : d1;

    // Parse custom list dates
    const holidays = customHolidaysText.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => new Date(t + 'T00:00:00').getTime())
      .filter(num => !isNaN(num));

    let workDaysCount = 0;
    let weekendCount = 0;
    let holidayCount = 0;
    let elapsedDays = 0;

    const walker = new Date(start);
    while (walker <= end) {
      elapsedDays++;
      const day = walker.getDay();
      const currentMs = walker.getTime();

      const isHoliday = holidays.some(hMs => hMs === currentMs);
      const isSat = day === 6;
      const isSun = day === 0;

      let isWeekend = (isSat && excludeSat) || (isSun && excludeSun);

      if (isHoliday) {
        holidayCount++;
      } else if (isWeekend) {
        weekendCount++;
      } else {
        workDaysCount++;
      }

      walker.setDate(walker.getDate() + 1);
    }

    return {
      elapsedDays,
      workDays: workDaysCount,
      weekendsCount: weekendCount,
      holidaysCount: holidayCount,
      isReverse: d1 > d2
    };
  }, [busStartDate, busEndDate, excludeSat, excludeSun, customHolidaysText]);


  // --- MODE 4: INTERACTIVE AGE DETAIL FINDER ---
  const [birthday, setBirthday] = useState<string>('2000-01-01');

  const ageDetails = useMemo(() => {
    if (!birthday) return null;
    const dob = new Date(birthday + 'T00:00:00');
    const now = new Date();

    if (isNaN(dob.getTime())) return null;

    let ageYears = now.getFullYear() - dob.getFullYear();
    let ageMonths = now.getMonth() - dob.getMonth();
    let ageDays = now.getDate() - dob.getDate();

    if (ageDays < 0) {
      ageMonths--;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      ageDays += prevMonth.getDate();
    }
    if (ageMonths < 0) {
      ageYears--;
      ageMonths += 12;
    }

    // Absolute values
    const diffMs = now.getTime() - dob.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const nextBirthYear = now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate())
      ? now.getFullYear() + 1
      : now.getFullYear();

    const nextBirthday = new Date(nextBirthYear, dob.getMonth(), dob.getDate());
    const msToNextBirth = nextBirthday.getTime() - now.getTime();
    const daysToNextBirth = Math.ceil(msToNextBirth / (1000 * 60 * 60 * 24));

    // Born week day
    const birthDayOfWeek = dob.toLocaleDateString('en-US', { weekday: 'long' });

    // Leap year checks
    const isBirthYearLeap = (dob.getFullYear() % 4 === 0 && dob.getFullYear() % 100 !== 0) || (dob.getFullYear() % 400 === 0);

    // Zodiac sign
    const dayOfBirth = dob.getDate();
    const monthOfBirth = dob.getMonth() + 1; // 1-indexed
    let zodiac = '';

    if ((monthOfBirth === 3 && dayOfBirth >= 21) || (monthOfBirth === 4 && dayOfBirth <= 19)) zodiac = 'Aries ♈ (The Ram)';
    else if ((monthOfBirth === 4 && dayOfBirth >= 20) || (monthOfBirth === 5 && dayOfBirth <= 20)) zodiac = 'Taurus ♉ (The Bull)';
    else if ((monthOfBirth === 5 && dayOfBirth >= 21) || (monthOfBirth === 6 && dayOfBirth <= 20)) zodiac = 'Gemini ♊ (The Twins)';
    else if ((monthOfBirth === 6 && dayOfBirth >= 21) || (monthOfBirth === 7 && dayOfBirth <= 22)) zodiac = 'Cancer ♋ (The Crab)';
    else if ((monthOfBirth === 7 && dayOfBirth >= 23) || (monthOfBirth === 8 && dayOfBirth <= 22)) zodiac = 'Leo ♌ (The Lion)';
    else if ((monthOfBirth === 8 && dayOfBirth >= 23) || (monthOfBirth === 9 && dayOfBirth <= 22)) zodiac = 'Virgo ♍ (The Virgin)';
    else if ((monthOfBirth === 9 && dayOfBirth >= 23) || (monthOfBirth === 10 && dayOfBirth <= 22)) zodiac = 'Libra ♎ (The Scales)';
    else if ((monthOfBirth === 10 && dayOfBirth >= 23) || (monthOfBirth === 11 && dayOfBirth <= 21)) zodiac = 'Scorpio ♏ (The Scorpion)';
    else if ((monthOfBirth === 11 && dayOfBirth >= 22) || (monthOfBirth === 12 && dayOfBirth <= 21)) zodiac = 'Sagittarius ♐ (The Archer)';
    else if ((monthOfBirth === 12 && dayOfBirth >= 22) || (monthOfBirth === 1 && dayOfBirth <= 19)) zodiac = 'Capricorn ♑ (The Goat)';
    else if ((monthOfBirth === 1 && dayOfBirth >= 20) || (monthOfBirth === 2 && dayOfBirth <= 18)) zodiac = 'Aquarius ♒ (The Water Bearer)';
    else zodiac = 'Pisces ♓ (The Fish)';

    return {
      years: ageYears,
      months: ageMonths,
      days: ageDays,
      totalDays,
      daysToNextBirth,
      bornDay: birthDayOfWeek,
      isBirthYearLeap,
      zodiac
    };
  }, [birthday]);


  // --- MODE 5: TIMEZONE CONVERSIONS ---
  const [sourceEpoch, setSourceEpoch] = useState<string>(new Date().toISOString().substring(0, 16));

  const tzResults = useMemo(() => {
    if (!sourceEpoch) return [];
    const baseDateObj = new Date(sourceEpoch);
    if (isNaN(baseDateObj.getTime())) return [];

    return GLOBAL_TIMEZONES.map(({ name, zone }) => {
      try {
        const timeStr = baseDateObj.toLocaleTimeString('en-US', {
          timeZone: zone === 'America/Los_Zone' ? 'America/Los_Angeles' : zone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });

        const dateStr = baseDateObj.toLocaleDateString('en-US', {
          timeZone: zone === 'America/Los_Zone' ? 'America/Los_Angeles' : zone,
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        return { name, zone, dateStr, timeStr };
      } catch (err) {
        return { name, zone, dateStr: 'Unsupported zone', timeStr: '--:--:--' };
      }
    });

  }, [sourceEpoch]);


  return (
    <div id="date-calculator-container" className="flex-1 p-6 lg:p-10 w-full max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/20 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold text-sky-400 bg-sky-950/50 border border-sky-800/30">
              OFFLINE CALENDAR CORE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/30">
              ZERO NETWORK DELAY
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-sky-400" />
            {t.navigation.dateCalculator}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {t.navigation.dateCalculatorDesc}
          </p>
        </div>
      </div>

      {/* Calculator Mode Switch Tabs */}
      <div className="flex bg-[#0a0c10]/40 border border-slate-800/60 p-1 rounded-xl w-full max-w-4xl overflow-x-auto gap-1">
        <button
          onClick={() => setActiveSubTab('difference')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'difference'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          <Hourglass className="w-3.5 h-3.5" />
          Difference Interval
        </button>

        <button
          onClick={() => setActiveSubTab('add-subtract')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'add-subtract'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          <FastForward className="w-3.5 h-3.5" />
          Add / Subtract Interval
        </button>

        <button
          onClick={() => setActiveSubTab('business-days')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'business-days'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Business Days Count
        </button>

        <button
          onClick={() => setActiveSubTab('age-calculator')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'age-calculator'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          Age Finder & Zodiac
        </button>

        <button
          onClick={() => setActiveSubTab('timezones')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'timezones'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          World Timezone Converter
        </button>
      </div>

      {/* Main interactive cards workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        
        {/* Param Input Area (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/40">
          
          <AnimatePresence mode="wait">
            
            {/* SUB-TAB 1: DIFFERENCE OVERVIEW */}
            {activeSubTab === 'difference' && (
              <motion.div
                key="tab-difference"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col gap-4"
              >
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Hourglass className="w-4 h-4 text-sky-400" />
                  Date Difference Calculator
                </h3>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    value={diffDate1}
                    onChange={(e) => setDiffDate1(e.target.value)}
                    className="w-full bg-[#0b0c10]/60 border border-slate-800 focus:border-sky-500/50 outline-none p-2.5 rounded-lg text-sm text-white font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    value={diffDate2}
                    onChange={(e) => setDiffDate2(e.target.value)}
                    className="w-full bg-[#0b0c10]/60 border border-slate-800 focus:border-sky-500/50 outline-none p-2.5 rounded-lg text-sm text-white font-mono"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between p-2.5 bg-slate-900/40 border border-slate-800 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-300">Include End Date (Add 1 Day)</span>
                    <span className="text-[9px] text-slate-500">Calculate full span including start/end hours</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeEndDate}
                      onChange={(e) => setIncludeEndDate(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-sky-500 peer-checked:after:bg-white"></div>
                  </label>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 2: ADD OR SUBTRACT INTERVALS */}
            {activeSubTab === 'add-subtract' && (
              <motion.div
                key="tab-add-sub"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col gap-4"
              >
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <FastForward className="w-4 h-4 text-sky-400" />
                  Interval Modification Planner
                </h3>

                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">Target Date</label>
                    <input
                      type="date"
                      value={baseDate}
                      onChange={(e) => setBaseDate(e.target.value)}
                      className="w-full bg-[#0b0c10]/60 border border-slate-800 focus:border-sky-500/50 outline-none p-2.5 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                  <div className="w-1/3 flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">Time</label>
                    <input
                      type="time"
                      value={baseTime}
                      onChange={(e) => setBaseTime(e.target.value)}
                      className="w-full bg-[#0b0c10]/60 border border-slate-800 focus:border-sky-500/50 outline-none p-2.5 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex bg-[#0b0c10]/40 border border-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => setOpDirection('add')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all flex items-center justify-center gap-1 ${
                      opDirection === 'add'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    ADD INT.
                  </button>
                  <button
                    onClick={() => setOpDirection('subtract')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all flex items-center justify-center gap-1 ${
                      opDirection === 'subtract'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    SUBTRACT INT.
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Years</span>
                    <input
                      type="number"
                      min="0"
                      value={intervalYears || ''}
                      onChange={(e) => setIntervalYears(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-slate-900 border border-slate-800 p-2 text-xs font-mono text-white rounded-lg outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Months</span>
                    <input
                      type="number"
                      min="0"
                      value={intervalMonths || ''}
                      onChange={(e) => setIntervalMonths(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-slate-900 border border-slate-800 p-2 text-xs font-mono text-white rounded-lg outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Weeks</span>
                    <input
                      type="number"
                      min="0"
                      value={intervalWeeks || ''}
                      onChange={(e) => setIntervalWeeks(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-slate-900 border border-slate-800 p-2 text-xs font-mono text-white rounded-lg outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Days</span>
                    <input
                      type="number"
                      min="0"
                      value={intervalDays || ''}
                      onChange={(e) => setIntervalDays(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-slate-900 border border-slate-800 p-2 text-xs font-mono text-white rounded-lg outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Hours</span>
                    <input
                      type="number"
                      min="0"
                      value={intervalHours || ''}
                      onChange={(e) => setIntervalHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-slate-900 border border-slate-800 p-2 text-xs font-mono text-white rounded-lg outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Minutes</span>
                    <input
                      type="number"
                      min="0"
                      value={intervalMinutes || ''}
                      onChange={(e) => setIntervalMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-slate-900 border border-slate-800 p-2 text-xs font-mono text-white rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between p-2.5 bg-slate-900/40 border border-slate-800 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-300">Skip Weekend Days</span>
                    <span className="text-[9px] text-slate-500">Calculate offsets utilizing working days only</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyBusinessOffset}
                      onChange={(e) => setOnlyBusinessOffset(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-sky-500 peer-checked:after:bg-white"></div>
                  </label>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 3: BUSINESS DAYS & WORKING INTERVALS */}
            {activeSubTab === 'business-days' && (
              <motion.div
                key="tab-bus"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col gap-4"
              >
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-sky-400" />
                  Business Days Analyzer
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Start Date</label>
                  <input
                    type="date"
                    value={busStartDate}
                    onChange={(e) => setBusStartDate(e.target.value)}
                    className="w-full bg-[#0b0c10]/60 border border-slate-800 outline-none p-2 rounded-lg text-sm text-white font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">End Date</label>
                  <input
                    type="date"
                    value={busEndDate}
                    onChange={(e) => setBusEndDate(e.target.value)}
                    className="w-full bg-[#0b0c10]/60 border border-slate-800 outline-none p-2 rounded-lg text-sm text-white font-mono"
                  />
                </div>

                {/* Exclude weekend checklist */}
                <span className="text-[10px] font-mono text-slate-500 uppercase">Weekend Definitions</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-[#0b0c10]/30 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={excludeSat}
                      onChange={(e) => setExcludeSat(e.target.checked)}
                      className="rounded border-slate-800 text-sky-500 focus:ring-opacity-0"
                    />
                    <span className="text-xs text-slate-300 font-medium">Saturday</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-[#0b0c10]/30 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={excludeSun}
                      onChange={(e) => setExcludeSun(e.target.checked)}
                      className="rounded border-slate-800 text-sky-500 focus:ring-opacity-0"
                    />
                    <span className="text-xs text-slate-300 font-medium">Sunday</span>
                  </label>
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Custom Holidays (Optional)</span>
                    <span className="text-[9px] text-sky-400 font-mono">YYYY-MM-DD</span>
                  </div>
                  <textarea
                    placeholder="2026-01-01, 2026-12-25"
                    value={customHolidaysText}
                    onChange={(e) => setCustomHolidaysText(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300 outline-none focus:border-sky-500/50 resize-none placeholder-slate-700"
                  />
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 4: AGE FINDER & BIRTHDAY CALC */}
            {activeSubTab === 'age-calculator' && (
              <motion.div
                key="tab-birthday"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col gap-4"
              >
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-sky-400" />
                  DOB Checker &amp; Birthday Date Finder
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Date of Birth (Check DOB Online)</label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full bg-[#0b0c10]/60 border border-slate-800 outline-none p-2.5 rounded-lg text-sm text-white font-mono"
                  />
                </div>

                <div className="text-[11px] leading-relaxed text-slate-400 bg-[#0c0d12] border border-slate-800/80 p-3 rounded-lg flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    Find my DOB details, check DOB online, and calculate a person's exact age in years, months, leftover days, leap year status, or native Zodiac constellation anchors instantly.
                  </span>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 5: TIMEZONE CONVERSIONS */}
            {activeSubTab === 'timezones' && (
              <motion.div
                key="tab-tz"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col gap-4"
              >
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-sky-400" />
                  Timezone converter
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Base Date & Time</label>
                  <input
                    type="datetime-local"
                    value={sourceEpoch}
                    onChange={(e) => setSourceEpoch(e.target.value)}
                    className="w-full bg-[#0b0c10]/60 border border-slate-800 outline-none p-2.5 rounded-lg text-sm text-white font-mono"
                  />
                </div>

                <div className="mt-1 flex items-center justify-between p-2.5 bg-slate-900/40 border border-slate-800 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-200">Current Local Zone</span>
                    <span className="text-[9px] text-sky-400 font-mono">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const now = new Date();
                      // Local datetime format YYYY-MM-DDTHH:MM
                      const year = now.getFullYear();
                      const month = String(now.getMonth() + 1).padStart(2, '0');
                      const day = String(now.getDate()).padStart(2, '0');
                      const hrs = String(now.getHours()).padStart(2, '0');
                      const mins = String(now.getMinutes()).padStart(2, '0');
                      setSourceEpoch(`${year}-${month}-${day}T${hrs}:${mins}`);
                    }}
                    className="p-1 px-2.5 bg-[#0b0c10] hover:bg-slate-900 text-[10px] text-slate-300 font-semibold border border-slate-800 rounded transition-all"
                  >
                    Reset to Now
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>


        {/* Result Breakdown Area (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <div className="bg-[#0b0c10]/30 rounded-2xl border border-slate-800/60 p-6 flex flex-col relative min-h-[400px]">
            
            <span className="text-[10px] font-mono tracking-widest font-semibold text-slate-500 uppercase mb-4 block">
              Precision Calculated Output
            </span>

            {/* RESULTS VIEW TAB 1: DIFFERENCE DETAILS */}
            {activeSubTab === 'difference' && diffResults && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex flex-col gap-5 flex-grow"
              >
                {diffResults.isReverse && (
                  <div className="p-2.5 bg-amber-950/20 border border-amber-900/30 text-amber-400 rounded-lg text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Dates were arranged in reverse chronological order. Applied chronological sorting automatically.</span>
                  </div>
                )}

                {/* Primary countdown look */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950/50 border border-slate-800/70 p-4 rounded-xl flex flex-col items-center">
                    <span className="text-2xl font-bold tracking-tight text-white font-mono">
                      {diffResults.years}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-tight mt-1">Years</span>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800/70 p-4 rounded-xl flex flex-col items-center">
                    <span className="text-2xl font-bold tracking-tight text-white font-mono">
                      {diffResults.months}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-tight mt-1">Months</span>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800/70 p-4 rounded-xl flex flex-col items-center">
                    <span className="text-2xl font-bold tracking-tight text-white font-mono">
                      {diffResults.days}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-tight mt-1">Days</span>
                  </div>
                </div>

                <div className="text-center py-2 border-y border-slate-800/70 my-1">
                  <span className="text-xs text-slate-400">Total elapsed duration: </span>
                  <span className="text-sm font-bold text-sky-400 font-mono">
                    {diffResults.totalDays} days
                  </span>
                  <span className="text-xs text-slate-400"> ({diffResults.totalWeeks} weeks and {diffResults.leftoverDays} days)</span>
                </div>

                {/* Grid stats breaking down details */}
                <div className="grid grid-cols-2 gap-4">
                  
                  <div className="bg-slate-950/25 p-3 rounded-xl border border-slate-800/40">
                    <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block mb-1">Working Business Days</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-emerald-400 font-mono">
                        {diffResults.businessDays}
                      </span>
                      <span className="text-[10px] text-slate-400">workdays</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/25 p-3 rounded-xl border border-slate-800/40">
                    <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block mb-1">Weekend Days excluded</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-rose-400 font-mono">
                        {diffResults.weekendDays}
                      </span>
                      <span className="text-[10px] text-slate-400">weekend days</span>
                    </div>
                  </div>

                  <div className="col-span-2 bg-[#090a0f]/20 p-4 rounded-xl border border-slate-800/40 flex flex-col gap-2.5">
                    <span className="text-[10px] text-slate-400 font-semibold font-mono uppercase tracking-wider">Alternative Breakdowns</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase">Total Hours</span>
                        <span className="text-xs font-mono font-medium text-slate-200">
                          {diffResults.totalHours.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase">Total Minutes</span>
                        <span className="text-xs font-mono font-medium text-slate-200">
                          {diffResults.totalMinutes.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase">Total Seconds</span>
                        <span className="text-xs font-mono font-medium text-slate-200">
                          {diffResults.totalSeconds.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

              </motion.div>
            )}


            {/* RESULTS VIEW TAB 2: ADD OR SUBTRACT RESULTS */}
            {activeSubTab === 'add-subtract' && calculatedOffsetDate && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex flex-col gap-6 flex-grow justify-center"
              >
                <div className="text-center p-6 bg-slate-950/40 border border-slate-800/60 rounded-2xl flex flex-col gap-4 items-center justify-center">
                  
                  <div className="w-12 h-12 rounded-full bg-sky-950/40 border border-sky-800/40 flex items-center justify-center text-sky-400">
                    <CalendarIcon className="w-6 h-6" />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      Calculated Destination datetime
                    </span>
                    <span className="text-lg font-bold text-white tracking-tight leading-relaxed mt-2 p-1.5 px-4 bg-slate-900 border border-slate-800 rounded-xl">
                      {calculatedOffsetDate.formatted}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full border-t border-slate-800 mt-2 pt-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase">ISO Date Format</span>
                      <span className="text-sm font-mono text-sky-400 mt-1">{calculatedOffsetDate.isoDate}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase">ISO Time Format</span>
                      <span className="text-sm font-mono text-sky-400 mt-1">{calculatedOffsetDate.isoTime}</span>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}


            {/* RESULTS VIEW TAB 3: BUSINESS DAYS ANALYSIS */}
            {activeSubTab === 'business-days' && businessDaysMetrics && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex flex-col gap-5 flex-grow justify-between"
              >
                {businessDaysMetrics.isReverse && (
                  <div className="p-2.5 bg-amber-950/20 border border-amber-900/30 text-amber-400 rounded-lg text-xs">
                    Dates were arranged reverse chronological. Placed start-to-end automatically.
                  </div>
                )}

                <div className="text-center p-4 bg-[#0a0c12]/50 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Net Working business days</span>
                  <div className="text-3xl font-heading font-black text-emerald-400 mt-2 font-mono">
                    {businessDaysMetrics.workDays}
                  </div>
                  <span className="text-xs text-slate-400">
                    out of {businessDaysMetrics.elapsedDays} elapsed physical days
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/85">
                    <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Weekend Days Filtered</span>
                    <span className="text-xl font-bold text-rose-400 block font-mono mt-1">
                      {businessDaysMetrics.weekendsCount}
                    </span>
                    <span className="text-[10px] text-slate-500">Saturdays and Sundays removed</span>
                  </div>

                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/85">
                    <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Custom Holidays Registered</span>
                    <span className="text-xl font-bold text-violet-400 block font-mono mt-1">
                      {businessDaysMetrics.holidaysCount}
                    </span>
                    <span className="text-[10px] text-slate-500">Dates matched custom list</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-400">
                  ⚡ Business day counts exclude specified weekends and custom specified holiday list. Enter comma-separated dates for accuracy in plan projections.
                </div>
              </motion.div>
            )}


            {/* RESULTS VIEW TAB 4: AGE ANCHORS & LEAP CHECKER */}
            {activeSubTab === 'age-calculator' && ageDetails && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex flex-col gap-5 flex-grow"
              >
                
                <div className="text-center py-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Calculated chronological Age</span>
                  <div className="text-2xl font-bold text-white font-mono mt-2 flex items-center justify-center gap-1.5">
                    <span>{ageDetails.years} Years</span>
                    <span className="text-slate-500 font-normal">,</span>
                    <span>{ageDetails.months} Months</span>
                    <span className="text-slate-500 font-normal">,</span>
                    <span>{ageDetails.days} Days</span>
                  </div>
                  <span className="text-xs text-sky-400 font-mono mt-1.5 block">
                    Total of {ageDetails.totalDays.toLocaleString()} elapsed days alive
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  
                  <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/70">
                    <span className="text-[9px] text-slate-500 uppercase font-mono">Next Birthday Countdown</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono block mt-1">
                      {ageDetails.daysToNextBirth} Days
                    </span>
                    <span className="text-[10px] text-slate-500">until next celebration blowout</span>
                  </div>

                  <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/70">
                    <span className="text-[9px] text-slate-500 uppercase font-mono">Day of Week Born</span>
                    <span className="text-xl font-bold text-amber-400 font-mono block mt-1">
                      {ageDetails.bornDay}
                    </span>
                    <span className="text-[10px] text-slate-500">was born a beautiful day</span>
                  </div>

                  <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/70">
                    <span className="text-[9px] text-slate-500 uppercase font-mono">Leap Year Status</span>
                    <span className="text-xl font-bold text-slate-200 block mt-1 font-mono">
                      {ageDetails.isBirthYearLeap ? 'Leap Year! 🚀' : 'Standard Year'}
                    </span>
                    <span className="text-[10px] text-slate-500">of year {birthday.split('-')[0]}</span>
                  </div>

                  <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/70">
                    <span className="text-[9px] text-slate-500 uppercase font-mono">Astrological Zodiac Sign</span>
                    <span className="text-sm font-semibold text-violet-400 block mt-2">
                      {ageDetails.zodiac}
                    </span>
                    <span className="text-[10px] text-slate-500">based on birth slot</span>
                  </div>

                </div>

              </motion.div>
            )}


            {/* RESULTS VIEW TAB 5: WORLD TIMEZONE CONVERSIONS */}
            {activeSubTab === 'timezones' && tzResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex flex-col gap-3 flex-grow"
              >
                <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto scrollbar-thin pr-1">
                  {tzResults.map((item, index) => {
                    const isBaseLocal = item.zone === Intl.DateTimeFormat().resolvedOptions().timeZone || item.zone === 'UTC';
                    return (
                      <div 
                        key={item.zone + index}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                          isBaseLocal 
                            ? 'bg-sky-950/10 border-sky-500/30 text-sky-400' 
                            : 'bg-slate-900/30 border-slate-850/80 text-slate-300'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-white text-[11px]">{item.name}</span>
                          <span className="text-[9px] font-mono text-slate-500">{item.zone}</span>
                        </div>
                        <div className="text-right flex flex-col">
                          <span className="font-mono font-bold text-sky-450">{item.timeStr}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{item.dateStr}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </div>

        </div>

      </div>

      {/* Landing FAQ help sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-slate-950/20 p-5 rounded-2xl border border-slate-800/40">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-sky-400" />
            Precise Leap & Month Offsets
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Calendar computations automatically account for different day lengths per Gregorian month, leap year loops, standard business working hours, and complex fractional timezone displacements completely inside your local browser.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
            <Compass className="w-4 h-4 text-sky-400" />
            Project Schedule Balancing
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Utilize "Skip Weekend Days" to easily calculate professional timelines! Avoid shaving weekends manually; specify target milestones offset by exact business workdays effortlessly.
          </p>
        </div>
      </div>

    </div>
  );
}

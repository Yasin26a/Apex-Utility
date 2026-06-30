import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Copy, Check, Calendar, Settings, Clock, HelpCircle } from 'lucide-react';

export default function CronBuilder() {
  const [minute, setMinute] = useState('*');
  const [hour, setHour] = useState('*');
  const [dayOfMonth, setDayOfMonth] = useState('*');
  const [month, setMonth] = useState('*');
  const [dayOfWeek, setDayOfWeek] = useState('*');

  const [cronExpression, setCronExpression] = useState('* * * * *');
  const [description, setDescription] = useState('Every minute');
  const [forecasts, setForecasts] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const buildExpression = () => {
    const expr = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    setCronExpression(expr);

    // Build friendly description translation
    let desc = '';
    if (expr === '* * * * *') {
      desc = 'Every single minute of every day.';
    } else {
      const minText = minute === '*' ? 'every minute' : `at minute ${minute}`;
      const hourText = hour === '*' ? 'every hour' : `at hour ${hour}:00`;
      const domText = dayOfMonth === '*' ? 'every day' : `on day ${dayOfMonth} of the month`;
      const monthText = month === '*' ? 'every month' : `in month ${month}`;
      const dowText = dayOfWeek === '*' ? 'any day of the week' : `only on day ${dayOfWeek} of the week`;
      desc = `Triggers ${minText}, ${hourText}, ${domText}, ${monthText}, ${dowText}.`;
    }
    setDescription(desc);

    // Calculate simulated projection forecasts
    const times: string[] = [];
    const baseDate = new Date();
    for (let i = 1; i <= 5; i++) {
      const forecastTime = new Date(baseDate.getTime() + i * 3600000 * (hour === '*' ? 1 : 24));
      times.push(forecastTime.toUTCString());
    }
    setForecasts(times);
  };

  useEffect(() => {
    buildExpression();
  }, [minute, hour, dayOfMonth, month, dayOfWeek]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cronExpression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" id="cron-builder-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-400" />
          <span>Visual Cron Expression Builder</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Synthesize custom Unix crontab triggers without remembering wildcard codes. Select minutes, hours, days, or custom frequencies to draft compliant parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Setup sliders/selectors */}
        <div className="lg:col-span-6 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4">
          <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>Frequency selectors</span>
          </h3>

          <div className="space-y-3 text-xs">
            {/* Minutes */}
            <div className="space-y-1 bg-zinc-950/50 p-3 rounded-lg border border-zinc-900 flex justify-between items-center gap-4">
              <div className="space-y-0.5">
                <span className="block font-bold text-zinc-300">Minute selection</span>
                <span className="text-[10px] text-zinc-500 font-mono">Range: 0-59</span>
              </div>
              <select
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className="bg-zinc-950 border border-zinc-900 rounded p-1.5 text-xs text-zinc-300 font-mono w-40"
              >
                <option value="*">Every minute (*)</option>
                <option value="*/5">Every 5 minutes (*/5)</option>
                <option value="*/15">Every 15 minutes (*/15)</option>
                <option value="0">At minute 0 (:00)</option>
                <option value="30">At minute 30 (:30)</option>
              </select>
            </div>

            {/* Hours */}
            <div className="space-y-1 bg-zinc-950/50 p-3 rounded-lg border border-zinc-900 flex justify-between items-center gap-4">
              <div className="space-y-0.5">
                <span className="block font-bold text-zinc-300">Hour selection</span>
                <span className="text-[10px] text-zinc-500 font-mono">Range: 0-23</span>
              </div>
              <select
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className="bg-zinc-950 border border-zinc-900 rounded p-1.5 text-xs text-zinc-300 font-mono w-40"
              >
                <option value="*">Every hour (*)</option>
                <option value="*/2">Every 2 hours (*/2)</option>
                <option value="*/12">Every 12 hours (*/12)</option>
                <option value="0">At midnight (0)</option>
                <option value="12">At noon (12)</option>
              </select>
            </div>

            {/* Day of Month */}
            <div className="space-y-1 bg-zinc-950/50 p-3 rounded-lg border border-zinc-900 flex justify-between items-center gap-4">
              <div className="space-y-0.5">
                <span className="block font-bold text-zinc-300">Day of Month</span>
                <span className="text-[10px] text-zinc-500 font-mono">Range: 1-31</span>
              </div>
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="bg-zinc-950 border border-zinc-900 rounded p-1.5 text-xs text-zinc-300 font-mono w-40"
              >
                <option value="*">Every day (*)</option>
                <option value="1">1st of the month</option>
                <option value="15">15th of the month</option>
              </select>
            </div>

            {/* Month */}
            <div className="space-y-1 bg-zinc-950/50 p-3 rounded-lg border border-zinc-900 flex justify-between items-center gap-4">
              <div className="space-y-0.5">
                <span className="block font-bold text-zinc-300">Month</span>
                <span className="text-[10px] text-zinc-500 font-mono">Range: 1-12</span>
              </div>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-zinc-950 border border-zinc-900 rounded p-1.5 text-xs text-zinc-300 font-mono w-40"
              >
                <option value="*">Every month (*)</option>
                <option value="1">January (1)</option>
                <option value="6">June (6)</option>
                <option value="12">December (12)</option>
              </select>
            </div>

            {/* Day of Week */}
            <div className="space-y-1 bg-zinc-950/50 p-3 rounded-lg border border-zinc-900 flex justify-between items-center gap-4">
              <div className="space-y-0.5">
                <span className="block font-bold text-zinc-300">Day of Week</span>
                <span className="text-[10px] text-zinc-500 font-mono">Range: 0-6 (Sun-Sat)</span>
              </div>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="bg-zinc-950 border border-zinc-900 rounded p-1.5 text-xs text-zinc-300 font-mono w-40"
              >
                <option value="*">Every day of week (*)</option>
                <option value="1-5">Weekdays (1-5)</option>
                <option value="0,6">Weekends (0,6)</option>
                <option value="1">Mondays (1)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Forecast projections outputs */}
        <div className="lg:col-span-6 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between space-y-4">
          <div className="space-y-4 flex-1">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-2">
              Cron Synths &amp; Forecasts
            </h3>

            {/* Active Code syntax line */}
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-900 flex justify-between items-center gap-4">
              <div className="space-y-1">
                <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                  Unix Crontab Syntax
                </span>
                <code className="text-lg font-mono font-black text-indigo-400">
                  {cronExpression}
                </code>
              </div>

              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy string'}</span>
              </button>
            </div>

            {/* Translated human narrative */}
            <div className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-900 text-xs text-zinc-400 font-sans italic">
              ✨ <strong>Summary description:</strong> {description}
            </div>

            {/* Simulated Forecast list */}
            <div className="space-y-2">
              <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Trigger Forecast projections (Next 5 events)</span>
              </span>

              <div className="space-y-1.5 font-mono text-[10px] text-zinc-400 max-h-36 overflow-y-auto">
                {forecasts.map((time, i) => (
                  <div key={i} className="p-2 bg-zinc-950 rounded border border-zinc-900/60 flex justify-between items-center">
                    <span className="text-zinc-500">Event #{i+1}</span>
                    <span className="text-zinc-300 font-semibold">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 p-3 bg-indigo-950/10 border border-indigo-950/25 rounded-lg text-[10px] text-zinc-400">
            <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Crontab Parameters:</strong> Unix cron format consists of 5 parameters: Minute, Hour, Day of Month, Month, and Day of Week. Wildcards (*) mean every iteration, while commas group listings (e.g. 1,15) and increments use forward slashes (e.g. */5).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

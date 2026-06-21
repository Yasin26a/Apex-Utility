import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Copy, Check, ExternalLink, Cpu, Monitor, Sliders, HardDrive } from 'lucide-react';

export default function UserAgentAnalyzer() {
  const [userAgent, setUserAgent] = useState('');
  const [copied, setCopied] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({
    name: 'Unknown',
    os: 'Unknown',
    engine: 'Unknown',
    language: 'en-US',
    screenRes: '1920x1085',
    cookiesEnabled: true,
    timezone: 'UTC',
    touchPoints: 0,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      setUserAgent(ua);
      
      // Basic manual parsed details matching common environments
      let bName = 'Unknown Browser';
      if (ua.includes('Firefox')) bName = 'Mozilla Firefox';
      else if (ua.includes('SamsungBrowser')) bName = 'Samsung Internet';
      else if (ua.includes('Opera') || ua.includes('OPR')) bName = 'Opera';
      else if (ua.includes('Trident')) bName = 'Microsoft Internet Explorer';
      else if (ua.includes('Edge') || ua.includes('Edg')) bName = 'Microsoft Edge';
      else if (ua.includes('Chrome')) bName = 'Google Chrome';
      else if (ua.includes('Safari')) bName = 'Apple Safari';

      let osName = 'Unknown OS';
      if (ua.includes('Windows NT')) osName = 'Microsoft Windows';
      else if (ua.includes('Macintosh')) osName = 'Apple macOS';
      else if (ua.includes('Android')) osName = 'Google Android';
      else if (ua.includes('iPhone') || ua.includes('iPad')) osName = 'Apple iOS';
      else if (ua.includes('Linux')) osName = 'GNU/Linux';

      let eng = 'Gecko';
      if (ua.includes('AppleWebKit')) eng = 'WebKit / Blink';
      else if (ua.includes('Trident')) eng = 'Trident';

      setBrowserInfo({
        name: bName,
        os: osName,
        engine: eng,
        language: navigator.language || 'en-US',
        screenRes: `${window.screen.width}x${window.screen.height}`,
        cookiesEnabled: navigator.cookieEnabled,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        touchPoints: navigator.maxTouchPoints || 0,
      });
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(userAgent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" id="user-agent-analyzer-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Terminal className="w-6 h-6 text-brand" />
          <span>User-Agent Parser & Client Info</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Deconstruct the active browser's User-Agent string to extract host operating systems, specific rendering engines, physical resolution profiles, and cookies support.
        </p>
      </div>

      <div className="bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-300 font-heading uppercase tracking-wider">
            Your Raw User-Agent String
          </label>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-brand transition-all flex items-center gap-1 text-xs font-mono cursor-pointer"
            title="Copy string"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-brand" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-900 text-xs font-mono text-cyan-400 select-all break-all leading-relaxed">
          {userAgent || 'Fetching Client Metadata...'}
        </div>
      </div>

      {/* Structured parsed results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
            <Monitor className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Estimated Client</p>
            <p className="text-xs font-bold font-heading text-zinc-200 truncate">{browserInfo.name}</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Platform / OS</p>
            <p className="text-xs font-bold font-heading text-zinc-200 truncate">{browserInfo.os}</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Screen Resolution</p>
            <p className="text-xs font-bold font-heading text-zinc-200 truncate">{browserInfo.screenRes}</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Local Timezone</p>
            <p className="text-xs font-bold font-heading text-zinc-200 truncate">{browserInfo.timezone}</p>
          </div>
        </div>
      </div>

      {/* Advanced Properties */}
      <div className="bg-zinc-950/60 rounded-xl border border-zinc-900 overflow-hidden">
        <div className="p-4 bg-zinc-950 border-b border-zinc-900">
          <h3 className="text-xs font-bold text-zinc-300 font-heading tracking-wide uppercase">
            Supplemental Host Capability Flags
          </h3>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="flex justify-between p-2.5 rounded bg-zinc-900/30 border border-zinc-900/60">
            <span className="text-zinc-500">Language:</span>
            <span className="text-zinc-300">{browserInfo.language}</span>
          </div>

          <div className="flex justify-between p-2.5 rounded bg-zinc-900/30 border border-zinc-900/60">
            <span className="text-zinc-500">Cookies Enabled:</span>
            <span className={browserInfo.cookiesEnabled ? 'text-emerald-400' : 'text-red-400'}>
              {browserInfo.cookiesEnabled ? 'TRUE' : 'FALSE'}
            </span>
          </div>

          <div className="flex justify-between p-2.5 rounded bg-zinc-900/30 border border-zinc-900/60">
            <span className="text-zinc-500">Rendering Engine:</span>
            <span className="text-zinc-300">{browserInfo.engine}</span>
          </div>

          <div className="flex justify-between p-2.5 rounded bg-zinc-900/30 border border-zinc-900/60">
            <span className="text-zinc-500">Max Touchpoints:</span>
            <span className="text-zinc-300">{browserInfo.touchPoints} points</span>
          </div>
        </div>
      </div>
    </div>
  );
}

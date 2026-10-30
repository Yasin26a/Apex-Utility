import React, { useState, useRef, useEffect, useId } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Clock,
  Gauge,
  Wifi,
  Zap,
  AlertTriangle,
  RotateCw,
  XCircle,
  Play,
  CheckCircle2,
  Tv,
  Gamepad2,
  Video,
  Layers,
  Sliders,
  History,
  Trash2,
  TrendingUp,
  Info
} from 'lucide-react';
import { ToolLayout } from './ToolLayout';
import { bpsToMbps } from '../../utils/networkUtils';

export interface SpeedHistoryEntry {
  id: string;
  timestamp: string;
  downloadMbps: number;
  uploadMbps: number;
  idleLatencyMs: number;
  loadedLatencyMs: number;
  jitterMs: number;
  planSpeedMbps?: number;
}

type SpeedUnit = 'Mbps' | 'MB/s';
type TestPhase = 'idle' | 'latency' | 'download' | 'upload' | 'complete';

export const SpeedTestTool: React.FC = () => {
  const alertId = useId();

  // Test Phase & Engine State
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [statusText, setStatusText] = useState('Ready to test');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [announceMessage, setAnnounceMessage] = useState('');

  // Live and Final Metrics
  const [liveSpeedMbps, setLiveSpeedMbps] = useState(0);
  const [downloadMbps, setDownloadMbps] = useState<number | null>(null);
  const [uploadMbps, setUploadMbps] = useState<number | null>(null);
  const [idleLatencyMs, setIdleLatencyMs] = useState<number | null>(null);
  const [idleJitterMs, setIdleJitterMs] = useState<number | null>(null);
  const [loadedDownLatencyMs, setLoadedDownLatencyMs] = useState<number | null>(null);
  const [loadedUpLatencyMs, setLoadedUpLatencyMs] = useState<number | null>(null);
  const [packetLossPercent, setPacketLossPercent] = useState<number | null>(null);
  const [aimScores, setAimScores] = useState<{
    streaming?: { points: number; rating: string };
    gaming?: { points: number; rating: string };
    rtc?: { points: number; rating: string };
  } | null>(null);

  // Unit Toggle (Mbps vs MB/s)
  const [unit, setUnit] = useState<SpeedUnit>('Mbps');

  // Plan Speed Comparison
  const [planSpeedInput, setPlanSpeedInput] = useState<string>('300');

  // Data Usage Warning Modal
  const [showDataWarning, setShowDataWarning] = useState(false);
  const [isCellularOrSaveData, setIsCellularOrSaveData] = useState(false);

  // Test History (last 10 stored in localStorage)
  const [history, setHistory] = useState<SpeedHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('network_speedtest_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const engineRef = useRef<any>(null);

  // Detect data saver / cellular connection
  useEffect(() => {
    const nav = navigator as any;
    if (nav.connection) {
      if (nav.connection.saveData || nav.connection.type === 'cellular') {
        setIsCellularOrSaveData(true);
      }
    }
  }, []);

  // Save history on change
  useEffect(() => {
    try {
      localStorage.setItem('network_speedtest_history', JSON.stringify(history.slice(0, 10)));
    } catch {}
  }, [history]);

  // Clean up engine on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        try {
          engineRef.current.pause();
        } catch {}
      }
    };
  }, []);

  // Helper to format speed based on unit
  const formatSpeed = (mbps: number | null): string => {
    if (mbps === null || isNaN(mbps)) return '--';
    if (unit === 'MB/s') {
      return (mbps / 8).toFixed(1);
    }
    return mbps >= 100 ? mbps.toFixed(0) : mbps.toFixed(1);
  };

  // Trigger test button
  const handleStartClick = () => {
    const skipWarning = sessionStorage.getItem('skip_speedtest_data_warning');
    if (isCellularOrSaveData && !skipWarning) {
      setShowDataWarning(true);
      return;
    }
    executeSpeedTest();
  };

  // Launch speedtest engine
  const executeSpeedTest = async () => {
    setShowDataWarning(false);
    setErrorMessage(null);
    setPhase('latency');
    setStatusText('Testing idle latency and jitter...');
    setLiveSpeedMbps(0);
    setDownloadMbps(null);
    setUploadMbps(null);
    setIdleLatencyMs(null);
    setIdleJitterMs(null);
    setLoadedDownLatencyMs(null);
    setLoadedUpLatencyMs(null);
    setPacketLossPercent(null);
    setAimScores(null);
    setAnnounceMessage('Speed test started. Measuring idle ping.');

    try {
      // Lazy load Cloudflare speedtest library
      const { default: SpeedTest } = await import('@cloudflare/speedtest');

      const engine = new SpeedTest({
        autoStart: false
      });
      engineRef.current = engine;

      engine.onPhaseChange = (payload: any) => {
        const type = payload?.measurement?.type;
        if (type === 'latency') {
          setPhase('latency');
          setStatusText('Measuring idle latency...');
        } else if (type === 'download') {
          setPhase('download');
          setStatusText('Measuring download speed...');
          setAnnounceMessage('Measuring download bandwidth');
        } else if (type === 'upload') {
          setPhase('upload');
          setStatusText('Measuring upload speed...');
          setAnnounceMessage('Measuring upload bandwidth');
        }
      };

      engine.onResultsChange = () => {
        const downBps = engine.results.getDownloadBandwidth();
        const upBps = engine.results.getUploadBandwidth();
        const unloadedLatency = engine.results.getUnloadedLatency();
        const unloadedJitter = engine.results.getUnloadedJitter();
        const downLoadedLatency = engine.results.getDownLoadedLatency();
        const upLoadedLatency = engine.results.getUpLoadedLatency();
        const loss = engine.results.getPacketLoss();

        if (unloadedLatency !== undefined) {
          setIdleLatencyMs(Math.round(unloadedLatency));
        }
        if (unloadedJitter !== undefined && unloadedJitter !== null) {
          setIdleJitterMs(Math.round(unloadedJitter));
        }
        if (downBps !== undefined) {
          const downM = bpsToMbps(downBps);
          setDownloadMbps(downM);
          setLiveSpeedMbps(downM);
        }
        if (upBps !== undefined) {
          const upM = bpsToMbps(upBps);
          setUploadMbps(upM);
          setLiveSpeedMbps(upM);
        }
        if (downLoadedLatency !== undefined) {
          setLoadedDownLatencyMs(Math.round(downLoadedLatency));
        }
        if (upLoadedLatency !== undefined) {
          setLoadedUpLatencyMs(Math.round(upLoadedLatency));
        }
        if (loss !== undefined) {
          setPacketLossPercent(Math.round(loss * 100));
        }
      };

      engine.onFinish = (results: any) => {
        setPhase('complete');
        setStatusText('Speed test completed');
        setLiveSpeedMbps(0);

        const downBps = results.getDownloadBandwidth();
        const upBps = results.getUploadBandwidth();
        const finalDown = downBps !== undefined ? bpsToMbps(downBps) : 0;
        const finalUp = upBps !== undefined ? bpsToMbps(upBps) : 0;
        const finalLatency = results.getUnloadedLatency() || 0;
        const finalLoaded = results.getDownLoadedLatency() || finalLatency;
        const finalJitter = results.getUnloadedJitter() || 0;

        setDownloadMbps(finalDown);
        setUploadMbps(finalUp);

        // Fetch AIM Scores if available
        try {
          const rawScores = results.getScores();
          if (rawScores) {
            setAimScores({
              streaming: rawScores.streaming ? { points: rawScores.streaming.points, rating: rawScores.streaming.rating } : undefined,
              gaming: rawScores.gaming ? { points: rawScores.gaming.points, rating: rawScores.gaming.rating } : undefined,
              rtc: rawScores.rtc ? { points: rawScores.rtc.points, rating: rawScores.rtc.rating } : undefined
            });
          }
        } catch {}

        // Add to history
        const newEntry: SpeedHistoryEntry = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          downloadMbps: finalDown,
          uploadMbps: finalUp,
          idleLatencyMs: Math.round(finalLatency),
          loadedLatencyMs: Math.round(finalLoaded),
          jitterMs: Math.round(finalJitter),
          planSpeedMbps: parseFloat(planSpeedInput) || undefined
        };

        setHistory(prev => [newEntry, ...prev.slice(0, 9)]);
        setAnnounceMessage(`Speed test completed. Download: ${finalDown} Mbps, Upload: ${finalUp} Mbps, Latency: ${Math.round(finalLatency)} ms.`);
      };

      engine.onError = (msg: string) => {
        setPhase('idle');
        setErrorMessage(msg || 'Network test was interrupted or blocked. Check if an ad-blocker or VPN is blocking speed.cloudflare.com.');
        setStatusText('Test interrupted');
        setAnnounceMessage('Speed test encountered an error.');
      };

      engine.play();
    } catch (err: any) {
      setPhase('idle');
      setErrorMessage(err.message || 'Failed to initialize speed test library.');
      setStatusText('Failed to initialize');
    }
  };

  const handleStop = () => {
    if (engineRef.current) {
      try {
        engineRef.current.pause();
      } catch {}
    }
    setPhase('idle');
    setStatusText('Test stopped');
    setLiveSpeedMbps(0);
    setAnnounceMessage('Speed test cancelled by user.');
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('network_speedtest_history');
    } catch {}
  };

  // Plan efficiency percentage
  const planSpeedNum = parseFloat(planSpeedInput);
  const planEfficiency = planSpeedNum && downloadMbps !== null && planSpeedNum > 0
    ? Math.min(100, Math.round((downloadMbps / planSpeedNum) * 100))
    : null;

  // Gauge angle calculation (0 to 180 degrees)
  // Scale dynamically from 0 to 500+ Mbps
  const maxScale = Math.max(100, (downloadMbps || liveSpeedMbps || 50) * 1.25);
  const gaugePercent = Math.min(1, (liveSpeedMbps || (phase === 'complete' ? (downloadMbps || 0) : 0)) / maxScale);
  const needleAngle = -90 + gaugePercent * 180;

  // Plain text report for Copy / Download
  const generatePlainTextReport = (): string => {
    const lines: string[] = [];
    lines.push('APEX UTILITY - INTERNET SPEED TEST REPORT');
    lines.push(`Date: ${new Date().toISOString()}`);
    lines.push('Provider: Cloudflare Global Edge Network');
    lines.push('----------------------------------------------------');
    lines.push(`Download Speed:   ${downloadMbps !== null ? `${downloadMbps} Mbps (${(downloadMbps / 8).toFixed(2)} MB/s)` : 'Not measured'}`);
    lines.push(`Upload Speed:     ${uploadMbps !== null ? `${uploadMbps} Mbps (${(uploadMbps / 8).toFixed(2)} MB/s)` : 'Not measured'}`);
    lines.push(`Idle Latency:     ${idleLatencyMs !== null ? `${idleLatencyMs} ms` : 'Not measured'}`);
    lines.push(`Idle Jitter:      ${idleJitterMs !== null ? `${idleJitterMs} ms` : 'Not measured'}`);
    lines.push(`Loaded Latency:   ${loadedDownLatencyMs !== null ? `Down: ${loadedDownLatencyMs} ms` : ''} ${loadedUpLatencyMs !== null ? `Up: ${loadedUpLatencyMs} ms` : ''}`);
    lines.push(`Packet Loss:      ${packetLossPercent !== null ? `${packetLossPercent}%` : '0% (Clean)'}`);

    if (planSpeedNum && downloadMbps !== null) {
      lines.push(`Advertised Plan:  ${planSpeedNum} Mbps (Delivering ${planEfficiency}% of plan)`);
    }

    if (aimScores) {
      lines.push('\n[Cloudflare AIM Experience Ratings]');
      if (aimScores.streaming) lines.push(`Streaming:         ${aimScores.streaming.rating} (${aimScores.streaming.points}/100)`);
      if (aimScores.gaming) lines.push(`Online Gaming:     ${aimScores.gaming.rating} (${aimScores.gaming.points}/100)`);
      if (aimScores.rtc) lines.push(`Video Calls (RTC): ${aimScores.rtc.rating} (${aimScores.rtc.points}/100)`);
    }

    lines.push('\n----------------------------------------------------');
    lines.push('Notice: Results are estimates and vary with your device,');
    lines.push('Wi-Fi, VPN, browser background tasks and network conditions.');
    lines.push('Generated at apexutility.live/internet-speed-test');
    return lines.join('\n');
  };

  return (
    <ToolLayout
      title="Free Internet Speed Test - Download, Upload & Ping"
      badge="Cloudflare Edge Engine"
      badgeIcon={<Zap className="w-3.5 h-3.5 text-emerald-400" />}
      description="Measure real-time download and upload bandwidth in Mbps or MB/s, idle latency, loaded bufferbloat latency, and network quality scores against Cloudflare's nearest edge data center."
      copyDownloadContent={generatePlainTextReport()}
      downloadFileName={`internet-speed-test-${new Date().toISOString().split('T')[0]}.txt`}
      announceMessage={announceMessage}
      relatedTools={[
        { id: 'ping-test', name: 'Ping Latency Test', path: '/ping-test', description: 'Measure round-trip HTTPS latency and sample jitter across edge nodes.' },
        { id: 'what-is-my-ip', name: 'What Is My IP', path: '/what-is-my-ip', description: 'Check your public IPv4, IPv6, ISP and ASN details.' },
        { id: 'dns-test', name: 'DNS Test & Benchmark', path: '/dns-test', description: 'Perform record lookups and benchmark DoH resolver response speeds.' },
        { id: 'ip-location', name: 'IP Location Lookup', path: '/ip-location', description: 'Trace approximate geolocation and coordinates on an interactive map.' }
      ]}
      faqs={[
        {
          question: 'How does this speed test measure download and upload bandwidth?',
          answer: 'The test uses the official @cloudflare/speedtest engine to stream progressive HTTP chunks directly from Cloudflare’s nearest Anycast edge node to your browser. By timing how many bytes transfer across multiple concurrent streams at microsecond resolution, it calculates your sustained bandwidth in Megabits per second (Mbps).'
        },
        {
          question: 'What is the difference between Mbps and MB/s?',
          answer: 'Mbps (Megabits per second) measures network transmission speed, where 1 byte equals 8 bits. MB/s (MegaBytes per second) measures file storage size. If your internet connection is 100 Mbps, your maximum theoretical download speed is 12.5 MB/s (100 divided by 8). You can toggle between both units using the switch at the top of the results.'
        },
        {
          question: 'What is Loaded Latency (Bufferbloat) and why does it matter?',
          answer: 'Idle latency is your network’s ping when no other traffic is moving. Loaded latency measures ping while your connection is saturated with heavy downloading or uploading. When home routers queue too many packets instead of dropping or pacing them, bufferbloat occurs, causing lag spikes and video call stuttering even on high-speed plans.'
        },
        {
          question: 'Why is my speed test result lower than my advertised ISP plan?',
          answer: 'Internet Service Providers advertise theoretical maximum speeds over a wired Gigabit Ethernet connection. Wi-Fi overhead, distance from your router, radio interference, older devices, active background downloads, VPN encryption, and browser extensions will reduce observed speeds by 10% to 40%.'
        },
        {
          question: 'What is Jitter and what is an acceptable jitter level?',
          answer: 'Jitter is the variance or fluctuation in latency over consecutive packets. A stable connection has a jitter of under 5 ms. If your latency bounces erratically between 20 ms and 150 ms, high jitter will cause rubber-banding in multiplayer games and robotic voice audio in Zoom or Teams meetings.'
        },
        {
          question: 'How much data does this speed test consume?',
          answer: 'Because the test measures sustained bandwidth across progressive payload tiers, a typical speed test transfers between 25 MB and 60 MB of data. On gigabit connections, it may transfer up to 100 MB. We automatically show a warning if your browser indicates a cellular or Data Saver connection.'
        },
        {
          question: 'Does this test store or share my IP address?',
          answer: 'No. Apex Utility does not store, log, or transmit your IP address to analytics. The speed test communicates directly between your web browser and Cloudflare’s CDN infrastructure to transfer test payload chunks.'
        },
        {
          question: 'How can I increase my internet download and upload speeds?',
          answer: 'Connect your device via an Ethernet cable instead of Wi-Fi, place your router in an open central location, switch from crowded 2.4 GHz Wi-Fi to 5 GHz or Wi-Fi 6, restart your modem/router to clear memory, and pause background cloud backups or torrents.'
        }
      ]}
    >
      {/* Unit Switcher & Plan Speed Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Display Unit:</span>
          <div className="inline-flex rounded-lg bg-zinc-950 p-1 border border-zinc-800">
            <button
              type="button"
              onClick={() => setUnit('Mbps')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                unit === 'Mbps'
                  ? 'bg-emerald-500 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Mbps (Megabits)
            </button>
            <button
              type="button"
              onClick={() => setUnit('MB/s')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                unit === 'MB/s'
                  ? 'bg-emerald-500 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              MB/s (MegaBytes)
            </button>
          </div>
        </div>

        {/* Advertised Plan Comparison Input */}
        <div className="flex items-center gap-2">
          <label htmlFor="plan-speed-input" className="text-xs text-zinc-400">
            Your Plan Speed:
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="plan-speed-input"
              type="number"
              value={planSpeedInput}
              onChange={(e) => setPlanSpeedInput(e.target.value)}
              placeholder="300"
              className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-100 text-right focus:outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-zinc-500">Mbps</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Speed Test Area */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8 shadow-sm space-y-8">
        {/* Error Alert */}
        {errorMessage && (
          <div
            id={alertId}
            role="alert"
            className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Speedometer Gauge & Live Display */}
        <div className="flex flex-col items-center justify-center relative">
          {/* SVG Arc Gauge */}
          <div className="relative w-72 h-44 flex items-center justify-center">
            <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
              {/* Background Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#27272a"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Active Progress Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#10b981"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 * (1 - gaugePercent)}
                className="transition-all duration-150"
              />
              {/* Needle Pivot */}
              <g transform="translate(100, 100)">
                <g transform={`rotate(${needleAngle})`} className="transition-transform duration-150 ease-out">
                  <line x1="0" y1="0" x2="0" y2="-72" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="0" cy="0" r="6" fill="#10b981" />
                </g>
              </g>
            </svg>

            {/* Centered Value */}
            <div className="absolute bottom-2 flex flex-col items-center">
              <span className="text-4xl font-extrabold text-zinc-100 tracking-tight font-mono">
                {phase === 'idle'
                  ? (downloadMbps !== null ? formatSpeed(downloadMbps) : '0')
                  : formatSpeed(liveSpeedMbps)}
              </span>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mt-0.5">
                {unit}
              </span>
            </div>
          </div>

          {/* Status Label */}
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-zinc-400">
            {phase !== 'idle' && phase !== 'complete' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            )}
            <span>{statusText}</span>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-4">
            {phase === 'idle' || phase === 'complete' ? (
              <button
                type="button"
                onClick={handleStartClick}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-lg text-sm shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                {downloadMbps !== null ? (
                  <>
                    <RotateCw className="w-4 h-4" />
                    Test Again
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-zinc-950" />
                    Start Speed Test
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStop}
                className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-zinc-950 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                Stop Test
              </button>
            )}
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-zinc-800">
          {/* Download */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-4">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                Download
              </span>
              <span className="text-[11px] text-zinc-500">{unit}</span>
            </div>
            <div className="text-2xl font-bold text-zinc-100 font-mono">
              {formatSpeed(downloadMbps)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              {downloadMbps !== null ? `${(downloadMbps * 0.125).toFixed(1)} MB/s transfer` : 'Pending test'}
            </div>
          </div>

          {/* Upload */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-4">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
                Upload
              </span>
              <span className="text-[11px] text-zinc-500">{unit}</span>
            </div>
            <div className="text-2xl font-bold text-zinc-100 font-mono">
              {formatSpeed(uploadMbps)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              {uploadMbps !== null ? `${(uploadMbps * 0.125).toFixed(1)} MB/s transfer` : 'Pending test'}
            </div>
          </div>

          {/* Idle Latency (Ping) */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-4">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Idle Latency
              </span>
              <span className="text-[11px] text-zinc-500">ms</span>
            </div>
            <div className="text-2xl font-bold text-zinc-100 font-mono">
              {idleLatencyMs !== null ? idleLatencyMs : '--'}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              {idleJitterMs !== null ? `Jitter: ${idleJitterMs} ms` : 'Unloaded ping'}
            </div>
          </div>

          {/* Loaded Latency (Bufferbloat) */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-4">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                Loaded Latency
              </span>
              <span className="text-[11px] text-zinc-500">ms</span>
            </div>
            <div className="text-2xl font-bold text-zinc-100 font-mono">
              {loadedDownLatencyMs !== null ? loadedDownLatencyMs : '--'}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              {idleLatencyMs !== null && loadedDownLatencyMs !== null
                ? `+${Math.max(0, loadedDownLatencyMs - idleLatencyMs)} ms bufferbloat`
                : 'Under traffic load'}
            </div>
          </div>
        </div>

        {/* Plan Efficiency Comparison Notice */}
        {planEfficiency !== null && downloadMbps !== null && (
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-zinc-300">
                Delivering <strong>{planEfficiency}%</strong> of your configured <strong>{planSpeedNum} Mbps</strong> plan speed.
              </span>
            </div>
            <span className="text-zinc-500">
              {planEfficiency >= 85 ? 'Excellent ISP delivery' : 'Consider testing over Ethernet to eliminate Wi-Fi loss'}
            </span>
          </div>
        )}

        {/* Cloudflare AIM Experience Scores */}
        {aimScores && (
          <div className="pt-6 border-t border-zinc-800 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Network Quality &amp; Application Suitability (Cloudflare AIM)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aimScores.streaming && (
                <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Tv className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Video Streaming</div>
                      <div className="text-[11px] text-zinc-500">4K Ultra HD &amp; 1080p</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 uppercase">
                    {aimScores.streaming.rating}
                  </span>
                </div>
              )}

              {aimScores.gaming && (
                <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Gamepad2 className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Online Gaming</div>
                      <div className="text-[11px] text-zinc-500">Latency &amp; Jitter stability</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-sky-400 uppercase">
                    {aimScores.gaming.rating}
                  </span>
                </div>
              )}

              {aimScores.rtc && (
                <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Video className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Video Conferencing</div>
                      <div className="text-[11px] text-zinc-500">Zoom, Teams, Meet</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-400 uppercase">
                    {aimScores.rtc.rating}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Test History Section */}
      {history.length > 0 && (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950/60 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <History className="w-4 h-4 text-zinc-400" />
              <span>Recent Test History (Stored Locally)</span>
            </div>
            <button
              type="button"
              onClick={clearHistory}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear History
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-4 py-3 text-right">Download</th>
                  <th className="px-4 py-3 text-right">Upload</th>
                  <th className="px-4 py-3 text-right">Ping</th>
                  <th className="px-4 py-3 text-right">Jitter</th>
                  <th className="px-4 py-3 text-right">Loaded Ping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3 text-zinc-400 font-sans">{item.timestamp}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">
                      {item.downloadMbps} Mbps
                    </td>
                    <td className="px-4 py-3 text-right text-sky-400">
                      {item.uploadMbps} Mbps
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {item.idleLatencyMs} ms
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">
                      {item.jitterMs} ms
                    </td>
                    <td className="px-4 py-3 text-right text-purple-400">
                      {item.loadedLatencyMs} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cellular / Data Warning Modal */}
      {showDataWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-semibold text-base text-zinc-100">Cellular / Data Saver Detected</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Standard speed tests transfer approximately <strong>25 MB to 60 MB</strong> of data across your connection to accurately measure sustained bandwidth. If you are on a metered mobile plan, this may count against your data allowance.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDataWarning(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem('skip_speedtest_data_warning', 'true');
                  executeSpeedTest();
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium rounded-lg text-xs transition-colors cursor-pointer"
              >
                Proceed with Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDUCATIONAL CONTENT SECTIONS */}
      <section className="mt-12 space-y-10 border-t border-zinc-800 pt-10 text-zinc-300 text-sm leading-relaxed">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-4">How Internet Speed Tests Measure Bandwidth</h2>
          <p className="mb-3">
            Internet speed tests assess the throughput capacity of your digital connection between your personal device (browser) and a designated target edge server. To measure download bandwidth, the test establishes concurrent TCP/HTTP connections to download chunks of binary payloads ranging from 100 Kilobytes to 25 Megabytes. By recording the microsecond duration required to ingest each payload, the algorithm calculates how many Megabits of data pass through your connection per second (Mbps).
          </p>
          <p>
            The upload test performs the reverse procedure: your browser streams chunks of encrypted garbage data to the server and tracks transmission throughput. Measuring both metrics gives you an accurate picture of whether your internet service meets the demands of 4K streaming, large file uploads, and multiplayer gaming.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-4">Understanding Loaded Latency (Bufferbloat)</h2>
          <p className="mb-3">
            Traditional speed tests only measure <strong>idle ping</strong>—the latency when your network is quiet. However, the real test of a network occurs under strain. When someone in your home streams video or downloads an update while you are gaming or on a Zoom call, packets can get trapped in excessively large router buffers.
          </p>
          <p>
            This phenomenon is known as <strong>Bufferbloat</strong>. Our test measures both idle latency and loaded latency. If your idle ping is 15 ms but jumps to 220 ms during downloading, your router suffers from bufferbloat, which can lead to severe lag spikes in competitive gaming and voice audio stuttering.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-4">Mbps vs. MB/s: What Is the Difference?</h2>
          <p className="mb-3">
            Internet Service Providers (ISPs) advertise connection speeds in <strong>Megabits per second (Mbps)</strong> with a lowercase "b", while file sizes in Windows, macOS, and web browsers are reported in <strong>MegaBytes per second (MB/s)</strong> with an uppercase "B".
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-300">
            1 Byte = 8 Bits<br />
            100 Mbps Internet Connection ÷ 8 = 12.5 MB/s Maximum Download Rate<br />
            1 Gbps (1,000 Mbps) Connection ÷ 8 = 125 MB/s Maximum Download Rate
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-4">Why Wi-Fi Speeds Are Lower Than Wired Ethernet</h2>
          <p className="mb-3">
            Many users wonder why their 500 Mbps internet subscription only tests at 150 Mbps on a phone or laptop. Wi-Fi signals operate over radio waves subject to physical interference, walls, distance from the router, and channel contention from neighboring networks.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li><strong className="text-zinc-200">2.4 GHz Band:</strong> Excellent range through walls, but congested and typically caps out around 50–90 Mbps real-world throughput.</li>
            <li><strong className="text-zinc-200">5 GHz Band:</strong> Faster speeds up to 400–600 Mbps, but reduced range through solid concrete and brick walls.</li>
            <li><strong className="text-zinc-200">Wi-Fi 6 &amp; 6E:</strong> Uses the 6 GHz spectrum and OFDMA modulation for gigabit wireless throughput when within line-of-sight of modern routers.</li>
            <li><strong className="text-zinc-200">Cat6 Ethernet:</strong> Direct copper wiring delivers 100% of your subscribed bandwidth with 0% radio interference and lowest possible jitter.</li>
          </ul>
        </div>
      </section>
    </ToolLayout>
  );
};

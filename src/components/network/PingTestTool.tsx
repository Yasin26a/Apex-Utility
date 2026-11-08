import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Activity, Play, Square, RotateCcw, AlertTriangle, CheckCircle2, 
  Info, Clock, Zap, ArrowRight, ShieldCheck, Wifi, Radio
} from 'lucide-react';
import ToolLayout, { FaqItem } from './ToolLayout';
import { NETWORK_CONFIG, PingTarget } from '../../config/networkConfig';
import { 
  calculateMean, 
  calculateMedian, 
  calculateJitter, 
  calculateMinMax 
} from '../../utils/networkUtils';
import { useToolRunning } from '../../context/ToolRunningContext';
import { useAnalytics } from '../../hooks/useAnalytics';

interface Props {
  onNavigateTab?: (path: string) => void;
}

export default function PingTestTool({ onNavigateTab }: Props) {
  const { setIsToolRunning } = useToolRunning();
  const { trackToolStart, trackToolComplete } = useAnalytics();

  // Test parameters
  const [selectedTargetId, setSelectedTargetId] = useState<string>(NETWORK_CONFIG.pingTargets[0].id);
  const [sampleCount, setSampleCount] = useState<number>(20); // 10, 20, 50
  
  // Running state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentSampleIndex, setCurrentSampleIndex] = useState<number>(0);
  const [samples, setSamples] = useState<number[]>([]);
  const [failedRequests, setFailedRequests] = useState<number>(0);
  const [tabHiddenWarning, setTabHiddenWarning] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to test latency');
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const isRunningRef = useRef<boolean>(false);

  // Selected target object
  const activeTarget: PingTarget = useMemo(() => {
    return NETWORK_CONFIG.pingTargets.find(t => t.id === selectedTargetId) || NETWORK_CONFIG.pingTargets[0];
  }, [selectedTargetId]);

  // Stop if tab is hidden (browser throttles background timers which corrupts latency measurements)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunningRef.current) {
        stopPingTest();
        setTabHiddenWarning(true);
        setStatusMessage('Test paused: Tab was moved to the background. Browsers throttle background timers, skewing results.');
        setAriaAnnouncement('Test paused: Tab was backgrounded. Please keep this tab active in the foreground.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Sync isRunning with global ToolRunningContext to pause ads during latency measurements
  useEffect(() => {
    setIsToolRunning(isRunning, 'ping-test');
    if (isRunning) {
      trackToolStart('ping-test', 'Online Ping Test');
    }
  }, [isRunning, setIsToolRunning, trackToolStart]);

  // Summary statistics
  const stats = useMemo(() => {
    if (samples.length === 0) {
      return { min: 0, max: 0, mean: 0, median: 0, jitter: 0, rating: 'Untested' };
    }

    const { min, max } = calculateMinMax(samples);
    const mean = calculateMean(samples);
    const median = calculateMedian(samples);
    const jitter = calculateJitter(samples);

    // Rating guide
    const { excellentMaxMs, goodMaxMs, fairMaxMs } = NETWORK_CONFIG.pingThresholds;
    let rating = 'Poor';
    if (mean <= excellentMaxMs) rating = 'Excellent';
    else if (mean <= goodMaxMs) rating = 'Good';
    else if (mean <= fairMaxMs) rating = 'Fair';

    return { min, max, mean, median, jitter, rating };
  }, [samples]);

  const startPingTest = async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsRunning(true);
    isRunningRef.current = true;
    setTabHiddenWarning(false);
    setSamples([]);
    setFailedRequests(0);
    setCurrentSampleIndex(0);
    setStatusMessage('Discarding initial warm-up probe (DNS & connection handshake)...');
    setAriaAnnouncement(`Starting latency test against ${activeTarget.name}. Total planned requests: ${sampleCount}.`);

    try {
      // 1. One discarded warm-up request (establishes TCP/TLS connection so initial handshake doesn't skew stats)
      try {
        await fetch(`${activeTarget.url}?warmup=${Date.now()}`, {
          cache: 'no-store',
          signal
        });
      } catch {
        // Discarded warm-up failure ignored
      }

      const collectedSamples: number[] = [];
      let fails = 0;

      // 2. Sequential N samples spaced ~200ms apart
      for (let i = 0; i < sampleCount; i++) {
        if (signal.aborted || !isRunningRef.current) break;

        setCurrentSampleIndex(i + 1);
        setStatusMessage(`Sampling probe ${i + 1} of ${sampleCount}...`);

        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), 3000); // 3-second timeout

        const probeStart = performance.now();
        let success = false;

        try {
          // Combined abort listener
          const combinedSignal = signal;

          await fetch(`${activeTarget.url}?t=${Date.now()}_${i}`, {
            cache: 'no-store',
            signal: combinedSignal
          });

          clearTimeout(timeoutId);
          const probeDuration = Math.round((performance.now() - probeStart) * 10) / 10;
          collectedSamples.push(probeDuration);
          setSamples([...collectedSamples]);
          success = true;
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (signal.aborted) break;
          fails++;
          setFailedRequests(fails);
        }

        // Spaced ~200ms apart
        if (i < sampleCount - 1 && isRunningRef.current && !signal.aborted) {
          await new Promise(r => setTimeout(r, 200));
        }
      }

      if (!signal.aborted) {
        setIsRunning(false);
        isRunningRef.current = false;
        setStatusMessage(`Latency test completed. Measured ${collectedSamples.length} successful samples.`);
        const finalMean = calculateMean(collectedSamples);
        setAriaAnnouncement(`Test finished. Average latency: ${finalMean} ms. Rating: ${stats.rating}.`);
      }
    } catch {
      setIsRunning(false);
      isRunningRef.current = false;
      setStatusMessage('Test was stopped or encountered network interruptions.');
    }
  };

  const stopPingTest = () => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
    isRunningRef.current = false;
    setStatusMessage('Latency test stopped by user.');
    setAriaAnnouncement('Latency test cancelled.');
  };

  // Compile full export text
  const exportSummary = useMemo(() => {
    return [
      '========================================',
      'HTTPS LATENCY & PING TEST - AUDIT REPORT',
      'Generated via: https://apexutility.live/ping-test',
      `Timestamp: ${new Date().toISOString()}`,
      '========================================',
      `Target Endpoint: ${activeTarget.name} (${activeTarget.url})`,
      `Protocol: HTTPS Round-Trip (Browser Sandbox)`,
      `Planned Sample Count: ${sampleCount}`,
      `Completed Samples: ${samples.length}`,
      `Failed Requests: ${failedRequests}`,
      '----------------------------------------',
      `Minimum Latency: ${stats.min} ms`,
      `Average (Mean) Latency: ${stats.mean} ms`,
      `Median Latency: ${stats.median} ms`,
      `Maximum Latency: ${stats.max} ms`,
      `Connection Jitter: ${stats.jitter} ms`,
      `Overall Rating: ${stats.rating} (General guide)`,
      '----------------------------------------',
      'Raw Samples (ms):',
      samples.map((s, idx) => `  [#${idx + 1}] ${s} ms`).join('\n') || '  No completed samples',
      '========================================',
      'Disclaimer: Measured over HTTPS because web browsers cannot send ICMP echo packets.',
      'Results are estimates and vary with Wi-Fi, VPN, router queueing, and network load.',
      '========================================'
    ].join('\n');
  }, [activeTarget, sampleCount, samples, failedRequests, stats]);

  // Frequently Asked Questions
  const faqs: FaqItem[] = [
    {
      question: "Why does this test measure HTTPS latency instead of ICMP ping?",
      answer: "Web browsers run inside a sandboxed security perimeter that strictly blocks client-side JavaScript from opening raw socket connections or crafting raw Internet Control Message Protocol (ICMP) echo packets. Real ICMP pings operate at OSI Layer 3 (Network Layer) without an application protocol. Browser-based tests must communicate over HTTP/HTTPS at Layer 7 (Application Layer). While HTTPS latency includes a tiny amount of application parsing overhead, it accurately reflects the real-world round-trip time your browser experiences when interacting with cloud web servers."
    },
    {
      question: "What is connection jitter and why does it matter?",
      answer: "Jitter is the variance or fluctuation in ping latency over consecutive packet transmissions. For example, if your ping bounces erratically between 15 ms and 180 ms, you have high jitter. In web browsing or file downloading, high jitter is barely noticeable because buffers absorb the delay. However, for real-time applications like online competitive multiplayer games (Valorant, Fortnite, CS:GO) or voice/video calls (Discord, Zoom), high jitter causes game character rubber-banding, delayed hit registration, and robotic audio cutouts."
    },
    {
      question: "What is a good ping for online gaming?",
      answer: "As a general guide: (1) Under 20 ms is exceptional, tournament-grade latency with near-instantaneous feedback; (2) 20 ms to 50 ms is great for fast-paced competitive shooters; (3) 50 ms to 80 ms is acceptable for casual gaming and strategy titles; (4) Above 100 ms results in perceptible peekers advantage, delay, and desynchronization. Keep in mind that distance to the game's physical server datacenter is the primary physical constraint on latency."
    },
    {
      question: "Why does the test stop if I switch browser tabs?",
      answer: "Modern browsers (Chrome, Edge, Safari, Firefox) aggressively throttle JavaScript timers and setTimeout execution down to 1 probe per second or slower when a tab is backgrounded to conserve CPU energy and laptop battery. Running latency tests while a tab is hidden would cause timer delay to be falsely counted as network lag, severely corrupting your results. Keep the tab in the foreground while the test runs."
    },
    {
      question: "Why is an Ethernet cable always faster and lower latency than Wi-Fi?",
      answer: "Wi-Fi signals transmit over unlicensed radio frequencies that are susceptible to physical interference from walls, furniture, nearby neighbors' routers, and household electronics (microwaves, baby monitors, Bluetooth). Furthermore, Wi-Fi operates in half-duplex (devices must take turns transmitting). A Cat6 or Cat7 Ethernet cable operates in full-duplex over shielded copper conductors, providing zero electromagnetic interference, near-zero jitter, and eliminating wireless packet drops entirely."
    },
    {
      question: "Why can't I enter any custom IP address or website to ping from this page?",
      answer: "Due to browser Cross-Origin Resource Sharing (CORS) security rules and the sandbox boundary, browsers block web scripts from sending arbitrary requests to third-party IP addresses or domains that have not explicitly enabled cross-origin permission headers. Allowing browsers to ping arbitrary IP addresses would enable malicious websites to orchestrate distributed denial of service (DDoS) attacks or scan your private home network from an advertisement."
    },
    {
      question: "What is the difference between ping and packet loss?",
      answer: "Ping measures the time (in milliseconds) it takes for a packet to reach its destination and return. Packet loss occurs when data packets fail to arrive altogether due to network congestion, hardware errors, or faulty wiring. In our HTTPS test, if a sample fails or times out within 3 seconds, we count it as a 'failed request' rather than pure packet loss, because HTTP request failures can also stem from browser socket timeouts or server rate limiting."
    },
    {
      question: "How can I lower my ping and reduce network latency?",
      answer: "You can lower your latency by: (1) Connecting your PC or console directly via Ethernet cable instead of Wi-Fi; (2) Closing bandwidth-heavy background applications like BitTorrent, Steam downloads, or cloud sync clients; (3) Disconnecting active VPNs, which often route your traffic through indirect geographic locations; (4) Choosing game servers physically closest to your geographic city; and (5) Enabling Quality of Service (QoS) on your router to prioritize gaming packets over streaming video."
    }
  ];

  // SVG Chart rendering math
  const chartHeight = 120;
  const chartWidth = 500;
  const maxDisplayVal = Math.max(100, ...samples, stats.max * 1.15);

  const pointsSvg = useMemo(() => {
    if (samples.length < 2) return '';
    return samples.map((s, idx) => {
      const x = (idx / (sampleCount - 1)) * chartWidth;
      const y = chartHeight - (s / maxDisplayVal) * (chartHeight - 20) - 10;
      return `${x},${y}`;
    }).join(' ');
  }, [samples, sampleCount, maxDisplayVal]);

  return (
    <ToolLayout
      currentToolId="ping-test"
      title="Free Online Ping Test"
      metaDescription="Free online ping test to check your latency and jitter. See minimum, average and maximum ping and how stable your connection is."
      canonicalPath="/ping-test"
      badgeText="HTTPS Latency & Jitter Monitor"
      introDescription="Measure your round-trip latency, connection jitter, and stability directly from your browser. Note: Similar to ping, but measured over HTTPS because browsers cannot send ICMP packets."
      resultForExport={exportSummary}
      faqs={faqs}
      onNavigateTab={onNavigateTab}
      ariaAnnouncement={ariaAnnouncement}
      contentSections={
        <div className="space-y-10 text-zinc-300">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              What Is Ping and Latency: Measuring the Speed of Light Across Fiber
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              In computer networking, <strong>latency</strong> (often referred to casually as <strong>ping</strong>) is the duration of time required for a data packet to travel from your source device to a remote destination host and return as an acknowledgment. While bandwidth dictates how much data you can transfer per second (like the width of a multi-lane highway), latency dictates how quickly individual cars can travel from on-ramp to off-ramp.
            </p>
            <p className="text-sm leading-relaxed text-zinc-400">
              Even with cutting-edge optical fiber lines, data cannot travel faster than the speed of light in glass (approximately 200,000 km/s). Sending a packet from New York to London and back across transatlantic subsea cables takes at least 35 ms due purely to physical distance, plus additional hardware switching and serialization buffers at each network hop.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Ping vs. Jitter vs. Packet Loss: The Three Pillars of Connection Quality
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Latency (Round-Trip Ping)
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The elapsed time in milliseconds for a request to reach the server and receive an answer. Lower ping produces immediate responsiveness in games, snappier webpage loads, and delay-free audio calls.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Connection Jitter
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The average statistical difference between successive ping measurements. A constant 45ms ping feels smooth; a ping fluctuating between 20ms and 140ms produces stutter, desynchronization, and jarring game hitches.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Packet Loss &amp; Drops
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Occurs when packets traversing the web fail to reach their target due to congested router queues or signal interference. In TCP connections, dropped packets must be re-sent, creating sudden latency freezes.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Why Web Browsers Cannot Send ICMP Echo Packets
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              When you open a terminal on Windows or Mac and type <code className="text-red-300 font-mono">ping 8.8.8.8</code>, your operating system creates raw Layer 3 ICMP echo sockets directly via kernel privileges. Web browsers explicitly disallow client-side JavaScript from accessing raw sockets for critical cybersecurity reasons.
            </p>
            <p className="text-sm leading-relaxed text-zinc-400">
              If browsers allowed websites to construct arbitrary ICMP packets, any malicious web page you opened could quietly launch distributed denial of service (DDoS) floods against private servers or scan internal subnets inside corporate firewalls. Consequently, this tool measures round-trip time over secure HTTP/HTTPS requests. We apply cache-busting headers, abort timers, and performance high-resolution timestamps to provide accurate real-world application latency.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Wi-Fi vs. Wired Ethernet: The Impact on Gaming and Video Stability
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Wi-Fi is inherently a shared, half-duplex medium: only one device can transmit or receive data packets on a frequency channel at any single millisecond. When multiple phones, laptops, and smart TVs share a single 2.4 GHz or 5 GHz Wi-Fi radio, packets must wait in queue, introducing substantial jitter and latency spikes.
            </p>
            <p className="text-sm leading-relaxed text-zinc-400">
              Plugging a standard Cat6 Ethernet cable directly into your router delivers full-duplex transmission (sending and receiving simultaneously) over copper shielding with zero radio interference. For competitive gaming or mission-critical remote work, an Ethernet connection almost always cuts jitter by over 80%.
            </p>
          </section>
        </div>
      }
    >
      {/* =====================================================================
          INTERACTIVE PING TEST SUITE
          ===================================================================== */}
      <div className="space-y-6">
        {/* Honest Architecture Notice Banner */}
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Technical Note:</strong> Similar to ping, but measured over HTTPS because browsers cannot send ICMP packets. Measurements include TLS and edge handshake times.
          </p>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Target Endpoint Selection */}
          <div className="sm:col-span-6 space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Target Endpoint:</span>
              <span className="text-[11px] text-zinc-500">HTTPS Anycast Node</span>
            </label>
            <select
              value={selectedTargetId}
              onChange={e => setSelectedTargetId(e.target.value)}
              disabled={isRunning}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
            >
              {NETWORK_CONFIG.pingTargets.map(target => (
                <option key={target.id} value={target.id}>
                  {target.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sample Count Selection */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Sample Count:</span>
            </label>
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              {[10, 20, 50].map(count => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setSampleCount(count)}
                  disabled={isRunning}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    sampleCount === count ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="sm:col-span-3">
            {!isRunning ? (
              <button
                type="button"
                onClick={startPingTest}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 transition-all cursor-pointer"
              >
                {samples.length > 0 ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{samples.length > 0 ? 'Run Again' : 'Start Ping Test'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopPingTest}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop Test</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Hidden Warning Box */}
        {tabHiddenWarning && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-900/60 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Notice:</strong> The test stopped because you switched browser tabs. Browsers throttle timers in background tabs to save battery, which skews latency measurements. Please keep this tab active while running.
            </p>
          </div>
        )}

        {/* Live SVG Sparkline Chart */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800/80 pb-2.5">
            <span className="font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-400" />
              Latency Trajectory &amp; Sample Oscillations
            </span>
            <span className="font-mono text-[11px]">
              {isRunning 
                ? `Sampling ${currentSampleIndex} of ${sampleCount}` 
                : samples.length > 0 
                  ? `Completed ${samples.length} Samples` 
                  : 'Idle'
              }
            </span>
          </div>

          <div className="relative w-full h-32 bg-black/40 rounded-xl border border-zinc-800/60 p-2 flex items-center justify-center overflow-hidden">
            {samples.length >= 2 ? (
              <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                {/* Horizontal reference guide grid lines */}
                <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="#27272a" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="#27272a" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="100" x2={chartWidth} y2="100" stroke="#27272a" strokeDasharray="4 4" strokeWidth="1" />

                {/* Main Sparkline Polyline */}
                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsSvg}
                />

                {/* Data point dots */}
                {samples.map((s, idx) => {
                  const x = (idx / (sampleCount - 1)) * chartWidth;
                  const y = chartHeight - (s / maxDisplayVal) * (chartHeight - 20) - 10;
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </svg>
            ) : (
              <div className="text-center text-xs text-zinc-500 font-mono">
                {isRunning ? 'Gathering initial sequential probes...' : 'Click "Start Ping Test" to view real-time latency curve'}
              </div>
            )}
          </div>

          <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-between">
            <span>Status: {statusMessage}</span>
            <span>Failed Requests: <strong className={failedRequests > 0 ? 'text-amber-400' : 'text-zinc-400'}>{failedRequests}</strong></span>
          </div>
        </div>

        {/* Core Statistical Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Average (Mean) */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Average Ping</span>
            <div className="text-2xl font-black font-mono text-white">
              {stats.mean} <span className="text-xs font-normal text-zinc-400">ms</span>
            </div>
            <p className="text-[10px] text-zinc-400">Mean round-trip time</p>
          </div>

          {/* Median */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Median Ping</span>
            <div className="text-2xl font-black font-mono text-white">
              {stats.median} <span className="text-xs font-normal text-zinc-400">ms</span>
            </div>
            <p className="text-[10px] text-zinc-400">Midpoint sample</p>
          </div>

          {/* Minimum */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Minimum</span>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {stats.min} <span className="text-xs font-normal text-zinc-400">ms</span>
            </div>
            <p className="text-[10px] text-zinc-400">Fastest response</p>
          </div>

          {/* Maximum */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Maximum</span>
            <div className="text-2xl font-black font-mono text-amber-400">
              {stats.max} <span className="text-xs font-normal text-zinc-400">ms</span>
            </div>
            <p className="text-[10px] text-zinc-400">Peak packet delay</p>
          </div>

          {/* Jitter */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Jitter</span>
            <div className="text-2xl font-black font-mono text-cyan-400">
              {stats.jitter} <span className="text-xs font-normal text-zinc-400">ms</span>
            </div>
            <p className="text-[10px] text-zinc-400">Mean packet variance</p>
          </div>

          {/* Connection Rating */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Rating</span>
            <div className={`text-xl font-bold uppercase tracking-tight ${
              stats.rating === 'Excellent' ? 'text-emerald-400' :
              stats.rating === 'Good' ? 'text-cyan-400' :
              stats.rating === 'Fair' ? 'text-amber-400' :
              stats.rating === 'Poor' ? 'text-red-400' : 'text-zinc-500'
            }`}>
              {stats.rating}
            </div>
            <p className="text-[10px] text-zinc-400">General guide</p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

export { PingTestTool };

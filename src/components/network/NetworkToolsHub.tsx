import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Compass,
  Gauge,
  Globe,
  Layers,
  MapPin,
  Play,
  RotateCw,
  Search,
  Server,
  Shield,
  Wifi,
  Zap,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { ToolLayout } from './ToolLayout';
import { DefaultIpGeoAdapter, calculateMedian } from '../../utils/networkUtils';
import { NETWORK_CONFIG } from '../../config/networkConfig';

interface QuickCheckState {
  isRunning: boolean;
  isComplete: boolean;
  publicIp: string | null;
  ipVersion: string | null;
  approxLocation: string | null;
  edgePingMs: number | null;
  cfDohMs: number | null;
  googleDohMs: number | null;
  error: string | null;
}

export const NetworkToolsHub: React.FC = () => {
  const [quickCheck, setQuickCheck] = useState<QuickCheckState>({
    isRunning: false,
    isComplete: false,
    publicIp: null,
    ipVersion: null,
    approxLocation: null,
    edgePingMs: null,
    cfDohMs: null,
    googleDohMs: null,
    error: null
  });

  const [announceMsg, setAnnounceMsg] = useState('');

  // Run Quick Diagnostic Check
  // Tests IP, short 10-sample ping, and public DoH latency without heavy bandwidth consumption
  const runQuickCheck = async () => {
    setQuickCheck({
      isRunning: true,
      isComplete: false,
      publicIp: null,
      ipVersion: null,
      approxLocation: null,
      edgePingMs: null,
      cfDohMs: null,
      googleDohMs: null,
      error: null
    });
    setAnnounceMsg('Starting 10-second quick network diagnostic check...');

    try {
      // 1. IP and Geolocation
      const adapter = new DefaultIpGeoAdapter();
      const ipResult = await adapter.getMyIp();
      const detectedIp = ipResult.ipv4 || ipResult.ipv6 || '127.0.0.1';
      let locationSummary = 'Local / Proxy Node';

      try {
        const geo = await adapter.lookupIp(detectedIp);
        if (geo.city || geo.country) {
          locationSummary = `${geo.city || ''}, ${geo.country || ''}`.replace(/^,\s*/, '');
        }
      } catch {}

      setQuickCheck(prev => ({
        ...prev,
        publicIp: detectedIp,
        ipVersion: detectedIp.includes(':') ? 'IPv6' : 'IPv4',
        approxLocation: locationSummary
      }));

      // 2. Short Ping (10 samples to /api/ping or Cloudflare edge)
      const pingSamples: number[] = [];
      const pingUrl = NETWORK_CONFIG.pingTargets[0].url;

      // Discard warm-up
      try {
        await fetch(`${pingUrl}?probe=warmup`, { cache: 'no-store' });
      } catch {}

      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        try {
          await fetch(`${pingUrl}?sample=${i}_${Date.now()}`, { cache: 'no-store' });
          const dur = Math.round(performance.now() - start);
          pingSamples.push(dur);
        } catch {}
        await new Promise(r => setTimeout(r, 60));
      }

      const medianPing = pingSamples.length > 0 ? Math.round(calculateMedian(pingSamples)) : null;
      setQuickCheck(prev => ({ ...prev, edgePingMs: medianPing }));

      // 3. DNS-over-HTTPS speed check to Cloudflare and Google
      const measureDoh = async (endpoint: string, header?: string): Promise<number | null> => {
        try {
          const start = performance.now();
          const resp = await fetch(`${endpoint}?name=google.com&type=A`, {
            headers: header ? { Accept: header } : undefined,
            cache: 'no-store'
          });
          if (resp.ok) {
            return Math.round(performance.now() - start);
          }
        } catch {}
        return null;
      };

      const cfTime = await measureDoh('https://cloudflare-dns.com/dns-query', 'application/dns-json');
      const googleTime = await measureDoh('https://dns.google/resolve');

      setQuickCheck(prev => ({
        ...prev,
        cfDohMs: cfTime,
        googleDohMs: googleTime,
        isRunning: false,
        isComplete: true
      }));

      setAnnounceMsg(`Quick check complete. IP: ${detectedIp}, Latency: ${medianPing || '--'} ms, Cloudflare DoH: ${cfTime || '--'} ms.`);
    } catch (err: any) {
      setQuickCheck(prev => ({
        ...prev,
        isRunning: false,
        error: err.message || 'Diagnostic failed.'
      }));
      setAnnounceMsg('Quick diagnostic check failed.');
    }
  };

  const suiteTools = [
    {
      id: 'internet-speed-test',
      name: 'Internet Speed Test',
      path: '/internet-speed-test',
      badge: 'Cloudflare Edge',
      icon: <Gauge className="w-6 h-6 text-emerald-400" />,
      description: 'Test sustained download and upload bandwidth in Mbps or MB/s, idle latency, loaded latency (bufferbloat), and AIM suitability ratings.'
    },
    {
      id: 'ping-test',
      name: 'Ping Latency Test',
      path: '/ping-test',
      badge: 'HTTPS Round-Trip',
      icon: <Activity className="w-6 h-6 text-sky-400" />,
      description: 'Measure browser HTTP/HTTPS round-trip latency to edge servers with live SVG jitter charts, min/avg/max tracking, and network ratings.'
    },
    {
      id: 'what-is-my-ip',
      name: 'What Is My IP Address',
      path: '/what-is-my-ip',
      badge: 'IPv4 & IPv6 Dual-Stack',
      icon: <Globe className="w-6 h-6 text-purple-400" />,
      description: 'Check your public IPv4 and IPv6 addresses, Internet Service Provider, ASN, approximate routing location, and client browser profile.'
    },
    {
      id: 'dns-test',
      name: 'DNS Test & Benchmark',
      path: '/dns-test',
      badge: 'DoH Resolver Suite',
      icon: <Layers className="w-6 h-6 text-amber-400" />,
      description: 'Look up A, AAAA, MX, TXT, NS, SOA, and CAA records with DNSSEC validation, or benchmark Cloudflare vs. Google DNS speeds.'
    },
    {
      id: 'ip-location',
      name: 'IP Location Lookup',
      path: '/ip-location',
      badge: 'Interactive Map & ASN',
      icon: <Compass className="w-6 h-6 text-rose-400" />,
      description: 'Trace any public IP address or website domain to its approximate geographic location, ISP organization, and interactive map coordinates.'
    }
  ];

  return (
    <ToolLayout
      title="Free Network Tools Online - Speed, Ping, IP & DNS"
      badge="Apex Diagnostic Suite"
      badgeIcon={<Zap className="w-3.5 h-3.5 text-emerald-400" />}
      description="A complete suite of 100% free, private network diagnostic utilities running directly in your browser. Measure internet bandwidth, HTTPS latency, public IP addresses, DNS records, and IP geolocations with zero logs."
      copyDownloadContent="Apex Utility Free Network Tools Hub - apexutility.live/network-tools"
      downloadFileName="network-tools-hub.txt"
      announceMessage={announceMsg}
      relatedTools={suiteTools.map(t => ({ id: t.id, name: t.name, path: t.path, description: t.description }))}
      faqs={[
        {
          question: 'Are all network tools on Apex Utility completely free?',
          answer: 'Yes. All five network utilities—Internet Speed Test, Ping Test, What Is My IP, DNS Test, and IP Location—are 100% free with unlimited runs, zero account requirements, and no invasive advertisements.'
        },
        {
          question: 'Do these tools store or log my IP address?',
          answer: 'No. Apex Utility enforces a strict zero-knowledge architecture. We do not store, log, or sell IP addresses. Requests are handled ephemeral in-memory to generate your results and immediately discarded.'
        },
        {
          question: 'Why does the Quick Check test avoid testing full download bandwidth?',
          answer: 'Full download and upload bandwidth tests stream 25 MB to 60 MB of binary payloads, which can consume mobile cellular data allowances. The Quick Check tests connectivity, latency, and DNS resolution in under 5 seconds using less than 50 KB of data.'
        },
        {
          question: 'Why does Ping Test measure HTTPS round-trip instead of ICMP?',
          answer: 'Modern web browsers operate inside a sandboxed security model that prevents web applications from opening raw ICMP sockets or sending ICMP Echo Requests. Our ping test honestly measures HTTP/HTTPS round-trip latency to global edge servers.'
        },
        {
          question: 'Can I use these tools on mobile devices?',
          answer: 'Yes. All tools are built mobile-first, responsive, lightweight, and fully accessible with screen readers, keyboard navigation, and dark mode support.'
        },
        {
          question: 'How do I test my connection speed to international servers?',
          answer: 'Our tools connect to Cloudflare’s global Anycast edge network spanning over 330 cities worldwide. Your request is automatically routed to the nearest physical data center for the lowest latency and highest throughput.'
        },
        {
          question: 'What should I do if my ping or speed test results are poor?',
          answer: 'Try connecting via an Ethernet cable instead of Wi-Fi, reboot your modem and router, close background downloads (torrents, cloud backups, game updates), and disable VPN software that adds latency overhead.'
        },
        {
          question: 'How do I check if my ISP supports IPv6?',
          answer: 'Visit the What Is My IP tool (/what-is-my-ip). If your network has native IPv6 connectivity, your public 128-bit IPv6 address will be displayed. If your ISP only provides IPv4, IPv6 will show "Not detected".'
        }
      ]}
    >
      {/* Quick Diagnostic Check Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm mb-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Quick Network Snapshot (5-Second Audit)
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Checks your public IP, edge latency, and public DoH speed without burning cellular data bandwidth.
            </p>
          </div>

          <button
            type="button"
            onClick={runQuickCheck}
            disabled={quickCheck.isRunning}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-semibold rounded-lg text-sm transition-colors cursor-pointer shrink-0"
          >
            {quickCheck.isRunning ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Auditing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-zinc-950" />
                Run Quick Check
              </>
            )}
          </button>
        </div>

        {/* Quick Check Live Results Grid */}
        {(quickCheck.isRunning || quickCheck.isComplete) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3.5">
              <span className="text-[11px] text-zinc-500 block mb-1">Public IP Address</span>
              <span className="text-sm font-bold text-zinc-200 font-mono">
                {quickCheck.publicIp || 'Detecting...'}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                {quickCheck.approxLocation || 'Locating...'}
              </span>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3.5">
              <span className="text-[11px] text-zinc-500 block mb-1">Edge Ping Latency</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {quickCheck.edgePingMs !== null ? `${quickCheck.edgePingMs} ms` : 'Pinging...'}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">Origin edge server</span>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3.5">
              <span className="text-[11px] text-zinc-500 block mb-1">Cloudflare DoH Speed</span>
              <span className="text-sm font-bold text-sky-400 font-mono">
                {quickCheck.cfDohMs !== null ? `${quickCheck.cfDohMs} ms` : 'Resolving...'}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">1.1.1.1 anycast</span>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3.5">
              <span className="text-[11px] text-zinc-500 block mb-1">Google DoH Speed</span>
              <span className="text-sm font-bold text-purple-400 font-mono">
                {quickCheck.googleDohMs !== null ? `${quickCheck.googleDohMs} ms` : 'Resolving...'}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">8.8.8.8 anycast</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid of All 5 Individual Tools */}
      <div className="space-y-4 mb-12">
        <h2 className="text-lg font-bold text-zinc-100">Browse Network Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {suiteTools.map(tool => (
            <a
              key={tool.id}
              href={tool.path}
              className="group block bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 group-hover:border-emerald-500/30 transition-colors">
                  {tool.icon}
                </div>
                <span className="px-2 py-0.5 rounded bg-zinc-800 group-hover:bg-emerald-500/10 text-zinc-400 group-hover:text-emerald-400 text-xs font-medium transition-colors">
                  {tool.badge}
                </span>
              </div>

              <h3 className="text-base font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                {tool.name}
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>

              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                {tool.description}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* EDUCATIONAL OVERVIEW */}
      <section className="space-y-8 border-t border-zinc-800 pt-10 text-zinc-300 text-sm leading-relaxed">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-3">Why In-Browser Network Diagnostics Matter</h2>
          <p className="mb-3">
            Diagnosing slow internet, packet latency, and routing issues typically required downloading specialized native command-line binaries or installing ad-infested mobile applications. Apex Utility brings enterprise-grade network diagnostics directly into your browser using modern Web APIs, Fetch streaming, microsecond performance timers, and encrypted DNS-over-HTTPS.
          </p>
          <p>
            Whether you are a developer debugging API latency, a remote worker troubleshooting Zoom video stutter, or an online gamer auditing bufferbloat, our tools deliver accurate, transparent data with zero tracking cookies or invasive scripts.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-3">Technical Transparency: What Browsers Can &amp; Cannot Measure</h2>
          <p className="mb-3">
            Many online speed and ping utilities make exaggerated claims about measuring "true raw ICMP ping" or "direct router hardware." We believe in complete technical honesty:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li><strong className="text-zinc-200">Browsers cannot send ICMP ping packets:</strong> The W3C web security sandbox prohibits web browsers from crafting raw IP packets or sending ICMP Echo Requests. Our Ping Test accurately measures HTTP/HTTPS round-trip latency to edge servers.</li>
            <li><strong className="text-zinc-200">Browsers cannot query your OS DNS server directly:</strong> Operating systems do not expose raw UDP port 53 sockets to JavaScript. Our DNS test communicates with verified public DNS-over-HTTPS (DoH) JSON endpoints.</li>
            <li><strong className="text-zinc-200">IP geolocation is approximate:</strong> No web tool can pinpoint a residential street address solely from a public IP address. Geolocation shows carrier points of presence and data center routing nodes.</li>
          </ul>
        </div>
      </section>
    </ToolLayout>
  );
};

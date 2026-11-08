import React, { useState, useRef, useEffect, useId } from 'react';
import {
  Globe,
  Search,
  Activity,
  Layers,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Info,
  Clock,
  AlertTriangle,
  RotateCw,
  Award,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { ToolLayout } from './ToolLayout';
import { NETWORK_CONFIG, DohResolver } from '../../config/networkConfig';
import {
  validateAndNormalizeDomain,
  parseDnsRecordItem,
  getDnsStatusInfo,
  calculateMean,
  calculateMedian,
  calculateMinMax,
  ParsedDnsRecord
} from '../../utils/networkUtils';
import { useToolRunning } from '../../context/ToolRunningContext';
import { useAnalytics } from '../../hooks/useAnalytics';

type DnsTab = 'lookup' | 'speed';
type RecordType = 'COMMON' | 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'TXT' | 'SOA' | 'CAA';
type ResolverSelection = 'cloudflare' | 'google' | 'both';

interface DohAnswerItem {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DohResponse {
  Status: number;
  TC?: boolean;
  RD?: boolean;
  RA?: boolean;
  AD?: boolean;
  CD?: boolean;
  Question?: Array<{ name: string; type: number }>;
  Answer?: DohAnswerItem[];
  Authority?: DohAnswerItem[];
  Comment?: string;
}

interface LookupResultGroup {
  resolverId: string;
  resolverName: string;
  status: { code: string; label: string; description: string };
  dnssecValidated: boolean;
  queryDurationMs: number;
  records: ParsedDnsRecord[];
  error?: string;
}

interface BenchmarkResolverStats {
  resolver: DohResolver;
  samples: number[];
  failedCount: number;
  medianMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  successRate: number;
}

export const DnsTestTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DnsTab>('lookup');
  const alertId = useId();

  // Tab 1: DNS Lookup state
  const [domainInput, setDomainInput] = useState('cloudflare.com');
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType>('COMMON');
  const [selectedResolver, setSelectedResolver] = useState<ResolverSelection>('cloudflare');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResults, setLookupResults] = useState<LookupResultGroup[] | null>(null);
  const [lookupAnnounce, setLookupAnnounce] = useState('');

  // Tab 2: DNS Speed Benchmark state
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState(0); // 0 to 100
  const [benchmarkCurrentDomain, setBenchmarkCurrentDomain] = useState('');
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResolverStats[] | null>(null);
  const [benchmarkAnnounce, setBenchmarkAnnounce] = useState('');
  const benchmarkAbortController = useRef<AbortController | null>(null);

  // Clean up benchmark on unmount
  useEffect(() => {
    return () => {
      if (benchmarkAbortController.current) {
        benchmarkAbortController.current.abort();
      }
    };
  }, []);

  const { setIsToolRunning } = useToolRunning();
  const { trackToolStart } = useAnalytics();

  // Sync active lookup or benchmark with ToolRunningContext to pause ads
  useEffect(() => {
    const isRunning = isLookingUp || isBenchmarking;
    setIsToolRunning(isRunning, 'dns-test');
    if (isRunning) {
      trackToolStart('dns-test', 'DNS Lookup & Benchmark');
    }
  }, [isLookingUp, isBenchmarking, setIsToolRunning, trackToolStart]);

  // --- DoH Query Engine ---
  async function queryDoh(
    resolver: DohResolver,
    domain: string,
    type: string,
    signal?: AbortSignal
  ): Promise<{ data: DohResponse; durationMs: number }> {
    const startTime = performance.now();
    const url = `${resolver.endpointUrl}?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: resolver.acceptHeader || 'application/dns-json'
      },
      signal,
      cache: 'no-store'
    });

    const durationMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      throw new Error(`DNS resolver ${resolver.name} returned HTTP ${response.status}`);
    }

    const data: DohResponse = await response.json();
    return { data, durationMs };
  }

  // --- Run DNS Lookup ---
  const handleRunLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLookupError(null);

    const validation = validateAndNormalizeDomain(domainInput);
    if (!validation.isValid) {
      setLookupError(validation.error || 'Please enter a valid domain name.');
      return;
    }

    const cleanDomain = validation.punycodeDomain;
    setIsLookingUp(true);
    setLookupResults(null);
    setLookupAnnounce(`Performing DNS lookup for ${cleanDomain}`);

    try {
      const resolversToQuery: DohResolver[] = [];
      if (selectedResolver === 'cloudflare' || selectedResolver === 'both') {
        resolversToQuery.push(NETWORK_CONFIG.dohResolvers[0]); // Cloudflare
      }
      if (selectedResolver === 'google' || selectedResolver === 'both') {
        resolversToQuery.push(NETWORK_CONFIG.dohResolvers[1]); // Google
      }

      const typesToQuery: string[] = selectedRecordType === 'COMMON'
        ? ['A', 'AAAA', 'MX', 'NS', 'TXT']
        : [selectedRecordType];

      const groups: LookupResultGroup[] = [];

      for (const resolver of resolversToQuery) {
        const groupRecords: ParsedDnsRecord[] = [];
        let totalDuration = 0;
        let lastStatus = 0;
        let dnssecAd = false;
        let groupErr: string | undefined;

        try {
          const promises = typesToQuery.map(t => queryDoh(resolver, cleanDomain, t));
          const responses = await Promise.all(promises);

          for (const res of responses) {
            totalDuration = Math.max(totalDuration, res.durationMs);
            lastStatus = res.data.Status;
            if (res.data.AD) dnssecAd = true;

            if (res.data.Answer && Array.isArray(res.data.Answer)) {
              for (const ans of res.data.Answer) {
                groupRecords.push(parseDnsRecordItem(ans));
              }
            }
          }
        } catch (err: any) {
          groupErr = err.message || 'Network query blocked or unreachable';
        }

        groups.push({
          resolverId: resolver.id,
          resolverName: resolver.name,
          status: getDnsStatusInfo(lastStatus),
          dnssecValidated: dnssecAd,
          queryDurationMs: totalDuration,
          records: groupRecords,
          error: groupErr
        });
      }

      setLookupResults(groups);
      const totalRecs = groups.reduce((acc, g) => acc + g.records.length, 0);
      setLookupAnnounce(`Lookup complete. Found ${totalRecs} DNS records.`);
    } catch (err: any) {
      setLookupError(err.message || 'Failed to complete DNS lookup.');
      setLookupAnnounce('DNS lookup encountered an error.');
    } finally {
      setIsLookingUp(false);
    }
  };

  // --- Run DNS Benchmark ---
  const handleStartBenchmark = async () => {
    if (isBenchmarking) return;

    setIsBenchmarking(true);
    setBenchmarkProgress(0);
    setBenchmarkResults(null);
    setBenchmarkAnnounce('Starting DNS speed benchmark across public resolvers');

    const controller = new AbortController();
    benchmarkAbortController.current = controller;

    const domains = NETWORK_CONFIG.dnsBenchmarkDomains;
    const resolvers = NETWORK_CONFIG.dohResolvers;

    const statsMap: Record<string, { samples: number[]; failedCount: number }> = {};
    resolvers.forEach(r => {
      statsMap[r.id] = { samples: [], failedCount: 0 };
    });

    try {
      // 1. Warm-up probe (discarded)
      setBenchmarkCurrentDomain('Warm-up handshake probe');
      for (const resolver of resolvers) {
        try {
          await queryDoh(resolver, 'example.com', 'A', controller.signal);
        } catch {
          // Discarded
        }
      }

      // 2. Sequential benchmark across 10 domains
      const totalQueries = domains.length * resolvers.length;
      let completedQueries = 0;

      for (let d = 0; d < domains.length; d++) {
        if (controller.signal.aborted) break;
        const domain = domains[d];
        setBenchmarkCurrentDomain(domain);

        for (const resolver of resolvers) {
          if (controller.signal.aborted) break;
          try {
            const { durationMs } = await queryDoh(resolver, domain, 'A', controller.signal);
            statsMap[resolver.id].samples.push(durationMs);
          } catch {
            statsMap[resolver.id].failedCount += 1;
          }

          completedQueries++;
          setBenchmarkProgress(Math.round((completedQueries / totalQueries) * 100));

          // Small spacing between queries to avoid local client throttling
          await new Promise(r => setTimeout(r, 60));
        }
      }

      // Calculate final statistics
      const finalStats: BenchmarkResolverStats[] = resolvers.map(resolver => {
        const s = statsMap[resolver.id];
        const { min, max } = calculateMinMax(s.samples);
        const avg = calculateMean(s.samples);
        const median = calculateMedian(s.samples);
        const total = s.samples.length + s.failedCount;
        const successRate = total > 0 ? Math.round((s.samples.length / total) * 100) : 0;

        return {
          resolver,
          samples: s.samples,
          failedCount: s.failedCount,
          medianMs: Math.round(median),
          avgMs: Math.round(avg),
          minMs: Math.round(min),
          maxMs: Math.round(max),
          successRate
        };
      });

      // Rank by fastest median latency
      finalStats.sort((a, b) => a.medianMs - b.medianMs);

      setBenchmarkResults(finalStats);
      const fastest = finalStats[0];
      setBenchmarkAnnounce(`Benchmark complete. Fastest resolver was ${fastest.resolver.name} with ${fastest.medianMs} ms median latency.`);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setBenchmarkAnnounce('Benchmark aborted or failed.');
      }
    } finally {
      setIsBenchmarking(false);
      setBenchmarkCurrentDomain('');
      benchmarkAbortController.current = null;
    }
  };

  const handleStopBenchmark = () => {
    if (benchmarkAbortController.current) {
      benchmarkAbortController.current.abort();
    }
    setIsBenchmarking(false);
    setBenchmarkCurrentDomain('');
    setBenchmarkAnnounce('DNS benchmark paused by user.');
  };

  // Build plain text for Copy / Download
  const generateLookupPlainText = (): string => {
    if (!lookupResults) return 'No DNS lookup records recorded.';
    const lines: string[] = [];
    lines.push('APEX UTILITY - DNS LOOKUP AUDIT REPORT');
    lines.push(`Domain Queried: ${domainInput}`);
    lines.push(`Record Type Filter: ${selectedRecordType}`);
    lines.push(`Timestamp: ${new Date().toISOString()}`);
    lines.push('----------------------------------------------------');

    lookupResults.forEach(group => {
      lines.push(`\n[Resolver: ${group.resolverName}]`);
      lines.push(`Response Code: ${group.status.label} (${group.status.description})`);
      lines.push(`DNSSEC Authenticated: ${group.dnssecValidated ? 'Yes (AD bit set)' : 'No / Unsigned'}`);
      lines.push(`Total Query Time: ${group.queryDurationMs} ms`);

      if (group.error) {
        lines.push(`Resolver Error: ${group.error}`);
      } else if (group.records.length === 0) {
        lines.push('Records Found: 0 (No Answer records returned)');
      } else {
        lines.push(`Records (${group.records.length}):`);
        lines.push('NAME\tTYPE\tTTL\tDATA');
        group.records.forEach(r => {
          lines.push(`${r.name}\t${r.typeName}\t${r.ttl}s\t${r.data}`);
        });
      }
    });

    lines.push('\n----------------------------------------------------');
    lines.push('Note: Browsers perform DoH queries directly via HTTPS JSON APIs.');
    lines.push('Audit generated at apexutility.live/dns-test');
    return lines.join('\n');
  };

  const generateBenchmarkPlainText = (): string => {
    if (!benchmarkResults) return 'No DNS benchmark tests completed.';
    const lines: string[] = [];
    lines.push('APEX UTILITY - PUBLIC DNS SPEED BENCHMARK REPORT');
    lines.push(`Timestamp: ${new Date().toISOString()}`);
    lines.push(`Domains Evaluated (10): ${NETWORK_CONFIG.dnsBenchmarkDomains.join(', ')}`);
    lines.push('----------------------------------------------------');
    lines.push('RANK\tRESOLVER\tMEDIAN\tAVG\tMIN\tMAX\tSUCCESS');

    benchmarkResults.forEach((b, index) => {
      lines.push(
        `#${index + 1}\t${b.resolver.name}\t${b.medianMs}ms\t${b.avgMs}ms\t${b.minMs}ms\t${b.maxMs}ms\t${b.successRate}%`
      );
    });

    lines.push('\n----------------------------------------------------');
    lines.push('Technically Honest Disclaimer: This test measures DNS-over-HTTPS');
    lines.push('round-trip latency from your browser to each resolver.');
    lines.push('It does not measure OS port 53 UDP latency directly.');
    lines.push('Generated at apexutility.live/dns-test');
    return lines.join('\n');
  };

  const currentCopyDownloadText = activeTab === 'lookup'
    ? generateLookupPlainText()
    : generateBenchmarkPlainText();

  const currentDownloadFileName = activeTab === 'lookup'
    ? `dns-lookup-${domainInput.replace(/[^a-z0-9.-]/gi, '_')}.txt`
    : `dns-speed-benchmark-${new Date().toISOString().split('T')[0]}.txt`;

  return (
    <ToolLayout
      title="Free DNS Test & Benchmark - Lookup & Server Speed"
      badge="Browser-Native DoH Suite"
      badgeIcon={<Layers className="w-3.5 h-3.5 text-emerald-400" />}
      description="Perform real-time DNS record lookups (A, AAAA, MX, NS, TXT, SOA, CAA) with DNSSEC validation, and benchmark DNS-over-HTTPS resolver response speeds across Cloudflare and Google."
      copyDownloadContent={currentCopyDownloadText}
      downloadFileName={currentDownloadFileName}
      announceMessage={activeTab === 'lookup' ? lookupAnnounce : benchmarkAnnounce}
      relatedTools={[
        { id: 'internet-speed-test', name: 'Internet Speed Test', path: '/internet-speed-test', description: 'Measure real-time download & upload speeds and AIM score.' },
        { id: 'ping-test', name: 'Ping Latency Test', path: '/ping-test', description: 'Measure HTTPS round-trip latency and jitter across edge servers.' },
        { id: 'what-is-my-ip', name: 'What Is My IP', path: '/what-is-my-ip', description: 'Check your public IPv4, IPv6, ASN, and provider info.' },
        { id: 'ip-location', name: 'IP Location Lookup', path: '/ip-location', description: 'Trace approximate geolocation and coordinates on an interactive map.' }
      ]}
      faqs={[
        {
          question: 'What is DNS and how does resolution work?',
          answer: 'The Domain Name System (DNS) acts as the phonebook of the Internet, translating human-readable domain names (such as apexutility.live) into machine-routable IP addresses (such as 104.21.72.1). When you enter a web address, your operating system asks recursive resolvers to query root servers, Top-Level Domain (TLD) servers, and authoritative nameservers until the target IP address record is returned.'
        },
        {
          question: 'What is DNS-over-HTTPS (DoH) and how does it differ from traditional DNS?',
          answer: 'Traditional DNS queries (RFC 1035) are transmitted in unencrypted plain text over UDP or TCP port 53, meaning Internet Service Providers (ISPs), public Wi-Fi operators, and network snoopers can intercept and log every website you visit. DNS-over-HTTPS (DoH, RFC 8484) wraps DNS queries in an encrypted TLS tunnel over port 443, preventing eavesdropping and tampering.'
        },
        {
          question: 'Does this DNS tool measure my computer’s local router DNS server?',
          answer: 'No. Web browsers run inside a sandboxed security environment and cannot open raw UDP or TCP port 53 sockets. This tool communicates with public DoH endpoints (Cloudflare 1.1.1.1 and Google 8.8.8.8) using encrypted HTTPS JSON requests. It measures the DoH response speed to these global anycast resolvers, which provides a clean and uncorrupted baseline of global record propagation.'
        },
        {
          question: 'What is the purpose of the DNSSEC AD (Authentic Data) bit?',
          answer: 'The DNS Security Extensions (DNSSEC) attach cryptographic signatures to DNS records to protect against DNS cache poisoning and spoofing. When a recursive resolver verifies that the cryptographic signatures along the trust chain (from root to the domain) are valid, it sets the AD (Authentic Data) flag to 1, guaranteeing that the record has not been altered in transit.'
        },
        {
          question: 'What is DNS Time-to-Live (TTL) and why does propagation take time?',
          answer: 'Time-to-Live (TTL) is a numerical value (in seconds) assigned to each DNS record by the domain owner. It tells intermediate caches and recursive resolvers how long they may store the record before asking authoritative servers for an update. If your record has a TTL of 3600 seconds (1 hour), resolvers worldwide may take up to 1 hour after you change the record to reflect the new IP address.'
        },
        {
          question: 'What is the difference between an A record and a CNAME record?',
          answer: 'An A record maps a hostname directly to an IPv4 address (e.g. 192.0.2.1), while an AAAA record maps to an IPv6 address. A CNAME (Canonical Name) record aliases one domain name to another domain name (e.g. www.example.com points to example.com). Under DNS specifications (RFC 1912), a CNAME record cannot coexist with other records for the same name, which is why apex/root domains use A/AAAA records or ALIAS/ANAME flattening.'
        },
        {
          question: 'How do I change my DNS server on Windows, macOS, or mobile devices?',
          answer: 'On Windows, navigate to Settings > Network & Internet > Ethernet/Wi-Fi > Hardware Properties > DNS server assignment > Edit. On macOS, open System Settings > Network > Details > DNS, and click the "+" icon to add 1.1.1.1 (Cloudflare) or 8.8.8.8 (Google). On iOS and Android, open your Wi-Fi settings, tap your connected network, and configure DNS manually or use Private DNS / Encrypted DNS profiles.'
        },
        {
          question: 'Why are only Cloudflare and Google included in the speed benchmark?',
          answer: 'To query a DNS resolver directly from a web browser without routing your traffic through an intermediary proxy server, the resolver’s public DoH endpoint must explicitly serve open Cross-Origin Resource Sharing (CORS) headers (Access-Control-Allow-Origin: *). Cloudflare and Google provide verified, official, high-reliability JSON DoH endpoints with browser CORS support.'
        }
      ]}
    >
      {/* Tab Switcher */}
      <div className="flex border-b border-zinc-800 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('lookup')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'lookup'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Search className="w-4 h-4" />
          DNS Record Lookup
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('speed')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'speed'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          DNS Server Speed Benchmark
        </button>
      </div>

      {/* TAB 1: DNS RECORD LOOKUP */}
      {activeTab === 'lookup' && (
        <div className="space-y-6">
          <form onSubmit={handleRunLookup} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Domain Input */}
              <div className="md:col-span-6 space-y-1.5">
                <label htmlFor="domain-input" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Domain Name or Hostname
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="domain-input"
                    type="text"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="example.com or sub.example.org"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Record Type Selector */}
              <div className="md:col-span-3 space-y-1.5">
                <label htmlFor="record-type-select" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Record Type
                </label>
                <div className="relative">
                  <select
                    id="record-type-select"
                    value={selectedRecordType}
                    onChange={(e) => setSelectedRecordType(e.target.value as RecordType)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="COMMON">Common (A, AAAA, MX, NS, TXT)</option>
                    <option value="A">A (IPv4 Address)</option>
                    <option value="AAAA">AAAA (IPv6 Address)</option>
                    <option value="CNAME">CNAME (Alias)</option>
                    <option value="MX">MX (Mail Exchange)</option>
                    <option value="NS">NS (Authoritative Nameservers)</option>
                    <option value="TXT">TXT (SPF, DKIM, Verification)</option>
                    <option value="SOA">SOA (Start of Authority)</option>
                    <option value="CAA">CAA (Certificate Authority Auth)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Resolver Choice */}
              <div className="md:col-span-3 space-y-1.5">
                <label htmlFor="resolver-select" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Public DoH Resolver
                </label>
                <div className="relative">
                  <select
                    id="resolver-select"
                    value={selectedResolver}
                    onChange={(e) => setSelectedResolver(e.target.value as ResolverSelection)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="cloudflare">Cloudflare (1.1.1.1)</option>
                    <option value="google">Google (8.8.8.8)</option>
                    <option value="both">Compare Both Resolvers</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {lookupError && (
              <div
                id={alertId}
                role="alert"
                className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            {/* Submit Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-500">
                Queries DNS-over-HTTPS directly from your browser with zero server logging.
              </span>
              <button
                type="submit"
                disabled={isLookingUp}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-medium rounded-lg text-sm transition-colors cursor-pointer"
              >
                {isLookingUp ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Querying DNS...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Lookup DNS Records
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Results Display */}
          {lookupResults && (
            <div className="space-y-6">
              {lookupResults.map(group => (
                <div key={group.resolverId} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  {/* Resolver Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-zinc-950/60 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-zinc-200 text-sm">{group.resolverName}</span>
                      <span className="text-xs text-zinc-400">·</span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {group.queryDurationMs} ms
                      </span>
                      <span className="text-xs text-zinc-400">·</span>
                      <span className={`text-xs font-medium ${group.status.code === 'NOERROR' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {group.status.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {group.dnssecValidated ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          DNSSEC Validated (AD bit)
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500">
                          DNSSEC: Unsigned / Not Validated
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Table of Records */}
                  {group.error ? (
                    <div className="p-6 text-center text-sm text-rose-400">
                      {group.error}
                    </div>
                  ) : group.records.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400 space-y-1">
                      <p className="text-sm font-medium text-zinc-300">No Answer Records Found</p>
                      <p className="text-xs text-zinc-500">The resolver returned {group.status.label}: {group.status.description}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-950 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                          <tr>
                            <th className="px-5 py-3 w-1/4">Name</th>
                            <th className="px-4 py-3 w-20">Type</th>
                            <th className="px-4 py-3 w-24">TTL</th>
                            <th className="px-5 py-3">Data / Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 font-mono">
                          {group.records.map((rec, rIdx) => (
                            <tr key={rIdx} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="px-5 py-3 text-zinc-300 break-all">{rec.name}</td>
                              <td className="px-4 py-3">
                                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 font-sans font-semibold text-[11px]">
                                  {rec.typeName}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-zinc-400 font-sans">{rec.ttl}s</td>
                              <td className="px-5 py-3 text-zinc-200 break-all">{rec.data}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DNS SPEED BENCHMARK */}
      {activeTab === 'speed' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-200">Public DoH Resolver Benchmark</h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                  Measures response times from your browser across 10 globally recognized domains (Google, Wikipedia, GitHub, Cloudflare, etc.). A discarded warm-up request precedes the timed batch.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {isBenchmarking ? (
                  <button
                    type="button"
                    onClick={handleStopBenchmark}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-zinc-950 font-medium rounded-lg text-sm transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Stop Benchmark
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartBenchmark}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium rounded-lg text-sm transition-colors cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    Start Benchmark
                  </button>
                )}
              </div>
            </div>

            {/* Benchmark Progress Bar */}
            {isBenchmarking && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    Querying: <span className="text-emerald-400 font-mono">{benchmarkCurrentDomain}</span>
                  </span>
                  <span className="font-semibold text-zinc-300">{benchmarkProgress}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-200"
                    style={{ width: `${benchmarkProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Benchmark Results Ranking */}
          {benchmarkResults && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
                <span className="font-semibold text-zinc-200 text-sm">Benchmark Rankings</span>
                <span className="text-xs text-zinc-500">Sorted by lowest median latency</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3 w-16">Rank</th>
                      <th className="px-5 py-3">Resolver Name & Anycast IP</th>
                      <th className="px-4 py-3 text-right">Median</th>
                      <th className="px-4 py-3 text-right">Average</th>
                      <th className="px-4 py-3 text-right">Min</th>
                      <th className="px-4 py-3 text-right">Max</th>
                      <th className="px-4 py-3 text-right">Success</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {benchmarkResults.map((stat, idx) => (
                      <tr key={stat.resolver.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-zinc-300">
                          {idx === 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              #1
                            </span>
                          ) : (
                            <span className="text-zinc-500 pl-1.5">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-zinc-200">{stat.resolver.name}</div>
                          <div className="text-zinc-500 font-mono text-[11px] mt-0.5">
                            {stat.resolver.primaryIpv4} / {stat.resolver.secondaryIpv4}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-400 font-mono">
                          {stat.medianMs} ms
                        </td>
                        <td className="px-4 py-3.5 text-right text-zinc-300 font-mono">
                          {stat.avgMs} ms
                        </td>
                        <td className="px-4 py-3.5 text-right text-zinc-400 font-mono">
                          {stat.minMs} ms
                        </td>
                        <td className="px-4 py-3.5 text-right text-zinc-400 font-mono">
                          {stat.maxMs} ms
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                            stat.successRate === 100
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {stat.successRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-zinc-950/40 border-t border-zinc-800 text-xs text-zinc-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Technical Clarification:</strong> This benchmark evaluates HTTPS round-trip resolution over DNS-over-HTTPS. It does not measure raw UDP port 53 packets or your operating system's default local resolver, because modern browsers enforce sandboxed socket permissions.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDUCATIONAL CONTENT SECTIONS */}
      <section className="mt-12 space-y-10 border-t border-zinc-800 pt-10 text-zinc-300 text-sm leading-relaxed">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-4">What Is the Domain Name System (DNS)?</h2>
          <p className="mb-3">
            The Domain Name System (DNS) is the foundational addressing architecture of the Internet. Often compared to an exhaustive global telephone registry, DNS translates human-memorable hostnames such as <code className="text-emerald-400">apexutility.live</code> or <code className="text-emerald-400">google.com</code> into numeric Internet Protocol (IP) addresses like <code className="text-zinc-200">104.21.72.1</code> (IPv4) or <code className="text-zinc-200">2606:4700:3033::6815:4801</code> (IPv6) that network routers and switches need to route IP packets.
          </p>
          <p>
            When a web client requests a hostname, the lookup traverses a hierarchical chain of name servers. The operating system first queries its configured recursive resolver (such as Cloudflare 1.1.1.1, Google 8.8.8.8, or your local ISP's cache). If the record is not stored in memory, the resolver queries the global <strong>Root Nameservers</strong> (managed by 12 independent organizations across hundreds of Anycast locations), then the authoritative <strong>Top-Level Domain (TLD)</strong> servers (e.g., Verisign for .com), and finally the domain’s designated <strong>Authoritative Nameservers</strong>.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-4">Understanding DNS Record Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">A & AAAA</span>
                Host Address Records
              </h3>
              <p className="text-xs text-zinc-400">
                <strong>A records</strong> map a domain directly to a 32-bit IPv4 address. <strong>AAAA records</strong> map a domain to a 128-bit IPv6 address. These are the most common DNS records queried on the web.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">CNAME</span>
                Canonical Name (Alias)
              </h3>
              <p className="text-xs text-zinc-400">
                Aliases one hostname to another canonical hostname (e.g. <code className="text-zinc-200">blog.example.com</code> pointing to <code className="text-zinc-200">hosted.ghost.org</code>). Per RFC 1912, CNAME records cannot coexist with other records on the same root node.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">MX</span>
                Mail Exchange
              </h3>
              <p className="text-xs text-zinc-400">
                Specifies the mail servers responsible for accepting incoming email messages on behalf of the domain, complete with an integer priority ranking (lower numbers take precedence).
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">TXT</span>
                Text & Security Metadata
              </h3>
              <p className="text-xs text-zinc-400">
                Holds arbitrary text strings primarily used for email authentication protocols (SPF, DKIM, DMARC), Google Search Console verification tokens, and domain ownership audits.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">NS & SOA</span>
                Zone Delegation & Authority
              </h3>
              <p className="text-xs text-zinc-400">
                <strong>NS records</strong> delegate a zone to authoritative nameservers. <strong>SOA (Start of Authority)</strong> records declare the primary master server, administrative email, serial revision number, and propagation timers.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">CAA</span>
                Certificate Authority Authorization
              </h3>
              <p className="text-xs text-zinc-400">
                Restricts which Certificate Authorities (such as Let's Encrypt or DigiCert) are legally permitted to issue SSL/TLS certificates for your domain, preventing unauthorized certificate issuance.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-4">DNS-over-HTTPS (DoH) vs. Traditional DNS vs. DoT</h2>
          <p className="mb-3">
            Historically, all DNS queries were transmitted unencrypted over UDP port 53. Because UDP is stateless and cleartext, any eavesdropper between your device and the DNS server—including Internet service providers, Wi-Fi operators, surveillance entities, and state actors—could easily intercept, log, or even spoof DNS records.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-zinc-200">Unencrypted DNS (Port 53):</strong> Fast and simple, but vulnerable to eavesdropping, censorship, and DNS cache poisoning attacks.
            </li>
            <li>
              <strong className="text-zinc-200">DNS-over-HTTPS (DoH, RFC 8484):</strong> Encapsulates DNS queries inside HTTPS sessions using TLS over port 443. This makes DNS requests indistinguishable from regular web traffic, shielding query names from snooping and firewalls.
            </li>
            <li>
              <strong className="text-zinc-200">DNS-over-TLS (DoT, RFC 7858):</strong> Uses dedicated TLS encryption over port 853. While clean and efficient, because port 853 is unique to DoT, it can be easily blocked or throttled by network administrators.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-4">How to Configure Fast Public DNS on Your Operating System</h2>
          <p className="mb-4 text-zinc-400">
            Switching from your ISP's default resolver to an anycast resolver like Cloudflare (1.1.1.1) or Google (8.8.8.8) can significantly improve browsing latency and block malicious phishing hostnames:
          </p>
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-semibold text-zinc-200 mb-2">Windows 11</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Open <strong>Settings</strong> &gt; <strong>Network &amp; internet</strong> &gt; Click your active connection (Wi-Fi or Ethernet) &gt; Click <strong>Edit</strong> next to DNS server assignment &gt; Select <strong>Manual</strong> &gt; Toggle IPv4 on &gt; Enter Preferred DNS: <code className="text-emerald-400">1.1.1.1</code> and Alternate DNS: <code className="text-emerald-400">1.0.0.1</code> &gt; Set DNS over HTTPS to <em>On (automatic template)</em> for encrypted DoH.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-semibold text-zinc-200 mb-2">macOS (Ventura, Sonoma &amp; Sequoia)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Open <strong>System Settings</strong> &gt; <strong>Network</strong> &gt; Click your active network adapter &gt; Click <strong>Details...</strong> &gt; Select the <strong>DNS</strong> tab in the sidebar &gt; Click the <strong>+</strong> button under DNS Servers &gt; Add <code className="text-emerald-400">1.1.1.1</code> and <code className="text-emerald-400">8.8.8.8</code> &gt; Click <strong>OK</strong>.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-semibold text-zinc-200 mb-2">iOS (iPhone &amp; iPad)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Open <strong>Settings</strong> &gt; <strong>Wi-Fi</strong> &gt; Tap the <strong>(i)</strong> icon next to your network &gt; Scroll to <strong>Configure DNS</strong> &gt; Select <strong>Manual</strong> &gt; Tap <strong>Add Server</strong> &gt; Enter <code className="text-emerald-400">1.1.1.1</code> and <code className="text-emerald-400">1.0.0.1</code> &gt; Tap <strong>Save</strong>.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-semibold text-zinc-200 mb-2">Android (Android 9+)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Open <strong>Settings</strong> &gt; <strong>Network &amp; internet</strong> (or Connections) &gt; Tap <strong>Private DNS</strong> &gt; Select <strong>Private DNS provider hostname</strong> &gt; Enter <code className="text-emerald-400">one.one.one.one</code> (Cloudflare) or <code className="text-emerald-400">dns.google</code> (Google) &gt; Tap <strong>Save</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ToolLayout>
  );
};

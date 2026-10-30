import React, { useState, useEffect, useRef, useId } from 'react';
import {
  MapPin,
  Search,
  Globe,
  Compass,
  Server,
  Shield,
  Layers,
  Info,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Map as MapIcon,
  CheckCircle2,
  XCircle,
  Copy,
  Eye
} from 'lucide-react';
import { ToolLayout } from './ToolLayout';
import {
  parseAndValidateIp,
  validateAndNormalizeDomain,
  DefaultIpGeoAdapter,
  NormalizedIpData
} from '../../utils/networkUtils';
import { NETWORK_CONFIG } from '../../config/networkConfig';

type Mode = 'my-ip' | 'lookup';

export const IpLocationTool: React.FC = () => {
  const alertId = useId();
  const [mode, setMode] = useState<Mode>('my-ip');
  const [lookupInput, setLookupInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [announceMessage, setAnnounceMessage] = useState('');

  // IP Geolocation result data
  const [geoData, setGeoData] = useState<NormalizedIpData | null>(null);
  const [resolvedDomain, setResolvedDomain] = useState<string | null>(null);

  // Lazy-loaded Map State
  const [showMap, setShowMap] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
      }
    };
  }, []);

  // Fetch "My IP" on mount
  useEffect(() => {
    loadMyIp();
  }, []);

  // Load "My IP" data
  const loadMyIp = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setResolvedDomain(null);
    setShowMap(false);
    setAnnounceMessage('Detecting your public IP address and network location...');

    try {
      const adapter = new DefaultIpGeoAdapter();
      const clientResult = await adapter.getMyIp();
      const ipToLookup = clientResult.ipv4 || clientResult.ipv6 || '127.0.0.1';

      if (ipToLookup === '127.0.0.1' || ipToLookup.startsWith('192.168.') || ipToLookup.startsWith('10.')) {
        // Fallback demo for local sandbox if no public IP header
        setGeoData({
          ip: ipToLookup,
          version: 4,
          country: 'United States',
          countryCode: 'US',
          region: 'California',
          city: 'San Francisco',
          timezone: 'America/Los_Angeles',
          latitude: 37.77,
          longitude: -122.42,
          asn: 'AS13335',
          org: 'Cloudflare Anycast Network',
          isApproximateNotice: 'Local dev sandbox address detected. Displaying edge gateway reference.'
        });
        setAnnounceMessage('Loaded IP geolocation details.');
        return;
      }

      const info = await adapter.lookupIp(ipToLookup);
      setGeoData(info);
      setAnnounceMessage(`Located IP ${info.ip} in ${info.city || info.country || 'network node'}.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to retrieve IP location.');
      setAnnounceMessage('Failed to retrieve IP location.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resolve domain to IP via Cloudflare DoH
  const resolveDomainToIp = async (domain: string): Promise<string> => {
    const resolver = NETWORK_CONFIG.dohResolvers[0]; // Cloudflare DoH
    const url = `${resolver.endpointUrl}?name=${encodeURIComponent(domain)}&type=A`;
    const resp = await fetch(url, {
      headers: { Accept: resolver.acceptHeader || 'application/dns-json' },
      cache: 'no-store'
    });
    if (!resp.ok) {
      throw new Error(`DNS resolution failed with status ${resp.status}`);
    }
    const data = await resp.json();
    if (data.Answer && Array.isArray(data.Answer) && data.Answer.length > 0) {
      // Find first A or AAAA record
      const match = data.Answer.find((a: any) => a.type === 1 || a.type === 28);
      if (match && match.data) {
        return match.data.trim();
      }
    }
    throw new Error(`No DNS A or AAAA records found for domain "${domain}".`);
  };

  // Handle "Look Up Any IP or Domain"
  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setGeoData(null);
    setResolvedDomain(null);
    setShowMap(false);

    const input = lookupInput.trim();
    if (!input) {
      setErrorMessage('Please enter an IPv4, IPv6, or domain name.');
      return;
    }

    setIsLoading(true);
    setAnnounceMessage(`Querying location for ${input}...`);

    try {
      let targetIp = input;
      let domainLabel: string | null = null;

      // 1. Check if user provided an IP
      const ipCheck = parseAndValidateIp(input);
      if (ipCheck.isValid) {
        // Enforce private/bogon filters strictly
        if (ipCheck.isPrivate || ipCheck.isLoopback || ipCheck.isLinkLocal || ipCheck.isReserved) {
          throw new Error(`Cannot locate ${ipCheck.reason || 'private or internal IP address'}. Enter a public IP or domain.`);
        }
        targetIp = input;
      } else {
        // 2. Validate as domain name
        const domainCheck = validateAndNormalizeDomain(input);
        if (!domainCheck.isValid) {
          throw new Error(domainCheck.error || 'Input is not a valid IP or domain name.');
        }
        // Resolve domain via DoH
        domainLabel = domainCheck.punycodeDomain;
        setAnnounceMessage(`Resolving domain ${domainLabel} to public IP...`);
        targetIp = await resolveDomainToIp(domainLabel);
      }

      setResolvedDomain(domainLabel);

      // 3. Lookup IP geolocation
      const adapter = new DefaultIpGeoAdapter();
      const info = await adapter.lookupIp(targetIp);
      setGeoData(info);
      setAnnounceMessage(`Located ${targetIp} in ${info.city || info.country || 'network node'}.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lookup failed.');
      setAnnounceMessage('IP lookup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Lazy-load Leaflet map when user clicks "Show on map"
  const handleToggleMap = async () => {
    if (showMap) {
      setShowMap(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    if (!geoData || geoData.latitude === null || geoData.longitude === null) {
      return;
    }

    setShowMap(true);
    setIsMapLoading(true);

    try {
      // Dynamic import of leaflet and its styles
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // Small delay to allow container div to mount
      setTimeout(() => {
        if (!mapContainerRef.current) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        const lat = geoData.latitude!;
        const lon = geoData.longitude!;

        const map = L.map(mapContainerRef.current).setView([lat, lon], 10);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
          maxZoom: 18
        }).addTo(map);

        // Use circleMarker to prevent missing PNG asset bundle errors
        L.circleMarker([lat, lon], {
          radius: 12,
          fillColor: '#10b981',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85
        })
          .addTo(map)
          .bindPopup(
            `<div style="font-family: sans-serif; font-size: 12px; color: #18181b;">
              <strong>${geoData.city || 'Network Node'}, ${geoData.country || ''}</strong><br/>
              <span style="color: #52525b;">Approximate ISP Point of Presence</span>
            </div>`
          )
          .openPopup();

        setIsMapLoading(false);
      }, 100);
    } catch (err) {
      console.error('Failed to load Leaflet:', err);
      setIsMapLoading(false);
    }
  };

  // Plain text report for Copy / Download
  const generatePlainTextReport = (): string => {
    if (!geoData) return 'No IP geolocation data available.';
    const lines: string[] = [];
    lines.push('APEX UTILITY - IP LOCATION & NETWORK AUDIT');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('----------------------------------------------------');
    if (resolvedDomain) lines.push(`Domain Queried:  ${resolvedDomain}`);
    lines.push(`Target IP:       ${geoData.ip} (IPv${geoData.version})`);
    lines.push(`Country:         ${geoData.country} (${geoData.countryCode})`);
    lines.push(`Region / State:  ${geoData.region || 'Not disclosed'}`);
    lines.push(`City:            ${geoData.city || 'Not disclosed'}`);
    lines.push(`Timezone:        ${geoData.timezone}`);
    lines.push(`Latitude:        ${geoData.latitude !== null ? geoData.latitude : 'Approximate / masked'}`);
    lines.push(`Longitude:       ${geoData.longitude !== null ? geoData.longitude : 'Approximate / masked'}`);
    lines.push(`ASN:             ${geoData.asn || 'Not disclosed'}`);
    lines.push(`ISP / Org:       ${geoData.org || 'Not disclosed'}`);
    lines.push('\n----------------------------------------------------');
    lines.push('Notice: IP location is approximate (usually city or metro level).');
    lines.push('It shows where your network provider routes traffic, not your street address.');
    lines.push('Audit generated at apexutility.live/ip-location');
    return lines.join('\n');
  };

  return (
    <ToolLayout
      title="Free IP Location Lookup - Trace Any IP Address"
      badge="Geolocation & ASN Tracer"
      badgeIcon={<Compass className="w-3.5 h-3.5 text-emerald-400" />}
      description="Look up any public IPv4, IPv6 address, or website domain to discover its approximate geographic location, ISP organization, Autonomous System Number (ASN), and coordinates with an interactive map."
      copyDownloadContent={generatePlainTextReport()}
      downloadFileName={`ip-location-${geoData ? geoData.ip.replace(/[^a-z0-9.-]/gi, '_') : 'audit'}.txt`}
      announceMessage={announceMessage}
      relatedTools={[
        { id: 'what-is-my-ip', name: 'What Is My IP', path: '/what-is-my-ip', description: 'Check your public IPv4, IPv6, and browser profile.' },
        { id: 'internet-speed-test', name: 'Internet Speed Test', path: '/internet-speed-test', description: 'Test download and upload bandwidth and loaded bufferbloat.' },
        { id: 'ping-test', name: 'Ping Latency Test', path: '/ping-test', description: 'Measure round-trip HTTPS latency and sample jitter.' },
        { id: 'dns-test', name: 'DNS Test & Benchmark', path: '/dns-test', description: 'Perform record lookups and benchmark DoH resolvers.' }
      ]}
      faqs={[
        {
          question: 'How accurate is IP address geolocation?',
          answer: 'IP geolocation is approximate. It is 95%–99% accurate at the country level, 80%–90% accurate at the state/region level, and roughly 50%–75% accurate at the city level. It can NEVER reveal a user\'s physical house, street address, or room number. IP addresses are assigned to network routing hubs and cell towers, not personal residences.'
        },
        {
          question: 'Why does my IP location show a completely different city or state?',
          answer: 'Your Internet Service Provider (ISP) routes traffic through centralized Points of Presence (PoPs) or regional aggregation nodes. If you use a mobile cellular connection (5G/4G), your traffic may exit hundreds of miles away in a major metropolitan data center. Additionally, using a VPN, Apple iCloud Private Relay, or proxy routes your connection through an external server.'
        },
        {
          question: 'How does this tool look up websites by domain name?',
          answer: 'When you enter a website domain (such as google.com or github.com), the tool first queries a secure DNS-over-HTTPS (DoH) recursive resolver to retrieve the authoritative A or AAAA records. Once the public IP address is resolved, it queries the geographic registry for that address.'
        },
        {
          question: 'Why can’t private or local IP addresses be geolocated?',
          answer: 'Private IP ranges (such as 192.168.x.x, 10.x.x.x, and 172.16.x.x) and loopback addresses (127.0.0.1) are reserved under RFC 1918 and RFC 3330 for use within local home or office routers. They are non-routable on the public Internet and do not belong to any public geographic database.'
        },
        {
          question: 'What is an Autonomous System Number (ASN)?',
          answer: 'An Autonomous System (AS) is a massive collection of connected IP routing prefixes controlled by one administrative entity (such as Comcast, AT&T, Google, or Cloudflare). Each AS is assigned a unique globally registered number (ASN) used by the Border Gateway Protocol (BGP) to route packets across the global Internet backbone.'
        },
        {
          question: 'Does Apex Utility log or store the IP addresses I look up?',
          answer: 'No. We enforce a strict zero-knowledge privacy architecture. We do not store, log, or track queried IP addresses in databases, URLs, or cookies. All queries are handled in-memory and discarded as soon as the session closes.'
        },
        {
          question: 'What is the difference between a static IP and a dynamic IP?',
          answer: 'A static IP remains fixed permanently and is typically purchased by businesses hosting servers. A dynamic IP is temporarily leased to your home modem from an ISP address pool via DHCP and changes periodically when your router restarts or the lease expires.'
        },
        {
          question: 'How do websites determine my location if IP geolocation is imprecise?',
          answer: 'Websites that require precise street-level location (such as Google Maps or ride-sharing apps) use the HTML5 Geolocation API, which prompts you for explicit GPS or Wi-Fi triangulation permissions. If you deny that browser prompt, they can only rely on the approximate city-level IP address shown here.'
        }
      ]}
    >
      {/* Mode Switcher */}
      <div className="flex border-b border-zinc-800 mb-8">
        <button
          type="button"
          onClick={() => {
            setMode('my-ip');
            loadMyIp();
          }}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            mode === 'my-ip'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          My IP Location
        </button>
        <button
          type="button"
          onClick={() => setMode('lookup')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            mode === 'lookup'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Search className="w-4 h-4" />
          Look Up Any IP or Website
        </button>
      </div>

      {/* Mode 2 Input Bar */}
      {mode === 'lookup' && (
        <form onSubmit={handleLookupSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8 shadow-sm space-y-4">
          <label htmlFor="ip-lookup-input" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Target Public IP Address or Domain
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="ip-lookup-input"
                type="text"
                value={lookupInput}
                onChange={(e) => setLookupInput(e.target.value)}
                placeholder="e.g. 1.1.1.1, 8.8.8.8, or github.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Tracing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Trace IP Location
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Domain names are resolved to their public IP automatically via encrypted DNS-over-HTTPS.
          </p>
        </form>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          id={alertId}
          role="alert"
          className="flex items-center gap-3 p-4 mb-6 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Results Display */}
      {geoData && (
        <div className="space-y-6">
          {/* Hero Summary Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  {resolvedDomain ? `Resolved Target: ${resolvedDomain}` : 'Queried IP Address'}
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-zinc-100 font-mono tracking-tight">
                    {geoData.ip}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 text-xs font-semibold">
                    IPv{geoData.version}
                  </span>
                </div>
              </div>

              {/* Show on Map Toggle Button */}
              {geoData.latitude !== null && geoData.longitude !== null && (
                <button
                  type="button"
                  onClick={handleToggleMap}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer self-start md:self-auto"
                >
                  <MapIcon className="w-4 h-4 text-emerald-400" />
                  {showMap ? 'Hide Map' : 'Show on Interactive Map'}
                </button>
              )}
            </div>

            {/* Geolocation Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
              <div>
                <span className="text-xs text-zinc-500 block mb-1">Country</span>
                <span className="text-sm font-semibold text-zinc-200">
                  {geoData.country} ({geoData.countryCode})
                </span>
              </div>

              <div>
                <span className="text-xs text-zinc-500 block mb-1">Region / State</span>
                <span className="text-sm font-semibold text-zinc-200">
                  {geoData.region || 'Not disclosed'}
                </span>
              </div>

              <div>
                <span className="text-xs text-zinc-500 block mb-1">City</span>
                <span className="text-sm font-semibold text-zinc-200">
                  {geoData.city || 'Network Node'}
                </span>
              </div>

              <div>
                <span className="text-xs text-zinc-500 block mb-1">Timezone</span>
                <span className="text-sm font-semibold text-zinc-200">
                  {geoData.timezone}
                </span>
              </div>

              <div>
                <span className="text-xs text-zinc-500 block mb-1">Coordinates</span>
                <span className="text-sm font-mono font-medium text-zinc-300">
                  {geoData.latitude !== null && geoData.longitude !== null
                    ? `${geoData.latitude.toFixed(2)}°, ${geoData.longitude.toFixed(2)}°`
                    : 'Approximate / masked'}
                </span>
              </div>

              <div>
                <span className="text-xs text-zinc-500 block mb-1">Autonomous System (ASN)</span>
                <span className="text-sm font-mono font-medium text-emerald-400">
                  {geoData.asn || 'Not disclosed'}
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-xs text-zinc-500 block mb-1">Internet Service Provider (ISP) / Org</span>
                <span className="text-sm font-semibold text-zinc-200 truncate block">
                  {geoData.org || 'Internet Routing Provider'}
                </span>
              </div>
            </div>

            {/* Approximate Geolocation Notice */}
            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-400">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Important Notice on IP Geolocation:</strong> IP address location is approximate (usually city or regional carrier node level). It reflects where your Internet Service Provider routes traffic, not your physical street address or home. Using a VPN, Apple Private Relay, or cellular connection will display the location of the carrier's gateway data center.
              </span>
            </div>
          </div>

          {/* Lazy-Loaded Leaflet Map View */}
          {showMap && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Approximate Point of Presence Map (OpenStreetMap)
                </span>
                <span className="text-[11px] text-zinc-500">Center: {geoData.latitude?.toFixed(2)}°, {geoData.longitude?.toFixed(2)}°</span>
              </div>

              <div className="relative w-full h-80 bg-zinc-950">
                {isMapLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/80 text-zinc-400 text-xs">
                    <RotateCw className="w-4 h-4 animate-spin mr-2" />
                    Loading interactive map tiles...
                  </div>
                )}
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDUCATIONAL CONTENT SECTIONS */}
      <section className="mt-12 space-y-10 border-t border-zinc-800 pt-10 text-zinc-300 text-sm leading-relaxed">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-4">How IP Geolocation Works</h2>
          <p className="mb-3">
            Internet Protocol (IP) addresses are logical identifiers assigned to network interfaces, not physical geographic markers with embedded GPS chips. To determine the location of an IP address, geolocation databases compile information from multiple global network registries:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li><strong className="text-zinc-200">Regional Internet Registries (RIRs):</strong> Organizations such as ARIN (North America), RIPE (Europe), and APNIC (Asia) publish public WHOIS allocations declaring the organization and country assigned to each block of IP addresses.</li>
            <li><strong className="text-zinc-200">Border Gateway Protocol (BGP) Routing Tables:</strong> Global routing announcements show which Autonomous System (AS) is originating traffic and where its peering exchange points are located.</li>
            <li><strong className="text-zinc-200">Network Latency Triangulation:</strong> Specialized probing servers measure round-trip ping times from geographically dispersed nodes to estimate the physical distance to an endpoint.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-4">Why IP Geolocation Cannot Find Your House</h2>
          <p className="mb-3">
            A common cybersecurity misconception is that an IP address reveals a homeowner’s street address or bedroom window. In reality:
          </p>
          <p className="mb-3 text-zinc-400">
            An IP address identifies a connection between your home router and the nearest telephone pole, fiber splitter, or ISP Central Office (CO). Your ISP assigns an IP address dynamically to hundreds of customers over time. Only your ISP holds the internal customer billing records linking an IP timestamp to a physical subscriber address, and that information is protected by federal privacy laws requiring a court order or subpoena to access.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-4">The Impact of VPNs, Proxies &amp; Mobile Data</h2>
          <p className="mb-3">
            If you connect through a Virtual Private Network (VPN) or Apple iCloud Private Relay, your computer establishes an encrypted tunnel to a remote server before accessing websites. As a result, every website you visit sees the IP address and geolocation of the VPN server (which could be in another city or country), completely masking your real ISP gateway.
          </p>
          <p className="text-zinc-400">
            Similarly, mobile 4G/5G smartphones route cellular data through carrier Packet Data Network Gateways (P-GWs). If you are in rural Ohio on a mobile connection, your IP location may show as Chicago or Atlanta where the cellular carrier’s regional data center operates.
          </p>
        </div>
      </section>
    </ToolLayout>
  );
};

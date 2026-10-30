import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, RefreshCw, Copy, Check, Globe, Shield, Laptop, 
  MapPin, Clock, Network, AlertCircle, Info, ExternalLink
} from 'lucide-react';
import ToolLayout, { FaqItem } from './ToolLayout';
import { DefaultIpGeoAdapter, NormalizedIpData } from '../../utils/networkUtils';

interface Props {
  onNavigateTab?: (path: string) => void;
}

export default function WhatIsMyIpTool({ onNavigateTab }: Props) {
  const [loading, setLoading] = useState(true);
  const [ipv4, setIpv4] = useState<string | null>(null);
  const [ipv6, setIpv6] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<NormalizedIpData | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');

  // Browser / User-Agent detection
  const clientEnvironment = useMemo(() => {
    if (typeof window === 'undefined') return { os: 'Unknown', browser: 'Unknown', ua: '' };
    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';

    let browser = 'Modern Browser';
    if (/Chrome/i.test(ua) && !/Edge|Edg|OPR/i.test(ua)) browser = 'Google Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
    else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';
    else if (/Edg/i.test(ua)) browser = 'Microsoft Edge';

    return { os, browser, ua };
  }, []);

  const detectIpAddresses = async () => {
    setLoading(true);
    setAnnouncement('Detecting public IPv4 and IPv6 network addresses...');
    
    const adapter = new DefaultIpGeoAdapter();
    try {
      const result = await adapter.getMyIp();
      setIpv4(result.ipv4 || null);
      setIpv6(result.ipv6 || null);
      if (result.normalized) {
        setGeoData(result.normalized);
      }
      setAnnouncement(
        `IP detection complete. Detected IPv4: ${result.ipv4 || 'Not detected'}. IPv6: ${result.ipv6 || 'Not detected'}.`
      );
    } catch {
      setAnnouncement('IP address lookup failed or was blocked by browser configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectIpAddresses();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Compile full visible result string for export
  const exportSummary = useMemo(() => {
    return [
      '========================================',
      'WHAT IS MY IP - AUDIT REPORT',
      'Generated via: https://apexutility.live/what-is-my-ip',
      `Timestamp: ${new Date().toISOString()}`,
      '========================================',
      `IPv4 Address: ${ipv4 || 'Not detected'}`,
      `IPv6 Address: ${ipv6 || 'Not detected'}`,
      `Primary Protocol: ${ipv6 ? 'IPv6' : (ipv4 ? 'IPv4' : 'Unknown')}`,
      `Internet Service Provider: ${geoData?.org || 'Public Transit Node'}`,
      `Autonomous System Number (ASN): ${geoData?.asn || 'Standard Transit'}`,
      `Estimated Location: ${geoData?.city || 'Metro Area'}, ${geoData?.region || 'Region'}, ${geoData?.country || 'Country'}`,
      `Timezone: ${geoData?.timezone || 'UTC'}`,
      `Operating System: ${clientEnvironment.os}`,
      `Browser: ${clientEnvironment.browser}`,
      '----------------------------------------',
      'Notice: IP location is approximate and reflects ISP routing nodes or VPN gateways, not a physical street address.',
      '========================================'
    ].join('\n');
  }, [ipv4, ipv6, geoData, clientEnvironment]);

  // Frequently Asked Questions
  const faqs: FaqItem[] = [
    {
      question: "What is an IP address and why does every device need one?",
      answer: "An Internet Protocol (IP) address is a unique numerical or hexadecimal identifier assigned to every device connected to a computer network. Similar to how a postal address allows mail carriers to deliver envelopes to your physical house, an IP address allows web servers, routers, and content networks to route requested data packets (such as web pages, video streams, or file downloads) back to your exact device across the global internet."
    },
    {
      question: "What is the difference between IPv4 and IPv6?",
      answer: "IPv4 uses 32-bit addresses formatted as four octets separated by dots (e.g. 192.0.2.1), providing approximately 4.29 billion total possible addresses. Because the global growth of smartphones, laptops, servers, and smart home IoT devices exhausted the available IPv4 address pool, IPv6 was introduced. IPv6 uses 128-bit addresses formatted in eight groups of hexadecimal digits separated by colons (e.g. 2001:db8::1), creating 340 undecillion possible addresses—ensuring the internet never runs out of unique identifiers."
    },
    {
      question: "What is the difference between a public IP and a private IP?",
      answer: "A public IP address is assigned to your internet router by your Internet Service Provider (ISP) and is visible to the public internet and websites you visit. A private IP address (such as 192.168.1.100 or 10.0.0.5) is assigned to your specific device inside your local home or office network by your router using DHCP. Websites you visit on the web can only see your router's public IP address, never your internal private device IP."
    },
    {
      question: "Why does my connection say 'IPv6 Not detected'?",
      answer: "Not all ISPs, mobile cellular providers, or home Wi-Fi routers have enabled IPv6 routing on their networks yet. If your provider only assigns legacy IPv4 addresses or your router does not have IPv6 DHCP enabled, your browser will only be able to communicate over IPv4. Having no IPv6 is completely normal and will not prevent you from browsing the web."
    },
    {
      question: "Can websites see my exact physical street address from my IP?",
      answer: "No. IP geolocation relies on commercial database mapping that associates IP ranges with network routing nodes, regional exchange hubs, or ISP head-ends. At best, an IP address can only identify your approximate city or metropolitan region. It cannot pinpoint your physical home, apartment number, or street address. Only your ISP has records connecting an IP address to a subscriber account, which requires legal subpoenas to access."
    },
    {
      question: "What is the difference between a static and dynamic IP address?",
      answer: "A dynamic IP address is temporarily leased to your router by your ISP and may change periodically (such as when your router reboots or every few weeks). Most residential internet connections use dynamic IPs. A static IP address never changes and remains permanently bound to an endpoint, which is commonly purchased by businesses hosting internal email servers, web applications, or remote VPN tunnels."
    },
    {
      question: "How can I change or hide my public IP address?",
      answer: "You can change or mask your public IP address using three legitimate methods: (1) Connect to a Virtual Private Network (VPN), which tunnels your internet traffic through a remote VPN server so websites only see the VPN's IP; (2) Use an encrypted proxy or Tor network; or (3) Power down your home router/modem for 10 to 15 minutes to release the current DHCP lease and request a new dynamic IP from your ISP."
    },
    {
      question: "How do I find my private local IP address on my computer or phone?",
      answer: "On Windows, open Command Prompt and type 'ipconfig' (look for IPv4 Address). On macOS, open System Settings > Network > Wi-Fi > Details (look for IP Address) or type 'ifconfig' in Terminal. On iPhone/iPad, go to Settings > Wi-Fi, tap the 'i' icon next to your network, and check 'IP Address'. On Android, go to Settings > Network & internet > Wi-Fi, tap your network settings, and view 'IP address'."
    }
  ];

  return (
    <ToolLayout
      currentToolId="what-is-my-ip"
      title="What Is My IP Address?"
      metaDescription="Find out what your IP address is. See your public IPv4 and IPv6 address, ISP and approximate location. Free, instant, no sign-up."
      canonicalPath="/what-is-my-ip"
      badgeText="Public IP Inspector"
      introDescription="Discover your public IPv4 and IPv6 internet addresses, host organization, network provider, and connection details. 100% private in-browser detection with zero logging."
      resultForExport={exportSummary}
      faqs={faqs}
      onNavigateTab={onNavigateTab}
      ariaAnnouncement={announcement}
      contentSections={
        <div className="space-y-10 text-zinc-300">
          {/* Section 1: Fundamentals */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Understanding Your IP Address: How Your Connection Identifies on the Web
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Every time you load a webpage, stream a video, or send an email, data packets transit through thousands of network switches, optical fiber lines, and undersea routing cables. For those packets to arrive safely at your screen, the global internet relies on the <strong>Internet Protocol (IP)</strong>—the fundamental addressing architecture of digital telecommunications.
            </p>
            <p className="text-sm leading-relaxed text-zinc-400">
              Your public IP address functions as the unique return address stamped onto every outgoing network request your router transmits. When you navigate to a website, that destination server reads your public IP so its web application can stream the requested HTML, images, and video back to your specific router. Without a valid public IP, bi-directional network communication would be impossible.
            </p>
          </section>

          {/* Section 2: IPv4 vs IPv6 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              IPv4 vs. IPv6: The Generational Evolution of the Internet
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  IPv4 (Internet Protocol Version 4)
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Introduced in 1981 by DARPA, IPv4 remains the most widely deployed protocol. IPv4 addresses are 32-bit binary integers represented as four decimal numbers (0–255) separated by periods (e.g., <code className="text-red-300 font-mono">198.51.100.42</code>). Because 32 bits only support $2^{32}$ (roughly 4.29 billion) addresses, the global explosion of smartphones, laptops, cloud virtual machines, and smart devices has exhausted unallocated IPv4 pools worldwide.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  IPv6 (Internet Protocol Version 6)
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Engineered by the Internet Engineering Task Force (IETF) to replace IPv4, IPv6 expands address length to 128 bits, written as eight groups of four hexadecimal digits separated by colons (e.g., <code className="text-indigo-300 font-mono">2001:0db8:85a3::8a2e:0370:7334</code>). This provides approximately $3.4 \times 10^{38}$ unique addresses—enough to assign billions of IPs to every grain of sand on Earth, eliminating the need for NAT translation.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Public vs Private IPs */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Public IP vs. Private IP: Why Your Computer Has Two Addresses
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              One of the most common sources of confusion for users is discovering that the IP address shown on this web page is completely different from the IP address listed in their computer or smartphone’s network settings. This separation exists because of <strong>Network Address Translation (NAT)</strong>.
            </p>
            <ul className="space-y-3 text-sm text-zinc-400 list-disc pl-5">
              <li>
                <strong className="text-white">Your Public IP Address:</strong> Assigned to your broadband modem or fiber gateway by your Internet Service Provider. It is unique across the entire global internet. All devices connected to your home Wi-Fi (phones, tablets, smart TVs, PCs) share this single public IP address when accessing external websites.
              </li>
              <li>
                <strong className="text-white">Your Private (Local) IP Address:</strong> Created and managed solely inside your private local area network (LAN) by your router's DHCP service. Standard private ranges defined under RFC 1918 include <code className="text-zinc-200 font-mono">192.168.x.x</code>, <code className="text-zinc-200 font-mono">10.x.x.x</code>, and <code className="text-zinc-200 font-mono">172.16.x.x - 172.31.x.x</code>. External internet servers cannot see or directly route to your private IP.
              </li>
            </ul>
          </section>

          {/* Section 4: How to find private IP on all platforms */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              How to Find Your Private Local IP Address on Any Operating System
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <strong className="text-white text-sm">Windows 10 / 11</strong>
                <p className="text-zinc-400 leading-relaxed">
                  Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded font-mono">Win + R</kbd>, type <code className="text-red-300 font-mono">cmd</code>, hit Enter, then run <code className="text-red-300 font-mono">ipconfig</code>. Look for the line labeled <em>IPv4 Address</em> (e.g. 192.168.1.15).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <strong className="text-white text-sm">Apple macOS</strong>
                <p className="text-zinc-400 leading-relaxed">
                  Navigate to <strong>System Settings &gt; Wi-Fi</strong>, click <strong>Details...</strong> next to your active network, and view <em>IP Address</em>. Alternatively, execute <code className="text-red-300 font-mono">ipconfig getifaddr en0</code> in Terminal.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <strong className="text-white text-sm">Apple iPhone / iPad</strong>
                <p className="text-zinc-400 leading-relaxed">
                  Open <strong>Settings &gt; Wi-Fi</strong>, tap the small blue <strong className="text-zinc-200">(i)</strong> info button beside your connected Wi-Fi SSID, and look down at the <em>IPV4 ADDRESS</em> field.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <strong className="text-white text-sm">Google Android</strong>
                <p className="text-zinc-400 leading-relaxed">
                  Go to <strong>Settings &gt; Network &amp; Internet &gt; Wi-Fi</strong>, tap your active network gear icon, expand <strong>Advanced</strong>, and locate your <em>IP Address</em> at the bottom.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Privacy, Tracking & Geolocation Reality */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Can Websites See My Identity from My IP Address?
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              When you visit an ordinary website, the server’s access logs record your public IP, the requested page URL, timestamp, and your browser’s User-Agent string. However, an IP address alone <strong>cannot</strong> reveal your personal name, email address, home street number, or phone number.
            </p>
            <p className="text-sm leading-relaxed text-zinc-400">
              Only your Internet Service Provider maintains internal subscriber databases that link a public IP lease to a customer billing account. In virtually all jurisdictions, ISPs are prohibited by privacy laws from releasing subscriber identity records without a valid court subpoena or criminal search warrant.
            </p>
          </section>
        </div>
      }
    >
      {/* =====================================================================
          MAIN TOOL COMPONENT DISPLAY
          ===================================================================== */}
      <div className="space-y-6">
        {/* Top Prominent IP Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IPv4 Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-400" />
                Public IPv4 Address
              </span>
              <span className="text-[11px] font-mono text-zinc-500">Standard Web</span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight truncate">
                {loading ? (
                  <span className="animate-pulse text-zinc-500 text-lg">Probing network...</span>
                ) : (
                  ipv4 || <span className="text-zinc-500 text-xl font-sans">Not detected</span>
                )}
              </div>

              {ipv4 && (
                <button
                  type="button"
                  onClick={() => handleCopy(ipv4, 'ipv4')}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors shrink-0 cursor-pointer"
                  title="Copy IPv4 address"
                >
                  {copiedKey === 'ipv4' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Primary 32-bit internet protocol address routed through your gateway.
            </p>
          </div>

          {/* IPv6 Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Network className="w-4 h-4 text-indigo-400" />
                Public IPv6 Address
              </span>
              <span className="text-[11px] font-mono text-zinc-500">Next-Gen</span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <div className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight truncate">
                {loading ? (
                  <span className="animate-pulse text-zinc-500 text-lg">Probing network...</span>
                ) : (
                  ipv6 || <span className="text-zinc-500 font-sans text-base">Not detected</span>
                )}
              </div>

              {ipv6 && (
                <button
                  type="button"
                  onClick={() => handleCopy(ipv6, 'ipv6')}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors shrink-0 cursor-pointer"
                  title="Copy IPv6 address"
                >
                  {copiedKey === 'ipv6' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              {ipv6 ? '128-bit native IPv6 address enabled by your network.' : 'Normal: Many ISPs have not yet enabled IPv6 routing for residential lines.'}
            </p>
          </div>
        </div>

        {/* Technical Network Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* ISP / Organization */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-zinc-400" />
              ISP / Transit Org
            </span>
            <div className="text-sm font-bold text-white truncate">
              {geoData?.org || 'Public Transit Node'}
            </div>
            <p className="text-[10px] text-zinc-400">Network autonomous system</p>
          </div>

          {/* ASN */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-zinc-400" />
              Autonomous System (ASN)
            </span>
            <div className="text-sm font-bold text-white truncate font-mono">
              {geoData?.asn || 'Standard Transit'}
            </div>
            <p className="text-[10px] text-zinc-400">BGP routing identifier</p>
          </div>

          {/* Estimated City / Region */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              Approximate Location
            </span>
            <div className="text-sm font-bold text-white truncate">
              {geoData?.city ? `${geoData.city}, ${geoData.country}` : 'Metro Area Routing Node'}
            </div>
            <p className="text-[10px] text-zinc-400">City / Regional routing node</p>
          </div>

          {/* Browser & OS */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-zinc-400" />
              Client Environment
            </span>
            <div className="text-sm font-bold text-white truncate">
              {clientEnvironment.browser} on {clientEnvironment.os}
            </div>
            <p className="text-[10px] text-zinc-400">User agent signature</p>
          </div>
        </div>

        {/* Honest Geolocation Notice */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/30 flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong>Location accuracy note:</strong> IP location is approximate (usually city or region level). It shows where your network provider routes traffic, not your home address. A VPN or proxy changes what is shown.
          </p>
        </div>

        {/* Refresh Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={detectIpAddresses}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-400' : ''}`} />
            <span>{loading ? 'Re-checking...' : 'Refresh IP Check'}</span>
          </button>
        </div>
      </div>
    </ToolLayout>
  );
}

export { WhatIsMyIpTool };

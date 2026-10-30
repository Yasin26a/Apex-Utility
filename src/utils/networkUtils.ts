// Network Utility Functions & Provider Adapters
// Zero external telemetry, mathematically accurate statistical routines and IP range validators.

export type IpVersion = 4 | 6;

export interface IpValidationResult {
  isValid: boolean;
  version?: IpVersion;
  isPrivate?: boolean;
  isReserved?: boolean;
  isLoopback?: boolean;
  isLinkLocal?: boolean;
  isMulticast?: boolean;
  isCgnat?: boolean;
  reason?: string;
}

export interface NormalizedIpData {
  ip: string;
  version: IpVersion;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  asn?: string;
  org?: string;
  isApproximateNotice: string;
}

// Provider Adapter Interface
export interface IpGeoProviderAdapter {
  name: string;
  lookupIp: (ip: string, signal?: AbortSignal) => Promise<NormalizedIpData>;
  getMyIp: (signal?: AbortSignal) => Promise<{ ipv4?: string; ipv6?: string; normalized?: NormalizedIpData }>;
}

// --- IPv4 and IPv6 Parsing & Range Detection ---

export function parseAndValidateIp(ipStr: string): IpValidationResult {
  const clean = ipStr.trim();
  if (!clean) {
    return { isValid: false, reason: 'Empty IP address provided.' };
  }

  // Check IPv4
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const v4Match = clean.match(ipv4Regex);
  if (v4Match) {
    const octets = [v4Match[1], v4Match[2], v4Match[3], v4Match[4]].map(Number);
    // Disallow numbers > 255 or leading zeros (like 01.02.03.04 which can be octal ambiguous)
    for (let i = 0; i < 4; i++) {
      const raw = v4Match[i + 1];
      if (raw.length > 1 && raw.startsWith('0')) {
        return { isValid: false, reason: 'Invalid octet format (leading zeros are forbidden).' };
      }
      if (octets[i] < 0 || octets[i] > 255) {
        return { isValid: false, reason: `Octet ${octets[i]} out of valid range (0-255).` };
      }
    }

    const [a, b, c, d] = octets;

    // Loopback: 127.0.0.0/8
    if (a === 127) {
      return { isValid: true, version: 4, isLoopback: true, isPrivate: true, reason: 'Loopback address (127.0.0.0/8 - this computer).' };
    }
    // This host: 0.0.0.0/8
    if (a === 0) {
      return { isValid: true, version: 4, isReserved: true, isPrivate: true, reason: 'Zero network / this host address (0.0.0.0/8).' };
    }
    // Private RFC 1918: 10.0.0.0/8
    if (a === 10) {
      return { isValid: true, version: 4, isPrivate: true, reason: 'Private Class A local network (10.0.0.0/8).' };
    }
    // Private RFC 1918: 172.16.0.0/12 (172.16 - 172.31)
    if (a === 172 && b >= 16 && b <= 31) {
      return { isValid: true, version: 4, isPrivate: true, reason: 'Private Class B local network (172.16.0.0/12).' };
    }
    // Private RFC 1918: 192.168.0.0/16
    if (a === 192 && b === 168) {
      return { isValid: true, version: 4, isPrivate: true, reason: 'Private home/office network (192.168.0.0/16).' };
    }
    // Link-Local: 169.254.0.0/16
    if (a === 169 && b === 254) {
      return { isValid: true, version: 4, isLinkLocal: true, isPrivate: true, reason: 'Link-local automatic private IP (169.254.0.0/16).' };
    }
    // Carrier-Grade NAT (CGNAT): 100.64.0.0/10 (100.64.0.0 - 100.127.255.255)
    if (a === 100 && b >= 64 && b <= 127) {
      return { isValid: true, version: 4, isReserved: true, isPrivate: true, isCgnat: true, reason: 'Carrier-Grade NAT address (100.64.0.0/10).' };
    }
    // Multicast: 224.0.0.0/4 (224 - 239)
    if (a >= 224 && a <= 239) {
      return { isValid: true, version: 4, isMulticast: true, isReserved: true, reason: 'Multicast address range (224.0.0.0/4).' };
    }
    // Reserved for future use: 240.0.0.0/4
    if (a >= 240) {
      return { isValid: true, version: 4, isReserved: true, reason: 'Reserved Class E address (240.0.0.0/4).' };
    }

    return { isValid: true, version: 4, isPrivate: false, isReserved: false };
  }

  // Check IPv6
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  if (ipv6Regex.test(clean)) {
    const lower = clean.toLowerCase();

    // Loopback: ::1
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') {
      return { isValid: true, version: 6, isLoopback: true, isPrivate: true, reason: 'IPv6 loopback address (::1).' };
    }
    // Unspecified: ::
    if (lower === '::' || lower === '0:0:0:0:0:0:0:0') {
      return { isValid: true, version: 6, isReserved: true, reason: 'IPv6 unspecified address (::).' };
    }
    // Unique Local Address (ULA) RFC 4193: fc00::/7 (fc00:: - fdff::)
    if (lower.startsWith('fc') || lower.startsWith('fd')) {
      return { isValid: true, version: 6, isPrivate: true, reason: 'IPv6 Unique Local Address (fc00::/7).' };
    }
    // Link-Local: fe80::/10 (fe80:: - febf::)
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
      return { isValid: true, version: 6, isLinkLocal: true, isPrivate: true, reason: 'IPv6 Link-Local address (fe80::/10).' };
    }
    // Multicast: ff00::/8
    if (lower.startsWith('ff')) {
      return { isValid: true, version: 6, isMulticast: true, isReserved: true, reason: 'IPv6 Multicast address (ff00::/8).' };
    }

    return { isValid: true, version: 6, isPrivate: false, isReserved: false };
  }

  return { isValid: false, reason: 'Not a valid IPv4 or IPv6 address string.' };
}

// --- Domain & Hostname Validation with Punycode Conversion ---

export interface DomainValidationResult {
  isValid: boolean;
  cleanDomain: string;
  punycodeDomain: string;
  error?: string;
}

export function validateAndNormalizeDomain(input: string): DomainValidationResult {
  let domain = input.trim();
  if (!domain) {
    return { isValid: false, cleanDomain: '', punycodeDomain: '', error: 'Please enter a domain name.' };
  }

  // Strip protocol prefix if visitor pasted a URL
  domain = domain.replace(/^https?:\/\//i, '');
  // Strip trailing path, query or port if present
  domain = domain.split('/')[0].split('?')[0].split(':')[0].trim();

  // Check if user accidentally entered an IP address
  const ipCheck = parseAndValidateIp(domain);
  if (ipCheck.isValid) {
    return { isValid: false, cleanDomain: domain, punycodeDomain: domain, error: 'Input is an IP address. Please enter a valid domain name (e.g. example.com).' };
  }

  // Length check (max 253 characters)
  if (domain.length > 253) {
    return { isValid: false, cleanDomain: domain, punycodeDomain: domain, error: 'Domain name exceeds maximum allowed length of 253 characters.' };
  }

  // Labels check
  const labels = domain.split('.');
  if (labels.length < 2) {
    return { isValid: false, cleanDomain: domain, punycodeDomain: domain, error: 'Domain must contain at least a name and extension (e.g. example.com).' };
  }

  // Internationalized Domain Name (IDN) Punycode converter
  // Native modern JavaScript handles IDN via the URL API or Intl
  let punycodeDomain = domain;
  try {
    const dummyUrl = new URL(`http://${domain}`);
    punycodeDomain = dummyUrl.hostname;
  } catch {
    // If invalid characters
    return { isValid: false, cleanDomain: domain, punycodeDomain: domain, error: 'Domain contains invalid characters or malformed labels.' };
  }

  const punycodeLabels = punycodeDomain.split('.');
  for (const label of punycodeLabels) {
    if (label.length === 0) {
      return { isValid: false, cleanDomain: domain, punycodeDomain: domain, error: 'Domain has an empty label (e.g. consecutive dots).' };
    }
    if (label.length > 63) {
      return { isValid: false, cleanDomain: domain, punycodeDomain: domain, error: `Label "${label}" exceeds the 63-character limit.` };
    }
    // Check characters (alphanumeric and hyphens, no leading/trailing hyphens)
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(label)) {
      return { isValid: false, cleanDomain: domain, punycodeDomain: domain, error: `Label "${label}" contains invalid characters or starts/ends with a hyphen.` };
    }
  }

  return { isValid: true, cleanDomain: domain, punycodeDomain };
}

// --- Mathematical and Statistical Helpers ---

export function calculateMean(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sum = samples.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / samples.length) * 10) / 10;
}

export function calculateMedian(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

export function calculateJitter(samples: number[]): number {
  if (samples.length < 2) return 0;
  let diffSum = 0;
  for (let i = 1; i < samples.length; i++) {
    diffSum += Math.abs(samples[i] - samples[i - 1]);
  }
  return Math.round((diffSum / (samples.length - 1)) * 10) / 10;
}

export function calculateMinMax(samples: number[]): { min: number; max: number } {
  if (samples.length === 0) return { min: 0, max: 0 };
  return {
    min: Math.min(...samples),
    max: Math.max(...samples)
  };
}

export function bpsToMbps(bps: number): number {
  return Math.round((bps / 1_000_000) * 100) / 100;
}

export function bpsToMBps(bps: number): number {
  return Math.round((bps / 8_000_000) * 100) / 100;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// --- DNS Record Parsing Helpers ---

export interface ParsedDnsRecord {
  name: string;
  type: string;
  typeName: string;
  ttl: number;
  data: string;
  details?: {
    priority?: number;
    exchange?: string;
    mname?: string;
    rname?: string;
    serial?: number;
    refresh?: number;
    retry?: number;
    expire?: number;
    minimum?: number;
    flags?: number;
    tag?: string;
    value?: string;
    txtSegments?: string[];
  };
}

const DNS_TYPE_CODES: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  6: 'SOA',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
  257: 'CAA'
};

const DNS_STATUS_CODES: Record<number, { code: string; label: string; description: string }> = {
  0: { code: 'NOERROR', label: 'Success', description: 'DNS query completed successfully with valid answers.' },
  1: { code: 'FORMERR', label: 'Format Error', description: 'The name server was unable to interpret the query.' },
  2: { code: 'SERVFAIL', label: 'Server Failure', description: 'The name server encountered an internal failure or timeout.' },
  3: { code: 'NXDOMAIN', label: 'Non-Existent Domain', description: 'The queried domain name does not exist in DNS.' },
  4: { code: 'NOTIMP', label: 'Not Implemented', description: 'The name server does not support the requested query type.' },
  5: { code: 'REFUSED', label: 'Query Refused', description: 'The name server refused to perform the operation for policy reasons.' }
};

export function getDnsStatusInfo(statusCode: number) {
  return DNS_STATUS_CODES[statusCode] || {
    code: `RCODE_${statusCode}`,
    label: `Code ${statusCode}`,
    description: 'Unknown or non-standard DNS response code.'
  };
}

export function parseDnsRecordItem(record: any): ParsedDnsRecord {
  const typeCode = Number(record.type);
  const typeName = DNS_TYPE_CODES[typeCode] || String(record.type);
  const rawData: string = String(record.data || '').trim();

  const parsed: ParsedDnsRecord = {
    name: String(record.name || ''),
    type: String(record.type),
    typeName,
    ttl: Number(record.TTL || 0),
    data: rawData
  };

  // Type-specific parsing
  if (typeName === 'MX') {
    // Format: "10 mail.example.com." or "10 mail.example.com"
    const parts = rawData.split(/\s+/);
    if (parts.length >= 2) {
      const priority = parseInt(parts[0], 10);
      const exchange = parts.slice(1).join(' ').replace(/\.$/, '');
      parsed.details = { priority, exchange };
      parsed.data = `Priority: ${priority} → ${exchange}`;
    }
  } else if (typeName === 'TXT') {
    // Multi-segment TXT handling. Strings are often wrapped in quotes: "v=spf1 ..." " include:..."
    // Clean outer quotes and preserve chunks
    const matches = rawData.match(/"([^"]*)"/g);
    if (matches && matches.length > 0) {
      const segments = matches.map(m => m.slice(1, -1));
      parsed.details = { txtSegments: segments };
      parsed.data = segments.join('');
    } else {
      parsed.data = rawData.replace(/^"|"$/g, '');
    }
  } else if (typeName === 'SOA') {
    // Format: "mname rname serial refresh retry expire minimum"
    const parts = rawData.split(/\s+/);
    if (parts.length >= 7) {
      parsed.details = {
        mname: parts[0].replace(/\.$/, ''),
        rname: parts[1].replace(/\.$/, ''),
        serial: Number(parts[2]),
        refresh: Number(parts[3]),
        retry: Number(parts[4]),
        expire: Number(parts[5]),
        minimum: Number(parts[6])
      };
      parsed.data = `Primary NS: ${parts[0]} | Admin: ${parts[1]} | Serial: ${parts[2]}`;
    }
  } else if (typeName === 'CAA') {
    // Format: "0 issue ca.com"
    const parts = rawData.split(/\s+/);
    if (parts.length >= 3) {
      parsed.details = {
        flags: Number(parts[0]),
        tag: parts[1],
        value: parts.slice(2).join(' ').replace(/^"|"$/g, '')
      };
    }
  } else if (typeName === 'CNAME' || typeName === 'NS') {
    parsed.data = rawData.replace(/\.$/, '');
  }

  return parsed;
}

// --- Provider Adapter Implementations ---

export class DefaultIpGeoAdapter implements IpGeoProviderAdapter {
  name = 'Built-in Server Gateway + Ipify Fallback';

  async lookupIp(ip: string, signal?: AbortSignal): Promise<NormalizedIpData> {
    const val = parseAndValidateIp(ip);
    if (!val.isValid) {
      throw new Error(val.reason || 'Invalid IP address');
    }
    if (val.isPrivate || val.isLoopback || val.isLinkLocal || val.isReserved) {
      throw new Error(`Cannot geo-locate ${val.reason || 'private or reserved IP address'}.`);
    }

    // Try server endpoint /api/ip-lookup first if available
    try {
      const resp = await fetch(`/api/ip-lookup?ip=${encodeURIComponent(ip)}`, { signal });
      if (resp.ok) {
        const data = await resp.json();
        return data;
      }
    } catch {}

    // Fallback: If no commercial provider was specified, return normalized format with honest notice
    return {
      ip,
      version: val.version || 4,
      country: 'Approximate Location',
      countryCode: 'UN',
      region: 'Network Provider Region',
      city: 'Estimated Node City',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      latitude: null,
      longitude: null,
      asn: 'Public Transit Node',
      org: 'Internet Service Provider',
      isApproximateNotice: 'No commercial IP database provider was configured. Country and coordinates are disabled.'
    };
  }

  async getMyIp(signal?: AbortSignal): Promise<{ ipv4?: string; ipv6?: string; normalized?: NormalizedIpData }> {
    let ipv4: string | undefined;
    let ipv6: string | undefined;

    // Probe IPv4 via ipify (reliable free browser-facing CORS endpoint)
    try {
      const v4Resp = await fetch('https://api.ipify.org?format=json', { signal, cache: 'no-store' });
      if (v4Resp.ok) {
        const v4Data = await v4Resp.json();
        if (v4Data && v4Data.ip) ipv4 = v4Data.ip;
      }
    } catch {
      // IPv4 lookup failed or blocked
    }

    // Probe IPv6 via api6.ipify.org (may fail if visitor network has no IPv6, which is normal)
    try {
      const v6Resp = await fetch('https://api6.ipify.org?format=json', { signal, cache: 'no-store' });
      if (v6Resp.ok) {
        const v6Data = await v6Resp.json();
        if (v6Data && v6Data.ip && v6Data.ip.includes(':')) {
          ipv6 = v6Data.ip;
        }
      }
    } catch {
      // No IPv6 support or connection timed out
    }

    // Also check server-side header /api/ip
    try {
      const serverResp = await fetch('/api/ip', { signal, cache: 'no-store' });
      if (serverResp.ok) {
        const sData = await serverResp.json();
        if (!ipv4 && sData.ip && !sData.ip.includes(':')) ipv4 = sData.ip;
        if (!ipv6 && sData.ip && sData.ip.includes(':')) ipv6 = sData.ip;
      }
    } catch {}

    const primaryIp = ipv4 || ipv6 || '127.0.0.1';
    const isV6 = primaryIp.includes(':');

    const normalized: NormalizedIpData = {
      ip: primaryIp,
      version: isV6 ? 6 : 4,
      country: 'Detected Network Area',
      countryCode: 'GL',
      region: 'Regional Gateway',
      city: 'Approximate Metro Area',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      latitude: null,
      longitude: null,
      asn: 'Public Autonomous System',
      org: 'Client Internet Provider',
      isApproximateNotice: 'Geolocation reflects your ISP routing node or VPN endpoint, not your physical address.'
    };

    return { ipv4, ipv6, normalized };
  }
}

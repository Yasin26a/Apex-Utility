// Network Tools Configuration File
// Centralized configuration for targets, thresholds, DoH resolvers, and benchmark domain suites.

export interface PingTarget {
  id: string;
  name: string;
  url: string;
  description: string;
  corsVerified: boolean;
}

export interface PingThresholds {
  excellentMaxMs: number;
  goodMaxMs: number;
  fairMaxMs: number;
}

export interface DohResolver {
  id: string;
  name: string;
  provider: string;
  endpointUrl: string;
  acceptHeader?: string;
  primaryIpv4: string;
  secondaryIpv4: string;
  website: string;
}

export const NETWORK_CONFIG = {
  // Ping Test Targets (HTTPS round-trip latency probes)
  pingTargets: [
    {
      id: 'local-server',
      name: 'Origin Edge Server (/api/ping)',
      url: '/api/ping',
      description: 'Measures HTTPS round-trip to the application host edge.',
      corsVerified: true
    },
    {
      id: 'cloudflare-edge',
      name: 'Cloudflare Global Edge (cdn-cgi/trace)',
      url: 'https://cloudflare.com/cdn-cgi/trace',
      description: 'Measures HTTPS round-trip to Cloudflare’s nearest anycast edge node.',
      corsVerified: true
    }
  ] as PingTarget[],

  // Latency rating guide thresholds (in milliseconds)
  pingThresholds: {
    excellentMaxMs: 30, // 0 - 30 ms
    goodMaxMs: 65,      // 31 - 65 ms
    fairMaxMs: 120,     // 66 - 120 ms
    // > 120 ms is Poor
  } as PingThresholds,

  // Benchmark domains for DNS Speed Test (10 distinct popular domains)
  dnsBenchmarkDomains: [
    'google.com',
    'wikipedia.org',
    'github.com',
    'amazon.com',
    'microsoft.com',
    'apple.com',
    'cloudflare.com',
    'reddit.com',
    'netflix.com',
    'mozilla.org'
  ],

  // Verified DNS-over-HTTPS (DoH) JSON resolvers
  // Note: Only Cloudflare and Google provide open browser-accessible CORS DoH endpoints
  dohResolvers: [
    {
      id: 'cloudflare',
      name: 'Cloudflare DNS (1.1.1.1)',
      provider: 'Cloudflare',
      endpointUrl: 'https://cloudflare-dns.com/dns-query',
      acceptHeader: 'application/dns-json',
      primaryIpv4: '1.1.1.1',
      secondaryIpv4: '1.0.0.1',
      website: 'https://1.1.1.1'
    },
    {
      id: 'google',
      name: 'Google Public DNS (8.8.8.8)',
      provider: 'Google',
      endpointUrl: 'https://dns.google/resolve',
      primaryIpv4: '8.8.8.8',
      secondaryIpv4: '8.8.4.4',
      website: 'https://developers.google.com/speed/public-dns'
    }
  ] as DohResolver[]
};

// Unit test assertions for network utilities
// Verified with standard RFC definitions (RFC 1918, RFC 3927, RFC 6598, RFC 5737, RFC 1035, RFC 8484)

import {
  parseAndValidateIp,
  validateAndNormalizeDomain,
  calculateMean,
  calculateMedian,
  calculateJitter,
  calculateMinMax,
  bpsToMbps,
  parseDnsRecordItem,
  getDnsStatusInfo
} from './networkUtils';

export function runNetworkUnitTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, desc: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(`Assertion failed: ${desc}`);
    }
  }

  // 1. IP Validation Tests
  const v4Public = parseAndValidateIp('1.1.1.1');
  assert(v4Public.isValid === true && v4Public.version === 4 && v4Public.isPrivate === false, '1.1.1.1 is public IPv4');

  const v4Private10 = parseAndValidateIp('10.0.0.1');
  assert(v4Private10.isValid === true && v4Private10.isPrivate === true, '10.0.0.1 is RFC 1918 private IPv4');

  const v4Private192 = parseAndValidateIp('192.168.1.1');
  assert(v4Private192.isValid === true && v4Private192.isPrivate === true, '192.168.1.1 is RFC 1918 private IPv4');

  const v4Loopback = parseAndValidateIp('127.0.0.1');
  assert(v4Loopback.isValid === true && v4Loopback.isLoopback === true, '127.0.0.1 is Loopback IPv4');

  const v4Cgnat = parseAndValidateIp('100.64.0.5');
  assert(v4Cgnat.isValid === true && v4Cgnat.isCgnat === true, '100.64.0.5 is CGNAT IPv4 (RFC 6598)');

  const v4LinkLocal = parseAndValidateIp('169.254.1.1');
  assert(v4LinkLocal.isValid === true && v4LinkLocal.isLinkLocal === true, '169.254.1.1 is Link-Local (RFC 3927)');

  const v6Public = parseAndValidateIp('2606:4700:4700::1111');
  assert(v6Public.isValid === true && v6Public.version === 6 && v6Public.isPrivate === false, '2606:4700:4700::1111 is public IPv6');

  const v6Loopback = parseAndValidateIp('::1');
  assert(v6Loopback.isValid === true && v6Loopback.isLoopback === true, '::1 is loopback IPv6');

  const invalidIp = parseAndValidateIp('999.999.999.999');
  assert(invalidIp.isValid === false, '999.999.999.999 is invalid');

  // 2. Domain Validation & IDN Punycode Tests
  const dom1 = validateAndNormalizeDomain('example.com');
  assert(dom1.isValid === true && dom1.punycodeDomain === 'example.com', 'example.com is valid');

  const domUrl = validateAndNormalizeDomain('https://sub.example.com/some/path?query=1');
  assert(domUrl.isValid === true && domUrl.cleanDomain === 'sub.example.com', 'strips https and path');

  const domIp = validateAndNormalizeDomain('192.168.1.1');
  assert(domIp.isValid === false, 'rejects raw IP entered as domain');

  // 3. Statistical Calculations Tests
  const samples = [20, 25, 30, 20, 40];
  const mean = calculateMean(samples);
  assert(mean === 27, `calculateMean expected 27, got ${mean}`);

  const median = calculateMedian(samples);
  assert(median === 25, `calculateMedian expected 25, got ${median}`);

  const minMax = calculateMinMax(samples);
  assert(minMax.min === 20 && minMax.max === 40, 'calculateMinMax gives min 20 max 40');

  // Jitter between consecutive: |25-20|=5, |30-25|=5, |20-30|=10, |40-20|=20 -> mean = 40/4 = 10
  const jitter = calculateJitter(samples);
  assert(jitter === 10, `calculateJitter expected 10, got ${jitter}`);

  // Bandwidth conversion
  const mbps = bpsToMbps(100000000); // 100,000,000 bps = 100 Mbps
  assert(mbps === 100, `bpsToMbps expected 100, got ${mbps}`);

  // 4. DNS Record Parser Tests
  const mxRecord = parseDnsRecordItem({
    name: 'example.com.',
    type: 15, // MX
    TTL: 300,
    data: '10 mail.example.com.'
  });
  assert(mxRecord.typeName === 'MX', 'MX record typeName identified');
  assert(mxRecord.details?.priority === 10, 'MX priority parsed as 10');
  assert(mxRecord.details?.exchange === 'mail.example.com', 'trailing dot removed from exchange');

  const txtRecord = parseDnsRecordItem({
    name: 'example.com.',
    type: 16, // TXT
    TTL: 600,
    data: '"v=spf1 include:_spf.google.com ~all"'
  });
  assert(txtRecord.typeName === 'TXT', 'TXT record identified');
  assert(txtRecord.data === 'v=spf1 include:_spf.google.com ~all', 'quotes stripped from TXT');

  const statusInfo = getDnsStatusInfo(0);
  assert(statusInfo.code === 'NOERROR', 'DNS code 0 is NOERROR');

  const nxdomain = getDnsStatusInfo(3);
  assert(nxdomain.code === 'NXDOMAIN', 'DNS code 3 is NXDOMAIN');

  return { passed, failed, errors };
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('networkUtils.test')) {
  const result = runNetworkUnitTests();
  console.log(`Network unit tests: ${result.passed} passed, ${result.failed} failed.`);
  if (result.errors.length > 0) {
    console.error(result.errors);
    process.exit(1);
  }
}

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Network, Copy, Check, Download, AlertCircle, Info, HelpCircle, 
  Settings, Sliders, FileText, Database, Plus, Trash2, Layers, 
  ChevronRight, RefreshCw, Share2, Binary, ShieldAlert
} from 'lucide-react';

type DesignationType = 'Private' | 'Public' | 'Loopback' | 'Link-Local' | 'Carrier-Grade NAT' | 'Multicast' | 'Experimental' | 'Unknown';

// Standard subnet CIDR masks list for dropdown
const SUBNET_MASKS = [
  { prefix: 32, mask: '255.255.255.255', wildcard: '0.0.0.0', hosts: 1, usable: 1 },
  { prefix: 31, mask: '255.255.255.254', wildcard: '0.0.0.1', hosts: 2, usable: 2 }, // Point-to-Point (RFC 3021)
  { prefix: 30, mask: '255.255.255.252', wildcard: '0.0.0.3', hosts: 4, usable: 2 },
  { prefix: 29, mask: '255.255.255.248', wildcard: '0.0.0.7', hosts: 8, usable: 6 },
  { prefix: 28, mask: '255.255.255.240', wildcard: '0.0.0.15', hosts: 16, usable: 14 },
  { prefix: 27, mask: '255.255.255.224', wildcard: '0.0.0.31', hosts: 32, usable: 30 },
  { prefix: 26, mask: '255.255.255.192', wildcard: '0.0.0.63', hosts: 64, usable: 62 },
  { prefix: 25, mask: '255.255.255.128', wildcard: '0.0.0.127', hosts: 128, usable: 126 },
  { prefix: 24, mask: '255.255.255.0', wildcard: '0.0.0.255', hosts: 256, usable: 254 },
  { prefix: 23, mask: '255.255.254.0', wildcard: '0.0.1.255', hosts: 512, usable: 510 },
  { prefix: 22, mask: '255.255.252.0', wildcard: '0.0.3.255', hosts: 1024, usable: 1022 },
  { prefix: 21, mask: '255.255.248.0', wildcard: '0.0.7.255', hosts: 2048, usable: 2046 },
  { prefix: 20, mask: '255.255.240.0', wildcard: '0.0.15.255', hosts: 4096, usable: 4094 },
  { prefix: 19, mask: '255.255.224.0', wildcard: '0.0.31.255', hosts: 8192, usable: 8190 },
  { prefix: 18, mask: '255.255.192.0', wildcard: '0.0.63.255', hosts: 16384, usable: 16382 },
  { prefix: 17, mask: '255.255.128.0', wildcard: '0.0.127.255', hosts: 32768, usable: 32766 },
  { prefix: 16, mask: '255.255.0.0', wildcard: '0.0.255.255', hosts: 65536, usable: 65534 },
  { prefix: 15, mask: '255.254.0.0', wildcard: '0.1.255.255', hosts: 131072, usable: 131070 },
  { prefix: 14, mask: '255.252.0.0', wildcard: '0.3.255.255', hosts: 262144, usable: 262142 },
  { prefix: 13, mask: '255.248.0.0', wildcard: '0.7.255.255', hosts: 524288, usable: 524286 },
  { prefix: 12, mask: '255.240.0.0', wildcard: '0.15.255.255', hosts: 1048576, usable: 1048574 },
  { prefix: 11, mask: '255.224.0.0', wildcard: '0.31.255.255', hosts: 2097152, usable: 2097150 },
  { prefix: 10, mask: '255.192.0.0', wildcard: '0.63.255.255', hosts: 4194304, usable: 4194302 },
  { prefix: 9, mask: '255.128.0.0', wildcard: '0.127.255.255', hosts: 8388608, usable: 8388606 },
  { prefix: 8, mask: '255.0.0.0', wildcard: '0.255.255.255', hosts: 16777216, usable: 16777214 },
  { prefix: 7, mask: '254.0.0.0', wildcard: '1.255.255.255', hosts: 33554432, usable: 33554430 },
  { prefix: 6, mask: '252.0.0.0', wildcard: '3.255.255.255', hosts: 67108864, usable: 67108862 },
  { prefix: 5, mask: '248.0.0.0', wildcard: '7.255.255.255', hosts: 134217728, usable: 134217726 },
  { prefix: 4, mask: '240.0.0.0', wildcard: '15.255.255.255', hosts: 268435456, usable: 268435454 },
  { prefix: 3, mask: '224.0.0.0', wildcard: '31.255.255.255', hosts: 536870912, usable: 536870910 },
  { prefix: 2, mask: '192.0.0.0', wildcard: '63.255.255.255', hosts: 1073741824, usable: 1073741822 },
  { prefix: 1, mask: '128.0.0.0', wildcard: '127.255.255.255', hosts: 2147483648, usable: 2147483646 },
  { prefix: 0, mask: '0.0.0.0', wildcard: '255.255.255.255', hosts: 4294967296, usable: 4294967294 }
];

export default function SubnetCalculator() {
  const [ipInput, setIpInput] = useState<string>('192.168.1.1');
  const [prefix, setPrefix] = useState<number>(24);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Subnet Planner inputs
  const [plannerSubnetCount, setPlannerSubnetCount] = useState<number>(4);

  // Parse IP Octets
  const octets = useMemo(() => {
    const parts = ipInput.split('.').map(p => parseInt(p, 10));
    return parts;
  }, [ipInput]);

  // Validate IP and generate issues if any
  const validationError = useMemo(() => {
    if (!ipInput.trim()) return 'IP address is required';
    const regex = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
    const match = ipInput.match(regex);
    if (!match) return 'Invalid IPv4 address format. Must be 4 octets separated by dots (e.g. 192.168.1.1)';
    
    for (let i = 1; i <= 4; i++) {
      const val = parseInt(match[i], 10);
      if (isNaN(val) || val < 0 || val > 255) {
        return `Octet ${i} (${match[i]}) is out of bounds. Each octet must be between 0 and 255.`;
      }
    }
    return null;
  }, [ipInput]);

  // Helper conversions
  const ipToLong = (octs: number[]): number => {
    if (octs.length !== 4) return 0;
    return ((octs[0] * 16777216) + (octs[1] * 65536) + (octs[2] * 256) + octs[3]) >>> 0;
  };

  const longToIp = (num: number): string => {
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255
    ].join('.');
  };

  // Main calculation hook
  const calcResults = useMemo(() => {
    if (validationError || octets.length !== 4) return null;

    const ipLong = ipToLong(octets);

    // Calculate mask
    let maskLong = 0;
    for (let i = 0; i < prefix; i++) {
      maskLong += Math.pow(2, 32 - 1 - i);
    }
    maskLong = maskLong >>> 0;

    const wildcardLong = (~maskLong) >>> 0;
    const networkLong = (ipLong & maskLong) >>> 0;
    const broadcastLong = (networkLong + wildcardLong) >>> 0;

    const totalHosts = Math.pow(2, 32 - prefix);
    
    // Usable hosts formulas
    let usableHosts = 0;
    if (prefix === 32) usableHosts = 1;
    else if (prefix === 31) usableHosts = 2;
    else usableHosts = totalHosts - 2;

    const firstUsableLong = prefix >= 31 ? networkLong : networkLong + 1;
    const lastUsableLong = prefix >= 31 ? broadcastLong : broadcastLong - 1;

    // Detect IP Class
    const firstOctet = octets[0];
    let ipClass = 'Unknown';
    if (firstOctet >= 1 && firstOctet <= 126) ipClass = 'Class A';
    else if (firstOctet === 127) ipClass = 'Class A (Loopback)';
    else if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'Class B';
    else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'Class C';
    else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'Class D (Multicast)';
    else if (firstOctet >= 240 && firstOctet <= 255) ipClass = 'Class E (Experimental)';

    // Detect Designation Type
    let designation: DesignationType = 'Public';
    if (firstOctet === 10) {
      designation = 'Private';
    } else if (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) {
      designation = 'Private';
    } else if (firstOctet === 192 && octets[1] === 168) {
      designation = 'Private';
    } else if (firstOctet === 127) {
      designation = 'Loopback';
    } else if (firstOctet === 169 && octets[1] === 254) {
      designation = 'Link-Local';
    } else if (firstOctet === 100 && octets[1] >= 64 && octets[1] <= 127) {
      designation = 'Carrier-Grade NAT';
    } else if (firstOctet >= 224 && firstOctet <= 239) {
      designation = 'Multicast';
    } else if (firstOctet >= 240 && firstOctet <= 255) {
      designation = 'Experimental';
    }

    return {
      ip: ipInput,
      prefix,
      ipClass,
      designation,
      network: longToIp(networkLong),
      broadcast: longToIp(broadcastLong),
      mask: longToIp(maskLong),
      wildcard: longToIp(wildcardLong),
      firstUsable: longToIp(firstUsableLong),
      lastUsable: longToIp(lastUsableLong),
      totalHosts,
      usableHosts,
      ipBinary: ipLong.toString(2).padStart(32, '0'),
      maskBinary: maskLong.toString(2).padStart(32, '0'),
      wildcardBinary: wildcardLong.toString(2).padStart(32, '0'),
      networkLong,
      wildcardLong
    };
  }, [octets, prefix, ipInput, validationError]);

  // Calculate split planner list
  const plannedSubnets = useMemo(() => {
    if (!calcResults) return [];
    
    // Choose the number of bits to borrow. e.g. count of 2 -> 1 bit, 4 -> 2 bits, 8 -> 3 bits, etc.
    const requestedCount = Math.max(1, Math.min(128, plannerSubnetCount));
    const borrowedBits = Math.ceil(Math.log2(requestedCount));
    const targetPrefix = prefix + borrowedBits;

    if (targetPrefix > 32) return [];

    const baseNetworkLong = calcResults.networkLong;
    const subnets = [];
    const size = Math.pow(2, 32 - targetPrefix);

    for (let i = 0; i < requestedCount; i++) {
      const subNetLong = baseNetworkLong + i * size;
      const subWildcardLong = size - 1;
      const subBroadcastLong = subNetLong + subWildcardLong;

      let subUsable = 0;
      if (targetPrefix === 32) subUsable = 1;
      else if (targetPrefix === 31) subUsable = 2;
      else subUsable = size - 2;

      const subFirstUsableLong = targetPrefix >= 31 ? subNetLong : subNetLong + 1;
      const subLastUsableLong = targetPrefix >= 31 ? subBroadcastLong : subBroadcastLong - 1;

      subnets.push({
        index: i + 1,
        network: longToIp(subNetLong),
        broadcast: longToIp(subBroadcastLong),
        prefix: targetPrefix,
        mask: longToIp((~subWildcardLong) >>> 0),
        firstUsable: longToIp(subFirstUsableLong),
        lastUsable: longToIp(subLastUsableLong),
        usableHosts: subUsable
      });
    }

    return subnets;
  }, [calcResults, prefix, plannerSubnetCount]);

  // Handle clipboard copy
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  // Handle exporting details to a beautiful text block or JSON file
  const handleExportData = () => {
    if (!calcResults) return;
    const content = JSON.stringify({
      input: { ip: ipInput, prefix },
      results: {
        ipClass: calcResults.ipClass,
        designation: calcResults.designation,
        networkAddress: calcResults.network,
        subnetMask: calcResults.mask,
        wildcardMask: calcResults.wildcard,
        broadcastAddress: calcResults.broadcast,
        firstUsableHost: calcResults.firstUsable,
        lastUsableHost: calcResults.lastUsable,
        totalHostsCount: calcResults.totalHosts,
        usableHostsCount: calcResults.usableHosts,
      }
    }, null, 2);

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subnet-calculation-${calcResults.network}-${prefix}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Fast selection preset CIDR values
  const handlePresetSelect = (prefixVal: number) => {
    setPrefix(prefixVal);
  };

  // Helper to split binary values into 8-bit blocks
  const chunkBinaryString = (bin: string) => {
    if (!bin) return [];
    return bin.match(/.{1,8}/g) || [];
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-500 uppercase">Network Engineer Toolbox</span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans flex items-center gap-2">
            <Network className="w-6 h-6 text-emerald-400" />
            Subnet CIDR Calculator
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Interactive visual IPv4 subnet calculations, binary bit dissection, wildcard masks, and hierarchical subnet planners.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Input Parameters panel (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              IP & Netmask Inputs
            </span>

            {/* IP Address Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">IPv4 Address</label>
                {validationError ? (
                  <span className="text-[10px] text-red-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Error
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Valid IPv4
                  </span>
                )}
              </div>
              <input
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="e.g. 192.168.1.1"
                className={`w-full bg-zinc-900 border ${
                  validationError ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-emerald-600'
                } rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none transition-all`}
              />
            </div>

            {/* CIDR Mask Selector Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">CIDR Prefix</label>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">/{prefix}</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={prefix}
                onChange={(e) => setPrefix(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                <span>/0 (Internet)</span>
                <span>/16</span>
                <span>/24 (LAN)</span>
                <span>/32 (Host)</span>
              </div>
            </div>

            {/* Subnet Mask select dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-400 uppercase">Subnet Mask Dropdown</label>
              <select
                value={prefix}
                onChange={(e) => setPrefix(parseInt(e.target.value, 10))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-600 font-mono transition-all"
              >
                {SUBNET_MASKS.map((m) => (
                  <option key={m.prefix} value={m.prefix}>
                    {m.mask} (/{m.prefix})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Presets shortcuts */}
            <div className="space-y-2 pt-2 border-t border-zinc-900/60">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block">Common LAN / WAN Sizes</label>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[30, 29, 28, 24, 16, 8].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetSelect(preset)}
                    className={`py-1 text-[11px] font-mono rounded border transition-all ${
                      prefix === preset 
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 font-bold' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    /{preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Banner if IP layout is wrong */}
          {validationError && (
            <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-red-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-bold">Invalid Network Target</p>
                <p className="opacity-80 mt-0.5">{validationError}</p>
              </div>
            </div>
          )}

          {/* Quick Informational / Help panel */}
          {calcResults && (
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                IP Class & Designation
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-900">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Network Class</span>
                  <p className="text-white font-bold mt-0.5">{calcResults.ipClass}</p>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-900">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Designation</span>
                  <p className={`font-bold mt-0.5 ${
                    calcResults.designation === 'Private' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{calcResults.designation}</p>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                {calcResults.designation === 'Private' ? (
                  'This belongs to an RFC 1918 Private IP range. It cannot be routed on the public internet directly.'
                ) : calcResults.designation === 'Loopback' ? (
                  'This is used for local host loopbacks and host diagnostic communication.'
                ) : (
                  'This is a public space IP address suitable for global routing and host assignments.'
                )}
              </p>
            </div>
          )}
        </div>

        {/* Detailed Results Workspaces (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main calculated results matrix */}
          {calcResults ? (
            <div className="space-y-6">
              
              {/* Main Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 relative group">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Network Address</span>
                  <p className="text-sm font-bold text-white font-mono mt-1">{calcResults.network}</p>
                  <button 
                    onClick={() => handleCopy(calcResults.network, 'network')}
                    className="absolute right-3 top-3 text-zinc-600 hover:text-white transition-colors"
                  >
                    {copiedField === 'network' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 relative group">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Broadcast IP</span>
                  <p className="text-sm font-bold text-white font-mono mt-1">{calcResults.broadcast}</p>
                  <button 
                    onClick={() => handleCopy(calcResults.broadcast, 'broadcast')}
                    className="absolute right-3 top-3 text-zinc-600 hover:text-white transition-colors"
                  >
                    {copiedField === 'broadcast' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 relative group">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Usable Hosts Range</span>
                  <p className="text-[11px] font-bold text-emerald-400 font-mono mt-1 truncate">
                    {calcResults.firstUsable} - {calcResults.lastUsable}
                  </p>
                  <button 
                    onClick={() => handleCopy(`${calcResults.firstUsable} - ${calcResults.lastUsable}`, 'range')}
                    className="absolute right-3 top-3 text-zinc-600 hover:text-white transition-colors"
                  >
                    {copiedField === 'range' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Usable IP count</span>
                  <p className="text-sm font-extrabold text-white font-mono mt-1">
                    {calcResults.usableHosts.toLocaleString()} <span className="text-zinc-500 text-[10px] font-normal">hosts</span>
                  </p>
                </div>

              </div>

              {/* Comprehensive visual list values */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-5 py-4 bg-zinc-900/20 border-b border-zinc-900 flex justify-between items-center">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    Subnet Calculation Breakdown
                  </span>
                  
                  <button
                    onClick={handleExportData}
                    className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Export JSON
                  </button>
                </div>

                <div className="divide-y divide-zinc-900 text-xs">
                  {/* Row IP Input CIDR */}
                  <div className="grid grid-cols-12 p-4 items-center">
                    <div className="col-span-4 text-zinc-400 font-medium font-sans">Full CIDR String</div>
                    <div className="col-span-8 flex items-center gap-2">
                      <span className="font-mono text-white text-sm font-extrabold">{calcResults.ip}/{calcResults.prefix}</span>
                      <button 
                        onClick={() => handleCopy(`${calcResults.ip}/${calcResults.prefix}`, 'cidr')}
                        className="text-zinc-600 hover:text-white transition-colors"
                      >
                        {copiedField === 'cidr' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Row Subnet Mask */}
                  <div className="grid grid-cols-12 p-4 items-center">
                    <div className="col-span-4 text-zinc-400 font-medium font-sans">Subnet Mask</div>
                    <div className="col-span-8 flex items-center gap-2">
                      <span className="font-mono text-white font-semibold">{calcResults.mask}</span>
                      <button 
                        onClick={() => handleCopy(calcResults.mask, 'mask')}
                        className="text-zinc-600 hover:text-white transition-colors"
                      >
                        {copiedField === 'mask' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Row Wildcard Mask */}
                  <div className="grid grid-cols-12 p-4 items-center">
                    <div className="col-span-4 text-zinc-400 font-medium font-sans">Wildcard Mask</div>
                    <div className="col-span-8 flex items-center gap-2">
                      <span className="font-mono text-white font-semibold">{calcResults.wildcard}</span>
                      <button 
                        onClick={() => handleCopy(calcResults.wildcard, 'wildcard')}
                        className="text-zinc-600 hover:text-white transition-colors"
                      >
                        {copiedField === 'wildcard' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Row Total Hosts */}
                  <div className="grid grid-cols-12 p-4 items-center">
                    <div className="col-span-4 text-zinc-400 font-medium font-sans">Total Address Size</div>
                    <div className="col-span-8">
                      <span className="font-mono text-white font-semibold">{calcResults.totalHosts.toLocaleString()} addresses</span>
                      <span className="text-[10px] text-zinc-500 font-mono ml-2">(2^{32 - calcResults.prefix})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Binary Bit Representation Field (Highly helpful for visual parsing) */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 shadow-xl space-y-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-emerald-400" />
                  32-Bit Binary Bitmask Visualization
                </span>

                <div className="space-y-3 font-mono text-xs">
                  {/* IP address binary row */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>IP Binary octets</span>
                      <span className="text-zinc-400">{calcResults.ip}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {chunkBinaryString(calcResults.ipBinary).map((chunk, idx) => (
                        <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white flex gap-0.5">
                          {chunk.split('').map((bit, bitIdx) => {
                            const globalBitIdx = idx * 8 + bitIdx;
                            const isNetwork = globalBitIdx < prefix;
                            return (
                              <span 
                                key={bitIdx} 
                                className={`${isNetwork ? 'text-emerald-400 font-bold' : 'text-amber-500'}`}
                                title={`${isNetwork ? 'Network Bit' : 'Host Bit'}`}
                              >
                                {bit}
                              </span>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mask binary row */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>Subnet Mask octets</span>
                      <span className="text-zinc-400">{calcResults.mask}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {chunkBinaryString(calcResults.maskBinary).map((chunk, idx) => (
                        <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-400 flex gap-0.5">
                          {chunk.split('').map((bit, bitIdx) => {
                            const globalBitIdx = idx * 8 + bitIdx;
                            const isNetwork = globalBitIdx < prefix;
                            return (
                              <span 
                                key={bitIdx} 
                                className={isNetwork ? 'text-emerald-500 font-bold' : 'text-zinc-600'}
                              >
                                {bit}
                              </span>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend explanation */}
                  <div className="flex gap-4 text-[10px] text-zinc-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500/50 rounded" />
                      <span>Network Bits ({prefix})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 bg-amber-500/20 border border-amber-500/50 rounded" />
                      <span>Host Bits ({32 - prefix})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subnet Planner tab section */}
              {prefix < 32 && (
                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        Interactive Subnet Splitter & Planner
                      </span>
                      <p className="text-[10px] text-zinc-500">Plan divisions of the parent network range into distinct sub-segment zones.</p>
                    </div>

                    {/* Choose target counts */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase shrink-0">Split count:</span>
                      <select
                        value={plannerSubnetCount}
                        onChange={(e) => setPlannerSubnetCount(parseInt(e.target.value, 10))}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                      >
                        {[2, 4, 8, 16, 32, 64].map((cnt) => (
                          <option key={cnt} value={cnt}>
                            {cnt} subnets
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {plannedSubnets.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase font-bold">
                            <th className="pb-2.5 font-sans">#</th>
                            <th className="pb-2.5">Subnet Range</th>
                            <th className="pb-2.5">Prefix / Mask</th>
                            <th className="pb-2.5">Usable Host Limits</th>
                            <th className="pb-2.5 font-sans text-right">Host Size</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                          {plannedSubnets.map((sub) => (
                            <tr key={sub.index} className="hover:bg-zinc-900/20 transition-all">
                              <td className="py-2.5 pr-2 text-[10px] text-zinc-600 font-sans font-bold">{sub.index}</td>
                              <td className="py-2.5 font-semibold text-white">
                                {sub.network} <span className="text-zinc-600 font-normal">→</span> {sub.broadcast}
                              </td>
                              <td className="py-2.5 text-zinc-400">
                                <span className="text-emerald-400 font-bold">/{sub.prefix}</span> 
                                <span className="text-[10px] text-zinc-500 block">{sub.mask}</span>
                              </td>
                              <td className="py-2.5 text-zinc-400 text-[11px]">
                                {sub.firstUsable} <span className="text-zinc-600 font-normal">to</span> {sub.lastUsable}
                              </td>
                              <td className="py-2.5 text-right font-bold text-white font-sans text-[11px]">
                                {sub.usableHosts.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-600 italic">Target prefix exceeds 32 bits. Scale back parent subnet size to plan child splinters.</p>
                  )}
                </div>
              )}

              {/* Static IPv4 Reference Cheat Sheet */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 shadow-xl space-y-3.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  CIDR Cheat Sheet Reference
                </span>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                  Quick lookup for standard subnet capacities. Click any row to apply its prefix mask to your current calculation instantly.
                </p>

                <div className="max-h-[300px] overflow-y-auto border border-zinc-900 rounded-xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-900/40 sticky top-0 border-b border-zinc-900 text-[9px] text-zinc-500 uppercase font-bold">
                      <tr>
                        <th className="p-3">Prefix</th>
                        <th className="p-3">Subnet Mask</th>
                        <th className="p-3">Total IPs</th>
                        <th className="p-3 text-right">Usable Hosts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-zinc-400">
                      {SUBNET_MASKS.map((item) => (
                        <tr 
                          key={item.prefix}
                          onClick={() => setPrefix(item.prefix)}
                          className={`cursor-pointer hover:bg-zinc-900/50 transition-colors ${
                            prefix === item.prefix ? 'bg-emerald-950/20 text-emerald-300' : ''
                          }`}
                        >
                          <td className="p-3 font-extrabold text-white">/{item.prefix}</td>
                          <td className="p-3 font-semibold">{item.mask}</td>
                          <td className="p-3">{item.hosts.toLocaleString()}</td>
                          <td className="p-3 text-right font-semibold text-white">{item.usable.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 text-zinc-500">
              <Network className="w-12 h-12 text-zinc-800 animate-pulse" />
              <p className="text-sm">Please correct the IPv4 network format on the left to review metrics.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

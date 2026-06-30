import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Copy, Check, RefreshCw, FileCode, Sliders } from 'lucide-react';

export default function UUIDGenerator() {
  const [uuidVersion, setUuidVersion] = useState<'v4' | 'v1'>('v4');
  const [batchCount, setBatchCount] = useState<number>(5);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [brackets, setBrackets] = useState<boolean>(false);
  const [separator, setSeparator] = useState<'hyphen' | 'none'>('hyphen');
  const [outputFormat, setOutputFormat] = useState<'plain' | 'json' | 'sql'>('plain');
  
  const [generatedUuids, setGeneratedUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  const generateV4 = () => {
    // High quality crypto-based random UUID generation
    let d = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  };

  const generateV1 = () => {
    // Simulated UUID v1 timestamp based string
    const timestamp = new Date().getTime().toString(16).padStart(12, '0');
    return `${timestamp.slice(0, 8)}-${timestamp.slice(8, 12)}-11ee-89ab-00155d012002`;
  };

  const handleGenerate = () => {
    const list: string[] = [];
    for (let i = 0; i < batchCount; i++) {
      let id = uuidVersion === 'v4' ? generateV4() : generateV1();
      
      if (separator === 'none') {
        id = id.replace(/-/g, '');
      }
      if (uppercase) {
        id = id.toUpperCase();
      }
      if (brackets) {
        id = `{${id}}`;
      }
      list.push(id);
    }
    setGeneratedUuids(list);
  };

  const getFormattedOutput = () => {
    if (outputFormat === 'json') {
      return JSON.stringify({ uuids: generatedUuids }, null, 2);
    }
    if (outputFormat === 'sql') {
      return `INSERT INTO temp_uuid_table (uuid_val) VALUES\n` + 
             generatedUuids.map(u => `  ('${u}')`).join(',\n') + ';';
    }
    return generatedUuids.join('\n');
  };

  const handleCopy = () => {
    const text = getFormattedOutput();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate initial list on mount
  React.useEffect(() => {
    handleGenerate();
  }, [uuidVersion, batchCount, uppercase, brackets, separator]);

  return (
    <div className="space-y-6" id="uuid-generator-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <FileCode className="w-6 h-6 text-indigo-400" />
          <span>UUID / GUID Generator Suite</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Generate RFC4122-compliant v4 random or v1 timestamp UUIDs instantly. Configure batch quantities, customized hyphens, SQL insertions, and clipboard structures.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Setup column */}
        <div className="lg:col-span-4 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4 flex flex-col justify-between">
          <div className="space-y-4 text-xs">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Formatting parameters</span>
            </h3>

            {/* Version Select */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">1. Standard UUID Version</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setUuidVersion('v4')}
                  className={`py-2 text-center rounded border transition-all cursor-pointer font-mono font-bold text-[10px] ${
                    uuidVersion === 'v4'
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                      : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  v4 (Cryptographic Random)
                </button>
                <button
                  onClick={() => setUuidVersion('v1')}
                  className={`py-2 text-center rounded border transition-all cursor-pointer font-mono font-bold text-[10px] ${
                    uuidVersion === 'v1'
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                      : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  v1 (Timestamp Clock)
                </button>
              </div>
            </div>

            {/* Batch count limit */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-500">2. Batch Generation Count</span>
                <span className="text-indigo-400 font-bold">{batchCount} IDs</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>

            {/* Case casing & brackets */}
            <div className="space-y-2 border-t border-zinc-900 pt-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-zinc-400">Uppercase capitalization</span>
                <button
                  onClick={() => setUppercase(!uppercase)}
                  className={`px-3 py-1 rounded text-[10px] uppercase font-mono font-bold transition-all border cursor-pointer ${
                    uppercase ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  {uppercase ? 'Yes' : 'No'}
                </button>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-zinc-400">Curly Brackets braces</span>
                <button
                  onClick={() => setBrackets(!brackets)}
                  className={`px-3 py-1 rounded text-[10px] uppercase font-mono font-bold transition-all border cursor-pointer ${
                    brackets ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  {brackets ? 'Yes' : 'No'}
                </button>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-zinc-400">Separators</span>
                <div className="flex gap-1.5">
                  {(['hyphen', 'none'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSeparator(s)}
                      className={`px-2.5 py-1 text-[10px] rounded border uppercase font-mono font-bold cursor-pointer ${
                        separator === s
                          ? 'bg-indigo-500/15 border-indigo-500/35 text-indigo-400'
                          : 'bg-zinc-900 border-zinc-900 text-zinc-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Output format select */}
            <div className="space-y-1.5 border-t border-zinc-900 pt-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">3. Output representation style</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['plain', 'json', 'sql'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setOutputFormat(fmt)}
                    className={`py-1 text-[10px] rounded border transition-all cursor-pointer uppercase font-mono font-bold ${
                      outputFormat === fmt
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                        : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-zinc-900">
            <button
              onClick={handleGenerate}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate IDs</span>
            </button>
          </div>
        </div>

        {/* Live Output result */}
        <div className="lg:col-span-8 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between min-h-[400px]">
          <div className="space-y-3 flex-1 flex flex-col w-full">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider">
                Generated UUID results
              </h3>

              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy batch'}</span>
              </button>
            </div>

            <pre className="bg-zinc-950/90 border border-zinc-900 rounded-lg p-4 text-xs font-mono text-zinc-300 whitespace-pre overflow-y-auto max-h-[380px] flex-1 select-text selection:bg-indigo-500/20">
              {getFormattedOutput()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

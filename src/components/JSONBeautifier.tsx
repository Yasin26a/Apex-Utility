import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Braces, Terminal, CheckCircle2, AlertTriangle, Play, Trash2, HelpCircle, ChevronDown, Check, Cpu } from 'lucide-react';
import { JSONBeautifierState } from '../types';

export default function JSONBeautifier() {
  const [state, setState] = useState<JSONBeautifierState>({
    rawInput: '',
    beautifiedOutput: '',
    tabSize: 2,
    isValid: null,
    errorMessage: null,
  });

  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true,
    1: false,
  });

  const [copied, setCopied] = useState(false);

  const testJSONSample = () => {
    const mockTelemetrySample = {
      system_core: "APEX UTILITY Forge",
      connection: {
        node_id: "785861104867",
        sandbox_state: "isolated",
        wasm_layers_active: true,
        credentials: "noneRequired_localSandboxOnly"
      },
      supported_methods: [
        "PDF_ATS_COMPACTOR_v2",
        "CANVAS_WEBP_RASTER_v1",
        "DATA_JSON_FORMATTER_v3"
      ],
      metrics: {
        latency_ms: 1.25,
        server_cloud_sync: false
      }
    };
    
    setState(prev => ({
      ...prev,
      rawInput: JSON.stringify(mockTelemetrySample),
      beautifiedOutput: '',
      isValid: null,
      errorMessage: null,
    }));
  };

  const handleFormat = () => {
    if (!state.rawInput.trim()) {
      setState(prev => ({
        ...prev,
        isValid: false,
        errorMessage: 'Empty payload detected. Please feed raw unreadable JSON strings first.',
      }));
      return;
    }

    try {
      const parsed = JSON.parse(state.rawInput);
      const indentation = state.tabSize === 'tab' ? '\t' : state.tabSize;
      const formatted = JSON.stringify(parsed, null, indentation);

      setState(prev => ({
        ...prev,
        beautifiedOutput: formatted,
        isValid: true,
        errorMessage: null,
      }));
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        beautifiedOutput: '',
        isValid: false,
        errorMessage: e.message || 'Formatting array diagnostics failed. Check braces integrity.',
      }));
    }
  };

  const handleCopy = () => {
    if (!state.beautifiedOutput) return;
    navigator.clipboard.writeText(state.beautifiedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setState({
      rawInput: '',
      beautifiedOutput: '',
      tabSize: 2,
      isValid: null,
      errorMessage: null,
    });
  };

  const toggleFaq = (idx: number) => {
    setFaqOpen(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Structured query markdown schemas
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "APEX JSON Beautifier Core",
    "operatingSystem": "All Core Web Browsers",
    "applicationCategory": "DeveloperApplication",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    },
    "description": "High-fidelity Swiss-style Developer utility. Format unreadable json data tool, structural diagnostics compiler locally."
  };

  return (
    <div className="space-y-12">
      <script type="application/ld+json">
        {JSON.stringify(jsonLdSchema)}
      </script>

      {/* SEO Display Header Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-505/15 border border-indigo-500/25 text-indigo-400 text-xs font-mono font-bold uppercase">
          <Cpu className="w-3.5 h-3.5" />
          <span>Structural Validator Core Active</span>
        </div>
        <h1 className="font-heading text-3xl font-black text-white tracking-tight">
          Format Unreadable JSON Data Tool Online
        </h1>
        <p className="font-sans text-sm text-[#94a3b8] max-w-2xl leading-relaxed">
          The high-fidelity Swiss developer console. Clean, beautify, validate, and restructure unreadable or heavily compressed JSON telemetry payloads locally in-browser with zero upload risk.
        </p>
      </div>

      {/* Dual 3D Code Plates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* RAW INPUT WINDOW */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="beveled-panel p-5 flex-1 flex flex-col border-rose-950/20 bg-[#08080c]">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-500" />
                <span className="font-heading text-xs uppercase tracking-wide font-bold text-zinc-350">Raw Input Terminal</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={testJSONSample}
                  className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Load Sample
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-805 text-[10px] font-mono text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              value={state.rawInput}
              onChange={(e) => setState(prev => ({ ...prev, rawInput: e.target.value }))}
              placeholder='Paste unreadable minified arrays like {"system_core":"APEX_FORGE","connection":{"node_id":"78586"} ...}'
              className="w-full flex-1 min-h-[300px] bg-[#050507] border border-zinc-900 rounded p-4 font-mono text-xs text-zinc-300 focus:outline-none focus:border-rose-800 resize-none"
            />
          </div>
        </div>

        {/* RESTRUCTURED BEAUTIFIED OUTPUT */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="beveled-panel p-5 flex-1 flex flex-col border-rose-950/20 bg-[#08080c]">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="font-heading text-xs uppercase tracking-wide font-bold text-zinc-350">Restructured Output</span>
              </div>

              {state.beautifiedOutput && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Payload</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex-1 min-h-[300px] bg-[#050507] border border-zinc-900 rounded relative overflow-auto max-h-[450px]">
              {/* Output view with swiss line formatting */}
              {state.beautifiedOutput ? (
                <pre className="p-4 font-mono text-xs text-zinc-300 whitespace-pre overflow-x-auto leading-relaxed">
                  <code>{state.beautifiedOutput}</code>
                </pre>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-zinc-600 font-sans">
                  <Braces className="w-10 h-10 mb-2.5 text-zinc-800" />
                  <p className="text-xs max-w-xs">Beautified code will render inside this console plate after formatting passes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mechanics Control Dial Panel */}
      <div className="beveled-panel p-5 border-zinc-900 bg-[#07070a]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tab indent setting selector */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-heading text-[10px] uppercase font-bold text-zinc-450 tracking-wider">Spacing Indenture:</span>
          {[
            { label: '2 Spaces', val: 2 },
            { label: '4 Spaces', val: 4 },
            { label: 'Tab Shift', val: 'tab' }
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setState(prev => ({ ...prev, tabSize: item.val as any }))}
              className={`px-3 py-1.5 rounded font-mono text-[10px] border transition-all cursor-pointer ${
                state.tabSize === item.val
                  ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Validation indicator status and Run pass */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <AnimatePresence mode="wait">
            {state.isValid !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2"
              >
                {state.isValid ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-505/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>VALID JSON ARRAY</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-450 font-mono text-[10px] max-w-xs truncate">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{state.errorMessage || 'ARRAY INTEGRITY ERROR'}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleFormat}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-heading font-bold text-xs uppercase tracking-wide shadow-[0_4px_15px_rgba(225,29,72,0.2)] transition-all cursor-pointer text-center"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Format Data Code</span>
          </button>
        </div>
      </div>

      {/* Semantic FAQs regarding Formatting */}
      <section className="border-t border-rose-950/20 pt-12 space-y-8">
        <div className="max-w-3xl">
          <h2 className="font-heading text-2xl font-black text-white tracking-tight">
            Format Unreadable JSON Data Tool - Online Guides
          </h2>
          <p className="font-sans text-xs text-zinc-500 mt-2">
            Read comprehensive instructions on raw syntax formatting, telemetry arrays parsing, and diagnostics validations.
          </p>
        </div>

        <div className="max-w-3xl space-y-4">
          {[
            {
              q: "What makes this JSON beautifier different from typical online utilities?",
              a: "Standard online parsers upload your pasted dataset to server pipelines, exposing sensitive credentials or application codes to third-party databases. APEX JSON Beautifier Core processes 100% of the lexical parsing within your local browser's memory structures. No keys, secrets, or telemetries are transmitted."
            },
            {
              q: "Why does the parsing pass fail with an validation error?",
              a: "JSON structure expects strict syntax: double-quoted keys, commas separating properties without trailing commas at final items, and matching brackets/curls. Our parser runs standard JSON parse diagnostics to highlights unmatched structural characters immediately."
            }
          ].map((item, idx) => (
            <div key={idx} className="beveled-panel border-zinc-900 bg-zinc-950/40 overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 flex justify-between items-center text-left focus:outline-none transition-colors hover:bg-zinc-900/40"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4.5 h-4.5 text-zinc-400" />
                  <span className="font-heading text-xs font-semibold text-white tracking-wide">{item.q}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${faqOpen[idx] ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {faqOpen[idx] && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-zinc-900/60"
                  >
                    <div className="p-4 bg-zinc-950/80">
                      <p className="font-sans text-xs text-zinc-400 leading-relaxed font-normal">{item.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

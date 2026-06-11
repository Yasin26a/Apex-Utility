import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Braces, Terminal, CheckCircle2, AlertTriangle, Play, Trash2, HelpCircle, ChevronDown, Check, Cpu, FileJson, Layers, Settings, RefreshCw, XCircle } from 'lucide-react';
import { JSONBeautifierState } from '../types';
import Ajv from 'ajv';

export default function JSONBeautifier() {
  const [state, setState] = useState<JSONBeautifierState>({
    rawInput: '',
    beautifiedOutput: '',
    tabSize: 2,
    isValid: null,
    errorMessage: null,
  });

  // Schema Validation States
  const [isSchemaEnabled, setIsSchemaEnabled] = useState(false);
  const [schemaInput, setSchemaInput] = useState('');
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [schemaCopied, setSchemaCopied] = useState(false);

  // Active Sample Choice ('telemetry' or 'profile')
  const [activeSampleType, setActiveSampleType] = useState<'telemetry' | 'profile'>('telemetry');

  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true,
    1: false,
    2: false,
  });

  const [copied, setCopied] = useState(false);

  // Dual Complex Datasets for High-Fidelity Testing
  const SAMPLES = {
    telemetry: {
      payload: {
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
      },
      schema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        title: "ApexTelemetryPayload",
        type: "object",
        required: ["system_core", "connection", "supported_methods", "metrics"],
        additionalProperties: false,
        properties: {
          system_core: {
            type: "string",
            minLength: 3
          },
          connection: {
            type: "object",
            required: ["node_id", "sandbox_state", "wasm_layers_active"],
            properties: {
              node_id: { type: "string" },
              sandbox_state: { type: "string", enum: ["isolated", "federated", "production"] },
              wasm_layers_active: { type: "boolean" },
              credentials: { type: "string" }
            }
          },
          supported_methods: {
            type: "array",
            minItems: 1,
            items: { type: "string" }
          },
          metrics: {
            type: "object",
            required: ["latency_ms", "server_cloud_sync"],
            properties: {
              latency_ms: { type: "number", minimum: 0, maximum: 5000 },
              server_cloud_sync: { type: "boolean" }
            }
          }
        }
      }
    },
    profile: {
      payload: {
        client_id: "CLI-9042",
        name: "Evelyn Sterling",
        email: "evelyn@apexlabs.org",
        age: 31,
        roles: ["developer", "administrator"],
        security_clearance: {
          level: "L3",
          mfa_active: true
        }
      },
      schema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        title: "ApexClientProfile",
        type: "object",
        required: ["client_id", "name", "email", "age", "roles", "security_clearance"],
        additionalProperties: true,
        properties: {
          client_id: { 
            type: "string", 
            pattern: "^CLI-\\d+$" 
          },
          name: { 
            type: "string", 
            minLength: 2, 
            maxLength: 50 
          },
          email: { 
            type: "string", 
            pattern: "^\\S+@\\S+\\.\\S+$" 
          },
          age: { 
            type: "integer", 
            minimum: 18, 
            maximum: 120 
          },
          roles: {
            type: "array",
            minItems: 1,
            uniqueItems: true,
            items: { type: "string" }
          },
          security_clearance: {
            type: "object",
            required: ["level", "mfa_active"],
            properties: {
              level: { type: "string", enum: ["L1", "L2", "L3"] },
              mfa_active: { type: "boolean" }
            }
          }
        }
      }
    }
  };

  const handleLoadSample = (type: 'telemetry' | 'profile') => {
    setActiveSampleType(type);
    const chosen = SAMPLES[type];
    
    setState(prev => ({
      ...prev,
      rawInput: JSON.stringify(chosen.payload, null, 2),
      beautifiedOutput: '',
      isValid: null,
      errorMessage: null,
    }));

    if (isSchemaEnabled || !schemaInput) {
      setSchemaInput(JSON.stringify(chosen.schema, null, 2));
    }
    setSchemaError(null);
    setValidationErrors([]);
  };

  const handleFormat = () => {
    if (!state.rawInput.trim()) {
      setState(prev => ({
        ...prev,
        isValid: false,
        errorMessage: 'Empty payload detected. Please feed raw unreadable JSON strings first.',
      }));
      setValidationErrors([]);
      return;
    }

    try {
      // 1. Parse raw JSON Input syntax
      const parsedData = JSON.parse(state.rawInput);
      const indentation = state.tabSize === 'tab' ? '\t' : state.tabSize;
      const formatted = JSON.stringify(parsedData, null, indentation);

      // Handle Schema validation if enabled
      if (isSchemaEnabled && schemaInput.trim()) {
        try {
          // 2. Validate and parse schema itself
          const parsedSchema = JSON.parse(schemaInput);
          setSchemaError(null);

          // 3. Compliant Ajv Compilation & Inspection (with fallback for default ESM resolver quirks)
          const AjvConstructor = (Ajv as any).default || Ajv;
          const ajv = new AjvConstructor({ allErrors: true, verbose: true, strict: false });
          
          const validate = ajv.compile(parsedSchema);
          const valid = validate(parsedData);

          if (valid) {
            setState(prev => ({
              ...prev,
              beautifiedOutput: formatted,
              isValid: true,
              errorMessage: null,
            }));
            setValidationErrors([]);
          } else {
            setState(prev => ({
              ...prev,
              beautifiedOutput: formatted,
              isValid: false,
              errorMessage: `Schema check failed: ${validate.errors?.length || 1} discrepancy detected.`,
            }));
            setValidationErrors(validate.errors || []);
          }
        } catch (schemaEx: any) {
          setSchemaError(schemaEx.message || 'JSON Schema is not valid JSON format.');
          setState(prev => ({
            ...prev,
            beautifiedOutput: formatted,
            isValid: false,
            errorMessage: 'Configuration Error: Invalid JSON Schema syntax.',
          }));
          setValidationErrors([]);
        }
      } else {
        // No schema validation checked or schema is empty
        setState(prev => ({
          ...prev,
          beautifiedOutput: formatted,
          isValid: true,
          errorMessage: null,
        }));
        setValidationErrors([]);
      }
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        beautifiedOutput: '',
        isValid: false,
        errorMessage: e.message || 'Formatting array diagnostics failed. Check braces integrity.',
      }));
      setValidationErrors([]);
    }
  };

  const handleCopy = () => {
    if (!state.beautifiedOutput) return;
    navigator.clipboard.writeText(state.beautifiedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySchema = () => {
    if (!schemaInput) return;
    navigator.clipboard.writeText(schemaInput);
    setSchemaCopied(true);
    setTimeout(() => setSchemaCopied(false), 2000);
  };

  const handleClear = () => {
    setState({
      rawInput: '',
      beautifiedOutput: '',
      tabSize: 2,
      isValid: null,
      errorMessage: null,
    });
    setValidationErrors([]);
    setSchemaError(null);
  };

  const handleFormatSchema = () => {
    if (!schemaInput.trim()) return;
    try {
      const parsed = JSON.parse(schemaInput);
      setSchemaInput(JSON.stringify(parsed, null, 2));
      setSchemaError(null);
    } catch (err: any) {
      setSchemaError(`Schema JSON format error: ${err.message}`);
    }
  };

  const toggleFaq = (idx: number) => {
    setFaqOpen(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Structured query schema
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "APEX JSON Beautifier and Schema Validator Core",
    "operatingSystem": "All Core Web Browsers",
    "applicationCategory": "DeveloperApplication",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    },
    "description": "High-fidelity Swiss-style Developer utility. Format unreadable json data and validate using standard JSON Schema. Runs 100% locally with zero upload risk."
  };

  return (
    <div className="space-y-12">
      <script type="application/ld+json">
        {JSON.stringify(jsonLdSchema)}
      </script>

      {/* SEO Display Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-mono font-bold uppercase">
          <Cpu className="w-3.5 h-3.5" />
          <span>Structural Validator & Ajv Core Active</span>
        </div>
        <h1 className="font-heading text-3xl font-black text-white tracking-tight">
          Format Unreadable JSON Data & Schema Validator
        </h1>
        <p className="font-sans text-sm text-[#94a3b8] max-w-3xl leading-relaxed">
          The premium Swiss developer workstation. Beautify raw nested database packets, run instant structural validations, and enforce strict, fully-offline constraints using modern draft schemas backed by <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-rose-450 font-mono text-xs">ajv</code> compiler engines.
        </p>
      </div>

      {/* Interactive Feature Controller Bar */}
      <div className="beveled-panel p-5 border-zinc-900 bg-[#07070a]/65 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-zinc-200 font-heading text-xs uppercase tracking-wider font-bold">Workstation Mode Selection</h3>
          <p className="text-zinc-500 text-[11px] leading-relaxed max-w-xl">
            Toggle validation mechanics to check structure integrity side-by-side using Draft-07 syntax formats.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={() => {
              setIsSchemaEnabled(!isSchemaEnabled);
              // Pre-populate schema input corresponding to sample if it is empty
              if (!isSchemaEnabled && !schemaInput) {
                setSchemaInput(JSON.stringify(SAMPLES[activeSampleType].schema, null, 2));
              }
            }}
            className={`px-4 py-2 rounded font-heading text-xs uppercase font-extrabold tracking-wider border cursor-pointer transition-all duration-300 outline-none select-none flex items-center gap-2 ${
              isSchemaEnabled 
                ? 'bg-rose-500/10 border-rose-500 text-rose-400' 
                : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <Settings className={`w-3.5 h-3.5 ${isSchemaEnabled ? 'animate-spin-slow' : ''}`} />
            <span>{isSchemaEnabled ? 'JSON Schema Validations (ON)' : 'Plain Beautifier Mode'}</span>
          </button>
        </div>
      </div>

      {/* Sample Quick Load Blocks */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-heading text-[10px] uppercase font-bold text-zinc-450 tracking-wider">Test Sample Presets:</span>
        <button
          onClick={() => handleLoadSample('telemetry')}
          className={`px-3 py-1.5 rounded font-mono text-[10px] border transition-all cursor-pointer ${
            activeSampleType === 'telemetry' && state.rawInput
              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-450'
              : 'border-zinc-850 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          Telemetry Ingress Payload & Schema
        </button>
        <button
          onClick={() => handleLoadSample('profile')}
          className={`px-3 py-1.5 rounded font-mono text-[10px] border transition-all cursor-pointer ${
            activeSampleType === 'profile' && state.rawInput
              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-450'
              : 'border-zinc-850 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          User Identity clearance & Schema
        </button>
      </div>

      {/* Main Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* INPUT COLUMN (Left Pane) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* PAYLOAD EDITOR PANEL */}
          <div className="beveled-panel p-5 flex flex-col border-rose-950/20 bg-[#08080c] relative">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-500" />
                <span className="font-heading text-xs uppercase tracking-wide font-bold text-zinc-350">
                  Raw JSON Input Payload
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadSample(activeSampleType)}
                  className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  title="Reload current chosen sample payload"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Reload</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-805 text-[10px] font-mono text-zinc-550 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear Raw
                </button>
              </div>
            </div>

            <textarea
              value={state.rawInput}
              onChange={(e) => setState(prev => ({ ...prev, rawInput: e.target.value }))}
              placeholder='Paste raw unreadable JSON telemetry datasets or configuration arrays...'
              className="w-full h-[280px] bg-[#050507] border border-zinc-900 rounded p-4 font-mono text-xs text-zinc-300 focus:outline-none focus:border-rose-900 resize-none transition-colors"
            />
          </div>

          {/* DYNAMIC COLLAPSIBLE SCHEMA PANEL */}
          <AnimatePresence>
            {isSchemaEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0, scaleY: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scaleY: 1 }}
                exit={{ opacity: 0, height: 0, scaleY: 0.95 }}
                className="overflow-hidden"
              >
                <div className="beveled-panel p-5 flex flex-col border-indigo-950/20 bg-[#08080c] relative">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-900">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-indigo-400" />
                      <span className="font-heading text-xs uppercase tracking-wide font-bold text-zinc-350">
                        JSON Schema Specification (Draft-07)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleFormatSchema}
                        className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white transition-colors"
                      >
                        Beautify Schema
                      </button>
                      <button
                        type="button"
                        onClick={handleCopySchema}
                        className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white transition-colors"
                      >
                        {schemaCopied ? 'Copied!' : 'Copy Schema'}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 mb-2 font-sans">
                    Validate structural keys, require required arrays, or pattern match keys using strict schema syntax below:
                  </p>

                  <textarea
                    value={schemaInput}
                    onChange={(e) => {
                      setSchemaInput(e.target.value);
                      setSchemaError(null);
                    }}
                    placeholder='{"$schema": "http://json-schema.org/draft-07/schema#", "type": "object", "properties": {...}}'
                    className="w-full h-[280px] bg-[#050507] border border-zinc-950 rounded p-4 font-mono text-xs text-zinc-350 focus:outline-none focus:border-indigo-800 resize-none transition-colors"
                  />

                  {schemaError && (
                    <div className="mt-3 p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[10px] flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="break-all">{schemaError}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* OUTPUT COLUMN (Right Pane) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* BEAUTIFIED Restructured Output */}
          <div className="beveled-panel p-5 flex-1 flex flex-col border-rose-950/20 bg-[#08080c]">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="font-heading text-xs uppercase tracking-wide font-bold text-zinc-350">
                  Restructured & Compiled Output
                </span>
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
                      <span>Copy Output</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex-1 min-h-[300px] bg-[#050507] border border-zinc-900 rounded relative overflow-auto max-h-[640px]">
              {state.beautifiedOutput ? (
                <pre className="p-4 font-mono text-xs text-zinc-300 whitespace-pre overflow-x-auto leading-relaxed">
                  <code>{state.beautifiedOutput}</code>
                </pre>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-zinc-650 font-sans">
                  <Braces className="w-10 h-10 mb-2.5 text-zinc-800" />
                  <p className="text-xs max-w-xs">Beautified code will render inside this console plate after formatting passes validation checks.</p>
                </div>
              )}
            </div>
          </div>

          {/* DETAILED AJV SCHEMA VALIDATION ERRORS REPORT */}
          <AnimatePresence>
            {isSchemaEnabled && validationErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="beveled-panel p-5 border-rose-500/20 bg-[#0c0708]"
              >
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-rose-950/45">
                  <XCircle className="w-4.5 h-4.5 text-rose-500 font-extrabold animate-pulse" />
                  <h4 className="font-heading text-xs uppercase tracking-wide font-bold text-rose-400">
                    Ajv Diagnostics Report: ({validationErrors.length}) Violations Detected
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11px] leading-relaxed text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="pb-2 pl-1">Target Pointer</th>
                        <th className="pb-2">Keyword rule</th>
                        <th className="pb-2 pr-1">Discrepancy Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationErrors.map((err, idx) => (
                        <tr key={idx} className="border-b border-zinc-950/40 hover:bg-rose-500/5 transition-colors">
                          <td className="py-2.5 pl-1 text-rose-400 font-semibold max-w-[140px] truncate" title={err.instancePath || 'root'}>
                            {err.instancePath || 'root'}
                          </td>
                          <td className="py-2.5 text-zinc-400 font-medium font-mono text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-850">
                              {err.keyword}
                            </span>
                          </td>
                          <td className="py-2.5 pr-1 text-zinc-350 leading-relaxed font-sans text-xs">
                            {err.message} 
                            {err.params && Object.keys(err.params).length > 0 && (
                              <span className="text-zinc-500 text-[10px] ml-1.5 font-mono">
                                ({JSON.stringify(err.params)})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <AnimatePresence mode="wait">
            {state.isValid !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 justify-center sm:justify-end"
              >
                {state.isValid ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10pt] tracking-wide">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>SYNTAX & SCHEMA ACCREDITED</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-450 font-mono text-[10px] max-w-xs truncate" title={state.errorMessage || 'INTEGRITY ERROR'}>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{state.errorMessage || 'ERROR'}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleFormat}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-550 text-white font-heading font-extrabold text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(225,29,72,0.2)] hover:shadow-[0_4px_22px_rgba(225,29,72,0.35)] transition-all cursor-pointer text-center outline-none select-none active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Beautify & Validate Code</span>
          </button>
        </div>
      </div>

      {/* Semantic FAQs regarding Formatting and Schema Validation */}
      <section className="border-t border-rose-950/20 pt-12 space-y-8">
        <div className="max-w-3xl">
          <h2 className="font-heading text-2xl font-black text-white tracking-tight">
            JSON Schema Verification Workspace - Technical Handbook
          </h2>
          <p className="font-sans text-xs text-zinc-500 mt-2">
            Read comprehensive guides on JSON Schema requirements, locally compiled validator workflows, and real-time structured data checks.
          </p>
        </div>

        <div className="max-w-3xl space-y-4">
          {[
            {
              q: "How to validate database entities offline using standard JSON Schema syntax?",
              a: "By activating the JSON Schema Validation feature, you can enforce specific structures (like verifying that client_id matches standard pattern regulations, and ensuring mandatory arrays are fully loaded). Since all computations run client-side using Ajv's lightning-fast compilation algorithms, no sensitive payload parameters ever touch third-party servers."
            },
            {
              q: "What is Ajv and how does it execute structural audits?",
              a: "Ajv (Another JSON Schema Validator) is the premier offline validator for Node.js and modern browser environments. It compiles standard-compliant JSON schema maps into optimized javascript functions under the hood. It compares your nested structures, integer range parameters, string patterns, and enumerations to verify that client objects conform accurately to schema specs."
            },
            {
              q: "Why does the parsing pass fail with code validation errors?",
              a: "A parsing failure is typically triggered by: 1) Syntax mismatch (unquoted attributes, trailing commas, or unbalanced brackets), or 2) Schema structural violation (unmatched types, missing fields declared as required, or values outside of the defined limits). When these discrepancies occur, the Ajv validator logs the exact target pointer path and the violating schema rules so you can trace the issue instantly."
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


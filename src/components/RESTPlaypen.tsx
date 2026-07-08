import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  Database, 
  AlertCircle, 
  HelpCircle, 
  Code, 
  RefreshCw, 
  Sparkles, 
  Search, 
  Terminal, 
  Eye, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Wifi, 
  Loader2,
  Lock,
  Unlock,
  Sliders,
  CheckCircle,
  X,
  BookOpen,
  Info
} from 'lucide-react';

interface KeyValueRow {
  key: string;
  value: string;
  enabled: boolean;
}

interface RequestHistoryItem {
  id: string;
  method: string;
  url: string;
  timestamp: string;
  status?: number;
  statusText?: string;
  timeMs?: number;
  headersCount: number;
}

const METHOD_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  GET: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/5' },
  POST: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', glow: 'shadow-blue-500/5' },
  PUT: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/5' },
  DELETE: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', glow: 'shadow-rose-500/5' },
  PATCH: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', glow: 'shadow-purple-500/5' },
  HEAD: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/5' },
  OPTIONS: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', glow: 'shadow-slate-500/5' },
};

const COMMON_HEADERS = [
  'Accept',
  'Accept-Charset',
  'Accept-Encoding',
  'Accept-Language',
  'Authorization',
  'Cache-Control',
  'Content-Type',
  'Origin',
  'User-Agent',
  'X-Requested-With',
  'X-API-Key'
];

const PRESETS = [
  {
    name: 'Get User List (JSONPlaceholder)',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users',
    headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
    bodyType: 'none',
    bodyRaw: ''
  },
  {
    name: 'Create Post (JSONPlaceholder)',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'Accept', value: 'application/json', enabled: true }
    ],
    bodyType: 'json',
    bodyRaw: JSON.stringify({
      title: 'APEX Playpen Post',
      body: 'Testing the client-side REST client from the browser.',
      userId: 1
    }, null, 2)
  },
  {
    name: 'Test Delayed Response (httpbin.org)',
    method: 'GET',
    url: 'https://httpbin.org/delay/2',
    headers: [],
    bodyType: 'none',
    bodyRaw: ''
  },
  {
    name: 'Test Request Echo Headers (httpbin.org)',
    method: 'GET',
    url: 'https://httpbin.org/headers',
    headers: [
      { key: 'X-APEX-Client', value: 'REST-Playpen-v1', enabled: true },
      { key: 'X-Diagnostic', value: 'local-wasm-simulation', enabled: true }
    ],
    bodyType: 'none',
    bodyRaw: ''
  }
];

export default function RESTPlaypen() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/users');
  const [headers, setHeaders] = useState<KeyValueRow[]>([
    { key: 'Accept', value: 'application/json', enabled: true }
  ]);
  const [bodyType, setBodyType] = useState<'none' | 'json' | 'form-data' | 'urlencoded'>('none');
  const [bodyRaw, setBodyRaw] = useState('');
  const [formDataRows, setFormDataRows] = useState<KeyValueRow[]>([]);
  const [urlencodedRows, setUrlencodedRows] = useState<KeyValueRow[]>([]);
  
  // Proxy options
  const [useProxy, setUseProxy] = useState(false);
  const [proxyUrl, setProxyUrl] = useState('https://api.allorigins.win/raw?url=');

  // Response states
  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseStatusText, setResponseStatusText] = useState('');
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseSize, setResponseSize] = useState<number | null>(null); // in bytes
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<string>('');
  const [responseBodyFormatted, setResponseBodyFormatted] = useState<string>('');
  const [responseType, setResponseType] = useState<string>('application/json');
  const [responseError, setResponseError] = useState<string | null>(null);

  // Tabs
  const [activeReqTab, setActiveReqTab] = useState<'headers' | 'body' | 'settings'>('headers');
  const [activeResTab, setActiveResTab] = useState<'body' | 'headers' | 'preview'>('body');
  
  // UI States
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);
  const [searchHeaderQuery, setSearchHeaderQuery] = useState('');
  const [searchResBodyQuery, setSearchResBodyQuery] = useState('');
  const [isUrlFocused, setIsUrlFocused] = useState(false);

  // Load history from localstorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('apex_rest_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error('Failed to load REST playpen history:', e);
    }
  }, []);

  const saveHistory = (newHistory: RequestHistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('apex_rest_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save REST playpen history:', e);
    }
  };

  const addHistoryItem = (status?: number, statusText?: string, timeMs?: number) => {
    const enabledHeaders = headers.filter(h => h.enabled && h.key.trim() !== '');
    const newItem: RequestHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      method,
      url,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status,
      statusText,
      timeMs,
      headersCount: enabledHeaders.length
    };
    saveHistory([newItem, ...history.slice(0, 19)]);
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  const loadPreset = (preset: typeof PRESETS[0]) => {
    setMethod(preset.method);
    setUrl(preset.url);
    setHeaders(preset.headers.length > 0 ? [...preset.headers] : [{ key: '', value: '', enabled: true }]);
    setBodyType(preset.bodyType as any);
    setBodyRaw(preset.bodyRaw);
  };

  const handleSend = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setResponseError(null);
    setResponseStatus(null);
    setResponseStatusText('');
    setResponseTime(null);
    setResponseSize(null);
    setResponseHeaders({});
    setResponseBody('');
    setResponseBodyFormatted('');

    const startTime = performance.now();
    let finalUrl = url.trim();

    // Protocol check
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
      setUrl(finalUrl);
    }

    if (useProxy && proxyUrl) {
      finalUrl = `${proxyUrl}${encodeURIComponent(finalUrl)}`;
    }

    try {
      // Build Headers
      const requestHeaders = new Headers();
      headers.forEach(h => {
        if (h.enabled && h.key.trim() !== '') {
          requestHeaders.append(h.key.trim(), h.value);
        }
      });

      // Build Body
      let requestBody: any = undefined;
      if (method !== 'GET' && method !== 'HEAD') {
        if (bodyType === 'json' && bodyRaw.trim() !== '') {
          requestBody = bodyRaw;
        } else if (bodyType === 'form-data') {
          const fd = new FormData();
          formDataRows.forEach(r => {
            if (r.enabled && r.key.trim() !== '') {
              fd.append(r.key.trim(), r.value);
            }
          });
          requestBody = fd;
        } else if (bodyType === 'urlencoded') {
          const params = new URLSearchParams();
          urlencodedRows.forEach(r => {
            if (r.enabled && r.key.trim() !== '') {
              params.append(r.key.trim(), r.value);
            }
          });
          requestBody = params;
        }
      }

      const response = await fetch(finalUrl, {
        method,
        headers: requestHeaders,
        body: requestBody,
        mode: 'cors'
      });

      const endTime = performance.now();
      const elapsedMs = Math.round(endTime - startTime);
      setResponseTime(elapsedMs);

      // Status
      setResponseStatus(response.status);
      setResponseStatusText(response.statusText || getStatusTextPlaceholder(response.status));

      // Extract response headers
      const resHeadersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        resHeadersObj[key] = value;
      });
      setResponseHeaders(resHeadersObj);

      const contentType = response.headers.get('content-type') || 'text/plain';
      setResponseType(contentType);

      // Read Body
      const rawText = await response.text();
      setResponseBody(rawText);
      setResponseSize(new Blob([rawText]).size);

      // Format Body if possible
      if (contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(rawText);
          setResponseBodyFormatted(JSON.stringify(parsed, null, 2));
        } catch {
          setResponseBodyFormatted(rawText);
        }
      } else {
        setResponseBodyFormatted(rawText);
      }

      addHistoryItem(response.status, response.statusText || getStatusTextPlaceholder(response.status), elapsedMs);

    } catch (err: any) {
      console.error('Request fetch error:', err);
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseError(err.message || 'Network connection failed.');
      addHistoryItem(0, 'Failed', Math.round(endTime - startTime));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusTextPlaceholder = (code: number): string => {
    if (code >= 200 && code < 300) return 'OK';
    if (code >= 300 && code < 400) return 'Redirected';
    if (code === 400) return 'Bad Request';
    if (code === 401) return 'Unauthorized';
    if (code === 403) return 'Forbidden';
    if (code === 404) return 'Not Found';
    if (code === 405) return 'Method Not Allowed';
    if (code >= 500) return 'Internal Server Error';
    return 'Status Unknown';
  };

  // Row operations for request headers / form data / urlencoded params
  const addHeaderRow = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const updateHeaderRow = (index: number, fields: Partial<KeyValueRow>) => {
    setHeaders(headers.map((row, idx) => idx === index ? { ...row, ...fields } : row));
  };

  const deleteHeaderRow = (index: number) => {
    const updated = headers.filter((_, idx) => idx !== index);
    setHeaders(updated.length > 0 ? updated : [{ key: '', value: '', enabled: true }]);
  };

  const addFormDataRow = () => {
    setFormDataRows([...formDataRows, { key: '', value: '', enabled: true }]);
  };

  const updateFormDataRow = (index: number, fields: Partial<KeyValueRow>) => {
    setFormDataRows(formDataRows.map((row, idx) => idx === index ? { ...row, ...fields } : row));
  };

  const deleteFormDataRow = (index: number) => {
    const updated = formDataRows.filter((_, idx) => idx !== index);
    setFormDataRows(updated.length > 0 ? updated : [{ key: '', value: '', enabled: true }]);
  };

  const addUrlencodedRow = () => {
    setUrlencodedRows([...urlencodedRows, { key: '', value: '', enabled: true }]);
  };

  const updateUrlencodedRow = (index: number, fields: Partial<KeyValueRow>) => {
    setUrlencodedRows(urlencodedRows.map((row, idx) => idx === index ? { ...row, ...fields } : row));
  };

  const deleteUrlencodedRow = (index: number) => {
    const updated = urlencodedRows.filter((_, idx) => idx !== index);
    setUrlencodedRows(updated.length > 0 ? updated : [{ key: '', value: '', enabled: true }]);
  };

  const formatRawJson = () => {
    try {
      const parsed = JSON.parse(bodyRaw);
      setBodyRaw(JSON.stringify(parsed, null, 2));
    } catch {
      // Intentionally empty: do nothing if JSON is invalid
    }
  };

  // Copy response body
  const handleCopyResponse = () => {
    navigator.clipboard.writeText(responseBodyFormatted || responseBody);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const loadHistoryItem = (item: RequestHistoryItem) => {
    setMethod(item.method);
    setUrl(item.url);
  };

  const formatSize = (bytes: number | null): string => {
    if (bytes === null) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const getStatusColorClass = (status: number | null): string => {
    if (status === null) return 'text-zinc-400 bg-zinc-900 border-zinc-800';
    if (status >= 200 && status < 300) return 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30';
    if (status >= 300 && status < 400) return 'text-blue-400 bg-blue-950/20 border-blue-900/30';
    if (status >= 400 && status < 500) return 'text-amber-400 bg-amber-950/20 border-amber-900/30';
    return 'text-rose-400 bg-rose-950/20 border-rose-900/30';
  };

  return (
    <div className="space-y-6 select-none font-sans" id="rest-api-playpen">
      
      {/* Dynamic Presets Row */}
      <div className="bg-slate-950/55 border border-brand/10 p-3.5 rounded-xl space-y-2">
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" /> Try Quick Demo Presets
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadPreset(preset)}
              className="px-2.5 py-1 bg-zinc-900/60 border border-zinc-800 hover:border-brand/30 text-zinc-400 hover:text-white rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer hover:bg-zinc-900"
            >
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Request Builder Panel */}
        <div className="lg:col-span-7 bg-[#08080c]/60 border border-brand/15 rounded-xl p-5 space-y-5 shadow-[0_0_20px_rgba(239,68,68,0.02)]">
          
          {/* Header Panel */}
          <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
            <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-brand" /> Request configuration
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'} shadow-sm`} />
              <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold tracking-wider">
                {isLoading ? 'Running Pipeline' : 'Local Host Active'}
              </span>
            </div>
          </div>

          {/* URL Input & Method Selector Panel */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-white rounded-xl px-3.5 py-2.5 font-mono text-xs font-black tracking-wide focus:outline-none focus:border-brand/40 cursor-pointer h-11 w-full sm:w-28 text-center"
                >
                  {Object.keys(METHOD_COLORS).map(m => (
                    <option key={m} value={m} className="bg-slate-950 text-white font-mono font-bold text-xs">
                      {m}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-3.5 pointer-events-none text-zinc-500">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  placeholder="https://api.example.com/v1/resource"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onFocus={() => setIsUrlFocused(true)}
                  onBlur={() => setIsUrlFocused(false)}
                  className="w-full bg-zinc-950 border border-zinc-900 focus:border-brand/30 rounded-xl px-4 py-2.5 font-mono text-xs text-zinc-300 focus:outline-none h-11 shadow-inner pl-9"
                />
                <div className="absolute left-3 text-zinc-600">
                  <Wifi className={`w-3.5 h-3.5 ${isUrlFocused ? 'text-brand' : ''}`} />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || !url.trim()}
                className="bg-brand text-zinc-950 hover:bg-brand-hover hover:text-white disabled:opacity-40 disabled:hover:bg-brand disabled:hover:text-zinc-950 transition-all font-sans text-xs font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-brand/10 h-11 cursor-pointer active:scale-98 shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Sending</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Request</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Configuration sub-tabs */}
          <div className="space-y-4">
            <div className="flex items-center gap-1 border-b border-zinc-900/40 pb-2">
              <button
                type="button"
                onClick={() => setActiveReqTab('headers')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 border cursor-pointer ${
                  activeReqTab === 'headers'
                    ? 'bg-brand/10 border-brand/30 text-brand font-bold'
                    : 'bg-zinc-900/20 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Headers ({headers.filter(h => h.enabled && h.key.trim() !== '').length})</span>
              </button>
              
              <button
                type="button"
                onClick={() => setActiveReqTab('body')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 border cursor-pointer ${
                  activeReqTab === 'body'
                    ? 'bg-brand/10 border-brand/30 text-brand font-bold'
                    : 'bg-zinc-900/20 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <Code className="w-3 h-3" />
                <span>Request Body</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveReqTab('settings')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 border cursor-pointer ${
                  activeReqTab === 'settings'
                    ? 'bg-brand/10 border-brand/30 text-brand font-bold'
                    : 'bg-zinc-900/20 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <HelpCircle className="w-3 h-3" />
                <span>CORS &amp; settings</span>
              </button>
            </div>

            {/* TAB CONTENT: HEADERS */}
            {activeReqTab === 'headers' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-wider">Configure Request Headers</span>
                  <button
                    type="button"
                    onClick={addHeaderRow}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-brand hover:text-brand-hover hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Header
                  </button>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                  {headers.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(e) => updateHeaderRow(idx, { enabled: e.target.checked })}
                        className="rounded border-zinc-850 text-brand focus:ring-brand focus:ring-opacity-20 cursor-pointer h-4 w-4 bg-zinc-950"
                      />
                      
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Key"
                            value={row.key}
                            onChange={(e) => updateHeaderRow(idx, { key: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 font-mono text-xs text-zinc-300 focus:outline-none focus:border-brand/20 h-8"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Value"
                          value={row.value}
                          onChange={(e) => updateHeaderRow(idx, { value: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 font-mono text-xs text-zinc-300 focus:outline-none focus:border-brand/20 h-8"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteHeaderRow(idx)}
                        className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-600 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: REQUEST BODY */}
            {activeReqTab === 'body' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900/30 pb-2">
                  <div className="flex gap-2">
                    {(['none', 'json', 'form-data', 'urlencoded'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBodyType(type)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all border ${
                          bodyType === type
                            ? 'bg-zinc-900 border-zinc-800 text-brand font-bold'
                            : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {type === 'urlencoded' ? 'x-www-form-urlencoded' : type}
                      </button>
                    ))}
                  </div>

                  {bodyType === 'json' && (
                    <button
                      type="button"
                      onClick={formatRawJson}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded text-[10px] font-mono transition-colors cursor-pointer"
                    >
                      Format JSON
                    </button>
                  )}
                </div>

                {/* Sub Tab Panel: None */}
                {bodyType === 'none' && (
                  <div className="text-center py-8 bg-zinc-950/30 border border-dashed border-zinc-900 rounded-xl space-y-1">
                    <AlertCircle className="w-5 h-5 text-zinc-600 mx-auto" />
                    <p className="text-xs font-sans text-zinc-500">This request method is configured with no payload body.</p>
                    <p className="text-[10px] font-mono text-zinc-700">Suitable for standard GET, HEAD, or DELETE commands.</p>
                  </div>
                )}

                {/* Sub Tab Panel: JSON Raw */}
                {bodyType === 'json' && (
                  <div className="space-y-2">
                    <textarea
                      placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
                      value={bodyRaw}
                      onChange={(e) => setBodyRaw(e.target.value)}
                      className="w-full h-44 bg-zinc-950 border border-zinc-900 focus:border-brand/20 rounded-xl p-3 font-mono text-xs text-zinc-300 focus:outline-none resize-none select-text"
                    />
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-600">
                      <span>Status: Checked raw string payload</span>
                      <span>Content-Type: application/json</span>
                    </div>
                  </div>
                )}

                {/* Sub Tab Panel: Form Data Key-Value */}
                {bodyType === 'form-data' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-wider">Multipart Form Data Grid</span>
                      <button
                        type="button"
                        onClick={addFormDataRow}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-brand hover:text-brand-hover hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Row
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                      {formDataRows.length > 0 ? (
                        formDataRows.map((row, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="checkbox"
                              checked={row.enabled}
                              onChange={(e) => updateFormDataRow(idx, { enabled: e.target.checked })}
                              className="rounded border-zinc-850 text-brand focus:ring-brand focus:ring-opacity-20 cursor-pointer h-4 w-4 bg-zinc-950"
                            />
                            
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Key"
                                value={row.key}
                                onChange={(e) => updateFormDataRow(idx, { key: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 font-mono text-xs text-zinc-300 focus:outline-none focus:border-brand/20 h-8"
                              />
                              <input
                                type="text"
                                placeholder="Value"
                                value={row.value}
                                onChange={(e) => updateFormDataRow(idx, { value: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 font-mono text-xs text-zinc-300 focus:outline-none focus:border-brand/20 h-8"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => deleteFormDataRow(idx)}
                              className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-600 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-zinc-600 font-mono text-[10px]">
                          No form parameters configured yet. Click "Add Row" above.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub Tab Panel: URL Encoded Grid */}
                {bodyType === 'urlencoded' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-wider">URL-Encoded Form Params</span>
                      <button
                        type="button"
                        onClick={addUrlencodedRow}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-brand hover:text-brand-hover hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Row
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                      {urlencodedRows.length > 0 ? (
                        urlencodedRows.map((row, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="checkbox"
                              checked={row.enabled}
                              onChange={(e) => updateUrlencodedRow(idx, { enabled: e.target.checked })}
                              className="rounded border-zinc-850 text-brand focus:ring-brand focus:ring-opacity-20 cursor-pointer h-4 w-4 bg-zinc-950"
                            />
                            
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Key"
                                value={row.key}
                                onChange={(e) => updateUrlencodedRow(idx, { key: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 font-mono text-xs text-zinc-300 focus:outline-none focus:border-brand/20 h-8"
                              />
                              <input
                                type="text"
                                placeholder="Value"
                                value={row.value}
                                onChange={(e) => updateUrlencodedRow(idx, { value: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 font-mono text-xs text-zinc-300 focus:outline-none focus:border-brand/20 h-8"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => deleteUrlencodedRow(idx)}
                              className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-600 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-zinc-600 font-mono text-[10px]">
                          No urlencoded keys configured yet. Click "Add Row" above.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: SETTINGS & CORS HELP */}
            {activeReqTab === 'settings' && (
              <div className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900/60">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold tracking-wider">CORS Proxy Configuration</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-brand font-bold bg-brand/5 px-2 py-0.5 border border-brand/20 rounded">
                      SOLVES CORS BLOCKS
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      <HelpCircle className="w-4 h-4 text-brand shrink-0" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-sans font-bold text-zinc-200 leading-snug">What is CORS and why does it affect client HTTP queries?</p>
                      <p className="text-[11px] font-sans text-zinc-400 leading-relaxed">
                        Browser requests inside an iframe or web applet are restricted by standard client-side security policies (CORS). 
                        If the destination API server doesn't explicitly return an <code>Access-Control-Allow-Origin: *</code> header in its response stream, 
                        your browser will reject the response automatically.
                      </p>
                    </div>
                  </div>

                  {/* CORS Toggle Switch */}
                  <div className="flex items-center justify-between p-3 rounded bg-zinc-900/40 border border-zinc-800/60 hover:bg-zinc-900/60 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {useProxy ? (
                        <Unlock className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-sans text-[11px] font-bold text-zinc-200">
                          Enable AllOrigins CORS Proxy Proxy
                        </span>
                        <span className="font-sans text-[9px] text-zinc-500 mt-0.5">
                          Redirects requests through a public, open CORS header injection proxy.
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setUseProxy(!useProxy)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        useProxy ? 'bg-brand' : 'bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          useProxy ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {useProxy && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase text-zinc-500 block">Proxy Gateway Host</span>
                      <input
                        type="text"
                        value={proxyUrl}
                        onChange={(e) => setProxyUrl(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-zinc-400 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Response Terminal */}
        <div className="lg:col-span-5 bg-[#08080c]/60 border border-brand/15 rounded-xl p-5 space-y-4 shadow-[0_0_20px_rgba(239,68,68,0.02)]">
          
          {/* Header Panel */}
          <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
            <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-brand" /> Response Stream Viewer
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wide">Output Format</span>
            </div>
          </div>

          {/* Response metrics panel */}
          {responseStatus !== null || isLoading || responseError ? (
            <div className="grid grid-cols-3 gap-2 bg-zinc-950/60 p-3 rounded-lg border border-zinc-900/80">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="text-[8px] font-mono uppercase text-zinc-500 block">STATUS CODE</span>
                {isLoading ? (
                  <span className="text-zinc-500 text-xs font-mono">WAITING</span>
                ) : responseError ? (
                  <span className="text-red-400 text-xs font-mono font-bold">ERROR</span>
                ) : (
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getStatusColorClass(responseStatus)}`}>
                    {responseStatus} {responseStatusText}
                  </span>
                )}
              </div>
              <div className="space-y-0.5 text-center sm:text-left border-x border-zinc-900/60 px-2">
                <span className="text-[8px] font-mono uppercase text-zinc-500 block">ELAPSED TIME</span>
                <span className="text-zinc-300 text-xs font-sans font-bold flex items-center justify-center sm:justify-start gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {responseTime !== null ? `${responseTime} ms` : '--'}
                </span>
              </div>
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="text-[8px] font-mono uppercase text-zinc-500 block">PAYLOAD SIZE</span>
                <span className="text-zinc-300 text-xs font-sans font-bold">
                  {responseSize !== null ? formatSize(responseSize) : '--'}
                </span>
              </div>
            </div>
          ) : null}

          {/* IDLE / NO REQUEST STATE */}
          {responseStatus === null && !isLoading && !responseError && (
            <div className="text-center py-16 bg-zinc-950/20 border border-dashed border-zinc-900 rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-full bg-zinc-900/40 flex items-center justify-center mx-auto border border-zinc-850">
                <Terminal className="w-5 h-5 text-zinc-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-sans text-zinc-400 font-bold">Awaiting Pipeline execution</p>
                <p className="text-[10px] font-mono text-zinc-600 max-w-xs mx-auto">
                  Configure request parameters, URL destination, and click "Send Request" to observe real-time payload outcomes.
                </p>
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {isLoading && (
            <div className="text-center py-16 bg-zinc-950/20 border border-dashed border-zinc-900 rounded-xl space-y-3">
              <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-sans text-zinc-400 font-bold">Awaiting Server response stream</p>
                <p className="text-[10px] font-mono text-zinc-600">Resolving headers, proxy handshakes, and body parsing...</p>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {responseError && !isLoading && (
            <div className="p-4 bg-red-950/10 border border-red-950/20 rounded-xl space-y-2 text-left">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>Request Failed</span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 leading-relaxed bg-zinc-950 p-2.5 rounded border border-zinc-900">
                {responseError}
              </p>
              <div className="text-[10px] font-sans text-zinc-500 leading-normal">
                💡 <strong>CORS Suggestion:</strong> Browser security likely blocked this request. 
                Go to the <strong>"CORS &amp; settings"</strong> tab in the builder and enable the CORS proxy toggle to fetch this endpoint successfully.
              </div>
            </div>
          )}

          {/* COMPLETED SUCCESS / FAIL RESPONSE CONTENT */}
          {responseStatus !== null && !isLoading && !responseError && (
            <div className="space-y-3">
              
              {/* Output Sub-Tabs */}
              <div className="flex items-center justify-between border-b border-zinc-900/40 pb-2">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveResTab('body')}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all border cursor-pointer ${
                      activeResTab === 'body'
                        ? 'bg-zinc-900 border-zinc-800 text-brand font-bold'
                        : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Body
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResTab('headers')}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all border cursor-pointer ${
                      activeResTab === 'headers'
                        ? 'bg-zinc-900 border-zinc-800 text-brand font-bold'
                        : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Headers ({Object.keys(responseHeaders).length})
                  </button>
                  {responseType.includes('html') && (
                    <button
                      type="button"
                      onClick={() => setActiveResTab('preview')}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all border cursor-pointer ${
                        activeResTab === 'preview'
                          ? 'bg-zinc-900 border-zinc-800 text-brand font-bold'
                          : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Preview HTML
                    </button>
                  )}
                </div>

                {/* Copy Response Button */}
                {activeResTab === 'body' && (
                  <button
                    type="button"
                    onClick={handleCopyResponse}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-900 text-[10px] font-mono text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                  >
                    {copiedResponse ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Response</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* RESPONSE BODY TAB PANEL */}
              {activeResTab === 'body' && (
                <div className="space-y-2">
                  <div className="relative">
                    <pre className="text-[11px] font-mono text-zinc-300 bg-zinc-950 p-3.5 rounded-xl border border-zinc-900/80 max-h-[300px] overflow-auto select-text scrollbar-thin whitespace-pre break-all text-left block">
                      {responseBodyFormatted || responseBody || 'Empty payload response body.'}
                    </pre>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-600 flex justify-between items-center px-1">
                    <span>Parsed format representation</span>
                    <span className="truncate max-w-[180px] text-right" title={responseType}>Mime: {responseType}</span>
                  </div>
                </div>
              )}

              {/* RESPONSE HEADERS TAB PANEL */}
              {activeResTab === 'headers' && (
                <div className="space-y-2">
                  <div className="bg-zinc-950 p-2 border border-zinc-900/85 rounded-lg flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-zinc-600" />
                    <input
                      type="text"
                      placeholder="Filter response headers..."
                      value={searchHeaderQuery}
                      onChange={(e) => setSearchHeaderQuery(e.target.value)}
                      className="bg-transparent border-none text-xs text-zinc-300 focus:outline-none w-full"
                    />
                  </div>

                  <div className="border border-zinc-900/80 rounded-xl overflow-hidden max-h-[240px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-left font-mono text-[10.5px]">
                      <thead>
                        <tr className="bg-zinc-950 border-b border-zinc-900/80 text-zinc-500 text-[9px] uppercase tracking-wider">
                          <th className="px-3 py-2 font-bold">Header Key</th>
                          <th className="px-3 py-2 font-bold">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/50 bg-[#07070a]/30">
                        {Object.entries(responseHeaders)
                          .filter(([key, value]) => 
                            key.toLowerCase().includes(searchHeaderQuery.toLowerCase()) || 
                            value.toLowerCase().includes(searchHeaderQuery.toLowerCase())
                          )
                          .map(([key, value]) => (
                            <tr key={key} className="hover:bg-zinc-900/30">
                              <td className="px-3 py-2 text-zinc-400 font-bold break-all select-text">{key}</td>
                              <td className="px-3 py-2 text-zinc-300 break-all select-text">{value}</td>
                            </tr>
                          ))}
                        {Object.keys(responseHeaders).length === 0 && (
                          <tr>
                            <td colSpan={2} className="px-3 py-6 text-center text-zinc-600">No response headers found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* RESPONSE HTML PREVIEW TAB PANEL */}
              {activeResTab === 'preview' && (
                <div className="border border-zinc-900 rounded-xl overflow-hidden bg-white h-[300px]">
                  <iframe
                    title="HTML Response Preview"
                    srcDoc={responseBody}
                    sandbox="allow-scripts"
                    className="w-full h-full border-none bg-white"
                  />
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* History Panel - Collapsible & Saved to LocalStorage */}
      <div className="bg-[#08080c]/60 border border-brand/15 rounded-xl p-5 shadow-[0_0_20px_rgba(239,68,68,0.02)] space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
          <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-brand" /> Request execution history log
          </span>
          {history.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="px-2.5 py-1 text-red-500 hover:text-red-400 border border-red-950/20 hover:border-red-500/30 bg-red-950/10 rounded-lg text-[10px] font-mono transition-colors cursor-pointer"
            >
              Clear History
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {history.map((item) => {
              const colors = METHOD_COLORS[item.method] || METHOD_COLORS.GET;
              return (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 rounded-xl border border-zinc-900/80 bg-zinc-950/40 hover:bg-zinc-950/80 hover:border-zinc-800 transition-all gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {item.method}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-xs text-zinc-300 truncate" title={item.url}>
                        {item.url}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 mt-0.5">
                        <span>{item.timestamp}</span>
                        <span>•</span>
                        <span>Headers: {item.headersCount}</span>
                        {item.timeMs !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-400">{item.timeMs}ms</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.status !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${getStatusColorClass(item.status)}`}>
                        {item.status}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => loadHistoryItem(item)}
                      className="p-1.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 hover:border-brand/40 text-zinc-400 hover:text-white transition-all cursor-pointer"
                      title="Reload into builder"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-600 font-mono text-xs">
            No past request transactions recorded inside this browser session yet.
          </div>
        )}
      </div>

      {/* Google AdSense Compliant Informational Article & FAQs Footer */}
      <div className="border-t border-zinc-900 pt-12 mt-12 space-y-10 text-left">
        
        {/* Editorial Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Developer Guide: Client-Side HTTP & API Testing</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight sm:text-2xl">
            A Complete Guide to Sandbox REST API Client Testing & CORS Proxies
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-3xl">
            Are you looking to inspect headers, send POST payloads, or debug JSON responses without downloading resource-heavy desktop apps? Our browser-based REST Playpen is designed to let you dispatch standard HTTP requests directly inside your sandboxed web browser, featuring advanced CORS configuration settings.
          </p>
        </div>

        {/* 2-Column Article Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Article Column 1 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-emerald-500 font-mono">01.</span>
                What is a REST API Client?
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                A REST (Representational State Transfer) API client allows developers and QA teams to send requests to web services and view the response stream. By composing request packets with specific verbs (GET, POST, PUT, DELETE), headers, and dynamic payloads, you can fully test server endpoints, authentication protocols, and web service behavior under different scenarios.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Desktop solutions are often heavy and require installations. This web-based playpen brings the core capabilities of Postman or Insomnia directly into your browser, allowing quick testing on any device.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-emerald-500 font-mono">02.</span>
                The CORS Mechanism Explained
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                When sending fetch requests directly from a browser-based application, you will frequently encounter Cross-Origin Resource Sharing (CORS) security restrictions. This is a mechanism that uses additional HTTP headers to tell browsers to give a web application running at one origin access to selected resources from a different server.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                If the target server does not send the <code>Access-Control-Allow-Origin: *</code> header, your browser will block the response for safety. That's why our playpen includes a built-in CORS Proxy toggle, routing requests through a secure gateway to temporarily bypass these constraints during development checks.
              </p>
            </div>
          </div>

          {/* Article Column 2 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-emerald-500 font-mono">03.</span>
                How to Compose High-Performance Requests
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                For successful API operations, configure your endpoints with care:
              </p>
              <ul className="space-y-2 text-zinc-400 text-xs pl-4 list-disc">
                <li><strong className="text-zinc-200">Headers:</strong> Include necessary headers such as <code>Content-Type: application/json</code> for JSON posts, or <code>Authorization: Bearer [token]</code> to access secured APIs.</li>
                <li><strong className="text-zinc-200">Payload:</strong> Ensure your JSON structure is fully valid before dispatching. Use our dynamic "Format JSON" validator to clean up raw input text instantly.</li>
                <li><strong className="text-zinc-200">History:</strong> Easily audit previous transactions in the sidebar tab to load configurations and review logs.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-emerald-500 font-mono">04.</span>
                Step-by-Step API Testing Process
              </h4>
              <ol className="space-y-1.5 text-zinc-400 text-xs pl-4 list-decimal">
                <li>Select your desired HTTP method (e.g. GET, POST, PUT, DELETE) from the selector.</li>
                <li>Input your destination endpoint URL.</li>
                <li>Add required HTTP header values or configure custom query arguments.</li>
                <li>If posting data, switch to the "Request Body" tab and paste your JSON string.</li>
                <li>Click <strong className="text-emerald-400">Send Request</strong> to instantly capture response status codes, sizes, timings, headers, and formatted payloads.</li>
              </ol>
            </div>
          </div>

        </div>

        {/* Separator */}
        <div className="border-t border-zinc-900/60" />

        {/* FAQ Section */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white tracking-tight">Frequently Asked Questions (FAQ)</h4>
            <p className="text-zinc-500 text-xs">Got questions about browser-based API calling and CORS compliance? Read on.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Is it safe to send sensitive keys or tokens through this REST Playpen?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Yes! When the CORS proxy toggle is disabled, all requests go directly from your local browser to the target server. No intermediate systems intercept or process your tokens, guaranteeing complete data sovereignty.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                How does the AllOrigins CORS proxy option work?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                AllOrigins is an open-source, server-side utility that fetches target URLs and wraps the response payload with CORS-permissive headers. This lets your local browser bypass standard security blockages during fast sandbox checks.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Can I upload files or multipart form payloads here?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Yes, our "form-data" sub-tab allows developers to create standard multipart/form-data key-value grids, which our client compiler automatically wraps and streams for standard upload mock testing.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Why are some responses showing up with a 0 status code?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                A status code of 0 usually indicates a silent browser network error. This happens if the target URL is incorrect, your network connection drops, or CORS blocks the handshake because the server does not support wildcards.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

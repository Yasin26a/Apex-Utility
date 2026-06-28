import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Type, Copy, Check, Download, AlertCircle, RefreshCw, Trash2, 
  HelpCircle, Sparkles, FileText, Settings, ArrowRightLeft, 
  AlignLeft, Terminal, LayoutList, BookOpen, CheckCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logToolUsage } from '../utils/toolAnalytics';

export default function CaseConverter() {
  const { t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [caseSensitiveSearch, setCaseSensitiveSearch] = useState(false);
  const [linePrefix, setLinePrefix] = useState('');
  const [lineSuffix, setLineSuffix] = useState('');
  const [wrapLimit, setWrapLimit] = useState(80);
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [textHistory, setTextHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Stats calculation
  const [stats, setStats] = useState({
    charsWithSpaces: 0,
    charsNoSpaces: 0,
    words: 0,
    lines: 0,
    paragraphs: 0,
    readingTimeSec: 0,
    frequencyMap: [] as { char: string; count: number; percentage: number }[]
  });

  // Track page loads
  useEffect(() => {
    logToolUsage('case-converter');
  }, []);

  // Sync / Calculate statistics on Input change
  useEffect(() => {
    const text = inputText;
    const charsWithSpaces = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    
    const wordsArray = text.trim().split(/\s+/).filter(Boolean);
    const words = wordsArray.length;
    
    const lines = text ? text.split('\n').length : 0;
    const paragraphs = text ? text.split(/\n\s*\n/).filter(Boolean).length : 0;
    
    // Average reading speed is ~200 WPM
    const readingTimeSec = Math.ceil((words / 200) * 60);

    // Dynamic frequency map for top 6 letters
    const frequencies: Record<string, number> = {};
    const lowerTextClean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const char of lowerTextClean) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }
    const freqMap = Object.entries(frequencies)
      .map(([char, count]) => ({
        char: char.toUpperCase(),
        count,
        percentage: lowerTextClean.length ? Math.round((count / lowerTextClean.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    setStats({
      charsWithSpaces,
      charsNoSpaces,
      words,
      lines,
      paragraphs,
      readingTimeSec,
      frequencyMap: freqMap
    });
  }, [inputText]);

  // Handle history state tracking
  const pushToHistory = (newText: string) => {
    setTextHistory(prev => {
      const updated = [...prev.slice(0, historyIndex + 1), newText].slice(-15);
      setHistoryIndex(updated.length - 1);
      return updated;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setInputText(textHistory[prevIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < textHistory.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setInputText(textHistory[nextIdx]);
    }
  };

  const updateText = (newVal: string, actionLabel: string) => {
    setInputText(newVal);
    pushToHistory(newVal);
    triggerSuccessMessage(actionLabel);
  };

  const triggerSuccessMessage = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Predefined Sample Data
  const loadSampleText = () => {
    const samples = [
      `APEX UTILITY DESIGN SUITE\n\nThe ultimate development sandbox featuring robust high-performance WebAssembly engines. You can transform letter casings, write high-readability copywriting articles with our SEO Optimizer, write secure custom signatures offline, or instantly format dirty payloads using client-side parsers. everything executes inside secure browser cache workspaces protecting core intellectual data values.`,
      `// Sample raw JSON response for styling test\n{\n  "clientId": "apex_9921_beta",\n  "systemStatus": "active_online",\n  "latencyMetrics": "0.19ms_ideal",\n  "recentToggles": ["crimson_preset", "cobalt_preset"]\n}`,
      `the quick brown fox jumps over the lazy dog. a brilliant red sun sets behind the massive snow-capped mountains. software code is like poetry; complex algorithms can yield beautiful user experiences.`
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    updateText(picked, 'Loaded Sample Text');
  };

  const handleClear = () => {
    setInputText('');
    triggerSuccessMessage('Cleared Workspace');
  };

  const handleCopy = async () => {
    if (!inputText) return;
    try {
      await navigator.clipboard.writeText(inputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownload = () => {
    if (!inputText) return;
    const blob = new Blob([inputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apex_formatted_text_${Date.now().toString().slice(-4)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerSuccessMessage('Downloaded Text File');
  };

  // Case Conversion Logics
  const toUpperCase = () => {
    updateText(inputText.toUpperCase(), 'Converted to UPPERCASE');
  };

  const toLowerCase = () => {
    updateText(inputText.toLowerCase(), 'Converted to lowercase');
  };

  const toSentenceCase = () => {
    const converted = inputText
      .toLowerCase()
      .replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, separator, letter) => separator + letter.toUpperCase());
    updateText(converted, 'Converted to Sentence case');
  };

  const toTitleCase = () => {
    const converted = inputText
      .toLowerCase()
      .split(' ')
      .map(word => {
        if (!word) return '';
        // Skip minor preposition words occasionally if word isn't first, but keeping it standard Title Case is safer:
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
    updateText(converted, 'Converted to Title Case');
  };

  const toCamelCase = () => {
    const converted = inputText
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/[\s-_]+(\w)/g, (_, letter) => letter.toUpperCase())
      .replace(/^\w/, letter => letter.toLowerCase());
    updateText(converted, 'Converted to camelCase');
  };

  const toPascalCase = () => {
    const converted = inputText
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/[\s-_]+(\w)/g, (_, letter) => letter.toUpperCase())
      .replace(/^\w/, letter => letter.toUpperCase());
    updateText(converted, 'Converted to PascalCase');
  };

  const toSnakeCase = () => {
    const converted = inputText
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    updateText(converted, 'Converted to snake_case');
  };

  const toKebabCase = () => {
    const converted = inputText
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    updateText(converted, 'Converted to kebab-case');
  };

  const toSlugCase = () => {
    // Slugs typically simplify accents, spaces, and remove unneeded symbols
    const converted = inputText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accented characters markings
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    updateText(converted, 'Converted to Web Slug');
  };

  const toDotCase = () => {
    const converted = inputText
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '.');
    updateText(converted, 'Converted to Dot.Notation.Case');
  };

  const toToggleCase = () => {
    const converted = inputText
      .split('')
      .map(char => {
        if (char === char.toUpperCase()) return char.toLowerCase();
        return char.toUpperCase();
      })
      .join('');
    updateText(converted, 'Converted to tOgGlE cAsE');
  };

  const toRandomCase = () => {
    const converted = inputText
      .split('')
      .map(char => Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase())
      .join('');
    updateText(converted, 'Converted to sPiNgEbOb rAnDoM cAsE');
  };

  // Text formatting transformations
  const trimWhitespaces = () => {
    const converted = inputText
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();
    updateText(converted, 'Trimmed Whitespaces');
  };

  const removeMultipleSpaces = () => {
    const converted = inputText.replace(/[ \t]+/g, ' ');
    updateText(converted, 'Cleaned Accidental Multi-Spaces');
  };

  const stripHtmlTags = () => {
    const converted = inputText.replace(/<\/?[^>]+(>|$)/g, "");
    updateText(converted, 'Stripped HTML tags');
  };

  const removeEmptyLines = () => {
    const converted = inputText
      .split('\n')
      .filter(line => line.trim() !== '')
      .join('\n');
    updateText(converted, 'Stripped Empty Lines');
  };

  const removeDuplicateLines = () => {
    const lines = inputText.split('\n');
    const uniqueLines = Array.from(new Set(lines));
    const converted = uniqueLines.join('\n');
    updateText(converted, 'Removed Duplicate Lines');
  };

  const removeDuplicateWords = () => {
    const lines = inputText.split('\n');
    const converted = lines.map(line => {
      const words = line.split(/\s+/);
      const uniqueWords: string[] = [];
      const seen = new Set<string>();
      for (const word of words) {
        const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (word === '' || normalized === '' || !seen.has(normalized)) {
          if (normalized !== '') seen.add(normalized);
          uniqueWords.push(word);
        }
      }
      return uniqueWords.join(' ');
    }).join('\n');
    updateText(converted, 'Removed Duplicate Words');
  };

  const removeCommas = () => {
    const converted = inputText.replace(/,/g, '');
    updateText(converted, 'Removed All Commas');
  };

  const handleFindReplace = () => {
    if (!searchQuery) return;
    const flags = caseSensitiveSearch ? 'g' : 'gi';
    // Escapes regex special characters
    const escapedSearch = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedSearch, flags);
    const converted = inputText.replace(regex, replaceQuery);
    updateText(converted, `Replaced "${searchQuery}" with "${replaceQuery}"`);
  };

  const applyPrefixSuffix = () => {
    if (!linePrefix && !lineSuffix) return;
    const converted = inputText
      .split('\n')
      .map(line => `${linePrefix}${line}${lineSuffix}`)
      .join('\n');
    updateText(converted, 'Applied Prefix/Suffix line vectors');
  };

  const applyWordWrap = () => {
    if (wrapLimit <= 0) return;
    const lines = inputText.split('\n');
    const wrappedLines: string[] = [];

    lines.forEach(line => {
      let currentLine = line;
      while (currentLine.length > wrapLimit) {
        // Find closest space before limit
        let spaceIdx = currentLine.lastIndexOf(' ', wrapLimit);
        if (spaceIdx === -1) spaceIdx = wrapLimit; // force midword splitting if zero spaces
        
        wrappedLines.push(currentLine.substring(0, spaceIdx));
        currentLine = currentLine.substring(spaceIdx).trim();
      }
      wrappedLines.push(currentLine);
    });

    updateText(wrappedLines.join('\n'), `Hard wrapped lines at ${wrapLimit} characters`);
  };

  const handleUrlEncode = () => {
    try {
      updateText(encodeURIComponent(inputText), 'Encoded URL Component');
    } catch (_) {
      triggerSuccessMessage('Failed to URL Encode');
    }
  };

  const handleUrlDecode = () => {
    try {
      updateText(decodeURIComponent(inputText), 'Decoded URL Component');
    } catch (_) {
      triggerSuccessMessage('Failed to URL Decode');
    }
  };

  return (
    <div className="space-y-6" id="apex-case-converter-section">
      {/* Tool Header Status Plate */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-zinc-950/40 border border-brand-border/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-brand/10 text-brand">
              <Type className="w-4 h-4" />
            </span>
            <h2 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              {t.navigation.caseConverter}
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            {t.navigation.caseConverterDesc}
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadSampleText}
            id="case-conv-load-sample"
            className="px-2.5 py-1.5 text-[10px] font-mono tracking-wider text-zinc-400 hover:text-brand bg-zinc-900 border border-zinc-800 hover:border-brand/35 rounded transition-all cursor-pointer inline-flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-brand" />
            <span>LOAD SAMPLE</span>
          </button>
          
          <button
            type="button"
            onClick={handleClear}
            id="case-conv-clear"
            className="px-2.5 py-1.5 text-[10px] font-mono tracking-wider text-zinc-500 hover:text-rose-400 bg-zinc-900 border border-zinc-800 hover:border-rose-950/40 rounded transition-all cursor-pointer inline-flex items-center gap-1"
            title="Clear Workspace"
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Play workspace text column: 8cols */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative rounded-lg border border-brand-border/35 bg-zinc-950/20 overflow-hidden">
            {/* Header toolbar for clipboard / state */}
            <div className="px-4 py-2 bg-[#0a0a0c] border-b border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500 select-none">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-brand" />
                <span>WORKSPACE SOURCE ENGINE</span>
                {successMsg && (
                  <span className="ml-2 text-emerald-400 font-bold flex items-center gap-0.5 animate-pulse">
                    <CheckCircle className="w-3 h-3" />
                    <span>[{successMsg.toUpperCase()}]</span>
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900">
                  <span>Chars:</span>
                  <span className="text-zinc-300 font-bold">{stats.charsWithSpaces}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900">
                  <span>Words:</span>
                  <span className="text-zinc-300 font-bold">{stats.words}</span>
                </div>
              </div>
            </div>

            {/* Main Interactive Formatting Text Area */}
            <textarea
              id="case-converter-text-area"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                // Save state to undo buffer only on brief typing breaks or first character
                if (textHistory.length === 0 || Math.abs(inputText.length - e.target.value.length) > 10) {
                  pushToHistory(e.target.value);
                }
              }}
              className="w-full h-80 px-4 py-3 bg-transparent text-white text-xs font-mono outline-none placeholder-zinc-600 resize-y border-none focus:ring-0"
              placeholder="Paste or write your documents layers, copywriting records, code syntaxes, or list here..."
            />

            {/* Instant workspace footer shortcuts */}
            <div className="px-4 py-2 border-t border-zinc-900/60 bg-[#070709] flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className={`px-1.5 py-0.5 rounded ${historyIndex <= 0 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:bg-zinc-800'}`}
                >
                  [Undo]
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={historyIndex >= textHistory.length - 1}
                  className={`px-1.5 py-0.5 rounded ${historyIndex >= textHistory.length - 1 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:bg-zinc-800'}`}
                >
                  [Redo]
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!inputText}
                  onClick={handleCopy}
                  id="case-conv-action-copy"
                  className={`px-2.5 py-1 rounded inline-flex items-center gap-1 transition-all font-sans font-bold cursor-pointer ${
                    copied
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50'
                      : 'bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED!' : 'COPY TO CLIPBOARD'}</span>
                </button>

                <button
                  type="button"
                  disabled={!inputText}
                  onClick={handleDownload}
                  id="case-conv-action-download"
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded inline-flex items-center gap-1 transition-all font-sans font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT TXT</span>
                </button>
              </div>
            </div>
          </div>

          {/* Granular grid configurations panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quick Find & Replace */}
            <div className="p-4 rounded-lg bg-zinc-950/30 border border-zinc-900 space-y-3">
              <div className="flex items-center gap-1.5 font-heading text-[10px] uppercase font-bold text-zinc-400">
                <ArrowRightLeft className="w-3.5 h-3.5 text-brand" />
                <span>Search and Replace</span>
              </div>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Find pattern..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2 py-1.5 text-[11px] font-mono bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded text-white outline-none focus:border-brand/40"
                />
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  className="w-full px-2 py-1.5 text-[11px] font-mono bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded text-white outline-none focus:border-brand/40"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={caseSensitiveSearch}
                    onChange={(e) => setCaseSensitiveSearch(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-800 text-brand focus:ring-0 w-3 h-3"
                  />
                  <span>Match Case</span>
                </label>
                <button
                  type="button"
                  onClick={handleFindReplace}
                  disabled={!inputText || !searchQuery}
                  className="px-2 py-1 text-[9px] font-bold uppercase rounded bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  REPLACE ALL
                </button>
              </div>
            </div>

            {/* Line Prefix & Suffix */}
            <div className="p-4 rounded-lg bg-zinc-950/30 border border-zinc-900 space-y-3">
              <div className="flex items-center gap-1.5 font-heading text-[10px] uppercase font-bold text-zinc-400">
                <LayoutList className="w-3.5 h-3.5 text-brand" />
                <span>Line Prefix / Suffix</span>
              </div>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Prefix (e.g. - or * )"
                  value={linePrefix}
                  onChange={(e) => setLinePrefix(e.target.value)}
                  className="w-full px-2 py-1.5 text-[11px] font-mono bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded text-white outline-none focus:border-brand/40"
                />
                <input
                  type="text"
                  placeholder="Suffix (e.g. , or ; )"
                  value={lineSuffix}
                  onChange={(e) => setLineSuffix(e.target.value)}
                  className="w-full px-2 py-1.5 text-[11px] font-mono bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded text-white outline-none focus:border-brand/40"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={applyPrefixSuffix}
                  disabled={!inputText || (!linePrefix && !lineSuffix)}
                  className="px-2 py-1 text-[9px] font-bold uppercase rounded bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-all cursor-pointer disabled:opacity-40"
                >
                  APPLY VECTORS
                </button>
              </div>
            </div>

            {/* Wrap Metrics & Cleaning */}
            <div className="p-4 rounded-lg bg-zinc-950/30 border border-zinc-900 space-y-3">
              <div className="flex items-center gap-1.5 font-heading text-[10px] uppercase font-bold text-zinc-400">
                <AlignLeft className="w-3.5 h-3.5 text-brand" />
                <span>Hard Word Wrap</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 font-mono block">Max line width (characters)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={wrapLimit}
                    onChange={(e) => setWrapLimit(parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1.5 text-[11px] font-mono bg-zinc-950 border border-zinc-800 rounded text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={applyWordWrap}
                    disabled={!inputText || wrapLimit <= 0}
                    className="flex-1 py-1.5 text-[9px] font-bold uppercase rounded bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-all cursor-pointer"
                  >
                    WRAP NOW
                  </button>
                </div>
              </div>
              <div className="pt-2 border-t border-zinc-900 flex justify-between gap-1 text-[8.5px] font-mono text-zinc-400">
                <button 
                  type="button" 
                  onClick={handleUrlEncode} 
                  disabled={!inputText} 
                  className="hover:text-brand transition-colors"
                >
                  [URL ENCODE]
                </button>
                <button 
                  type="button" 
                  onClick={handleUrlDecode} 
                  disabled={!inputText} 
                  className="hover:text-brand transition-colors"
                >
                  [URL DECODE]
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transformer selection actions: 4cols */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Case Conversions Action Box */}
          <div className="p-5 rounded-lg border border-zinc-800 bg-[#08080a] space-y-4">
            <h3 className="font-heading font-bold text-xs text-zinc-200 tracking-wider uppercase border-b border-zinc-900 pb-2 flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-brand" />
              <span>CASE TRANSFORMS</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={toUpperCase}
                disabled={!inputText}
                className="p-2 text-left rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all cursor-pointer text-xs text-zinc-300 font-medium hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="block text-[8px] font-mono text-zinc-500 mb-0.5">HELL0 WORLD</span>
                <span>UPPERCASE</span>
              </button>

              <button
                type="button"
                onClick={toLowerCase}
                disabled={!inputText}
                className="p-2 text-left rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all cursor-pointer text-xs text-zinc-300 font-medium hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="block text-[8px] font-mono text-zinc-500 mb-0.5">hello world</span>
                <span>lowercase</span>
              </button>

              <button
                type="button"
                onClick={toTitleCase}
                disabled={!inputText}
                className="p-2 text-left rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all cursor-pointer text-xs text-zinc-300 font-medium hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="block text-[8px] font-mono text-zinc-500 mb-0.5">Hello World</span>
                <span>Title Case</span>
              </button>

              <button
                type="button"
                onClick={toSentenceCase}
                disabled={!inputText}
                className="p-2 text-left rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all cursor-pointer text-xs text-zinc-300 font-medium hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="block text-[8px] font-mono text-zinc-500 mb-0.5">Hello world.</span>
                <span>Sentence case</span>
              </button>

              <button
                type="button"
                onClick={toCamelCase}
                disabled={!inputText}
                className="p-2 text-left rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all cursor-pointer text-xs text-zinc-300 font-medium hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="block text-[8px] font-mono text-zinc-500 mb-0.5">helloWorld</span>
                <span>camelCase</span>
              </button>

              <button
                type="button"
                onClick={toPascalCase}
                disabled={!inputText}
                className="p-2 text-left rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all cursor-pointer text-xs text-zinc-300 font-medium hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="block text-[8px] font-mono text-zinc-500 mb-0.5">HelloWorld</span>
                <span>PascalCase</span>
              </button>

              <button
                type="button"
                onClick={toKebabCase}
                disabled={!inputText}
                className="p-2 text-left rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all cursor-pointer text-xs text-zinc-300 font-medium hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="block text-[8px] font-mono text-zinc-500 mb-0.5">hello-world</span>
                <span>kebab-case</span>
              </button>

              <button
                type="button"
                onClick={toSnakeCase}
                disabled={!inputText}
                className="p-2 text-left rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all cursor-pointer text-xs text-zinc-300 font-medium hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="block text-[8px] font-mono text-zinc-500 mb-0.5">hello_world</span>
                <span>snake_case</span>
              </button>

              <button
                type="button"
                onClick={toSlugCase}
                disabled={!inputText}
                className="p-2 text-left rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all cursor-pointer text-xs text-zinc-300 font-medium hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="block text-[8px] font-mono text-zinc-500 mb-0.5">hello-world-slug</span>
                <span>Web Slug</span>
              </button>

              <button
                type="button"
                onClick={toDotCase}
                disabled={!inputText}
                className="p-2 text-left rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all cursor-pointer text-xs text-zinc-300 font-medium hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="block text-[8px] font-mono text-zinc-500 mb-0.5">hello.world</span>
                <span>Dot Case</span>
              </button>

              <button
                type="button"
                onClick={toToggleCase}
                disabled={!inputText}
                className="p-2 text-left rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all cursor-pointer text-xs text-zinc-300 font-medium hover:text-white disabled:opacity-40"
              >
                <span className="block text-[8px] font-mono text-zinc-500 mb-0.5">hELLO wORLD</span>
                <span>tOgGlE cAsE</span>
              </button>

              <button
                type="button"
                onClick={toRandomCase}
                disabled={!inputText}
                className="p-2 text-left rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all cursor-pointer text-xs text-zinc-300 font-medium hover:text-white disabled:opacity-40"
              >
                <span className="block text-[8px] font-mono text-zinc-500 mb-0.5">hElLo wOrLd</span>
                <span>Random case</span>
              </button>
            </div>
          </div>

          {/* Cleaning modifiers action block */}
          <div className="p-5 rounded-lg border border-zinc-800 bg-[#08080a] space-y-4">
            <h3 className="font-heading font-bold text-xs text-zinc-200 tracking-wider uppercase border-b border-zinc-900 pb-2 flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-brand" />
              <span>TEXT CLEANING UTILITIES</span>
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={trimWhitespaces}
                disabled={!inputText}
                className="w-full p-2 text-left text-xs bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-zinc-300 rounded transition-all cursor-pointer hover:text-white hover:bg-zinc-900/30 flex items-center justify-between"
              >
                <span>Trim leading/trailing spacing</span>
                <span className="text-[10px] text-zinc-600 font-mono">[TRIM]</span>
              </button>

              <button
                type="button"
                onClick={removeMultipleSpaces}
                disabled={!inputText}
                className="w-full p-2 text-left text-xs bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-zinc-300 rounded transition-all cursor-pointer hover:text-white hover:bg-zinc-900/30 flex items-center justify-between"
              >
                <span>Collapse multi-double spaces</span>
                <span className="text-[10px] text-zinc-600 font-mono">[SINGLE SPACE]</span>
              </button>

              <button
                type="button"
                onClick={stripHtmlTags}
                disabled={!inputText}
                className="w-full p-2 text-left text-xs bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-zinc-300 rounded transition-all cursor-pointer hover:text-white hover:bg-zinc-900/30 flex items-center justify-between"
              >
                <span>Strip all tags (`&lt;html&gt;`, XML)</span>
                <span className="text-[10px] text-zinc-600 font-mono">[HTML CLEAN]</span>
              </button>

              <button
                type="button"
                onClick={removeEmptyLines}
                disabled={!inputText}
                className="w-full p-2 text-left text-xs bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-zinc-300 rounded transition-all cursor-pointer hover:text-white hover:bg-zinc-900/30 flex items-center justify-between"
              >
                <span>Strip empty blank lines</span>
                <span className="text-[10px] text-zinc-600 font-mono">[COMPACT lines]</span>
              </button>

              <button
                type="button"
                onClick={removeDuplicateLines}
                disabled={!inputText}
                className="w-full p-2 text-left text-xs bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-zinc-300 rounded transition-all cursor-pointer hover:text-white hover:bg-zinc-900/30 flex items-center justify-between"
              >
                <span>Remove duplicate lines</span>
                <span className="text-[10px] text-brand font-mono font-bold">[DUP LINES]</span>
              </button>

              <button
                type="button"
                onClick={removeDuplicateWords}
                disabled={!inputText}
                className="w-full p-2 text-left text-xs bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-zinc-300 rounded transition-all cursor-pointer hover:text-white hover:bg-zinc-900/30 flex items-center justify-between"
              >
                <span>Remove duplicate words</span>
                <span className="text-[10px] text-brand font-mono font-bold">[DUP WORDS]</span>
              </button>

              <button
                type="button"
                onClick={removeCommas}
                disabled={!inputText}
                className="w-full p-2 text-left text-xs bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-zinc-300 rounded transition-all cursor-pointer hover:text-white hover:bg-zinc-900/30 flex items-center justify-between"
              >
                <span>Strip all commas (`,`)</span>
                <span className="text-[10px] text-zinc-650 font-mono">[NO COMMAS]</span>
              </button>
            </div>
          </div>

          {/* Live lexical and analytics panel */}
          <div className="p-5 rounded-lg border border-zinc-800 bg-[#08080a] space-y-4">
            <h3 className="font-heading font-bold text-xs text-zinc-200 tracking-wider uppercase border-b border-zinc-900 pb-2 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-brand" />
              <span>LEXICAL ANALYSIS METRICS</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-900">
                <span className="block text-[9px] font-mono text-zinc-500 uppercase">Chars (Raw)</span>
                <span className="text-sm font-bold text-zinc-200">{stats.charsWithSpaces}</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-900">
                <span className="block text-[9px] font-mono text-zinc-500 uppercase">Chars (No space)</span>
                <span className="text-sm font-bold text-zinc-200">{stats.charsNoSpaces}</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-900">
                <span className="block text-[9px] font-mono text-zinc-500 uppercase">Total Words</span>
                <span className="text-sm font-bold text-zinc-200">{stats.words}</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-900">
                <span className="block text-[9px] font-mono text-zinc-500 uppercase">Lines</span>
                <span className="text-sm font-bold text-zinc-200">{stats.lines}</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-900">
                <span className="block text-[9px] font-mono text-zinc-500 uppercase">Paragraphs</span>
                <span className="text-sm font-bold text-zinc-200">{stats.paragraphs}</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-900">
                <span className="block text-[9px] font-mono text-zinc-500 uppercase">Read Time</span>
                <span className="text-sm font-bold text-zinc-200">{stats.readingTimeSec}s</span>
              </div>
            </div>

            {/* Character frequency map indicator */}
            {stats.frequencyMap.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-900">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Character Weight Index</span>
                <div className="space-y-1.5">
                  {stats.frequencyMap.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="w-4 text-zinc-400 font-bold">{item.char}</span>
                      <div className="flex-1 bg-zinc-950 rounded h-1.5 overflow-hidden border border-zinc-900">
                        <div 
                          className="bg-brand h-full rounded transition-all duration-500"
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-zinc-500">{item.count} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCode, ArrowRight, ArrowLeft, RefreshCw, Layers, ShieldCheck, CheckCircle,
  AlertCircle, Copy, Search, Play, Trash2, GitPullRequest, Info, Eye, EyeOff
} from 'lucide-react';
import { addRecentOperation } from '../utils/recentOperations';

interface SideBySideLine {
  leftNo?: number;
  leftText: string;
  leftType: 'equal' | 'removed' | 'modified' | 'empty';

  rightNo?: number;
  rightText: string;
  rightType: 'equal' | 'added' | 'modified' | 'empty';
}

const SAMPLE_PRESETS = [
  {
    name: 'Simple API Response',
    left: JSON.stringify({
      status: 'ok',
      code: 200,
      data: {
        id: 'user_90192',
        username: 'apex_commander',
        email: 'commander@apex-suite.io',
        role: 'operator',
        active: true,
        features: ['pdf-forge', 'media-lab', 'seo-crawler']
      },
      meta: {
        timestamp: '2026-06-06T12:00:00Z',
        version: 'v2.1.0'
      }
    }, null, 2),
    right: JSON.stringify({
      status: 'ok',
      code: 200,
      data: {
        id: 'user_90192',
        username: 'apex_operator_core', // modified
        email: 'commander@apex-suite.io',
        role: 'administrator', // modified
        active: true,
        mfa_enabled: true, // added
        features: ['pdf-forge', 'media-lab', 'seo-crawler', 'json-diff'] // added item
      },
      meta: {
        timestamp: '2026-06-06T18:15:38Z', // modified
        version: 'v2.2.0' // modified
      }
    }, null, 2)
  },
  {
    name: 'System Config Drift',
    left: JSON.stringify({
      environment: 'staging',
      port: 3000,
      db: {
        host: 'postgres-stage.internal',
        pool_size: 10,
        ssl: true
      },
      services: {
        cache: 'redis://localhost:6379',
        search: 'elasticsearch://localhost:9200'
      },
      debug_mode: true
    }, null, 2),
    right: JSON.stringify({
      environment: 'production', // modified
      port: 8080, // modified
      db: {
        host: 'postgres-prod.gcp.internal', // modified
        pool_size: 50, // modified
        ssl: true,
        timeout_ms: 5000 // added
      },
      // services search removed
      services: {
        cache: 'redis://redis-cluster-prod:6379' // modified
      },
      debug_mode: false, // modified
      canary_deploy: true // added
    }, null, 2)
  }
];

export default function JSONDiffChecker() {
  const [leftInput, setLeftInput] = useState<string>('');
  const [rightInput, setRightInput] = useState<string>('');
  const [leftValid, setLeftValid] = useState<boolean | null>(null);
  const [rightValid, setRightValid] = useState<boolean | null>(null);
  const [leftError, setLeftError] = useState<string | null>(null);
  const [rightError, setRightError] = useState<string | null>(null);
  const [diffLines, setDiffLines] = useState<SideBySideLine[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stats, setStats] = useState({ additions: 0, deletions: 0, modifications: 0, total: 0 });
  const [notif, setNotif] = useState<{ text: string; mode: 'success' | 'info' | 'error' } | null>(null);

  // Initialize with sample pre-load
  useEffect(() => {
    loadPreset(0);
  }, []);

  const triggerNotif = (text: string, mode: 'success' | 'info' | 'error' = 'success') => {
    setNotif({ text, mode });
    setTimeout(() => setNotif(null), 3000);
  };

  const loadPreset = (idx: number) => {
    const p = SAMPLE_PRESETS[idx];
    setLeftInput(p.left);
    setRightInput(p.right);
    validateAndCompute(p.left, p.right);
    triggerNotif(`Loaded test preset: ${p.name}`, 'info');
  };

  const validateJson = (str: string): { isValid: boolean; error: string | null; formatted: string } => {
    if (!str.trim()) {
      return { isValid: false, error: 'Empty payload provided', formatted: '' };
    }
    try {
      const parsed = JSON.parse(str);
      const formatted = JSON.stringify(parsed, null, 2);
      return { isValid: true, error: null, formatted };
    } catch (e: any) {
      return { isValid: false, error: e.message || 'Malformed JSON string', formatted: str };
    }
  };

  const beautifyPane = (side: 'left' | 'right') => {
    const input = side === 'left' ? leftInput : rightInput;
    const res = validateJson(input);
    if (res.isValid) {
      if (side === 'left') {
        setLeftInput(res.formatted);
        validateAndCompute(res.formatted, rightInput);
      } else {
        setRightInput(res.formatted);
        validateAndCompute(leftInput, res.formatted);
      }
      triggerNotif(`Formatted ${side === 'left' ? 'Original' : 'Modified'} JSON successfully.`, 'success');
    } else {
      triggerNotif(`Cannot formatted invalid JSON on ${side}.`, 'error');
    }
  };

  const minifyPane = (side: 'left' | 'right') => {
    const input = side === 'left' ? leftInput : rightInput;
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      if (side === 'left') {
        setLeftInput(minified);
        validateAndCompute(minified, rightInput);
      } else {
        setRightInput(minified);
        validateAndCompute(leftInput, minified);
      }
      triggerNotif(`Minified ${side} JSON successfully.`, 'success');
    } catch (e: any) {
      triggerNotif(`Minification error: ${e.message}`, 'error');
    }
  };

  const swapInputs = () => {
    const tempLeft = leftInput;
    const tempRight = rightInput;
    setLeftInput(tempRight);
    setRightInput(tempLeft);
    validateAndCompute(tempRight, tempLeft);
    triggerNotif('Swapped comparison inputs.', 'info');
  };

  const clearInputs = () => {
    setLeftInput('');
    setRightInput('');
    setLeftValid(null);
    setRightValid(null);
    setLeftError(null);
    setRightError(null);
    setDiffLines([]);
    setStats({ additions: 0, deletions: 0, modifications: 0, total: 0 });
    triggerNotif('Comparison panels cleared.', 'info');
  };

  const validateAndCompute = (left: string, right: string) => {
    const cleanLeft = left.trim();
    const cleanRight = right.trim();

    const leftValResult = validateJson(cleanLeft);
    const rightValResult = validateJson(cleanRight);

    setLeftValid(leftValResult.isValid);
    setLeftError(leftValResult.error);
    setRightValid(rightValResult.isValid);
    setRightError(rightValResult.error);

    if (!leftValResult.isValid || !rightValResult.isValid) {
      setDiffLines([]);
      return;
    }

    const leftLines = leftValResult.formatted.split('\n');
    const rightLines = rightValResult.formatted.split('\n');

    // LCS-based dynamic programming alignment
    const computed = runDiffLCS(leftLines, rightLines);
    setDiffLines(computed);

    // Compute stats
    let additions = 0;
    let deletions = 0;
    let modifications = 0;

    computed.forEach(line => {
      if (line.leftType === 'modified' && line.rightType === 'modified') {
        modifications++;
      } else if (line.leftType === 'removed') {
        deletions++;
      } else if (line.rightType === 'added') {
        additions++;
      }
    });

    setStats({
      additions,
      deletions,
      modifications,
      total: computed.length
    });

    // Register into recent operation logs
    addRecentOperation(
      'JSON Structural Diff',
      'Data Beautifier' as any,
      'Compared two JSON objects',
      `Changes: +${additions} | -${deletions} | ~${modifications}`,
      'N/A',
      ''
    );
    window.dispatchEvent(new Event('apex_recent_ops_updated'));
  };

  const runDiffLCS = (leftLines: string[], rightLines: string[]): SideBySideLine[] => {
    const m = leftLines.length;
    const n = rightLines.length;

    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (leftLines[i - 1] === rightLines[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const aligned: SideBySideLine[] = [];
    let i = m;
    let j = n;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
        aligned.unshift({
          leftNo: i,
          leftText: leftLines[i - 1],
          leftType: 'equal',
          rightNo: j,
          rightText: rightLines[j - 1],
          rightType: 'equal'
        });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        aligned.unshift({
          rightNo: j,
          rightText: rightLines[j - 1],
          rightType: 'added',
          leftText: '',
          leftType: 'empty'
        });
        j--;
      } else {
        aligned.unshift({
          leftNo: i,
          leftText: leftLines[i - 1],
          leftType: 'removed',
          rightText: '',
          rightType: 'empty'
        });
        i--;
      }
    }

    // Direct substitutions aggregation (merging consecutive removed->added pairs as 'modified')
    const refined: SideBySideLine[] = [];
    for (let k = 0; k < aligned.length; k++) {
      const current = aligned[k];
      const next = aligned[k + 1];

      if (
        current.leftType === 'removed' &&
        current.rightType === 'empty' &&
        next &&
        next.leftType === 'empty' &&
        next.rightType === 'added'
      ) {
        refined.push({
          leftNo: current.leftNo,
          leftText: current.leftText,
          leftType: 'modified',
          rightNo: next.rightNo,
          rightText: next.rightText,
          rightType: 'modified'
        });
        k++;
      } else {
        refined.push(current);
      }
    }

    return refined;
  };

  const handleCopyDiffJson = () => {
    // Generate unified text representation of modifications
    const out = diffLines.map(line => {
      if (line.leftType === 'removed') return `- L${line.leftNo}: ${line.leftText}`;
      if (line.rightType === 'added') return `+ R${line.rightNo}: ${line.rightText}`;
      if (line.leftType === 'modified') return `~ L${line.leftNo} vs R${line.rightNo}: ${line.leftText} ---> ${line.rightText}`;
      return `  L${line.leftNo}: ${line.leftText}`;
    }).join('\n');

    navigator.clipboard.writeText(out);
    triggerNotif('Copied structural diff details to clipboard!', 'success');
  };

  const handleInputChange = (side: 'left' | 'right', val: string) => {
    if (side === 'left') {
      setLeftInput(val);
      validateAndCompute(val, rightInput);
    } else {
      setRightInput(val);
      validateAndCompute(leftInput, val);
    }
  };

  const filteredDiffLines = diffLines.filter(line => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      line.leftText.toLowerCase().includes(term) ||
      line.rightText.toLowerCase().includes(term)
    );
  });

  return (
    <div id="json-diff-workspace" className="space-y-6 select-none max-w-full overflow-hidden">
      
      {/* Toast Alert Frame */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border font-mono text-xs shadow-2xl flex items-center gap-3 backdrop-blur-md ${
              notif.mode === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-300'
                : notif.mode === 'error'
                ? 'bg-rose-950/95 border-rose-500/30 text-rose-300'
                : 'bg-zinc-950/95 border-zinc-500/30 text-zinc-300'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{notif.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Presets Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/50 p-4 rounded-xl border border-zinc-900">
        <div className="flex items-center gap-3">
          <GitPullRequest className="w-5 h-5 text-brand animate-pulse shrink-0" />
          <div>
            <h3 className="font-heading text-xs font-bold text-zinc-300 tracking-wider uppercase">Active JSON Comparison Presets</h3>
            <p className="text-[10px] text-zinc-500 font-mono">Load drift templates to evaluate modifications instantly</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => loadPreset(idx)}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-850 text-[10px] font-mono text-zinc-300 font-bold transition-all cursor-pointer"
            >
              🚀 {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Structural Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Input Block: Original JSON */}
        <div className="beveled-panel p-5 border-brand-border/30 bg-[#07070a]/80 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-heading text-[11px] font-bold text-amber-500 tracking-wider uppercase">Original Object (Left Panel)</h3>
            </div>
            
            <div className="flex items-center gap-1.5">
              {leftValid === true && (
                <span className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/25 text-emerald-400 text-[8px] font-mono uppercase font-bold">
                  VALID JSON
                </span>
              )}
              {leftValid === false && (
                <span className="px-2 py-0.5 rounded bg-rose-950/50 border border-rose-500/25 text-rose-400 text-[8px] font-mono uppercase font-bold" title={leftError || ''}>
                  PARSING FAIL
                </span>
              )}
              <button
                onClick={() => beautifyPane('left')}
                className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-850 text-[9px] font-mono font-bold cursor-pointer transition-all"
                title="Format JSON with beauties spacing"
              >
                Format
              </button>
              <button
                onClick={() => minifyPane('left')}
                className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-850 text-[9px] font-mono font-bold cursor-pointer transition-all"
                title="Minify JSON structure"
              >
                Minify
              </button>
            </div>
          </div>

          <textarea
            value={leftInput}
            onChange={(e) => handleInputChange('left', e.target.value)}
            placeholder='Paste original JSON object here... e.g.: {"id": 1, "status": "active"}'
            className="w-full h-[180px] bg-zinc-950/80 text-zinc-300 text-xs font-mono p-4 rounded-xl border border-zinc-905 focus:outline-none focus:border-brand/40 placeholder-zinc-700 resize-none"
          />

          {leftError && (
            <div className="flex items-start gap-2 text-rose-400 font-mono text-[9px] bg-rose-950/10 border border-rose-500/10 p-2 rounded-lg leading-normal">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span>{leftError}</span>
            </div>
          )}
        </div>

        {/* Right Input Block: Modified JSON */}
        <div className="beveled-panel p-5 border-brand-border/30 bg-[#07070a]/80 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-heading text-[11px] font-bold text-emerald-400 tracking-wider uppercase">Modified Object (Right Panel)</h3>
            </div>

            <div className="flex items-center gap-1.5">
              {rightValid === true && (
                <span className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/25 text-emerald-400 text-[8px] font-mono uppercase font-bold">
                  VALID JSON
                </span>
              )}
              {rightValid === false && (
                <span className="px-2 py-0.5 rounded bg-rose-950/50 border border-rose-500/25 text-rose-400 text-[8px] font-mono uppercase font-bold" title={rightError || ''}>
                  PARSING FAIL
                </span>
              )}
              <button
                onClick={() => beautifyPane('right')}
                className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-850 text-[9px] font-mono font-bold cursor-pointer transition-all"
                title="Format JSON with beauties spacing"
              >
                Format
              </button>
              <button
                onClick={() => minifyPane('right')}
                className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-850 text-[9px] font-mono font-bold cursor-pointer transition-all"
                title="Minify JSON structure"
              >
                Minify
              </button>
            </div>
          </div>

          <textarea
            value={rightInput}
            onChange={(e) => handleInputChange('right', e.target.value)}
            placeholder='Paste modified JSON object here... e.g.: {"id": 1, "status": "suspended", "mfa": true}'
            className="w-full h-[180px] bg-zinc-950/80 text-zinc-300 text-xs font-mono p-4 rounded-xl border border-zinc-905 focus:outline-none focus:border-brand/40 placeholder-zinc-700 resize-none"
          />

          {rightError && (
            <div className="flex items-start gap-2 text-rose-400 font-mono text-[9px] bg-rose-950/10 border border-rose-500/10 p-2 rounded-lg leading-normal">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span>{rightError}</span>
            </div>
          )}
        </div>

      </div>

      {/* Global Command Center Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-950/30 p-3 rounded-xl border border-zinc-900">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={swapInputs}
            className="p-2 rounded-xl border border-zinc-850 hover:border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-300 text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer"
            title="Swap original and modified source texts"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Swap Panels</span>
          </button>
          
          <button
            onClick={clearInputs}
            className="p-2 rounded-xl border border-zinc-850 hover:border-rose-500/20 bg-zinc-950 text-zinc-550 hover:text-rose-450 text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer"
            title="Clear current comparison text inputs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Panels</span>
          </button>
        </div>

        {/* Global Statistics Counter Indicators */}
        {diffLines.length > 0 && (
          <div className="flex items-center gap-3.5 select-none text-[10px] font-mono leading-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[8px]">+</span>
              <span className="text-zinc-400 font-bold">{stats.additions} Additions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center font-bold text-[8px]">-</span>
              <span className="text-zinc-400 font-bold">{stats.deletions} Deletions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-[8px]">~</span>
              <span className="text-zinc-400 font-bold">{stats.modifications} Modifications</span>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Display Grid */}
      <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/90 space-y-4">
        
        {/* Header Toolbar inside display */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/10 pb-4 select-none">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand animate-pulse" />
            <h3 className="font-heading text-xs font-bold text-zinc-300 tracking-wider uppercase">Visual Diff Engine Monitor</h3>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Realtime filter input */}
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-650" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter lines containing key or value..."
                className="w-full md:w-[240px] pl-9 pr-3 py-1.5 bg-zinc-950 rounded-lg border border-zinc-900 focus:outline-none focus:border-brand/40 text-xs font-mono text-zinc-300 placeholder-zinc-700"
              />
            </div>
            {diffLines.length > 0 && (
              <button
                onClick={handleCopyDiffJson}
                className="p-1.5 rounded-lg border border-zinc-850 hover:border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-300 transition-all cursor-pointer"
                title="Copy structural comparison reports"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Empty list template indicator */}
        {diffLines.length === 0 ? (
          <div className="text-center py-16 bg-zinc-950/40 rounded-xl border border-zinc-900 border-dashed select-none">
            <GitPullRequest className="w-12 h-12 text-zinc-800 mx-auto mb-3.5 stroke-1" />
            <span className="text-[10px] font-mono text-zinc-650 uppercase block font-semibold">Diff Workspace Silent</span>
            <p className="text-[9px] text-zinc-700 max-w-[280px] mx-auto leading-normal pt-1.5 font-sans">
              Provide valid JSON objects inside the panels above to activate the visual diff calculation engine instantly.
            </p>
          </div>
        ) : (
          /* Side-by-Side Comparison Output Tables */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-900 overflow-x-auto">
            
            {/* Left side: Original aligned display rendering */}
            <div className="space-y-1.5 pr-0 lg:pr-2 max-h-[480px] overflow-y-auto scrollbar-thin">
              <div className="bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-900 text-[9px] font-mono text-zinc-550 flex items-center justify-between sticky top-0 z-10">
                <span>ORIGINAL JSON SCHEMA</span>
                <span>PANEL L</span>
              </div>
              <div className="font-mono text-xs space-y-0.5 select-text">
                {filteredDiffLines.map((line, idx) => {
                  const isRemoved = line.leftType === 'removed';
                  const isModified = line.leftType === 'modified';
                  const isEmpty = line.leftType === 'empty';

                  return (
                    <div
                      key={`left-${idx}`}
                      className={`flex items-stretch min-h-[22px] rounded border-l-2 transition-all duration-150 ${
                        isRemoved
                          ? 'bg-red-950/30 border-red-500/60 text-red-200 hover:bg-red-950/45'
                          : isModified
                          ? 'bg-amber-950/20 border-amber-500/50 text-amber-250 hover:bg-amber-950/35'
                          : isEmpty
                          ? 'opacity-25 border-transparent pointer-events-none'
                          : 'border-transparent text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'
                      }`}
                    >
                      {/* Line Number indicator column */}
                      <div className="w-10 text-right pr-3 text-[10px] text-zinc-600 shrink-0 select-none border-r border-zinc-900/50 py-0.5 bg-zinc-950/40">
                        {line.leftNo || ''}
                      </div>
                      {/* Text content render */}
                      <pre className="pl-4 py-0.5 overflow-x-auto whitespace-pre-wrap break-all leading-normal flex-1 font-mono text-[11px] leading-relaxed">
                        {isEmpty ? ' ' : line.leftText}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Modified aligned display rendering */}
            <div className="space-y-1.5 pt-4 lg:pt-0 pl-0 lg:pl-6 max-h-[480px] overflow-y-auto scrollbar-thin">
              <div className="bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-900 text-[9px] font-mono text-zinc-550 flex items-center justify-between sticky top-0 z-10">
                <span>MODIFIED DRIFT VALUES</span>
                <span>PANEL R</span>
              </div>
              <div className="font-mono text-xs space-y-0.5 select-text font-semibold">
                {filteredDiffLines.map((line, idx) => {
                  const isAdded = line.rightType === 'added';
                  const isModified = line.rightType === 'modified';
                  const isEmpty = line.rightType === 'empty';

                  return (
                    <div
                      key={`right-${idx}`}
                      className={`flex items-stretch min-h-[22px] rounded border-l-2 transition-all duration-150 ${
                        isAdded
                          ? 'bg-emerald-950/35 border-emerald-500/60 text-emerald-200 hover:bg-emerald-950/50'
                          : isModified
                          ? 'bg-amber-950/20 border-amber-500/50 text-amber-250 hover:bg-amber-950/35'
                          : isEmpty
                          ? 'opacity-25 border-transparent pointer-events-none'
                          : 'border-transparent text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'
                      }`}
                    >
                      {/* Line Number indicator column */}
                      <div className="w-10 text-right pr-3 text-[10px] text-zinc-600 shrink-0 select-none border-r border-zinc-900/50 py-0.5 bg-zinc-950/40">
                        {line.rightNo || ''}
                      </div>
                      {/* Text content render */}
                      <pre className="pl-4 py-0.5 overflow-x-auto whitespace-pre-wrap break-all leading-normal flex-1 font-mono text-[11px] leading-relaxed">
                        {isEmpty ? ' ' : line.rightText}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

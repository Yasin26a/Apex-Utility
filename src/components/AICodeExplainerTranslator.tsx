import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  Code2, 
  FileCode, 
  HelpCircle, 
  ArrowRightLeft, 
  ArrowRight, 
  AlertTriangle, 
  Cpu, 
  Info, 
  Flame, 
  Maximize2,
  Terminal,
  Activity,
  Layers,
  BookOpen,
  LineChart,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';

interface ExplainedLine {
  lineRange: string;
  codeSnippet: string;
  explanation: string;
}

interface TranslationAnnotation {
  sourceSegment: string;
  targetSegment: string;
  explanation: string;
}

interface AnalysisResult {
  summary: string;
  explainedLines?: ExplainedLine[];
  timeComplexity?: string;
  spaceComplexity?: string;
  keyConcepts?: string[];
  bugsOrOptimizations?: string[];
  translatedCode?: string;
  translationAnnotations?: TranslationAnnotation[];
  paradigmDifferences?: string;
}

const SUPPORTED_LANGUAGES = [
  { id: 'python', label: 'Python' },
  { id: 'typescript', label: 'TypeScript / JS' },
  { id: 'cpp', label: 'C++' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'java', label: 'Java' },
  { id: 'cobol', label: 'COBOL' },
  { id: 'assembly', label: 'Assembly' },
  { id: 'sql', label: 'SQL' },
  { id: 'c', label: 'C' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' }
];

const COMPLEXITY_LEVELS = [
  { value: 'detailed', label: 'Line-by-Line Micro-Analysis', desc: 'Explains every statement, memory change, and register/variable shift.' },
  { value: 'high-level', label: 'High-Level Logical Blocks', desc: 'Groups statements and explains algorithmic flows.' },
  { value: 'academic', label: 'Computer Science Proof Style', desc: 'Focuses heavily on invariant correctness and theoretical Big O.' }
];

const TARGET_STYLES = [
  { value: 'idiomatic', label: 'Idiomatic & Clean', desc: 'Adapts fully to standard style guidelines and standard library conventions.' },
  { value: 'safety-first', label: 'Type-Safe / Memory-Safe', desc: 'Focuses on error boundaries, validation, and zero panic vectors.' },
  { value: 'performance-optimized', label: 'High Performance / Zero Allocations', desc: 'Prefers speed, cache-friendly loops, or non-allocating alternatives.' }
];

const DEMO_SCRIPTS = {
  explain: [
    {
      title: "Ancient Legacy COBOL Record Loop",
      language: "cobol",
      code: `IDENTIFICATION DIVISION.
PROGRAM-ID. CUSTOMER-LOOP.
DATA DIVISION.
FILE SECTION.
FD  CUSTOMER-FILE.
01  CUSTOMER-RECORD.
    05  CUST-ID          PIC X(10).
    05  CUST-BALANCE     PIC S9(7)V99 COMP-3.
WORKING-STORAGE SECTION.
01  WS-EOF-FLAG          PIC X VALUE 'N'.
01  WS-TOTAL-BAL        PIC S9(9)V99 COMP-3 VALUE 0.
PROCEDURE DIVISION.
MAIN-PROCEDURE.
    OPEN INPUT CUSTOMER-FILE
    PERFORM UNTIL WS-EOF-FLAG = 'Y'
        READ CUSTOMER-FILE
            AT END
                MOVE 'Y' TO WS-EOF-FLAG
            NOT AT END
                IF CUST-BALANCE > 50000.00
                    ADD CUST-BALANCE TO WS-TOTAL-BAL
                END-IF
        END-READ
    END-PERFORM
    CLOSE CUSTOMER-FILE
    STOP RUN.`
    },
    {
      title: "Obfuscated JS Bitwise Multiplication",
      language: "typescript",
      code: `function mystery(a, b) {
  let result = 0;
  a = Number(a) | 0;
  b = Number(b) | 0;
  while (b !== 0) {
    if ((b & 1) !== 0) {
      result = (result + a) | 0;
    }
    a = (a << 1) | 0;
    b = (b >>> 1) | 0;
  }
  return result;
}`
    },
    {
      title: "C++ Memory Leak & Raw Pointer Loop",
      language: "cpp",
      code: `#include <iostream>

struct Node {
    int val;
    Node* next;
    Node(int v) : val(v), next(nullptr) {}
};

Node* buggyFilter(Node* head, int threshold) {
    Node* curr = head;
    Node* prev = nullptr;
    while (curr != nullptr) {
        if (curr->val < threshold) {
            if (prev == nullptr) {
                head = curr->next;
            } else {
                prev->next = curr->next;
            }
            // Gotcha: forgot to free curr node, causing leak!
            curr = curr->next;
        } else {
            prev = curr;
            curr = curr->next;
        }
    }
    return head;
}`
    }
  ],
  translate: [
    {
      title: "Python Recursive Fibonacci to Go",
      sourceLanguage: "python",
      targetLanguage: "go",
      code: `def fibonacci_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fibonacci_memo(n - 1, memo) + fibonacci_memo(n - 2, memo)
    return memo[n]`
    },
    {
      title: "C++ Custom QuickSort to Rust",
      sourceLanguage: "cpp",
      targetLanguage: "rust",
      code: `void quickSort(int arr[], int left, int right) {
    int i = left, j = right;
    int tmp;
    int pivot = arr[(left + right) / 2];
    while (i <= j) {
        while (arr[i] < pivot) i++;
        while (arr[j] > pivot) j--;
        if (i <= j) {
            tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
            i++;
            j--;
        }
    }
    if (left < j) quickSort(arr, left, j);
    if (i < right) quickSort(arr, i, right);
}`
    }
  ]
};

const LOADING_STEPS = [
  "Lexing code block structures and logic frames...",
  "Running tokenization & ast compilation checks...",
  "Analyzing semantic scope & memory flow nodes...",
  "Translating syntax dialects and functional mapping...",
  "Formatting theoretical Big O complexity boundaries..."
];

export default function AICodeExplainerTranslator() {
  const [activeMode, setActiveMode] = useState<'explain' | 'translate'>('explain');
  const [code, setCode] = useState('');
  
  // Explainer States
  const [language, setLanguage] = useState('python');
  const [complexity, setComplexity] = useState('detailed');

  // Translator States
  const [sourceLanguage, setSourceLanguage] = useState('python');
  const [targetLanguage, setTargetLanguage] = useState('typescript');
  const [targetStyle, setTargetStyle] = useState('idiomatic');

  // API Execution States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Copy states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSectionIndex, setCopiedSectionIndex] = useState<number | null>(null);

  // Step rotation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleProcess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const payload = activeMode === 'explain' 
      ? { mode: 'explain', code, language, complexity }
      : { mode: 'translate', code, sourceLanguage, targetLanguage, targetStyle };

    try {
      const response = await fetch('/api/code-explainer-translator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error processing code script.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Error processing code:', err);
      setError(err.message || 'An unexpected error occurred. Please verify your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, isAll = false, idx: number | null = null) => {
    navigator.clipboard.writeText(text);
    if (isAll) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (idx !== null) {
      setCopiedSectionIndex(idx);
      setTimeout(() => setCopiedSectionIndex(null), 2000);
    }
  };

  const loadDemo = (demo: { language?: string; sourceLanguage?: string; targetLanguage?: string; code: string }) => {
    setCode(demo.code);
    if (activeMode === 'explain' && demo.language) {
      setLanguage(demo.language);
    } else if (activeMode === 'translate' && demo.sourceLanguage && demo.targetLanguage) {
      setSourceLanguage(demo.sourceLanguage);
      setTargetLanguage(demo.targetLanguage);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6" id="code-explainer-container">
      {/* Header Banner */}
      <div className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-purple-500/20">
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Code Copilot Suite</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            AI Code Explainer & Translator
          </h1>
          <p className="text-zinc-400 max-w-2xl text-sm leading-relaxed">
            Deconstruct complex legacy code blocks line-by-line, inspect algorithmic complexity bottlenecks, or cross-compile logic between different languages with annotated paradigm comparisons.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-center md:self-auto shadow-inner shrink-0">
          <button
            onClick={() => {
              setActiveMode('explain');
              setResult(null);
              setError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'explain'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Legacy Explainer</span>
          </button>
          <button
            onClick={() => {
              setActiveMode('translate');
              setResult(null);
              setError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'translate'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Multi-Language Translator</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Input Section */}
        <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              Source Sandbox
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800/50">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>UTC Analysis Sandbox</span>
            </div>
          </div>

          <form onSubmit={handleProcess} className="space-y-5">
            {/* Syntax Config Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              {activeMode === 'explain' ? (
                <>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Script Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      From (Source)
                    </label>
                    <select
                      value={sourceLanguage}
                      onChange={(e) => setSourceLanguage(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      To (Target)
                    </label>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Mode-specific depth rules */}
            {activeMode === 'explain' ? (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Explanation Depth
                </label>
                <select
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {COMPLEXITY_LEVELS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                  {COMPLEXITY_LEVELS.find(c => c.value === complexity)?.desc}
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Target Style Direction
                </label>
                <select
                  value={targetStyle}
                  onChange={(e) => setTargetStyle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {TARGET_STYLES.map((ts) => (
                    <option key={ts.value} value={ts.value}>
                      {ts.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                  {TARGET_STYLES.find(t => t.value === targetStyle)?.desc}
                </p>
              </div>
            )}

            {/* Interactive Raw Code Input with Line numbers simulation */}
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Paste Code Script <span className="text-purple-400">*</span>
              </label>
              <div className="relative flex rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
                {/* Line Numbers Counter */}
                <div className="w-10 bg-zinc-900/60 text-zinc-600 font-mono text-[11px] text-right pr-2 select-none pt-3 border-r border-zinc-800/40">
                  {Array.from({ length: Math.max(8, code.split('\n').length) }).map((_, i) => (
                    <div key={i} className="h-[21px] leading-[21px]">
                      {i + 1}
                    </div>
                  ))}
                </div>
                {/* Real Textarea Input */}
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={
                    activeMode === 'explain'
                      ? 'Paste confusing, legacy, or undocumented code script here...'
                      : 'Paste the source code block to compile into standard target logic...'
                  }
                  className="flex-1 min-h-[220px] max-h-[480px] p-3 font-mono text-[12px] leading-[21px] text-zinc-200 bg-transparent focus:outline-none resize-y"
                  spellCheck="false"
                  required
                />
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <span className="text-[10px] text-zinc-500">
                  {code.split('\n').filter(Boolean).length} lines of code mapped
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {code.length} chars
                </span>
              </div>
            </div>

            {/* Quick Legacy Demo presets */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Or Load a Confusing Script Preset:
              </span>
              <div className="flex flex-col gap-1.5">
                {(activeMode === 'explain' ? DEMO_SCRIPTS.explain : DEMO_SCRIPTS.translate).map((demo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => loadDemo(demo)}
                    className="text-left text-xs bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800/80 hover:border-zinc-700 px-3 py-2 rounded-xl transition-all flex items-center justify-between"
                  >
                    <span className="truncate max-w-[240px]">⚡ {demo.title}</span>
                    <span className="text-[9px] uppercase font-mono tracking-wider bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-500 shrink-0">
                      {(demo as any).language || `${(demo as any).sourceLanguage} ➔ ${(demo as any).targetLanguage}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Run button */}
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                loading || !code.trim()
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing AST Elements...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                  <span>{activeMode === 'explain' ? 'Deconstruct & Explain' : 'Cross-Compile & Translate'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output Section */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 text-center min-h-[460px] flex flex-col items-center justify-center space-y-6"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                  <Code2 className="w-6 h-6 text-purple-400 absolute top-5 left-5 animate-pulse" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-white font-bold text-sm">Translating Paradigms</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed h-10 flex items-center justify-center font-mono">
                    {LOADING_STEPS[loadingStep]}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {error && !loading && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 border border-red-500/20 text-red-200 p-5 rounded-2xl flex items-start gap-3.5"
              >
                <div className="p-2 bg-red-500/20 rounded-lg text-red-400 shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-white">Analysis Halt</h4>
                  <p className="text-xs text-red-400 leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Idle Empty Screen */}
            {!loading && !result && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl p-10 text-center min-h-[500px] flex flex-col items-center justify-center"
              >
                <div className="w-14 h-14 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4">
                  <Code2 className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-white font-bold mb-2">Awaiting Code Block</h3>
                <p className="text-zinc-400 text-xs max-w-sm leading-relaxed mb-6">
                  Paste raw or legacy code blocks, configure your parameters on the left pane, and run the system analyzer to obtain interactive annotations.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-500 text-[11px] border-t border-zinc-800/40 pt-6 w-full max-w-md">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Line-by-Line Breakdowns</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Big O Complexity Map</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Multi-Paradigm Translate</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Results Rendering */}
            {result && !loading && !error && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Global Summary Block */}
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 md:p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                      Overall Assessment
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Analysis: Perfect Build Match
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-base leading-tight">
                    Script Logic Summary
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {result.summary}
                  </p>
                </div>

                {/* MODE: EXPLAIN VIEW */}
                {activeMode === 'explain' && (
                  <>
                    {/* Line-by-Line Interactive Annotations */}
                    <div className="space-y-3">
                      <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Interactive Line-by-Line Code Annotator
                      </span>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="grid grid-cols-12 bg-zinc-900/80 border-b border-zinc-800 p-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          <div className="col-span-2">Line Range</div>
                          <div className="col-span-10">Logic & Context Explanation</div>
                        </div>
                        <div className="divide-y divide-zinc-800/60 max-h-[500px] overflow-y-auto">
                          {result.explainedLines?.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-12 p-3.5 items-start gap-4 hover:bg-zinc-900/30 transition-all">
                              {/* Line Range */}
                              <div className="col-span-2">
                                <span className="inline-block px-2 py-1 bg-zinc-900 text-zinc-400 font-mono text-xs rounded border border-zinc-800/60">
                                  {item.lineRange}
                                </span>
                              </div>
                              {/* Snippet + Explanation */}
                              <div className="col-span-10 space-y-2">
                                <pre className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-850/60 text-zinc-300 font-mono text-[11px] overflow-x-auto">
                                  {item.codeSnippet}
                                </pre>
                                <p className="text-xs text-zinc-400 leading-relaxed pl-1">
                                  {item.explanation}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Algorithmic Big O Complexities & Paradigms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Big O Analysis Card */}
                      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-3">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                          <LineChart className="w-4 h-4 text-purple-400" />
                          Theoretical Complexities
                        </h4>
                        <div className="space-y-3.5 pt-1.5">
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Time Complexity</span>
                            <span className="text-lg font-black font-mono text-emerald-400">{result.timeComplexity || 'O(1)'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Space Complexity</span>
                            <span className="text-lg font-black font-mono text-indigo-400">{result.spaceComplexity || 'O(1)'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Prominent Paradigms Card */}
                      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-3">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                          <BookOpen className="w-4 h-4 text-purple-400" />
                          Key Architectural Paradigms
                        </h4>
                        <div className="space-y-1.5 pt-1.5">
                          {result.keyConcepts?.map((concept, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                              <span>{concept}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Security Leaks / Optimization Flag Inspector */}
                    {result.bugsOrOptimizations && result.bugsOrOptimizations.length > 0 && (
                      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 md:p-6 space-y-4">
                        <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Bugs, Memory Leaks, or Optimizations Flagged
                        </h4>
                        <div className="space-y-2.5">
                          {result.bugsOrOptimizations.map((flag, idx) => (
                            <div key={idx} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 text-xs flex items-start gap-2.5">
                              <div className="p-1 bg-amber-500/15 rounded text-amber-500 shrink-0">
                                <Flame className="w-3.5 h-3.5" />
                              </div>
                              <span className="leading-relaxed text-zinc-300">{flag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* MODE: TRANSLATE VIEW */}
                {activeMode === 'translate' && (
                  <>
                    {/* Translated Code Panel */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                          Translated Code Block
                        </span>
                        <button
                          onClick={() => copyToClipboard(result.translatedCode || '', true)}
                          className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all font-bold"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Code Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Full Code</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Output Code Editor */}
                      <div className="relative rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950 shadow-2xl">
                        <div className="flex items-center justify-between bg-zinc-900/80 px-4 py-2.5 border-b border-zinc-800 text-xs text-zinc-400 font-mono">
                          <span>🎯 Target Output Style: {TARGET_STYLES.find(t => t.value === targetStyle)?.label}</span>
                          <span className="text-emerald-400 font-bold uppercase">{SUPPORTED_LANGUAGES.find(l => l.id === targetLanguage)?.label}</span>
                        </div>
                        <pre className="p-5 font-mono text-[12px] leading-relaxed text-zinc-100 overflow-x-auto select-all max-h-[380px]">
                          {result.translatedCode}
                        </pre>
                      </div>
                    </div>

                    {/* Structural Conversion Annotations */}
                    {result.translationAnnotations && result.translationAnnotations.length > 0 && (
                      <div className="space-y-3">
                        <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                          Structural Paradigm Transformations
                        </span>
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 md:p-5 space-y-4">
                          <p className="text-[11px] text-zinc-500 leading-normal">
                            Direct architectural annotations mapping your source statements to their target programming paradigm counterparts:
                          </p>
                          <div className="space-y-3">
                            {result.translationAnnotations.map((item, idx) => (
                              <div key={idx} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                                  <div className="p-2 bg-purple-950/20 border border-purple-500/20 rounded">
                                    <span className="text-[9px] text-purple-400 block font-bold uppercase mb-1">Source logic</span>
                                    <code>{item.sourceSegment}</code>
                                  </div>
                                  <div className="p-2 bg-indigo-950/20 border border-indigo-500/20 rounded">
                                    <span className="text-[9px] text-indigo-400 block font-bold uppercase mb-1">Target logic</span>
                                    <code>{item.targetSegment}</code>
                                  </div>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed pl-1 pt-1 border-t border-zinc-900">
                                  <strong>Shift Adjustment:</strong> {item.explanation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Paradigm Differences summary */}
                    {result.paradigmDifferences && (
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 md:p-6 space-y-3">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                          <Lightbulb className="w-4 h-4 text-purple-400" />
                          Platform & Compilation Profile Differences
                        </h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {result.paradigmDifferences}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Sparkles, 
  Settings, 
  AlertCircle, 
  Trash2, 
  HelpCircle, 
  Activity, 
  Award, 
  Lightbulb, 
  Globe, 
  RefreshCw,
  Eye,
  Folder,
  Share2,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Common English stopwords for real-time local filtration
const COMMON_STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 
  'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 
  'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself', 'him', 'himself', 
  'his', 'how', 'hows', 'i', 'id', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its', 'itself', 
  'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 
  'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shant', 
  'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats', 
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 
  'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 
  'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 
  'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 
  'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves'
]);

interface SEOAnalysis {
  lengthCheck: string;
  score: number;
  stopwordCount: number;
  readability: string;
  recommendations: string[];
}

interface AISlugResult {
  originalTitle: string;
  standardSlug: string;
  seoOptimizedSlug: string;
  minimalSlug: string;
  engagementSlug: string;
  transliteratedSlug: string;
  seoAnalysis: SEOAnalysis;
  variations: string[];
}

export default function SEOURLSlugifier() {
  const [title, setTitle] = useState<string>('');
  const [lowercase, setLowercase] = useState<boolean>(true);
  const [replaceSpaces, setReplaceSpaces] = useState<boolean>(true);
  const [removeSpecial, setRemoveSpecial] = useState<boolean>(true);
  const [stripStopWords, setStripStopWords] = useState<boolean>(false);
  const [keepNumbers, setKeepNumbers] = useState<boolean>(true);
  const [maxLength, setMaxLength] = useState<number>(75);
  const [targetKeyword, setTargetKeyword] = useState<string>('');
  
  // Suffix options: 'none', 'date', 'hash', 'custom'
  const [suffixType, setSuffixType] = useState<'none' | 'date' | 'hash' | 'custom'>('none');
  const [customSuffix, setCustomSuffix] = useState<string>('');
  const [randomHash, setRandomHash] = useState<string>('');
  
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  
  // Real-time generated standard slug
  const [standardSlug, setStandardSlug] = useState<string>('');
  const [detectedStopwords, setDetectedStopwords] = useState<string[]>([]);
  
  // AI Status
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AISlugResult | null>(null);
  
  // Utilities
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'google' | 'social' | 'developer'>('google');

  // Title presets
  const titlePresets = [
    { text: "15 Best Visual Studio Code Extensions for Frontend Web Developers in 2026", keyword: "vs code extensions" },
    { text: "Cómo Crear una API REST Completamente Segura con Node.js, Express y JWT", keyword: "api rest segura" },
    { text: "Deep-Dive Guide: How AI-Powered Hybrid Vector Search Databases Will Revolutionize E-Commerce", keyword: "vector search databases" },
    { text: "Unlock Your Potential: 10 Powerful Habits of Highly Successful Software Engineers & Team Leads", keyword: "habits of successful developers" }
  ];

  // Generate random hash for suffix preview on load
  useEffect(() => {
    generateHash();
  }, []);

  const generateHash = () => {
    setRandomHash(Math.random().toString(36).substring(2, 6));
  };

  // Real-time client-side slug generator
  useEffect(() => {
    if (!title) {
      setStandardSlug('');
      setDetectedStopwords([]);
      return;
    }

    let result = title.trim();

    // 1. Lowercasing
    if (lowercase) {
      result = result.toLowerCase();
    }

    // 2. Remove diacritics / accents
    result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 3. Keep or Strip Numbers
    if (!keepNumbers) {
      result = result.replace(/[0-9]/g, '');
    }

    // 4. Stopwords Detection and Optional Stripping
    const words = result.toLowerCase().match(/[a-z0-9]+/g) || [];
    const stopwordsFound: string[] = [];
    const filteredWords = words.filter(word => {
      const isStop = COMMON_STOPWORDS.has(word);
      if (isStop) {
        stopwordsFound.push(word);
      }
      return stripStopWords ? !isStop : true;
    });

    setDetectedStopwords(Array.from(new Set(stopwordsFound)));

    // Reconstruct with filtered words
    if (stripStopWords) {
      result = filteredWords.join(' ');
    }

    // 5. Remove Special Characters / Punctuation
    if (removeSpecial) {
      // Keep only alphanumeric characters and spaces
      result = result.replace(/[^a-zA-Z0-9\s-_]/g, '');
    }

    // 6. Replace spaces with hyphens
    if (replaceSpaces) {
      result = result.replace(/[\s_]+/g, '-');
    } else {
      result = result.replace(/\s+/g, '-');
    }

    // Clean multi-hyphens and leading/trailing
    result = result.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

    // 7. Max Length Constraint (Clean trim at word boundary if possible, or direct cutoff)
    if (maxLength > 0 && result.length > maxLength) {
      result = result.substring(0, maxLength).replace(/-+$/g, '');
    }

    // 8. Add suffix
    if (suffixType !== 'none') {
      let suffix = '';
      if (suffixType === 'date') {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        suffix = `${yyyy}-${mm}-${dd}`;
      } else if (suffixType === 'hash') {
        suffix = randomHash;
      } else if (suffixType === 'custom' && customSuffix.trim()) {
        suffix = customSuffix.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').replace(/\s+/g, '-');
      }

      if (suffix) {
        result = `${result}-${suffix}`;
      }
    }

    setStandardSlug(result);
  }, [
    title, 
    lowercase, 
    replaceSpaces, 
    removeSpecial, 
    stripStopWords, 
    keepNumbers, 
    maxLength, 
    suffixType, 
    customSuffix, 
    randomHash
  ]);

  // Remove a single stopword by replacing it in the original title
  const removeStopwordFromTitle = (word: string) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const newTitle = title.replace(regex, '').replace(/\s+/g, ' ').trim();
    setTitle(newTitle);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApplyPreset = (preset: { text: string; keyword: string }) => {
    setTitle(preset.text);
    setTargetKeyword(preset.keyword);
    setError(null);
  };

  const handleClear = () => {
    setTitle('');
    setTargetKeyword('');
    setCustomSuffix('');
    setCustomInstructions('');
    setAiResult(null);
    setError(null);
  };

  const handleAIOptimize = async () => {
    if (!title.trim()) {
      setError('Please provide a post or article title to optimize.');
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage('Reviewing current URL routing paradigms...');

    const loadingStages = [
      'Applying standard URL regex sanitization...',
      'Sending payloads to Gemini neural SEO analyzer...',
      'Filtering grammatical stop words and linking particles...',
      'Injecting high-value search intent keywords...',
      'Calculating URL readability index and length metrics...',
      'Compiling click-through-rate (CTR) optimized variants...'
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < loadingStages.length - 1) {
        currentStage++;
        setStatusMessage(loadingStages[currentStage]);
      }
    }, 1200);

    try {
      let activeSuffix = '';
      if (suffixType === 'date') {
        const today = new Date();
        activeSuffix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      } else if (suffixType === 'hash') {
        activeSuffix = randomHash;
      } else if (suffixType === 'custom') {
        activeSuffix = customSuffix;
      }

      const response = await fetch('/api/url-slugifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          lowercase,
          replaceSpaces,
          removeSpecial,
          stripStopWords,
          maxLength,
          targetKeyword: targetKeyword.trim() || undefined,
          addSuffix: activeSuffix || undefined,
          customInstructions: customInstructions.trim() || undefined
        })
      });

      clearInterval(interval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error occurred during AI slugification.');
      }

      const data = await response.json();
      setAiResult(data);
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setError(err.message || 'Failed to generate SEO slug variations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get score pill colors
  const getScoreColor = (score: number) => {
    if (score >= 90) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    if (score >= 70) return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
    return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' };
  };

  return (
    <div id="url-slugifier-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-white font-sans">
      
      {/* LEFT COLUMN: Inputs & Customizations */}
      <div id="url-slugifier-input-panel" className="lg:col-span-7 space-y-6">
        
        {/* Main Title Entry */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <label htmlFor="raw-title-input" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Raw Title, Headline or URL Path
            </label>
            
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Try Preset:</span>
              <div className="flex flex-wrap gap-1">
                {titlePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-[10px] bg-slate-800 hover:bg-indigo-600/30 hover:text-indigo-300 border border-slate-700/60 px-2 py-0.5 rounded transition duration-200"
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <textarea
              id="raw-title-input"
              rows={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Paste or type article title (e.g. 10 Essential Rules of SEO Content in 2026...)"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 outline-none resize-none transition"
            />
            {title && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3.5 bottom-3.5 text-slate-400 hover:text-rose-400 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 transition"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Target Keyword Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="keyword-context-input" className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Target SEO Keyword <span className="text-[10px] text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                id="keyword-context-input"
                type="text"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                placeholder="e.g. vs code extensions"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="max-length-input" className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                <span>Maximum Slug Length</span>
                <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300 font-bold">{maxLength} chars</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="max-length-input"
                  type="range"
                  min="10"
                  max="150"
                  value={maxLength}
                  onChange={(e) => setMaxLength(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-950 h-1 rounded-lg outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Basic Configuration & Rules */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Slugification Parameters
            </h3>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              {showAdvanced ? (
                <>
                  <span>Hide Details</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Show Advanced</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 p-3 rounded-xl cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={lowercase}
                onChange={(e) => setLowercase(e.target.checked)}
                className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4 h-4"
              />
              <span className="text-xs font-medium text-slate-300">Force Lowercase</span>
            </label>

            <label className="flex items-center gap-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 p-3 rounded-xl cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={replaceSpaces}
                onChange={(e) => setReplaceSpaces(e.target.checked)}
                className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4 h-4"
              />
              <span className="text-xs font-medium text-slate-300">Space ➔ Hyphen</span>
            </label>

            <label className="flex items-center gap-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 p-3 rounded-xl cursor-pointer transition select-none col-span-2 sm:col-span-1">
              <input
                type="checkbox"
                checked={removeSpecial}
                onChange={(e) => setRemoveSpecial(e.target.checked)}
                className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4 h-4"
              />
              <span className="text-xs font-medium text-slate-300">Strip Punctuation</span>
            </label>
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 pt-2 overflow-hidden border-t border-slate-800/60"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Stopword filter flag */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400">Stopword Removal Mode</span>
                    <label className="flex items-center gap-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 p-3 rounded-xl cursor-pointer transition select-none">
                      <input
                        type="checkbox"
                        checked={stripStopWords}
                        onChange={(e) => setStripStopWords(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-300">Strip English Stop Words</span>
                        <span className="text-[10px] text-slate-500">Strips pronouns, prepositions, articles</span>
                      </div>
                    </label>
                  </div>

                  {/* Number keeping filter */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400">Numerical Data Handling</span>
                    <label className="flex items-center gap-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 p-3 rounded-xl cursor-pointer transition select-none">
                      <input
                        type="checkbox"
                        checked={keepNumbers}
                        onChange={(e) => setKeepNumbers(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-300">Keep Numbers (0-9)</span>
                        <span className="text-[10px] text-slate-500">Uncheck to strip all digits</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Suffix Builder */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    Suffix Configuration
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { type: 'none', label: 'No Suffix' },
                      { type: 'date', label: 'Calendar Date' },
                      { type: 'hash', label: 'Unique Hash' },
                      { type: 'custom', label: 'Custom string' }
                    ].map((opt) => (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setSuffixType(opt.type as any)}
                        className={`text-xs px-3 py-2 rounded-xl border font-medium transition duration-200 ${
                          suffixType === opt.type 
                            ? 'bg-indigo-600/25 border-indigo-500/80 text-white' 
                            : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {suffixType === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-1.5"
                    >
                      <input
                        type="text"
                        value={customSuffix}
                        onChange={(e) => setCustomSuffix(e.target.value)}
                        placeholder="e.g. update, review, or v2"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                      />
                    </motion.div>
                  )}

                  {suffixType === 'hash' && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-500">Generated hash placeholder:</span>
                      <span className="font-mono text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-indigo-400">{randomHash}</span>
                      <button
                        type="button"
                        onClick={generateHash}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline transition"
                      >
                        Regenerate
                      </button>
                    </div>
                  )}

                  {suffixType === 'date' && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-500">Appended suffix format:</span>
                      <span className="font-mono text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                        {new Date().toISOString().split('T')[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* AI Custom guidelines */}
                <div className="space-y-1.5 pt-2">
                  <label htmlFor="ai-instructions-input" className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    Custom AI Rules / Focus Guidelines
                  </label>
                  <input
                    id="ai-instructions-input"
                    type="text"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g. Translate to English; Use visual-studio as brand focus keywords..."
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Action Trigger */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={handleAIOptimize}
            disabled={loading || !title.trim()}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 border border-indigo-500/30 font-semibold px-6 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-900/10 active:scale-[0.99] transition duration-200"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
            )}
            <span>Analyze &amp; Optimize with AI</span>
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN: Real-Time Slug & AI Output */}
      <div id="url-slugifier-output-panel" className="lg:col-span-5 space-y-6">
        
        {/* Real-Time Preview Board */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-indigo-400" />
              Standard URL Slug Preview
            </h3>
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-extrabold bg-indigo-900/20 px-2 py-0.5 rounded border border-indigo-500/20">
              Live Compiler
            </span>
          </div>

          <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <span className="font-mono text-xs text-indigo-400 break-all select-all pr-1">
                {standardSlug || <span className="text-slate-600 font-sans italic">Type a title to generate slug...</span>}
              </span>
              
              {standardSlug && (
                <button
                  type="button"
                  onClick={() => handleCopy(standardSlug, 'standard')}
                  className="text-slate-400 hover:text-white p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800/80 transition"
                  title="Copy standard slug"
                >
                  {copiedField === 'standard' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>

            {/* Micro-Metrics */}
            {standardSlug && (
              <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-900/80 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  <span>Length: <strong className="text-slate-300">{standardSlug.length} chars</strong></span>
                  {standardSlug.length > 70 ? (
                    <span className="text-amber-400" title="Ideal slug length is under 70 characters.">⚠️ long</span>
                  ) : (
                    <span className="text-emerald-400">✓ good</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  <span>Words: <strong className="text-slate-300">{standardSlug.split('-').filter(Boolean).length}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Stopwords Intelligence Tray */}
          {detectedStopwords.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Detected <strong className="text-indigo-300">{detectedStopwords.length}</strong> grammatical stopwords:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {detectedStopwords.map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => removeStopwordFromTitle(word)}
                    className="text-[10px] bg-slate-950/80 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/30 px-2 py-0.5 rounded-md flex items-center gap-1.5 transition duration-150"
                    title="Click to instantly strip from raw title"
                  >
                    <span>{word}</span>
                    <span className="text-[9px] text-slate-600 group-hover:text-rose-500">×</span>
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-slate-500 italic">
                💡 Tip: Click stopwords above to strip them or enable "Strip English Stop Words" in parameters.
              </div>
            </div>
          )}

          {/* Quick Context Previews (Google SERP etc) */}
          {standardSlug && (
            <div className="space-y-3 pt-3 border-t border-slate-800/40">
              <div className="flex items-center gap-1">
                {([
                  { id: 'google', label: 'Google SERP', icon: Eye },
                  { id: 'social', label: 'Social Share', icon: Share2 },
                  { id: 'developer', label: 'Path Struct', icon: Folder }
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPreviewTab(tab.id)}
                    className={`text-[10px] flex items-center gap-1 px-2.5 py-1 rounded-lg border font-medium transition ${
                      previewTab === tab.id
                        ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <tab.icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-3.5">
                {previewTab === 'google' && (
                  <div className="space-y-1 select-none">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <span>https://example.com</span>
                      <span className="text-slate-600">›</span>
                      <span className="text-emerald-500 font-mono overflow-hidden whitespace-nowrap text-ellipsis max-w-xs">{standardSlug}</span>
                    </div>
                    <div className="text-xs text-[#8ab4f8] font-medium leading-snug">
                      {title || 'Example Post Title'}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                      Discover optimized organic search strategies and increase search visibility by organizing keyword layouts index-friendly.
                    </div>
                  </div>
                )}

                {previewTab === 'social' && (
                  <div className="space-y-1.5 select-none">
                    <div className="text-[9px] uppercase tracking-wider font-bold text-indigo-400 font-mono">OpenGraph Card Preview</div>
                    <div className="border border-slate-800/80 rounded-lg overflow-hidden bg-slate-950/80">
                      <div className="h-16 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 flex items-center justify-center text-[10px] text-slate-500 font-mono border-b border-slate-900">
                        [1200 x 630 OpenGraph Image]
                      </div>
                      <div className="p-2 space-y-0.5">
                        <div className="text-[9px] text-slate-500 font-mono">EXAMPLE.COM/BLOG/{standardSlug.toUpperCase()}</div>
                        <div className="text-[10px] text-slate-300 font-semibold line-clamp-1">{title || 'Example Post Title'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {previewTab === 'developer' && (
                  <div className="space-y-1 text-slate-400 select-none">
                    <div className="text-[10px] text-slate-500 font-mono">// Next.js / Express Route Path Reference</div>
                    <code className="text-[10px] font-mono text-indigo-300 block bg-slate-950 p-2 rounded border border-slate-900">
                      /src/app/posts/{`[`}slug{`]`}/page.tsx ➔ /posts/{standardSlug}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* AI Loading State */}
        {loading && (
          <div className="bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-200">Generating Neural Slugs</h4>
              <p className="text-xs text-indigo-300 font-mono">{statusMessage}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-900/20 border border-rose-500/30 text-rose-300 rounded-2xl p-4 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-semibold block">Operation Failed</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* AI Rich Output Section */}
        {aiResult && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* The technical audit card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    Technical SEO Audit
                  </h3>
                  <p className="text-[10px] text-slate-500">Real-time permalink structural analysis report</p>
                </div>
                
                {/* Score badge */}
                <div className={`border px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${getScoreColor(aiResult.seoAnalysis.score).bg} ${getScoreColor(aiResult.seoAnalysis.score).border}`}>
                  <Activity className={`w-4 h-4 ${getScoreColor(aiResult.seoAnalysis.score).text}`} />
                  <span className="font-mono font-bold text-sm tracking-tight">
                    <span className={getScoreColor(aiResult.seoAnalysis.score).text}>{aiResult.seoAnalysis.score}</span>
                    <span className="text-slate-500">/100</span>
                  </span>
                </div>
              </div>

              {/* Audit Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/60 border border-slate-900 p-3 rounded-xl space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-mono tracking-wider">Readability Grade</span>
                  <span className="font-semibold block text-slate-300">{aiResult.seoAnalysis.readability}</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-900 p-3 rounded-xl space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-mono tracking-wider">Length Assessment</span>
                  <span className="font-semibold block text-slate-300">{aiResult.seoAnalysis.lengthCheck}</span>
                </div>
              </div>

              {/* Recommendations */}
              {aiResult.seoAnalysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    Slug Optimization Actions
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-400 list-disc pl-4">
                    {aiResult.seoAnalysis.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* AI Generated Permalinks Options */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-5">
              
              <div className="border-b border-slate-800/60 pb-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  AI SEO-Engineered Permalinks
                </h3>
              </div>

              {/* Slugs listing */}
              <div className="space-y-4">
                {[
                  {
                    id: 'ai-optimized',
                    label: 'SEO-Optimized Slug',
                    desc: 'Prioritized target keywords, trimmed low-value prepositions',
                    slug: aiResult.seoOptimizedSlug
                  },
                  {
                    id: 'ai-minimal',
                    label: 'Minimalist Focus',
                    desc: 'Highly concise, ultra-short nouns and main keywords',
                    slug: aiResult.minimalSlug
                  },
                  {
                    id: 'ai-engagement',
                    label: 'Click-Through Rate (CTR) Focus',
                    desc: 'Engaging style for high interest and share indexability',
                    slug: aiResult.engagementSlug
                  },
                  {
                    id: 'ai-transliterated',
                    label: 'Language Translation / Synonyms',
                    desc: 'Translated to clean English URL structure if applicable',
                    slug: aiResult.transliteratedSlug
                  }
                ].map((item) => (
                  <div key={item.id} className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-300 block">{item.label}</span>
                        <p className="text-[10px] text-slate-500">{item.desc}</p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleCopy(item.slug, item.id)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 transition shrink-0"
                        title="Copy slug"
                      >
                        {copiedField === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="font-mono text-xs text-indigo-300 break-all select-all pt-1 bg-slate-950/40 p-2 rounded border border-slate-900">
                      {item.slug}
                    </div>
                  </div>
                ))}
              </div>

              {/* Alternative Keyword Angles */}
              {aiResult.variations.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    Alternative Search Keyword Angles
                  </span>
                  <div className="flex flex-col gap-2">
                    {aiResult.variations.map((variant, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-mono text-slate-400 break-all select-all">{variant}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(variant, `variation-${idx}`)}
                          className="text-slate-500 hover:text-white transition shrink-0"
                        >
                          {copiedField === `variation-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}

      </div>

    </div>
  );
}

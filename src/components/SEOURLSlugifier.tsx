import { useState, useEffect, useMemo } from 'react';
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
  FileText,
  BookOpen,
  Download,
  Layers,
  ListPlus,
  FileSpreadsheet
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

  const slugValidationResults = useMemo(() => {
    if (!standardSlug) return null;
    const s = standardSlug;
    
    const rules = [
      {
        id: 'slash',
        label: 'No Slashes',
        passed: !s.startsWith('/') && !s.endsWith('/') && !s.includes('//') && !s.includes('/'),
        failMessage: "Contains slashes ('/'). URL slugs must represent a single routing path segment.",
        passMessage: "Path is slash-free.",
        severity: 'error' as const
      },
      {
        id: 'chars',
        label: 'Illegal Characters',
        passed: !/[^a-zA-Z0-9-_]/.test(s),
        failMessage: "Contains spaces or special symbols like ?, &, #, %, etc.",
        passMessage: "Uses only safe alphanumeric characters, dashes, and underscores.",
        severity: 'error' as const
      },
      {
        id: 'separators',
        label: 'Consecutive Separators',
        passed: !s.includes('--') && !s.includes('__') && !s.includes('-_') && !s.includes('_-'),
        failMessage: "Contains consecutive separators (e.g. '--' or '__').",
        passMessage: "Clean single-separator structure.",
        severity: 'warning' as const
      },
      {
        id: 'edges',
        label: 'Edge Separators',
        passed: !s.startsWith('-') && !s.endsWith('-') && !s.startsWith('_') && !s.endsWith('_'),
        failMessage: "Starts or ends with a separator character.",
        passMessage: "No leading or trailing separator characters.",
        severity: 'warning' as const
      },
      {
        id: 'reserved',
        label: 'Reserved Keywords',
        passed: (() => {
          const reservedList = [
            'admin', 'api', 'login', 'logout', 'register', 'index', 'home', 'dashboard', 'app', 
            'config', 'settings', 'static', 'public', 'assets', 'users', 'posts', 'images', 
            'robots.txt', 'sitemap.xml', 'favicon.ico', 'undefined', 'null', 'search', 'category', 
            'tag', 'archive', 'feed', 'wp-admin', 'wp-content'
          ];
          const pattern = new RegExp(`(?:^|[-_/])(${reservedList.join('|')})(?:$|[-_/])`, 'i');
          return !pattern.test(s);
        })(),
        failMessage: (() => {
          const reservedList = [
            'admin', 'api', 'login', 'logout', 'register', 'index', 'home', 'dashboard', 'app', 
            'config', 'settings', 'static', 'public', 'assets', 'users', 'posts', 'images', 
            'robots.txt', 'sitemap.xml', 'favicon.ico', 'undefined', 'null', 'search', 'category', 
            'tag', 'archive', 'feed', 'wp-admin', 'wp-content'
          ];
          const pattern = new RegExp(`(?:^|[-_/])(${reservedList.join('|')})(?:$|[-_/])`, 'i');
          const match = s.match(pattern);
          const matchedWord = match ? match[1] : '';
          return matchedWord 
            ? `Routing conflict: Slug contains the reserved keyword segment '${matchedWord}', which can hijack router operations.`
            : "Matches a reserved system keyword segment which may hijack router operations.";
        })(),
        passMessage: "No system routing conflicts or reserved keywords detected.",
        severity: 'error' as const
      },
      {
        id: 'casing',
        label: 'Casing Standard',
        passed: s === s.toLowerCase(),
        failMessage: "Contains uppercase letters (PascalCase, CamelCase, or mixed-case) which can trigger duplicate-index content penalties.",
        passMessage: "Slug is strictly lowercase.",
        severity: 'warning' as const
      },
      {
        id: 'length',
        label: 'Optimal Length',
        passed: s.length >= 3 && s.length <= 60,
        failMessage: s.length < 3 ? "Slug is extremely short (under 3 characters)." : "Slug is long (exceeds 60 characters), risking search truncation.",
        passMessage: "Character length fits within optimal SEO parameters (3-60 chars).",
        severity: 'warning' as const
      }
    ];

    const errors = rules.filter(r => !r.passed && r.severity === 'error');
    const warnings = rules.filter(r => !r.passed && r.severity === 'warning');
    const totalFailed = rules.filter(r => !r.passed).length;

    let status: 'safe' | 'warning' | 'danger' = 'safe';
    if (errors.length > 0) status = 'danger';
    else if (warnings.length > 0) status = 'warning';

    return {
      rules,
      status,
      totalFailed,
      errorsCount: errors.length,
      warningsCount: warnings.length
    };
  }, [standardSlug]);

  const handleAutoFixSlug = () => {
    if (!standardSlug) return;
    
    let fixed = standardSlug;
    
    // 1. Strip leading/trailing slashes, hyphens, underscores
    fixed = fixed.replace(/^[\/\\-_]+|[\/\\-_]+$/g, '');
    
    // 2. Remove any remaining restricted characters
    fixed = fixed.replace(/[^a-zA-Z0-9-_]/g, '');
    
    // 3. Resolve consecutive separators
    fixed = fixed.replace(/-+/g, '-').replace(/_+/g, '_');
    
    // 4. Convert mixed casing to lowercase if lowercase is on
    if (lowercase) {
      fixed = fixed.toLowerCase();
    }
    
    // 5. Resolve reserved keyword conflicts using a comprehensive regex tester
    const reservedList = [
      'admin', 'api', 'login', 'logout', 'register', 'index', 'home', 'dashboard', 'app', 
      'config', 'settings', 'static', 'public', 'assets', 'users', 'posts', 'images', 
      'robots.txt', 'sitemap.xml', 'favicon.ico', 'undefined', 'null', 'search', 'category', 
      'tag', 'archive', 'feed', 'wp-admin', 'wp-content'
    ];
    const pattern = new RegExp(`(?:^|[-_/])(${reservedList.join('|')})(?:$|[-_/])`, 'i');
    let match = fixed.match(pattern);
    while (match) {
      const keyword = match[1];
      const regexKeyword = new RegExp(`(^|[-_/])${keyword}([-_/]|$)`, 'i');
      fixed = fixed.replace(regexKeyword, `$1${keyword}page$2`);
      match = fixed.match(pattern);
    }

    setTitle(fixed);
  };
  
  // AI Status
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AISlugResult | null>(null);
  
  // Utilities
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'google' | 'social' | 'developer'>('google');

  // URL Prefix and Base Domain states
  const [slugCustomDomain, setSlugCustomDomain] = useState<string>('mysite.com');
  const [slugDomainPrefix, setSlugDomainPrefix] = useState<string>('https://');
  const [urlCopied, setUrlCopied] = useState<boolean>(false);

  // Auto-generate on type & debounce state controls
  const [autoGenerate, setAutoGenerate] = useState<boolean>(true);
  const [debouncedTitle, setDebouncedTitle] = useState<string>('');

  // Case Formatting state
  const [caseFormatting, setCaseFormatting] = useState<'lowercase' | 'kebab' | 'snake' | 'pascal'>('lowercase');

  // Mode Selection: 'single' | 'bulk'
  const [activeMode, setActiveMode] = useState<'single' | 'bulk'>('single');
  const [bulkInput, setBulkInput] = useState<string>('');
  const [bulkResults, setBulkResults] = useState<Array<{ title: string; slug: string; fullUrl: string }>>([]);
  const [bulkCopiedId, setBulkCopiedId] = useState<number | null>(null);

  // Title presets
  const titlePresets = [
    { text: "15 Best Visual Studio Code Extensions for Frontend Web Developers in 2026", keyword: "vs code extensions" },
    { text: "Cómo Crear una API REST Completamente Segura con Node.js, Express y JWT", keyword: "api rest segura" },
    { text: "Deep-Dive Guide: How AI-Powered Hybrid Vector Search Databases Will Revolutionize E-Commerce", keyword: "vector search databases" },
    { text: "Unlock Your Potential: 10 Powerful Habits of Highly Successful Software Engineers & Team Leads", keyword: "habits of successful developers" }
  ];

  // Bulk title presets
  const bulkPresets = [
    "15 Best Visual Studio Code Extensions for Frontend Developers in 2026\nCómo Crear una API REST Completamente Segura con Express y JWT\nUnlock Your Potential: 10 Powerful Habits of Successful Software Engineers\nDeep-Dive Guide: How AI-Powered Hybrid Vector Search Databases Will Work",
    "Comprehensive React Router v7 Complete Guide for Production\nWhy Tailwind CSS v4 is a Game Changer for UI Development\nHow to Deploy an Express Server to Google Cloud Run with Docker\n10 Local Storage Security Best Practices Every Developer Must Know"
  ];

  // Generate random hash for suffix preview on load
  useEffect(() => {
    generateHash();
  }, []);

  const generateHash = () => {
    setRandomHash(Math.random().toString(36).substring(2, 6));
  };

  // Debounce handler for 'Auto-generate on Type'
  useEffect(() => {
    if (!autoGenerate) {
      return;
    }
    // Small debounce delay (e.g. 350ms) to avoid excessive state updates on fast keystrokes
    const handler = setTimeout(() => {
      setDebouncedTitle(title);
    }, 350);

    return () => {
      clearTimeout(handler);
    };
  }, [title, autoGenerate]);

  // Clean, reusable pure slug generator logic
  const computeSlug = (rawText: string): { slug: string; stopwords: string[] } => {
    if (!rawText.trim()) {
      return { slug: '', stopwords: [] };
    }

    let slugResult = '';
    const stopwordsFound: string[] = [];

    if (caseFormatting === 'lowercase') {
      let result = rawText.trim();

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
      const filteredWords = words.filter(word => {
        const isStop = COMMON_STOPWORDS.has(word);
        if (isStop) {
          stopwordsFound.push(word);
        }
        return stripStopWords ? !isStop : true;
      });

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

      slugResult = result;
    } else {
      // For kebab, snake, pascal cases: we parse words
      let processed = rawText.trim();
      processed = processed.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!keepNumbers) {
        processed = processed.replace(/[0-9]/g, '');
      }

      const words = processed.match(/[a-zA-Z0-9]+/g) || [];
      const filteredWords = words.filter(word => {
        const lowerWord = word.toLowerCase();
        const isStop = COMMON_STOPWORDS.has(lowerWord);
        if (isStop) {
          stopwordsFound.push(lowerWord);
        }
        return stripStopWords ? !isStop : true;
      });

      if (caseFormatting === 'kebab') {
        slugResult = filteredWords.map(w => w.toLowerCase()).join('-');
      } else if (caseFormatting === 'snake') {
        slugResult = filteredWords.map(w => w.toLowerCase()).join('_');
      } else if (caseFormatting === 'pascal') {
        slugResult = filteredWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
      }

      // Clean multi-separators and leading/trailing
      if (caseFormatting === 'snake') {
        slugResult = slugResult.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
      } else {
        slugResult = slugResult.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
      }

      // Max Length Constraint
      if (maxLength > 0 && slugResult.length > maxLength) {
        if (caseFormatting === 'snake') {
          slugResult = slugResult.substring(0, maxLength).replace(/_+$/g, '');
        } else if (caseFormatting === 'kebab') {
          slugResult = slugResult.substring(0, maxLength).replace(/-+$/g, '');
        } else {
          slugResult = slugResult.substring(0, maxLength);
        }
      }
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
        const suffixSep = caseFormatting === 'snake' ? '_' : (caseFormatting === 'pascal' ? '' : '-');
        let formattedSuffix = suffix;
        if (caseFormatting === 'pascal' && suffixType === 'custom') {
          formattedSuffix = suffix.charAt(0).toUpperCase() + suffix.slice(1);
        }
        slugResult = `${slugResult}${suffixSep}${formattedSuffix}`;
      }
    }

    return {
      slug: slugResult,
      stopwords: Array.from(new Set(stopwordsFound))
    };
  };

  // Real-time single slug compiler
  useEffect(() => {
    const { slug, stopwords } = computeSlug(debouncedTitle);
    setStandardSlug(slug);
    setDetectedStopwords(stopwords);
  }, [
    debouncedTitle, 
    lowercase, 
    replaceSpaces, 
    removeSpecial, 
    stripStopWords, 
    keepNumbers, 
    maxLength, 
    suffixType, 
    customSuffix, 
    randomHash,
    caseFormatting
  ]);

  // Real-time bulk slugs compiler
  useEffect(() => {
    const lines = bulkInput.split('\n').map(line => line.trim()).filter(Boolean);
    const compiled = lines.map(line => {
      const { slug } = computeSlug(line);
      const fullUrl = `${slugDomainPrefix}${slugCustomDomain || 'mysite.com'}/${slug}`;
      return { title: line, slug, fullUrl };
    });
    setBulkResults(compiled);
  }, [
    bulkInput,
    lowercase,
    replaceSpaces,
    removeSpecial,
    stripStopWords,
    keepNumbers,
    maxLength,
    suffixType,
    customSuffix,
    randomHash,
    caseFormatting,
    slugDomainPrefix,
    slugCustomDomain,
    activeMode
  ]);

  // Export bulk-processed slugs directly to a downloadable CSV
  const handleExportCSV = () => {
    if (bulkResults.length === 0) return;

    const csvRows = [
      ['Original Title', 'Generated Slug', 'Full URL'],
      ...bulkResults.map(item => [
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.slug.replace(/"/g, '""')}"`,
        `"${item.fullUrl.replace(/"/g, '""')}"`
      ])
    ];

    const csvContent = '\ufeff' + csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `seo_slugs_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Remove a single stopword by replacing it in the original title
  const removeStopwordFromTitle = (word: string) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const newTitle = title.replace(regex, '').replace(/\s+/g, ' ').trim();
    setTitle(newTitle);
    setDebouncedTitle(newTitle);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleManualGenerate = () => {
    setDebouncedTitle(title);
  };

  const handleApplyPreset = (preset: { text: string; keyword: string }) => {
    setTitle(preset.text);
    setTargetKeyword(preset.keyword);
    setError(null);
    setDebouncedTitle(preset.text);
  };

  const handleClear = () => {
    setTitle('');
    setTargetKeyword('');
    setCustomSuffix('');
    setCustomInstructions('');
    setAiResult(null);
    setError(null);
    setDebouncedTitle('');
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

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 max-w-xs">
          <button
            type="button"
            onClick={() => setActiveMode('single')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition duration-150 cursor-pointer ${
              activeMode === 'single'
                ? 'bg-indigo-600/25 border border-indigo-500/40 text-indigo-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Single Mode
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('bulk')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition duration-150 cursor-pointer ${
              activeMode === 'bulk'
                ? 'bg-indigo-600/25 border border-indigo-500/40 text-indigo-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bulk Mode
          </button>
        </div>

        {activeMode === 'single' ? (
          /* Main Title Entry (Single Mode) */
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
                      className="text-[10px] bg-slate-800 hover:bg-indigo-600/30 hover:text-indigo-300 border border-slate-700/60 px-2 py-0.5 rounded transition duration-200 cursor-pointer"
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
                  className="absolute right-3.5 bottom-3.5 text-slate-400 hover:text-rose-400 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
                  title="Clear input"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Auto-generate on Type controls */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-b border-slate-800/40 pb-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={autoGenerate}
                    onChange={(e) => {
                      setAutoGenerate(e.target.checked);
                      if (e.target.checked) {
                        setDebouncedTitle(title);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-indigo-400 after:border-slate-500 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600/30 border border-slate-700/80"></div>
                </div>
                <span className="text-xs font-medium text-slate-400 peer-checked:text-indigo-300">
                  Auto-generate on Type
                </span>
              </label>

              {!autoGenerate && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  type="button"
                  onClick={handleManualGenerate}
                  disabled={!title.trim() || title === debouncedTitle}
                  className="text-[10px] font-mono bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 px-2.5 py-1 rounded flex items-center gap-1 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${title !== debouncedTitle ? 'animate-pulse text-indigo-400' : ''}`} />
                  Compile Slug Now
                </motion.button>
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
        ) : (
          /* Bulk Title Entry (Bulk Mode) */
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label htmlFor="bulk-title-input" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Bulk Article Titles <span className="text-xs text-slate-500 font-normal">(One title per line)</span>
              </label>

              {/* Try Preset for Bulk */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Try Preset Batch:</span>
                <div className="flex gap-1">
                  {bulkPresets.map((presetText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBulkInput(presetText)}
                      className="text-[10px] bg-slate-800 hover:bg-indigo-600/30 hover:text-indigo-300 border border-slate-700/60 px-2.5 py-0.5 rounded transition duration-200 cursor-pointer"
                    >
                      #{idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              <textarea
                id="bulk-title-input"
                rows={8}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Paste multiple titles here, one per line. E.g.:&#10;10 Essential Rules of SEO Content&#10;Best Vs Code Extensions for Frontend Developers&#10;Why Tailwind CSS v4 is a Game Changer"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 outline-none resize-y transition font-mono"
              />
              {bulkInput && (
                <button
                  type="button"
                  onClick={() => setBulkInput('')}
                  className="absolute right-3.5 bottom-3.5 text-slate-400 hover:text-rose-400 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
                  title="Clear all titles"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Bulk Stats and info */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-b border-slate-800/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold text-indigo-300">
                  Total Titles: {bulkResults.length}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                💡 Change formatting options below to re-compile all slugs instantly.
              </p>
            </div>

            {/* Maximum Slug Length for Bulk */}
            <div className="space-y-1.5 pt-1">
              <label htmlFor="max-length-input-bulk" className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                <span>Maximum Slug Length</span>
                <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300 font-bold">{maxLength} chars</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="max-length-input-bulk"
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
        )}

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

          {/* Case Formatting Selector */}
          <div className="space-y-2 bg-slate-950/20 border border-slate-800/40 p-4 rounded-xl">
            <label htmlFor="case-formatting-select" className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Case Formatting
            </label>
            <select
              id="case-formatting-select"
              value={caseFormatting}
              onChange={(e) => setCaseFormatting(e.target.value as any)}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none transition cursor-pointer"
            >
              <option value="lowercase">lowercase (default)</option>
              <option value="kebab">kebab-case</option>
              <option value="snake">snake_case</option>
              <option value="pascal">PascalCase</option>
            </select>
            <p className="text-[10px] text-slate-500 leading-normal">
              Determines the overall casing structure and segment separator of your generated slug.
            </p>
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
        
        {activeMode === 'single' ? (
          <>
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
                      className="text-slate-400 hover:text-white p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800/80 transition cursor-pointer"
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

              {/* Slug Conflict Validator */}
              {slugValidationResults && (
                <div id="seo-slug-validator" className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                        Slug Conflict Validator
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-extrabold border ${
                        slugValidationResults.status === 'safe'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : slugValidationResults.status === 'warning'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {slugValidationResults.status === 'safe' && '✓ Safe & Valid'}
                        {slugValidationResults.status === 'warning' && '⚠ Routing Warnings'}
                        {slugValidationResults.status === 'danger' && '☠ Critical Conflict'}
                      </span>
                    </div>

                    {slugValidationResults.totalFailed > 0 && (
                      <button
                        type="button"
                        onClick={handleAutoFixSlug}
                        className="text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer animate-pulse"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Auto-Fix Slug
                      </button>
                    )}
                  </div>

                  {/* Quick-Action 'Force Lowercase' switch */}
                  <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                      <span className="text-[11px] font-mono text-slate-300 font-medium">Quick-Action: Casing Sanity</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={lowercase}
                          onChange={(e) => {
                            setLowercase(e.target.checked);
                            if (e.target.checked && caseFormatting !== 'lowercase') {
                              setCaseFormatting('lowercase');
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-indigo-400 after:border-slate-500 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600/30 border border-slate-700/80"></div>
                      </div>
                      <span className="text-xs font-semibold text-slate-200">
                        Force Lowercase
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {slugValidationResults.rules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`p-2.5 rounded-lg border transition duration-150 flex items-start gap-2 ${
                          rule.passed
                            ? 'bg-slate-900/10 border-slate-800/40 text-slate-500'
                            : rule.severity === 'error'
                            ? 'bg-rose-500/[0.03] border-rose-500/25 text-rose-300'
                            : 'bg-amber-500/[0.03] border-amber-500/25 text-amber-300'
                        }`}
                        title={rule.passed ? rule.passMessage : rule.failMessage}
                      >
                        <span className="shrink-0 mt-0.5">
                          {rule.passed ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : rule.severity === 'error' ? (
                            <span className="text-rose-400 font-bold">☠</span>
                          ) : (
                            <span className="text-amber-400 font-bold">⚠</span>
                          )}
                        </span>
                        <div className="space-y-0.5">
                          <span className={`font-mono text-[10px] font-bold block ${rule.passed ? 'text-slate-500' : 'text-slate-300'}`}>
                            {rule.label}
                          </span>
                          <p className="text-[10px] leading-tight text-slate-400 font-sans">
                            {rule.passed ? rule.passMessage : rule.failMessage}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full URL Configurator */}
              <div className="space-y-3.5 border-t border-slate-800/40 pt-4">
                <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  Full URL Configurator
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* Select Prefix Dropdown */}
                  <div className="sm:col-span-5">
                    <label htmlFor="url-prefix-select" className="block text-[9px] font-mono uppercase text-slate-500 mb-1">Prefix / Protocol</label>
                    <select
                      id="url-prefix-select"
                      value={slugDomainPrefix}
                      onChange={(e) => setSlugDomainPrefix(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl p-2 text-xs text-white outline-none font-mono transition cursor-pointer"
                    >
                      <option value="https://">https://</option>
                      <option value="https://www.">https://www.</option>
                      <option value="http://">http://</option>
                      <option value="https://blog.">https://blog.</option>
                      <option value="https://shop.">https://shop.</option>
                      <option value="https://app.">https://app.</option>
                      <option value="">(None)</option>
                    </select>
                  </div>

                  {/* Custom Domain Input */}
                  <div className="sm:col-span-7">
                    <label htmlFor="url-domain-input" className="block text-[9px] font-mono uppercase text-slate-500 mb-1">Base Domain</label>
                    <input
                      id="url-domain-input"
                      type="text"
                      value={slugCustomDomain}
                      onChange={(e) => setSlugCustomDomain(e.target.value.replace(/[^a-zA-Z0-9.-]/g, ''))}
                      placeholder="mysite.com"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono transition"
                    />
                  </div>
                </div>

                {/* Quick Prefix Selector Buttons/Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Quick Prefixes:</span>
                  {[
                    { label: 'https://', value: 'https://' },
                    { label: 'https://www.', value: 'https://www.' },
                    { label: 'blog.', value: 'https://blog.' },
                    { label: 'shop.', value: 'https://shop.' },
                    { label: 'none', value: '' }
                  ].map((prefix) => (
                    <button
                      key={prefix.label}
                      type="button"
                      onClick={() => setSlugDomainPrefix(prefix.value)}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono transition cursor-pointer ${
                        slugDomainPrefix === prefix.value
                          ? 'bg-indigo-600/25 border border-indigo-500/40 text-indigo-300 font-bold'
                          : 'bg-slate-950/40 border border-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {prefix.label}
                    </button>
                  ))}
                </div>

                {/* Live Preview Area */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                      Live URL Preview
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400">
                      {`${slugDomainPrefix}${slugCustomDomain || 'mysite.com'}/${standardSlug}`.length} chars
                    </span>
                  </div>
                  
                  <div className="bg-slate-950/90 border border-indigo-500/20 rounded-xl p-3 flex items-center justify-between gap-2.5">
                    <div className="font-mono text-xs overflow-x-auto select-all break-all leading-normal text-slate-300 whitespace-pre-wrap flex-1 pr-1">
                      <span className="text-slate-500">{slugDomainPrefix}</span>
                      <span className="text-slate-400">{slugCustomDomain || 'mysite.com'}</span>
                      <span className="text-indigo-400">/</span>
                      <span className="text-emerald-400 font-semibold">{standardSlug || 'your-slug-here'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const fullVal = `${slugDomainPrefix}${slugCustomDomain || 'mysite.com'}/${standardSlug}`;
                        navigator.clipboard.writeText(fullVal);
                        setUrlCopied(true);
                        setTimeout(() => setUrlCopied(false), 2000);
                      }}
                      disabled={!standardSlug}
                      className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800/80 transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      title="Copy Full URL"
                    >
                      {urlCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
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
                        className="text-[10px] bg-slate-950/80 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/30 px-2 py-0.5 rounded-md flex items-center gap-1.5 transition duration-150 cursor-pointer"
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
                        className={`text-[10px] flex items-center gap-1 px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
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
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 overflow-x-auto">
                          <span>{slugDomainPrefix || 'https://'}{slugCustomDomain || 'mysite.com'}</span>
                          <span className="text-slate-600">›</span>
                          <span className="text-emerald-400 font-mono overflow-hidden whitespace-nowrap text-ellipsis max-w-xs">{standardSlug}</span>
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
                            <div className="text-[9px] text-slate-500 font-mono">{(slugCustomDomain || 'mysite.com').toUpperCase()}/BLOG/{standardSlug.toUpperCase()}</div>
                            <div className="text-[10px] text-slate-300 font-semibold line-clamp-1">{title || 'Example Post Title'}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {previewTab === 'developer' && (
                      <div className="space-y-1 text-slate-400 select-none">
                        <div className="text-[10px] text-slate-500 font-mono">// Next.js / Express Route Path Reference</div>
                        <code className="text-[10px] font-mono text-indigo-300 block bg-slate-950 p-2 rounded border border-slate-900">
                          /src/app/posts/{`[`}slug{`]`}/page.tsx ➔ /{standardSlug}
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
                            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 transition shrink-0 cursor-pointer"
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
                              className="text-slate-500 hover:text-white transition shrink-0 cursor-pointer"
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
          </>
        ) : (
          <>
            {/* Full URL Configurator */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                Full URL Configurator
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* Select Prefix Dropdown */}
                <div className="sm:col-span-5">
                  <label htmlFor="url-prefix-select-bulk" className="block text-[9px] font-mono uppercase text-slate-500 mb-1">Prefix / Protocol</label>
                  <select
                    id="url-prefix-select-bulk"
                    value={slugDomainPrefix}
                    onChange={(e) => setSlugDomainPrefix(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl p-2 text-xs text-white outline-none font-mono transition cursor-pointer"
                  >
                    <option value="https://">https://</option>
                    <option value="https://www.">https://www.</option>
                    <option value="http://">http://</option>
                    <option value="https://blog.">https://blog.</option>
                    <option value="https://shop.">https://shop.</option>
                    <option value="https://app.">https://app.</option>
                    <option value="">(None)</option>
                  </select>
                </div>

                {/* Custom Domain Input */}
                <div className="sm:col-span-7">
                  <label htmlFor="url-domain-input-bulk" className="block text-[9px] font-mono uppercase text-slate-500 mb-1">Base Domain</label>
                  <input
                    id="url-domain-input-bulk"
                    type="text"
                    value={slugCustomDomain}
                    onChange={(e) => setSlugCustomDomain(e.target.value.replace(/[^a-zA-Z0-9.-]/g, ''))}
                    placeholder="mysite.com"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono transition"
                  />
                </div>
              </div>

              {/* Quick Prefix Selector Buttons/Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Quick Prefixes:</span>
                {[
                  { label: 'https://', value: 'https://' },
                  { label: 'https://www.', value: 'https://www.' },
                  { label: 'blog.', value: 'https://blog.' },
                  { label: 'shop.', value: 'https://shop.' },
                  { label: 'none', value: '' }
                ].map((prefix) => (
                  <button
                    key={prefix.label}
                    type="button"
                    onClick={() => setSlugDomainPrefix(prefix.value)}
                    className={`text-[10px] px-2 py-0.5 rounded font-mono transition cursor-pointer ${
                      slugDomainPrefix === prefix.value
                        ? 'bg-indigo-600/25 border border-indigo-500/40 text-indigo-300 font-bold'
                        : 'bg-slate-950/40 border border-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {prefix.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk Compiled Slugs list card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Bulk Compiled Slugs
                  </h3>
                  <p className="text-[10px] text-slate-500">Live generated batch permalinks</p>
                </div>

                {/* Download CSV button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={bulkResults.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-850 disabled:text-slate-500 disabled:border-slate-800 border border-emerald-500/20 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/20 active:scale-[0.98] transition cursor-pointer shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export to CSV</span>
                </button>
              </div>

              {bulkResults.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800/80">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No titles entered yet.</p>
                  <p className="text-[10px] text-slate-600 mt-1">Paste multiple titles on the left to generate slugs.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {bulkResults.map((item, idx) => (
                    <div key={idx} className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Title #{idx + 1}</span>
                          <p className="text-xs text-slate-300 truncate font-sans" title={item.title}>
                            {item.title}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.slug);
                            setBulkCopiedId(idx);
                            setTimeout(() => setBulkCopiedId(null), 1500);
                          }}
                          className="text-slate-400 hover:text-white p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition shrink-0 cursor-pointer"
                          title="Copy generated slug"
                        >
                          {bulkCopiedId === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="font-mono text-xs text-indigo-300 break-all bg-slate-950 p-2.5 rounded border border-slate-900 flex flex-col gap-1 select-all">
                        <div className="text-[9px] text-slate-500 font-sans font-semibold uppercase tracking-wider">Slug:</div>
                        <span className="text-emerald-400 font-bold">{item.slug}</span>
                        <div className="text-[9px] text-slate-500 font-sans font-semibold uppercase tracking-wider mt-1">Full URL:</div>
                        <span className="text-indigo-400 text-[11px] truncate" title={item.fullUrl}>{item.fullUrl}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>

      {/* Tool Page SEO Metadata Content */}
      <div id="slugifier-seo-spec" className="lg:col-span-12 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-4 mt-2">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Tool Page SEO Specifications</h3>
              <p className="text-[10px] text-slate-500">Search Engine Indexing Configuration for this Tool Page</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-3 bg-slate-950/40 border border-slate-800/60 rounded-lg p-3.5">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">SEO Title Content</span>
              <p className="text-slate-300 font-sans leading-relaxed text-[11px]">
                Free SEO URL Slugifier &amp; Link Permalinks Architect
              </p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">SEO Meta Description</span>
              <p className="text-slate-400 font-sans leading-relaxed text-[11px]">
                Convert raw post and page titles into clean, keyword-focused, search-optimized URL slugs. Optimize click-through-rate, strip stop words, append dates or custom hashes, and perform technical audits with AI.
              </p>
            </div>
          </div>

          <div className="space-y-3 bg-slate-950/40 border border-slate-800/60 rounded-lg p-3.5">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">SEO Keywords Content</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  "url slugifier",
                  "url builder",
                  "permalink creator",
                  "seo slug generator",
                  "custom url slug",
                  "slug editor",
                  "free seo tools"
                ].map((keyword) => (
                  <span key={keyword} className="bg-indigo-950/50 text-indigo-300 border border-indigo-900/40 px-2 py-0.5 rounded text-[10px]">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-sans">
              <span>Status: <strong className="text-emerald-500 font-semibold">Fully Optimized</strong></span>
              <span>Robots: <strong className="text-emerald-500 font-semibold">index, follow</strong></span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

import { useState } from 'react';
import { 
  Globe, 
  Code, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Check, 
  Sparkles, 
  HelpCircle, 
  Layers, 
  Eye, 
  Share2, 
  FileText, 
  RefreshCw, 
  Info, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MetaTag {
  name?: string;
  property?: string;
  content?: string;
  raw: string;
}

interface LinkTag {
  rel?: string;
  href?: string;
  raw: string;
}

interface ParsedTags {
  title: string;
  metaTagsCount: number;
  linkTagsCount: number;
  metaTags: MetaTag[];
  linkTags: LinkTag[];
}

interface Recommendation {
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  title: string;
  issue: string;
  fix: string;
}

interface AuditData {
  title: string;
  description: string;
  canonicalUrl: string;
  viewport: string;
  openGraphStatus: {
    score: number;
    presentTags: string[];
    missingTags: string[];
    assessment: string;
  };
  canonicalStatus: {
    isPresent: boolean;
    isValid: boolean;
    urlFound: string;
    assessment: string;
  };
  viewportStatus: {
    isPresent: boolean;
    isResponsive: boolean;
    valueFound: string;
    assessment: string;
  };
  seoStatus: {
    titleLength: number;
    titleAssessment: string;
    descriptionLength: number;
    descriptionAssessment: string;
  };
  totalScore: number;
  overallGrade: string;
  overallSummary: string;
  recommendations: Recommendation[];
  socialPreview: {
    title: string;
    description: string;
    image: string;
    siteName: string;
    twitterCard: string;
  };
}

interface ApiResponse {
  source: string;
  fetchedUrl: string;
  parsedTags: ParsedTags;
  audit: AuditData;
}

export default function MetaTagAuditor() {
  const [url, setUrl] = useState<string>('');
  const [htmlPaste, setHtmlPaste] = useState<string>('');
  const [mode, setMode] = useState<'url' | 'paste'>('url');
  
  // Status states
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Results
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'previews' | 'checklist' | 'raw-tags'>('overview');
  const [previewChannel, setPreviewChannel] = useState<'google' | 'facebook' | 'twitter'>('google');
  
  // Recommendations priority filter
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');

  // URL test presets
  const urlPresets = [
    { label: 'Google', url: 'https://www.google.com' },
    { label: 'GitHub', url: 'https://github.com' },
    { label: 'Wikipedia', url: 'https://en.wikipedia.org' },
    { label: 'Dev.to', url: 'https://dev.to' }
  ];

  // HTML content presets
  const htmlPresets = [
    {
      label: 'Perfect SEO Template',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Ultimate Technical SEO and Audit Playbook for 2026</title>
  <meta name="description" content="A comprehensive deep-dive guide covering web architecture performance, secure links, canonical validation, and indexable meta designs.">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="canonical" href="https://example.com/ultimate-seo-playbook">
  
  <!-- Open Graph -->
  <meta property="og:title" content="The Ultimate Technical SEO and Audit Playbook for 2026">
  <meta property="og:description" content="A comprehensive deep-dive guide covering web architecture performance, secure links, and indexable meta designs.">
  <meta property="og:image" content="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80">
  <meta property="og:url" content="https://example.com/ultimate-seo-playbook">
  <meta property="og:site_name" content="Webmasters Laboratory">
  <meta property="og:type" content="article">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="The Ultimate Technical SEO and Audit Playbook for 2026">
  <meta name="twitter:description" content="A comprehensive deep-dive guide covering web architecture performance.">
  <meta name="twitter:image" content="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80">
</head>
<body>
  <h1>Hello SEO World</h1>
</body>
</html>`
    },
    {
      label: 'Broken/Minimalist Head',
      html: `<!DOCTYPE html>
<html>
<head>
  <title>Short Title</title>
  <!-- Missing description -->
  <!-- Missing canonical URL -->
  <!-- Missing OpenGraph tags entirely -->
  <meta name="viewport" content="width=device-width, initial-scale=0.8, user-scalable=no">
</head>
<body>
  <h1>Bad Head Meta Examples</h1>
</body>
</html>`
    }
  ];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    if (mode === 'url') {
      if (!url.trim()) {
        setError('Please enter a valid URL to scan.');
        setLoading(false);
        return;
      }
      setStatusMessage('Initializing secure connection to target server...');
    } else {
      if (!htmlPaste.trim()) {
        setError('Please paste the page HTML code to analyze.');
        setLoading(false);
        return;
      }
      setStatusMessage('Parsing local HTML string structure...');
    }

    const stages = mode === 'url' ? [
      'Establishing connection & spoofing standard webagent headers...',
      'Downloading raw head document tags...',
      'Isolating <head> element and meta arrays...',
      'Submitting tags to Gemini Technical SEO model...',
      'Evaluating OpenGraph, Canonical integrity, and mobile viewport specifications...',
      'Generating priority-based recommendation fixes...'
    ] : [
      'Analyzing pasted document structure...',
      'Sanitizing raw html tags...',
      'Extracting meta and link relationships...',
      'Invoking Gemini 3.5 Flash meta parser...',
      'Synthesizing social preview parameters and checklists...'
    ];

    let currentStage = 0;
    const stageInterval = setInterval(() => {
      if (currentStage < stages.length - 1) {
        currentStage++;
        setStatusMessage(stages[currentStage]);
      }
    }, 1300);

    try {
      const response = await fetch('/api/meta-tag-auditor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: mode === 'url' ? url.trim() : undefined,
          html: mode === 'paste' ? htmlPaste.trim() : undefined
        })
      });

      clearInterval(stageInterval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error during meta tag auditing.');
      }

      const data: ApiResponse = await response.json();
      setResult(data);
      setActiveTab('overview');
    } catch (err: any) {
      clearInterval(stageInterval);
      console.error(err);
      setError(err.message || 'An error occurred while analyzing the target content.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
      case 'Medium':
        return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
      case 'Low':
        return { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' };
    }
  };

  const getScoreInfo = (score: number) => {
    if (score >= 90) return { color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', status: 'Optimal' };
    if (score >= 70) return { color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5', status: 'Needs Improvement' };
    return { color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5', status: 'Critical Issues' };
  };

  const filteredRecommendations = result?.audit.recommendations.filter(rec => 
    priorityFilter === 'all' ? true : rec.priority === priorityFilter
  ) || [];

  return (
    <div id="meta-auditor-root" className="space-y-6 text-white font-sans max-w-7xl mx-auto">
      
      {/* Top Controller: URL Entry & Paste HTML */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/60 pb-5 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-900/40 text-indigo-400 text-[10px] font-mono uppercase tracking-wider font-extrabold px-2.5 py-1 rounded border border-indigo-500/20">
                SEO Engineering
              </span>
              <span className="text-[11px] text-slate-500 font-mono">v1.1</span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Meta Tag Auditor
            </h1>
          </div>

          {/* Toggle Scan Mode */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => { setMode('url'); setError(null); }}
              className={`text-xs px-4 py-2 rounded-lg font-medium transition ${
                mode === 'url' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Scan Live URL
            </button>
            <button
              type="button"
              onClick={() => { setMode('paste'); setError(null); }}
              className={`text-xs px-4 py-2 rounded-lg font-medium transition ${
                mode === 'paste' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paste Raw HTML
            </button>
          </div>
        </div>

        {/* URL scan panel */}
        {mode === 'url' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <Globe className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter full website URL (e.g. https://github.com)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
              <button
                type="button"
                onClick={runAudit}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Audit Meta Tags</span>
              </button>
            </div>

            {/* URL Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-mono text-[10px] uppercase">Test popular live sites:</span>
              {urlPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setUrl(preset.url)}
                  className="bg-slate-950/60 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded text-slate-400 hover:text-slate-200 transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paste HTML panel */}
        {mode === 'paste' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                Pasted Document &lt;head&gt; or full source
              </label>
              <textarea
                rows={8}
                value={htmlPaste}
                onChange={(e) => setHtmlPaste(e.target.value)}
                placeholder="Paste the source HTML or the <head> tags here..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl p-3.5 text-xs font-mono text-indigo-300 placeholder-slate-600 outline-none resize-none transition"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-mono text-[10px] uppercase">Fill Preset Template:</span>
                {htmlPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setHtmlPaste(preset.html)}
                    className="bg-slate-950/60 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded text-slate-400 hover:text-slate-200 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={runAudit}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Audit HTML Metadata</span>
              </button>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mt-4 bg-rose-950/20 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-normal">
              <span className="font-semibold block text-rose-400">Scan Notice</span>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading Stage Panel */}
      {loading && (
        <div className="bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-8 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-5">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-900/40 border-t-indigo-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-semibold text-slate-200">Assembling Audit Metrics</h4>
            <p className="text-xs text-indigo-300 font-mono max-w-lg transition-all">{statusMessage}</p>
          </div>
        </div>
      )}

      {/* Audit Report Container */}
      {result && !loading && (
        <div className="space-y-6">
          
          {/* Executive Overview Header Cards */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Grade Card */}
            <div className="md:col-span-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>
              
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">AUDIT SCORE CARD</div>
              
              <div className="relative flex items-center justify-center my-2">
                {/* Score Dial Wrapper */}
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="#1e293b"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="#6366f1"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={301.6}
                    strokeDashoffset={301.6 - (301.6 * result.audit.totalScore) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white tracking-tight">{result.audit.totalScore}</span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">/100</span>
                </div>
              </div>

              <div className="mt-2 space-y-1">
                <span className={`text-sm font-bold uppercase tracking-wide ${getScoreInfo(result.audit.totalScore).color}`}>
                  Grade {result.audit.overallGrade} • {getScoreInfo(result.audit.totalScore).status}
                </span>
                <p className="text-[11px] text-slate-400 font-mono max-w-[200px] mx-auto line-clamp-1">
                  Source: {result.source === 'fetched_url' ? 'Live Web Scan' : 'HTML Code Input'}
                </p>
              </div>
            </div>

            {/* Executive Summary Narrative */}
            <div className="md:col-span-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Webmaster Executive Briefing
                  </span>
                  {result.fetchedUrl && (
                    <a 
                      href={result.fetchedUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 transition"
                    >
                      <span className="truncate max-w-[150px]">{result.fetchedUrl}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <h3 className="text-base font-semibold text-slate-100">
                  {result.audit.title || <span className="text-slate-500 italic">No Title Tag Detected</span>}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.audit.overallSummary}
                </p>
              </div>

              {/* Tag Overview Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/60">
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40 text-center">
                  <span className="text-[9px] text-slate-500 uppercase font-mono block">Meta Tags</span>
                  <span className="text-sm font-bold text-slate-200">{result.parsedTags.metaTagsCount} found</span>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40 text-center">
                  <span className="text-[9px] text-slate-500 uppercase font-mono block">Link Rel</span>
                  <span className="text-sm font-bold text-slate-200">{result.parsedTags.linkTagsCount} found</span>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40 text-center">
                  <span className="text-[9px] text-slate-500 uppercase font-mono block">Canonical</span>
                  <span className={`text-xs font-bold block ${result.audit.canonicalStatus.isPresent ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.audit.canonicalStatus.isPresent ? 'Configured' : 'Missing'}
                  </span>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40 text-center">
                  <span className="text-[9px] text-slate-500 uppercase font-mono block">Responsive</span>
                  <span className={`text-xs font-bold block ${result.audit.viewportStatus.isResponsive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.audit.viewportStatus.isResponsive ? 'Optimal' : 'Flagged'}
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800/60">
            {([
              { id: 'overview', label: 'Technical Report', icon: FileText },
              { id: 'previews', label: 'Visual SERP & Social Previews', icon: Eye },
              { id: 'checklist', label: 'Action Checklist', icon: CheckCircle },
              { id: 'raw-tags', label: 'Parsed Tags Index', icon: Code }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-lg">
            
            {/* TAB: Technical Report */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                <h4 className="text-sm font-semibold text-slate-300 border-b border-slate-800/60 pb-2">
                  Head Tag Audit Breakdown
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Title & Description Check */}
                  <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-4.5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        Page Title &amp; Description
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase">
                          <span>Page Title Tag</span>
                          <span className="text-indigo-400 font-bold">{result.audit.seoStatus.titleLength} chars</span>
                        </div>
                        <p className="bg-slate-950/80 p-2.5 rounded border border-slate-900 text-slate-300">
                          {result.audit.title || <span className="text-rose-400 italic">None found</span>}
                        </p>
                        <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          {result.audit.seoStatus.titleAssessment}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase">
                          <span>Meta Description</span>
                          <span className="text-indigo-400 font-bold">{result.audit.seoStatus.descriptionLength} chars</span>
                        </div>
                        <p className="bg-slate-950/80 p-2.5 rounded border border-slate-900 text-slate-300">
                          {result.audit.description || <span className="text-rose-400 italic">None found</span>}
                        </p>
                        <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          {result.audit.seoStatus.descriptionAssessment}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Canonical & Viewport check */}
                  <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-4.5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-indigo-400" />
                        Canonical URL &amp; Viewport
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Canonical URL status */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[10px] font-mono uppercase">Canonical Tag configuration</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            result.audit.canonicalStatus.isPresent 
                              ? result.audit.canonicalStatus.isValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400' 
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {result.audit.canonicalStatus.isPresent ? result.audit.canonicalStatus.isValid ? 'VALID' : 'INVALID' : 'MISSING'}
                          </span>
                        </div>
                        <p className="bg-slate-950/80 p-2.5 rounded border border-slate-900 text-slate-300 font-mono break-all text-[11px]">
                          {result.audit.canonicalStatus.urlFound || <span className="text-rose-400 italic">None found</span>}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          {result.audit.canonicalStatus.assessment}
                        </p>
                      </div>

                      {/* Viewport status */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[10px] font-mono uppercase">Viewport Configuration</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            result.audit.viewportStatus.isResponsive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {result.audit.viewportStatus.isResponsive ? 'OPTIMAL' : 'FLAGGED'}
                          </span>
                        </div>
                        <p className="bg-slate-950/80 p-2.5 rounded border border-slate-900 text-slate-300 font-mono text-[11px]">
                          {result.audit.viewportStatus.valueFound || <span className="text-rose-400 italic">None found</span>}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          {result.audit.viewportStatus.assessment}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* OpenGraph & Social Tag Presence Metrics */}
                <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Share2 className="w-4 h-4 text-indigo-400" />
                        OpenGraph &amp; Twitter Metadata Audit
                      </span>
                      <p className="text-[11px] text-slate-500">Checking standard tags for rich messaging card rendering</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-900 font-mono text-xs">
                      <span className="text-slate-500">Card Score:</span>
                      <span className="text-indigo-400 font-bold">{result.audit.openGraphStatus.score}%</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 pb-2">
                    {result.audit.openGraphStatus.assessment}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Present tags list */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider font-bold block">
                        ✓ Present Tags ({result.audit.openGraphStatus.presentTags.length})
                      </span>
                      {result.audit.openGraphStatus.presentTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {result.audit.openGraphStatus.presentTags.map(tag => (
                            <span key={tag} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px] font-mono">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">No OpenGraph tags detected.</span>
                      )}
                    </div>

                    {/* Missing tags list */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase text-rose-400 tracking-wider font-bold block">
                        ⚠️ Missing Tags ({result.audit.openGraphStatus.missingTags.length})
                      </span>
                      {result.audit.openGraphStatus.missingTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {result.audit.openGraphStatus.missingTags.map(tag => (
                            <span key={tag} className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[11px] font-mono">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-400 text-[11px] italic flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> All standard social sharing tags present!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: Previews (SERP, Facebook, Twitter) */}
            {activeTab === 'previews' && (
              <div className="space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-slate-300">
                      High-Fidelity Visual Card Previews
                    </h4>
                    <p className="text-[11px] text-slate-500">Simulate search engine results and social media link previews</p>
                  </div>

                  {/* Channel selectors */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 self-start sm:self-auto">
                    {[
                      { id: 'google', label: 'Google SERP' },
                      { id: 'facebook', label: 'Facebook / OG' },
                      { id: 'twitter', label: 'Twitter Card' }
                    ].map(ch => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setPreviewChannel(ch.id as any)}
                        className={`text-[10px] px-3 py-1.5 rounded-lg font-medium transition ${
                          previewChannel === ch.id
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Google Card */}
                {previewChannel === 'google' && (
                  <div className="max-w-2xl bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 space-y-2 select-none mx-auto">
                    <div className="text-[11px] text-slate-500 font-mono uppercase tracking-wide flex items-center gap-1">
                      <span>Simulated Google SERP Snippet</span>
                      <span className="text-[9px] bg-slate-900 text-slate-500 px-1 rounded">Desktop view</span>
                    </div>

                    <div className="space-y-1 pt-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>https://example.com</span>
                        <span className="text-slate-600">›</span>
                        <span className="text-emerald-500 truncate font-mono max-w-xs">
                          {result.audit.canonicalUrl ? result.audit.canonicalUrl.replace(/^https?:\/\//, '').split('/')[1] || 'post' : 'post'}
                        </span>
                      </div>
                      
                      <div className="text-lg text-[#8ab4f8] hover:underline cursor-pointer font-medium leading-tight">
                        {result.audit.socialPreview.title || result.audit.title || 'Missing title fallback'}
                      </div>
                      
                      <p className="text-xs text-slate-400 leading-normal font-sans line-clamp-2 pt-0.5">
                        {result.audit.socialPreview.description || result.audit.description || 'Missing page meta description tag fallback. Fill this space to optimize CTR and click intent.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Simulated Facebook/Facebook OpenGraph Card */}
                {previewChannel === 'facebook' && (
                  <div className="max-w-md bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-hidden select-none mx-auto shadow-2xl">
                    <div className="bg-slate-900 px-4 py-2 text-[10px] font-mono text-slate-500 uppercase tracking-wide border-b border-slate-950 flex justify-between">
                      <span>Simulated Facebook Rich Card</span>
                      <span className="text-indigo-400">og:tag optimized</span>
                    </div>

                    {/* Image space */}
                    <div className="relative aspect-[1.91/1] bg-slate-900 flex items-center justify-center border-b border-slate-900 overflow-hidden group">
                      {result.audit.socialPreview.image ? (
                        <img 
                          src={result.audit.socialPreview.image} 
                          alt="OpenGraph visual asset" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If load fails, fallback to simple placeholder
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent"></div>
                      {!result.audit.socialPreview.image && (
                        <div className="text-center p-4">
                          <XCircle className="w-8 h-8 text-rose-500/60 mx-auto mb-1" />
                          <span className="text-[10px] font-mono text-slate-500 uppercase block">og:image undefined</span>
                          <span className="text-[9px] text-slate-600">Please provide a valid preview asset URL.</span>
                        </div>
                      )}
                    </div>

                    {/* Meta textual wrapper */}
                    <div className="p-3 bg-[#1e293b]/50 space-y-1">
                      <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-mono truncate">
                        {result.audit.socialPreview.siteName || 'EXAMPLE.COM'}
                      </div>
                      <div className="text-xs text-slate-200 font-bold leading-tight line-clamp-1">
                        {result.audit.socialPreview.title || result.audit.title || 'Untitled Post'}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                        {result.audit.socialPreview.description || result.audit.description || 'Missing post summary text.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Simulated Twitter Card */}
                {previewChannel === 'twitter' && (
                  <div className="max-w-sm bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-hidden select-none mx-auto shadow-2xl">
                    <div className="bg-slate-900 px-4 py-2 text-[10px] font-mono text-slate-500 uppercase tracking-wide border-b border-slate-950 flex justify-between">
                      <span>Simulated X (Twitter) Card</span>
                      <span className="text-sky-400">{result.audit.socialPreview.twitterCard || 'summary_large_image'}</span>
                    </div>

                    {/* Image space (constrained by twitter card type if specified) */}
                    <div className="relative aspect-[1.91/1] bg-slate-900 flex items-center justify-center border-b border-slate-900 overflow-hidden">
                      {result.audit.socialPreview.image ? (
                        <img 
                          src={result.audit.socialPreview.image} 
                          alt="Twitter card social content" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <XCircle className="w-8 h-8 text-rose-500/60 mx-auto mb-1" />
                          <span className="text-[10px] font-mono text-slate-500 uppercase block">twitter:image undefined</span>
                          <span className="text-[9px] text-slate-600">Falls back to standard OG image tags if missing.</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-0.5">
                      <div className="text-[9px] uppercase text-slate-500 font-mono flex items-center gap-1">
                        <span>𝕏 post link snippet</span>
                        <span>•</span>
                        <span>{result.audit.socialPreview.siteName || 'example.com'}</span>
                      </div>
                      <div className="text-xs text-slate-200 font-semibold line-clamp-1">
                        {result.audit.socialPreview.title || result.audit.title}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {result.audit.socialPreview.description || result.audit.description}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB: Action Checklist */}
            {activeTab === 'checklist' && (
              <div className="space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-slate-300">
                      Webmaster Recommendations &amp; Fix Checklist
                    </h4>
                    <p className="text-[11px] text-slate-500">Priority-sorted actions to achieve 100% SEO, social sharing, and accessibility index indexability</p>
                  </div>

                  {/* Priority Filters */}
                  <div className="flex flex-wrap gap-1.5 self-start sm:self-auto text-xs">
                    {(['all', 'High', 'Medium', 'Low'] as const).map(prio => (
                      <button
                        key={prio}
                        type="button"
                        onClick={() => setPriorityFilter(prio)}
                        className={`px-3 py-1 rounded-lg border font-medium transition ${
                          priorityFilter === prio
                            ? 'bg-indigo-600/20 border-indigo-500/60 text-indigo-300'
                            : 'bg-transparent border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {prio === 'all' ? 'All Priority' : `${prio} priority`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommendations list */}
                {filteredRecommendations.length > 0 ? (
                  <div className="space-y-4">
                    {filteredRecommendations.map((rec, idx) => {
                      const colors = getPriorityColor(rec.priority);
                      return (
                        <div key={idx} className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-5 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${colors.bg} ${colors.text} ${colors.border}`}>
                                {rec.priority} Priority
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">{rec.category}</span>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs">
                            <span className="text-slate-200 font-semibold text-sm block">{rec.title}</span>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block">⚠️ Identified Issue</span>
                                <p className="text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-900">
                                  {rec.issue}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">✓ Recommended Fix</span>
                                <div className="bg-slate-950/60 p-2.5 rounded border border-slate-900 relative group">
                                  <p className="text-slate-300 leading-relaxed pr-8 font-mono text-[11px] whitespace-pre-wrap">
                                    {rec.fix}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(rec.fix, `rec-fix-${idx}`)}
                                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white p-1 rounded bg-slate-950 border border-slate-900 transition opacity-0 group-hover:opacity-100"
                                    title="Copy code payload"
                                  >
                                    {copiedText === `rec-fix-${idx}` ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                    <CheckCircle className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
                    <span className="text-xs text-slate-400 font-mono block">Zero issues matching filter constraints.</span>
                    <span className="text-[10px] text-slate-500">Excellent job optimizing this web property!</span>
                  </div>
                )}

              </div>
            )}

            {/* TAB: Parsed Tags Index */}
            {activeTab === 'raw-tags' && (
              <div className="space-y-6">
                
                <div className="border-b border-slate-800/60 pb-4">
                  <h4 className="text-sm font-semibold text-slate-300">
                    HTML Meta &amp; Link Tags Registry
                  </h4>
                  <p className="text-[11px] text-slate-500">Live indexed HTML attributes extracted directly from target head buffer</p>
                </div>

                <div className="space-y-4">
                  {/* Meta tags index list */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase text-indigo-400 tracking-wider font-bold block">
                      Indexed Meta Tags ({result.parsedTags.metaTags.length})
                    </span>
                    
                    {result.parsedTags.metaTags.length > 0 ? (
                      <div className="max-h-72 overflow-y-auto border border-slate-800/80 rounded-xl bg-slate-950 divide-y divide-slate-900">
                        {result.parsedTags.metaTags.map((tag, idx) => (
                          <div key={idx} className="p-3 flex items-start justify-between gap-4 text-[11px] font-mono">
                            <div className="space-y-1 truncate flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold">
                                  #{idx + 1}
                                </span>
                                {tag.name && <span className="text-indigo-400">name="{tag.name}"</span>}
                                {tag.property && <span className="text-sky-400">property="{tag.property}"</span>}
                              </div>
                              <div className="text-slate-300 truncate max-w-2xl text-[10px]" title={tag.content}>
                                content="{tag.content || ''}"
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleCopy(tag.raw, `tag-raw-${idx}`)}
                              className="text-slate-600 hover:text-white p-1 rounded hover:bg-slate-900 transition shrink-0"
                              title="Copy raw html tag"
                            >
                              {copiedText === `tag-raw-${idx}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs italic block">No Meta tags parsed from document.</span>
                    )}
                  </div>

                  {/* Links registry */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-mono uppercase text-indigo-400 tracking-wider font-bold block">
                      Indexed Link Relationships ({result.parsedTags.linkTags.length})
                    </span>
                    
                    {result.parsedTags.linkTags.length > 0 ? (
                      <div className="max-h-52 overflow-y-auto border border-slate-800/80 rounded-xl bg-slate-950 divide-y divide-slate-900">
                        {result.parsedTags.linkTags.map((link, idx) => (
                          <div key={idx} className="p-3 flex items-start justify-between gap-4 text-[11px] font-mono">
                            <div className="space-y-1 truncate flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold">
                                  #{idx + 1}
                                </span>
                                <span className="text-teal-400">rel="{link.rel || ''}"</span>
                              </div>
                              <div className="text-slate-300 truncate max-w-2xl text-[10px]">
                                href="{link.href || ''}"
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleCopy(link.raw, `link-raw-${idx}`)}
                              className="text-slate-600 hover:text-white p-1 rounded hover:bg-slate-900 transition shrink-0"
                              title="Copy raw html link"
                            >
                              {copiedText === `link-raw-${idx}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs italic block">No link tag relationships parsed.</span>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 space-y-2">
          <span className="bg-rose-500/10 text-rose-400 text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border border-rose-500/20 inline-block font-bold">
            Canonical Audit
          </span>
          <h4 className="text-xs font-semibold text-slate-200">The Power of Directives</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Duplicate URL content dilutes SEO page authority. Canonical tags instruct search engines to consolidate ranking power onto a single preferred URL.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 space-y-2">
          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border border-emerald-500/20 inline-block font-bold">
            Social Graph Tags
          </span>
          <h4 className="text-xs font-semibold text-slate-200">Optimizing for Viral Loops</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Beautiful Facebook OpenGraph and Twitter/X Cards double click-through rate (CTR) on social feeds. Correct image aspect ratios protect your visuals from cropping.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 space-y-2">
          <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border border-indigo-500/20 inline-block font-bold">
            Viewport Rules
          </span>
          <h4 className="text-xs font-semibold text-slate-200">Accessibility Compliant</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Restricting zoom capabilities (using <code>user-scalable=no</code> or low scaling values) causes extreme mobile usage penalties and fails critical WCAG accessibility compliance.
          </p>
        </div>
      </div>

      {/* Tool Page SEO Metadata Content */}
      <div id="meta-auditor-seo-spec" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-4">
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
                Free SEO Meta Tag Auditor &amp; Rich Social Card Previewer
              </p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">SEO Meta Description</span>
              <p className="text-slate-400 font-sans leading-relaxed text-[11px]">
                Scan live website URLs or paste raw HTML code blocks to audit missing OpenGraph meta tags, analyze mobile viewport layouts, check canonical link integrity, and simulate real-time visual social sharing previews.
              </p>
            </div>
          </div>

          <div className="space-y-3 bg-slate-950/40 border border-slate-800/60 rounded-lg p-3.5">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">SEO Keywords Content</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  "meta tag auditor",
                  "opengraph checker",
                  "viewport validator",
                  "canonical link checker",
                  "seo metadata audit",
                  "social share preview",
                  "twitter card checker"
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

import { useState } from 'react';
import { 
  Search, 
  Globe, 
  Laptop, 
  Smartphone, 
  Sparkles, 
  Check, 
  Copy, 
  TrendingUp, 
  AlertCircle, 
  HelpCircle, 
  RefreshCw,
  ExternalLink,
  Target,
  DollarSign,
  Activity,
  Award,
  Link as LinkIcon,
  CheckCircle,
  Lightbulb,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface TrendMonth {
  month: string;
  index: number;
}

interface SerpResult {
  rank: number;
  title: string;
  url: string;
  domainAuthority: number;
  pageAuthority: number;
  backlinks: number;
  onPageOptimization: string;
  contentSnippet: string;
}

interface DifficultyResult {
  keyword: string;
  difficultyScore: number;
  difficultyCategory: string;
  difficultyColor: string;
  searchVolume: string;
  searchIntent: string;
  searchIntentDescription: string;
  cpc: string;
  competitionLevel: string;
  trendData: TrendMonth[];
  serpResults: SerpResult[];
  seoRecommendations: string[];
  lsiKeywords: string[];
}

export default function SEOKeywordDifficulty() {
  const [keyword, setKeyword] = useState<string>('');
  const [geoCountry, setGeoCountry] = useState<string>('US');
  const [platform, setPlatform] = useState<string>('Desktop');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DifficultyResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const geoOptions = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'JP', name: 'Japan' },
    { code: 'GLOBAL', name: 'Global / Worldwide' }
  ];

  const handleAnalyze = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setStatusMessage('Querying search engine scrapers and spiders...');

    const stages = [
      'Extracting top search results from live index simulation...',
      'Evaluating domain link profiles and backlink graphs...',
      'Analyzing on-page keywords, header tags, and structural density...',
      'Mapping latent user intent vectors and query mechanics...',
      'Calculating organic competition and keyword difficulty scores...',
      'Formatting full comprehensive search intelligence audits...'
    ];

    let stageIdx = 0;
    const interval = setInterval(() => {
      if (stageIdx < stages.length) {
        setStatusMessage(stages[stageIdx]);
        stageIdx++;
      }
    }, 1200);

    try {
      const response = await fetch('/api/keyword-difficulty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          geoCountry,
          platform
        })
      });

      clearInterval(interval);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server returned an error during analysis.');
      }

      setResult(data);
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setError(err.message || 'Failed to analyze keyword. Check your internet connection or verify your GEMINI_API_KEY in Settings.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const getIntentColor = (intent: string) => {
    const term = intent.toLowerCase();
    if (term.includes('transaction')) return { bg: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' };
    if (term.includes('commercial')) return { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' };
    if (term.includes('navigational')) return { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
    return { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
  };

  return (
    <div id="keyword-difficulty-analyzer" className="max-w-6xl mx-auto px-4 py-8">
      {/* Header section with spacious, clean typography */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Organic Search Competitive intelligence
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          SEO Keyword Difficulty Checker
        </h1>
        <p className="mt-2 text-md text-slate-600 max-w-2xl mx-auto">
          Evaluate any keyword to instantly calculate organic difficulty strength, analyze search intent profiles, map monthly trend indicators, and review ranking page authorities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Keyword Input Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Search className="w-4.5 h-4.5 text-slate-500" />
              Target Keyword Parameters
            </h2>

            <div className="space-y-4">
              {/* Keyword text input */}
              <div>
                <label htmlFor="target-kw-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Search Keyword / Phrase
                </label>
                <div className="relative">
                  <input
                    id="target-kw-input"
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. best credit cards for travel"
                    className="w-full rounded-lg border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 pl-3 pr-10 py-2 border bg-slate-50 focus:bg-white transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAnalyze();
                    }}
                  />
                  <div className="absolute right-3 top-2.5 text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Geographic Country dropdown */}
              <div>
                <label htmlFor="geo-country-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Target Search Region
                  </span>
                </label>
                <select
                  id="geo-country-select"
                  value={geoCountry}
                  onChange={(e) => setGeoCountry(e.target.value)}
                  className="w-full rounded-lg border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border bg-slate-50 focus:bg-white"
                >
                  {geoOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Platform toggle (Desktop/Mobile) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Platform / Crawling User-Agent
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlatform('Desktop')}
                    className={`flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg border transition-all ${
                      platform === 'Desktop'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatform('Mobile')}
                    className={`flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg border transition-all ${
                      platform === 'Mobile'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Mobile
                  </button>
                </div>
              </div>

              {/* Analyze trigger Button */}
              <button
                type="button"
                id="analyze-keyword-btn"
                disabled={!keyword.trim() || loading}
                onClick={handleAnalyze}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Evaluating metrics...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Calculate Difficulty
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick instructions & metadata metrics card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              How is difficulty computed?
            </h4>
            <p className="leading-relaxed">
              Our analyzer simulates search engine PageRank modeling, aggregating the domain authority (DA) and page authority (PA) scores of the top ranking pages, calculating content matching, analyzing keyword density in anchors and title structures, and auditing backlink counts to map a score out of 100.
            </p>
            <div className="pt-2 border-t border-slate-200 space-y-1.5 font-medium text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                <span>0 - 30: Easy (Low competition)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
                <span>31 - 50: Medium (Moderate content/backlinks)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                <span>51 - 70: Hard (Strong authoritative sites)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                <span>71 - 100: Very Hard (High backlink thresholds)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Loading state, Error notices, or visual dashboards */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {/* 1. Empty State */}
            {!keyword && !loading && !result && (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[420px]"
              >
                <div className="p-4 bg-slate-100 rounded-full text-slate-400 mb-4">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-md font-semibold text-slate-800">No Keyword Analyzed</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                  Please enter a target query or keyword phrase in the config panel to generate real-time organic search landscape difficulty and competitor profiles.
                </p>
              </motion.div>
            )}

            {/* 2. Loading State */}
            {loading && (
              <motion.div
                key="loading-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[420px]"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <TrendingUp className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Simulating SERP Landscape</h3>
                <p className="text-sm text-slate-600 max-w-md h-12 flex items-center justify-center">
                  {statusMessage}
                </p>
                <div className="w-64 bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full animate-[loading-bar_7s_ease-in-out_infinite]" style={{ width: '70%' }}></div>
                </div>
              </motion.div>
            )}

            {/* 3. Error Banner */}
            {error && !loading && (
              <motion.div
                key="error-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-6 text-left"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-800">Analysis Terminated</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    <button
                      onClick={handleAnalyze}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-800 hover:text-red-900 underline"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry Audit
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. Complete Audit Dashboard */}
            {result && !loading && !error && (
              <motion.div
                key="results-deck"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Bento Grid: Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Gauge Difficulty score */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 md:col-span-4 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Keyword Difficulty</span>
                    
                    <div className="relative flex items-center justify-center w-28 h-28 mb-3">
                      {/* Circle indicator */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#e2e8f0"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={result.difficultyColor}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - result.difficultyScore / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-extrabold text-slate-900">{result.difficultyScore}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Score</span>
                      </div>
                    </div>

                    <span 
                      className="text-xs font-extrabold px-3 py-1 rounded-full border shadow-xs"
                      style={{ 
                        color: result.difficultyColor, 
                        borderColor: `${result.difficultyColor}40`, 
                        backgroundColor: `${result.difficultyColor}08` 
                      }}
                    >
                      {result.difficultyCategory} Competition
                    </span>
                  </div>

                  {/* Volume & Cost, Platform and Region Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 md:col-span-8 grid grid-cols-2 gap-4 shadow-sm">
                    {/* Monthly Volume */}
                    <div className="border-r border-slate-100 pr-2 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Search Volume</span>
                        <span className="text-2xl font-extrabold text-slate-900 flex items-baseline gap-1">
                          {result.searchVolume}
                          <span className="text-xs text-slate-400 font-normal">/ mo</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Region: {geoCountry === 'GLOBAL' ? 'Global' : geoCountry}
                      </div>
                    </div>

                    {/* Cost Per Click (CPC) */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Cost Per Click (CPC)</span>
                        <span className="text-2xl font-extrabold text-slate-900 flex items-baseline gap-0.5">
                          <span className="text-lg text-slate-500 font-medium"></span>
                          {result.cpc}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        CPC Estimate (USD)
                      </div>
                    </div>

                    {/* Competition index level */}
                    <div className="border-t border-slate-100 pt-3 pr-2 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">CPC Competition</span>
                        <span className="text-md font-extrabold text-slate-800">
                          {result.competitionLevel}
                        </span>
                      </div>
                    </div>

                    {/* Targeted Device Type */}
                    <div className="border-t border-slate-100 pt-3 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Crawler Platform</span>
                        <span className="text-md font-semibold text-slate-700 flex items-center gap-1">
                          {platform === 'Desktop' ? <Laptop className="w-4 h-4 text-slate-500" /> : <Smartphone className="w-4 h-4 text-indigo-500" />}
                          {platform}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Intent Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Activity className="w-4.5 h-4.5 text-indigo-600" />
                    Dominant Search Intent Profile
                  </h3>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className={`px-4 py-1.5 rounded-full text-sm font-extrabold border ${getIntentColor(result.searchIntent).bg} flex items-center gap-2 shrink-0`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${getIntentColor(result.searchIntent).dot}`} />
                      {result.searchIntent} Intent
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {result.searchIntentDescription}
                    </p>
                  </div>
                </div>

                {/* 12-Month Interest Trend Area Graph using Recharts */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
                    Seasonal Search Interest Trend (12 Months)
                  </h3>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={result.trendData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#64748b" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderRadius: '8px', 
                            color: '#fff',
                            fontSize: '11px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: '#818cf8' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="index" 
                          stroke="#4f46e5" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#trendGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 text-center">
                    Relative search volume index (0 - 100 benchmark metric) mapping year-round user interest.
                  </div>
                </div>

                {/* Top 5 Simulated Competitors SERP Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4.5 h-4.5 text-indigo-600" />
                      Simulated SERP Rank Position 1-5 Competitors
                    </h3>
                    <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                      Organic Graph
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4 text-center w-12">Rank</th>
                          <th className="py-3 px-4">Ranking URL & Title</th>
                          <th className="py-3 px-4 text-center w-24">Auth (DA/PA)</th>
                          <th className="py-3 px-4 text-center w-24">Backlinks</th>
                          <th className="py-3 px-4 text-center w-24">On-Page SEO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {result.serpResults.map((item) => (
                          <tr key={item.rank} className="hover:bg-slate-50/50 transition-colors">
                            {/* Rank Column */}
                            <td className="py-4 px-4 text-center font-extrabold text-slate-900 text-sm">
                              #{item.rank}
                            </td>

                            {/* Title / URL / Snippet Column */}
                            <td className="py-4 px-4 space-y-1 max-w-sm md:max-w-md">
                              <span className="font-bold text-indigo-600 hover:underline block truncate leading-tight">
                                {item.title}
                              </span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 truncate font-mono">
                                <LinkIcon className="w-3 h-3 inline shrink-0" />
                                {item.url}
                              </span>
                              <p className="text-[11px] text-slate-500 leading-relaxed italic bg-slate-50 p-2 rounded border border-slate-100">
                                {item.contentSnippet}
                              </p>
                            </td>

                            {/* Authority indicators */}
                            <td className="py-4 px-4 align-middle">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                                  <span>DA: {item.domainAuthority}</span>
                                  <span>PA: {item.pageAuthority}</span>
                                </div>
                                <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                                  {/* Multi-layered progress bars */}
                                  <div 
                                    className="h-full bg-indigo-500" 
                                    style={{ width: `${item.domainAuthority}%` }} 
                                    title={`Domain Authority: ${item.domainAuthority}`}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Backlinks */}
                            <td className="py-4 px-4 text-center font-mono font-bold text-slate-700">
                              {item.backlinks.toLocaleString()}
                            </td>

                            {/* On-Page Score */}
                            <td className="py-4 px-4 text-center align-middle">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                item.onPageOptimization.toLowerCase() === 'excellent'
                                  ? 'bg-green-100 text-green-700 border border-green-200'
                                  : item.onPageOptimization.toLowerCase() === 'moderate'
                                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                  : 'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {item.onPageOptimization}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Keyterm Extensions / LSI keywords */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4.5 h-4.5 text-indigo-600" />
                    Latent Semantic Indexing (LSI) Variations
                  </h3>
                  <p className="text-xs text-slate-500">
                    We suggest sprinkling these semantically related secondary keywords inside your headings (H2/H3), introduction blocks, and alt-text tags to bolster organic content coverage scores. Click any card to copy.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {result.lsiKeywords.map((kw, idx) => (
                      <button
                        key={idx}
                        onClick={() => copyToClipboard(kw, `lsi-${idx}`)}
                        className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors cursor-pointer group"
                      >
                        <span className="font-semibold">{kw}</span>
                        {copiedField === `lsi-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* technical SEO and strategy recommendations */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                    <Lightbulb className="w-4.5 h-4.5 text-indigo-600" />
                    Strategic Technical Action Plan to Rank
                  </h3>

                  <div className="space-y-3">
                    {result.seoRecommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="p-1 bg-green-50 rounded text-green-600 shrink-0 mt-0.5">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

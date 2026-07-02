import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  HelpCircle,
  Settings, 
  Download, 
  Copy, 
  Check, 
  Layers, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Activity, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Map, 
  Grid, 
  Sliders, 
  BarChart3, 
  Compass, 
  AlertCircle,
  Search,
  Database,
  TrendingUp,
  Coins,
  ArrowRight
} from 'lucide-react';
import { CSS_GENERATOR_KEYWORDS, KeywordItem } from '../data/cssGeneratorKeywords';
import { VIDEO_COMPRESS_KEYWORDS } from '../data/videoCompressKeywords';
import { VIDEO_RESIZE_KEYWORDS } from '../data/videoResizeKeywords';

interface ClusteredKeyword {
  keyword: string;
  volume: number;
  difficulty: 'Low' | 'Medium' | 'High' | string;
  relevance: string;
}

interface KeywordCluster {
  clusterName: string;
  coreIntent: string;
  keywords: ClusteredKeyword[];
  recommendedTitle: string;
  articleStructureOutline: string[];
}

interface ClusterResult {
  clusters: KeywordCluster[];
  topicalMapSummary: string;
  keywordFunnelDist: {
    tofu: number;
    mofu: number;
    bofu: number;
  };
}

// Visual preset terms for convenient click to test
const PRESETS = [
  {
    name: "Video Resize & Aspect Ratio Set",
    terms: "resize video, resize video online, crop video, crop video online, crop video iphone, change video size, change video aspect ratio, vertical video, convert vertical video to horizontal, edit video size"
  },
  {
    name: "Video Compressor & Optimizer Set",
    terms: "compress video, free video compressor, video compressor online, reduce video size, compress video file, compress mp4, reduce video file size, shrink video file size, video mb reducer, reduce mp4 size, condense video, video reducer"
  },
  {
    name: "SaaS SEO Tools Focus",
    terms: "keyword planner, best clustering tools, seo auditing software, google rank tracking free, semantic gap analyze tools, automated backlink audit, LSI keyword finder, long-tail search generator, content schema generator"
  },
  {
    name: "E-commerce Fitness Brand",
    terms: "buy home gym equipment, best workout mats for concrete, yoga blocks bundle discount, dumbbells set with rack 50lb, high impact knee sleeve, adjustable pilates bar set, organic hydration powder, sweat workout gear"
  },
  {
    name: "AI & Future Dev Platform",
    terms: "how to deploy node servers, serverless database pricing comparison, edge computing vs cloud native, deploy express api to cloud run, postgresql horizontal scaling strategy, vector db python search example"
  }
];

export default function AIKeywordClusterTool() {
  const [activePanel, setActivePanel] = useState<'database' | 'cluster'>('database');
  const [keywordPool, setKeywordPool] = useState<'css' | 'video' | 'video-resize'>('video-resize');
  const [rawKeywords, setRawKeywords] = useState('');
  const [groupingSensitivity, setGroupingSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [includeSearchIntent, setIncludeSearchIntent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClusterResult | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'network' | 'outline'>('grid');
  const [copiedState, setCopiedState] = useState(false);
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});

  // Database Explore Panel States
  const [dbSearch, setDbSearch] = useState('');
  const [dbCompFilter, setDbCompFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [dbSortBy, setDbSortBy] = useState<'avgSearches' | 'compIndex' | 'bidHigh' | 'alphabetical'>('avgSearches');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [dbPage, setDbPage] = useState(1);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const itemsPerPage = 12;

  // Progression steps simulation for user friendliness
  const startLoadingProgress = () => {
    setLoading(true);
    setError(null);
    const steps = [
      'Extracting queries & filtering duplicate phrases...',
      'Mapping syntactic semantic proximity...',
      'Computing intent vectors & grouping core nodes...',
      'Drafting structural outline summaries...',
      'Synthesizing topical authority framework...'
    ];
    let currentIdx = 0;
    setLoadingStep(steps[0]);

    const interval = setInterval(() => {
      currentIdx++;
      if (currentIdx < steps.length) {
        setLoadingStep(steps[currentIdx]);
      } else {
        clearInterval(interval);
      }
    }, 2800);

    return () => clearInterval(interval);
  };

  const handleClusterSubmit = async () => {
    if (!rawKeywords.trim()) return;
    const stopProgress = startLoadingProgress();

    try {
      const response = await fetch('/api/keyword-cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawKeywords,
          groupingSensitivity,
          includeSearchIntent
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server returned an error status while performing analysis.');
      }

      const data: ClusterResult = await response.json();
      setResult(data);
      
      // Auto expand all clusters initially
      const initialExp: Record<string, boolean> = {};
      data.clusters.forEach(c => {
        initialExp[c.clusterName] = true;
      });
      setExpandedClusters(initialExp);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during clustering process.');
    } finally {
      setLoading(false);
      setLoadingStep('');
      stopProgress();
    }
  };

  const handleClear = () => {
    setRawKeywords('');
    setResult(null);
    setError(null);
  };

  const toggleCluster = (name: string) => {
    setExpandedClusters(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  // Convert state metrics to downloadable CSV format nicely
  const handleDownloadCSV = () => {
    if (!result) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Cluster,Intent,Keyword,Estimated Vol,Difficulty,Placement,Target Title\n';
    
    result.clusters.forEach(cluster => {
      cluster.keywords.forEach(kw => {
        const cleanKw = kw.keyword.replace(/"/g, '""');
        const cleanCluster = cluster.clusterName.replace(/"/g, '""');
        const cleanTitle = cluster.recommendedTitle.replace(/"/g, '""');
        csvContent += `"${cleanCluster}","${cluster.coreIntent}","${cleanKw}",${kw.volume},"${kw.difficulty}","${kw.relevance}","${cleanTitle}"\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `semantic_keyword_clusters_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe calculators for statistics
  const totalKeywords = useMemo(() => {
    if (!result) return 0;
    return result.clusters.reduce((acc, c) => acc + c.keywords.length, 0);
  }, [result]);

  const searchVolumeSum = useMemo(() => {
    if (!result) return 0;
    return result.clusters.reduce((acc, c) => {
      return acc + c.keywords.reduce((sub, kw) => sub + (kw.volume || 0), 0);
    }, 0);
  }, [result]);

  const currentKeywords = useMemo(() => {
    if (keywordPool === 'css') return CSS_GENERATOR_KEYWORDS;
    if (keywordPool === 'video-resize') return VIDEO_RESIZE_KEYWORDS;
    return VIDEO_COMPRESS_KEYWORDS;
  }, [keywordPool]);

  // Database Filter & Sort Computations
  const filteredKeywords = useMemo(() => {
    return currentKeywords.filter(item => {
      const matchesSearch = item.keyword.toLowerCase().includes(dbSearch.toLowerCase());
      const matchesComp = dbCompFilter === 'All' || item.competition === dbCompFilter;
      return matchesSearch && matchesComp;
    }).sort((a, b) => {
      if (dbSortBy === 'avgSearches') return b.avgSearches - a.avgSearches;
      if (dbSortBy === 'compIndex') return b.competitionIndexed - a.competitionIndexed;
      if (dbSortBy === 'bidHigh') return (b.bidHigh || 0) - (a.bidHigh || 0);
      return a.keyword.localeCompare(b.keyword);
    });
  }, [currentKeywords, dbSearch, dbCompFilter, dbSortBy]);

  const paginatedKeywords = useMemo(() => {
    const startIndex = (dbPage - 1) * itemsPerPage;
    return filteredKeywords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredKeywords, dbPage]);

  const totalDbPages = Math.max(1, Math.ceil(filteredKeywords.length / itemsPerPage));

  // Reset page when filter changes
  useMemo(() => {
    setDbPage(1);
  }, [dbSearch, dbCompFilter, dbSortBy]);

  // Bulk Actions
  const handleToggleSelectAll = () => {
    if (selectedKeywords.length === paginatedKeywords.length) {
      setSelectedKeywords([]);
    } else {
      setSelectedKeywords(paginatedKeywords.map(kw => kw.keyword));
    }
  };

  const handleToggleSelectOne = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    );
  };

  const handleClusterSelected = () => {
    if (selectedKeywords.length === 0) return;
    setRawKeywords(selectedKeywords.join('\n'));
    setActivePanel('cluster');
    setSelectedKeywords([]);
    // Smooth scroll to cluster text area
    setTimeout(() => {
      const el = document.getElementById('raw-keywords-input');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  const handleCopySelected = () => {
    if (selectedKeywords.length === 0) return;
    navigator.clipboard.writeText(selectedKeywords.join('\n'));
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  // Pre-calculated Global Database Stats
  const dbStats = useMemo(() => {
    const total = currentKeywords.length;
    const totalVolume = currentKeywords.reduce((acc, x) => acc + x.avgSearches, 0);
    const lowCount = currentKeywords.filter(x => x.competition === 'Low').length;
    const medCount = currentKeywords.filter(x => x.competition === 'Medium').length;
    const highCount = currentKeywords.filter(x => x.competition === 'High').length;
    const avgBid = Math.round(currentKeywords.reduce((acc, x) => acc + (x.bidHigh || 0), 0) / Math.max(1, total));
    return { total, totalVolume, lowCount, medCount, highCount, avgBid };
  }, [currentKeywords]);

  // Top 8 keywords by search volume for SVG Bar Chart
  const topSearchedKeywords = useMemo(() => {
    return [...currentKeywords]
      .sort((a, b) => b.avgSearches - a.avgSearches)
      .slice(0, 8);
  }, [currentKeywords]);

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 sm:p-6 text-slate-100 shadow-2xl space-y-6" id="keyword-cluster-root">
      
      {/* Sub-Panel Layout Selector tabs */}
      <div className="flex border-b border-slate-900 pb-3 gap-2">
        <button
          onClick={() => setActivePanel('database')}
          className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
            activePanel === 'database' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>Pro CSS Keywords Index</span>
          </div>
          {activePanel === 'database' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActivePanel('cluster')}
          className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
            activePanel === 'cluster' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>AI Semantic Clusterer</span>
          </div>
          {activePanel === 'cluster' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>
      </div>

      {/* PANEL 1: PRO KEYWORDS DATABASE */}
      {activePanel === 'database' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Informational Header with Keyword Pool Toggle */}
          <div className="flex flex-col gap-4 bg-slate-900/25 border border-slate-900 p-4 rounded-xl">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-widest">Active Keyword Intel Datapool</span>
                </div>
                <h2 className="text-lg font-black text-slate-100 tracking-tight">
                  {keywordPool === 'video-resize' 
                    ? 'Video Resizing & Aspect Ratio Search Intent' 
                    : keywordPool === 'video' 
                      ? 'Video Compression & MP4 Resizer Search Intent' 
                      : 'CSS Generator & Webmaster Search Intent'}
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  {keywordPool === 'video-resize'
                    ? 'Newly imported Google Ads Keyword data specifically mapping video resizing, aspect ratios, cropping, and editing search queries.'
                    : keywordPool === 'video' 
                      ? 'Newly imported Google Ads Keyword data specifically mapping video optimizer search queries, competition density, and top-of-page bids.' 
                      : 'Directly harvested from Google Ads Keyword Planner. Select queries below to feed directly into the semantic clustering engine.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setDbSearch('');
                    setDbCompFilter('All');
                    setDbSortBy('avgSearches');
                    setSelectedKeywords([]);
                  }}
                  className="py-1.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer font-medium"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Keyword Pool Switcher Tab Row */}
            <div className="flex flex-wrap border-t border-slate-900/60 pt-3 gap-2">
              <button
                onClick={() => {
                  setKeywordPool('video-resize');
                  setSelectedKeywords([]);
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  keywordPool === 'video-resize' 
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                    : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                📐 Video Resize & Crop Pool ({VIDEO_RESIZE_KEYWORDS.length})
              </button>
              <button
                onClick={() => {
                  setKeywordPool('video');
                  setSelectedKeywords([]);
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  keywordPool === 'video' 
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                    : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                🎥 Video Compress Pool ({VIDEO_COMPRESS_KEYWORDS.length})
              </button>
              <button
                onClick={() => {
                  setKeywordPool('css');
                  setSelectedKeywords([]);
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  keywordPool === 'css' 
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                    : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                🎨 CSS & Webmaster Pool ({CSS_GENERATOR_KEYWORDS.length})
              </button>
            </div>
          </div>

          {/* Graphical Analytics Row (Beautiful SVG Dashboard) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* SVG Chart 1: Top Search Volume Bar Chart */}
            <div className="lg:col-span-8 bg-slate-900/30 border border-slate-900 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">Top 8 Highest Search Volume Queries</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Monthly Average Volume</span>
              </div>

              {/* Native responsive bar list with visual progress meters */}
              <div className="space-y-3 pt-2">
                {topSearchedKeywords.map((item, idx) => {
                  const maxVolume = topSearchedKeywords[0].avgSearches;
                  const pct = (item.avgSearches / maxVolume) * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-300 font-medium">{item.keyword}</span>
                        <span className="text-emerald-400 font-bold">{item.avgSearches.toLocaleString()} /mo</span>
                      </div>
                      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-900 flex">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.05 }}
                          className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 hover:brightness-110 rounded-full transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SVG Chart 2: Competition Share & Stats Card */}
            <div className="lg:col-span-4 bg-slate-900/30 border border-slate-900 p-4 rounded-xl flex flex-col justify-between space-y-4">
              <div className="pb-2 border-b border-slate-900">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">Indexed Competition Share</span>
                </div>
              </div>

              {/* Pie segments visualization via a beautiful responsive SVG donut chart */}
              <div className="flex justify-center items-center relative py-2">
                <svg width="150" height="150" viewBox="0 0 100 100" className="transform -rotate-90">
                  {/* Outer circle track */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#0c0c14" strokeWidth="12" />
                  
                  {/* Low segment: green (approx 85%) */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#10b981" 
                    strokeWidth="12" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 * (1 - (dbStats.lowCount / dbStats.total))} 
                  />
                  {/* Medium segment: orange (approx 12%) */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#f59e0b" 
                    strokeWidth="12" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 * (1 - (dbStats.medCount / dbStats.total))} 
                    className="origin-center rotate-[210deg]"
                  />
                  {/* High segment: red (approx 3%) */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#ef4444" 
                    strokeWidth="12" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 * (1 - (dbStats.highCount / dbStats.total))} 
                    className="origin-center rotate-[330deg]"
                  />
                </svg>

                {/* Center text of the donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-white">{dbStats.total}</span>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Queries</span>
                </div>
              </div>

              {/* Legends */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-mono border-t border-slate-900 text-center">
                <div className="space-y-0.5 bg-emerald-950/20 border border-emerald-900/20 p-1.5 rounded-lg">
                  <span className="text-emerald-400 font-bold block">LOW</span>
                  <span className="text-slate-300">{dbStats.lowCount} items</span>
                </div>
                <div className="space-y-0.5 bg-amber-950/20 border border-amber-900/20 p-1.5 rounded-lg">
                  <span className="text-amber-400 font-bold block">MEDIUM</span>
                  <span className="text-slate-300">{dbStats.medCount} items</span>
                </div>
                <div className="space-y-0.5 bg-rose-950/20 border border-rose-900/20 p-1.5 rounded-lg">
                  <span className="text-rose-400 font-bold block">HIGH</span>
                  <span className="text-slate-300">{dbStats.highCount} items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Database Performance Indicators Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Total Monthly Search Vol</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-white">{dbStats.totalVolume.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-500 font-mono font-bold">BDT</span>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Low Competition Weight</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-emerald-400">{Math.round((dbStats.lowCount / dbStats.total) * 100)}%</span>
                <span className="text-[10px] text-slate-500 font-mono">of dataset</span>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Avg Top-of-Page CPC Bid</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-white">{dbStats.avgBid}</span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">BDT /click</span>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Forecast Trend Span</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-indigo-400">2022-2026</span>
                <span className="text-[10px] text-slate-500 font-mono">4-year span</span>
              </div>
            </div>
          </div>

          {/* Database Controls Filter Panel */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 bg-slate-900/50 border border-slate-900 rounded-xl items-center">
            
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={dbSearch}
                onChange={(e) => setDbSearch(e.target.value)}
                placeholder={
                  keywordPool === 'video-resize'
                    ? "Search video resizing keywords..."
                    : keywordPool === 'video'
                      ? "Search video compression keywords..."
                      : "Search CSS master keywords..."
                }
                className="w-full pl-9 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
              />
              {dbSearch && (
                <button
                  onClick={() => setDbSearch('')}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-[10px] bg-slate-800 text-slate-400 px-1 rounded hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Competition filter buttons */}
            <div className="md:col-span-4 flex items-center gap-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mr-2">Comp:</span>
              {(['All', 'Low', 'Medium', 'High'] as const).map(cFilter => (
                <button
                  key={cFilter}
                  onClick={() => setDbCompFilter(cFilter)}
                  className={`px-2.5 py-1 text-[11px] rounded-md font-mono font-medium border transition-all cursor-pointer ${
                    dbCompFilter === cFilter
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  {cFilter}
                </button>
              ))}
            </div>

            {/* Sorting controls */}
            <div className="md:col-span-3 flex items-center justify-end gap-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Sort:</span>
              <select
                value={dbSortBy}
                onChange={(e) => setDbSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg py-1 px-2 focus:border-emerald-500 focus:outline-none transition-all font-mono"
              >
                <option value="avgSearches">Search Volume</option>
                <option value="compIndex">Competition Index</option>
                <option value="bidHigh">High CPC Bid</option>
                <option value="alphabetical">A-Z Name</option>
              </select>
            </div>
          </div>

          {/* TABLE OF METRICS */}
          <div className="rounded-xl border border-slate-900 bg-slate-950 overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-900 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={paginatedKeywords.length > 0 && selectedKeywords.length === paginatedKeywords.length}
                        onChange={handleToggleSelectAll}
                        className="rounded bg-slate-900 border-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                        title="Select all on this page"
                      />
                    </th>
                    <th className="py-3 px-4">Keyword Query</th>
                    <th className="py-3 px-4 text-right">Avg Searches</th>
                    <th className="py-3 px-4">Competition</th>
                    <th className="py-3 px-4">Index Value</th>
                    <th className="py-3 px-4 text-right">Bid Range (Low - High)</th>
                    <th className="py-3 px-4 text-center">YoY Trend</th>
                    <th className="py-3 px-4 text-right w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {paginatedKeywords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 font-mono text-xs">
                        No keywords found matching filter criteria. Try resetting.
                      </td>
                    </tr>
                  ) : (
                    paginatedKeywords.map((item, idx) => {
                      const isChecked = selectedKeywords.includes(item.keyword);
                      const isLow = item.competition === 'Low';
                      const isHigh = item.competition === 'High';
                      const badgeClass = isLow 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : isHigh 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20';

                      const isYoYPos = item.yoyChange !== '0%' && !item.yoyChange.startsWith('-');
                      const isYoYNeg = item.yoyChange.startsWith('-');
                      const trendColor = isYoYPos ? 'text-emerald-400' : isYoYNeg ? 'text-rose-400' : 'text-slate-500';

                      return (
                        <tr key={idx} className={`hover:bg-slate-900/40 transition-colors ${isChecked ? 'bg-emerald-950/10' : ''}`}>
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectOne(item.keyword)}
                              className="rounded bg-slate-900 border-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-200">
                            <div className="flex items-center gap-2">
                              <span>{item.keyword}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.keyword);
                                  setCopiedKeyword(item.keyword);
                                  setTimeout(() => setCopiedKeyword(null), 1000);
                                }}
                                className="text-slate-600 hover:text-slate-300 transition-colors cursor-pointer"
                                title="Copy keyword"
                              >
                                {copiedKeyword === item.keyword ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300 font-medium">
                            {item.avgSearches.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${badgeClass}`}>
                              {item.competition}
                            </span>
                          </td>
                          <td className="py-3 px-4 w-32">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-slate-400 w-6">{item.competitionIndexed}</span>
                              <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                                <div 
                                  className={`h-full rounded-full ${isLow ? 'bg-emerald-500' : isHigh ? 'bg-rose-500' : 'bg-amber-500'}`} 
                                  style={{ width: `${item.competitionIndexed}%` }} 
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300">
                            {item.bidLow && item.bidHigh ? (
                              <span>{item.bidLow.toFixed(2)} - {item.bidHigh.toFixed(2)} <span className="text-[10px] text-slate-500">BDT</span></span>
                            ) : (
                              <span className="text-slate-600">N/A</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            <span className={trendColor}>{item.yoyChange}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setRawKeywords(item.keyword);
                                setActivePanel('cluster');
                                setTimeout(() => {
                                  const el = document.getElementById('raw-keywords-input');
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }, 120);
                              }}
                              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center justify-end gap-0.5 ml-auto cursor-pointer"
                              title="Directly cluster this query"
                            >
                              <span>Cluster</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalDbPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-900 bg-slate-900/20 text-xs font-mono text-slate-400">
                <span>
                  Showing page <strong className="text-slate-300">{dbPage}</strong> of <strong className="text-slate-300">{totalDbPages}</strong> ({filteredKeywords.length} matching keywords)
                </span>
                
                <div className="flex items-center gap-1">
                  <button
                    disabled={dbPage === 1}
                    onClick={() => setDbPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-300 rounded-md transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={dbPage === totalDbPages}
                    onClick={() => setDbPage(p => Math.min(totalDbPages, p + 1))}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-300 rounded-md transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Checkbox Floating Bulk Action Bar */}
          <AnimatePresence>
            {selectedKeywords.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-lg bg-[#0e0f14]/98 border border-emerald-500/40 p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2 font-mono">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs text-emerald-400 font-bold">
                    {selectedKeywords.length} Keyword{selectedKeywords.length > 1 ? 's' : ''} Selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySelected}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    {copiedState ? 'Copied!' : 'Copy'}
                  </button>

                  <button
                    onClick={handleClusterSelected}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>Cluster with AI</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* PANEL 2: AI SEMANTIC CLUSTERER */}
      {activePanel === 'cluster' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Input Configuration Column */}
            <div className="lg:col-span-12 xl:col-span-8 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Enter Raw Keywords or Search Queries
                </label>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900/60 px-2 py-1 rounded-md border border-slate-850">
                  One query per line or target comma separation
                </span>
              </div>

          <textarea
            value={rawKeywords}
            onChange={(e) => setRawKeywords(e.target.value)}
            placeholder="e.g.&#10;best local seo tools&#10;how to cluster keywords&#10;search intent analyzer&#10;semantic content planning guide&#10;SaaS keyword research metric tool..."
            className="w-full h-44 px-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-xs text-slate-200 placeholder-slate-600 transition-all resize-none overflow-y-auto"
            id="raw-keywords-input"
          />

          {/* Preset Buttons for test ease */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-slate-500 block">Click a business preset to populate instantly:</span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setRawKeywords(p.terms)}
                  className="text-[10px] font-medium bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Configuration Settings Menu Grid */}
        <div className="lg:col-span-12 xl:col-span-4 p-5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Semantic Parameters</span>
            </div>

            {/* Sensitivity Grid */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-300">Grouping Similarity</span>
                <span className="text-[10px] font-mono text-emerald-400 capitalize">{groupingSensitivity} Distance</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setGroupingSensitivity(s)}
                    className={`py-1.5 text-xs text-center rounded-lg border font-medium transition-all cursor-pointer ${
                      groupingSensitivity === s 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 font-semibold' 
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {s === 'low' ? 'Low (Broad)' : s === 'high' ? 'High (Strict)' : 'Moderate'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Strict groups only highly-aligned search stems together. Broad creates larger thematic category hubs.
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between py-2 border-t border-slate-850">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-300 block">Classify Search Intent</span>
                <span className="text-[10px] text-slate-500 block">Differentiate TOFU / MOFU / BOFU stages</span>
              </div>
              <button
                type="button"
                onClick={() => setIncludeSearchIntent(!includeSearchIntent)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  includeSearchIntent ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    includeSearchIntent ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-850">
            <button
              onClick={handleClusterSubmit}
              disabled={loading || !rawKeywords.trim()}
              className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/20 active:scale-95"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                  <span>Configuring maps...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Synthesize Semantic Map</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleClear}
              title="Clear text"
              className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Block State */}
      {loading && (
        <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <Sparkles className="w-5 h-5 text-emerald-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-sm font-bold font-mono text-slate-300">Clustering Search Engine Data</h4>
              <p className="text-xs text-emerald-400 font-mono tracking-wider animate-pulse uppercase">{loadingStep || 'Analyzing semantic vectors...'}</p>
            </div>
          </div>

          {/* Polished, Animated Hub & Nodes Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-850/60 animate-pulse">
            {[1, 2, 3].map((clusterId) => (
              <div key={clusterId} className="p-4 bg-slate-950/40 border border-slate-850/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-850/60 pb-2">
                  <div className="h-4 bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-800/60 rounded w-8" />
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 bg-slate-800/50 rounded w-full" />
                  <div className="h-2.5 bg-slate-900 rounded w-11/12 animate-pulse" style={{ animationDelay: '100ms' }} />
                  <div className="h-2.5 bg-slate-900/60 rounded w-4/5 animate-pulse" style={{ animationDelay: '200ms' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs font-bold text-rose-400 font-mono block">Clustering Fault Triggered</span>
            <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Results Rendering Section */}
      {result && !loading && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Quick Stats Summary Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Total Clusters Found</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{result.clusters.length}</span>
                <span className="text-xs text-slate-400">semantic hubs</span>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Unique Keywords Mapping</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{totalKeywords}</span>
                <span className="text-xs text-slate-400">terms integrated</span>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Accumulated Search Potential</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">
                  {searchVolumeSum.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-mono">/mo avg</span>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Sensitivity Benchmark</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white uppercase tracking-tight">{groupingSensitivity}</span>
                <span className="text-[10px] text-slate-500 font-mono">(1.0 max distance)</span>
              </div>
            </div>
          </div>

          {/* Strategic Executive Summary Card */}
          <div className="bg-slate-900/30 border border-slate-850 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">Topical Authority Mapping & Guidance</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {result.topicalMapSummary}
            </p>
          </div>

          {/* Graphical Funnel distribution representation */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">Search Funnel Distribution Analysis</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">Lifecycle Mapping</span>
            </div>

            <div className="space-y-5">
              {/* Stacked Percentage Visual Bar Chart */}
              <div className="space-y-1">
                <div className="flex h-5 rounded-lg overflow-hidden border border-slate-950">
                  <div 
                    style={{ width: `${result.keywordFunnelDist.tofu}%` }}
                    className="bg-blue-500 hover:brightness-110 transition-all duration-300 relative group"
                    title={`TOFU: ${result.keywordFunnelDist.tofu}%`}
                  />
                  <div 
                    style={{ width: `${result.keywordFunnelDist.mofu}%` }}
                    className="bg-indigo-500 hover:brightness-110 transition-all duration-300 relative group"
                    title={`MOFU: ${result.keywordFunnelDist.mofu}%`}
                  />
                  <div 
                    style={{ width: `${result.keywordFunnelDist.bofu}%` }}
                    className="bg-emerald-500 hover:brightness-110 transition-all duration-300 relative group"
                    title={`BOFU: ${result.keywordFunnelDist.bofu}%`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
                  <span>0%</span>
                  <span>Lifespan Distribution Grid</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Dist Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center gap-3">
                  <div className="w-3 h-3 rounded bg-blue-500 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-slate-300">TOFU (Top of Funnel)</span>
                      <span className="text-xs font-mono font-bold text-blue-400">{result.keywordFunnelDist.tofu}%</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">Informational queries searching for explanations or education.</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center gap-3">
                  <div className="w-3 h-3 rounded bg-indigo-500 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-slate-300">MOFU (Middle of Funnel)</span>
                      <span className="text-xs font-mono font-bold text-indigo-400">{result.keywordFunnelDist.mofu}%</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">Commercial evaluation, comparison guides, and solution mapping.</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center gap-3">
                  <div className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-slate-300">BOFU (Bottom of Funnel)</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">{result.keywordFunnelDist.bofu}%</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">Transactional intent seeking immediate products, pricing or signups.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Selector & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 border-t border-slate-900">
            <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-slate-950 text-white font-semibold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Silo Cards Grid</span>
              </button>

              <button
                onClick={() => setViewMode('network')}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  viewMode === 'network' 
                    ? 'bg-slate-950 text-white font-semibold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>Topical Visual Bubble Network</span>
              </button>

              <button
                onClick={() => setViewMode('outline')}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  viewMode === 'outline' 
                    ? 'bg-slate-950 text-white font-semibold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>H2 Structure Outline</span>
              </button>
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleCopyResult}
                className="py-1.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                {copiedState ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedState ? 'Copied JSON' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV Matrix</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: SILO CARDS GRID */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.clusters.map((cluster, cIndex) => {
                const isExpanded = expandedClusters[cluster.clusterName] !== false;
                const intentLower = cluster.coreIntent.toLowerCase();
                const intentColorTheme = intentLower.includes('transactional') || intentLower.includes('bofu')
                  ? 'border-l-emerald-500 bg-emerald-500/5 text-emerald-400'
                  : intentLower.includes('commercial') || intentLower.includes('mofu')
                    ? 'border-l-indigo-500 bg-indigo-500/5 text-indigo-400'
                    : 'border-l-blue-500 bg-blue-500/5 text-blue-400';

                return (
                  <div 
                    key={cIndex}
                    className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-md flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div 
                      onClick={() => toggleCluster(cluster.clusterName)}
                      className={`p-4 border-l-4 cursor-pointer flex justify-between items-center transition-all hover:bg-slate-850 ${intentColorTheme}`}
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono tracking-widest uppercase bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-850">
                          {cluster.coreIntent}
                        </span>
                        <h4 className="text-sm font-bold text-slate-100 uppercase tracking-tight line-clamp-1">{cluster.clusterName}</h4>
                      </div>
                      <div className="text-slate-400 hover:text-white">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Expandable Keywords & Suggested Outline block */}
                    {isExpanded && (
                      <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                        {/* Keyword list inside */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase">Clustered Target Keywords</span>
                          <div className="rounded-lg border border-slate-850 overflow-hidden bg-slate-950 divide-y divide-slate-900">
                            {cluster.keywords.map((kw, kwIndex) => {
                              const diffLower = kw.difficulty?.toLowerCase();
                              const diffColor = diffLower.includes('low') 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : diffLower.includes('high')
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-amber-500/10 text-amber-400';

                              return (
                                <div key={kwIndex} className="p-2.5 flex items-center justify-between gap-4 hover:bg-slate-900/45 transition-colors text-[11px]">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                                    <span className="font-mono text-slate-200 truncate" title={kw.keyword}>{kw.keyword}</span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[9px] font-mono text-slate-500 uppercase">{kw.relevance || 'Secondary'}</span>
                                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${diffColor}`}>
                                      Diff: {kw.difficulty}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1 py-0.5 rounded select-none">
                                      {kw.volume ? `${kw.volume.toLocaleString()}/mo` : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Optimal Title Proposed */}
                        <div className="pt-3 border-t border-slate-850 space-y-1">
                          <span className="text-[10px] font-mono text-slate-500 block">RECOMMENDED H1 PAGE TITLE</span>
                          <p className="text-xs font-semibold text-emerald-400 italic bg-emerald-950/10 border border-emerald-900/30 p-2 rounded">
                            "{cluster.recommendedTitle}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: SEMANTIC BUBBLE MAP NETWORK */}
          {viewMode === 'network' && (
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold">Relational Cluster Visualization</span>
                  <p className="text-xs text-slate-400">
                    A visual projection of how search terms branch off from their parent thematic categories (Topical Authority Pillars).
                  </p>
                </div>
                <div className="hidden sm:flex gap-4 text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Informational</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Commercial</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Transactional</div>
                </div>
              </div>

              {/* Graphical CSS + SVG Connection nodes grid */}
              <div className="bg-slate-950 rounded-lg p-6 border border-slate-850 min-h-[400px] flex flex-col justify-center space-y-8 relative overflow-hidden">
                
                {/* Simulated center core portal anchor */}
                <div className="flex justify-center relative z-10">
                  <div className="bg-emerald-500/10 border border-emerald-500/40 px-5 py-2 rounded-xl text-center shadow-lg shadow-emerald-950/40 relative">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute -top-1 -right-1" />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">Topical Authority Core</span>
                    <h5 className="text-xs font-black text-white mt-0.5">Semantic Content Hub</h5>
                  </div>
                </div>

                {/* Grid pillars listing with horizontal stem lines */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 pt-4">
                  {result.clusters.map((cluster, cIndex) => {
                    const intentLower = cluster.coreIntent.toLowerCase();
                    const intentBadgeColor = intentLower.includes('transactional') || intentLower.includes('bofu')
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : intentLower.includes('commercial') || intentLower.includes('mofu')
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/40';

                    return (
                      <div 
                        key={cIndex}
                        className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3 shadow-lg relative"
                      >
                        {/* Title & Badge */}
                        <div className="space-y-1">
                          <span className={`text-[9px] font-mono border px-2 py-0.5 rounded ${intentBadgeColor}`}>
                            {cluster.coreIntent}
                          </span>
                          <h6 className="text-xs font-extrabold text-white uppercase tracking-tight pt-1 leading-snug">
                            {cluster.clusterName}
                          </h6>
                        </div>

                        {/* Bubbles listing */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-850">
                          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Clustered Stems ({cluster.keywords.length})</span>
                          <div className="flex flex-wrap gap-1">
                            {cluster.keywords.map((kw, kwIdx) => (
                              <span 
                                key={kwIdx}
                                className="text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-850 px-2 py-0.5 rounded-md text-center max-w-full truncate"
                                title={kw.keyword}
                              >
                                {kw.keyword}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Title suggestion summary */}
                        <div className="text-[10px] text-slate-500 leading-normal italic">
                          Target Title: "{cluster.recommendedTitle}"
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Decorative background grid and radar ring effects */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5 select-none pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-slate-900/40 animate-pulse pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-slate-900/20 pointer-events-none" />
              </div>
            </div>
          )}

          {/* VIEW 3: H2 EDITORIAL OUTLINE */}
          {viewMode === 'outline' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold">Semantic Headings Blueprint</span>
                  <p className="text-xs text-slate-400">
                    Copy and hand these H2 structure outlines directly to content writers. They are calculated to target the exact intent of the group coordinates.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.clusters.map((cluster, cIdx) => (
                  <div 
                    key={cIdx}
                    className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-4"
                  >
                    {/* Header */}
                    <div className="pb-3 border-b border-slate-850 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest">Silo Topic #{cIdx + 1}</h4>
                      </div>
                      <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                        {cluster.clusterName}
                      </h3>
                      <div className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded inline-block border border-slate-850 leading-none">
                        Core Intent: {cluster.coreIntent}
                      </div>
                    </div>

                    {/* H1 page mapping */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase">H1 Primary Topic Landing Title:</span>
                      <p className="text-xs font-semibold text-white bg-slate-950 p-2.5 rounded border border-slate-850 leading-relaxed italic">
                        "{cluster.recommendedTitle}"
                      </p>
                    </div>

                    {/* Array of H2 headings suggested */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-semibold text-slate-500 block uppercase">H2 Headings & Sub-theme Breakdown:</span>
                      <div className="space-y-2.5">
                        {cluster.articleStructureOutline?.map((h2, h2Idx) => (
                          <div 
                            key={h2Idx}
                            className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/40 p-2 rounded hover:bg-slate-950 transition-colors border border-slate-850/40"
                          >
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0">
                              H2
                            </span>
                            <span className="leading-tight pt-0.5 font-medium">{h2}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Complete Educational Legend explaining clustering metrics */}
      {!result && (
        <div className="border border-slate-900 rounded-xl p-5 bg-slate-900/20 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4.5 h-4.5 text-slate-400" />
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">How Semantics Driven Grouping Works</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400 leading-relaxed">
            <div className="space-y-2 p-3 bg-slate-900/20 rounded-lg">
              <span className="font-bold text-slate-200 block">1. Extraction & Parsing</span>
              <p>
                The algorithm processes your inputted strings, sanitizes typos, and computes vector associations for base search roots before running the model.
              </p>
            </div>
            <div className="space-y-2 p-3 bg-slate-900/20 rounded-lg">
              <span className="font-bold text-slate-200 block">2. Semantic Matrix Proximity</span>
              <p>
                Phrases are mapped mathematically according to semantic distance. "Buy gym equipment" and "gym training accessories with discount" are correctly clustered under common intent.
              </p>
            </div>
            <div className="space-y-2 p-3 bg-slate-900/20 rounded-lg">
              <span className="font-bold text-slate-200 block">3. Editorial Outlining</span>
              <p>
                Instead of simple lists, Gemini proposes optimal page-titles and visual structure outlines mapping the cluster coordinates for robust SEO execution.
              </p>
            </div>
          </div>
        </div>
      )}

        </div>
      )}
    </div>
  );
}

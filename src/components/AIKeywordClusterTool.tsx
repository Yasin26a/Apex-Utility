import { useState, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';

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

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 sm:p-6 text-slate-100 shadow-2xl space-y-8" id="keyword-cluster-root">
      {/* Configuration Header Area */}
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
  );
}

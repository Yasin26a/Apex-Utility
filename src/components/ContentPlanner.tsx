import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  HelpCircle, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Check, 
  Download, 
  Target, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  BookOpen, 
  CheckSquare, 
  Square,
  FileText,
  BadgeAlert,
  Zap,
  ExternalLink,
  Code
} from 'lucide-react';

interface SearchIntent {
  intentType: 'Informational' | 'Transactional' | 'Commercial' | 'Navigational' | string;
  explanation: string;
  stage: string;
}

interface TargetAudience {
  demographics: string;
  expertiseLevel: string;
  intentTriggers: string[];
}

interface LongTailQuestion {
  question: string;
  explanation: string;
}

interface Keywords {
  primary: string;
  semantic: string[];
  longTailQuestions: LongTailQuestion[];
}

interface SEOGuidelines {
  recommendedWordCount: number;
  metaTitle: string;
  metaDescription: string;
  editorialTone: string;
}

interface OutlineHeading {
  heading: string;
  type: 'H1' | 'H2' | 'H3' | string;
  description: string;
  keyPointsToCover: string[];
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ContentPlannerResult {
  keyword: string;
  searchIntent: SearchIntent;
  userProblem: string;
  audienceProfile: TargetAudience;
  keywords: Keywords;
  seoGuidelines: SEOGuidelines;
  outline: OutlineHeading[];
  faq: FAQItem[];
}

const TONE_OPTIONS = [
  { value: 'Professional & informative', label: 'Professional & Informative', desc: 'Authoritative and research-backed' },
  { value: 'Conversational & engaging', label: 'Conversational & Engaging', desc: 'Friendly, relatable, and approachable' },
  { value: 'Technical & deep-dive', label: 'Technical & Deep-dive', desc: 'Suited for developers and engineers' },
  { value: 'Inspirational & storyteller', label: 'Editorial & Storytelling', desc: 'Thought-provoking narrative style' },
  { value: 'Creative & persuasive', label: 'Creative & Persuasive', desc: 'Strong focus on hooks and conversion' }
];

const FORMAT_OPTIONS = [
  { value: 'Comprehensive Guide', label: 'Comprehensive 101 Guide' },
  { value: 'Listicle & Comparison', label: 'Listicle / Product Roundup' },
  { value: 'Tutorial & How-To', label: 'Tutorial & Actionable How-To' },
  { value: 'Case Study & Analysis', label: 'Executive Case Study' },
  { value: 'FAQ Hub & Explainer', label: 'FAQ Explainer Hub' }
];

const DEMO_TOPICS = [
  "How to scale typescript backends safely",
  "Best credit card strategy for digital nomads in 2026",
  "DIY hydroponic indoor garden step by step",
  "Why is my bounce rate high on landing page"
];

const LOADING_STEPS = [
  "Initializing Semantic Engine...",
  "Classifying Search Intent & User Problem Map...",
  "Generating LSI & Question Semantic Clusters...",
  "Constructing High-CTR Titles & Meta tags...",
  "Structuring Outlines with Editorial Keypoints...",
  "Finalizing Schema-Ready FAQs..."
];

export default function ContentPlanner() {
  const [keyword, setKeyword] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('Professional & informative');
  const [format, setFormat] = useState('Comprehensive Guide');
  const [customAudience, setCustomAudience] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ContentPlannerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'intent' | 'keywords' | 'outline' | 'seo'>('intent');
  const [faqExpanded, setFaqExpanded] = useState<Record<number, boolean>>({});
  const [completedOutline, setCompletedOutline] = useState<Record<number, boolean>>({});
  const [copiedText, setCopiedText] = useState<'metaTitle' | 'metaDesc' | 'all' | string | null>(null);

  // Rotate loading steps every 2.4 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 2400);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCompletedOutline({});

    try {
      const response = await fetch('/api/content-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          audience: audience.trim() || 'General Public',
          tone,
          format
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setActiveSubTab('intent');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoTopic = (topic: string) => {
    setKeyword(topic);
  };

  const toggleFaq = (index: number) => {
    setFaqExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleOutlineCheck = (index: number) => {
    setCompletedOutline((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  // Create full Markdown string for copy or download
  const generateMarkdown = (): string => {
    if (!result) return '';
    let md = `# SEO Strategy & Content Outline: ${result.keyword}\n\n`;
    md += `## Search Intent & Audience Analysis\n`;
    md += `- **Intent Classification**: ${result.searchIntent?.intentType} (${result.searchIntent?.stage})\n`;
    md += `- **Explanation**: ${result.searchIntent?.explanation}\n`;
    md += `- **Core User Problem**: ${result.userProblem}\n`;
    md += `- **Audience Demographics**: ${result.audienceProfile?.demographics}\n`;
    md += `- **Expertise Level**: ${result.audienceProfile?.expertiseLevel}\n`;
    md += `- **Intent Triggers**:\n`;
    result.audienceProfile?.intentTriggers?.forEach(t => {
      md += `  - ${t}\n`;
    });
    md += `\n`;

    md += `## SEO Keyword Target Strategy\n`;
    md += `- **Primary Focus Target**: ${result.keywords?.primary}\n\n`;
    md += `### Semantic LSI Keywords\n`;
    result.keywords?.semantic?.forEach(k => {
      md += `- ${k}\n`;
    });
    md += `\n`;

    md += `### Long-Tail Search Questions\n`;
    result.keywords?.longTailQuestions?.forEach(q => {
      md += `- **Question**: ${q.question}\n`;
      md += `  *Description*: ${q.explanation}\n`;
    });
    md += `\n`;

    md += `## Editorial Metadata Guidelines\n`;
    md += `- **Target Word Count**: ${result.seoGuidelines?.recommendedWordCount} words\n`;
    md += `- **Meta Title**: ${result.seoGuidelines?.metaTitle}\n`;
    md += `- **Meta Description**: ${result.seoGuidelines?.metaDescription}\n`;
    md += `- **Editorial Writing Tone**: ${result.seoGuidelines?.editorialTone}\n\n`;

    md += `## Detailed Editorial Content Outline\n\n`;
    result.outline?.forEach((o, index) => {
      md += `### [${o.type}] ${o.heading}\n`;
      md += `*Section Description*: ${o.description}\n`;
      md += `*Points to Cover*:\n`;
      o.keyPointsToCover?.forEach(pt => {
        md += `- [ ] ${pt}\n`;
      });
      md += `\n`;
    });

    md += `## Schema-Ready FAQ Accordions\n\n`;
    result.faq?.forEach(f => {
      md += `### Q: ${f.question}\n`;
      md += `*A*: ${f.answer}\n\n`;
    });

    md += `---\nGenerated securely with Apex AI Content Planner & Search Intent Engine.`;
    return md;
  };

  const handleDownload = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seo_strategy_${result?.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8" id="ai-content-planner-app">
      {/* Search Input Card */}
      <div className="bg-[#0f0f15] border border-slate-800 rounded-2xl p-5 sm:p-7 relative overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-indigo-500/10 border border-rose-500/30">
            <Sparkles className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Content Strategy Generator</h3>
            <p className="text-xs text-slate-400">Discover user intent patterns & scaffold comprehensive outlines instantly.</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-5">
          {/* Main search text input */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Enter Search term or Target Topic
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g., scale typescript backends safely, DIY hydroponics for beginners..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-600 font-sans shadow-inner"
              />
            </div>
            
            {/* Quick Demo Topics */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">Try ideas:</span>
              {DEMO_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => selectDemoTopic(topic)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-lg text-slate-300 transition-all cursor-pointer"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Audience preferences */}
            <div className="space-y-2 col-span-1 md:col-span-1">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Target Audience Profile
              </label>
              {!customAudience ? (
                <select
                  value={audience}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setCustomAudience(true);
                      setAudience('');
                    } else {
                      setAudience(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-slate-300 text-xs outline-none transition-all"
                >
                  <option value="">General Public / Broad Reach</option>
                  <option value="Executive decision makers and CTOs">CTOs &amp; Tech Directors</option>
                  <option value="SaaS Marketing Managers &amp; Growth Hackers">SaaS Marketers</option>
                  <option value="Hobbyists &amp; DIY enthusiasts">Hobbyists &amp; Crafters</option>
                  <option value="Personal finance beginners and retail investors">Retail Investors / Gen Z</option>
                  <option value="custom">✍️ Custom Audience Persona...</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. Remote web designers"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomAudience(false);
                      setAudience('');
                    }}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Editorial Tone selector */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Editorial Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-slate-300 text-xs outline-none transition-all"
              >
                {TONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Focus Format Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Content format goal
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-slate-300 text-xs outline-none transition-all"
              >
                {FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || !keyword.trim()}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-505 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-900 disabled:text-slate-600 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.30)] flex items-center gap-2 cursor-pointer disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating strategy...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Launch Planner Engine</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Loading Steps state */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-950/70 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-rose-500/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-rose-500 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-white">Generating Search Intent Strategy Report</h4>
              <p className="text-xs text-rose-400 font-mono tracking-wide h-4">
                {LOADING_STEPS[loadingStep]}
              </p>
            </div>

            <div className="w-48 bg-slate-900/80 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                className="bg-rose-500 h-full rounded-full"
                animate={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <p className="text-[10px] text-slate-500 max-w-xs font-mono">This uses live, localized semantic structuring inside Gemini client streams, wait about 10-15 seconds.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && (
        <div className="bg-rose-950/25 border border-rose-800/60 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-rose-300">Generation Failure</h4>
            <p className="text-sm text-slate-300">{error}</p>
          </div>
        </div>
      )}

      {/* Main Results Dashboard */}
      {result && (
        <div className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Top overview header */}
            <div className="bg-slate-900/60 p-5 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono text-rose-400 font-bold uppercase">
                  Approved Strategy Report
                </span>
                <h4 className="text-lg font-extrabold text-white">
                  Topic: <span className="text-rose-400">"{result.keyword}"</span>
                </h4>
              </div>

              {/* MD/Download Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(generateMarkdown(), 'all')}
                  className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono font-medium rounded-xl flex items-center gap-1 px-4 py-2 transition-all cursor-pointer"
                >
                  {copiedText === 'all' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied Outline!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3.5 py-1.5 bg-rose-600/15 border border-rose-500/30 hover:border-rose-500 text-rose-400 text-xs font-mono font-medium rounded-xl flex items-center gap-1 px-4 py-2 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .MD</span>
                </button>
              </div>
            </div>

            {/* Inner Sub-Navigation tabs */}
            <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-900/20">
              {[
                { id: 'intent', label: 'Search Intent', icon: Target },
                { id: 'keywords', label: 'Semantic Keywords', icon: TrendingUp },
                { id: 'outline', label: 'Editorial Outline', icon: FileText },
                { id: 'seo', label: 'On-Page Guidelines', icon: BookOpen }
              ].map((tab) => {
                const IconComp = tab.icon;
                const active = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`py-3.5 text-xs font-semibold cursor-pointer border-b-2 transition-all flex items-center justify-center gap-2 ${
                      active
                        ? 'border-rose-500 text-rose-400 bg-rose-500/5'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content Tabs area */}
            <div className="p-5 sm:p-7">
              {/* Tab: Intent & Stage */}
              {activeSubTab === 'intent' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Primary intent card */}
                    <div className="bg-[#101016] border border-slate-800 rounded-xl p-5 md:col-span-2 space-y-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-rose-400" />
                        <h5 className="font-bold text-sm text-white">Search Intent Classification</h5>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-lg flex items-center justify-between border border-slate-900">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Intent Profile</span>
                          <h6 className="text-sm font-extrabold text-white">
                            {result.searchIntent?.intentType || 'Informational'}
                          </h6>
                        </div>
                        <span className="px-2.5 py-1 text-xs font-mono font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded">
                          {result.searchIntent?.stage || 'TOFU'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed bg-[#14141d]/50 p-3.5 rounded-lg border border-slate-800/80">
                        {result.searchIntent?.explanation}
                      </p>
                    </div>

                    {/* Funnel audience card */}
                    <div className="bg-[#101016] border border-slate-800 rounded-xl p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <h5 className="font-bold text-sm text-white">Target Reader Profile</h5>
                      </div>

                      <div className="space-y-3.5 text-xs text-slate-300">
                        <div>
                          <span className="block text-[10px] font-mono text-slate-500 uppercase">Expertise Target</span>
                          <p className="font-semibold text-slate-100">{result.audienceProfile?.expertiseLevel || 'Mixed'}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] font-mono text-slate-500 uppercase">Demographics</span>
                          <p className="text-slate-300 leading-normal">{result.audienceProfile?.demographics}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Core problem & search triggers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="p-4 bg-indigo-500/5 border border-indigo-950 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <BadgeAlert className="w-4 h-4" />
                        <h6 className="text-xs font-bold uppercase font-mono tracking-wider">User Problem / Struggle</h6>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {result.userProblem}
                      </p>
                    </div>

                    <div className="p-4 bg-rose-500/5 border border-rose-950 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-rose-400">
                        <Zap className="w-4 h-4" />
                        <h6 className="text-xs font-bold uppercase font-mono tracking-wider">Search Intent triggers</h6>
                      </div>
                      <ul className="grid grid-cols-1 gap-1.5 text-xs text-slate-300 plan-triggers">
                        {result.audienceProfile?.intentTriggers?.map((trigger, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span>{trigger}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Keyword Target Strategy */}
              {activeSubTab === 'keywords' && (
                <div className="space-y-6">
                  {/* Primary Focus keyword */}
                  <div className="bg-[#101016] border border-slate-800 rounded-xl p-4 sm:p-5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#cf1544]">Primary Keyword target</span>
                    <h5 className="text-xl font-black text-white mt-1">
                      {result.keywords?.primary || result.keyword}
                    </h5>
                    <p className="text-xs text-slate-400 mt-1">Always utilize this target in the primary title (H1) and absolute first paragraph.</p>
                  </div>

                  {/* Semantic Keywords Tag grid */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <h6 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-200">Semantic &amp; LSI Labyrinths (Sprinkle naturally)</h6>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.keywords?.semantic?.map((kw, i) => (
                        <div
                          key={i}
                          className="px-3 py-1.5 bg-[#12121a] hover:bg-[#161621] border border-slate-800 text-xs text-slate-300 rounded-lg flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                          <span>{kw}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Long Tail search questions */}
                  <div className="space-y-3.5 pt-2">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-rose-400" />
                      <h6 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-200">Long-Tail Search Questions (Perfect for FAQ schema)</h6>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.keywords?.longTailQuestions?.map((item, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-900 rounded-xl p-4 hover:border-slate-800 transition-all space-y-2">
                          <h6 className="text-xs font-bold text-rose-400 flex items-start gap-1.5 font-sans">
                            <span className="font-mono text-slate-500">Q{idx + 1}:</span>
                            <span>{item.question}</span>
                          </h6>
                          <p className="text-[11px] text-slate-400 leading-normal leading-relaxed pl-5">
                            {item.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Detailed Editorial Outline */}
              {activeSubTab === 'outline' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-300 font-mono">Completed Content Milestones</span>
                    <span className="px-2.5 py-0.5 rounded bg-rose-500/10 text-xs font-bold text-rose-400 font-mono">
                      {Object.values(completedOutline).filter(Boolean).length} / {result.outline?.length} Checked
                    </span>
                  </div>

                  {/* Outlining items tree */}
                  <div className="space-y-4">
                    {result.outline?.map((item, index) => {
                      const isCompleted = completedOutline[index] || false;
                      return (
                        <div
                          key={index}
                          className={`bg-[#0d0d12] border rounded-xl overflow-hidden transition-all ${
                            isCompleted ? 'border-emerald-950/80 bg-slate-950/20 opacity-80' : 'border-slate-800'
                          }`}
                        >
                          <div className="p-4 flex items-start gap-4">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => toggleOutlineCheck(index)}
                              className="mt-1 pb-1 outline-none text-slate-450 hover:text-rose-400 transition-all cursor-pointer"
                            >
                              {isCompleted ? (
                                <CheckSquare className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-500" />
                              )}
                            </button>

                            <div className="flex-1 space-y-2">
                              {/* Heading & Tag */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-1.5 py-0.5 text-[9px] font-mono font-black bg-rose-950 text-rose-400 border border-rose-900/60 rounded">
                                  {item.type || 'H2'}
                                </span>
                                <h5 className={`font-bold text-sm text-white ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                                  {item.heading}
                                </h5>
                              </div>

                              <p className="text-xs text-slate-400 pl-1 leading-relaxed">
                                {item.description}
                              </p>

                              {/* Key Points list */}
                              <div className="pl-1 pt-2">
                                <span className="block text-[10px] font-mono uppercase text-slate-550 mb-1.5 font-bold tracking-wide">Points to compile:</span>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                                  {item.keyPointsToCover?.map((point, kIdx) => (
                                    <li key={kIdx} className="flex items-center gap-1.5 bg-slate-950/40 p-2 border border-slate-900 rounded-lg">
                                      <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                      <span className="truncate">{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: On-Page metadata & instructions */}
              {activeSubTab === 'seo' && (
                <div className="space-y-6">
                  {/* Recommended Metrics and Metadata boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Wordcount target */}
                    <div className="bg-[#101016] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="block text-[10px] font-mono text-slate-500 uppercase">Recommended Wordcount</span>
                        <h6 className="text-3xl font-extrabold text-white mt-1">
                          {result.seoGuidelines?.recommendedWordCount || 1500}
                        </h6>
                        <span className="text-xs text-slate-400">words based on current semantic complexity.</span>
                      </div>
                      
                      <div className="w-full bg-slate-955 bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full w-[65%] rounded-full" />
                      </div>
                    </div>

                    {/* Tone details */}
                    <div className="bg-[#101016] border border-slate-800 rounded-xl p-5 md:col-span-2 space-y-3.5">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-rose-450" />
                        <h6 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-200">Writing Style Architecture</h6>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[10px] font-mono text-slate-500 uppercase">Target Persona Voice</span>
                          <span className="text-xs font-semibold text-slate-200">{result.seoGuidelines?.editorialTone || 'Deep professional'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-mono text-slate-500 uppercase">Recommended Layout structure</span>
                          <span className="text-xs font-semibold text-slate-200">{format || 'Comprehensive Guide'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Title and Meta fields */}
                  <div className="space-y-4">
                    {/* Meta Title */}
                    <div className="bg-[#0e0e13] border border-slate-900 rounded-xl p-4 relative space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">CTR-Optimized Title (H1)</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(result.seoGuidelines?.metaTitle, 'metaTitle')}
                          className="px-2 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10.5px] font-mono text-slate-400 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          {copiedText === 'metaTitle' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-sm font-bold text-white selection:bg-rose-500/20">
                        {result.seoGuidelines?.metaTitle}
                      </p>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>Characters: {result.seoGuidelines?.metaTitle?.length}</span>
                        <span>Optimal: 50-60</span>
                      </div>
                    </div>

                    {/* Meta description */}
                    <div className="bg-[#0e0e13] border border-slate-900 rounded-xl p-4 relative space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">Crawler Meta Description</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(result.seoGuidelines?.metaDescription, 'metaDesc')}
                          className="px-2 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10.5px] font-mono text-slate-400 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          {copiedText === 'metaDesc' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed selection:bg-rose-500/20">
                        {result.seoGuidelines?.metaDescription}
                      </p>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>Characters: {result.seoGuidelines?.metaDescription?.length}</span>
                        <span>Optimal: 120-160</span>
                      </div>
                    </div>
                  </div>

                  {/* Schema FAQ markup accordion */}
                  {result.faq && result.faq.length > 0 && (
                    <div className="space-y-3.5 pt-2">
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-indigo-400" />
                        <h6 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-200">Suggested FAQ Section (Recommended FAQPage JSON-LD schema)</h6>
                      </div>

                      <div className="space-y-3">
                        {result.faq.map((faq, idx) => {
                          const expanded = faqExpanded[idx] || false;
                          return (
                            <div key={idx} className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden">
                              <button
                                type="button"
                                onClick={() => toggleFaq(idx)}
                                className="w-full text-left p-4 hover:bg-slate-900/60 flex justify-between items-center cursor-pointer outline-none transition-all"
                              >
                                <span className="text-xs font-bold text-white pr-4">{faq.question}</span>
                                {expanded ? (
                                  <ChevronDown className="w-4 h-4 text-rose-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-500" />
                                )}
                              </button>

                              <AnimatePresence>
                                {expanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden border-t border-slate-900 bg-slate-900/10"
                                  >
                                    <p className="p-4 text-xs text-slate-4 font-normal text-slate-400 leading-relaxed">
                                      {faq.answer}
                                    </p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

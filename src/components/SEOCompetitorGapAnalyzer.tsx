import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  ArrowLeftRight, 
  AlertCircle, 
  ListOrdered, 
  BookOpen, 
  Gauge,
  Layers,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CompetitorInput {
  nameOrUrl: string;
  placeholderText: string;
  contentSummary: string;
}

interface MissingKeyword {
  keyword: string;
  importance: string; // 'High' | 'Medium' | 'Critical'
  rationale: string;
}

interface StructuralGap {
  competitorTopic: string;
  missedDetail: string;
  severity: string; // 'High' | 'Medium' | 'Low'
  fillAction: string;
}

interface CompetitorScoreItem {
  nameOrUrl: string;
  score: number;
}

interface ContentGapReport {
  searchIntent: string;
  missingKeywords: MissingKeyword[];
  structuralGaps: StructuralGap[];
  scores: {
    ourScore: number;
    competitorsScores: CompetitorScoreItem[];
  };
  actionPlan: string[];
}

export default function SEOCompetitorGapAnalyzer() {
  const [targetKeyword, setTargetKeyword] = useState('');
  const [ourContent, setOurContent] = useState('');
  const [competitors, setCompetitors] = useState<CompetitorInput[]>([
    { nameOrUrl: 'Competitor A', placeholderText: 'e.g. TechReview blog layout', contentSummary: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ContentGapReport | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  const sampleKeywords = [
    {
      keyword: 'Best Budget Mechanical Keyboards',
      our: 'A brief list of 3 entry-level plastic boards, emphasizing RGB light modes and simple USB-C connections.',
      competitors: [
        { nameOrUrl: 'keyboardguide.com', contentSummary: 'A 2000-word buyer guide examining switch lubrication, hot-swappable sockets, gasket mounts, and stabilizer rattle.' },
        { nameOrUrl: 'techradar-competitor', contentSummary: 'Focuses heavily on raw sound-test profiles, custom keycap profiles (Double-shot PBT vs ABS), latency rankings, and pricing metrics.' }
      ]
    },
    {
      keyword: 'Learn Tailwind CSS Grid',
      our: 'An introductory guide detailing grid-cols-3, gap-4, and col-span-2 classes with code snapshots.',
      competitors: [
        { nameOrUrl: 'cssdev-weekly', contentSummary: 'Walks through custom grid-template definitions in tailwind.config, fluid item sizing, repeat() autofill configurations, responsive column resets, and performance layouts.' }
      ]
    }
  ];

  const injectSample = (index: number) => {
    const sample = sampleKeywords[index];
    setTargetKeyword(sample.keyword);
    setOurContent(sample.our);
    setCompetitors(sample.competitors.map(c => ({
      nameOrUrl: c.nameOrUrl,
      placeholderText: 'Competitor detail',
      contentSummary: c.contentSummary
    })));
    setReport(null);
    setError(null);
  };

  const addCompetitor = () => {
    if (competitors.length >= 3) return;
    setCompetitors([
      ...competitors,
      { nameOrUrl: `Competitor ${competitors.length + 1}`, placeholderText: 'Competitor layout description or snippet', contentSummary: '' }
    ]);
  };

  const removeCompetitor = (idx: number) => {
    setCompetitors(competitors.filter((_, i) => i !== idx));
  };

  const updateCompetitor = (idx: number, field: keyof CompetitorInput, value: string) => {
    const updated = [...competitors];
    updated[idx] = { ...updated[idx], [field]: value };
    setCompetitors(updated);
  };

  const triggerAnalyze = async () => {
    if (!targetKeyword.trim()) {
      setError('Please provide a primary target search keyword.');
      return;
    }
    if (!ourContent.trim()) {
      setError('Please describe your current content draft or list of topics.');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);
    
    // Smooth loading stepped text feedback triggers to give premium AI feeling
    const progressTexts = [
      'Scanning primary target query & classifying user search intent...',
      'Mapping semantic LSI coordinates against competitor content summaries...',
      'Detecting structural missing gaps and assessing risk thresholds...',
      'Synthesizing tailored action revisions and computing depth scores...'
    ];

    setLoadingStep(0);
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < progressTexts.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    try {
      const response = await fetch('/api/content-gap-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetKeyword,
          ourContent,
          competitors: competitors.map(c => ({ nameOrUrl: c.nameOrUrl, contentSummary: c.contentSummary }))
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setReport(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during Gemini semantic compilation.');
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, refKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(refKey);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyEntireReport = () => {
    if (!report) return;
    const block = `
# SEO CONTENT GAP REPORT: "${targetKeyword.toUpperCase()}"
**Intent Assessment:** ${report.searchIntent}

## TOP LEVEL DEPTH SCORES
- Our Score: ${report.scores.ourScore}/100
${report.scores.competitorsScores.map(c => `- ${c.nameOrUrl}: ${c.score}/100`).join('\n')}

## MISSING LSI / SEMANTIC KEYWORDS
${report.missingKeywords.map(k => `- [${k.importance}] ${k.keyword}: ${k.rationale}`).join('\n')}

## HEAD-TO-HEAD TOPIC GAP AUDIT
${report.structuralGaps.map(g => `### Topic: ${g.competitorTopic} (Severity: ${g.severity})
- Missed elements: ${g.missedDetail}
- Suggested action: ${g.fillAction}`).join('\n\n')}

## ACTIONABLE CONTENT REVISION PLAYBOOK
${report.actionPlan.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(block);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const downloadReportFile = () => {
    if (!report) return;
    const block = `
SEO COMPETITOR CONTENT GAP AUDIT REPORT
============================================================
Target Query  : ${targetKeyword}
Intensity Date: ${new Date().toLocaleDateString()}
Generated by  : APEX SEO Audit Suite
============================================================

SEARCH INTENT ASSESSMENTS:
${report.searchIntent}

------------------------------------------------------------
CONTENT DEPTH ANALYSIS SCORES:
------------------------------------------------------------
* Our Draft/Content  : ${report.scores.ourScore} / 100
${report.scores.competitorsScores.map(c => `* ${c.nameOrUrl}: ${c.score} / 100`).join('\n')}

------------------------------------------------------------
HIGH-PRIORITY MISSING LSI & SEMANTIC KEYWORDS:
------------------------------------------------------------
${report.missingKeywords.map((k, i) => `${i + 1}. [${k.importance.toUpperCase()}] ${k.keyword}
   Rationale: ${k.rationale}`).join('\n\n')}

------------------------------------------------------------
HEAD-TO-HEAD TOPIC GAP AUDIT:
------------------------------------------------------------
${report.structuralGaps.map((g, i) => `${i + 1}. Topic Cover aspect: ${g.competitorTopic}
   Severity of Gap      :  ${g.severity.toUpperCase()}
   Missed Elements      :  ${g.missedDetail}
   Recommended Fill     :  ${g.fillAction}`).join('\n\n')}

------------------------------------------------------------
ACTIONABLE OPTIMIZATION PLAYBOOK (REVISIONS):
------------------------------------------------------------
${report.actionPlan.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

============================================================
End of Report.
    `.trim();

    const element = document.createElement("a");
    const file = new Blob([block], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `SEO-Content-Gap-Report-${targetKeyword.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Stepped visual progress feedback
  const progressTexts = [
    'Scanning primary target query & classifying user search intent...',
    'Mapping semantic LSI coordinates against competitor content summaries...',
    'Detecting structural missing gaps and assessing risk thresholds...',
    'Synthesizing tailored action revisions and computing depth scores...'
  ];

  return (
    <div className="space-y-7" id="seo-competitor-content-gap-analyzer">
      
      {/* Target Input card */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-500 font-bold">In-Depth Semantic Benchmarking</span>
          <h3 className="text-lg font-bold text-white mt-1">Configure Focus Query & Content Outlines</h3>
          <p className="text-slate-400 text-xs mt-1">
            Compare your concepts, headings arrays or raw descriptions with high-ranking competitor sheets to identify low-competition keywords or structural topical holes.
          </p>
        </div>

        {/* Preset quick test helper */}
        <div className="bg-slate-900/60 p-4 border border-slate-850 rounded-xl">
          <span className="text-[10px] font-mono font-medium text-slate-400 block mb-2.5">Speed up with a Demo Concept:</span>
          <div className="flex flex-wrap gap-2">
            {sampleKeywords.map((samp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => injectSample(idx)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-900 hover:bg-slate-850 hover:text-emerald-400 text-slate-300 border border-slate-800 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>"{samp.keyword}"</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Column Local Content */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Primary Target Keyword <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                placeholder="e.g. Best Mechanical Keyboards under $100"
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Your Content draft, Outlines, or Topics list <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={ourContent}
                onChange={(e) => setOurContent(e.target.value)}
                rows={9}
                placeholder="Paste your content outline, header roadmap, draft introduction writeup, or target sections. Be as detailed as possible to yield highly focused content gaps!"
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-0 font-mono transition-all resize-none"
              />
              <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-500 font-mono">
                <span>Words: {ourContent ? ourContent.trim().split(/\s+/).filter(Boolean).length : 0}</span>
                <span>Supports plain text structure</span>
              </div>
            </div>
          </div>

          {/* Column Competitors lists */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Competitors Content benchmarks
              </label>
              <button
                type="button"
                onClick={addCompetitor}
                disabled={competitors.length >= 3}
                className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all ${
                  competitors.length >= 3 
                    ? 'border-slate-800 text-slate-650 cursor-not-allowed opacity-40' 
                    : 'border-emerald-555/40 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rival</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
              <AnimatePresence initial={false}>
                {competitors.map((comp, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 bg-slate-900/80 border border-slate-850 rounded-xl space-y-3 relative group"
                  >
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex-1 flex gap-2">
                        <span className="text-[10px] bg-slate-800 text-slate-400 w-5 h-5 flex items-center justify-center rounded-full font-mono font-bold shrink-0 self-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={comp.nameOrUrl}
                          onChange={(e) => updateCompetitor(idx, 'nameOrUrl', e.target.value)}
                          placeholder="Rival Name or Competitor URL"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/40 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCompetitor(idx)}
                        disabled={competitors.length <= 1}
                        className={`p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-950 transition-all ${
                          competitors.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="Remove benchmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <textarea
                        value={comp.contentSummary}
                        onChange={(e) => updateCompetitor(idx, 'contentSummary', e.target.value)}
                        rows={4}
                        placeholder="Paste competitor outline, summaries, or quick keywords they focus on (e.g., 'Includes gasket mounting specs, custom tactile switch graphs, sound test video link')."
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/40 rounded-lg p-2.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none font-mono resize-none"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex gap-3 text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="text-xs space-y-1">
              <span className="font-bold block">Execution Interrupted</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Trigger Button bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-900 pt-5 gap-3">
          <span className="text-[10px] font-mono text-slate-500">
            Powered by advanced server-side Gemini 3.5 Flash intelligence
          </span>
          <button
            type="button"
            onClick={triggerAnalyze}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Analyzing Content Gaps...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Audit Content Gaps</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stepped Loading feedback panel */}
      {loading && (
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-center py-10 space-y-4">
          <div className="absolute top-0 left-0 h-1 bg-emerald-500 transition-all rounded-full" style={{ width: `${((loadingStep + 1) / progressTexts.length) * 100}%` }} />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 flex items-center justify-center p-3"
          >
            <ArrowLeftRight className="w-6 h-6 text-emerald-500" />
          </motion.div>
          <div className="space-y-1 text-center max-w-sm">
            <h4 className="text-xs font-bold text-slate-300 font-mono">STEP {loadingStep + 1} OF {progressTexts.length}</h4>
            <p className="text-slate-450 text-xs tracking-tight text-white animate-pulse">
              {progressTexts[loadingStep]}
            </p>
          </div>
        </div>
      )}

      {/* Audit Report Panels */}
      {report && (
        <div className="space-y-6">
          
          {/* Header Action bar block */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-900/90 shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 tracking-wider">AUDIT COMPLETED</span>
              <h3 className="text-base font-extrabold text-white">Content Gap Diagnostics Summary</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyEntireReport}
                className="px-3.5 py-1.5 rounded-lg text-xs bg-slate-900 hover:bg-slate-850 hover:text-emerald-400 text-slate-300 border border-slate-800 transition-all flex items-center gap-1.5 font-medium"
              >
                {copiedReport ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Audit!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Markdown</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={downloadReportFile}
                className="px-3.5 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
            </div>
          </div>

          {/* Core Diagnostic Section - Intent and Visual Scoring Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Intent diagnostic block */}
            <div className="lg:col-span-4 bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <h4 className="text-sm font-bold text-white tracking-tight uppercase">Search Intent Assessment</h4>
              </div>
              
              <div className="bg-slate-900/50 p-4 border border-slate-850 rounded-xl space-y-2">
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase block">Classification Diagnostic</span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {report.searchIntent}
                </p>
              </div>

              <div className="bg-slate-900/30 p-3.5 border border-slate-850 rounded-xl text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200 block mb-1">💡 What does this imply?</span>
                Aim to write headers matching this keyword classification. Focus on providing answers to actual intent triggers.
              </div>
            </div>

            {/* Dynamic Depth heatmap scoring card */}
            <div className="lg:col-span-8 bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-emerald-500" />
                  <h4 className="text-sm font-bold text-white tracking-tight uppercase">Topical Depth Heatmap Score</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Benchmark comparison / 100</span>
              </div>

              {/* Progress columns list (Our vs Competitors) */}
              <div className="space-y-4">
                
                {/* Our Score block */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Our content completeness score
                    </span>
                    <span className="text-emerald-400 font-bold">{report.scores.ourScore} / 100</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${report.scores.ourScore}%` }} />
                  </div>
                </div>

                {/* Divider lines */}
                <div className="border-t border-slate-900/60 my-2" />

                {/* Rival Scores list */}
                {report.scores.competitorsScores.map((rival, ri) => (
                  <div key={ri} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" />
                        Rival benchmark: {rival.nameOrUrl}
                      </span>
                      <span className="text-rose-400 font-bold">{rival.score} / 100</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${rival.score}%` }} />
                    </div>
                  </div>
                ))}

              </div>

              <div className="bg-slate-900/40 p-4 border border-slate-850 rounded-xl flex items-start gap-2.5">
                <span className="text-xs">📈</span>
                <span className="text-[11px] text-slate-400 mt-0.5 font-sans leading-relaxed">
                  {report.scores.ourScore < 75 
                    ? 'Your current outline scores below search standards. Overcome the deficits using the missing keywords and structural actions listed below to outperform search engine expectations.'
                    : 'Great starting depth! Expand on the remaining micro-topics outlined in the checklist below to solidify your topic mastery.'
                  }
                </span>
              </div>
            </div>

          </div>

          {/* Missing Keywords Analysis block */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-emerald-500" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Unrepresented Semantic Keywords</h4>
              </div>
              <span className="text-[10px] font-mono text-[#00E5FF]">High relevance topics</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-350 border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 font-mono">
                    <th className="py-2.5 px-3">Keyword Idea</th>
                    <th className="py-2.5 px-3">Priority Level</th>
                    <th className="py-2.5 px-3">Semantic SEO Rationale</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {report.missingKeywords.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30 transition-all font-sans">
                      <td className="py-3 px-3 font-mono font-medium text-white">{item.keyword}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.importance.toLowerCase() === 'critical' || item.importance.toLowerCase() === 'high'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                            : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/10'
                        }`}>
                          {item.importance}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 leading-relaxed">{item.rationale}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.keyword, `key-${idx}`)}
                          className="p-1 px-2 hover:bg-slate-900 rounded-md border border-slate-800 hover:border-emerald-500/30 hover:text-emerald-400 transition-all font-mono text-[10px]"
                        >
                          {copiedKey === `key-${idx}` ? 'Copied' : 'Copy'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Head-to-Head Topical Gaps Analysis block */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Structural Topic Gaps Comparison Panel</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.structuralGaps.map((gap, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-3 hover:border-slate-800 transition-all">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-850 text-slate-350">
                        Topical Aspect #{idx + 1}
                      </span>
                      <span className={`text-[10px] uppercase font-bold tracking-widest ${
                        gap.severity.toLowerCase() === 'high' 
                          ? 'text-rose-450 text-rose-400' 
                          : gap.severity.toLowerCase() === 'medium' ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        Gap risk: {gap.severity}
                      </span>
                    </div>
                    <h5 className="text-xs font-extrabold text-white">{gap.competitorTopic}</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      <span className="font-semibold text-slate-300">Exclude deficit:</span> {gap.missedDetail}
                    </p>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-900 text-[11px] text-slate-300">
                    <span className="text-emerald-400 font-bold block text-[10px] uppercase tracking-wider mb-0.5">Recommended action & layout headers:</span>
                    {gap.fillAction}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Optimization Playbook Guidelines */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-extrabold text-white uppercase tracking-tight">Step-by-Step Revision Playbook</h4>
            </div>

            <div className="space-y-3">
              {report.actionPlan.map((step, sIdx) => (
                <div key={sIdx} className="flex gap-3 text-xs leading-relaxed text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 font-mono text-emerald-400 text-[10px] flex items-center justify-center shrink-0 self-start font-bold">
                    {sIdx + 1}
                  </span>
                  <p className="mt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

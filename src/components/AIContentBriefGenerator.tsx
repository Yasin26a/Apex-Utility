import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Copy, Check, Info, AlertTriangle, RefreshCw, FileText, 
  Trash2, Plus, ChevronUp, ChevronDown, Download, CheckCircle, 
  Layers, ArrowRight, HelpCircle, FileCode, CheckSquare, Square,
  Settings, User, Type, Search, Edit3, BookOpen
} from 'lucide-react';
import { marked } from 'marked';

interface OutlineSection {
  id: string;
  title: string;
  level: string; // "H1", "H2", "H3", "H4"
  description: string;
  keywords?: string[];
  draft?: string; // Generated snippet by AI
  isDrafting?: boolean; // Snippet generation loading indicator
}

interface FAQItem {
  question: string;
  intent: string;
}

interface ContentBriefResult {
  keyword: string;
  intent: string;
  summary: string;
  targetAudience: string;
  recommendedWordCount: string;
  secondaryKeywords: string[];
  suggestedMetaTitle: string;
  suggestedMetaDescription: string;
  faqs: FAQItem[];
  outline: OutlineSection[];
}

export default function AIContentBriefGenerator() {
  // Inputs
  const [keyword, setKeyword] = useState('');
  const [intent, setIntent] = useState('Auto-detect');
  const [focusHeaders, setFocusHeaders] = useState<string[]>(['']);
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>(['']);
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('Professional');
  const [wordCount, setWordCount] = useState('Auto-recommend');

  // UI state
  const [activeResultTab, setActiveResultTab] = useState<'brief' | 'outline' | 'faqs'>('brief');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkedKeywords, setCheckedKeywords] = useState<Record<string, boolean>>({});

  // Result state
  const [result, setResult] = useState<ContentBriefResult | null>(null);

  const loadingSteps = [
    'Analyzing search engine results & semantic landscape...',
    'Interpreting search intent & target demographics...',
    'Clustering LSI and high-relevance secondary keywords...',
    'Synthesizing optimized titles & meta structures...',
    'Constructing hierarchical outline & section strategies...'
  ];

  // focus headers helpers
  const handleAddFocusHeader = () => setFocusHeaders([...focusHeaders, '']);
  const handleRemoveFocusHeader = (index: number) => {
    setFocusHeaders(focusHeaders.filter((_, idx) => idx !== index));
  };
  const handleFocusHeaderChange = (index: number, val: string) => {
    const updated = [...focusHeaders];
    updated[index] = val;
    setFocusHeaders(updated);
  };

  // secondary keywords helpers
  const handleAddSecondaryKeyword = () => setSecondaryKeywords([...secondaryKeywords, '']);
  const handleRemoveSecondaryKeyword = (index: number) => {
    setSecondaryKeywords(secondaryKeywords.filter((_, idx) => idx !== index));
  };
  const handleSecondaryKeywordChange = (index: number, val: string) => {
    const updated = [...secondaryKeywords];
    updated[index] = val;
    setSecondaryKeywords(updated);
  };

  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      setError('Please provide a target seed keyword to base the AI brief on.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);
    setCheckedKeywords({});

    // Dynamic loading screen step cycler
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 2800);

    try {
      const response = await fetch('/api/seo/generate-content-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          intent,
          headers: focusHeaders.filter(h => h.trim() !== ''),
          secondaryKeywords: secondaryKeywords.filter(k => k.trim() !== ''),
          targetAudience: targetAudience.trim(),
          tone,
          wordCount
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate SEO Content Brief.');
      }

      setResult(data);
      setActiveResultTab('brief');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during AI generation.');
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  // Outline manipulation actions
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (!result) return;
    const list = [...result.outline];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    // Swap elements
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    setResult({ ...result, outline: list });
  };

  const handleHeadingTitleChange = (index: number, newTitle: string) => {
    if (!result) return;
    const list = [...result.outline];
    list[index].title = newTitle;
    setResult({ ...result, outline: list });
  };

  const handleHeadingLevelChange = (index: number, newLevel: string) => {
    if (!result) return;
    const list = [...result.outline];
    list[index].level = newLevel;
    setResult({ ...result, outline: list });
  };

  const handleHeadingDescriptionChange = (index: number, newDesc: string) => {
    if (!result) return;
    const list = [...result.outline];
    list[index].description = newDesc;
    setResult({ ...result, outline: list });
  };

  const handleAddSection = (index: number) => {
    if (!result) return;
    const list = [...result.outline];
    const newSection: OutlineSection = {
      id: `custom-heading-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      title: 'New Custom Heading Section',
      level: 'H2',
      description: 'Enter specific content guidelines and semantic instructions for this section here.',
      keywords: []
    };
    list.splice(index + 1, 0, newSection);
    setResult({ ...result, outline: list });
  };

  const handleDeleteSection = (index: number) => {
    if (!result) return;
    const list = result.outline.filter((_, idx) => idx !== index);
    setResult({ ...result, outline: list });
  };

  // Generate AI paragraph draft/snippet for a specific section
  const handleGenerateSectionDraft = async (index: number) => {
    if (!result) return;
    const list = [...result.outline];
    const section = list[index];

    list[index] = { ...section, isDrafting: true };
    setResult({ ...result, outline: list });

    try {
      const response = await fetch('/api/seo/generate-section-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: result.keyword,
          sectionTitle: section.title,
          sectionDescription: section.description,
          level: section.level,
          tone: tone,
          wordCount: '150-250 words',
          sectionKeywords: section.keywords || []
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate draft content.');
      }

      const updatedList = [...result.outline];
      updatedList[index] = { ...section, draft: data.draft, isDrafting: false };
      setResult({ ...result, outline: updatedList });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred generating draft snippet.');
      const updatedList = [...result.outline];
      updatedList[index] = { ...section, isDrafting: false };
      setResult({ ...result, outline: updatedList });
    }
  };

  const handleEditDraftText = (index: number, val: string) => {
    if (!result) return;
    const list = [...result.outline];
    list[index].draft = val;
    setResult({ ...result, outline: list });
  };

  // Toggle checklist keyword
  const toggleKeywordCheck = (k: string) => {
    setCheckedKeywords(prev => ({ ...prev, [k]: !prev[k] }));
  };

  // Export full brief to Markdown file
  const handleExportMarkdown = () => {
    if (!result) return;

    let md = `# SEO Content Brief & Outline: ${result.keyword}\n\n`;
    md += `## SEO Summary & Metadata\n`;
    md += `- **Seed Keyword:** ${result.keyword}\n`;
    md += `- **Search Intent:** ${result.intent}\n`;
    md += `- **Target Audience:** ${result.targetAudience}\n`;
    md += `- **Tone & Style:** ${tone}\n`;
    md += `- **Recommended Word Count:** ${result.recommendedWordCount}\n\n`;
    
    md += `### Optimization Meta tags\n`;
    md += `- **Suggested Title:** ${result.suggestedMetaTitle}\n`;
    md += `- **Suggested Meta Description:** ${result.suggestedMetaDescription}\n\n`;

    md += `### Core Search Landscape Summary\n`;
    md += `${result.summary}\n\n`;

    md += `### Secondary & LSI Keywords Checklist\n`;
    result.secondaryKeywords.forEach(kw => {
      const isChecked = checkedKeywords[kw] ? '[x]' : '[ ]';
      md += `- ${isChecked} ${kw}\n`;
    });
    md += `\n`;

    md += `## Document Outline Hierarchy & AI Snippets\n\n`;
    result.outline.forEach((sec, idx) => {
      const headingSymbol = sec.level === 'H1' ? '#' : sec.level === 'H2' ? '##' : sec.level === 'H3' ? '###' : '####';
      md += `${headingSymbol} ${sec.title}\n`;
      md += `*Guidelines: ${sec.description}*\n`;
      if (sec.keywords && sec.keywords.length > 0) {
        md += `*Target keywords: ${sec.keywords.join(', ')}*\n`;
      }
      md += `\n`;
      if (sec.draft) {
        md += `${sec.draft}\n\n`;
      } else {
        md += `*[Draft Content Pending]*\n\n`;
      }
    });

    md += `## Suggested FAQ Section\n\n`;
    result.faqs.forEach((faq, idx) => {
      md += `### Q: ${faq.question}\n`;
      md += `*Searcher Intent: ${faq.intent}*\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `seo-brief-${result.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6" id="ai-content-brief-root">
      {/* Header */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase">AI Content Strategy suite</span>
        <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-red-500 animate-pulse animate-duration-3000" />
          <span>AI Content Brief &amp; Outline Generator</span>
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Leverage high-performance AI models to construct search-optimized head outline plans, target intents precisely, map headers, and generate inline content draft blocks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Configuration Card */}
        <div className="lg:col-span-5 bg-zinc-950/60 p-5 rounded-2xl border border-zinc-900 shadow-xl backdrop-blur-sm flex flex-col justify-between h-fit space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-zinc-300 border-b border-zinc-900 pb-2">
              <Settings className="w-4 h-4 text-red-500" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider">Brief Configuration Parameters</h3>
            </div>

            {/* Keyword */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Target Seed Keyword <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g., react rendering performance optimization"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all font-sans"
                />
              </div>
            </div>

            {/* Search Intent & Tone row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Search Intent
                </label>
                <select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 text-sm text-white py-2 px-3 rounded-xl focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Auto-detect">🎯 Auto-detect Intent</option>
                  <option value="Informational">📚 Informational (Learn/Guide)</option>
                  <option value="Commercial">🛍️ Commercial (Compare/Review)</option>
                  <option value="Transactional">💳 Transactional (Buy/Download)</option>
                  <option value="Navigational">⚓ Navigational (Brand/Find)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Tone of Voice
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 text-sm text-white py-2 px-3 rounded-xl focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Professional">💼 Professional &amp; Authoritative</option>
                  <option value="Conversational">💬 Conversational &amp; Friendly</option>
                  <option value="Technical">💻 Highly Technical &amp; Detailed</option>
                  <option value="Academic">🎓 Academic &amp; Analytical</option>
                  <option value="Creative">🎨 Creative &amp; Persuasive</option>
                </select>
              </div>
            </div>

            {/* Word Count preference */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Word Count Goal
              </label>
              <select
                value={wordCount}
                onChange={(e) => setWordCount(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 text-sm text-white py-2 px-3 rounded-xl focus:outline-none transition-all cursor-pointer"
              >
                <option value="Auto-recommend">📊 Auto-recommend (AI decides based on difficulty)</option>
                <option value="Short-form (500-1000 words)">📝 Short-form (500 - 1,000 words)</option>
                <option value="Medium-form (1000-1500 words)">📄 Medium-form (1,000 - 1,500 words)</option>
                <option value="Long-form (1500-2500 words)">📑 Long-form (1,500 - 2,500 words)</option>
                <option value="Epic Pillar (2500+ words)">📚 Epic Pillar Content (2,500+ words)</option>
              </select>
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Target Audience (Optional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Frontend engineers, busy parents, SaaS managers"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all font-sans"
                />
              </div>
            </div>

            {/* Focus Headers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Required Focus Headers (Optional)
                </label>
                <button
                  type="button"
                  onClick={handleAddFocusHeader}
                  className="text-[10px] text-red-400 hover:text-red-300 font-mono flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Header
                </button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {focusHeaders.map((header, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => handleFocusHeaderChange(idx, e.target.value)}
                      placeholder={`Focus Heading #${idx + 1}`}
                      className="flex-1 bg-zinc-900 border border-zinc-800/80 focus:border-red-600 rounded-lg py-1 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all font-sans"
                    />
                    {focusHeaders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFocusHeader(idx)}
                        className="bg-zinc-900 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 p-1.5 rounded-lg border border-zinc-850/80 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary/LSI Keywords */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Specific Secondary Keywords (Optional)
                </label>
                <button
                  type="button"
                  onClick={handleAddSecondaryKeyword}
                  className="text-[10px] text-red-400 hover:text-red-300 font-mono flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Keyword
                </button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {secondaryKeywords.map((keywordItem, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={keywordItem}
                      onChange={(e) => handleSecondaryKeywordChange(idx, e.target.value)}
                      placeholder={`Secondary Keyword #${idx + 1}`}
                      className="flex-1 bg-zinc-900 border border-zinc-800/80 focus:border-red-600 rounded-lg py-1 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all font-sans"
                    />
                    {secondaryKeywords.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSecondaryKeyword(idx)}
                        className="bg-zinc-900 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 p-1.5 rounded-lg border border-zinc-850/80 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900 space-y-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !keyword.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-950/20"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Generating Brief...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white fill-white" />
                  <span>Synthesize Content Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className="lg:col-span-7 flex flex-col justify-between min-h-[500px]">
          <AnimatePresence mode="wait">
            {/* 1. INITIAL PLACEHOLDER STATE */}
            {!isGenerating && !result && !error && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 bg-zinc-950/35 border border-zinc-900/60 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-4"
              >
                <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-zinc-500 animate-pulse" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-bold text-zinc-300">Brief Planner Sandbox</h4>
                  <p className="text-xs text-zinc-500">
                    Input your target seed keyword and custom guidelines on the left, then click "Synthesize Content Plan" to generate your search blueprint.
                  </p>
                </div>
              </motion.div>
            )}

            {/* 2. LOADING STATE WITH CYCLING LABELS */}
            {isGenerating && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 bg-zinc-950/50 border border-zinc-900 rounded-2xl flex flex-col items-center justify-center p-8 space-y-6"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-red-500/10 border-t-red-600 rounded-full animate-spin" />
                  <Sparkles className="w-6 h-6 text-red-500 animate-pulse absolute inset-0 m-auto" />
                </div>

                <div className="space-y-2 text-center max-w-md">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase">AI Processor Active</span>
                  <p className="text-sm text-white font-bold transition-all duration-300">
                    {loadingSteps[loadingStep]}
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    This can take up to 20-30 seconds as Gemini generates CTR layouts, semantic outline mapping, LSI keyword distribution, and comprehensive guidelines.
                  </p>
                </div>
              </motion.div>
            )}

            {/* 3. ERROR ALERT */}
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 bg-red-950/15 border border-red-900/45 p-6 rounded-2xl flex gap-4 items-start"
              >
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-red-300">Brief Generation Faulted</p>
                  <p className="text-xs text-red-400/90 leading-relaxed">{error}</p>
                  <button
                    onClick={handleGenerate}
                    className="mt-3 bg-red-900/20 hover:bg-red-900/40 border border-red-800 text-red-300 text-xs font-mono font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-colors"
                  >
                    Retry Generation
                  </button>
                </div>
              </motion.div>
            )}

            {/* 4. ANALYSIS & BRIEF RESULTS CONTAINER */}
            {result && !isGenerating && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="flex-1 flex flex-col gap-4"
              >
                {/* Horizontal Navigation Tab Bar */}
                <div className="flex bg-zinc-950 border border-zinc-900 p-1 rounded-xl items-center">
                  <button
                    onClick={() => setActiveResultTab('brief')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeResultTab === 'brief'
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>SEO Strategy Brief</span>
                  </button>
                  <button
                    onClick={() => setActiveResultTab('outline')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeResultTab === 'outline'
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Interactive Outline ({result.outline.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveResultTab('faqs')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeResultTab === 'faqs'
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>User FAQs</span>
                  </button>
                </div>

                {/* Sub Tab Screen content */}
                <div className="bg-zinc-950/60 p-5 rounded-2xl border border-zinc-900 shadow-xl space-y-5 overflow-y-auto max-h-[640px] scrollbar-thin">
                  
                  {/* TAB A: BRIEF PROFILE & CTR ELEMENTS */}
                  {activeResultTab === 'brief' && (
                    <div className="space-y-5">
                      
                      {/* Keyword Profile Summary Header */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-zinc-900 pb-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Classified Search Intent</span>
                          <span className="text-sm font-extrabold text-white font-sans bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                            🎯 {result.intent}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Recommended Word Count</span>
                          <span className="text-sm font-mono font-bold text-red-400 bg-red-950/10 px-3 py-1 rounded-lg border border-red-950/20">
                            📊 {result.recommendedWordCount}
                          </span>
                        </div>
                      </div>

                      {/* SERP Snippet Preview Box */}
                      <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 space-y-3.5 relative overflow-hidden">
                        <div className="absolute top-3 right-3 text-[9px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded uppercase">SERP Snippet Preview</div>
                        
                        <div className="space-y-1.5">
                          {/* Title */}
                          <div className="group flex items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase">Target Title ({result.suggestedMetaTitle.length}/60 chars)</span>
                              <a href="#" className="text-blue-400 hover:underline text-base font-medium block leading-tight">{result.suggestedMetaTitle}</a>
                            </div>
                            <button
                              onClick={() => triggerCopy(result.suggestedMetaTitle, 'title')}
                              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg border border-zinc-850 transition-colors shrink-0 cursor-pointer"
                              title="Copy Meta Title"
                            >
                              {copiedId === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {/* URL path preview */}
                          <div className="text-emerald-500 text-xs font-mono truncate">
                            https://yourdomain.com/blog/{result.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                          </div>

                          {/* Description */}
                          <div className="group flex items-start justify-between gap-2 pt-1 border-t border-zinc-900">
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase">Suggested Meta Description ({result.suggestedMetaDescription.length}/160 chars)</span>
                              <p className="text-zinc-400 text-xs leading-relaxed">{result.suggestedMetaDescription}</p>
                            </div>
                            <button
                              onClick={() => triggerCopy(result.suggestedMetaDescription, 'desc')}
                              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg border border-zinc-850 transition-colors shrink-0 mt-2 cursor-pointer"
                              title="Copy Meta Description"
                            >
                              {copiedId === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Overview Analysis Paragraph */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Executive SEO Strategy Overview</span>
                        <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl">
                          {result.summary}
                        </div>
                      </div>

                      {/* Secondary Keyword list checklist */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Target LSI Keywords Integration Tracker</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {result.secondaryKeywords.map((kw, i) => {
                            const isChecked = !!checkedKeywords[kw];
                            return (
                              <button
                                key={i}
                                onClick={() => toggleKeywordCheck(kw)}
                                className={`p-2 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs cursor-pointer ${
                                  isChecked 
                                    ? 'bg-red-950/15 border-red-900/40 text-red-300 font-medium'
                                    : 'bg-zinc-900/60 border-zinc-850 text-zinc-400 hover:text-zinc-300 hover:border-zinc-800'
                                }`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-red-500 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                                )}
                                <span className="truncate">{kw}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB B: OUTLINE HIERARCHY BUILDER */}
                  {activeResultTab === 'outline' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Document Headings Outline Strategy</span>
                        <span className="text-[11px] font-mono text-zinc-400">Drag/rearrange, add headings or draft content below</span>
                      </div>

                      <div className="space-y-3.5">
                        {result.outline.map((sec, idx) => {
                          return (
                            <div 
                              key={sec.id} 
                              className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-3 transition-all hover:border-zinc-800"
                            >
                              {/* Title / Row controls */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2.5 flex-1">
                                  {/* Level select */}
                                  <select
                                    value={sec.level}
                                    onChange={(e) => handleHeadingLevelChange(idx, e.target.value)}
                                    className="bg-zinc-900 border border-zinc-800 focus:border-red-600 text-[10px] font-mono font-bold uppercase py-1 px-2 rounded-lg text-red-400 focus:outline-none cursor-pointer shrink-0"
                                  >
                                    <option value="H1">H1</option>
                                    <option value="H2">H2</option>
                                    <option value="H3">H3</option>
                                    <option value="H4">H4</option>
                                  </select>

                                  {/* Title input editable */}
                                  <div className="relative flex-1 group/input">
                                    <input
                                      type="text"
                                      value={sec.title}
                                      onChange={(e) => handleHeadingTitleChange(idx, e.target.value)}
                                      className="w-full bg-transparent border-b border-transparent focus:border-zinc-800 text-sm font-bold text-white focus:outline-none py-0.5"
                                    />
                                    <Edit3 className="w-3 h-3 text-zinc-600 opacity-0 group-hover/input:opacity-100 absolute right-2 top-1.5 transition-opacity" />
                                  </div>
                                </div>

                                {/* Up / Down / Add / Delete Actions */}
                                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                  <button
                                    onClick={() => handleMoveSection(idx, 'up')}
                                    disabled={idx === 0}
                                    className="p-1 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all"
                                    title="Move Heading Up"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveSection(idx, 'down')}
                                    disabled={idx === result.outline.length - 1}
                                    className="p-1 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all"
                                    title="Move Heading Down"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleAddSection(idx)}
                                    className="p-1 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white rounded cursor-pointer transition-all"
                                    title="Add Heading Below"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSection(idx)}
                                    className="p-1 bg-zinc-900 border border-zinc-850 hover:border-red-900 text-zinc-500 hover:text-red-400 rounded cursor-pointer transition-all"
                                    title="Delete Heading"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Actionable Guidelines instruction editable */}
                              <div className="space-y-1">
                                <span className="text-[9px] font-mono text-zinc-500 uppercase block">Guidance &amp; Key Points</span>
                                <textarea
                                  value={sec.description}
                                  onChange={(e) => handleHeadingDescriptionChange(idx, e.target.value)}
                                  rows={1}
                                  className="w-full bg-zinc-900/40 border border-zinc-900 focus:border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none transition-all resize-none font-sans"
                                  placeholder="What should be covered in this section?"
                                />
                              </div>

                              {/* AI Snippet writer drawer */}
                              <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-xl p-3 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-red-500 animate-pulse" />
                                    <span>AI Draft Content Generator</span>
                                  </span>

                                  <button
                                    onClick={() => handleGenerateSectionDraft(idx)}
                                    disabled={sec.isDrafting}
                                    className="bg-red-950/20 hover:bg-red-600 border border-red-900/40 hover:border-red-500 text-red-400 hover:text-white text-[10px] font-mono font-bold py-1 px-3 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                                  >
                                    {sec.isDrafting ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        <span>Writing Draft...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3 h-3" />
                                        <span>Generate Draft Section</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Generated Section Snippet Display */}
                                {sec.draft ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={sec.draft}
                                      onChange={(e) => handleEditDraftText(idx, e.target.value)}
                                      className="w-full h-36 bg-zinc-900 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all font-mono"
                                    />
                                    
                                    {/* HTML Preview toggle */}
                                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 max-h-36 overflow-y-auto">
                                      <span className="text-[9px] font-mono text-zinc-600 uppercase block mb-1">HTML Content Preview</span>
                                      <div 
                                        className="text-xs text-zinc-300 leading-relaxed font-sans prose prose-invert prose-xs max-w-none"
                                        dangerouslySetInnerHTML={{ __html: marked.parse(sec.draft) as string }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-zinc-600 font-mono italic">
                                    No AI content drafted. Click "Generate Draft Section" to let Gemini write an optimized first draft paragraph for this section.
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB C: FAQs / SEARCHERS ASK */}
                  {activeResultTab === 'faqs' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Primary FAQs &amp; User Questions (PAA)</span>
                        <span className="text-[11px] font-mono text-zinc-400">Ensure your draft addresses these direct queries</span>
                      </div>

                      <div className="space-y-3">
                        {result.faqs.map((faq, i) => (
                          <div key={i} className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl space-y-1.5 hover:border-zinc-850 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-sm font-extrabold text-white font-sans">{faq.question}</h4>
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-red-950/20 text-red-400 px-2 py-0.5 rounded border border-red-950/35 shrink-0 mt-0.5">
                                {faq.intent}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed italic">
                              Include a distinct subsection or structured block answering this query directly using short, authoritative list items.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Export Action Bar */}
                <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Full Blueprint Ready</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Compile sitemaps, focus headers, and draft paragraph snippets.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => triggerCopy(JSON.stringify(result, null, 2), 'json-export')}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {copiedId === 'json-export' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied JSON</span>
                        </>
                      ) : (
                        <>
                          <FileCode className="w-3.5 h-3.5" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleExportMarkdown}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-red-950/15"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Markdown (.md)</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Google AdSense Compliant Informational Article & FAQs Footer */}
      <div className="border-t border-zinc-900 pt-12 mt-12 space-y-10 text-left max-w-5xl mx-auto px-4">
        
        {/* Editorial Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Developer Guide: Semantic SEO Content Outlines & AI Briefs</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">
            Structuring Semantic Content Plans & Winning the On-Page Google AdSense Approval Workflow
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Struggling to clear Google's automated "Low Value Content" checks? Discover how constructing multi-level semantic content outlines, integrating secondary keyword lattices, and answering search intent shields your web properties from immediate AdSense application rejections.
          </p>
        </div>

        {/* 2-Column Article Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Article Column 1 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-red-500 font-mono">01.</span>
                What is a Semantic Content Brief?
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                A **Semantic Content Brief** is a highly detailed, data-driven strategy document outlining the complete editorial blueprint of an article before any paragraphs are drafted. Unlike simple bullet lists, a comprehensive brief maps specific user intents, target headers (H1 to H4 hierarchy), keyword distribution frameworks, and competitor benchmark metrics.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                By designing content structures around semantic Latent Semantic Indexing (LSI) topics, developers and writers can ensure they cover a search term exhaustively, signaling deep authority directly to search engine algorithms.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-red-500 font-mono">02.</span>
                Deconstructing Search Intent Formats
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                To capture traffic, search engines evaluate whether your content satisfies the user's implicit intent behind a query. We classify search intents into four major baseline segments:
              </p>
              <ul className="space-y-2 text-zinc-400 text-xs pl-4 list-disc">
                <li><strong className="text-zinc-200">Informational:</strong> Users seek answers to specific questions or want to learn about a topic (e.g., "how does react render").</li>
                <li><strong className="text-zinc-200">Commercial:</strong> Users compare brands, read reviews, or research alternatives (e.g., "drizzle vs prisma performance").</li>
                <li><strong className="text-zinc-200">Transactional:</strong> Users have an active purchasing mindset and look to complete an action (e.g., "buy premium developer license").</li>
                <li><strong className="text-zinc-200">Navigational:</strong> Users aim to find a specific brand page or resource url (e.g., "github login page").</li>
              </ul>
            </div>
          </div>

          {/* Article Column 2 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-red-500 font-mono">03.</span>
                Leveraging the H1-H4 Heading Hierarchy
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                A clear heading structure acts as a guide for both human readers and search crawlers. Applying **proper semantic headings** (such as nesting `H3` nodes strictly under their parent `H2` segments) signals logical layout, making the text scannable and easy for Google to parse.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Furthermore, search engine featured snippets and automated FAQ boxes are heavily pulled from structured headings that contain direct, concise answers immediately below them.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-red-500 font-mono">04.</span>
                How to Build an Optimized Content Brief
              </h4>
              <ol className="space-y-1.5 text-zinc-400 text-xs pl-4 list-decimal">
                <li>Input your target seed keyword into our brief configuration sidebar.</li>
                <li>Specify the target audience and tone of voice (professional, friendly, technical) to align with search patterns.</li>
                <li>Add known required headings or key competitor topics to seed the outline system.</li>
                <li>Click "Synthesize Content Plan" to trigger our advanced semantic models to construct full briefs and meta-tag outlines.</li>
                <li>Generate and edit live AI paragraph drafts for individual sections to accelerate the writing workflow.</li>
                <li>Export the completed plan directly to clean Markdown (.md) files for direct integration into your headless CMS.</li>
              </ol>
            </div>
          </div>

        </div>

        {/* Separator */}
        <div className="border-t border-zinc-900/60" />

        {/* FAQ Section */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white tracking-tight">Frequently Asked Questions (FAQ)</h4>
            <p className="text-zinc-500 text-xs">Got questions about content structure, AdSense low-value policies, and keyword density? Read on.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
                Why does Google AdSense reject sites for "Thin Content"?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                AdSense values comprehensive sites with deep informational content. If your pages contain nothing but single-form utilities, images, or brief 100-word blurbs with zero semantic context, Google's crawlers flag it as "thin" or "low-value" because it offers no written context for ad targeting.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
                What is the optimum keyword density for secondary terms?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Modern search algorithms have moved beyond strict keyword density rules, preferring natural semantic coverage. Aim to integrate your secondary and LSI terms naturally (around 0.5% to 1.5% density) within body paragraphs, ensuring high context without keyword stuffing.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
                How long should my articles be to guarantee search indexation?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                There is no magic word count. A quick informational query may require 800 words, whereas a highly competitive commercial review might require over 2,500 words. The objective is to completely cover all related user intents exhaustively.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
                Are content outlines generated here private and secure?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Absolutely. While the AI model processes your request securely on our servers to fetch semantic parameters, no drafts, outlines, or proprietary keywords are stored, ensuring full intellectual sovereignty over your content plans.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

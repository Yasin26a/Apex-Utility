import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Zap, 
  BookOpen, 
  Heart, 
  Bookmark, 
  ThumbsUp, 
  ArrowRight, 
  Info, 
  HelpCircle, 
  Video, 
  MessageSquare,
  Repeat,
  Eye,
  CheckCircle2,
  Lock,
  ExternalLink
} from 'lucide-react';

interface HookItem {
  formulaName: string;
  hookText: string;
  psychology: string;
  transition: string;
  engagementTips: string[];
}

interface HookGeneratorResult {
  topic: string;
  platform: string;
  tone: string;
  hooks: HookItem[];
}

const PLATFORMS = [
  { id: 'twitter', label: 'Twitter / X', icon: Twitter, desc: 'Short, snappy, or thread-starting punches' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, desc: 'Professional, story-driven, or framework insights' },
  { id: 'youtube', label: 'YouTube Intro', icon: Youtube, desc: 'High-retention video script hooks' },
  { id: 'short-video', label: 'Short Video / Reels', icon: Video, desc: 'Captions & 3-second talking-head anchors' }
];

const TONES = [
  { value: 'Curious', label: 'Curious Mystery', desc: 'Posing an intriguing, unresolved question' },
  { value: 'Provocative & Contrarian', label: 'Contrarian / Bold', desc: 'Challenging conventional or standard advice' },
  { value: 'Storytelling & Narrative', label: 'Story-Driven', desc: '"I did X in Y days..." personal narratives' },
  { value: 'Educational & Analytical', label: 'Analytical Breakdown', desc: 'Case studies, data, or step-by-step systems' },
  { value: 'Authoritative', label: 'Industry Expert', desc: 'Strong, research-backed statements of expertise' },
  { value: 'Humorous & Witty', label: 'Witty / Clever', desc: 'A casual, fun, or punchy take' }
];

const FORMATS = [
  { value: 'Thread Starter', label: 'Thread-Opening Series (X/Twitter)' },
  { value: 'Standalone Punch', label: 'Standalone Single-Post Hook' },
  { value: 'Talking-Head Hook', label: 'First 3-Seconds Video Opener' },
  { value: 'Framework Announcement', label: 'High-Value PDF/Resource Handout' }
];

const DEMO_TOPICS = [
  "Leaving my 9-to-5 to build a micro-SaaS with zero funding",
  "Why 90% of developers fail their first system architecture interview",
  "The CSS layout secret Apple uses to double their product card conversions",
  "How the 80/20 rule helped us save $42,000 in monthly cloud infrastructure server costs"
];

const LOADING_STEPS = [
  "Deconstructing viral algorithm CTR patterns...",
  "Classifying psychological tension & curiosity loops...",
  "Applying professional copywriting formulas...",
  "Pruning and optimizing character counts...",
  "Injecting visual pattern interrupts and spacing..."
];

export default function SocialMediaHookGenerator() {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [tone, setTone] = useState('Curious');
  const [format, setFormat] = useState('Thread Starter');
  const [audience, setAudience] = useState('');
  const [customAudience, setCustomAudience] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<HookGeneratorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedHookIndex, setSelectedHookIndex] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<'hook' | 'transition' | 'all' | null>(null);

  // Rotate loading steps every 2.2 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedHookIndex(0);

    try {
      const response = await fetch('/api/hook-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic,
          platform,
          tone,
          audience: customAudience ? audience : 'General content creators and professionals',
          format
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error generating hooks.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Error generating hooks:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'hook' | 'transition' | 'all') => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getPlatformColors = (platId: string) => {
    switch (platId) {
      case 'twitter':
        return {
          bg: 'bg-black',
          text: 'text-white',
          border: 'border-zinc-800',
          accent: 'text-sky-400',
          hoverBg: 'hover:bg-zinc-900'
        };
      case 'linkedin':
        return {
          bg: 'bg-slate-900',
          text: 'text-slate-100',
          border: 'border-slate-800',
          accent: 'text-blue-400',
          hoverBg: 'hover:bg-slate-800'
        };
      case 'youtube':
        return {
          bg: 'bg-zinc-950',
          text: 'text-zinc-100',
          border: 'border-zinc-900',
          accent: 'text-red-500',
          hoverBg: 'hover:bg-zinc-900'
        };
      default:
        return {
          bg: 'bg-zinc-950',
          text: 'text-zinc-100',
          border: 'border-zinc-900',
          accent: 'text-pink-500',
          hoverBg: 'hover:bg-zinc-900'
        };
    }
  };

  const activeHook = result?.hooks?.[selectedHookIndex];
  const charCount = activeHook?.hookText.length || 0;
  const isOverTwitterLimit = platform === 'twitter' && charCount > 280;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6" id="social-hooks-container">
      {/* Tool Header */}
      <div className="mb-8 text-center md:text-left">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-purple-500/20">
          <Sparkles className="w-3 h-3" />
          <span>AI Content Architect</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          AI Social Media Hook Generator
        </h1>
        <p className="text-zinc-400 max-w-2xl text-sm leading-relaxed">
          Craft high-CTR viral hooks for Twitter/X, LinkedIn, and YouTube. Power up your impressions, maximize audience dwell time, and out-smart content platform algorithms using psychological trigger formulas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-md">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            Hook Parameter Studio
          </h2>

          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Topic Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                What is your post/video about? <span className="text-purple-400">*</span>
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Describe your core concept, case study, story, or high-value lesson..."
                className="w-full h-28 px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                maxLength={400}
                required
              />
              <div className="flex justify-between items-center mt-1 text-[11px] text-zinc-500">
                <span>Be descriptive for better results.</span>
                <span>{topic.length}/400</span>
              </div>
            </div>

            {/* Quick Demo Topics */}
            <div>
              <span className="block text-xs font-semibold text-zinc-400 mb-2">
                Or try a high-potential concept:
              </span>
              <div className="flex flex-wrap gap-2">
                {DEMO_TOPICS.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTopic(t)}
                    className="text-xs bg-zinc-950 hover:bg-zinc-800/80 text-zinc-300 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg text-left transition-all max-w-full truncate"
                  >
                    💡 {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
                Target Platform
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {PLATFORMS.map((plat) => {
                  const IconComp = plat.icon;
                  const isSelected = platform === plat.id;
                  return (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => {
                        setPlatform(plat.id);
                        if (plat.id === 'linkedin') setFormat('Standalone Punch');
                        else if (plat.id === 'youtube') setFormat('Talking-Head Hook');
                        else if (plat.id === 'short-video') setFormat('Talking-Head Hook');
                        else setFormat('Thread Starter');
                      }}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-purple-500/10 border-purple-500/80 text-white' 
                          : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <IconComp className={`w-4 h-4 ${isSelected ? 'text-purple-400' : 'text-zinc-500'}`} />
                        <span className="text-xs font-semibold">{plat.label}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 leading-tight truncate w-full">
                        {plat.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tone & Format Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tone Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Emotional Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Format Style
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Audience Toggle */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Target Audience (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setCustomAudience(!customAudience)}
                  className="text-[10px] text-purple-400 hover:underline"
                >
                  {customAudience ? 'Use General Default' : 'Customize Audience'}
                </button>
              </div>
              {customAudience ? (
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. junior software developers, marketing executives, realtors"
                  className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              ) : (
                <div className="bg-zinc-950/40 text-zinc-500 rounded-xl px-3 py-2 border border-zinc-800/40 text-xs">
                  Targeting general creators and industry professionals.
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                loading || !topic.trim()
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/20 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Copy Frameworks...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>Generate Viral Hooks</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Output / Creative Sandbox */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center space-y-6"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                  <Sparkles className="w-6 h-6 text-purple-400 absolute top-5 left-5 animate-pulse" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-white font-bold">Assembling Viral Accents</h3>
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
                  <h4 className="font-bold text-sm text-white">Generation Failed</h4>
                  <p className="text-xs text-red-400 leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Empty state when tool loads */}
            {!loading && !result && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl p-10 text-center min-h-[480px] flex flex-col items-center justify-center"
              >
                <div className="w-14 h-14 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-white font-bold mb-2">Awaiting Parameters</h3>
                <p className="text-zinc-400 text-xs max-w-sm leading-relaxed mb-6">
                  Input your topic or click one of our high-performing prompt topics on the left, select your targets, and run the generator to create psychological hooks.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-500 text-[11px] border-t border-zinc-800/40 pt-6 w-full max-w-md">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Psychology Patterns</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Copywriting Models</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                    <span>100% Private Engine</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Successful Output Area */}
            {result && !loading && !error && (
              <motion.div
                key="output"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Generated Header & Selector */}
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-0.5">
                      Generation Results
                    </h3>
                    <p className="text-white font-bold text-sm">
                      5 Custom-Designed Viral Strategy Hooks
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 overflow-x-auto">
                    {result.hooks.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedHookIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all shrink-0 ${
                          selectedHookIndex === idx
                            ? 'bg-purple-600 text-white'
                            : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                        }`}
                      >
                        Hook #{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Preview Panel - Social Mockup */}
                <div className="space-y-3">
                  <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Interactive Native Mockup Preview
                  </span>

                  {/* Native Social Card Container */}
                  <div className="relative overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl">
                    {/* Render specific platform shell */}
                    {platform === 'twitter' && (
                      <div className="bg-black text-white p-5 md:p-6 font-sans">
                        {/* Twitter Post Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white">
                              AU
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-sm text-zinc-100 hover:underline cursor-pointer">Apex Creator</span>
                                <span className="text-zinc-500 text-xs">@ApexUtilityLabs</span>
                              </div>
                              <span className="text-zinc-500 text-xs">Now · 📊 Algorithmic Boost Enabled</span>
                            </div>
                          </div>
                          <Twitter className="w-4 h-4 text-sky-400" />
                        </div>

                        {/* Hook Text Display */}
                        <div className="text-[15px] md:text-[16px] text-zinc-100 font-normal leading-relaxed whitespace-pre-wrap select-all mb-4">
                          {activeHook?.hookText}
                        </div>

                        {/* Transition/Next Line */}
                        <div className="pl-4 border-l-2 border-zinc-800 text-zinc-400 text-sm italic py-1 mb-5">
                          {activeHook?.transition}
                        </div>

                        {/* Meta/Stats Bar */}
                        <div className="flex items-center justify-between text-zinc-500 text-xs border-t border-zinc-900 pt-4 font-mono">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 hover:text-sky-400 cursor-pointer">
                              <MessageSquare className="w-3.5 h-3.5" /> 2.4k
                            </span>
                            <span className="flex items-center gap-1 hover:text-emerald-400 cursor-pointer">
                              <Repeat className="w-3.5 h-3.5" /> 840
                            </span>
                            <span className="flex items-center gap-1 hover:text-pink-500 cursor-pointer">
                              <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" /> 19.5k
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Dwell Time Target: 85s</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {platform === 'linkedin' && (
                      <div className="bg-[#1d2226] text-zinc-100 p-5 md:p-6 font-sans">
                        {/* LinkedIn Post Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white">
                              AU
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-zinc-100 hover:underline cursor-pointer">Apex Creator</span>
                                <span className="text-[11px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">1st</span>
                              </div>
                              <span className="text-zinc-400 text-xs block leading-tight">Growth Strategist & System Architect | Suite Creator</span>
                              <span className="text-zinc-500 text-[10px]">1h · Edited · 🌐</span>
                            </div>
                          </div>
                          <Linkedin className="w-4 h-4 text-blue-400" />
                        </div>

                        {/* Hook Text Display */}
                        <div className="text-[14px] md:text-[15px] text-zinc-100 font-normal leading-relaxed whitespace-pre-wrap mb-2">
                          {activeHook?.hookText}
                        </div>

                        {/* LinkedIn 'See More' Fold Simulation */}
                        <div className="text-purple-400 hover:text-purple-300 text-xs font-bold cursor-pointer mb-4 flex items-center gap-1">
                          ...see more (algorithmic hook fold)
                        </div>

                        {/* Transition/Below Fold Preview */}
                        <div className="p-3.5 bg-zinc-950/40 rounded-xl border border-zinc-800/40 text-xs text-zinc-400 italic">
                          <span className="font-bold text-zinc-200 block not-italic mb-1">📝 Transition (Revealed below the fold):</span>
                          {activeHook?.transition}
                        </div>

                        {/* Social Reactions Bar */}
                        <div className="flex items-center justify-between text-zinc-400 text-xs border-t border-zinc-800 pt-4 mt-5">
                          <div className="flex items-center gap-1">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px]">👍</span>
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] -ml-1">👏</span>
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] -ml-1">💡</span>
                            <span className="ml-1 text-[11px]">842 reactions</span>
                          </div>
                          <span className="hover:underline cursor-pointer text-[11px]">118 comments · 42 shares</span>
                        </div>
                      </div>
                    )}

                    {(platform === 'youtube' || platform === 'short-video') && (
                      <div className="bg-zinc-950 text-white p-5 md:p-6 font-sans">
                        {/* Video Player Mockup Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                              {platform === 'youtube' ? 'YouTube script intro hook' : 'Vertical Reels / TikTok Hook'}
                            </span>
                          </div>
                          <Youtube className="w-4 h-4 text-red-500" />
                        </div>

                        {/* Hook Text Display */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2 text-xs font-mono text-zinc-400">
                            <Zap className="w-3.5 h-3.5 text-yellow-400" />
                            <span>First 3 Seconds: Vocal Opener (High Energy)</span>
                          </div>
                          <div className="text-[16px] text-zinc-100 font-bold leading-relaxed whitespace-pre-wrap select-all">
                            &quot;{activeHook?.hookText}&quot;
                          </div>
                        </div>

                        {/* Visual directions & transition */}
                        <div className="space-y-3">
                          <div className="bg-zinc-900/60 border border-zinc-850 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-zinc-400">
                              <Eye className="w-3.5 h-3.5 text-purple-400" />
                              <span>Transition Sentence (3s to 10s Screen retention)</span>
                            </div>
                            <p className="text-xs text-zinc-300 italic leading-relaxed">
                              {activeHook?.transition}
                            </p>
                          </div>
                        </div>

                        {/* Engagement Metrics */}
                        <div className="flex items-center justify-between text-zinc-500 text-xs border-t border-zinc-900 pt-4 mt-5 font-mono">
                          <span>Target Retention: &gt;75% at 15s</span>
                          <span>9.8k Views Target</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Character Metrics & Copy Toolbox */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Copy Toolkit */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                      Sandbox Output Toolbox
                    </span>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => copyToClipboard(activeHook?.hookText || '', 'hook')}
                        className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-200 hover:text-white rounded-lg text-xs font-medium border border-zinc-800 transition-all"
                      >
                        <span className="flex items-center gap-2">
                          <Copy className="w-3.5 h-3.5 text-purple-400" />
                          Copy Core Hook Sentence
                        </span>
                        {copiedText === 'hook' ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                            <Check className="w-3 h-3" /> Copied!
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">Ready</span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          const fullCopy = `${activeHook?.hookText}\n\n${activeHook?.transition}`;
                          copyToClipboard(fullCopy, 'all');
                        }}
                        className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-purple-950/40 to-indigo-950/40 hover:from-purple-950/60 hover:to-indigo-950/60 text-zinc-200 hover:text-white rounded-lg text-xs font-semibold border border-purple-500/20 hover:border-purple-500/40 transition-all"
                      >
                        <span className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-yellow-400" />
                          Copy Hook + Transition (Full Block)
                        </span>
                        {copiedText === 'all' ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Copied!
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">Popular</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Character Counter Card */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                        Character Audit
                      </span>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`text-2xl font-black font-mono ${isOverTwitterLimit ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                          {charCount}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">characters</span>
                      </div>
                    </div>
                    {platform === 'twitter' ? (
                      <div className="text-[11px] leading-tight text-zinc-500">
                        {isOverTwitterLimit ? (
                          <span className="text-red-400 font-semibold">
                            ⚠️ Exceeds Twitter&apos;s default 280-char hook limit. Trim lightly or use for Premium/LinkedIn.
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1 font-medium">
                            <Check className="w-3 h-3 shrink-0" /> Safe under X/Twitter&apos;s 280-character ceiling.
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] leading-tight text-zinc-500">
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <Check className="w-3 h-3" /> Perfect length for {PLATFORMS.find(p => p.id === platform)?.label || 'platform'} delivery.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Strategy Details (Psychology & Engagement Guidelines) */}
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 md:p-6 space-y-6">
                  {/* Strategy Heading */}
                  <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <h4 className="text-sm font-bold text-white">
                      Psychological Blueprint: <span className="text-purple-400 font-mono text-xs">{activeHook?.formulaName}</span>
                    </h4>
                  </div>

                  {/* Trigger Explanation */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                      Why This Hook Works (Trigger Analysis)
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 rounded-xl p-3 border border-zinc-800/40">
                      {activeHook?.psychology}
                    </p>
                  </div>

                  {/* Publishing Tips Checklist */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                      High-Engagement Publishing Tips
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeHook?.engagementTips.map((tip, idx) => (
                        <div
                          key={idx}
                          className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-xs flex items-start gap-2.5 text-zinc-400"
                        >
                          <div className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 text-[10px] font-bold border border-purple-500/20">
                            {idx + 1}
                          </div>
                          <span className="leading-normal">{tip}</span>
                        </div>
                      ))}
                    </div>
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Copy, 
  Download, 
  Check, 
  Send, 
  AlertCircle, 
  FileText, 
  Maximize2, 
  RotateCcw, 
  RefreshCw, 
  Clock, 
  BookOpen, 
  Smile, 
  Bot, 
  ChevronRight, 
  Plus
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import useLocalStoragePersistence from '../hooks/useLocalStoragePersistence';

interface AIWriterState {
  prompt: string;
  contentType: string;
  tone: string;
  referenceContext: string;
  generatedText: string;
  isGenerating: boolean;
  isRefining: boolean;
  error: string | null;
}

export default function AIWriter() {
  const { t } = useLanguage();
  
  const [state, setState, { lastSaved }] = useLocalStoragePersistence<AIWriterState>(
    'apex_ai_writer_data',
    {
      prompt: '',
      contentType: 'Blog Post',
      tone: 'Professional',
      referenceContext: '',
      generatedText: '',
      isGenerating: false,
      isRefining: false,
      error: null,
    },
    { interval: 4000 } // Autosave draft variables every 4 seconds
  );

  const [copied, setCopied] = useState(false);
  const [customRefineInstruction, setCustomRefineInstruction] = useState('');

  // Sample prompt template triggers to ease developer testing
  const templates = [
    {
      title: 'Email Request',
      prompt: 'Draft an email requesting a client review for our PDF optimizer and converter suite.',
      contentType: 'Professional Email',
      tone: 'Professional',
      context: 'Product: APEX UTILITY\nFeatures: PDF Forge (lossless compression), Media Lab (instant WebP to PNG/JPG rasterizer), JSON Core (offline structure verification).'
    },
    {
      title: 'Feature Release Post',
      prompt: 'Write an engaging release post announcing the deployment of our real-time AI Writer and editor tab.',
      contentType: 'Social Post',
      tone: 'Creative',
      context: 'Tool Name: APEX AI Writer\nTechnology: Google Gemini 3.5 Flash server-side integration.'
    },
    {
      title: 'Technical Guide',
      prompt: 'Create a short, structured markdown guide explaining optimal image formatting strategies using WebP.',
      contentType: 'Technical Article',
      tone: 'Technical',
      context: 'Details: WebP is 30% smaller than PNG/JPG. Lossless vs lossy. Multi-stage compression profiles.'
    }
  ];

  const applyTemplate = (tpl: typeof templates[0]) => {
    setState(prev => ({
      ...prev,
      prompt: tpl.prompt,
      contentType: tpl.contentType,
      tone: tpl.tone,
      referenceContext: tpl.context,
      error: null
    }));
  };

  const handleGenerate = async () => {
    if (!state.prompt.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Please input core instructions or a topic topic describe what you want the AI to write.'
      }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const response = await fetch('/api/writer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: state.prompt,
          contentType: state.contentType,
          tone: state.tone,
          referenceContext: state.referenceContext,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Content drafting pipeline failure.');
      }

      setState(prev => ({
        ...prev,
        generatedText: data.text,
        isGenerating: false,
      }));
    } catch (err: any) {
      console.error('Error in generation client boundary:', err);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: err.message || 'Server did not respond properly. Please check your system secrets configurator.'
      }));
    }
  };

  const handleRefine = async (instruction: string) => {
    if (!state.generatedText) return;
    
    setState(prev => ({ ...prev, isRefining: true, error: null }));

    try {
      const response = await fetch('/api/writer/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: state.generatedText,
          instruction,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Refinery failure.');
      }

      setState(prev => ({
        ...prev,
        generatedText: data.text,
        isRefining: false,
      }));
      setCustomRefineInstruction('');
    } catch (err: any) {
      console.error('Error in refinement:', err);
      setState(prev => ({
        ...prev,
        isRefining: false,
        error: err.message || 'Refinement operation failed. Please connect with your active server nodes.'
      }));
    }
  };

  const handleCopy = () => {
    if (!state.generatedText) return;
    navigator.clipboard.writeText(state.generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!state.generatedText) return;
    const element = document.createElement('a');
    const file = new Blob([state.generatedText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    
    // Create elegant filename with timestamps
    const cleanType = state.contentType.toLowerCase().replace(/\s+/g, '_');
    element.download = `apex_draft_${cleanType || 'doc'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleClear = () => {
    setState({
      prompt: '',
      contentType: 'Blog Post',
      tone: 'Professional',
      referenceContext: '',
      generatedText: '',
      isGenerating: false,
      isRefining: false,
      error: null,
    });
    setCustomRefineInstruction('');
  };

  // Live statistics calculations
  const textWords = state.generatedText ? state.generatedText.trim().split(/\s+/).filter(Boolean).length : 0;
  const textChars = state.generatedText ? state.generatedText.length : 0;
  const readingTime = Math.ceil(textWords / 200); // 200 words per minute average

  const seoSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": t.navigation.aiWriter || "APEX AI Writer",
    "operatingSystem": "All Web Browsers",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    },
    "description": "Premium text draft generator tool utilizing advanced Gemini 3.5 Flash server endpoint calculations to structure writings, refine tones, and summarize materials."
  };

  return (
    <div className="space-y-12">
      <script type="application/ld+json">
        {JSON.stringify(seoSchema)}
      </script>

      {/* SEO Display Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-xs font-mono font-bold uppercase transition-all duration-300">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Gemini AI Copywriting Engine Active</span>
        </div>
        <h1 className="font-heading text-3xl font-black text-white tracking-tight">
          Apex Professional AI Writer & Copywriter
        </h1>
        <p className="font-sans text-sm text-[#94a3b8] max-w-3xl leading-relaxed">
          The ultimate utility suite workspace for modern copycrafting. Instruct our sever-side engine to author brilliant content blocks, emails, or markdown posts. Paste background reference facts, switches tone profiles live, or refine outputs instantly with advanced, context-aware command prompts.
        </p>
      </div>

      {/* Main Dual Grid Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: CONTROL & CONFIGURING PANEL */}
        <div className="lg:col-span-5 space-y-6">
          <div className="beveled-panel p-5 sm:p-6 border-zinc-900/80 bg-[#08080c]/90 backdrop-blur-md relative overflow-hidden">
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand" />
                <span className="font-heading text-xs uppercase tracking-wider font-bold text-zinc-350">
                  Authoring Parameters
                </span>
              </div>
              <button 
                onClick={handleClear}
                className="font-mono text-[9px] text-zinc-500 hover:text-rose-450 uppercase tracking-widest flex items-center gap-1 transition-all"
                title="Reset all states"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Prompt input details */}
            <div className="space-y-5">
              <div>
                <label className="block font-heading text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">
                  Topic & Draft instructions
                </label>
                <textarea
                  value={state.prompt}
                  onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="e.g. Draft a professional email asking for a product preview, or outlines an educational blog post regarding PDF structure optimization..."
                  className="w-full h-28 bg-[#040406]/90 border border-zinc-900 focus:border-brand/40 hover:border-zinc-805/90 rounded-xl p-3.5 text-sm text-zinc-250 placeholder-zinc-650 font-sans focus:outline-none focus:ring-0 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Grid selectors for Mode and Tone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">
                    Content Type
                  </label>
                  <select
                    value={state.contentType}
                    onChange={(e) => setState(prev => ({ ...prev, contentType: e.target.value }))}
                    className="w-full bg-[#040406]/90 border border-zinc-900 focus:border-brand/40 rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 font-sans focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Blog Post">Blog Post</option>
                    <option value="Professional Email">Professional Email</option>
                    <option value="Technical Article">Technical Article</option>
                    <option value="Social Post">Social Post (LinkedIn/X)</option>
                    <option value="Product Proposal">Product Proposal</option>
                    <option value="Creative Story">Creative Story</option>
                  </select>
                </div>

                <div>
                  <label className="block font-heading text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">
                    Tone Profiles
                  </label>
                  <select
                    value={state.tone}
                    onChange={(e) => setState(prev => ({ ...prev, tone: e.target.value }))}
                    className="w-full bg-[#040406]/90 border border-zinc-900 focus:border-brand/40 rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 font-sans focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Professional">Professional & Clean</option>
                    <option value="Creative">Creative & Bold</option>
                    <option value="Technical">Technical & Structured</option>
                    <option value="Empathetic">Empathetic & Soft</option>
                    <option value="Casual">Casual / Direct</option>
                    <option value="Witty">Witty / Conversational</option>
                  </select>
                </div>
              </div>

              {/* OPTIONAL REFERENCE MATERIALS ACCENT */}
              <div>
                <label className="block font-heading text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2 flex items-center justify-between">
                  <span>Reference Facts & Context (Optional)</span>
                  <span className="font-mono text-[8px] text-zinc-500 tracking-normal lowercase">optional ground layer</span>
                </label>
                <textarea
                  value={state.referenceContext}
                  onChange={(e) => setState(prev => ({ ...prev, referenceContext: e.target.value }))}
                  placeholder="Paste background facts, raw details, or file notes here to base the drafted text entirely on factual references..."
                  className="w-full h-24 bg-[#040406]/90 border border-zinc-900 focus:border-brand/40 hover:border-zinc-805/90 rounded-xl p-3.5 text-xs text-zinc-300 placeholder-zinc-650 font-mono focus:outline-none focus:ring-0 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Error messages box */}
              {state.error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{state.error}</span>
                </div>
              )}

              {/* Submit trigger button */}
              <button
                onClick={handleGenerate}
                disabled={state.isGenerating}
                className={`w-full relative flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-brand/35 text-white font-heading font-black text-xs uppercase tracking-wider overflow-hidden group shadow-[0_0_15px_rgba(244,63,94,0.1)] transition-all cursor-pointer ${
                  state.isGenerating ? 'bg-zinc-950 border-zinc-900 opacity-80 cursor-not-allowed' : 'bg-gradient-to-r from-brand/90 to-brand/75 hover:from-brand hover:to-brand/85 active:scale-[0.98]'
                }`}
              >
                {state.isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-brand animate-spin" />
                    <span>Executing calculations in server...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 shadow-brand" />
                    <span>Engines On: Draft Copy</span>
                  </>
                )}
                {/* Neon subtle line */}
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-brand-border to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>

          {/* TEMPLATE QUICK TRIGGERS */}
          <div className="font-mono p-4 sm:p-5 rounded-2xl bg-[#09090c]/50 border border-zinc-950 space-y-3.5">
            <span className="block font-heading text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              Testing Sandboxes & Templates
            </span>
            <div className="space-y-2">
              {templates.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => applyTemplate(tpl)}
                  className="w-full text-left p-3 rounded-xl bg-zinc-950/60 hover:bg-[#0c0c11] border border-zinc-900/60 hover:border-brand/10 text-xs text-zinc-350 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-3 rounded-full bg-brand/40 group-hover:bg-brand" />
                    <span className="font-heading font-bold">{tpl.title}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-brand transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REFINED TEXT OUTPUT WINDOW */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="beveled-panel p-5 sm:p-6 border-zinc-900/80 bg-[#08080c]/90 backdrop-blur-md relative flex-1 flex flex-col min-h-[500px]">
            
            {/* Header of Draft Plate */}
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-900 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="font-heading text-xs uppercase tracking-wider font-bold text-zinc-350">
                  AI Draft Workbench
                </span>
                {state.generatedText && (
                  <span className="font-mono text-[8px] px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/25 rounded text-indigo-400 uppercase tracking-widest animate-pulse">
                    compliant document
                  </span>
                )}
                {lastSaved && (
                  <span className="font-mono text-[8px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded uppercase tracking-widest flex items-center gap-1.5 shrink-0 select-none">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                    AUTOSAVED {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Action utilities */}
              {state.generatedText && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-[#0d0d12] border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1 cursor-pointer font-mono text-[10px]"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-[#0d0d12] border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1 cursor-pointer font-mono text-[10px]"
                    title="Save Markdown text file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>

            {/* Workbench text area */}
            <div className="flex-1 flex flex-col relative min-h-[300px]">
              <textarea
                value={state.generatedText}
                onChange={(e) => setState(prev => ({ ...prev, generatedText: e.target.value }))}
                placeholder="Content drafted by Gemini AI appears here. Once generated, you can directly edit this text box or use the quick refinement actions below..."
                className="w-full flex-1 bg-transparent border-0 font-sans text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:ring-0 transition-all resize-none leading-relaxed min-h-[320px] p-1"
                disabled={state.isGenerating || state.isRefining}
              />

              {/* Loader transitions */}
              <AnimatePresence>
                {(state.isGenerating || state.isRefining) && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#060608]/95 flex flex-col items-center justify-center space-y-4 rounded-xl border border-zinc-900/40 z-20"
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
                      <Bot className="w-5 h-5 text-brand absolute" />
                    </div>
                    <div className="text-center space-y-1.5">
                      <p className="font-heading font-black text-xs text-white uppercase tracking-wider block">
                        {state.isGenerating ? 'Drafting content matrix...' : 'Refining target grammar...'}
                      </p>
                      <p className="font-mono text-[9px] text-zinc-550 max-w-xs uppercase leading-relaxed tracking-widest">
                        {state.isGenerating 
                          ? 'Contacting server nodes & computing raw language vectors' 
                          : 'Applying prompt filters locally across text buffers'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Metrics Footer Plate */}
            {state.generatedText && (
              <div className="mt-4 pt-3 border-t border-zinc-900/60 font-mono text-[9px] text-zinc-500 flex flex-wrap gap-x-6 gap-y-2 uppercase tracking-wide">
                <div className="flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Words: <strong className="text-zinc-300">{textWords}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Characters: <strong className="text-zinc-300">{textChars}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Est. Read Time: <strong className="text-zinc-300">{readingTime} min</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* QUICK INLINE REFINEMENTS - Visible only after content exists */}
          {state.generatedText && (
            <div className="beveled-panel p-5 border-indigo-950/20 bg-[#09090d]/65 backdrop-blur-md space-y-4">
              <div className="font-heading text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <span>Fine-Tune Document & Modify Inline</span>
              </div>

              {/* Preset instruction micro-chips */}
              <div className="flex flex-wrap gap-2.5">
                {[
                  { label: '⚡ Summarize to Bullet Points', cmd: 'Summarize into highly concise, scannable bullet points.' },
                  { label: '💼 Professional tone refinement', cmd: 'Enhance this text to be extremely polished, corporate, and formal.' },
                  { label: '✂️ Condense contents', cmd: 'Condense this text down aggressively while maintaining all core information.' },
                  { label: '💡 Generate markdown headers', cmd: 'Add clear, professional markdown headings and structure throughout the text.' },
                  { label: '🌐 Translate to Spanish', cmd: 'Translate the entire text accurately into professional business Spanish.' },
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRefine(chip.cmd)}
                    disabled={state.isRefining}
                    className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-[#121217] border border-zinc-900 hover:border-indigo-500/25 text-[10px] text-zinc-300 hover:text-white transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Custom rewrite text input bar */}
              <div className="flex gap-2 pt-2 border-t border-zinc-900/60">
                <input
                  type="text"
                  value={customRefineInstruction}
                  onChange={(e) => setCustomRefineInstruction(e.target.value)}
                  placeholder="e.g. Rewrite the section about PDF optimization to include more technical tables..."
                  className="flex-1 bg-[#040406]/90 border border-zinc-900 focus:border-indigo-400/35 rounded-xl px-3.5 py-2 text-xs text-zinc-250 placeholder-zinc-650 focus:outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customRefineInstruction.trim()) {
                      handleRefine(customRefineInstruction.trim());
                    }
                  }}
                  disabled={state.isRefining}
                />
                <button
                  onClick={() => handleRefine(customRefineInstruction.trim())}
                  disabled={state.isRefining || !customRefineInstruction.trim()}
                  className="px-3.5 py-2 rounded-xl bg-indigo-550 hover:bg-indigo-500 font-heading text-[10px] uppercase font-bold text-white tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(99,102,241,0.15)] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

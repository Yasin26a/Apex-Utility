import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  AlignLeft, Copy, Check, Download, Layers, RefreshCw, 
  Settings, Image as ImageIcon, FileText, Code, CheckCircle, 
  Sparkles, FileCode, Sliders, Type, HelpCircle, Eye, Braces
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logToolUsage } from '../utils/toolAnalytics';

// Comprehensive classical Latin source dictionary for authentic, high-fidelity randomization
const LATIN_DICTIONARY = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea",
  "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit",
  "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla",
  "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident",
  "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id",
  "est", "laborum", "at", "vero", "eos", "et", "accusamus", "et", "iusto", "odio",
  "dignissimos", "ducimus", "qui", "blanditiis", "praesentium", "voluptatum",
  "deleniti", "atque", "corrupti", "quos", "dolores", "et", "quas", "molestias",
  "excepturi", "sint", "obcaecati", "cupiditate", "non", "provident", "similique",
  "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollitia", "animi", "id",
  "est", "laborum", "et", "dolorum", "fuga", "harum", "quidem", "rerum", "facilis",
  "est", "et", "expedita", "distinctio", "nam", "libero", "tempore", "cum", "soluta",
  "nobis", "est", "eligendi", "optio", "cumque", "nihil", "impedit", "quo", "minus",
  "id", "quod", "maxime", "placeat", "facere", "possimus", "omnis", "voluptas",
  "assumenda", "est", "omnis", "dolor", "repellendus", "temporibus", "autem",
  "quibusdam", "et", "aut", "consequat", "vel", "illum", "qui", "dolorem", "eum",
  "fugiat", "quo", "voluptas", "nulla", "pariatur", "asperiores", "repellat"
];

// Presets for placeholder sizes
const SIZE_PRESETS = [
  { label: 'OG Image (Facebook, Meta, LinkedIn)', width: 1200, height: 630 },
  { label: 'HD Wallpaper / Video', width: 1920, height: 1080 },
  { label: 'Instagram Square Post', width: 1080, height: 1080 },
  { label: 'Pinterest Vertical Pin', width: 1000, height: 1500 },
  { label: 'Standard Banner (Medium Rectangle)', width: 300, height: 250 },
  { label: 'Ad Banner (Leaderboard)', width: 728, height: 90 },
  { label: 'Mobile Story / Portrait Web', width: 1080, height: 1920 },
  { label: 'Developer Avatar', width: 400, height: 400 },
];

const BG_GRADIENTS = [
  { name: 'Charcoal Slate', colorA: '#0F172A', colorB: '#1E293B' },
  { name: 'Cyberpunk Glow', colorA: '#7C3AED', colorB: '#EC4899' },
  { name: 'Ocean Depth', colorA: '#1D4ED8', colorB: '#06B6D4' },
  { name: 'Warm Amber', colorA: '#B45309', colorB: '#F59E0B' },
  { name: 'Sunset Radiance', colorA: '#BE185D', colorB: '#F43F5E' },
  { name: 'Deep Emerald', colorA: '#065F46', colorB: '#10B981' },
];

export default function LoremGenerator() {
  const { t } = useLanguage();
  
  // Tab control: 'text' or 'image'
  const [activeMode, setActiveMode] = useState<'text' | 'image'>('text');

  // TEXT MODE STATES
  const [contentType, setContentType] = useState<'paragraphs' | 'sentences' | 'words' | 'lists'>('paragraphs');
  const [count, setCount] = useState<number>(5);
  const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
  const [wrapWithHtml, setWrapWithHtml] = useState<boolean>(false);
  const [htmlTag, setHtmlTag] = useState<'p' | 'div' | 'span' | 'section' | 'li'>('p');
  const [bulletType, setBulletType] = useState<'unordered' | 'ordered'>('unordered');
  
  // Generated output string
  const [outputText, setOutputText] = useState<string>('');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [stats, setStats] = useState({ words: 0, chars: 0, bytes: 0, lines: 0 });

  // IMAGE MODE STATES
  const [width, setWidth] = useState<number>(1200);
  const [height, setHeight] = useState<number>(630);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [customText, setCustomText] = useState<string>('');
  const [fontFamily, setFontFamily] = useState<'Inter' | 'Space Grotesk' | 'JetBrains Mono' | 'Playfair Display' | 'Playbill'>('Inter');
  const [themeIndex, setThemeIndex] = useState<number>(0);
  const [customColorA, setCustomColorA] = useState<string>('#3b82f6');
  const [customColorB, setCustomColorB] = useState<string>('#8b5cf6');
  const [gradientDirection, setGradientDirection] = useState<'to right' | 'to bottom' | 'to bottom right' | 'circle'>('to bottom right');
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);
  const [copiedDataUri, setCopiedDataUri] = useState<boolean>(false);
  const [isCustomColors, setIsCustomColors] = useState<boolean>(false);

  // Trigger telemetry logging
  useEffect(() => {
    logToolUsage('lorem-generator');
  }, []);

  // Auxiliary string helpers to build deterministic pseudo-paragraphs
  const getRandomWord = () => {
    const idx = Math.floor(Math.random() * LATIN_DICTIONARY.length);
    return LATIN_DICTIONARY[idx];
  };

  const capitalize = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const generateSentenceText = (isFirst: boolean) => {
    // Sentences average between 5 and 18 words
    const len = Math.floor(Math.random() * 12) + 6;
    const sWords: string[] = [];
    
    for (let i = 0; i < len; i++) {
      sWords.push(getRandomWord());
    }

    if (isFirst && startWithLorem) {
      sWords.splice(0, 5, 'lorem', 'ipsum', 'dolor', 'sit', 'amet');
    }

    let joined = sWords.join(' ');
    
    // Random sentence punctuation (most are simple periods, some commas inside)
    if (joined.length > 35 && Math.random() > 0.5) {
      const parts = joined.split(' ');
      const commaIndex = Math.floor(parts.length / 2);
      parts[commaIndex] = parts[commaIndex] + ',';
      joined = parts.join(' ');
    }

    return capitalize(joined) + '.';
  };

  const generateParagraphText = (numSentences: number, isFirstParagraph: boolean) => {
    const sentencesArr: string[] = [];
    for (let i = 0; i < numSentences; i++) {
      sentencesArr.push(generateSentenceText(isFirstParagraph && i === 0));
    }
    return sentencesArr.join(' ');
  };

  // Re-generate Text output whenever controls modify
  const generateTextOutput = () => {
    let result = '';
    
    if (contentType === 'paragraphs') {
      const paragraphsArray: string[] = [];
      for (let i = 0; i < count; i++) {
        // Average paragraph has 4 to 8 sentences
        const pLen = Math.floor(Math.random() * 4) + 4;
        paragraphsArray.push(generateParagraphText(pLen, i === 0));
      }

      if (wrapWithHtml) {
        result = paragraphsArray
          .map(para => `<${htmlTag}>${para}</${htmlTag}>`)
          .join('\n\n');
      } else {
        result = paragraphsArray.join('\n\n');
      }

    } else if (contentType === 'sentences') {
      const sentencesArray: string[] = [];
      for (let i = 0; i < count; i++) {
        sentencesArray.push(generateSentenceText(i === 0));
      }

      if (wrapWithHtml) {
        result = sentencesArray
          .map(sentence => `<${htmlTag}>${sentence}</${htmlTag}>`)
          .join('\n');
      } else {
        result = sentencesArray.join(' ');
      }

    } else if (contentType === 'words') {
      const wordsArray: string[] = [];
      for (let i = 0; i < count; i++) {
        wordsArray.push(getRandomWord());
      }
      
      if (startWithLorem && wordsArray.length >= 5) {
        wordsArray.splice(0, 5, 'lorem', 'ipsum', 'dolor', 'sit', 'amet');
      }

      const joinedWords = wordsArray.join(' ');
      if (wrapWithHtml) {
        result = `<${htmlTag}>${joinedWords}</${htmlTag}>`;
      } else {
        result = joinedWords;
      }

    } else if (contentType === 'lists') {
      const listItems: string[] = [];
      for (let i = 0; i < count; i++) {
        // Short sentences/phrases for list items (3 to 8 words)
        const itemLen = Math.floor(Math.random() * 6) + 3;
        const phrase: string[] = [];
        for (let j = 0; j < itemLen; j++) {
          phrase.push(getRandomWord());
        }
        if (i === 0 && startWithLorem && phrase.length >= 3) {
          phrase.splice(0, 3, 'lorem', 'ipsum', 'dolor');
        }
        listItems.push(capitalize(phrase.join(' ')));
      }

      if (wrapWithHtml) {
        const outerTag = bulletType === 'ordered' ? 'ol' : 'ul';
        const innerList = listItems.map(item => `  <li>${item}</li>`).join('\n');
        result = `<${outerTag}>\n${innerList}\n</${outerTag}>`;
      } else {
        const marker = bulletType === 'ordered' ? '1.' : '•';
        result = listItems.map((item, idx) => `${bulletType === 'ordered' ? `${idx + 1}.` : '•'} ${item}`).join('\n');
      }
    }

    setOutputText(result);
  };

  // Recompute text content on control transformations
  useEffect(() => {
    if (activeMode === 'text') {
      generateTextOutput();
    }
  }, [contentType, count, startWithLorem, wrapWithHtml, htmlTag, bulletType, activeMode]);

  // Recalculate word, character, byte metrics
  useEffect(() => {
    if (!outputText) {
      setStats({ words: 0, chars: 0, bytes: 0, lines: 0 });
      return;
    }
    const chars = outputText.length;
    const words = outputText.trim().split(/\s+/).filter(Boolean).length;
    const bytes = new Blob([outputText]).size;
    const lines = outputText ? outputText.split('\n').length : 0;
    setStats({ words, chars, bytes, lines });
  }, [outputText]);

  // Retrieve current active background gradient parameters
  const activeGradient = useMemo(() => {
    if (isCustomColors) {
      return {
        gradA: customColorA,
        gradB: customColorB,
        css: `linear-gradient(${gradientDirection === 'circle' ? '135deg' : gradientDirection === 'to right' ? '90deg' : gradientDirection === 'to bottom' ? '180deg' : '135deg'}, ${customColorA}, ${customColorB})`
      };
    } else {
      const g = BG_GRADIENTS[themeIndex] || BG_GRADIENTS[0];
      return {
        gradA: g.colorA,
        gradB: g.colorB,
        css: `linear-gradient(135deg, ${g.colorA}, ${g.colorB})`
      };
    }
  }, [themeIndex, isCustomColors, customColorA, customColorB, gradientDirection]);

  // Generate complete valid SVG source code
  const generatedSvgString = useMemo(() => {
    const textToShow = customText || `${width} × ${height}`;
    const fontVal = fontFamily === 'JetBrains Mono' ? 'monospace' : 
                    fontFamily === 'Space Grotesk' ? "'Space Grotesk', sans-serif" :
                    fontFamily === 'Playfair Display' ? "Georgia, serif" :
                    fontFamily === 'Playbill' ? "Impact, sans-serif" : "Inter, system-ui, sans-serif";

    // Adaptive font-sizing formula targeting container boundaries perfectly
    const calculatedFontSize = Math.max(16, Math.min(width * 0.08, height * 0.2, 72));

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="apexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${activeGradient.gradA}" />
      <stop offset="100%" stop-color="${activeGradient.gradB}" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#apexGrad)" />
  <text 
    x="50%" 
    y="50%" 
    dominant-baseline="middle" 
    text-anchor="middle" 
    fill="#FFFFFF" 
    font-family="${fontVal}" 
    font-size="${calculatedFontSize}px" 
    font-weight="bold" 
    letter-spacing="-0.02em"
    opacity="0.95"
  >
    ${textToShow.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
  </text>
  <text 
    x="50%" 
    y="85%" 
    dominant-baseline="middle" 
    text-anchor="middle" 
    fill="#FFFFFF" 
    font-family="monospace" 
    font-size="${Math.max(10, calculatedFontSize * 0.25)}px" 
    font-weight="500" 
    opacity="0.5"
  >
    apex mock placeholder
  </text>
</svg>`;
  }, [width, height, customText, fontFamily, activeGradient]);

  // Generate Data URI to display/copy
  const generatedDataUri = useMemo(() => {
    try {
      const base64 = btoa(unescape(encodeURIComponent(generatedSvgString)));
      return `data:image/svg+xml;base64,${base64}`;
    } catch (e) {
      return '';
    }
  }, [generatedSvgString]);

  // Svg copy handlers
  const handleCopySvg = () => {
    navigator.clipboard.writeText(generatedSvgString);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  };

  const handleCopyDataUri = () => {
    navigator.clipboard.writeText(generatedDataUri);
    setCopiedDataUri(true);
    setTimeout(() => setCopiedDataUri(false), 2000);
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([generatedSvgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `placeholder-${width}x${height}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Preset quick setting
  const applyPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    const p = SIZE_PRESETS[idx];
    if (p) {
      setWidth(p.width);
      setHeight(p.height);
    }
  };

  return (
    <div id="apex-lorem-generator-root" className="flex-1 p-6 lg:p-10 w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/20 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold text-sky-400 bg-sky-950/50 border border-sky-800/30">
              OFFLINE SECURE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/30">
              MOCKUP ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlignLeft className="w-6 h-6 text-sky-400" />
            {t.navigation.loremGenerator}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t.navigation.loremGeneratorDesc}
          </p>
        </div>

        {/* Global tab Switcher */}
        <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800/60">
          <button
            onClick={() => setActiveMode('text')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeMode === 'text' 
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/15' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Lorem Ipsum Text
          </button>
          <button
            onClick={() => setActiveMode('image')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeMode === 'image' 
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/15' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Image Placeholders
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeMode === 'text' ? (
          <motion.div
            key="text-mode"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* TEXT MODE CONTROLS (Left 4 columns) */}
            <div className="lg:col-span-4 flex flex-col gap-5 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/40">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sliders className="w-4 h-4 text-sky-400" />
                <h2 className="text-xs font-mono font-semibold text-slate-300">GENERATION PARAMS</h2>
              </div>

              {/* Content type Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400 font-medium">Text Output Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setContentType('paragraphs'); setCount(Math.min(count, 30)); }}
                    className={`py-2 px-3 text-xs rounded-lg border font-semibold text-left transition-all ${
                      contentType === 'paragraphs'
                        ? 'border-sky-500/40 bg-sky-950/20 text-sky-400'
                        : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Paragraphs
                  </button>
                  <button
                    onClick={() => { setContentType('sentences'); setCount(Math.min(count, 50)); }}
                    className={`py-2 px-3 text-xs rounded-lg border font-semibold text-left transition-all ${
                      contentType === 'sentences'
                        ? 'border-sky-500/40 bg-sky-950/20 text-sky-400'
                        : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Sentences
                  </button>
                  <button
                    onClick={() => { setContentType('words'); setCount(count || 50); }}
                    className={`py-2 px-3 text-xs rounded-lg border font-semibold text-left transition-all ${
                      contentType === 'words'
                        ? 'border-sky-500/40 bg-sky-950/20 text-sky-400'
                        : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Raw Words
                  </button>
                  <button
                    onClick={() => { setContentType('lists'); setCount(Math.min(count, 20)); }}
                    className={`py-2 px-3 text-xs rounded-lg border font-semibold text-left transition-all ${
                      contentType === 'lists'
                        ? 'border-sky-500/40 bg-sky-950/20 text-sky-400'
                        : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    List Items
                  </button>
                </div>
              </div>

              {/* Dynamic slider based on selection */}
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400 font-medium">
                    {contentType === 'paragraphs' && 'Paragraph Count'}
                    {contentType === 'sentences' && 'Sentence Count'}
                    {contentType === 'words' && 'Word Count'}
                    {contentType === 'lists' && 'List Item Count'}
                  </label>
                  <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded-md">
                    {count}
                  </span>
                </div>
                <input
                  type="range"
                  min={contentType === 'paragraphs' ? 1 : contentType === 'lists' ? 2 : 5}
                  max={contentType === 'paragraphs' ? 30 : contentType === 'sentences' ? 100 : contentType === 'words' ? 1000 : 30}
                  step={1}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>{contentType === 'paragraphs' ? 1 : contentType === 'lists' ? 2 : 5}</span>
                  <span>{contentType === 'paragraphs' ? 30 : contentType === 'sentences' ? 100 : contentType === 'words' ? 1000 : 30}</span>
                </div>
              </div>

              {/* Starts with Lorem Checklist */}
              <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-300 font-semibold">Classical Intro</span>
                  <span className="text-[10px] text-slate-500">Start with classical Lorem Ipsum</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={startWithLorem}
                    onChange={(e) => setStartWithLorem(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-sky-500 peer-checked:after:bg-white"></div>
                </label>
              </div>

              {/* Wrap with HTML Checkbox and tag controls */}
              <div className="flex flex-col gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                      <Code className="w-3.5 h-3.5 text-sky-400" />
                      Wrap with HTML
                    </span>
                    <span className="text-[10px] text-slate-500">Enable tag tags wrapping</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wrapWithHtml}
                      onChange={(e) => setWrapWithHtml(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-sky-500 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                <AnimatePresence>
                  {wrapWithHtml && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex flex-col gap-2 pt-2 border-t border-slate-800 overflow-hidden"
                    >
                      <label className="text-[10px] text-slate-400 font-mono">Select Tag Name</label>
                      {contentType === 'lists' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setBulletType('unordered')}
                            className={`flex-1 py-1 text-[11px] font-mono rounded border ${
                              bulletType === 'unordered' ? 'border-sky-500 bg-sky-950/20 text-sky-400' : 'border-slate-800 text-slate-400'
                            }`}
                          >
                            &lt;ul&gt; Bulleted
                          </button>
                          <button
                            onClick={() => setBulletType('ordered')}
                            className={`flex-1 py-1 text-[11px] font-mono rounded border ${
                              bulletType === 'ordered' ? 'border-sky-500 bg-sky-950/20 text-sky-400' : 'border-slate-800 text-slate-400'
                            }`}
                          >
                            &lt;ol&gt; Numbered
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-1">
                          {(['p', 'div', 'span', 'section'] as const).map(tag => (
                            <button
                              key={tag}
                              onClick={() => setHtmlTag(tag)}
                              className={`py-1 text-[11px] font-mono rounded border ${
                                htmlTag === tag ? 'border-sky-500 bg-sky-950/20 text-sky-400' : 'border-slate-800 text-slate-400'
                              }`}
                            >
                              &lt;{tag}&gt;
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Force Regenerate Button */}
              <button
                onClick={generateTextOutput}
                className="w-full py-2.5 mt-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-slate-850 active:scale-95 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                Regenerate Randomly
              </button>
            </div>

            {/* TEXT MODE OUTPUT (Right 8 columns) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Telemetry statistics list */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-[#0b0c10]/40 p-3 rounded-xl border border-slate-800/60 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">WORDS</span>
                  <span className="text-sm font-mono font-bold text-slate-200 mt-1">{stats.words}</span>
                </div>
                <div className="bg-[#0b0c10]/40 p-3 rounded-xl border border-slate-800/60 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">CHARACTERS</span>
                  <span className="text-sm font-mono font-bold text-slate-200 mt-1">{stats.chars}</span>
                </div>
                <div className="bg-[#0b0c10]/40 p-3 rounded-xl border border-slate-800/60 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">PAYLOAD SIZES</span>
                  <span className="text-sm font-mono font-bold text-slate-200 mt-1">{stats.bytes} B</span>
                </div>
                <div className="bg-[#0b0c10]/40 p-3 rounded-xl border border-slate-800/60 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">NEW LINES</span>
                  <span className="text-sm font-mono font-bold text-slate-200 mt-1">{stats.lines}</span>
                </div>
              </div>

              {/* Content Panel */}
              <div className="flex-1 bg-[#0b0c10]/30 rounded-2xl border border-slate-800/60 overflow-hidden flex flex-col relative min-h-[400px]">
                {/* Panel action header */}
                <div className="flex justify-between items-center bg-[#090b11]/80 backdrop-blur px-5 py-3.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                    <span className="text-xs font-mono font-medium text-slate-300">GENERATED TEXT DATASTREAM</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(outputText);
                      setCopiedText(true);
                      setTimeout(() => setCopiedText(false), 2000);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      copiedText 
                        ? 'bg-emerald-950/50 border border-emerald-800/50 text-emerald-400' 
                        : 'bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied Grid!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-sky-400" />
                        Copy text
                      </>
                    )}
                  </button>
                </div>

                {/* Display Output box */}
                <div className="flex-grow p-6 h-[350px] overflow-y-auto scrollbar-thin">
                  {wrapWithHtml ? (
                    <pre className="text-xs font-mono text-slate-300 break-words whitespace-pre-wrap selection:bg-sky-800/50">
                      {outputText}
                    </pre>
                  ) : (
                    <div className="text-sm text-slate-300 leading-relaxed space-y-4 break-words font-sans select-all selection:bg-sky-800/50">
                      {contentType === 'paragraphs' ? (
                        outputText.split('\n\n').map((para, i) => (
                          <p key={i}>{para}</p>
                        ))
                      ) : contentType === 'lists' ? (
                        outputText.split('\n').map((li, i) => (
                          <p key={i} className="font-mono text-xs">{li}</p>
                        ))
                      ) : (
                        <p>{outputText}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="image-mode"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* IMAGE MODE CONTROLS (Left 4 columns) */}
            <div className="lg:col-span-4 flex flex-col gap-5 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/40">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <h2 className="text-xs font-mono font-semibold text-slate-300">DIMENSION RESOLUTION</h2>
              </div>

              {/* Common presets quick-selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400 font-medium">Dimension Presets</label>
                <select
                  value={selectedPresetIndex}
                  onChange={(e) => applyPreset(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 outline-none focus:border-sky-500"
                >
                  {SIZE_PRESETS.map((p, idx) => (
                    <option key={idx} value={idx}>
                      {p.width} × {p.height} ({p.label})
                    </option>
                  ))}
                  <option value={99}>Custom Dimensions</option>
                </select>
              </div>

              {/* Exact customized boundaries */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Width (px)</label>
                  <input
                    type="number"
                    min={10}
                    max={3000}
                    value={width}
                    onChange={(e) => {
                      setWidth(Math.max(10, Math.min(3000, Number(e.target.value))));
                      setSelectedPresetIndex(99);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs font-mono text-slate-200 outline-none focus:border-sky-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Height (px)</label>
                  <input
                    type="number"
                    min={10}
                    max={3000}
                    value={height}
                    onChange={(e) => {
                      setHeight(Math.max(10, Math.min(3000, Number(e.target.value))));
                      setSelectedPresetIndex(99);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs font-mono text-slate-200 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Custom text label overlay */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400 font-medium">Text Display Label</label>
                <input
                  type="text"
                  placeholder={`${width} × ${height}`}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 outline-none focus:border-sky-500"
                />
              </div>

              {/* Font Family Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400 font-medium">Aesthetic Typography</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Inter', 'Space Grotesk', 'JetBrains Mono', 'Playfair Display'] as const).map(font => (
                    <button
                      key={font}
                      onClick={() => setFontFamily(font)}
                      className={`py-1.5 px-2 rounded-lg text-xs border font-medium ${
                        fontFamily === font
                          ? 'border-sky-500/40 bg-sky-950/20 text-sky-400'
                          : 'border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Theme Presets */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 font-medium">Preset Color Gradients</label>
                  <button
                    onClick={() => setIsCustomColors(!isCustomColors)}
                    className="text-[10px] font-mono text-sky-400 underline hover:text-sky-300"
                  >
                    {isCustomColors ? "Back to presets" : "Hex input"}
                  </button>
                </div>

                {!isCustomColors ? (
                  <div className="grid grid-cols-3 gap-2">
                    {BG_GRADIENTS.map((bg, idx) => (
                      <button
                        key={idx}
                        onClick={() => setThemeIndex(idx)}
                        className={`p-1 rounded-lg border flex flex-col items-center gap-1.5 transition-all ${
                          themeIndex === idx && !isCustomColors
                            ? 'border-sky-500/60 bg-sky-950/20'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                        }`}
                      >
                        <div 
                          className="w-full h-5 rounded" 
                          style={{ background: `linear-gradient(135deg, ${bg.colorA}, ${bg.colorB})` }}
                        />
                        <span className="text-[9px] font-mono text-slate-400 tracking-tight block truncate w-full text-center">
                          {bg.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 p-3 bg-slate-900/30 rounded-xl border border-slate-800">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 uppercase font-mono">COLOR A</span>
                        <div className="flex gap-1.5 items-center">
                          <input 
                            type="color" 
                            className="w-6 h-6 border-0 p-0 overflow-hidden rounded bg-transparent cursor-pointer"
                            value={customColorA} 
                            onChange={(e) => setCustomColorA(e.target.value)} 
                          />
                          <input 
                            type="text" 
                            value={customColorA} 
                            onChange={(e) => setCustomColorA(e.target.value)}
                            className="w-full bg-slate-950 px-1.5 py-1 rounded text-[10px] font-mono border border-slate-800"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 uppercase font-mono">COLOR B</span>
                        <div className="flex gap-1.5 items-center">
                          <input 
                            type="color"
                            className="w-6 h-6 border-0 p-0 overflow-hidden rounded bg-transparent cursor-pointer"
                            value={customColorB} 
                            onChange={(e) => setCustomColorB(e.target.value)} 
                          />
                          <input 
                            type="text" 
                            value={customColorB} 
                            onChange={(e) => setCustomColorB(e.target.value)}
                            className="w-full bg-slate-950 px-1.5 py-1 rounded text-[10px] font-mono border border-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[9px] text-slate-500 uppercase font-mono">Direction / Type</span>
                      <select
                        value={gradientDirection}
                        onChange={(e) => setGradientDirection(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded py-1 px-2 text-[10px] text-slate-400 outline-none"
                      >
                        <option value="to right">Linear To Right</option>
                        <option value="to bottom">Linear To Bottom</option>
                        <option value="to bottom right">Linear To Diagonal</option>
                        <option value="circle">Radial Centered</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* IMAGE MODE PREVIEW (Right 8 columns) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="bg-[#0b0c10]/30 rounded-2xl border border-slate-800/60 overflow-hidden flex flex-col relative min-h-[400px]">
                {/* Preview active status title bar */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-[#090b11]/80 backdrop-blur px-5 py-3 border-b border-slate-800/80 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-mono font-medium text-slate-300">
                      LIVE PLACEHOLDER PREVIEW (Responsive aspect ratio render)
                    </span>
                  </div>

                  <button
                    onClick={handleDownloadSvg}
                    className="sm:self-auto self-start px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-sky-500/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download SVG File
                  </button>
                </div>

                {/* Display Scaled Preview container */}
                <div className="flex-grow p-6 flex flex-col items-center justify-center bg-slate-950/20 min-h-[300px]">
                  <div 
                    className="w-full max-w-lg aspect-video rounded-xl shadow-2xl relative overflow-hidden flex items-center justify-center border border-slate-800/40"
                    style={{ background: activeGradient.css }}
                  >
                    <div className="text-center p-4">
                      <span 
                        className="font-bold text-white block select-all"
                        style={{ 
                          fontFamily: fontFamily === 'Space Grotesk' ? "'Space Grotesk', sans-serif" : 
                                      fontFamily === 'JetBrains Mono' ? "monospace" : 
                                      fontFamily === 'Playfair Display' ? "Georgia, serif" : "Inter, sans-serif" ,
                          fontSize: 'clamp(1rem, 5vw, 3rem)'
                        }}
                      >
                        {customText || `${width} × ${height}`}
                      </span>
                      <span className="text-[10px] font-mono text-white/50 tracking-wider uppercase block mt-1">
                        apex graphic mockup
                      </span>
                    </div>
                  </div>
                </div>

                {/* Developer Source exports section */}
                <div className="border-t border-slate-800 p-4 bg-slate-950/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">COORDINATE ATTRIBUTES</span>
                    <span className="text-xs font-bold text-slate-300">{width}px width × {height}px height scale</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleCopySvg}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        copiedSvg 
                          ? 'bg-emerald-950/50 border border-emerald-800/50 text-emerald-400' 
                          : 'bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      {copiedSvg ? <Check className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5 text-sky-400" />}
                      {copiedSvg ? "Copied code!" : "Copy raw SVG text"}
                    </button>

                    <button
                      onClick={handleCopyDataUri}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        copiedDataUri 
                          ? 'bg-emerald-950/50 border border-emerald-800/50 text-emerald-400' 
                          : 'bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      {copiedDataUri ? <Check className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5 text-sky-400" />}
                      {copiedDataUri ? "Copied URI!" : "Copy Image Data-URI"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide/FAQ Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-slate-950/20 p-5 rounded-2xl border border-slate-800/40">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-sky-400" />
            Why use inline client SVG placeholders?
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Unlike online placeholder services that act sluggishly, generate network latency, or leak telemetry packets, APEX renders customized gradient vectors instantly on your device. These SVG strings compile effortlessly in standard browser tag models, making layout prototyping completely secure and fast.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            HTML wrapping capabilities
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            By wrapping classical and randomized generated paragraphs in code structures such as <code className="text-sky-300">&lt;p&gt;</code>, <code className="text-sky-300">&lt;div&gt;</code> or <code className="text-sky-300">&lt;li&gt;</code> markup elements, you can quickly evaluate stylesheet settings and visual hierarchies in your active code compilers immediately.
          </p>
        </div>
      </div>
    </div>
  );
}

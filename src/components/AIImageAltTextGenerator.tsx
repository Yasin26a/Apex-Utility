import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { 
  Upload, 
  Copy, 
  Check, 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  Sliders, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Info,
  ExternalLink,
  Tag,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VisualAnalysis {
  primarySubject: string;
  secondaryObjects: string[];
  detectedColors: string[];
  detectedText: string;
  settingOrContext: string;
}

interface AltTextResult {
  shortAltText: string;
  detailedAltText: string;
  keywordOptimizedAltText: string;
  suggestedFileName: string;
  recommendedKeywords: string[];
  isDecorative: boolean;
  visualAnalysis: VisualAnalysis;
  seoRecommendations: string[];
}

export default function AIImageAltTextGenerator() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [context, setContext] = useState<string>('');
  const [tone, setTone] = useState<string>('Descriptive');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AltTextResult | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Invalid file type. Please upload an image (PNG, JPEG, WebP, SVG).');
      return;
    }

    // Limit to 10MB client-side to prevent network issues
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Please upload an image under 10MB.');
      return;
    }

    setFileName(file.name);
    setMimeType(file.type);
    
    // Formatting size
    const sizeInKb = file.size / 1024;
    if (sizeInKb > 1024) {
      setFileSize(`${(sizeInKb / 1024).toFixed(2)} MB`);
    } else {
      setFileSize(`${sizeInKb.toFixed(1)} KB`);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setImage(e.target.result);
        setError(null);
        setResult(null);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file. Please try another one.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setImage(null);
    setFileName('');
    setFileSize('');
    setMimeType('');
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateAltText = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);
    setStatusMessage('Uploading and scanning image assets...');

    const stages = [
      'Deconstructing pixel elements and colors...',
      'Analyzing primary and secondary visual subjects...',
      'Extracting overlay typography and contextual semantics...',
      'Synthesizing accessibility patterns and SEO-optimized alt targets...',
      'Finalizing WCAG 2.2 and metadata auditing compliance...'
    ];

    let stageIdx = 0;
    const interval = setInterval(() => {
      if (stageIdx < stages.length) {
        setStatusMessage(stages[stageIdx]);
        stageIdx++;
      }
    }, 1500);

    try {
      const response = await fetch('/api/alt-text-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
          mimeType,
          keyword: keyword.trim(),
          context: context.trim(),
          tone
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
      setError(err.message || 'Failed to analyze the image. Please verify your internet connection or Gemini API key configuration.');
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

  return (
    <div id="ai-alt-text-generator" className="max-w-6xl mx-auto px-4 py-8">
      {/* Header section with clean display typography */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Gemini 3.5 Flash Multimodal AI
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          AI Image Alt-Text Generator
        </h1>
        <p className="mt-2 text-md text-slate-600 max-w-2xl mx-auto">
          Audit your visual media on-the-fly. Upload any image to instantly generate descriptive, search-engine optimized (SEO) alternative text attributes, custom semantic filenames, and accessibility compliance diagnostics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload & Parameters Configuration */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Upload Canvas */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-slate-500" />
              Upload Image Asset
            </h2>

            {!image ? (
              <div
                id="image-dropzone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleTriggerUpload}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' 
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
                }`}
              >
                <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 mb-4">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-800">
                  Drag and drop your image here, or <span className="text-indigo-600 hover:underline">browse files</span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Supports PNG, JPEG, WebP, SVG up to 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2 max-h-[320px]">
                  <img
                    src={image}
                    alt="Source upload preview"
                    className="max-h-[300px] w-auto h-auto object-contain rounded-lg shadow-sm"
                  />
                  <button
                    onClick={handleClear}
                    disabled={loading}
                    className="absolute top-4 right-4 bg-slate-900/85 hover:bg-red-600 text-white rounded-full p-2 shadow transition-all duration-200 disabled:opacity-50"
                    title="Remove Image"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="truncate max-w-[180px]">
                    <span className="font-semibold text-slate-700">File:</span> {fileName}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Size:</span> {fileSize}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SEO & Accessibility Optimization Parameters */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-slate-500" />
              SEO & Context Settings
            </h2>

            <div className="space-y-4">
              {/* Target SEO Keyword */}
              <div>
                <label htmlFor="target-keyword" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Keyword (Optional)
                </label>
                <input
                  id="target-keyword"
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. ergonomic office chair, vegan pizza recipe"
                  className="w-full rounded-lg border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border bg-slate-50 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Integrates your core marketing keyword naturally into an SEO-optimized alt description fallback.
                </p>
              </div>

              {/* Placement Context */}
              <div>
                <label htmlFor="placement-context" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Placement / Page Context (Optional)
                </label>
                <input
                  id="placement-context"
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. Hero section of furniture store, product detail gallery"
                  className="w-full rounded-lg border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border bg-slate-50 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Tells the AI where on the webpage the image resides to customize contextual descriptions.
                </p>
              </div>

              {/* Description Style/Tone */}
              <div>
                <label htmlFor="description-style" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description Style & Tone
                </label>
                <select
                  id="description-style"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-lg border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border bg-slate-50 focus:bg-white"
                >
                  <option value="Descriptive">Descriptive (Standard accessibility alt, balanced details)</option>
                  <option value="Minimal">Minimal (Ultra-clean, high-density screen-reader summaries)</option>
                  <option value="Technical">Technical (Detailed cataloging of parts, materials, parameters)</option>
                  <option value="Sales-oriented">Sales-Oriented (Focused on appealing visual assets, value pointers)</option>
                  <option value="Creative">Creative / Editorial (Atmospheric, emotional tone descriptions)</option>
                </select>
              </div>

              {/* Primary CTA Trigger */}
              <button
                id="generate-btn"
                disabled={!image || loading}
                onClick={generateAltText}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate SEO Alt-Text
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Loading Screen / Error Banner / Results Deck */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {/* 1. Empty State */}
            {!image && !loading && !result && (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]"
              >
                <div className="p-4 bg-slate-100 rounded-full text-slate-400 mb-4">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <h3 className="text-md font-semibold text-slate-800">No Image Uploaded</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                  Please upload an image asset using the box on the left, then trigger analysis to preview and generate compliance attributes.
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
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[400px]"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <Sparkles className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Analyzing Visual Semantics</h3>
                <p className="text-sm text-slate-600 max-w-md h-12 flex items-center justify-center">
                  {statusMessage}
                </p>
                <div className="w-64 bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full animate-[loading-bar_8s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                </div>
              </motion.div>
            )}

            {/* 3. Error State */}
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
                    <h3 className="text-sm font-semibold text-red-800">Generation Failed</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    <button
                      onClick={generateAltText}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-800 hover:text-red-900 underline"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Try Again
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. Complete Audit Results */}
            {result && !loading && !error && (
              <motion.div
                key="results-deck"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Visual Category Compliance Note */}
                {result.isDecorative && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-start gap-2">
                    <Info className="w-4.5 h-4.5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold">Accessibility Notice:</span> This image has been flags as potentially <span className="underline">Decorative Only</span> (e.g., abstract shapes, spacing graphic, generic layout component). Standard WCAG guidelines recommend setting a blank alt tag (<code className="bg-amber-100 px-1 rounded">alt=""</code>) to allow screen readers to skip it without friction.
                    </div>
                  </div>
                )}

                {/* Primary Generated Alt Text Cards */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      Generated Alt-Text Options
                    </h3>
                    <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full">
                      Audit Clean
                    </span>
                  </div>

                  {/* 1. Short Accessibility Alt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        Short & Screen-Reader Optimized
                        <span className="text-[10px] text-slate-500 font-normal lowercase">(&lt;125 chars)</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(result.shortAltText, 'short')}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                      >
                        {copiedField === 'short' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-green-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-800 font-medium">
                      {result.shortAltText}
                    </div>
                  </div>

                  {/* 2. Detailed Semantic Alt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        Detailed / Descriptive Alt
                        <span className="text-[10px] text-slate-500 font-normal lowercase">(For complex visuals)</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(result.detailedAltText, 'detailed')}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                      >
                        {copiedField === 'detailed' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-green-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-800">
                      {result.detailedAltText}
                    </div>
                  </div>

                  {/* 3. Keyword-Optimized Alt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        Keyword & SEO Targeted Alt
                        {keyword && <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-normal">Keyword: {keyword}</span>}
                      </span>
                      <button
                        onClick={() => copyToClipboard(result.keywordOptimizedAltText, 'seo')}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                      >
                        {copiedField === 'seo' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-green-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-800 italic">
                      {result.keywordOptimizedAltText}
                    </div>
                  </div>
                </div>

                {/* File Name & LSI Keywords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recommended Filename */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      SEO-Optimized Filename
                    </span>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-mono text-slate-800 break-all select-all flex items-center justify-between gap-2">
                      <span className="truncate">{result.suggestedFileName}</span>
                      <button
                        onClick={() => copyToClipboard(result.suggestedFileName, 'filename')}
                        className="text-indigo-600 hover:text-indigo-800 p-1"
                        title="Copy Filename"
                      >
                        {copiedField === 'filename' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Standardized clean naming format helps search spiders crawl and index product visuals organically.
                    </p>
                  </div>

                  {/* LSI/Semantic tags */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Semantic Keyterms (LSI)
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                      {result.recommendedKeywords.map((kw, idx) => (
                        <button
                          key={idx}
                          onClick={() => copyToClipboard(kw, `kw-${idx}`)}
                          className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors border border-slate-150"
                          title="Click to copy keyword"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-500" />
                          <span>{kw}</span>
                          {copiedField === `kw-${idx}` && <Check className="w-2.5 h-2.5 text-green-600" />}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Top latent semantic terms identified within the visual space. Recommended for on-page text.
                    </p>
                  </div>
                </div>

                {/* Live HTML Integration Preview Block */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Code className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                        Production Image HTML Code
                      </h3>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`<img src="${result.suggestedFileName}" alt="${result.shortAltText}" loading="lazy" />`, 'html-code')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      {copiedField === 'html-code' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400">Copied Snippet</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy HTML</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="font-mono text-xs overflow-x-auto bg-slate-950 p-4 rounded-xl border border-slate-850 whitespace-pre-wrap select-all leading-relaxed text-indigo-300">
                    {`<!-- Optimized Image Insertion -->
<img 
  src="${result.suggestedFileName}" 
  alt="${result.shortAltText}" 
  loading="lazy" 
  width="auto" 
  height="auto" 
/>`}
                  </div>
                </div>

                {/* Interactive Visual Analysis Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 className="text-md font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Eye className="w-5 h-5 text-indigo-600" />
                    Deep Visual Analysis Breakdown
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Primary Subject</span>
                        <p className="font-medium text-slate-800 mt-0.5">{result.visualAnalysis.primarySubject}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Secondary Objects</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.visualAnalysis.secondaryObjects.map((obj, i) => (
                            <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              {obj}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Setting / Background</span>
                        <p className="text-slate-800 mt-0.5">{result.visualAnalysis.settingOrContext}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Detected Color Palette</span>
                        <div className="flex items-center gap-2 mt-1">
                          {result.visualAnalysis.detectedColors.map((color, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-xs font-medium text-slate-700">
                              <span 
                                className="w-2.5 h-2.5 rounded-full border border-slate-300 inline-block shadow-sm"
                                style={{ backgroundColor: color.toLowerCase() }}
                              />
                              <span>{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Overlay Typography Detected</span>
                        <p className="text-slate-800 mt-0.5 font-medium italic">
                          {result.visualAnalysis.detectedText || 'No overlaid copy or text detected in image.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEO and WCAG Compliance Checklist Recommendations */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 className="text-md font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                    SEO & WCAG Accessibility Compliance Checklist
                  </h3>

                  <ul className="space-y-3">
                    {result.seoRecommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                    <li className="flex items-start gap-3 text-sm text-slate-700">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span>Make sure to serve responsive layouts using <code className="bg-slate-100 px-1 rounded text-xs font-mono">srcset</code> parameters where appropriate.</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

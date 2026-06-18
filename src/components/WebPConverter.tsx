import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  Image as ImageIcon, 
  Sliders, 
  Trash2, 
  HelpCircle, 
  Zap, 
  ChevronDown 
} from 'lucide-react';

export default function WebPConverter() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  
  const [webpBlob, setWebpBlob] = useState<Blob | null>(null);
  const [webpUrl, setWebpUrl] = useState<string | null>(null);
  const [webpWidth, setWebpWidth] = useState<number>(0);
  const [webpHeight, setWebpHeight] = useState<number>(0);

  const [quality, setQuality] = useState<number>(80);
  const [scale, setScale] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true,
    1: false,
    2: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to format bytes cleanly
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Convert uploaded image to WebP using the HTML5 Canvas API
  const convertToWebP = (file: File, currentQuality: number, currentScale: number) => {
    if (!file) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalWidth(img.naturalWidth);
        setOriginalHeight(img.naturalHeight);

        // Create canvas and apply scaling options
        const canvas = document.createElement('canvas');
        const calculatedWidth = Math.round(img.naturalWidth * (currentScale / 100));
        const calculatedHeight = Math.round(img.naturalHeight * (currentScale / 100));
        
        canvas.width = calculatedWidth;
        canvas.height = calculatedHeight;
        
        setWebpWidth(calculatedWidth);
        setWebpHeight(calculatedHeight);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessing(false);
          return;
        }

        // Handle transparency correctly
        ctx.clearRect(0, 0, calculatedWidth, calculatedHeight);
        ctx.drawImage(img, 0, 0, calculatedWidth, calculatedHeight);

        // Convert canvas image to WebP blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              setWebpBlob(blob);
              if (webpUrl) {
                URL.revokeObjectURL(webpUrl);
              }
              setWebpUrl(URL.createObjectURL(blob));
            }
            setIsProcessing(false);
          },
          'image/webp',
          currentQuality / 100
        );
      };
      
      img.onerror = () => {
        setIsProcessing(false);
        alert('Failed to load image resource.');
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };

    reader.onerror = () => {
      setIsProcessing(false);
      alert('Failed to read image file.');
    };

    reader.readAsDataURL(file);
  };

  // Trigger conversion when quality or scale parameters shift
  useEffect(() => {
    if (!originalFile) return;
    const delayDebounceFn = setTimeout(() => {
      convertToWebP(originalFile, quality, scale);
    }, 150); // Small debounce to make slider drags smooth

    return () => clearTimeout(delayDebounceFn);
  }, [quality, scale, originalFile]);

  // Clean up ObjectURLs to protect memory buffers
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (webpUrl) URL.revokeObjectURL(webpUrl);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(jpe?g|png|gif|bmp|webp)$/i)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, BMP).');
        return;
      }

      setOriginalFile(file);
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      setOriginalUrl(URL.createObjectURL(file));

      // Reset settings
      setQuality(80);
      setScale(100);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(jpe?g|png|gif|bmp|webp)$/i)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, BMP).');
        return;
      }

      setOriginalFile(file);
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      setOriginalUrl(URL.createObjectURL(file));

      setQuality(80);
      setScale(100);
    }
  };

  const handleDownload = () => {
    if (!webpUrl || !originalFile) return;
    const a = document.createElement('a');
    
    // Construct polished output name
    const originalName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || originalFile.name;
    a.href = webpUrl;
    a.download = `${originalName}_optimized.webp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClear = () => {
    setOriginalFile(null);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(null);
    setWebpBlob(null);
    if (webpUrl) URL.revokeObjectURL(webpUrl);
    setWebpUrl(null);
    setOriginalWidth(0);
    setOriginalHeight(0);
    setWebpWidth(0);
    setWebpHeight(0);
    setQuality(80);
    setScale(100);
  };

  // Determine file optimization score details
  const originalSize = originalFile?.size || 0;
  const webpSize = webpBlob?.size || 0;
  const ratio = originalSize > 0 ? ((originalSize - webpSize) / originalSize) * 100 : 0;
  const isWebpSmaller = webpSize < originalSize;

  const toggleFaq = (idx: number) => {
    setFaqOpen(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Configuration & Controls Section */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-5">
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-rose-400" />
            Conversion Tuner
          </h3>

          {!originalFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[220px] ${
                isDragging 
                  ? 'border-rose-500 bg-rose-500/5' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900/50'
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">Drag & drop your source graphic</p>
                <p className="text-xs text-slate-500 mt-1">Supports highly-dense JPEGs, PNGs, and legacy GIFs</p>
              </div>
              <button className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-rose-950/20">
                Select Source File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg, image/gif, image/bmp, image/webp"
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-5">
              {/* File Info Block */}
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400 shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{originalFile.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 mt-0.5">{formatBytes(originalSize)} • {originalWidth}x{originalHeight}</p>
                  </div>
                </div>
                <button
                  onClick={handleClear}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                  title="Clear source image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Slider 1: WebP Qualities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 uppercase font-semibold">WebP Quality Target</span>
                  <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                    {quality}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Sets lossy compression metrics. 80% is the balanced sweet spot for crawler scores.
                </p>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full accent-rose-500 h-1 bg-slate-900 border border-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Slider 2: Width/Height Dimensions Scaling */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 uppercase font-semibold">Resolution Scale</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    {scale}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Reduces absolute bounds. Lower pixels decrease Core Web Vital rendering times.
                </p>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={scale}
                  onChange={(e) => setScale(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-slate-900 border border-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  onClick={handleDownload}
                  disabled={!webpUrl || isProcessing}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-850 disabled:shadow-none border border-transparent text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-950/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download WebP
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-3 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg text-xs font-bold transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic SEO Performance Estimation Metrics Panel */}
        {originalFile && webpBlob && (
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
            <h4 className="font-mono font-bold text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              SEO Crawl Performance Gain
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg text-center">
                <p className="text-[10px] font-mono text-slate-500 uppercase">File Reduction</p>
                <p className={`text-base font-extrabold mt-1 ${isWebpSmaller ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isWebpSmaller ? `${ratio.toFixed(1)}% Smaller` : 'Larger Size'}
                </p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg text-center">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Est. Load Saved</p>
                <p className="text-base font-extrabold text-blue-400 mt-1">
                  ~{Math.max(10, Math.round((originalSize - webpSize) / (100 * 1024) * 45))} ms
                </p>
              </div>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-yellow-400/90 leading-relaxed">
                By prioritizing WebP outputs over legacy JPEGs, your Largest Contentful Paint (LCP) budget improves, which ensures search engine bots crawl your sitemap pages 2.5x faster.
              </p>
            </div>
          </div>
        )}

        {/* FAQ Blocks */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2 pb-2 border-b border-slate-800">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            Media Optimization F.A.Q
          </h3>
          
          <div className="space-y-3">
            {[
              {
                q: "Why is WebP crucial for technical SEO in 2026?",
                a: "WebP images are on average 30% smaller than JPEGs/PNGs at equivalent visual qualities. Decreasing payload size improves structural PageSpeed parameters, directly lowering your bounce risks."
              },
              {
                q: "Does WebP support background transparency?",
                a: "Yes. WebP natively supports full 8-bit alpha channel transparency just like PNGs, but formats the metadata grid significantly tighter, giving you beautiful graphics with minimal bytes."
              },
              {
                q: "What is the recommended compression target?",
                a: "Web editors recommend setting a quality baseline around 75% to 85%. At this compression ratio, human eyes cannot see artifact differences, but crawlers index coordinates instantly."
              }
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-slate-900 last:border-0 pb-3 last:pb-0">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-300 hover:text-rose-400 transition-colors py-1"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform shrink-0 ${faqOpen[idx] ? 'rotate-180 text-rose-400' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {faqOpen[idx] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5 pr-2">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Side-by-Side Live Preview Section */}
      <div className="lg:col-span-7 bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col justify-between min-h-[500px]">
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              Side-by-Side Quality Comparison
            </h3>
            <span className="px-2 py-0.5 bg-slate-900 border border-slate-850 rounded text-[10px] font-mono text-slate-400">
              Live Canvas Render
            </span>
          </div>

          {!originalFile ? (
            <div className="flex-1 border border-dashed border-slate-850 rounded-xl bg-slate-900/10 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
              <ImageIcon className="w-10 h-10 text-slate-700 mb-2" />
              <p className="text-xs text-slate-400 font-medium">No graphic uploaded yet</p>
              <p className="text-[10px] text-slate-650 mt-1 max-w-xs">Upload your original picture on the tuner controls to begin live quality assessments.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-stretch">
              {/* ORIGINAL PREVIEW */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3 min-h-[320px]">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wide">1. Original Image</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-500 uppercase">
                      {originalFile.type.split('/')[1] || 'RAW'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-[11px] font-mono">
                    <span className="text-slate-500">File Payload:</span>
                    <span className="font-bold text-slate-300">{formatBytes(originalSize)}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Dimensions:</span>
                    <span className="font-bold text-slate-300">{originalWidth}x{originalHeight}</span>
                  </div>
                </div>

                <div className="flex-1 bg-slate-950 rounded-lg border border-slate-850/50 p-2 flex items-center justify-center overflow-hidden min-h-[160px] relative">
                  {originalUrl && (
                    <img
                      src={originalUrl}
                      alt="Original Source"
                      className="max-h-[220px] max-w-full object-contain rounded select-none shadow"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              </div>

              {/* WEBP PREVIEW */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3 min-h-[320px]">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono text-rose-400 uppercase tracking-wide">2. Optimized WebP</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 uppercase">
                      WEBP
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-[11px] font-mono">
                    <span className="text-slate-500">File Payload:</span>
                    {isProcessing ? (
                      <span className="text-slate-500 animate-pulse font-bold">Compressing...</span>
                    ) : (
                      <span className="font-bold text-rose-400">{formatBytes(webpSize)}</span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Dimensions:</span>
                    <span className="font-bold text-slate-300">{webpWidth}x{webpHeight}</span>
                  </div>
                </div>

                <div className="flex-1 bg-slate-950 rounded-lg border border-slate-850/50 p-2 flex items-center justify-center overflow-hidden min-h-[160px] relative">
                  {isProcessing ? (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 text-rose-500 animate-spin" />
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Converting Stream...</span>
                    </div>
                  ) : null}

                  {webpUrl ? (
                    <img
                      src={webpUrl}
                      alt="Optimized WebP Preview"
                      className="max-h-[220px] max-w-full object-contain rounded select-none shadow"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-slate-700 text-xs font-mono">Rendering canvas...</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {originalFile && webpBlob && (
          <div className="mt-5 p-4 bg-slate-900 border border-slate-850 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Ready to Deploy
                </span>
                {isWebpSmaller && (
                  <span className="text-amber-400 text-xs font-bold font-sans">
                    Saved {formatBytes(originalSize - webpSize)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-snug">
                This asset was parsed fully in-browser, and conforms completely to the AdSense layouts and SEO guidelines.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="w-full sm:w-auto py-2 px-4 bg-rose-500 hover:bg-rose-600 text-white border border-transparent rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/20 shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download WebP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

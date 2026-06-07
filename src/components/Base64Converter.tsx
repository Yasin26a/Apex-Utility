import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Binary, 
  ArrowRightLeft, 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  RefreshCw, 
  ExternalLink, 
  AlertCircle, 
  Code,
  Sparkles,
  Info
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Helper to safely format file sizes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// UTF-8 Safe Base64 Encoding
function encodeUtf8Base64(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  } catch (e) {
    return btoa(str);
  }
}

// UTF-8 Safe Base64 Decoding
function decodeUtf8Base64(str: string): string {
  try {
    // Strip headers/whitespace if any
    let cleaned = str.trim().replace(/\s/g, '');
    // If it's a data-URI, strip the prefix
    if (cleaned.includes(';base64,')) {
      cleaned = cleaned.split(';base64,')[1];
    }
    return decodeURIComponent(atob(cleaned).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    return atob(str.trim().replace(/\s/g, ''));
  }
}

export default function Base64Converter() {
  const { t, language } = useLanguage();

  // Mode: 'text' or 'file'
  const [activeMode, setActiveMode] = useState<'text' | 'file'>('text');
  
  // Text Conversion State
  const [textDirection, setTextDirection] = useState<'encode' | 'decode'>('encode');
  const [inputText, setInputText] = useState<string>(
    '{"appName": "Apex Suite", "craftedBy": "Google AI Studio", "isPremium": true, "emojiSupport": "🚀🌟🔥"}'
  );
  const [outputText, setOutputText] = useState<string>('');
  const [textError, setTextError] = useState<string | null>(null);

  // File/Image Conversion State
  const [fileState, setFileState] = useState<{
    file: File | null;
    fileName: string;
    fileSize: number;
    fileType: string;
    base64Data: string; // Dynamic Raw base64 string
    dataUri: string; // Full data URI string
    imageWidth?: number;
    imageHeight?: number;
    previewUrl?: string;
  } | null>(null);
  
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UX Feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Trigger conversion dynamically
  const triggerTextConversion = (value: string, direction: 'encode' | 'decode') => {
    setInputText(value);
    setTextError(null);
    if (!value.trim()) {
      setOutputText('');
      return;
    }
    try {
      if (direction === 'encode') {
        const encoded = encodeUtf8Base64(value);
        setOutputText(encoded);
      } else {
        const decoded = decodeUtf8Base64(value);
        setOutputText(decoded);
      }
    } catch (err: any) {
      setOutputText('');
      setTextError(err.message || 'Invalid Base64 sequence for decoding.');
    }
  };

  // Convert on text change
  React.useEffect(() => {
    triggerTextConversion(inputText, textDirection);
  }, [inputText, textDirection]);

  // Copy helper
  const copyToClipboard = (textToCopy: string, id: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Read file and parse Base64
  const processUploadedFile = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fullDataUri = event.target?.result as string;
      const base64Part = fullDataUri.split(',')[1] || '';

      const isImage = file.type.startsWith('image/');
      
      if (isImage) {
        // Find dimensions
        const img = new Image();
        img.onload = () => {
          setFileState({
            file,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            base64Data: base64Part,
            dataUri: fullDataUri,
            imageWidth: img.width,
            imageHeight: img.height,
            previewUrl: URL.createObjectURL(file)
          });
        };
        img.src = URL.createObjectURL(file);
      } else {
        setFileState({
          file,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          base64Data: base64Part,
          dataUri: fullDataUri
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Generate dev codes snippets for designers
  const developerTemplates = useMemo(() => {
    if (!fileState) return null;
    const type = fileState.fileType || 'image/png';
    const uri = fileState.dataUri;
    const raw = fileState.base64Data;

    return {
      raw,
      dataUri: uri,
      htmlTag: `<img src="${uri}" alt="${fileState.fileName}" />`,
      cssBackground: `.element-asset {\n  background-image: url("${uri}");\n  background-size: cover;\n}`,
      reactInline: `<img\n  src="${uri}"\n  alt="${fileState.fileName}"\n/>`
    };
  }, [fileState]);

  // Text direction toggler
  const toggleDirection = () => {
    const nextDirection = textDirection === 'encode' ? 'decode' : 'encode';
    setTextDirection(nextDirection);
    // Swap inputs and outputs to keep conversion interactive
    if (outputText && !textError) {
      setInputText(outputText);
      setOutputText(inputText);
    }
  };

  // Download utilities
  const downloadTextOutput = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = textDirection === 'encode' ? 'encoded-base64.txt' : 'decoded-text.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadFileFromBase64 = () => {
    if (!fileState) return;
    const link = document.createElement('a');
    link.href = fileState.dataUri;
    link.download = `exported_${fileState.fileName}`;
    link.click();
  };

  return (
    <div id="base64-converter-dashboard" className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-brand-border/30">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 shadow-lg shadow-cyan-500/5">
              <Binary className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-cyan-400 tracking-widest block uppercase">Apex Utilities Studio</span>
              <h1 className="text-3xl font-sans font-medium tracking-tight text-white mb-1">{t.navigation.base64Converter}</h1>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2 max-w-xl">
            {t.navigation.base64ConverterDesc}
          </p>
        </div>
        
        {/* Toggle Mode Control Bar */}
        <div className="flex p-1 bg-brand-surface border border-brand-border/40 rounded-xl">
          <button 
            id="tab-mode-text"
            onClick={() => setActiveMode('text')}
            className={`px-4 py-2 text-xs font-mono tracking-wider rounded-lg uppercase transition-all duration-150 ${
              activeMode === 'text' 
                ? 'bg-[#12131a] text-white border border-brand-border/30 shadow' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {(() => {
              const labels: Record<string, string> = {
                en: 'Text Conversion',
                es: 'Conversión de Texto',
                fr: 'Conversion de Texte',
                de: 'Textkonvertierung',
                pt: 'Conversão de Texto'
              };
              return labels[language] || labels.en;
            })()}
          </button>
          <button 
            id="tab-mode-file"
            onClick={() => setActiveMode('file')}
            className={`px-4 py-2 text-xs font-mono tracking-wider rounded-lg uppercase transition-all duration-150 ${
              activeMode === 'file' 
                ? 'bg-[#12131a] text-white border border-brand-border/30 shadow' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {(() => {
              const labels: Record<string, string> = {
                en: 'File Binary Conversion',
                es: 'Conversión Binaria de Archivo',
                fr: 'Conversion Binaire',
                de: 'Datei-Binär-Konvertierung',
                pt: 'Conversão Binária de Arquivo'
              };
              return labels[language] || labels.en;
            })()}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <AnimatePresence mode="wait">
        
        {/* TEXT CONVERSION MODE */}
        {activeMode === 'text' && (
          <motion.div 
            key="text-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Left box: Input Panel (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-2xl">
                
                {/* Control inputs */}
                <div className="flex justify-between items-center pb-2 border-b border-brand-border/20">
                  <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">
                    Source Text ({textDirection === 'encode' ? 'ASCII / UTF-8' : 'Base64'})
                  </span>
                  
                  <button 
                    id="btn-toggle-direction"
                    onClick={toggleDirection}
                    className="flex items-center gap-1.5 px-3 py-1 bg-brand-surface hover:bg-brand-surface/80 border border-brand-border/40 rounded-lg text-xs font-mono text-cyan-400 hover:text-white transition"
                    title="Swap encoding and decoding fields"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    {textDirection === 'encode' ? 'Encode to Base64' : 'Decode to Text'}
                  </button>
                </div>

                <div className="relative">
                  <label htmlFor="tx-base64-text-input" className="sr-only">Base64 Text Input</label>
                  <textarea 
                    id="tx-base64-text-input"
                    value={inputText}
                    onChange={(e) => triggerTextConversion(e.target.value, textDirection)}
                    placeholder={
                      textDirection === 'encode' 
                        ? 'Type or paste Unicode text here for immediate Base64 conversion...' 
                        : 'Paste raw Base64 string (or Data URL) to decode back to string...'
                    }
                    className="w-full bg-[#0a0b0e] border border-brand-border/50 focus:border-cyan-500/50 rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 font-mono resize-none h-[400px] leading-relaxed"
                  />
                  
                  {/* Clean up input */}
                  {inputText && (
                    <button 
                      onClick={() => setInputText('')}
                      className="absolute right-3 top-3 p-2 bg-brand-surface/80 border border-brand-border/40 rounded-lg text-gray-400 hover:text-rose-400 transition"
                      title="Clear textarea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {textError && (
                  <div className="p-3 bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2 font-mono">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{textError}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-xs font-mono text-gray-500">
                  <span>Characters: {inputText.length}</span>
                  <span className="text-cyan-500/80">Support Multi-byte Character Encoding Enabled</span>
                </div>
              </div>
            </div>

            {/* Right box: Output Panel (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-2xl">
                
                {/* Control outputs */}
                <div className="flex justify-between items-center pb-2 border-b border-brand-border/20">
                  <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">
                    Output Results ({textDirection === 'encode' ? 'Base64' : 'Decoded Text'})
                  </span>

                  <div className="flex gap-2">
                    <button 
                      id="btn-copy-text-out"
                      onClick={() => copyToClipboard(outputText, 'textOutput')}
                      disabled={!outputText}
                      className="flex items-center gap-1.5 px-3 py-1 border border-brand-border/40 hover:border-cyan-500/30 bg-brand-surface hover:bg-brand-surface/80 rounded-lg text-xs font-mono text-gray-400 hover:text-white disabled:opacity-40 transition"
                    >
                      {copiedId === 'textOutput' ? (
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
                      onClick={downloadTextOutput}
                      disabled={!outputText}
                      className="flex items-center gap-1.5 px-3 py-1 border border-brand-border/40 hover:border-cyan-500/30 bg-brand-surface hover:bg-brand-surface/80 rounded-lg text-xs font-mono text-gray-400 hover:text-white disabled:opacity-40 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label htmlFor="tx-base64-text-output" className="sr-only">Base64 Text Output</label>
                  <textarea 
                    id="tx-base64-text-output"
                    value={outputText}
                    readOnly
                    placeholder="Resulting sequence output..."
                    className="w-full bg-[#08090d] border border-brand-border/40 rounded-xl p-4 text-sm text-gray-300 focus:outline-none font-mono resize-none h-[400px] leading-relaxed select-all"
                  />
                  
                  {/* Info overlay inside placeholder */}
                  {!outputText && (
                    <div className="absolute inset-x-4 top-1/3 text-center space-y-2 pointer-events-none">
                      <Binary className="w-8 h-8 text-cyan-500/20 mx-auto" />
                      <p className="text-xs text-gray-500 font-mono">Input parameters to render sequence strings.</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs font-mono text-gray-500">
                  <span>Characters: {outputText.length}</span>
                  <span>Safety: UTF-8 standard lossless</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* BINARY FILE/IMAGE TO BASE64 MODE */}
        {activeMode === 'file' && (
          <motion.div 
            key="file-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Left box: File uploader or active preview (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {!fileState ? (
                /* Drag and drop state */
                <div 
                  id="drag-base64"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all min-h-[380px] flex flex-col justify-center items-center gap-4 ${
                    dragActive 
                      ? 'border-cyan-500 bg-cyan-500/[0.04]' 
                      : 'border-brand-border/40 bg-brand-surface/10 hover:border-brand-border hover:bg-brand-surface/20'
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,text/*,application/json,application/pdf,application/xml"
                  />
                  
                  <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 rounded-full shadow-lg shadow-cyan-500/5">
                    <Upload className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-1 max-w-sm">
                    <p className="text-sm text-white font-medium">Drag & drop files or click to upload</p>
                    <p className="text-xs text-gray-400 leading-normal">
                      Convert any Image (PNG, JPG, SVG, WebP, GIF), XML, JSON, or TXT file directly into high-fidelity compilation Base64 strings.
                    </p>
                  </div>
                  
                  <span className="text-[10px] font-mono uppercase bg-[#181a21]/50 border border-brand-border/40 text-gray-500 rounded px-2.5 py-1">
                    Up to 15MB file sizes supported
                  </span>
                </div>
              ) : (
                /* File active metadata cards block */
                <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-2xl relative">
                  
                  <div className="flex justify-between items-center pb-2 border-b border-brand-border/20">
                    <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">Loaded Resource</span>
                    <button 
                      id="btn-remove-file"
                      onClick={() => setFileState(null)}
                      className="p-1.5 border border-brand-border hover:border-rose-500/40 bg-[#12131a] text-gray-400 hover:text-rose-450 rounded-xl transition"
                      title="Remove loaded asset"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400 hover:text-rose-500" />
                    </button>
                  </div>

                  {/* Asset thumbnail presentation */}
                  {fileState.previewUrl ? (
                    <div className="mx-auto rounded-xl border border-brand-border/30 overflow-hidden relative group aspect-video bg-[#07080b] flex items-center justify-center p-3 select-none">
                      <img 
                        src={fileState.previewUrl} 
                        alt="Preview" 
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-cyan-400">
                        {fileState.imageWidth} × {fileState.imageHeight} px
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-brand-border/20 bg-brand-surface/40 aspect-video flex flex-col items-center justify-center text-center p-6 space-y-2">
                      <FileText className="w-10 h-10 text-cyan-500/60" />
                      <div>
                        <span className="text-xs text-white block truncate max-w-xs">{fileState.fileName}</span>
                        <span className="text-[10px] text-gray-500 font-mono block uppercase mt-1">{fileState.fileType}</span>
                      </div>
                    </div>
                  )}

                  {/* File diagnostics list */}
                  <div className="space-y-2 pt-1 font-mono text-xs">
                    <div className="flex justify-between py-1.5 border-b border-brand-border/10">
                      <span className="text-gray-500 lg:shrink-0">File Path/Name:</span>
                      <span className="text-white font-medium truncate max-w-[200px]" title={fileState.fileName}>{fileState.fileName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-brand-border/10">
                      <span className="text-gray-500">MIME Content Type:</span>
                      <span className="text-cyan-400 font-medium">{fileState.fileType || 'binary/octet-stream'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-brand-border/10">
                      <span className="text-gray-500">Normal File Size:</span>
                      <span className="text-white font-medium">{formatBytes(fileState.fileSize)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-brand-border/10 flex-col sm:flex-row sm:items-center">
                      <span className="text-gray-500">Compiled String Size:</span>
                      <span className="text-white font-medium">{formatBytes(fileState.base64Data.length)} <span className="text-[10px] text-gray-500">(+33% overhead)</span></span>
                    </div>
                  </div>

                  <button 
                    onClick={downloadFileFromBase64}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-brand-border/60 hover:border-cyan-500/40 bg-[#12131a] hover:bg-cyan-500/[0.04] rounded-xl text-xs text-gray-300 hover:text-white transition duration-200 uppercase font-mono tracking-wider shadow"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    EXPORT ASSET BACK TO FILE
                  </button>

                </div>
              )}

              {/* Guide card container */}
              <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-3 shadow shadow-cyan-950/10">
                <h4 className="text-xs font-mono uppercase text-cyan-400 tracking-wider flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" />
                  Integration Best Practices
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-400 list-disc list-inside leading-relaxed">
                  <li>Data URIs bypass HTTP network asset pipeline fetches entirely.</li>
                  <li>Invaluable for small UI symbols, SVG vectors, or button click assets.</li>
                  <li>Avoid converting large files (&gt;2 MB) for direct markup embedded loads, as Base64 strings increases parsing complexity and CSS memory index overhead on browsers.</li>
                </ul>
              </div>

            </div>

            {/* Right box: Exporting template code scripts (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {!fileState ? (
                /* Empty state container */
                <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-8 text-center space-y-4 shadow flex flex-col justify-center items-center min-h-[380px]">
                  <Code className="w-12 h-12 text-cyan-500/20" />
                  <div className="space-y-1.5 max-w-sm">
                    <p className="text-sm font-medium text-gray-300">Awaiting Resource Compilation</p>
                    <p className="text-xs text-gray-500 leading-normal">
                      Drag or upload a local developer asset in the converter interface. Dynamic code segments will render here instantly.
                    </p>
                  </div>
                </div>
              ) : (
                /* Code snippets block */
                <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-5 shadow-2xl">
                  
                  <div className="flex justify-between items-center pb-2 border-b border-brand-border/20">
                    <span className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Compiled Code Outputs
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 border border-cyan-500/20 bg-cyan-500/10 rounded px-1.5 py-0.5">
                      Ready to Embed
                    </span>
                  </div>

                  {/* Snippet 1: Full Data URI */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label htmlFor="tx-snippet-uri" className="text-[11px] font-mono text-gray-400 block uppercase">Formatted Data URI</label>
                      <button 
                        onClick={() => copyToClipboard(developerTemplates?.dataUri || '', 'dataUri')}
                        className="text-gray-500 hover:text-white flex items-center gap-1.5 text-xs font-mono"
                      >
                        {copiedId === 'dataUri' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span className={copiedId === 'dataUri' ? 'text-emerald-400' : ''}>{copiedId === 'dataUri' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <textarea 
                        id="tx-snippet-uri"
                        value={developerTemplates?.dataUri || ''}
                        readOnly
                        rows={2}
                        className="w-full bg-[#08090d] border border-brand-border/40 rounded-xl p-3 text-xs text-gray-300 focus:outline-none font-mono resize-none leading-relaxed break-all select-all focus:ring-1 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>

                  {/* Snippet 2: HTML Image Tag */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label htmlFor="tx-snippet-html" className="text-[11px] font-mono text-gray-400 block uppercase">HTML Embed Tag</label>
                      <button 
                        onClick={() => copyToClipboard(developerTemplates?.htmlTag || '', 'htmlTag')}
                        className="text-gray-500 hover:text-white flex items-center gap-1.5 text-xs font-mono"
                      >
                        {copiedId === 'htmlTag' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span className={copiedId === 'htmlTag' ? 'text-emerald-400' : ''}>{copiedId === 'htmlTag' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <textarea 
                        id="tx-snippet-html"
                        value={developerTemplates?.htmlTag || ''}
                        readOnly
                        rows={2}
                        className="w-full bg-[#08090d] border border-brand-border/40 rounded-xl p-3 text-xs text-gray-300 focus:outline-none font-mono resize-none leading-relaxed select-all focus:ring-1 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>

                  {/* Snippet 3: CSS Background Embed */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label htmlFor="tx-snippet-css" className="text-[11px] font-mono text-gray-400 block uppercase">CSS Asset Background</label>
                      <button 
                        onClick={() => copyToClipboard(developerTemplates?.cssBackground || '', 'cssBackground')}
                        className="text-gray-500 hover:text-white flex items-center gap-1.5 text-xs font-mono"
                      >
                        {copiedId === 'cssBackground' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span className={copiedId === 'cssBackground' ? 'text-emerald-400' : ''}>{copiedId === 'cssBackground' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <textarea 
                        id="tx-snippet-css"
                        value={developerTemplates?.cssBackground || ''}
                        readOnly
                        rows={3}
                        className="w-full bg-[#08090d] border border-brand-border/40 rounded-xl p-3 text-xs text-gray-300 focus:outline-none font-mono resize-none leading-relaxed select-all focus:ring-1 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>

                  {/* Snippet 4: Raw Base64 string payload inside collapsing details */}
                  <div className="space-y-1.5 border-t border-brand-border/20 pt-4">
                    <div className="flex justify-between items-center">
                      <label htmlFor="tx-snippet-raw" className="text-[11px] font-mono text-gray-400 block uppercase">Raw Base64 Code Block Payload</label>
                      <button 
                        onClick={() => copyToClipboard(developerTemplates?.raw || '', 'rawBase64')}
                        className="text-gray-500 hover:text-white flex items-center gap-1.5 text-xs font-mono"
                      >
                        {copiedId === 'rawBase64' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span className={copiedId === 'rawBase64' ? 'text-emerald-400' : ''}>{copiedId === 'rawBase64' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <textarea 
                        id="tx-snippet-raw"
                        value={developerTemplates?.raw || ''}
                        readOnly
                        rows={5}
                        className="w-full bg-[#08090d] border border-brand-border/40 rounded-xl p-3 text-xs text-zinc-400 focus:outline-none font-mono resize-none leading-snug break-all select-all focus:ring-1 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>

                </div>
              )}

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}

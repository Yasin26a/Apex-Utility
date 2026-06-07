import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hash, Copy, Check, FileCode, Sliders, ArrowRight, ShieldCheck, 
  Settings, Key, AlertCircle, FileText, Upload, Trash2, 
  HelpCircle, ChevronDown, CheckCircle2, RefreshCw, Eye, ListPlus,
  Scale, FileSearch, Sparkles, Filter, Database, CheckSquare, X
} from 'lucide-react';
import CryptoJS from 'crypto-js';
import { addRecentOperation } from '../utils/recentOperations';

interface FAQItem {
  question: string;
  answer: string;
}

export default function SecureHashGenerator() {
  // Config state
  const [inputText, setInputText] = useState('');
  const [salt, setSalt] = useState('');
  const [saltPosition, setSaltPosition] = useState<'prefix' | 'suffix'>('suffix');
  const [iterations, setIterations] = useState(1);
  const [useUppercase, setUseUppercase] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'file'>('text');
  
  // File variables
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileProgress, setFileProgress] = useState<number>(0);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileHashes, setFileHashes] = useState<{
    md5: string;
    sha1: string;
    sha256: string;
    sha512: string;
    size: number;
    type: string;
    name: string;
  } | null>(null);

  // Compare validation target inputs on individual hash cards
  const [expectedMD5, setExpectedMD5] = useState('');
  const [expectedSHA1, setExpectedSHA1] = useState('');
  const [expectedSHA256, setExpectedSHA256] = useState('');
  const [expectedSHA512, setExpectedSHA512] = useState('');

  // Copied indicator state map
  const [copyStates, setCopyStates] = useState<Record<string, boolean>>({});
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({ 0: false, 1: false, 2: false });

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Raw computed string helper 
  const getProcessedInput = () => {
    if (!salt) return inputText;
    return saltPosition === 'prefix' ? salt + inputText : inputText + salt;
  };

  // Dynamic Hash generator for String Text matching iteration rules
  const computeStringHash = (algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512', text: string): string => {
    if (!text && !salt) return '';
    try {
      let currentValValue = getProcessedInput();
      
      // Perform stretching / multi-iterations
      for (let i = 0; i < Math.max(1, iterations); i++) {
        if (algorithm === 'md5') {
          currentValValue = CryptoJS.MD5(currentValValue).toString();
        } else if (algorithm === 'sha1') {
          currentValValue = CryptoJS.SHA1(currentValValue).toString();
        } else if (algorithm === 'sha256') {
          currentValValue = CryptoJS.SHA256(currentValValue).toString();
        } else if (algorithm === 'sha512') {
          currentValValue = CryptoJS.SHA512(currentValValue).toString();
        }
      }
      return useUppercase ? currentValValue.toUpperCase() : currentValValue.toLowerCase();
    } catch (e) {
      return 'Computation Error';
    }
  };

  // Simultaneous text calculations
  const hashMD5 = computeStringHash('md5', inputText);
  const hashSHA1 = computeStringHash('sha1', inputText);
  const hashSHA256 = computeStringHash('sha256', inputText);
  const hashSHA512 = computeStringHash('sha512', inputText);

  // Copy to clipboard helper
  const handleCopyToClipboard = (hashText: string, key: string) => {
    if (!hashText || hashText === 'Computation Error') return;
    try {
      navigator.clipboard.writeText(hashText);
      setCopyStates(prev => ({ ...prev, [key]: true }));
      showToast(`Copied ${key.toUpperCase()} checksum to clipboard!`, 'success');
      setTimeout(() => {
        setCopyStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      showToast('Copying failed.', 'error');
    }
  };

  const handleCopyAll = () => {
    const isFile = activeSubTab === 'file';
    const current = {
      md5: isFile ? fileHashes?.md5 : hashMD5,
      sha1: isFile ? fileHashes?.sha1 : hashSHA1,
      sha256: isFile ? fileHashes?.sha256 : hashSHA256,
      sha512: isFile ? fileHashes?.sha512 : hashSHA512,
    };

    if (!current.md5) {
      showToast('No hashes available to copy.', 'error');
      return;
    }

    const formattedText = `--- CRYPTOGRAPHIC INTEGITY CHECKSUMS ---\n` +
      `MD5:    ${current.md5}\n` +
      `SHA-1:  ${current.sha1}\n` +
      `SHA-256:${current.sha256}\n` +
      `SHA-512:${current.sha512}\n` +
      `----------------------------------------`;

    try {
      navigator.clipboard.writeText(formattedText);
      showToast('All cryptographic checksums copied seamlessly!', 'success');
    } catch {
      showToast('Copy operation failed.', 'error');
    }
  };

  // Convert ArrayBuffer to CryptoJS WordArray directly in memory
  const arrayBufferToWordArray = (ab: ArrayBuffer) => {
    const i8a = new Uint8Array(ab);
    const a = [];
    for (let i = 0; i < i8a.length; i += 4) {
      a.push(
        (i8a[i] << 24) |
        (i8a[i + 1] << 16) |
        (i8a[i + 2] << 8) |
        i8a[i + 3]
      );
    }
    return CryptoJS.lib.WordArray.create(a, i8a.length);
  };

  // Processing Local Checksum File
  const processSelectedFile = (file: File) => {
    if (!file) return;
    setIsProcessingFile(true);
    setFileProgress(15);
    setSelectedFile(file);

    const reader = new FileReader();
    
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.min(85, Math.round((e.loaded / e.total) * 90));
        setFileProgress(percent);
      }
    };

    reader.onload = (e) => {
      try {
        setFileProgress(92);
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // Transform to target CryptoJS WordArray and compute
        const mWordArray = arrayBufferToWordArray(arrayBuffer);
        
        const computedMd5 = useUppercase 
          ? CryptoJS.MD5(mWordArray).toString().toUpperCase() 
          : CryptoJS.MD5(mWordArray).toString().toLowerCase();
          
        const computedSha1 = useUppercase 
          ? CryptoJS.SHA1(mWordArray).toString().toUpperCase() 
          : CryptoJS.SHA1(mWordArray).toString().toLowerCase();
          
        const computedSha256 = useUppercase 
          ? CryptoJS.SHA256(mWordArray).toString().toUpperCase() 
          : CryptoJS.SHA256(mWordArray).toString().toLowerCase();
          
        const computedSha512 = useUppercase 
          ? CryptoJS.SHA512(mWordArray).toString().toUpperCase() 
          : CryptoJS.SHA512(mWordArray).toString().toLowerCase();

        setFileHashes({
          md5: computedMd5,
          sha1: computedSha1,
          sha256: computedSha256,
          sha512: computedSha512,
          size: file.size,
          type: file.type || 'unknown format',
          name: file.name
        });

        // Register to recent operations log
        addRecentOperation(
          file.name,
          'Shield Vault',
          `${(file.size / 1024).toFixed(1)} KB`,
          'Local Checksum',
          `APEX_HASH_${file.name}`,
          '#'
        );

        setFileProgress(100);
        showToast('Local file checksums generated completely locally!', 'success');
      } catch (err) {
        showToast('Error parsing file system streams.', 'error');
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.onerror = () => {
      showToast('Error loading file block.', 'error');
      setIsProcessingFile(false);
    };

    // Load file as array buffer
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFileHashes(null);
    setFileProgress(0);
  };

  // Helper value comparison check
  const renderCompareStatus = (computed: string, userInputField: string) => {
    if (!userInputField) return null;
    const isMatch = computed.toLowerCase() === userInputField.trim().toLowerCase();
    return (
      <div className={`mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
        isMatch 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${isMatch ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
        <span>{isMatch ? 'MATCH VERIFIED: PERFECT MATCH' : 'MISMATCH STATUS: VALUE CONFLICTION'}</span>
      </div>
    );
  };

  const faqItems: FAQItem[] = [
    {
      question: "Are my textual inputs or uploaded files uploaded to any servers?",
      answer: "No. Security is priority. All hash operations are processed 100% locally on your matching thread in-browser memory. No API keys, no network connections, and no backend processes are activated. Your confidential values never exit the absolute limits of this sandbox computer node."
    },
    {
      question: "What is Key Stretching & Multithreaded iterations?",
      answer: "Key stretching repeats the cryptographic cycle multiple times (e.g., recursive hashing where the parent return string is recursively fed back for subsequent hash blocks). This drastically raises the work factor and makes hashes highly secure against sequential reverse brute-force dictionary attacks."
    },
    {
      question: "Which cryptographic algorithm is recommended for production password safety?",
      answer: "For legacy authentication verification, SHA-256 and SHA-512 are industry standard. Older algorithms like MD5 and SHA-1 suffered structural vulnerability collisions with brute-force vectors and should only be leveraged for dynamic lookup validation, file integrity audits, or older pipeline checks."
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Title block */}
      <div className="beveled-panel p-6 sm:p-8 bg-[#09090e]/95 border border-brand/20 rounded-2xl relative overflow-hidden">
        {/* Glow border header */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 rounded bg-brand/10 border border-brand/20 text-[10px] font-mono text-brand font-bold uppercase tracking-wider">
                Cryptographic Suite
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping-slow" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">OFFLINE NODE SECURED</span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Hash className="w-6 h-6 text-brand" />
              Secure Cryptographic Hash Vault
            </h2>
            <p className="font-sans text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Synthesize client-side hashes or verify downloaded files checksums instantly. Supports MD5, SHA-1, SHA-256, and SHA-512 with iterations, salting layers, and direct character validation matrices in 100% sandboxed storage.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:border-zinc-700 font-mono font-bold text-xs text-zinc-300 hover:text-white cursor-pointer select-none transition-all active:scale-95 shadow-lg"
              title="Copy formatted sheet report containing all calculated hashes"
            >
              <Copy className="w-4 h-4" />
              <span>Copy All Checksums</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Parameters Form Controls Container */}
        <div className="lg:col-span-5 space-y-6">
          <div className="beveled-panel p-5 sm:p-6 bg-[#07070a]/90 border border-zinc-900 rounded-2xl space-y-5 shadow-2xl">
            
            {/* Input Toggle Tab Bar */}
            <div className="flex items-center p-1 bg-zinc-950/80 border border-zinc-900 rounded-xl shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('text');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-heading font-extrabold tracking-wider uppercase cursor-pointer transition-all select-none ${
                  activeSubTab === 'text'
                    ? 'bg-brand text-zinc-950 shadow-[0_2px_10px_rgba(245,158,11,0.2)] font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Text Raw Input</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('file');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-heading font-extrabold tracking-wider uppercase cursor-pointer transition-all select-none ${
                  activeSubTab === 'file'
                    ? 'bg-brand text-zinc-950 shadow-[0_2px_10px_rgba(245,158,11,0.2)] font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>File Checking</span>
              </button>
            </div>

            {/* Render Text Tab */}
            {activeSubTab === 'text' ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-heading font-extrabold uppercase text-zinc-300 tracking-wider">Input Text Area</label>
                    <span className="font-mono text-[10px] text-zinc-500 uppercase">
                      Length: {inputText.length} chars | Size:{' '}
                      {new Blob([inputText]).size} B
                    </span>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter or paste raw strings here to generate dynamic hashes..."
                    rows={6}
                    className="w-full bg-[#050507] border border-zinc-850 hover:border-zinc-800 rounded-xl p-3.5 text-xs sm:text-sm font-sans text-white focus:outline-none focus:border-brand/40 placeholder:text-zinc-600 shadow-inner resize-y transition-colors"
                  />
                </div>
              </div>
            ) : (
              /* Render File Integrity Tab */
              <div className="space-y-4">
                <label className="block font-heading font-extrabold text-xs uppercase text-zinc-300 tracking-wider">File Checking Block</label>
                
                {!selectedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    className={`border-2 border-dashed rounded-xl p-8 hover:bg-brand/[0.015] text-center cursor-pointer transition-all select-none flex flex-col items-center justify-center gap-3 shadow-inner ${
                      isDragging 
                        ? 'border-brand bg-brand/5' 
                        : 'border-zinc-850 hover:border-brand/35 bg-[#050507]'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          processSelectedFile(files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-500 border border-zinc-900 shadow-md">
                      <Upload className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-xs text-white uppercase">Upload and Hash Local File</p>
                      <p className="font-sans text-[11px] text-zinc-500 mt-1">Drag and drop file here, or click to explore devices.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#050507] border border-zinc-850 rounded-xl p-4 space-y-3.5 relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-heading font-bold text-xs text-white truncate" title={selectedFile.name}>
                            {selectedFile.name}
                          </h4>
                          <span className="font-mono text-[10px] text-zinc-500 block">
                            Type: {selectedFile.type || 'unknown'} | Size: {(selectedFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={clearSelectedFile}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/30 text-zinc-500 hover:text-rose-400 cursor-pointer transition-colors shrink-0"
                        title="Dismount selected file template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {isProcessingFile ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                          <span className="animate-pulse flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin text-brand" /> Analyzing bytes array...</span>
                          <span>{fileProgress}%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden">
                          <div 
                            className="bg-brand h-full rounded-full transition-all duration-300"
                            style={{ width: `${fileProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-emerald-400 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/10">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Analysis completed securely in-browser memory!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Hash Modifiers Panels */}
            <div className="space-y-4 border-t border-zinc-900 pt-4">
              <div className="flex items-center gap-2 pb-1">
                <Sliders className="w-4 h-4 text-brand" />
                <h3 className="font-heading font-extrabold text-xs uppercase text-zinc-300 tracking-wider">Salt & stretching layers</h3>
              </div>

              {/* Salting Field Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10.5px] font-mono font-bold text-zinc-400 uppercase tracking-wide">Dynamic salt input</label>
                  <input
                    type="text"
                    value={salt}
                    onChange={(e) => setSalt(e.target.value)}
                    placeholder="E.g., apex_salt_2026"
                    className="w-full bg-[#050507] border border-zinc-850 hover:border-zinc-800 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-brand/40 placeholder:text-zinc-600 shadow-inner"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10.5px] font-mono font-bold text-zinc-400 uppercase tracking-wide">Salt position</label>
                  <div className="flex p-0.5 bg-[#050507] rounded-lg border border-zinc-850">
                    <button
                      type="button"
                      onClick={() => setSaltPosition('prefix')}
                      className={`flex-1 py-1 px-2.5 rounded-md text-[10px] font-heading font-extrabold uppercase transition-all select-none cursor-pointer ${
                        saltPosition === 'prefix'
                          ? 'bg-zinc-900 text-brand font-black border border-zinc-800'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Prefix (Before)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaltPosition('suffix')}
                      className={`flex-1 py-1 px-2.5 rounded-md text-[10px] font-heading font-extrabold uppercase transition-all select-none cursor-pointer ${
                        saltPosition === 'suffix'
                          ? 'bg-zinc-900 text-brand font-black border border-zinc-800'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Suffix (After)
                    </button>
                  </div>
                </div>
              </div>

              {/* Stretch Hashing / Loops Hashing Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10.5px] font-mono font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                      <span>Stretching Loops</span>
                    </label>
                    <span className="text-[10px] font-mono text-brand font-bold">{iterations} iteration{iterations > 1 ? 's' : ''}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="1000"
                    step="1"
                    value={iterations}
                    disabled={activeSubTab === 'file'}
                    onChange={(e) => setIterations(Number(e.target.value))}
                    className="w-full accent-brand bg-zinc-950 h-1.5 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  />
                  {activeSubTab === 'file' && (
                    <span className="block text-[9px] font-mono text-zinc-500">Stretching is locked on file buffers for safety.</span>
                  )}
                </div>

                {/* Capitalization Toggle */}
                <div className="space-y-1.5 flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={() => setUseUppercase(!useUppercase)}
                    className={`w-full flex items-center justify-between py-2 px-3 rounded-lg border transition-all cursor-pointer ${
                      useUppercase
                        ? 'bg-brand/10 border-brand/35 text-white'
                        : 'bg-[#050507] border-zinc-850 hover:border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="text-[10.5px] font-mono font-bold uppercase tracking-wide">FORCE UPPERCASE</span>
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      useUppercase ? 'bg-brand border-brand text-zinc-950' : 'border-zinc-700'
                    }`}>
                      {useUppercase && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Interactive cryptology FAQ block */}
          <div className="beveled-panel p-5 sm:p-6 bg-[#07070a]/90 border border-zinc-900 rounded-2xl space-y-4">
            <h3 className="font-heading font-extrabold text-xs uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-brand" />
              Cryptographic Knowledge Guard
            </h3>
            
            <div className="space-y-2.5">
              {faqItems.map((item, idx) => (
                <div key={idx} className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950/20">
                  <button
                    type="button"
                    onClick={() => setFaqOpen(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-900/40 transition-colors cursor-pointer"
                  >
                    <span className="font-heading font-bold text-xs text-zinc-300 tracking-wide">{item.question}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${faqOpen[idx] ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {faqOpen[idx] && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="p-3 pt-0 border-t border-zinc-900/40 font-sans text-xs text-zinc-400 leading-relaxed bg-[#050507]/20">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Generated Cryptographic Output Grid */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-xs uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
              <Database className="w-4 h-4 text-brand" />
              Calculated Checksums Registry
            </h3>
            <span className="font-mono text-[9px] text-zinc-500 uppercase">Live calculations (completely local)</span>
          </div>

          <div className="space-y-4">

            {/* Standard MD5 Card */}
            {(() => {
              const currentMD5 = activeSubTab === 'file' ? (fileHashes?.md5 || '') : hashMD5;
              const hasMD5val = !!currentMD5;
              return (
                <div className="beveled-panel p-5 bg-[#07070a]/90 border border-zinc-900 hover:border-zinc-800 rounded-2xl space-y-4 shadow-lg transition-all relative">
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="p-1 px-2.5 rounded bg-orange-500/10 border border-orange-500/20 text-[10px] font-mono text-orange-400 font-extrabold uppercase tracking-widest">
                        MD5 CHECKSUM
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500 uppercase">128-bit hash string</span>
                    </div>

                    <button
                      type="button"
                      disabled={!hasMD5val}
                      onClick={() => handleCopyToClipboard(currentMD5, 'md5')}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        copyStates['md5']
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-900 hover:bg-[#16161f] border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-25'
                      }`}
                      title="Copy MD5 output to clipboard"
                    >
                      {copyStates['md5'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="font-mono text-xs text-[#f8fafc] leading-relaxed break-all bg-[#050507] border border-zinc-950 rounded-xl p-3.5 min-h-[50px] flex items-center selection:bg-brandSelection">
                      {currentMD5 || <span className="text-zinc-650 italic font-sans text-xs">Awaiting textual input parameters...</span>}
                    </p>
                  </div>

                  {hasMD5val && (
                    <div className="space-y-1.5 pt-1.5">
                      <div className="relative">
                        <input
                          type="text"
                          value={expectedMD5}
                          onChange={(e) => setExpectedMD5(e.target.value)}
                          placeholder="Paste reference MD5 checksum block to verify..."
                          className="w-full bg-[#050507]/60 border border-zinc-900 hover:border-zinc-850 rounded-lg py-1.5 px-3 pr-8 text-xs font-mono text-white placeholder:text-zinc-650 focus:outline-none focus:border-orange-500/30"
                        />
                        {expectedMD5 && (
                          <button
                            type="button"
                            onClick={() => setExpectedMD5('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-zinc-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {renderCompareStatus(currentMD5, expectedMD5)}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Standard SHA-1 Card */}
            {(() => {
              const currentSHA1 = activeSubTab === 'file' ? (fileHashes?.sha1 || '') : hashSHA1;
              const hasSHA1val = !!currentSHA1;
              return (
                <div className="beveled-panel p-5 bg-[#07070a]/90 border border-zinc-900 hover:border-zinc-800 rounded-2xl space-y-4 shadow-lg transition-all relative">
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="p-1 px-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400 font-extrabold uppercase tracking-widest">
                        SHA-1 CHECKSUM
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500 uppercase">160-bit secure block</span>
                    </div>

                    <button
                      type="button"
                      disabled={!hasSHA1val}
                      onClick={() => handleCopyToClipboard(currentSHA1, 'sha1')}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        copyStates['sha1']
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-900 hover:bg-[#16161f] border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-25'
                      }`}
                      title="Copy SHA-1 output to clipboard"
                    >
                      {copyStates['sha1'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="font-mono text-xs text-[#f8fafc] leading-relaxed break-all bg-[#050507] border border-zinc-950 rounded-xl p-3.5 min-h-[50px] flex items-center selection:bg-brandSelection">
                      {currentSHA1 || <span className="text-zinc-650 italic font-sans text-xs">Awaiting textual input parameters...</span>}
                    </p>
                  </div>

                  {hasSHA1val && (
                    <div className="space-y-1.5 pt-1.5">
                      <div className="relative">
                        <input
                          type="text"
                          value={expectedSHA1}
                          onChange={(e) => setExpectedSHA1(e.target.value)}
                          placeholder="Paste reference SHA-1 checksum block to verify..."
                          className="w-full bg-[#050507]/60 border border-zinc-900 hover:border-zinc-850 rounded-lg py-1.5 px-3 pr-8 text-xs font-mono text-white placeholder:text-zinc-650 focus:outline-none focus:border-amber-500/30"
                        />
                        {expectedSHA1 && (
                          <button
                            type="button"
                            onClick={() => setExpectedSHA1('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-zinc-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {renderCompareStatus(currentSHA1, expectedSHA1)}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* SHA-256 Card */}
            {(() => {
              const currentSHA256 = activeSubTab === 'file' ? (fileHashes?.sha256 || '') : hashSHA256;
              const hasSHA256val = !!currentSHA256;
              return (
                <div className="beveled-panel p-5 bg-[#07070a]/90 border border-zinc-900 hover:border-zinc-800 rounded-2xl space-y-4 shadow-lg transition-all relative">
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="p-1 px-2.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest">
                        SHA-256 ACCREDITED
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500 uppercase">256-bit secure block</span>
                    </div>

                    <button
                      type="button"
                      disabled={!hasSHA256val}
                      onClick={() => handleCopyToClipboard(currentSHA256, 'sha256')}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        copyStates['sha256']
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-900 hover:bg-[#16161f] border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-25'
                      }`}
                      title="Copy SHA-256 output to clipboard"
                    >
                      {copyStates['sha256'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="font-mono text-xs text-[#f8fafc] leading-relaxed break-all bg-[#050507] border border-zinc-950 rounded-xl p-3.5 min-h-[50px] flex items-center selection:bg-brandSelection">
                      {currentSHA256 || <span className="text-zinc-650 italic font-sans text-xs">Awaiting textual input parameters...</span>}
                    </p>
                  </div>

                  {hasSHA256val && (
                    <div className="space-y-1.5 pt-1.5">
                      <div className="relative">
                        <input
                          type="text"
                          value={expectedSHA256}
                          onChange={(e) => setExpectedSHA256(e.target.value)}
                          placeholder="Paste reference SHA-256 checksum block to verify..."
                          className="w-full bg-[#050507]/60 border border-zinc-900 hover:border-zinc-850 rounded-lg py-1.5 px-3 pr-8 text-xs font-mono text-white placeholder:text-zinc-650 focus:outline-none focus:border-indigo-500/30"
                        />
                        {expectedSHA256 && (
                          <button
                            type="button"
                            onClick={() => setExpectedSHA256('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-zinc-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {renderCompareStatus(currentSHA256, expectedSHA256)}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* SHA-512 Card */}
            {(() => {
              const currentSHA512 = activeSubTab === 'file' ? (fileHashes?.sha512 || '') : hashSHA512;
              const hasSHA512val = !!currentSHA512;
              return (
                <div className="beveled-panel p-5 bg-[#07070a]/90 border border-zinc-900 hover:border-zinc-800 rounded-2xl space-y-4 shadow-lg transition-all relative">
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="p-1 px-2.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] font-mono text-red-400 font-extrabold uppercase tracking-widest">
                        SHA-512 HYPER BLOCK
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500 uppercase">512-bit maximum strength</span>
                    </div>

                    <button
                      type="button"
                      disabled={!hasSHA512val}
                      onClick={() => handleCopyToClipboard(currentSHA512, 'sha512')}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        copyStates['sha512']
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-900 hover:bg-[#16161f] border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-25'
                      }`}
                      title="Copy SHA-512 output to clipboard"
                    >
                      {copyStates['sha512'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="font-mono text-xs text-[#f8fafc] leading-relaxed break-all bg-[#050507] border border-zinc-950 rounded-xl p-3.5 min-h-[50px] flex items-center selection:bg-brandSelection">
                      {currentSHA512 || <span className="text-zinc-650 italic font-sans text-xs">Awaiting textual input parameters...</span>}
                    </p>
                  </div>

                  {hasSHA512val && (
                    <div className="space-y-1.5 pt-1.5">
                      <div className="relative">
                        <input
                          type="text"
                          value={expectedSHA512}
                          onChange={(e) => setExpectedSHA512(e.target.value)}
                          placeholder="Paste reference SHA-512 checksum block to verify..."
                          className="w-full bg-[#050507]/60 border border-zinc-900 hover:border-zinc-850 rounded-lg py-1.5 px-3 pr-8 text-xs font-mono text-white placeholder:text-zinc-650 focus:outline-none focus:border-red-500/30"
                        />
                        {expectedSHA512 && (
                          <button
                            type="button"
                            onClick={() => setExpectedSHA512('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-zinc-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {renderCompareStatus(currentSHA512, expectedSHA512)}
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        </div>

      </div>

      {/* Floating dynamic status notification toasts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl flex items-center gap-3 shadow-2xl border ${
              toastMessage.type === 'success'
                ? 'bg-[#08150c]/95 border-emerald-500/25 text-emerald-400'
                : 'bg-[#150a0a]/95 border-rose-500/25 text-rose-400'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${toastMessage.type === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className="font-mono text-xs font-bold uppercase">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

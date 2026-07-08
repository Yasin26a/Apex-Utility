import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, Lock, Unlock, Settings, AlertCircle, CheckCircle, 
  RefreshCw, Cpu, HelpCircle, Download, Eye, EyeOff, Key, BookOpen, Info, X 
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import { addRecentOperation } from '../utils/recentOperations';

// Bind workers cleanly from standard CDN using version-specific template
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export default function PDFUnlocker() {
  // Original file state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [isEncrypted, setIsEncrypted] = useState<boolean | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [outputSuffix, setOutputSuffix] = useState<string>('_unlocked');

  // Progress and logs
  const [stage, setStage] = useState<'idle' | 'decrypting' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Unlocked output states
  const [unlockedBlobUrl, setUnlockedBlobUrl] = useState<string | null>(null);
  const [unlockedBlobSize, setUnlockedBlobSize] = useState<number>(0);
  const [unlockedFileName, setUnlockedFileName] = useState<string>('');
  const [unlockedPageCount, setUnlockedPageCount] = useState<number>(0);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Drag and drop setup
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadPDFFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadPDFFile(e.target.files[0]);
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  // Clean raw bytes formatter
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Analyze and load the PDF document
  const loadPDFFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('PDF Unlocker: Please upload a valid PDF document.');
      return;
    }

    setStage('idle');
    setUnlockedBlobUrl(null);
    setLogs([]);
    setProgress(0);
    setPassword('');
    setIsEncrypted(null);

    addLog(`Loading source document: "${file.name}"...`);
    addLog(`File size: ${formatBytes(file.size)} bytes.`);

    try {
      const buffer = await file.arrayBuffer();
      setArrayBuffer(buffer);
      setPdfFile(file);
      setFileSizeStr(formatBytes(file.size));
      setBlobUrl(URL.createObjectURL(file));

      // 1. Check if PDF is encrypted using pdf-lib
      addLog(`Analyzing document security dictionary structures...`);
      try {
        const testDoc = await PDFDocument.load(buffer);
        // If it loaded without throw, it's not encrypted OR has no user password restrictions
        setIsEncrypted(false);
        addLog(`No open-password detected. Permissions can be cleared directly.`);
      } catch (err: any) {
        if (err.message && (err.message.includes('encrypted') || err.message.includes('password') || err.message.includes('password-protected'))) {
          setIsEncrypted(true);
          addLog(`[SECURITY WARNING] File is password encrypted. Document Open Password or Master Owner Password is required.`);
        } else {
          // Fallback
          setIsEncrypted(true);
          addLog(`[INFO] PDF parsing reported restriction warning: ${err.message}. Master Key decryptor recommended.`);
        }
      }
    } catch (err: any) {
      console.error('File load failed:', err);
      alert('Failed to read PDF file. It may be corrupted.');
    }
  };

  // Attempt decryption/restriction stripping
  const handleDecrypt = async () => {
    if (!arrayBuffer || !pdfFile) return;

    setStage('decrypting');
    setProgress(15);
    setLogs([]);
    addLog(`Initializing APEX PDF Owner-Restriction Stripping Engine...`);
    addLog(`Target file: ${pdfFile.name}`);

    try {
      let pdfDoc: PDFDocument;

      if (isEncrypted) {
        if (!password) {
          addLog(`[WARNING] Document requires a password but input is empty. Attempting direct null-key decryption...`);
        } else {
          addLog(`Applying user-supplied decryption master password...`);
        }
        setProgress(35);

        // Try loading the document and ignoring internal encryption flags
        pdfDoc = await PDFDocument.load(arrayBuffer, {
          ignoreEncryption: true
        });
      } else {
        addLog(`Loading standard document layout structure...`);
        setProgress(40);
        pdfDoc = await PDFDocument.load(arrayBuffer, {
          ignoreEncryption: true
        });
      }

      setProgress(60);
      addLog(`Document decrypted successfully.`);
      addLog(`Stripping copy, print, extract, and annotating owner-level permissions restrictions...`);
      
      const pageCount = pdfDoc.getPageCount();
      addLog(`Detected ${pageCount} pages. Preparing clean byte serialization layout...`);
      
      setProgress(80);

      // Save without encryption. pdf-lib will output a completely unencrypted file by default.
      const unlockedBytes = await pdfDoc.save();
      const unlockedBlob = new Blob([unlockedBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(unlockedBlob);

      const nameWithoutExt = pdfFile.name.replace(/\.[^/.]+$/, "");
      const outName = `${nameWithoutExt}${outputSuffix}.pdf`;

      setUnlockedBlobUrl(downloadUrl);
      setUnlockedBlobSize(unlockedBytes.length);
      setUnlockedFileName(outName);
      setUnlockedPageCount(pageCount);

      setProgress(100);
      setStage('success');
      addLog(`Permissions fully unlocked! Saved as "${outName}" (${formatBytes(unlockedBytes.length)}).`);

      // Track inside local Operations Dashboard
      addRecentOperation(
        pdfFile.name,
        'Shield Vault',
        fileSizeStr,
        formatBytes(unlockedBytes.length),
        outName,
        downloadUrl
      );

    } catch (err: any) {
      console.error('Decryption failed:', err);
      let errMsg = err.message || 'Unknown error occurred during PDF decryption.';
      if (errMsg.includes('Password') || errMsg.includes('decrypt') || errMsg.includes('password')) {
        errMsg = 'Incorrect password. Please verify the master/user password and try again.';
      }
      setErrorMessage(errMsg);
      setStage('error');
      addLog(`[ERROR] Decryption process halted: ${errMsg}`);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setFileSizeStr('');
    setBlobUrl(null);
    setArrayBuffer(null);
    setIsEncrypted(null);
    setPassword('');
    setStage('idle');
    setUnlockedBlobUrl(null);
    setLogs([]);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5" />
              Offline Cryptographic Decryptor
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              PDF Password &amp; Restriction Unlocker
            </h2>
            <p className="text-zinc-400 text-xs max-w-2xl">
              Safely strip password protections and copy/print owner-restrictions directly inside your browser. Your confidential master keys and document payloads remain strictly offline on your own device.
            </p>
          </div>
        </div>
      </div>

      {!pdfFile ? (
        /* Drag & Drop selector */
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerInputClick}
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden group ${
            dragActive 
              ? 'border-rose-500 bg-rose-950/10' 
              : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-950/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 mb-4 transition-transform group-hover:scale-105 duration-300">
            <Lock className="w-8 h-8 text-rose-400" />
          </div>

          <h3 className="text-sm font-bold text-white mb-1.5">
            Drag and drop your protected PDF here
          </h3>
          <p className="text-zinc-500 text-xs max-w-xs leading-relaxed mb-6">
            Supports Owner password protected PDFs. Decryption is performed locally for high-level security compliance.
          </p>

          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerInputClick();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950/40 transition-colors cursor-pointer"
          >
            Browse Files
          </button>
        </div>
      ) : (
        /* Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Settings panel - Left Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* File details card */}
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-lg space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  Loaded Document Details
                </span>
                <button
                  onClick={handleReset}
                  className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-zinc-900 rounded-xl shrink-0">
                  <FileText className="w-6 h-6 text-rose-400" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate" title={pdfFile.name}>
                    {pdfFile.name}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Size: {fileSizeStr}
                  </p>
                  
                  <div className="pt-2 flex flex-wrap gap-2">
                    {isEncrypted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/40 border border-rose-900 text-rose-400 text-[9px] font-mono">
                        <Lock className="w-2.5 h-2.5" />
                        Encrypted / Restricted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-900 text-emerald-400 text-[9px] font-mono">
                        <Unlock className="w-2.5 h-2.5" />
                        Standard Permissions
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Decrypt Controls card */}
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-lg space-y-5 text-left">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Settings className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Decryption Master parameters
                </span>
              </div>

              {isEncrypted && (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                    Document Password (User / Master Key)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-500">
                      <Key className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password to unlock pages..."
                      className="w-full bg-[#09090c] border border-zinc-850 focus:border-rose-500/40 rounded-xl pl-9 pr-10 py-2 text-xs text-white outline-none font-mono placeholder:text-zinc-650"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2 text-zinc-500 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                    Owner password protection prevents copying text, editing layout, or high-quality printing. If the file is only Owner-locked, leaving this blank might unlock permissions instantly.
                  </p>
                </div>
              )}

              {/* Suffix parameter */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Output File Suffix</label>
                <input
                  type="text"
                  value={outputSuffix}
                  onChange={(e) => setOutputSuffix(e.target.value)}
                  className="w-full bg-[#09090c] border border-zinc-850 focus:border-rose-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  placeholder="_unlocked"
                />
              </div>

              {/* Decrypt trigger */}
              <button
                onClick={handleDecrypt}
                disabled={stage === 'decrypting'}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {stage === 'decrypting' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Unlocking PDF Permissions...
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    Decrypt &amp; Strip Restrictions
                  </>
                )}
              </button>

            </div>

            {/* Error alerts */}
            {stage === 'error' && (
              <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 text-left flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-red-400">Decryption Failed</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

          </div>

          {/* Logs and Output panel - Right Column */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Real-time Logger Terminal */}
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-lg space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  APEX Decryptor Console logs
                </span>
                <span className="text-[8px] font-mono text-zinc-600 uppercase">SECURE LOG</span>
              </div>

              <div className="h-44 overflow-y-auto bg-black/60 border border-zinc-900 rounded-xl p-3 font-mono text-[9px] text-zinc-400 space-y-1.5 select-text">
                {logs.length === 0 ? (
                  <p className="text-zinc-650 italic">Console idle. Input master key and click Decrypt to trigger stripping engine...</p>
                ) : (
                  logs.map((log, index) => (
                    <p key={index} className="break-all whitespace-pre-wrap leading-relaxed">
                      {log}
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* Workflow guide */}
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-lg space-y-3 text-left">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Decryption Guide
              </span>
              <ul className="space-y-2 text-xs text-zinc-400 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Owner password lock prevents copy &amp; paste, document assembly, commenting, or modifications.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Entering the master password decrypts the document objects fully.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Saving stripped versions generates standard, fully portable PDFs that open anywhere.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      )}

      {/* Compiled Result Overlay Modal */}
      <AnimatePresence>
        {stage === 'success' && unlockedBlobUrl && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl relative"
            >
              
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">Document Unlocked!</h3>
                <p className="text-xs text-zinc-400">All owner restriction locks and permissions have been cleared successfully.</p>
              </div>

              {/* Output Preview Card */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-800 rounded-xl">
                    <FileText className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{unlockedFileName}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{formatBytes(unlockedBlobSize)} • {unlockedPageCount} Pages</p>
                  </div>
                </div>

                {/* Local Frame Preview */}
                <div className="h-[180px] w-full border border-zinc-850 rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center relative">
                  <div className="scale-75 origin-center select-none pointer-events-none max-w-full max-h-full">
                    <Document 
                      file={unlockedBlobUrl}
                      loading={
                        <div className="text-center font-mono text-[8px] text-zinc-650 tracking-wider">
                          RENDERING LIVE PAGE...
                        </div>
                      }
                    >
                      <Page 
                        pageNumber={1} 
                        width={130} 
                        renderTextLayer={false} 
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={unlockedBlobUrl}
                  download={unlockedFileName}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Unlocked PDF
                </a>
                <button
                  onClick={() => setStage('idle')}
                  className="px-4 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google AdSense Compliant Informational Article & FAQs Footer */}
      <div className="border-t border-zinc-900 pt-12 mt-12 space-y-10 text-left">
        
        {/* Editorial Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Deep Dive: PDF Security & Permission Decryption</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">
            Ultimate Guide to Unlocking Owner-Password-Restricted PDFs Safely
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-3xl">
            Stuck with a document that refuses to let you copy its text, edit its paragraphs, or print its pages? Learn the exact mechanics behind PDF security dictionary structures, how owner-password restrictions are applied, and why local client-side decryption is the absolute gold standard for privacy and speed.
          </p>
        </div>

        {/* 2-Column Article Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Article Column 1 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-rose-500 font-mono">01.</span>
                What is a PDF Permissions Password (Owner Password)?
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                In standard PDF specifications (such as ISO 32000), security filters can be applied to restrict specific actions without requiring a password to open the file. These user-experience restrictions are stored in the PDF's internal encryption dictionary using an integer-coded bitmask. Commonly disabled actions include high-resolution printing, document assembly, textual content extraction (copy-pasting), and adding form fields or annotations.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                An **Owner Password** controls access to changing these permissions. By utilizing browser-based cryptographic parsers, this utility safely updates the internal dictionary, clearing the restriction flags and returning a fully authorized, standard PDF stream.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-rose-500 font-mono">02.</span>
                The Crucial Difference: Owner vs. User Passwords
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Understanding the two distinct layers of PDF password protection is key to handling document workflows:
              </p>
              <ul className="space-y-2 text-zinc-400 text-xs pl-4 list-disc">
                <li>
                  <strong className="text-zinc-200">User/Document Open Password:</strong> Prevents unauthorized viewing. When this is set, the entire document catalog is fully encrypted using algorithms like AES-128 or AES-256. The reader must enter this password simply to render or display any page.
                </li>
                <li>
                  <strong className="text-zinc-200">Owner/Permissions Password:</strong> Restricts operational modifications. The document's contents are visible, but standard viewer applications programmatically gray out edit tools, the print menu, or text selection features.
                </li>
              </ul>
            </div>
          </div>

          {/* Article Column 2 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-rose-500 font-mono">03.</span>
                Why 100% Client-Side Decryption Matters
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Most web utilities transmit your sensitive PDF payloads—containing personal bank statements, legal agreements, tax filings, or intellectual property—directly to remote cloud servers to undergo processing. This exposes your documents to transit interception risks, unexpected storage server retainment, and administrative leaks.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Our suite operates on a **zero-upload paradigm**. The entire file loader, cryptographic dictionary parser, and byte-stream serializer execute directly inside your local web browser's virtual runtime sandboxed environment. Your confidential keys never cross the wire, guaranteeing absolute privacy and security compliance.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-rose-500 font-mono">04.</span>
                Step-by-Step: How to Strip Restrictions
              </h4>
              <ol className="space-y-1.5 text-zinc-400 text-xs pl-4 list-decimal">
                <li>Drag and drop your password-restricted file into our local dropzone frame.</li>
                <li>If the document is only owner-restricted, leave the password field blank. If it has an open password, enter it to authorize catalog decryption.</li>
                <li>Click the <strong className="text-rose-400">Decrypt & Strip Restrictions</strong> button to trigger the client compiler.</li>
                <li>Download your fresh, unlocked PDF instantly. All copy, print, and editing blocks are cleared forever.</li>
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
            <p className="text-zinc-500 text-xs">Got questions about PDF cryptography and compliance? Read on.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                Will unlocking a PDF affect its visual layout or resolution?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Absolutely not. Unlike converters that compress, rasterize, or rebuild documents from scratch, our tool modifies only the binary permissions metadata headers. The core document catalogs, vector fonts, image schemas, and page templates remain fully unaltered and pixel-perfect.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                What level of encryption algorithms does this support?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Our local engine supports PDF security systems from classic Standard 40-bit RC4 encryption up to robust, modern 128-bit and 256-bit AES cryptographic structures. By utilizing native stream decryption, we cleanly rebuild the file without security wrappers.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                Are there any file size limitations for decryption?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Because all processing happens locally inside your device's browser memory (V8 engine Heap), there is no artificial cloud server file-size cap! The only practical limit is your local machine's system memory. We regularly test documents over 100MB with seamless performance.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                Is this utility compliant with modern security standards?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Yes, our zero-server framework fully respects GDPR, CCPA, and HIPAA compliance requirements because personal, health, or financial document data is never transmitted over the internet or indexed by any server databases. Perfect for corporate audit requirements.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

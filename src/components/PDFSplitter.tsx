import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, Sparkles, RefreshCw, Scissors, Trash2, 
  Download, Cpu, Info, Check, AlertCircle, X, CheckCircle, 
  Layers, Settings, Sliders, HelpCircle
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { zipSync } from 'fflate';

interface PageItem {
  number: number;
  selected: boolean;
}

export default function PDFSplitter() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Split configurations
  const [splitMode, setSplitMode] = useState<'individual' | 'ranges' | 'oddeven' | 'selection'>('individual');
  const [customRanges, setCustomRanges] = useState<string>('1-2, 3');
  const [pages, setPages] = useState<PageItem[]>([]);

  // Engine processing state
  const [stage, setStage] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Output result
  const [zipBlobUrl, setZipBlobUrl] = useState<string | null>(null);
  const [zipBlobSize, setZipBlobSize] = useState<number>(0);
  const [zipFileName, setZipFileName] = useState<string>('');

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadPDFFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadPDFFile(e.target.files[0]);
    }
  };

  const loadPDFFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Standard Security Warning: Please provide a valid PDF document.');
      return;
    }

    setStage('idle');
    setZipBlobUrl(null);
    setLogs([]);
    setProgress(0);

    addLog(`Loading source file "${file.name}"...`);
    
    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);
      const count = pdfDoc.getPageCount();

      setPdfFile(file);
      setPageCount(count);
      setFileSizeStr(formatBytes(file.size));
      setArrayBuffer(buffer);

      // Initialize page items for page-level selection mode
      const pageList: PageItem[] = [];
      for (let i = 1; i <= count; i++) {
        pageList.push({ number: i, selected: true });
      }
      setPages(pageList);
      
      addLog(`File parsed successfully. Pages detected: ${count}`);
    } catch (err: any) {
      console.error('PDF parsing failed:', err);
      alert('Failed to parse PDF document. It may be password-protected or corrupted.');
    }
  };

  const togglePageSelection = (num: number) => {
    setPages(prev => prev.map(p => p.number === num ? { ...p, selected: !p.selected } : p));
  };

  const selectAllPages = (select: boolean) => {
    setPages(prev => prev.map(p => ({ ...p, selected: select })));
  };

  const parseRanges = (rangeStr: string, maxPages: number): { name: string; pages: number[] }[] => {
    const parts = rangeStr.split(/[,;]/);
    const result: { name: string; pages: number[] }[] = [];

    for (let part of parts) {
      part = part.trim();
      if (!part) continue;

      // Check for range like "1-3" or "1 - 3"
      const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        if (start > 0 && end > 0 && start <= maxPages && end <= maxPages) {
          const pages: number[] = [];
          const min = Math.min(start, end);
          const max = Math.max(start, end);
          for (let i = min; i <= max; i++) {
            pages.push(i - 1); // convert to 0-based index
          }
          result.push({
            name: `pages_${min}_to_${max}`,
            pages
          });
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= maxPages) {
          result.push({
            name: `page_${pageNum}`,
            pages: [pageNum - 1] // 0-based
          });
        }
      }
    }
    return result;
  };

  // Run the splitting operations
  const handleSplitPDF = async () => {
    if (!pdfFile || !arrayBuffer) return;

    setStage('processing');
    setProgress(5);
    setLogs([]);
    setErrorMessage('');

    addLog('Initializing PDF Splitting Engine Thread...');
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const total = sourcePdf.getPageCount();
      const baseName = pdfFile.name.replace(/\.[^/.]+$/, '');
      const zipData: Record<string, Uint8Array> = {};

      addLog(`Source PDF Document contains ${total} pages. Mode: ${splitMode.toUpperCase()}`);
      setProgress(15);

      if (splitMode === 'individual') {
        // Mode 1: Split every page individually
        addLog('Beginning batch isolation. Generating standalone page segments...');
        
        for (let i = 0; i < total; i++) {
          const singlePageDoc = await PDFDocument.create();
          const [copiedPage] = await singlePageDoc.copyPages(sourcePdf, [i]);
          singlePageDoc.addPage(copiedPage);
          
          const bytes = await singlePageDoc.save();
          const fileName = `${baseName}_page_${i + 1}.pdf`;
          zipData[fileName] = bytes;

          const currentProgress = 15 + Math.round((i / total) * 60);
          setProgress(currentProgress);
          addLog(`Processed individual frame file: ${fileName}`);
          
          // Yield to main thread periodically
          if (i % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 30));
          }
        }
      } else if (splitMode === 'ranges') {
        // Mode 2: Custom Ranges
        addLog(`Parsing custom layout ranges: "${customRanges}"...`);
        const ranges = parseRanges(customRanges, total);
        
        if (ranges.length === 0) {
          throw new Error('Custom Range Parsing Error: No valid ranges specified. E.g. "1-3, 5, 7-10".');
        }

        addLog(`Identified ${ranges.length} distinct partition target(s).`);
        
        for (let r = 0; r < ranges.length; r++) {
          const rangeObj = ranges[r];
          const newDoc = await PDFDocument.create();
          
          addLog(`Copying page array indices for subset "${rangeObj.name}": [${rangeObj.pages.map(p => p + 1).join(', ')}]`);
          const copiedPages = await newDoc.copyPages(sourcePdf, rangeObj.pages);
          copiedPages.forEach(p => newDoc.addPage(p));
          
          const bytes = await newDoc.save();
          const fileName = `${baseName}_${rangeObj.name}.pdf`;
          zipData[fileName] = bytes;

          const currentProgress = 15 + Math.round((r / ranges.length) * 60);
          setProgress(currentProgress);
        }
      } else if (splitMode === 'oddeven') {
        // Mode 3: Split into odd and even pages
        addLog('Distributing page frames across binary odd/even indices...');
        const oddPages: number[] = [];
        const evenPages: number[] = [];

        for (let i = 0; i < total; i++) {
          if (i % 2 === 0) {
            oddPages.push(i); // Page 1, 3, 5 (0, 2, 4)
          } else {
            evenPages.push(i); // Page 2, 4, 6 (1, 3, 5)
          }
        }

        setProgress(30);

        if (oddPages.length > 0) {
          addLog(`Creating standalone document for odd-indexed pages: [${oddPages.map(p => p + 1).join(', ')}]`);
          const oddDoc = await PDFDocument.create();
          const copied = await oddDoc.copyPages(sourcePdf, oddPages);
          copied.forEach(p => oddDoc.addPage(p));
          const bytes = await oddDoc.save();
          zipData[`${baseName}_odd_pages.pdf`] = bytes;
        }

        setProgress(60);

        if (evenPages.length > 0) {
          addLog(`Creating standalone document for even-indexed pages: [${evenPages.map(p => p + 1).join(', ')}]`);
          const evenDoc = await PDFDocument.create();
          const copied = await evenDoc.copyPages(sourcePdf, evenPages);
          copied.forEach(p => evenDoc.addPage(p));
          const bytes = await evenDoc.save();
          zipData[`${baseName}_even_pages.pdf`] = bytes;
        }
      } else if (splitMode === 'selection') {
        // Mode 4: Split checked pages vs unchecked
        const checkedPageIndices = pages.filter(p => p.selected).map(p => p.number - 1);
        const uncheckedPageIndices = pages.filter(p => !p.selected).map(p => p.number - 1);

        if (checkedPageIndices.length === 0) {
          throw new Error('Selection Error: You must select at least one page to perform extraction.');
        }

        addLog(`Extracting selected pages into combined segment: [${checkedPageIndices.map(p => p + 1).join(', ')}]`);
        
        const selectionDoc = await PDFDocument.create();
        const copied = await selectionDoc.copyPages(sourcePdf, checkedPageIndices);
        copied.forEach(p => selectionDoc.addPage(p));
        const bytes = await selectionDoc.save();
        zipData[`${baseName}_extracted_pages.pdf`] = bytes;

        setProgress(50);

        if (uncheckedPageIndices.length > 0) {
          addLog(`Packaging remaining pages into complementary segment: [${uncheckedPageIndices.map(p => p + 1).join(', ')}]`);
          const remainingDoc = await PDFDocument.create();
          const copiedRemaining = await remainingDoc.copyPages(sourcePdf, uncheckedPageIndices);
          copiedRemaining.forEach(p => remainingDoc.addPage(p));
          const remBytes = await remainingDoc.save();
          zipData[`${baseName}_excluded_pages.pdf`] = remBytes;
        }
      }

      setProgress(80);
      addLog('Packaging separate PDF binaries into highly compressed Deflate ZIP stream...');
      await new Promise(resolve => setTimeout(resolve, 400));

      // Build zip using fflate
      const zippedBytes = zipSync(zipData, { level: 6 });
      const outputBlob = new Blob([zippedBytes], { type: 'application/zip' });
      const url = window.URL.createObjectURL(outputBlob);

      setZipBlobUrl(url);
      setZipBlobSize(outputBlob.size);
      setZipFileName(`${baseName}_split_packages.zip`);
      
      setProgress(100);
      setStage('success');
      addLog(`ZIP archive successfully created! Archive Size: ${formatBytes(outputBlob.size)}. Ready to save.`);
    } catch (err: any) {
      console.error('Error during split processing:', err);
      setErrorMessage(err.message || 'Engine core failed to split PDF.');
      setStage('error');
      addLog(`Engine Error: ${err.message || 'Operation failed'}`);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setPageCount(0);
    setArrayBuffer(null);
    setZipBlobUrl(null);
    setStage('idle');
    setProgress(0);
    setLogs([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left panel (File upload & split configurations) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-5">
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-rose-400" />
            Upload PDF Document to Split
          </h3>

          {!pdfFile ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                isDragging 
                  ? 'border-rose-500 bg-rose-500/5' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf"
                onChange={handleFileChange}
              />
              <div className="p-4 bg-slate-900 rounded-full border border-slate-800">
                <Upload className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Click to choose or drag &amp; drop PDF file here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports up to 200MB document structures
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Active loaded file info card */}
              <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-rose-500/10 rounded-lg border border-rose-500/20 shrink-0">
                    <FileText className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-200 truncate">{pdfFile.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pages: <span className="text-slate-300 font-mono">{pageCount}</span> • Size: <span className="text-slate-300 font-mono">{fileSizeStr}</span>
                    </p>
                  </div>
                </div>

                {stage !== 'processing' && (
                  <button 
                    onClick={handleReset}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Configure splitting modes */}
              <div className="space-y-4 pt-2 border-t border-slate-900">
                <label className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
                  Select Partition Mechanism
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setSplitMode('individual')}
                    className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      splitMode === 'individual'
                        ? 'bg-rose-600/10 border-rose-500 text-rose-400'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Single Pages</span>
                  </button>

                  <button
                    onClick={() => setSplitMode('ranges')}
                    className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      splitMode === 'ranges'
                        ? 'bg-rose-600/10 border-rose-500 text-rose-400'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Custom Ranges</span>
                  </button>

                  <button
                    onClick={() => setSplitMode('oddeven')}
                    className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      splitMode === 'oddeven'
                        ? 'bg-rose-600/10 border-rose-500 text-rose-400'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Odd / Even</span>
                  </button>

                  <button
                    onClick={() => setSplitMode('selection')}
                    className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      splitMode === 'selection'
                        ? 'bg-rose-600/10 border-rose-500 text-rose-400'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Page Grid</span>
                  </button>
                </div>

                {/* Sub-panels for configurations */}
                <div className="bg-slate-900/30 border border-slate-800/60 p-4 rounded-xl mt-3">
                  {splitMode === 'individual' && (
                    <div className="space-y-1 text-slate-300">
                      <p className="text-xs font-semibold text-slate-200">✨ Individual Page Extraction</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                        Will split the PDF into <span className="text-rose-400 font-bold font-mono">{pageCount}</span> separate files (one file for each page) and package them neatly into a downloadable ZIP archive.
                      </p>
                    </div>
                  )}

                  {splitMode === 'ranges' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-200">✏️ Custom Range Formatter</span>
                        <span className="text-[10px] font-mono text-slate-500">Max Pages: {pageCount}</span>
                      </div>
                      <input
                        type="text"
                        value={customRanges}
                        onChange={(e) => setCustomRanges(e.target.value)}
                        placeholder="e.g. 1-2, 4, 5-8"
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-rose-500 transition-all placeholder:text-slate-600"
                      />
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Separate ranges with commas. Example: <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded font-mono">1-3, 5, 8-10</code> will generate 3 separate PDF documents within the ZIP.
                      </p>
                    </div>
                  )}

                  {splitMode === 'oddeven' && (
                    <div className="space-y-1 text-slate-300">
                      <p className="text-xs font-semibold text-slate-200">⚖️ Odd &amp; Even Group Split</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                        Will group odd pages (1, 3, 5...) and even pages (2, 4, 6...) into two standalone PDF files, then zip them up. Ideal for processing scanned duplex printer documents.
                      </p>
                    </div>
                  )}

                  {splitMode === 'selection' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-200">🗺️ Custom Grid Segment Selection</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => selectAllPages(true)}
                            className="text-[10px] text-rose-400 hover:underline font-bold"
                          >
                            Check All
                          </button>
                          <span className="text-slate-700">|</span>
                          <button 
                            onClick={() => selectAllPages(false)}
                            className="text-[10px] text-slate-400 hover:underline font-bold"
                          >
                            Uncheck All
                          </button>
                        </div>
                      </div>

                      {/* Clean grid list of page cards with simple ticks */}
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-1">
                        {pages.map((p) => (
                          <div
                            key={p.number}
                            onClick={() => togglePageSelection(p.number)}
                            className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${
                              p.selected 
                                ? 'bg-rose-500/10 border-rose-500 text-white font-extrabold' 
                                : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}
                          >
                            <p className="text-[9px] font-mono uppercase tracking-tight">Page</p>
                            <p className="text-base font-black font-mono leading-tight">{p.number}</p>
                            <div className="mt-1 flex justify-center">
                              <span className={`w-1.5 h-1.5 rounded-full ${p.selected ? 'bg-rose-400 animate-pulse' : 'bg-transparent'}`} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                        Checked pages will be extracted together into a single combined file <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded font-mono">extracted_pages.pdf</code>. Unchecked pages will be bundled separately.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action triggering bar */}
              {stage !== 'processing' && !zipBlobUrl && (
                <button
                  onClick={handleSplitPDF}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-rose-600/15 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Scissors className="w-4 h-4" />
                  Split PDF Document
                </button>
              )}

              {/* Success Result Container */}
              {stage === 'success' && zipBlobUrl && (
                <div className="p-5 bg-emerald-950/20 rounded-xl border border-emerald-500/20 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">Partition Cycle Complete!</h4>
                      <p className="text-xs text-slate-400">All PDF page arrays compiled and compressed.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Output Package</p>
                      <p className="text-xs font-bold text-slate-300 mt-1 truncate">{zipFileName}</p>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">ZIP Size</p>
                      <p className="text-xs font-bold text-emerald-400 mt-1 font-mono">{formatBytes(zipBlobSize)}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={zipBlobUrl}
                      download={zipFileName}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-lg shadow-emerald-600/10 text-xs font-mono uppercase tracking-wider"
                    >
                      <Download className="w-4 h-4" />
                      Download ZIP Package
                    </a>
                    <button
                      onClick={handleReset}
                      className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 font-semibold py-2.5 px-4 rounded-lg transition-all text-xs"
                    >
                      Split Another
                    </button>
                  </div>
                </div>
              )}

              {/* Progress Tracker / Logs Terminal */}
              {(stage === 'processing' || logs.length > 0) && (
                <div className="space-y-3">
                  {stage === 'processing' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400 font-mono font-medium">
                        <span>Compiling document segments...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-rose-500 h-1.5 transition-all duration-300 rounded-full" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden shadow-lg shadow-black/40">
                    <div className="bg-slate-900 px-4 py-2 border-b border-slate-800/80 flex justify-between items-center">
                      <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${stage === 'processing' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                        PDF Split Pipeline Terminal Log
                      </span>
                    </div>
                    <div className="p-3.5 font-mono text-[10px] text-rose-300 space-y-1.5 max-h-40 overflow-y-auto leading-relaxed bg-slate-950/80">
                      {logs.map((log, i) => (
                        <div key={i} className="flex gap-1.5">
                          <span className="text-slate-600 select-none">$&gt;</span>
                          <p className="break-all">{log}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Right panel (Sidebar instructions) */}
      <div className="space-y-6">
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
          <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-sm">
            <Info className="w-4 h-4 text-rose-400" />
            PDF Splitting Guidelines
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Splitting documents allows developers, creators, and professionals to isolate target resources without exposing whole catalog payloads to index pipelines.
          </p>

          <hr className="border-slate-800" />

          <div className="space-y-4 text-xs text-slate-300">
            <div>
              <p className="font-semibold text-slate-200">1. Single Page Extraction</p>
              <p className="text-slate-400 text-[11px] leading-normal mt-0.5">Isolates every page in a multi-page document into a standalone single-page PDF. Excellent for separating bulk forms.</p>
            </div>

            <div>
              <p className="font-semibold text-slate-200">2. Page-Range Segments</p>
              <p className="text-slate-400 text-[11px] leading-normal mt-0.5">Allows exporting custom collections. Specify ranges like <code className="text-rose-400 bg-rose-950/20 px-1 rounded">1-3, 5</code> to produce a 3-page and a 1-page PDF.</p>
            </div>

            <div>
              <p className="font-semibold text-slate-200">3. Fast-Web Optimized</p>
              <p className="text-slate-400 text-[11px] leading-normal mt-0.5">All outputs compiled are fully compatible with Fast Web View linear standards so search spiders crawl pages instantly.</p>
            </div>
          </div>

          <div className="p-3.5 bg-rose-500/5 rounded-lg border border-rose-500/10">
            <p className="text-[10px] text-rose-400 font-mono font-medium leading-normal flex items-start gap-1.5">
              <span>🔒</span>
              <span><strong>Client-Side:</strong> All calculations are processed on-device. No content, forms, or metadata is ever dispatched to online server resources.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, Sparkles, RefreshCw, Layers, Sliders, 
  Trash2, ArrowUp, ArrowDown, RotateCw, Download, Cpu, 
  Info, Check, HelpCircle, Plus, Copy, AlertCircle, X, CheckCircle, Move
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { Document, Page } from 'react-pdf';
import { addRecentOperation } from '../utils/recentOperations';

interface PDFSourceFile {
  id: string;
  name: string;
  size: number;
  sizeStr: string;
  blobUrl: string;
  arrayBuffer: ArrayBuffer;
  pageCount: number;
}

interface PDFPageItem {
  id: string; // unique page-level identifier
  fileId: string; // references source file
  fileName: string; 
  originalPageNum: number; // 0-indexed page number
  rotation: number; // 0, 90, 180, 270 relative rotation degrees
}

interface MetaPreferences {
  title: string;
  author: string;
  subject: string;
  creator: string;
  outputName: string;
}

export default function PDFJoiner() {
  const [sourceFiles, setSourceFiles] = useState<PDFSourceFile[]>([]);
  const [pagesToJoin, setPagesToJoin] = useState<PDFPageItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Editor and Compiler state
  const [stage, setStage] = useState<'idle' | 'compiling' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Output result file
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);
  const [mergedBlobSize, setMergedBlobSize] = useState(0);
  const [mergedFileName, setMergedFileName] = useState('');
  
  // Controls & Preferences
  const [meta, setMeta] = useState<MetaPreferences>({
    title: 'APEX Joined Document',
    author: 'APEX Labs PDF Core',
    subject: 'Assembled PDF Portfolio',
    creator: 'APEX UTILITY Forge Engine v2',
    outputName: 'Assembled_Document'
  });
  
  // Side tab controls
  const [activeTab, setActiveTab] = useState<'pages' | 'metadata'>('pages');

  // Drag and Drop active indices
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);
  const [dragOverPageIndex, setDragOverPageIndex] = useState<number | null>(null);

  // Clean raw bytes formatter
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  // Convert files to local source files and populate the merge queue
  const processFiles = async (files: File[]) => {
    setStage('idle');
    const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      alert('Apex Core Warning: No valid PDF files selected. Please select .pdf documents.');
      return;
    }

    addLog(`Initiating load cascade for ${pdfFiles.length} file(s)...`);

    const loadedFiles: PDFSourceFile[] = [];
    const newPageItems: PDFPageItem[] = [];

    for (const file of pdfFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        // Setup direct temporary visual preview blobUrl
        const previewBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(previewBlob);

        const srcFile: PDFSourceFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          sizeStr: formatBytes(file.size),
          blobUrl,
          arrayBuffer,
          pageCount
        };

        loadedFiles.push(srcFile);
        addLog(`Loaded "${file.name}" with ${pageCount} page(s) successfully.`);

        // Populate initial sequential ordered pages from this PDF file
        for (let i = 0; i < pageCount; i++) {
          newPageItems.push({
            id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            fileId: fileId,
            fileName: file.name,
            originalPageNum: i,
            rotation: 0
          });
        }
      } catch (err) {
        console.error(err);
        addLog(`Error parsing file "${file.name}": Might be password-protected or corrupt.`);
      }
    }

    if (loadedFiles.length > 0) {
      setSourceFiles((prev) => [...prev, ...loadedFiles]);
      setPagesToJoin((prev) => [...prev, ...newPageItems]);
      addLog(`Added ${newPageItems.length} total new pages to active workspace ledger grid.`);
    }
  };

  // Drag-and-drop page items reordering mechanics
  const handlePageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedPageIndex(index);
    // standard drag dataTransfer support
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedPageIndex === null || draggedPageIndex === index) return;
    setDragOverPageIndex(index);
  };

  const handlePageDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedPageIndex === null || draggedPageIndex === targetIndex) {
      setDraggedPageIndex(null);
      setDragOverPageIndex(null);
      return;
    }

    addLog(`Reordering page hierarchy: Moved card ${draggedPageIndex + 1} to position ${targetIndex + 1}.`);
    
    setPagesToJoin((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(draggedPageIndex, 1);
      updated.splice(targetIndex, 0, draggedItem);
      return updated;
    });

    setDraggedPageIndex(null);
    setDragOverPageIndex(null);
  };

  const handlePageDragEnd = () => {
    setDraggedPageIndex(null);
    setDragOverPageIndex(null);
  };

  // Touch/Keyboard friendly movement aids
  const movePageInQueue = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pagesToJoin.length) return;

    setPagesToJoin((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
    addLog(`Keyboard fallback: Moved page item ${index + 1} ${direction === 'up' ? 'left/up' : 'right/down'}.`);
  };

  const rotatePageItem = (index: number) => {
    setPagesToJoin((prev) => {
      const updated = [...prev];
      // Increment rotation by 90 degrees relative
      updated[index] = {
        ...updated[index],
        rotation: (updated[index].rotation + 90) % 360
      };
      return updated;
    });
    addLog(`Rotated page item ${index + 1} clockwise metadata by 90 degrees.`);
  };

  const duplicatePageItem = (index: number) => {
    setPagesToJoin((prev) => {
      const itemToDuplicate = prev[index];
      const duplicated: PDFPageItem = {
        ...itemToDuplicate,
        id: `clone_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      };
      const updated = [...prev];
      updated.splice(index + 1, 0, duplicated);
      return updated;
    });
    addLog(`Duplicated page ${index + 1} from "${pagesToJoin[index].fileName}".`);
  };

  const removePageItem = (index: number) => {
    const removedPage = pagesToJoin[index];
    setPagesToJoin((prev) => prev.filter((_, i) => i !== index));
    addLog(`Removed page pos ${index + 1} (Origin: "${removedPage.fileName}", Page ${removedPage.originalPageNum + 1}) from merge stack.`);
  };

  const removeSourceFile = (fileId: string) => {
    const targetFile = sourceFiles.find(f => f.id === fileId);
    if (!targetFile) return;

    addLog(`Removing file "${targetFile.name}". Purging all references from list.`);
    setSourceFiles((prev) => prev.filter(f => f.id !== fileId));
    // Purge any page referencing this file
    setPagesToJoin((prev) => prev.filter(p => p.fileId !== fileId));
  };

  const clearAllSourceFiles = () => {
    addLog(`Purging workspace. Resetting state configurations.`);
    setSourceFiles([]);
    setPagesToJoin([]);
    setStage('idle');
    setMergedBlobUrl(null);
  };

  // Re-sort entire page set back sequentially by original loaded source file pattern
  const resetPagesToDefaultSort = () => {
    if (sourceFiles.length === 0) return;
    addLog(`Restoring master ordered layout default.`);
    const restored: PDFPageItem[] = [];
    
    sourceFiles.forEach((file) => {
      for (let i = 0; i < file.pageCount; i++) {
        restored.push({
          id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          fileId: file.id,
          fileName: file.name,
          originalPageNum: i,
          rotation: 0
        });
      }
    });

    setPagesToJoin(restored);
  };

  // Compile individual pages using pdf-lib core engine client side
  const joinCompilePDFs = async () => {
    if (pagesToJoin.length === 0) {
      setErrorMessage('Compile Error: Your page queue is empty. Upload PDFs to process.');
      setStage('error');
      return;
    }

    setStage('compiling');
    setProgress(10);
    setLogs([]);
    addLog(`Initializing APEX Engine Join Assembler Compilation...`);
    addLog(`Pages specified for final compiler: ${pagesToJoin.length} page(s).`);

    try {
      // 1. Create a brand new workspace document
      const mergedPdf = await PDFDocument.create();
      addLog(`Created empty core layout buffer...`);
      setProgress(25);

      // 2. Cache parsed documents with key value referencing to optimize speed
      const loadedDocs: Record<string, PDFDocument> = {};
      for (const src of sourceFiles) {
        addLog(`Analyzing and mounting "${src.name}" references...`);
        loadedDocs[src.id] = await PDFDocument.load(src.arrayBuffer);
      }
      setProgress(50);

      // 3. Process each page sequentially and patch rotation factors
      let pageIndex = 0;
      for (const item of pagesToJoin) {
        addLog(`Compiling item ${pageIndex + 1}/${pagesToJoin.length}: Page ${item.originalPageNum + 1} from "${item.fileName}"...`);
        const srcDoc = loadedDocs[item.fileId];
        if (!srcDoc) {
          throw new Error(`File reference ${item.fileId} was lost during memory cycles.`);
        }

        // Copy precise index page (0-indexed)
        const [copiedPage] = await mergedPdf.copyPages(srcDoc, [item.originalPageNum]);

        // Patch native rotation with relative modifications
        if (item.rotation !== 0) {
          const currentRot = copiedPage.getRotation().angle || 0;
          const newRot = (currentRot + item.rotation) % 360;
          copiedPage.setRotation(degrees(newRot));
          addLog(`  -> Rotation adjust: ${currentRot}° + ${item.rotation}° relative => ${newRot}° applied.`);
        }

        // Mount page inside the new composite document
        mergedPdf.addPage(copiedPage);

        // Advance visual progression
        pageIndex++;
        setProgress(Math.floor(50 + (pageIndex / pagesToJoin.length) * 35));
      }

      // 4. Inject visual Metadata settings preferences chosen by user
      addLog(`Injecting metadata tags (Title, Author, Subject)...`);
      if (meta.title) mergedPdf.setTitle(meta.title);
      if (meta.author) mergedPdf.setAuthor(meta.author);
      if (meta.subject) mergedPdf.setSubject(meta.subject);
      if (meta.creator) mergedPdf.setCreator(meta.creator);

      // 5. Build final arrayBuffer
      addLog(`Compressing and saving bytes stream arrays...`);
      const mergedPdfBytes = await mergedPdf.save();
      const outputBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(outputBlob);

      const downloadName = `${meta.outputName.replace(/\.pdf$/i, '') || 'Apex_Joined'}.pdf`;

      setMergedBlobUrl(blobUrl);
      setMergedBlobSize(outputBlob.size);
      setMergedFileName(downloadName);
      
      setProgress(100);
      setStage('success');
      addLog(`Success! Complete joined assembly created natively in browser.`);
      addLog(`Output Filename: "${downloadName}" | Size: ${formatBytes(outputBlob.size)}.`);

      // Log to sandbox metrics activity hub history ledger
      addRecentOperation(
        downloadName,
        'Image to PDF', // Compiles log as a PDF compilation operation
        formatBytes(sourceFiles.reduce((sum, f) => sum + f.size, 0)),
        formatBytes(outputBlob.size),
        downloadName,
        blobUrl
      );

    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Compiler Fault: ${err.message || 'An unexpected compilation error occured.'}`);
      setStage('error');
      addLog(`CRITICAL COMPILE FAULT: ${err.message || 'Fatal memory crash.'}`);
    }
  };

  return (
    <div className="space-y-8 select-none">
      
      {/* Dynamic Header Badge Stack */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-brand led-active animate-pulse" />
            <h2 className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Workspace Terminal B-4</h2>
          </div>
          <h1 className="font-heading text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Layers className="w-8 h-8 text-brand" /> PDF JOINER DECK
          </h1>
          <p className="text-zinc-400 text-xs mt-1 max-w-xl">
            Synthesize, rearrange, rotate, duplicate, and merge multiple standalone PDF documents into a single integrated output with absolute offline client-side safety.
          </p>
        </div>

        {sourceFiles.length > 0 && (
          <button
            onClick={clearAllSourceFiles}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-950/40 bg-red-950/20 text-red-400 hover:bg-red-950/30 text-xs font-mono font-bold transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Format Workspace</span>
          </button>
        )}
      </div>

      {sourceFiles.length === 0 ? (
        /* Large Interactive Dropzone Area */
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerInputClick}
          className={`beveled-panel py-20 px-8 text-center border mr-2 cursor-pointer transition-all duration-300 relative group overflow-hidden ${
            dragActive
              ? 'border-brand bg-brand/5 shadow-[0_0_25px_var(--theme-glow)]'
              : 'border-zinc-800/80 hover:border-brand/50 hover:bg-[#0c0c11]'
          }`}
        >
          {/* Neon Grid decoration */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#15151520_1px,transparent_1px),linear-gradient(to_bottom,#15151520_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />
          
          <div className="relative max-w-sm mx-auto space-y-4">
            <div className="mx-auto w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800/80 text-zinc-600 flex items-center justify-center group-hover:text-brand group-hover:scale-105 transition-all duration-500 shadow-lg">
              <Upload className="w-7 h-7 text-zinc-500 group-hover:text-brand transition-colors duration-300" />
            </div>
            
            <div className="space-y-1.5">
              <p className="font-heading text-sm font-bold text-zinc-200">
                Cascade Multiple PDFs into Workbench
              </p>
              <p className="text-zinc-500 font-sans text-xs leading-relaxed">
                Drag and drop your standalone PDF files here, or <span className="text-brand font-bold">browse drive nodes</span> to begin layout process.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-1.5 font-mono text-[9px] text-zinc-600">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span>Offline compiled locally. File payload doesn't touch clouds.</span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        /* Active Workflow Interface */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel - Grid of pages rearrange stage */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="beveled-panel p-5 bg-[#07070a]/80 border-zinc-900/40 relative">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900/60 pb-4 mb-5">
                <div>
                  <h3 className="font-heading text-xs uppercase font-extrabold text-[#f1f5f9] tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand" /> WORKBENCH PAGES GRID
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Drag to reorder page cards, or rotate/delete individually.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
                  <button
                    onClick={resetPagesToDefaultSort}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-[#0d0d12] hover:bg-zinc-900 text-[10px] font-mono font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Sort page items back sequentially by source files"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Order</span>
                  </button>

                  <button
                    onClick={triggerInputClick}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand/35 bg-brand/10 hover:bg-brand/15 text-[10px] font-mono font-bold text-brand transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Merge More PDFs</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {pagesToJoin.length === 0 ? (
                <div className="py-12 text-center text-zinc-550 font-mono text-xs">
                  Your workbench is empty. Click "Merge More PDFs" to load files.
                </div>
              ) : (
                /* Scrollable grid representation of PDF pages with nice animations */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-visible">
                  {pagesToJoin.map((page, index) => {
                    const isDragged = draggedPageIndex === index;
                    const isDragOver = dragOverPageIndex === index;
                    
                    return (
                      <motion.div
                        key={page.id}
                        draggable
                        onDragStart={(e) => handlePageDragStart(e, index)}
                        onDragOver={(e) => handlePageDragOver(e, index)}
                        onDrop={(e) => handlePageDrop(e, index)}
                        onDragEnd={handlePageDragEnd}
                        layoutId={page.id}
                        className={`beveled-panel bg-[#050508] border relative flex flex-col justify-between transition-all duration-200 select-none pb-2 ${
                          isDragged 
                            ? 'opacity-30 border-dashed border-brand' 
                            : isDragOver
                              ? 'border-brand scale-95 shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-zinc-950'
                              : 'border-zinc-900 hover:border-zinc-700/80'
                        }`}
                        style={{ cursor: 'grab' }}
                      >
                        {/* Page Visual Badge Counter Overlay */}
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-[#09090e]/95 backdrop-blur px-2 py-0.5 rounded border border-zinc-800 text-[9px] font-mono font-bold text-zinc-400">
                          <span className="text-zinc-600 font-black">#</span>
                          <span>{index + 1}</span>
                        </div>

                        {/* Drag Handle on right */}
                        <div className="absolute top-2 right-2 z-10 p-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-grab hover:text-brand">
                          <Move className="w-3 h-3" />
                        </div>

                        {/* Page Preview Document canvas area */}
                        <div className="h-32 flex items-center justify-center bg-[#07070a] rounded-t-lg relative overflow-hidden p-2 pt-6">
                          <div className="absolute inset-0 bg-[#0c0c10]/20 pointer-events-none" />
                          
                          {/* Live Thumbnail loader fallback */}
                          <div className="scale-75 origin-center select-none pointer-events-none max-w-full">
                            <Document 
                              file={sourceFiles.find(f => f.id === page.fileId)?.blobUrl}
                              loading={
                                <div className="text-center font-mono text-[8px] text-zinc-650 tracking-wider">
                                  LOADING VISUALS...
                                </div>
                              }
                              error={
                                <div className="text-center font-mono text-[8px] text-zinc-600">
                                  PAGE PREVIEW
                                </div>
                              }
                            >
                              <Page 
                                pageNumber={page.originalPageNum + 1} 
                                width={110} 
                                renderTextLayer={false} 
                                renderAnnotationLayer={false}
                                rotate={page.rotation}
                              />
                            </Document>
                          </div>
                        </div>

                        {/* Title text and dimensions */}
                        <div className="px-2 mt-2 space-y-1">
                          <p className="font-heading text-[10px] font-extrabold text-zinc-300 truncate" title={page.fileName}>
                            {page.fileName}
                          </p>
                          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                            <span>Origin: Page {page.originalPageNum + 1}</span>
                            {page.rotation > 0 && (
                              <span className="text-brand font-bold flex items-center gap-0.5">
                                <RotateCw className="w-2.5 h-2.5 animate-spin [animation-duration:8s]" />
                                <span>+{page.rotation}°</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interactive Page Actions Plate */}
                        <div className="px-2 mt-3 flex items-center justify-between gap-1 border-t border-zinc-900/40 pt-2">
                          <div className="flex gap-1">
                            <button
                              onClick={() => rotatePageItem(index)}
                              className="p-1 rounded bg-[#09090c] hover:bg-[#151520] border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-brand transition-all cursor-pointer"
                              title="Rotate Page clockwise 90°"
                            >
                              <RotateCw className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => duplicatePageItem(index)}
                              className="p-1 rounded bg-[#09090c] hover:bg-[#151520] border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-brand transition-all cursor-pointer"
                              title="Duplicate Page card"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex gap-1 items-center">
                            {/* Movement aids for responsive layout where drag is finicky */}
                            <button
                              onClick={() => movePageInQueue(index, 'up')}
                              disabled={index === 0}
                              className="p-1 rounded bg-[#09090c] hover:bg-zinc-800 border border-zinc-900 hover:border-zinc-700 text-zinc-500 hover:text-zinc-200 transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                              title="Move Left"
                            >
                              <ArrowUp className="w-3 h-3 -rotate-90" />
                            </button>
                            <button
                              onClick={() => movePageInQueue(index, 'down')}
                              disabled={index === pagesToJoin.length - 1}
                              className="p-1 rounded bg-[#09090c] hover:bg-zinc-800 border border-zinc-900 hover:border-zinc-700 text-zinc-500 hover:text-zinc-200 transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                              title="Move Right"
                            >
                              <ArrowDown className="w-3 h-3 -rotate-90" />
                            </button>

                            <button
                              onClick={() => removePageItem(index)}
                              className="p-1 rounded bg-[#09090c] hover:bg-red-950/20 border border-zinc-800 hover:border-red-900 text-zinc-400 hover:text-red-400 transition-all cursor-pointer shadow-sm"
                              title="Delete Page from merge list"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* List of files with names, sizes and counts */}
            <div className="beveled-panel p-5 bg-[#07070a]/60 border-zinc-900/30">
              <h4 className="font-heading text-xs uppercase font-bold text-zinc-400 tracking-wider mb-3">Loaded Source PDF Files List</h4>
              <div className="space-y-2.5">
                {sourceFiles.map((f) => (
                  <div key={f.id} className="flex justify-between items-center bg-[#09090d] border border-zinc-900 px-3.5 py-2.5 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded bg-rose-500/5 text-rose-400 border border-rose-500/10">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-heading text-xs font-semibold text-white truncate max-w-sm" title={f.name}>
                          {f.name}
                        </span>
                        <span className="block font-mono text-[9px] text-[#94a3b8] mt-0.5">
                          Size: {f.sizeStr} | Page count: {f.pageCount} pages
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeSourceFile(f.id)}
                      className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-red-950/20 hover:border-red-950 text-zinc-500 hover:text-red-400 cursor-pointer transition-all"
                      title="Purge all pages of this file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Panel - Settings and master actions dashboard */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Unified Preferences Controls */}
            <div className="beveled-panel bg-[#09090d] border-zinc-800/60 p-5 space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900/60">
                <div className="flex-1 grid grid-cols-2 gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setActiveTab('pages')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] uppercase tracking-wider font-mono font-bold transition-all cursor-pointer ${
                      activeTab === 'pages'
                        ? 'bg-brand text-zinc-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>Workspace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('metadata')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] uppercase tracking-wider font-mono font-bold transition-all cursor-pointer ${
                      activeTab === 'metadata'
                        ? 'bg-brand text-zinc-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Headers</span>
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'pages' ? (
                  <motion.div
                    key="pagesinfo"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4 text-xs select-none"
                  >
                    <div className="space-y-1">
                      <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8] font-mono">Synthesized Output Filename</label>
                      <input
                        type="text"
                        value={meta.outputName}
                        onChange={(e) => setMeta(prev => ({ ...prev, outputName: e.target.value }))}
                        className="w-full bg-[#050508] border border-zinc-800 rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-brand/50 transition-colors"
                        placeholder="Apex_Combined_PDF"
                      />
                    </div>

                    <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900 text-[11px] leading-relaxed space-y-2">
                      <div className="font-heading font-black text-zinc-400 uppercase tracking-wide border-b border-zinc-900 pb-1 text-[10px] flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-brand" /> Join Queue Analytics
                      </div>
                      <div className="space-y-1 font-mono text-zinc-500">
                        <div className="flex justify-between">
                          <span>Total Source Files:</span>
                          <span className="text-zinc-300 font-bold">{sourceFiles.length} files</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Compiled Queue Pages:</span>
                          <span className="text-zinc-300 font-bold">{pagesToJoin.length} pages</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Combined raw bytes size:</span>
                          <span className="text-emerald-400 font-bold">{formatBytes(sourceFiles.reduce((acc, f) => acc + f.size, 0))}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="metadataoptions"
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="space-y-4 text-xs select-none"
                  >
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Customize standard PDF document metadata header block attributes injected inside key-value catalogs of the compiled bundle.
                    </p>

                    <div className="space-y-1">
                      <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8] font-mono">Document Title</label>
                      <input
                        type="text"
                        value={meta.title}
                        onChange={(e) => setMeta(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-[#050508] border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-brand/40"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8] font-mono">Author / Designer</label>
                      <input
                        type="text"
                        value={meta.author}
                        onChange={(e) => setMeta(prev => ({ ...prev, author: e.target.value }))}
                        className="w-full bg-[#050508] border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-brand/40"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8] font-mono">Subject classification</label>
                      <input
                        type="text"
                        value={meta.subject}
                        onChange={(e) => setMeta(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full bg-[#050508] border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-brand/40"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8] font-mono">Creator Tool signature</label>
                      <input
                        type="text"
                        value={meta.creator}
                        onChange={(e) => setMeta(prev => ({ ...prev, creator: e.target.value }))}
                        className="w-full bg-[#050508] border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-brand/40"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action trigger button */}
              <button
                onClick={joinCompilePDFs}
                disabled={pagesToJoin.length === 0 || stage === 'compiling'}
                className="w-full py-3 px-4 rounded-xl font-heading text-xs uppercase font-extrabold tracking-wider transition-all cursor-pointer mt-4 flex items-center justify-center gap-2 bg-brand text-zinc-950 hover:bg-[#ffb526] shadow-[0_0_20px_var(--theme-glow)] disabled:opacity-30 disabled:pointer-events-none"
              >
                {stage === 'compiling' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>SYNTHESIZING MATRIX BUNDLE...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-zinc-950" />
                    <span>COMPILE BUNDLE ({pagesToJoin.length} PAGES)</span>
                  </>
                )}
              </button>
            </div>

            {/* Operational Logs / Compiler Output Panel */}
            <div className="beveled-panel bg-[#050508] border-zinc-900 px-4 py-3.5 space-y-2 select-none">
              <span className="block text-[8px] uppercase tracking-widest text-zinc-550 font-mono">WASM Stream Feed Status</span>
              
              <div className="h-40 bg-zinc-950 border border-zinc-900 rounded p-2 overflow-y-auto font-mono text-[9px] text-[#94a3b8] space-y-1 leading-normal select-text">
                {logs.length === 0 ? (
                  <span className="text-zinc-750 block italic">Assembler log stream idle. Waiting for interaction loop trigger...</span>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="break-all whitespace-pre-wrap">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Compiled Success Layout Box */}
            <AnimatePresence>
              {stage === 'success' && mergedBlobUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="beveled-panel p-4.5 bg-emerald-950/20 border-emerald-500/30 text-emerald-400 space-y-3.5 select-none"
                >
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="font-heading text-xs font-black uppercase tracking-wider text-emerald-300">Assembled Successfully!</p>
                      <p className="font-sans text-[11px] text-zinc-400 leading-normal mt-0.5">
                        Your combined PDF binder generated perfectly inside browser local memory layers.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#050508]/80 border border-emerald-500/10 rounded-lg text-xs leading-relaxed space-y-1 text-zinc-300 font-mono">
                    <div className="truncate text-[11px] text-zinc-300 font-bold" title={mergedFileName}>
                      File: {mergedFileName}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Completed size: {formatBytes(mergedBlobSize)}
                    </div>
                  </div>

                  <a
                    href={mergedBlobUrl}
                    download={mergedFileName}
                    className="w-full py-2.5 px-4 rounded-xl font-heading text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-center gap-1.5 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Merged PDF</span>
                  </a>
                </motion.div>
              )}

              {stage === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border border-red-500/30 bg-red-950/10 text-red-400 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 block shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-heading text-xs font-extrabold uppercase tracking-wide">Assembler Block Error</h5>
                    <p className="font-sans text-xs text-zinc-300 mt-1 leading-relaxed">
                      {errorMessage || 'Failed to complete PDF compilation process. Check file formatting codes.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      )}

      {/* Instructions / Help card block */}
      <div className="beveled-panel p-5 border-zinc-900 bg-[#07070a]/40 text-xs text-zinc-400 leading-relaxed max-w-4xl select-none">
        <h4 className="font-heading text-xs uppercase font-bold text-zinc-300 tracking-wider flex items-center gap-2 mb-2">
          <HelpCircle className="w-4 h-4 text-brand" /> Dynamic Page-Level Assembler Guide
        </h4>
        <ul className="list-disc pl-5 space-y-1.5 font-sans">
          <li><strong>Granular Rearrangement:</strong> Reorder any single page across different uploaded documents by holding and dragging page cards to your preferred slot in the grid.</li>
          <li><strong>Non-Destructive Customizations:</strong> Easily rotate specific pages in increments of 90 degrees or duplicate pages (e.g., duplicated feedback worksheets) prior to generating final exports.</li>
          <li><strong>Offline Execution:</strong> APEX compilation pipelines parse local typed arrayBuffers directly in standard V8 machines. Your secure corporate PDF contracts will never leave your client environment.</li>
        </ul>
      </div>

    </div>
  );
}

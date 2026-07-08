import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, Sparkles, RefreshCw, Layers, Sliders, 
  Trash2, RotateCw, RotateCcw, Download, Cpu, Info, Check, 
  HelpCircle, Plus, Copy, AlertCircle, X, CheckCircle, Move, 
  BookOpen, Undo, Redo, ZoomIn, ZoomOut, Eye, Settings, Maximize2, Trash
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import { addRecentOperation } from '../utils/recentOperations';

// Bind workers cleanly from standard CDN using version-specific template
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PDFPageItem {
  id: string; // unique page item id
  originalIndex: number; // 0-indexed original page number
  rotation: number; // 0, 90, 180, 270 relative rotation degrees
}

interface MetaPreferences {
  title: string;
  author: string;
  subject: string;
  creator: string;
  outputName: string;
}

export default function VisualPDFOrganizer() {
  // Original file state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [originalPageCount, setOriginalPageCount] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active state lists
  const [pages, setPages] = useState<PDFPageItem[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  
  // History states for Undo/Redo
  const [history, setHistory] = useState<PDFPageItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Layout Preferences
  const [cardSize, setCardSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [meta, setMeta] = useState<MetaPreferences>({
    title: 'APEX Organized Document',
    author: 'APEX Labs PDF Core',
    subject: 'Rearranged PDF Portfolio',
    creator: 'APEX UTILITY Forge Engine v2',
    outputName: 'Organized_Document'
  });

  // Editor and Compiler states
  const [stage, setStage] = useState<'idle' | 'compiling' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Compiled output
  const [compiledBlobUrl, setCompiledBlobUrl] = useState<string | null>(null);
  const [compiledBlobSize, setCompiledBlobSize] = useState(0);
  const [compiledFileName, setCompiledFileName] = useState('');

  // Interactive page preview modal
  const [previewPageNumber, setPreviewPageNumber] = useState<number | null>(null);

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

  // Set up history tracking
  const pushToHistory = (newPages: PDFPageItem[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newPages);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setPages(history[prevIndex]);
      addLog(`Undid last action.`);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setPages(history[nextIndex]);
      addLog(`Redid last action.`);
    }
  };

  // Drag and drop handshakes
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

  // Main file loader
  const loadPDFFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Visual PDF Organizer warning: Please select a valid .pdf document.');
      return;
    }

    setStage('idle');
    setCompiledBlobUrl(null);
    setLogs([]);
    setProgress(0);
    setSelectedPageIds(new Set());

    addLog(`Loading source file "${file.name}"...`);

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);
      const count = pdfDoc.getPageCount();

      // Formulate unique page representations
      const pageList: PDFPageItem[] = [];
      for (let i = 0; i < count; i++) {
        pageList.push({
          id: `p-${i}-${Math.random().toString(36).substr(2, 9)}`,
          originalIndex: i,
          rotation: 0
        });
      }

      setPdfFile(file);
      setFileSizeStr(formatBytes(file.size));
      setBlobUrl(URL.createObjectURL(file));
      setArrayBuffer(buffer);
      setOriginalPageCount(count);
      setPages(pageList);

      // Reset Undo/Redo stack with initial state
      setHistory([pageList]);
      setHistoryIndex(0);

      // Auto-populate initial output name suggestion
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setMeta(m => ({ ...m, outputName: `${nameWithoutExt}_organized` }));

      addLog(`Loaded "${file.name}" successfully. Pages detected: ${count}`);
    } catch (err: any) {
      console.error('PDF parsing failed:', err);
      alert('Failed to parse PDF document. It may be password-protected or corrupted.');
    }
  };

  // Reordering Drag and Drop handlers
  const handlePageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedPageIndex(index);
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

    addLog(`Reordering layout: Moved card from position ${draggedPageIndex + 1} to position ${targetIndex + 1}.`);

    const updated = [...pages];
    const [draggedItem] = updated.splice(draggedPageIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);

    setPages(updated);
    pushToHistory(updated);

    setDraggedPageIndex(null);
    setDragOverPageIndex(null);
  };

  // Rotation and delete triggers
  const rotatePage = (index: number, direction: 'cw' | 'ccw') => {
    const updated = [...pages];
    const page = updated[index];
    const delta = direction === 'cw' ? 90 : -90;
    page.rotation = (page.rotation + delta + 360) % 360;
    
    setPages(updated);
    pushToHistory(updated);
    addLog(`Rotated page ${index + 1} to ${page.rotation} degrees.`);
  };

  const deletePage = (index: number) => {
    const pageNum = pages[index].originalIndex + 1;
    addLog(`Pruned Page ${pageNum} (Item position ${index + 1}) from workspace.`);
    
    const updated = pages.filter((_, idx) => idx !== index);
    setPages(updated);
    pushToHistory(updated);
  };

  // Selection state helpers
  const togglePageSelection = (id: string) => {
    const next = new Set(selectedPageIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPageIds(next);
  };

  const selectAll = () => {
    const next = new Set<string>();
    pages.forEach(p => next.add(p.id));
    setSelectedPageIds(next);
    addLog(`Selected all ${pages.length} pages.`);
  };

  const clearSelection = () => {
    setSelectedPageIds(new Set());
    addLog(`Cleared selection.`);
  };

  // Bulk Actions
  const bulkRotate = (direction: 'cw' | 'ccw') => {
    if (selectedPageIds.size === 0) return;
    const delta = direction === 'cw' ? 90 : -90;
    const updated = pages.map(p => {
      if (selectedPageIds.has(p.id)) {
        return { ...p, rotation: (p.rotation + delta + 360) % 360 };
      }
      return p;
    });

    setPages(updated);
    pushToHistory(updated);
    addLog(`Rotated ${selectedPageIds.size} selected pages.`);
  };

  const bulkDelete = () => {
    if (selectedPageIds.size === 0) return;
    const updated = pages.filter(p => !selectedPageIds.has(p.id));
    setPages(updated);
    pushToHistory(updated);
    addLog(`Deleted ${selectedPageIds.size} selected pages.`);
    setSelectedPageIds(new Set());
  };

  const handleReset = () => {
    if (!pdfFile || !arrayBuffer) return;
    addLog(`Resetting workspace back to original file layout.`);
    
    const pageList: PDFPageItem[] = [];
    for (let i = 0; i < originalPageCount; i++) {
      pageList.push({
        id: `p-${i}-${Math.random().toString(36).substr(2, 9)}`,
        originalIndex: i,
        rotation: 0
      });
    }

    setPages(pageList);
    setSelectedPageIds(new Set());
    setHistory([pageList]);
    setHistoryIndex(0);
  };

  // Core compiling logic
  const handleCompile = async () => {
    if (pages.length === 0) {
      alert('Visual PDF Organizer error: Cannot compile an empty PDF document. Please keep at least 1 page.');
      return;
    }

    setStage('compiling');
    setProgress(10);
    setLogs([]);
    addLog(`Initializing Visual PDF Compiler Forge...`);
    addLog(`Preparing target page stream of ${pages.length} pages.`);

    try {
      // 1. Create empty PDF Document
      const organizedPdf = await PDFDocument.create();
      addLog(`Created empty core layout buffer...`);
      setProgress(25);

      // 2. Load original PDF bytes
      addLog(`Mounting original PDF references...`);
      const srcDoc = await PDFDocument.load(arrayBuffer!);
      setProgress(50);

      // 3. Sequential page merge and native rotation patching
      let compiledIndex = 0;
      for (const item of pages) {
        addLog(`Compiling page item ${compiledIndex + 1}/${pages.length}: Source Page ${item.originalIndex + 1}...`);
        
        // Copy original page
        const [copiedPage] = await organizedPdf.copyPages(srcDoc, [item.originalIndex]);

        // Adjust rotation relative to original rotation
        if (item.rotation !== 0) {
          const currentRot = copiedPage.getRotation().angle || 0;
          const newRot = (currentRot + item.rotation) % 360;
          copiedPage.setRotation(degrees(newRot));
          addLog(`  -> Appending rotation: ${currentRot}° + ${item.rotation}° => ${newRot}° applied.`);
        }

        organizedPdf.addPage(copiedPage);

        compiledIndex++;
        setProgress(Math.floor(50 + (compiledIndex / pages.length) * 35));
      }

      // 4. Inject visual metadata
      addLog(`Configuring custom file metadata properties...`);
      if (meta.title) organizedPdf.setTitle(meta.title);
      if (meta.author) organizedPdf.setAuthor(meta.author);
      if (meta.subject) organizedPdf.setSubject(meta.subject);
      if (meta.creator) organizedPdf.setCreator(meta.creator);

      // 5. Serialize bytes and output object URL
      addLog(`Serializing compiled PDF stream array...`);
      const outputBytes = await organizedPdf.save();
      const outputBlob = new Blob([outputBytes], { type: 'application/pdf' });
      const finalUrl = URL.createObjectURL(outputBlob);

      setCompiledBlobUrl(finalUrl);
      setCompiledBlobSize(outputBytes.length);
      
      const fileOutName = meta.outputName.endsWith('.pdf') ? meta.outputName : `${meta.outputName}.pdf`;
      setCompiledFileName(fileOutName);

      setProgress(100);
      setStage('success');
      addLog(`PDF compilation successful! Generated "${fileOutName}" (${formatBytes(outputBytes.length)}).`);

      // Track recent operation for local dashboard storage
      addRecentOperation(
        fileOutName,
        'Image to PDF',
        fileSizeStr,
        formatBytes(outputBytes.length),
        fileOutName,
        finalUrl
      );

    } catch (err: any) {
      console.error('Compilation failed:', err);
      setErrorMessage(err.message || 'Error occurred during PDF restructuring cycle.');
      setStage('error');
      addLog(`[ERROR] PDF compilation failed: ${err.message}`);
    }
  };

  // Card Size parameters
  const getCardClasses = () => {
    switch (cardSize) {
      case 'sm': return 'w-24 h-32 text-[9px]';
      case 'lg': return 'w-48 h-64 text-xs';
      default: return 'w-36 h-48 text-xs';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header Overview */}
      <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Interactive Page Workspace
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Visual PDF Page Organizer
            </h2>
            <p className="text-zinc-400 text-xs max-w-2xl">
              Arrange pages on an interactive thumbnail canvas. Easily drag to reorder, click to rotate, or prune pages to design custom-assembled documents. Everything is processed offline inside your browser for total confidentiality.
            </p>
          </div>
        </div>
      </div>

      {!pdfFile ? (
        /* Upload Area */
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerInputClick}
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden group ${
            dragActive 
              ? 'border-emerald-500 bg-emerald-950/10' 
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
            <Upload className="w-8 h-8 text-emerald-400" />
          </div>

          <h3 className="text-sm font-bold text-white mb-1.5">
            Drag and drop your PDF here
          </h3>
          <p className="text-zinc-500 text-xs max-w-xs leading-relaxed mb-6">
            Supporting any multipage PDF file. Your file stays local and is never uploaded to any external server.
          </p>

          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerInputClick();
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition-colors cursor-pointer"
          >
            Browse Files
          </button>
        </div>
      ) : (
        /* Interactive Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Workspace Canvas (Col Span 8) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Toolbar Panel */}
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
              
              {/* File Info & Undo/Redo */}
              <div className="flex items-center gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white truncate max-w-[200px]" title={pdfFile.name}>
                    {pdfFile.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {fileSizeStr} • {originalPageCount} original pages • {pages.length} remaining
                  </p>
                </div>

                <div className="h-6 w-[1px] bg-zinc-850" />

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Undo last action"
                  >
                    <Undo className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Redo last action"
                  >
                    <Redo className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Settings, zoom, and reset */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Card Size Selection */}
                <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px] font-mono">
                  <button
                    onClick={() => setCardSize('sm')}
                    className={`px-2 py-1 rounded-md cursor-pointer ${cardSize === 'sm' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Small
                  </button>
                  <button
                    onClick={() => setCardSize('md')}
                    className={`px-2 py-1 rounded-md cursor-pointer ${cardSize === 'md' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => setCardSize('lg')}
                    className={`px-2 py-1 rounded-md cursor-pointer ${cardSize === 'lg' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Large
                  </button>
                </div>

                <div className="h-6 w-[1px] bg-zinc-850" />

                <button
                  onClick={handleReset}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>

            </div>

            {/* Selection Bulk Action Bar */}
            <AnimatePresence>
              {selectedPageIds.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-2"
                >
                  <span className="text-xs font-medium text-emerald-300 font-sans">
                    {selectedPageIds.size} of {pages.length} pages selected
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => bulkRotate('cw')}
                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3 text-emerald-400" />
                      Rotate CW 90°
                    </button>
                    <button
                      onClick={() => bulkRotate('ccw')}
                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-emerald-400" />
                      Rotate CCW 90°
                    </button>
                    <button
                      onClick={bulkDelete}
                      className="px-2.5 py-1.5 bg-red-950/30 hover:bg-red-900/40 border border-red-500/20 hover:border-red-500/40 text-red-400 text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Trash className="w-3 h-3" />
                      Delete Selected
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-2 py-1.5 text-zinc-400 hover:text-white text-[11px] font-bold cursor-pointer"
                    >
                      Deselect
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty Pages Warning */}
            {pages.length === 0 && (
              <div className="bg-red-950/10 border border-red-500/20 rounded-2xl p-8 text-center text-red-400 text-xs flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                <p className="font-bold">No Pages Remaining</p>
                <p className="text-zinc-500 max-w-sm">
                  You have deleted all pages from this PDF file. Please use the "Reset" button in the toolbar to restore the original pages.
                </p>
              </div>
            )}

            {/* Grid Canvas */}
            {pages.length > 0 && (
              <div className="bg-zinc-950/20 border border-zinc-900/60 rounded-3xl p-5 sm:p-6 min-h-[400px]">
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    Interactive Grid (Drag cards to reorder, check to select multiple)
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-[10px] font-mono font-bold text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearSelection}
                      className="text-[10px] font-mono font-bold text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                  {pages.map((page, index) => {
                    const isSelected = selectedPageIds.has(page.id);
                    const isDragged = draggedPageIndex === index;
                    const isDragOver = dragOverPageIndex === index;

                    return (
                      <div
                        key={page.id}
                        draggable
                        onDragStart={(e) => handlePageDragStart(e, index)}
                        onDragOver={(e) => handlePageDragOver(e, index)}
                        onDrop={(e) => handlePageDrop(e, index)}
                        className={`relative rounded-xl border flex flex-col bg-zinc-950/80 transition-all ${getCardClasses()} ${
                          isDragged ? 'opacity-40 border-dashed border-zinc-700' : ''
                        } ${
                          isDragOver ? 'ring-2 ring-emerald-500 scale-105' : ''
                        } ${
                          isSelected ? 'border-emerald-500/60 ring-1 ring-emerald-500/20 bg-emerald-950/5' : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        
                        {/* Checkbox indicator overlay */}
                        <div className="absolute top-2.5 left-2.5 z-10 flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePageSelection(page.id)}
                            className="w-4 h-4 rounded border-zinc-800 text-emerald-600 focus:ring-0 cursor-pointer"
                          />
                        </div>

                        {/* Top controls: drag and preview */}
                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                          <button
                            onClick={() => setPreviewPageNumber(page.originalIndex + 1)}
                            className="p-1 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                            title="Expand Large Preview"
                          >
                            <Maximize2 className="w-2.5 h-2.5" />
                          </button>
                          <div className="p-1 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-500 cursor-grab hover:text-emerald-400">
                            <Move className="w-2.5 h-2.5" />
                          </div>
                        </div>

                        {/* Canvas preview / render segment */}
                        <div className="flex-1 flex items-center justify-center bg-[#07070a]/60 rounded-t-xl relative overflow-hidden p-2 pt-8">
                          <div className="scale-75 origin-center select-none pointer-events-none max-w-full max-h-full">
                            <Document 
                              file={blobUrl}
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
                                pageNumber={page.originalIndex + 1} 
                                width={cardSize === 'lg' ? 140 : cardSize === 'sm' ? 80 : 110} 
                                renderTextLayer={false} 
                                renderAnnotationLayer={false}
                                rotate={page.rotation}
                              />
                            </Document>
                          </div>
                        </div>

                        {/* Bottom stats/details */}
                        <div className="p-2 border-t border-zinc-900 bg-zinc-900/20 text-[9px] font-mono text-zinc-500 flex justify-between items-center rounded-b-xl">
                          <span>Page {page.originalIndex + 1}</span>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => rotatePage(index, 'cw')}
                              className="p-0.5 rounded hover:bg-zinc-850 hover:text-emerald-400 cursor-pointer"
                              title="Rotate Clockwise 90°"
                            >
                              <RotateCw className="w-2.5 h-2.5" />
                            </button>
                            <button
                              onClick={() => deletePage(index)}
                              className="p-0.5 rounded hover:bg-zinc-850 hover:text-red-400 cursor-pointer"
                              title="Delete Page"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>

          {/* Organizer Settings Panel (Col Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Meta & Actions Sidebar */}
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-lg space-y-5 text-left">
              
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Settings className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Document Settings &amp; Metadata
                </span>
              </div>

              {/* Output Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Output File Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={meta.outputName}
                    onChange={(e) => setMeta({ ...meta, outputName: e.target.value })}
                    className="w-full bg-[#09090c] border border-zinc-850 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    placeholder="Organized_Document"
                  />
                  <span className="absolute right-3 top-2 text-zinc-600 text-xs font-mono select-none">.pdf</span>
                </div>
              </div>

              {/* Author field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Document Author</label>
                <input
                  type="text"
                  value={meta.author}
                  onChange={(e) => setMeta({ ...meta, author: e.target.value })}
                  className="w-full bg-[#09090c] border border-zinc-850 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  placeholder="Your Name / Publisher"
                />
              </div>

              {/* Title field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Document Title</label>
                <input
                  type="text"
                  value={meta.title}
                  onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                  className="w-full bg-[#09090c] border border-zinc-850 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  placeholder="Portfolio / Collection"
                />
              </div>

              {/* Subject field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Subject Description</label>
                <input
                  type="text"
                  value={meta.subject}
                  onChange={(e) => setMeta({ ...meta, subject: e.target.value })}
                  className="w-full bg-[#09090c] border border-zinc-850 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  placeholder="What this document covers"
                />
              </div>

              {/* Action trigger button */}
              <div className="pt-3 border-t border-zinc-900/60">
                <button
                  onClick={handleCompile}
                  disabled={stage === 'compiling' || pages.length === 0}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {stage === 'compiling' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Compiling PDF...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      Compile &amp; Download PDF
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Terminal Logging Box */}
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-lg space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Apex Organizer Engine logs
                </span>
                <span className="text-[8px] font-mono text-zinc-600 uppercase">OFFLINE SHELL</span>
              </div>

              <div className="h-32 overflow-y-auto bg-black/60 border border-zinc-900 rounded-xl p-3 font-mono text-[9px] text-zinc-400 space-y-1.5 select-text">
                {logs.length === 0 ? (
                  <p className="text-zinc-650 italic">System ready. Upload a PDF document to begin sequencing...</p>
                ) : (
                  logs.map((log, index) => (
                    <p key={index} className="break-all whitespace-pre-wrap leading-relaxed">
                      {log}
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* Help guidelines */}
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-lg space-y-3 text-left">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Workflow Guide
              </span>
              <ul className="space-y-2 text-xs text-zinc-400 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Drag and drop thumbnails to rearrange.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Use checkboxes to select multiple pages and perform rotation or deletions in bulk.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Set custom document properties like Title &amp; Author before compilation.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      )}

      {/* Compiler Action Modal Overlay */}
      <AnimatePresence>
        {stage !== 'idle' && stage !== 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl"
            >
              
              {stage === 'compiling' ? (
                <>
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-zinc-900" />
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Layers className="w-7 h-7 text-emerald-400 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">Compiling PDF Structure</h3>
                    <p className="text-xs text-zinc-400">Processing changes, adjusting rotational metrics, and encoding metadata.</p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                      <span>APEX COMPILING FLOW</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Success stage view */
                <>
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">Document Organized Successfully!</h3>
                    <p className="text-xs text-zinc-400">Your visual modifications have been rendered locally.</p>
                  </div>

                  {/* Generated details box */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 text-left space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-zinc-800 rounded-xl">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{compiledFileName}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{formatBytes(compiledBlobSize)} • {pages.length} Pages</p>
                      </div>
                    </div>

                    <div className="h-[200px] w-full border border-zinc-850 rounded-xl overflow-hidden bg-zinc-950">
                      <iframe
                        src={compiledBlobUrl || ''}
                        className="w-full h-full border-none"
                        title="PDF compiled preview"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={compiledBlobUrl || ''}
                      download={compiledFileName}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download Organized PDF
                    </a>
                    <button
                      onClick={() => setStage('idle')}
                      className="px-4 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Back to Editor
                    </button>
                  </div>
                </>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* High Definition Modal Page Preview */}
      <AnimatePresence>
        {previewPageNumber !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 sm:p-6 max-w-2xl w-full flex flex-col max-h-[90vh] shadow-2xl relative"
            >
              
              <button
                onClick={() => setPreviewPageNumber(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-left border-b border-zinc-900 pb-3 mb-4">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block">Page Inspection mode</span>
                <h3 className="text-sm font-bold text-white">Original Page Number: {previewPageNumber}</h3>
              </div>

              <div className="flex-1 overflow-y-auto min-h-[300px] flex items-center justify-center bg-black/20 rounded-2xl border border-zinc-900 p-4">
                <div className="max-w-full select-none pointer-events-none">
                  <Document 
                    file={blobUrl}
                    loading={
                      <div className="text-center font-mono text-xs text-zinc-650 tracking-wider">
                        RENDERING HIGH DEFINITION TEXT...
                      </div>
                    }
                  >
                    <Page 
                      pageNumber={previewPageNumber} 
                      width={400} 
                      renderTextLayer={false} 
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </div>
              </div>

              <div className="flex justify-end pt-4 mt-2 border-t border-zinc-900">
                <button
                  onClick={() => setPreviewPageNumber(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-bold rounded-xl border border-zinc-800 cursor-pointer"
                >
                  Close Preview
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

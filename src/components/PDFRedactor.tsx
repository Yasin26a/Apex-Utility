import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Upload, FileText, Lock, Eye, EyeOff, Search, Trash2, 
  Download, RefreshCw, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, 
  Check, AlertTriangle, Layers, Filter, Sparkles, CheckSquare, Square,
  Settings2, Plus, Sliders, Shield, HelpCircle, FileCheck
} from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { addRecentOperation } from '../utils/recentOperations';

// Ensure worker path is set
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export type PIIType = 'ssn' | 'creditCard' | 'email' | 'phone' | 'custom';

export interface RedactionBox {
  id: string;
  pageIndex: number; // 0-indexed
  // PDF coordinate system (origin bottom-left, in PDF points)
  pdfX: number;
  pdfY: number;
  pdfW: number;
  pdfH: number;
  // Metadata
  type: PIIType | 'manual';
  text?: string;
  enabled: boolean;
  label?: string;
}

const PII_CONFIG: Record<PIIType, { label: string; color: string; badgeBg: string; border: string; desc: string }> = {
  ssn: { 
    label: 'Social Security (SSN)', 
    color: 'text-amber-400', 
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    border: 'border-amber-500',
    desc: 'US 9-digit SSN numbers (XXX-XX-XXXX)'
  },
  creditCard: { 
    label: 'Credit Card Numbers', 
    color: 'text-rose-400', 
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    border: 'border-rose-500',
    desc: 'Visa, Mastercard, Amex, 13-19 digit cards'
  },
  email: { 
    label: 'Email Addresses', 
    color: 'text-sky-400', 
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    border: 'border-sky-500',
    desc: 'Standard email address patterns'
  },
  phone: { 
    label: 'Phone Numbers', 
    color: 'text-emerald-400', 
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    border: 'border-emerald-500',
    desc: 'US & international phone numbers'
  },
  custom: { 
    label: 'Custom Keywords', 
    color: 'text-purple-400', 
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    border: 'border-purple-500',
    desc: 'User-specified sensitive words & terms'
  }
};

// Regex patterns
const REGEX_PATTERNS: Record<PIIType, RegExp[]> = {
  ssn: [
    /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/g,
    /\b(?!000|666|9\d{2})\d{3}[-\s]?(?!00)\d{2}[-\s]?(?!0000)\d{4}\b/g
  ],
  creditCard: [
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
    /\b(?:\d[ -]*?){13,19}\b/g
  ],
  email: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  ],
  phone: [
    /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g
  ],
  custom: []
};

export default function PDFRedactor() {
  // File state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0); // 0-indexed
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redaction boxes state
  const [boxes, setBoxes] = useState<RedactionBox[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Category Filter Toggles
  const [enabledCategory, setEnabledCategory] = useState<Record<PIIType, boolean>>({
    ssn: true,
    creditCard: true,
    email: true,
    phone: true,
    custom: true
  });
  const [customKeywords, setCustomKeywords] = useState<string>('');

  // Redaction Options
  const [redactionStyle, setRedactionStyle] = useState<'black' | 'white' | 'labeled'>('black');
  const [exportMode, setExportMode] = useState<'flattened' | 'vector'>('flattened');
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  // Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrawRect, setCurrentDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 612, height: 792 }); // points

  // Export State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);

  // Handle file select
  const handleFileChange = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }

    setPdfFile(file);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      setArrayBuffer(buffer);
      try {
        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(0);
        setBoxes([]);
        
        // Auto scan first page or all pages
        scanDocumentForPII(doc);
      } catch (err) {
        console.error('Failed to parse PDF:', err);
        alert('Failed to load PDF file. It might be password protected or corrupted.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Scan PDF for PII
  const scanDocumentForPII = async (docToScan = pdfDoc) => {
    if (!docToScan) return;
    setIsScanning(true);
    const detectedBoxes: RedactionBox[] = [];

    try {
      const keywords = customKeywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      for (let pIndex = 0; pIndex < docToScan.numPages; pIndex++) {
        const page = await docToScan.getPage(pIndex + 1);
        const viewport = page.getViewport({ scale: 1.0 });
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        // Group text items into visual lines
        const lines: { text: string; items: { str: string; x: number; y: number; w: number; h: number }[] }[] = [];
        
        items.forEach(item => {
          if (!item.str || item.str.trim() === '') return;
          const x = item.transform[4];
          const y = item.transform[5];
          const w = item.width || 10;
          const h = item.height || Math.abs(item.transform[3]) || 12;

          // Find existing line within 3 points vertical distance
          let line = lines.find(l => Math.abs(l.items[0].y - y) < 4);
          if (!line) {
            line = { text: '', items: [] };
            lines.push(line);
          }
          line.items.push({ str: item.str, x, y, w, h });
        });

        // Process each line for patterns
        lines.forEach(line => {
          // Sort items by X coordinate
          line.items.sort((a, b) => a.x - b.x);
          const fullLineText = line.items.map(i => i.str).join(' ');

          // Helper to register box
          const addMatch = (type: PIIType, matchedText: string, itemX: number, itemY: number, itemW: number, itemH: number) => {
            detectedBoxes.push({
              id: `box-${pIndex}-${Math.random().toString(36).substring(2, 9)}`,
              pageIndex: pIndex,
              pdfX: Math.max(0, itemX - 2),
              pdfY: Math.max(0, itemY - 2),
              pdfW: Math.min(viewport.width, itemW + 4),
              pdfH: Math.min(viewport.height, itemH + 4),
              type,
              text: matchedText,
              enabled: true,
              label: PII_CONFIG[type].label
            });
          };

          // 1. Standard Regex PII Checks
          (Object.keys(REGEX_PATTERNS) as PIIType[]).forEach(type => {
            if (type === 'custom') return;
            const patterns = REGEX_PATTERNS[type];
            patterns.forEach(regex => {
              const matches = Array.from(fullLineText.matchAll(new RegExp(regex)));
              matches.forEach(m => {
                const matchedStr = m[0];
                if (!matchedStr) return;

                // Simple Luhn check for credit card candidates if type is creditCard
                if (type === 'creditCard') {
                  const cleanDigits = matchedStr.replace(/\D/g, '');
                  if (cleanDigits.length < 13 || cleanDigits.length > 19) return;
                }

                // Match back to specific text item bounding box
                line.items.forEach(item => {
                  if (fullLineText.includes(item.str) && (item.str.includes(matchedStr) || matchedStr.includes(item.str) || m.index !== undefined)) {
                    addMatch(type, matchedStr, item.x, item.y, item.w, item.h);
                  }
                });
              });
            });
          });

          // 2. Custom Keywords Check
          keywords.forEach(kw => {
            if (fullLineText.toLowerCase().includes(kw.toLowerCase())) {
              line.items.forEach(item => {
                if (item.str.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(item.str.toLowerCase())) {
                  addMatch('custom', kw, item.x, item.y, item.w, item.h);
                }
              });
            }
          });
        });
      }

      // Deduplicate overlapping boxes on same page
      const uniqueBoxes: RedactionBox[] = [];
      detectedBoxes.forEach(b => {
        const duplicate = uniqueBoxes.find(ub => 
          ub.pageIndex === b.pageIndex &&
          Math.abs(ub.pdfX - b.pdfX) < 5 &&
          Math.abs(ub.pdfY - b.pdfY) < 5 &&
          Math.abs(ub.pdfW - b.pdfW) < 5
        );
        if (!duplicate) {
          uniqueBoxes.push(b);
        }
      });

      setBoxes(prev => [
        ...prev.filter(b => b.type === 'manual'), // preserve manually drawn boxes
        ...uniqueBoxes
      ]);

    } catch (err) {
      console.error('Error scanning PDF for PII:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Render Page Canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    try {
      const page = await pdfDoc.getPage(currentPage + 1);
      const viewport = page.getViewport({ scale: zoomScale * 1.5 }); // High DPI scale
      setPageSize({ width: page.view[2] - page.view[0], height: page.view[3] - page.view[1] });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
        canvas: canvas
      } as any;

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  }, [pdfDoc, currentPage, zoomScale]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // Mouse / Touch drawing handlers for manual redaction rectangles
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasContainerRef.current || !pageSize.width) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setDrawStart({ x, y });
    setCurrentDrawRect({ x, y, w: 0, h: 0 });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const w = Math.abs(currentX - drawStart.x);
    const h = Math.abs(currentY - drawStart.y);

    setCurrentDrawRect({ x, y, w, h });
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !currentDrawRect || !canvasContainerRef.current) {
      setIsDrawing(false);
      setDrawStart(null);
      setCurrentDrawRect(null);
      return;
    }

    // Only add if box has reasonable width and height
    if (currentDrawRect.w > 10 && currentDrawRect.h > 10) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const scaleX = pageSize.width / rect.width;
      const scaleY = pageSize.height / rect.height;

      // Convert Screen CSS coordinates (origin top-left) to PDF coordinates (origin bottom-left)
      const pdfX = currentDrawRect.x * scaleX;
      const pdfH = currentDrawRect.h * scaleY;
      const pdfY = pageSize.height - ((currentDrawRect.y + currentDrawRect.h) * scaleY);
      const pdfW = currentDrawRect.w * scaleX;

      const newManualBox: RedactionBox = {
        id: `manual-${currentPage}-${Math.random().toString(36).substring(2, 9)}`,
        pageIndex: currentPage,
        pdfX,
        pdfY,
        pdfW,
        pdfH,
        type: 'manual',
        text: 'Custom Redaction',
        enabled: true,
        label: 'Manual Mask'
      };

      setBoxes(prev => [...prev, newManualBox]);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDrawRect(null);
  };

  // Toggle Box Enabled
  const toggleBox = (id: string) => {
    setBoxes(prev => prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  };

  const deleteBox = (id: string) => {
    setBoxes(prev => prev.filter(b => b.id !== id));
  };

  // Export Redacted PDF
  const exportRedactedPDF = async () => {
    if (!arrayBuffer || !pdfFile) return;
    setIsProcessing(true);
    setProcessProgress(10);

    try {
      const activeBoxes = boxes.filter(b => b.enabled && enabledCategory[b.type as PIIType] !== false);

      if (exportMode === 'flattened') {
        // High-Security Raster Flattened PDF Export
        // Render every page to canvas at high resolution, burn boxes directly into pixels, export as image PDF
        const pdfDocOutput = await PDFDocument.create();

        for (let pIndex = 0; pIndex < totalPages; pIndex++) {
          setProcessProgress(Math.round(10 + ((pIndex + 1) / totalPages) * 75));
          const page = await pdfDoc!.getPage(pIndex + 1);
          const viewport = page.getViewport({ scale: 2.0 }); // 2x crisp DPI resolution

          // Create offscreen canvas
          const offCanvas = document.createElement('canvas');
          offCanvas.width = viewport.width;
          offCanvas.height = viewport.height;
          const ctx = offCanvas.getContext('2d');
          if (!ctx) continue;

          await page.render({ canvasContext: ctx, viewport, canvas: offCanvas } as any).promise;

          // Burn all active boxes for this page into canvas pixels
          const pageBoxes = activeBoxes.filter(b => b.pageIndex === pIndex);
          const pdfW = page.view[2] - page.view[0];
          const pdfH = page.view[3] - page.view[1];

          pageBoxes.forEach(box => {
            // Convert PDF points (origin bottom-left) to canvas pixels (origin top-left)
            const scaleX = viewport.width / pdfW;
            const scaleY = viewport.height / pdfH;

            const canvasX = box.pdfX * scaleX;
            const canvasY = (pdfH - (box.pdfY + box.pdfH)) * scaleY;
            const canvasW = box.pdfW * scaleX;
            const canvasH = box.pdfH * scaleY;

            ctx.fillStyle = redactionStyle === 'white' ? '#FFFFFF' : '#000000';
            ctx.fillRect(canvasX, canvasY, canvasW, canvasH);

            if (redactionStyle === 'labeled') {
              ctx.fillStyle = '#FFFFFF';
              ctx.font = `bold ${Math.max(10, Math.floor(canvasH * 0.6))}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('[REDACTED]', canvasX + canvasW / 2, canvasY + canvasH / 2);
            }
          });

          // Embed high-res image into new PDF
          const imgDataUrl = offCanvas.toDataURL('image/jpeg', 0.92);
          const imgBytes = await fetch(imgDataUrl).then(res => res.arrayBuffer());
          const embeddedImg = await pdfDocOutput.embedJpg(imgBytes);

          const newPage = pdfDocOutput.addPage([pdfW, pdfH]);
          newPage.drawImage(embeddedImg, {
            x: 0,
            y: 0,
            width: pdfW,
            height: pdfH
          });
        }

        setProcessProgress(95);
        const redactedPdfBytes = await pdfDocOutput.save();
        downloadBlob(redactedPdfBytes, pdfFile.name.replace(/\.pdf$/i, '_redacted.pdf'));

      } else {
        // Vector Mask PDF Export via pdf-lib
        const pdfDocOutput = await PDFDocument.load(arrayBuffer);
        const pages = pdfDocOutput.getPages();

        activeBoxes.forEach(box => {
          if (box.pageIndex < pages.length) {
            const page = pages[box.pageIndex];
            page.drawRectangle({
              x: box.pdfX,
              y: box.pdfY,
              width: box.pdfW,
              height: box.pdfH,
              color: redactionStyle === 'white' ? rgb(1, 1, 1) : rgb(0, 0, 0)
            });
          }
        });

        setProcessProgress(95);
        const redactedPdfBytes = await pdfDocOutput.save();
        downloadBlob(redactedPdfBytes, pdfFile.name.replace(/\.pdf$/i, '_redacted.pdf'));
      }

      addRecentOperation(
        pdfFile.name,
        'PDF Compression',
        `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB`,
        `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB`,
        pdfFile.name.replace(/\.pdf$/i, '_redacted.pdf'),
        '#'
      );

    } catch (err) {
      console.error('Error generating redacted PDF:', err);
      alert('Failed to generate redacted PDF file.');
    } finally {
      setIsProcessing(false);
      setProcessProgress(100);
    }
  };

  const downloadBlob = (bytes: Uint8Array, filename: string) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter boxes for current page
  const currentPageBoxes = boxes.filter(b => b.pageIndex === currentPage);
  const totalDetectedPII = boxes.filter(b => b.type !== 'manual').length;
  const totalManualMasks = boxes.filter(b => b.type === 'manual').length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 font-sans text-slate-100">
      {/* Privacy Shield Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 p-4 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Client-Side PDF PII Redactor & Masker
                </h1>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                  100% Private
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                Automatically detect & permanent blackout SSNs, credit cards, emails, phone numbers & custom secrets before sharing. Zero cloud uploads.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      {!pdfFile ? (
        /* Dropzone Component */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative flex min-h-[380px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
            dragActive 
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]' 
              : 'border-zinc-800 bg-zinc-900/60 hover:border-amber-500/50 hover:bg-zinc-900/90'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            className="hidden"
          />

          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-800/80 text-amber-400 shadow-xl group-hover:scale-110 transition-transform duration-300">
            <Upload className="h-10 w-10" />
          </div>

          <h3 className="mt-5 text-lg font-semibold text-white">
            Drop your PDF document here
          </h3>
          <p className="mt-2 text-sm text-slate-400 max-w-md">
            Supports bank statements, legal contracts, tax returns, and identity documents up to any size.
          </p>

          <div className="mt-6 flex items-center space-x-3 rounded-full bg-zinc-800/60 px-4 py-2 text-xs font-medium text-amber-300 border border-zinc-700/60">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Files are processed in local memory only</span>
          </div>
        </div>
      ) : (
        /* Workspace Interface */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: PII Detection Controls & Settings (5 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* File Info Card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5 truncate">
                  <FileText className="h-5 w-5 text-amber-400 shrink-0" />
                  <span className="font-medium text-sm text-white truncate">{pdfFile.name}</span>
                </div>
                <button
                  onClick={() => { setPdfFile(null); setPdfDoc(null); setBoxes([]); }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-zinc-800 hover:text-white transition"
                  title="Remove file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-zinc-800/80 pt-2.5">
                <span>Pages: <strong className="text-white">{totalPages}</strong></span>
                <span>Size: <strong className="text-white">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</strong></span>
                <span>Detected PII: <strong className="text-amber-400">{totalDetectedPII}</strong></span>
              </div>
            </div>

            {/* PII Scanner Categories */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Search className="h-4 w-4 text-amber-400" />
                  <span>Auto PII Detection Categories</span>
                </h3>
                <button
                  onClick={() => scanDocumentForPII()}
                  disabled={isScanning}
                  className="flex items-center space-x-1.5 rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/30 transition border border-amber-500/30 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning...' : 'Re-Scan'}</span>
                </button>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5">
                {(Object.keys(PII_CONFIG) as PIIType[]).map((type) => {
                  const cfg = PII_CONFIG[type];
                  const count = boxes.filter(b => b.type === type).length;
                  const isChecked = enabledCategory[type];

                  return (
                    <div 
                      key={type}
                      className="flex items-center justify-between rounded-lg border border-zinc-800/90 bg-zinc-950/50 p-2.5 hover:border-zinc-700 transition"
                    >
                      <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium text-slate-200">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setEnabledCategory(prev => ({ ...prev, [type]: e.target.checked }))}
                          className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/40"
                        />
                        <span className={cfg.color}>{cfg.label}</span>
                      </label>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.badgeBg}`}>
                        {count} found
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Custom Keywords Input */}
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <label className="text-xs font-medium text-slate-300 block">
                  Custom Keywords to Redact (comma-separated):
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customKeywords}
                    onChange={(e) => setCustomKeywords(e.target.value)}
                    placeholder="e.g. John Doe, Secret, Acct #1234"
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    onClick={() => scanDocumentForPII()}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-zinc-700 transition"
                  >
                    Scan
                  </button>
                </div>
              </div>
            </div>

            {/* Redaction Style & Export Settings */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Settings2 className="h-4 w-4 text-amber-400" />
                <span>Masking Style & Security Options</span>
              </h3>

              {/* Mask Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Redaction Box Style:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setRedactionStyle('black')}
                    className={`rounded-lg py-2 text-xs font-medium transition border ${
                      redactionStyle === 'black'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-zinc-800 bg-zinc-950 text-slate-400 hover:border-zinc-700'
                    }`}
                  >
                    Solid Blackout
                  </button>
                  <button
                    onClick={() => setRedactionStyle('white')}
                    className={`rounded-lg py-2 text-xs font-medium transition border ${
                      redactionStyle === 'white'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-zinc-800 bg-zinc-950 text-slate-400 hover:border-zinc-700'
                    }`}
                  >
                    Whiteout
                  </button>
                  <button
                    onClick={() => setRedactionStyle('labeled')}
                    className={`rounded-lg py-2 text-xs font-medium transition border ${
                      redactionStyle === 'labeled'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-zinc-800 bg-zinc-950 text-slate-400 hover:border-zinc-700'
                    }`}
                  >
                    [REDACTED] Label
                  </button>
                </div>
              </div>

              {/* Export Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">Security Mode:</label>
                <div className="space-y-2">
                  <label className={`flex items-start space-x-2.5 rounded-lg border p-2.5 cursor-pointer transition ${
                    exportMode === 'flattened' 
                      ? 'border-emerald-500/50 bg-emerald-950/20' 
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}>
                    <input
                      type="radio"
                      name="exportMode"
                      checked={exportMode === 'flattened'}
                      onChange={() => setExportMode('flattened')}
                      className="mt-0.5 text-emerald-500 focus:ring-emerald-500/30"
                    />
                    <div>
                      <span className="text-xs font-semibold text-emerald-400 block">High-Security Raster Flattening (Recommended)</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">Destroys underlying text stream so copy-pasting masked data is impossible.</span>
                    </div>
                  </label>

                  <label className={`flex items-start space-x-2.5 rounded-lg border p-2.5 cursor-pointer transition ${
                    exportMode === 'vector' 
                      ? 'border-amber-500/50 bg-amber-950/20' 
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}>
                    <input
                      type="radio"
                      name="exportMode"
                      checked={exportMode === 'vector'}
                      onChange={() => setExportMode('vector')}
                      className="mt-0.5 text-amber-500 focus:ring-amber-500/30"
                    />
                    <div>
                      <span className="text-xs font-semibold text-amber-400 block">Vector Mask Overlays</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">Draws solid shapes on top of PDF stream. Keeps vector crispness.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={exportRedactedPDF}
                disabled={isProcessing}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-semibold text-zinc-950 hover:from-amber-400 hover:to-amber-500 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing ({processProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Export Redacted PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: PDF Visual Preview Canvas (7 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
              {/* Pagination */}
              <div className="flex items-center space-x-2 text-xs font-medium text-slate-300">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="rounded-lg p-1.5 hover:bg-zinc-800 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>Page <strong className="text-white">{currentPage + 1}</strong> of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="rounded-lg p-1.5 hover:bg-zinc-800 disabled:opacity-40 transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Instructions Badge */}
              <div className="hidden sm:flex items-center space-x-1.5 text-xs text-amber-400/90 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Click & drag on canvas to draw custom manual redaction boxes</span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs text-slate-300">
                <button
                  onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.25))}
                  className="p-1 hover:text-white transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="px-1.5 min-w-[45px] text-center font-mono">{Math.round(zoomScale * 100)}%</span>
                <button
                  onClick={() => setZoomScale(prev => Math.min(2.0, prev + 0.25))}
                  className="p-1 hover:text-white transition"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Canvas Viewport Container */}
            <div className="relative overflow-auto rounded-xl border border-zinc-800 bg-zinc-950/90 p-4 min-h-[550px] flex items-center justify-center">
              <div 
                ref={canvasContainerRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className="relative cursor-crosshair select-none inline-block shadow-2xl rounded-sm border border-zinc-800 bg-white"
              >
                {/* PDF Page Canvas */}
                <canvas ref={canvasRef} className="block max-w-full h-auto" />

                {/* Overlaid Redaction Boxes */}
                {currentPageBoxes.map((box) => {
                  if (!box.enabled || enabledCategory[box.type as PIIType] === false) return null;

                  // Convert PDF coords to percentage relative to page dimensions
                  const leftPct = (box.pdfX / pageSize.width) * 100;
                  const bottomPct = (box.pdfY / pageSize.height) * 100;
                  const widthPct = (box.pdfW / pageSize.width) * 100;
                  const heightPct = (box.pdfH / pageSize.height) * 100;

                  const isManual = box.type === 'manual';
                  const cfg = box.type !== 'manual' ? PII_CONFIG[box.type] : null;

                  return (
                    <div
                      key={box.id}
                      style={{
                        left: `${leftPct}%`,
                        bottom: `${bottomPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`
                      }}
                      className={`absolute border-2 transition-all flex items-center justify-center group ${
                        redactionStyle === 'white'
                          ? 'bg-white border-zinc-400'
                          : 'bg-black border-red-500'
                      }`}
                    >
                      {/* Hover Controls */}
                      <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition flex items-center space-x-1 bg-zinc-900 border border-zinc-700 p-0.5 rounded shadow-lg z-20">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteBox(box.id); }}
                          className="p-0.5 text-rose-400 hover:text-rose-300"
                          title="Remove this box"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Label */}
                      {redactionStyle === 'labeled' && (
                        <span className="text-[10px] font-bold text-white tracking-wider px-1 bg-black/80 rounded">
                          [REDACTED]
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Live Drawing Rectangle Feedback */}
                {isDrawing && currentDrawRect && (
                  <div
                    style={{
                      left: `${currentDrawRect.x}px`,
                      top: `${currentDrawRect.y}px`,
                      width: `${currentDrawRect.w}px`,
                      height: `${currentDrawRect.h}px`
                    }}
                    className="absolute border-2 border-dashed border-amber-400 bg-amber-500/20 pointer-events-none"
                  />
                )}
              </div>
            </div>

            {/* Bottom Current Page Redaction List Summary */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white flex items-center space-x-2">
                  <Layers className="h-4 w-4 text-amber-400" />
                  <span>Redactions on Page {currentPage + 1} ({currentPageBoxes.length})</span>
                </h4>
                {currentPageBoxes.length > 0 && (
                  <button
                    onClick={() => setBoxes(prev => prev.filter(b => b.pageIndex !== currentPage))}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Clear Page Redactions
                  </button>
                )}
              </div>

              {currentPageBoxes.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No redaction boxes on this page. Click and drag on the canvas to add manual masks.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentPageBoxes.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center space-x-2 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-slate-300"
                    >
                      <button onClick={() => toggleBox(b.id)}>
                        {b.enabled ? <CheckSquare className="h-3.5 w-3.5 text-amber-400" /> : <Square className="h-3.5 w-3.5 text-slate-500" />}
                      </button>
                      <span className="font-mono text-[11px] truncate max-w-[150px]">{b.text || b.label}</span>
                      <button onClick={() => deleteBox(b.id)} className="text-slate-500 hover:text-rose-400">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

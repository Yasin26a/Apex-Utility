import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ShieldAlert, 
  Sliders, 
  Info, 
  Download, 
  Loader2,
  PenTool,
  Type,
  Trash2,
  Check,
  Sparkles,
  Layers,
  Copy,
  FileText
} from 'lucide-react';
import { BatchPDFState } from './PDFCompressor';
import Tesseract from 'tesseract.js';
import { jsPDF } from 'jspdf';

// Load standard styles for text/annotate layer highlights (vital for search/highlights)
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Bind workers cleanly from standard CDN using version-specific template
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  brushSize: number;
}

export interface TextBox {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  isEditing?: boolean;
}

interface PDFPreviewModalProps {
  file: BatchPDFState;
  onClose: () => void;
  initialTab?: 'metadata' | 'annotations' | 'ocr';
}

export default function PDFPreviewModal({ file, onClose, initialTab = 'annotations' }: PDFPreviewModalProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [previewMode, setPreviewMode] = useState<'original' | 'compressed'>('original');
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States supporting customizable annotations
  const [activeTab, setActiveTab] = useState<'metadata' | 'annotations' | 'ocr'>(initialTab);
  const [isAnnotating, setIsAnnotating] = useState(true);
  const [annotationMode, setAnnotationMode] = useState<'draw' | 'text'>('draw');
  const [currentColor, setCurrentColor] = useState('#fbbf24'); // Amber primary accent
  const [brushSize, setBrushSize] = useState(4);
  const [fontSize, setFontSize] = useState(16);

  const [strokesByPage, setStrokesByPage] = useState<Record<number, DrawingStroke[]>>({});
  const [textByPage, setTextByPage] = useState<Record<number, TextBox[]>>({});

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);

  // OCR states
  const [ocrTextByPage, setOcrTextByPage] = useState<Record<number, string>>({});
  const [ocrProgress, setOcrProgress] = useState<{ status: string; progress: number } | null>(null);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('eng');
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [isExportingMarkup, setIsExportingMarkup] = useState(false);

  const drawAnnotationsOnCanvas = (
    originalCanvas: HTMLCanvasElement,
    strokes: DrawingStroke[],
    textBoxes: TextBox[],
  ): HTMLCanvasElement => {
    const offscreen = document.createElement('canvas');
    offscreen.width = originalCanvas.width;
    offscreen.height = originalCanvas.height;
    
    const ctx = offscreen.getContext('2d');
    if (!ctx) return offscreen;

    // 1. Draw original PDF render
    ctx.drawImage(originalCanvas, 0, 0);

    // 2. Compute matching visual scale
    const container = document.getElementById('pdf-annotation-container');
    const containerWidth = container ? container.getBoundingClientRect().width : originalCanvas.width;
    const scaleFactor = originalCanvas.width / 100;
    const fontRatio = originalCanvas.width / containerWidth;

    // 3. Draw strokes coordinate-bounded
    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      const points = stroke.points;
      ctx.moveTo(points[0].x * scaleFactor, points[0].y * scaleFactor);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * scaleFactor, points[i].y * scaleFactor);
      }
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.brushSize * 0.16 * scaleFactor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });

    // 4. Draw text boxes
    textBoxes.forEach((box) => {
      if (!box.text.trim()) return;

      const x = box.x * scaleFactor;
      const y = box.y * scaleFactor;
      
      const computedFontSize = box.fontSize * fontRatio;
      ctx.font = `600 ${computedFontSize}px ui-serif, Georgia, Cambria, serif`;
      
      const textMetrics = ctx.measureText(box.text);
      const textWidth = textMetrics.width;
      const textHeight = computedFontSize;

      const paddingX = computedFontSize * 0.55;
      const paddingY = computedFontSize * 0.25;
      const cardWidth = textWidth + paddingX * 2;
      const cardHeight = textHeight + paddingY * 2;

      const cardX = x - cardWidth / 2;
      const cardY = y - cardHeight / 2;

      // Draw background rounded rect
      ctx.fillStyle = 'rgba(9, 9, 15, 0.95)';
      ctx.strokeStyle = 'rgba(39, 39, 42, 0.85)';
      ctx.lineWidth = Math.max(1, fontRatio);

      ctx.beginPath();
      const radius = computedFontSize * 0.25;
      if (ctx.roundRect) {
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, radius);
      } else {
        ctx.rect(cardX, cardY, cardWidth, cardHeight);
      }
      ctx.fill();
      ctx.stroke();

      // Write text center-aligned
      ctx.fillStyle = box.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(box.text, x, y);
    });

    return offscreen;
  };

  const handleExportAnnotatedPage = async (format: 'png' | 'pdf') => {
    try {
      setIsExportingMarkup(true);
      const originalCanvas = document.querySelector('#pdf-annotation-container canvas') as HTMLCanvasElement;
      if (!originalCanvas) {
        throw new Error('PDF page rendering element not found. Make sure the page is fully loaded.');
      }

      const strokes = strokesByPage[pageNumber] || [];
      const textBoxes = textByPage[pageNumber] || [];

      const annotatedCanvas = drawAnnotationsOnCanvas(originalCanvas, strokes, textBoxes);

      if (format === 'png') {
        const dataUrl = annotatedCanvas.toDataURL('image/png');
        const element = document.createElement('a');
        element.href = dataUrl;
        element.download = `${file.name.replace(/\.[^/.]+$/, "")}_Page_${pageNumber}_Annotated.png`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } else {
        const width = annotatedCanvas.width;
        const height = annotatedCanvas.height;
        const orientation = width > height ? 'landscape' : 'portrait';
        const doc = new jsPDF({
          orientation: orientation as any,
          unit: 'px',
          format: [width, height],
          compress: true
        });

        const dataUrl = annotatedCanvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(dataUrl, 'JPEG', 0, 0, width, height, undefined, 'FAST');
        doc.save(`${file.name.replace(/\.[^/.]+$/, "")}_Page_${pageNumber}_Annotated.pdf`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to export annotated view asset.');
    } finally {
      setIsExportingMarkup(false);
    }
  };

  const handleRunOcr = async () => {
    setIsOcrRunning(true);
    setOcrError(null);
    setOcrProgress({ status: 'Initializing OCR...', progress: 0 });
    try {
      let imageSource: string | HTMLCanvasElement | null = null;
      
      if (file.isImage && file.imageSrc && previewMode === 'original') {
        imageSource = file.imageSrc;
      } else {
        const canvas = document.querySelector('#pdf-annotation-container canvas') as HTMLCanvasElement;
        if (!canvas) {
          throw new Error('PDF page rendering element not found. Please wait until page fully renders and try again.');
        }
        imageSource = canvas;
      }

      setOcrProgress({ status: 'Loading trained dictionary...', progress: 0.15 });
      
      const result = await Tesseract.recognize(
        imageSource,
        selectedLanguage,
        {
          logger: (m) => {
            if (m && m.status === 'recognizing text') {
              setOcrProgress({ status: 'Transcribing text grid...', progress: m.progress });
            } else if (m) {
              const friendlyStatus = m.status.replace(/_/g, ' ');
              setOcrProgress({ status: `${friendlyStatus.charAt(0).toUpperCase() + friendlyStatus.slice(1)}...`, progress: m.progress || 0 });
            }
          }
        }
      );

      const extractedText = result.data.text || '';
      setOcrTextByPage(prev => ({
        ...prev,
        [pageNumber]: extractedText
      }));
      setOcrProgress(null);
      setIsOcrRunning(false);
    } catch (err: any) {
      console.error('OCR Processing error:', err);
      setOcrError(err.message || 'Optical character recognition processing failed.');
      setOcrProgress(null);
      setIsOcrRunning(false);
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      } else {
        alert('Failed to copy text automatically. Please select and copy the text manually.');
      }
    } catch (err) {
      console.error('Fallback clipboard write error:', err);
      alert('Failed to copy text automatically. Please select and copy the text manually.');
    }
  };

  const copyOcrText = () => {
    const text = ocrTextByPage[pageNumber];
    if (!text) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      }).catch(e => {
        console.error('Clipboard write error, attempting fallback:', e);
        fallbackCopyToClipboard(text);
      });
    } else {
      fallbackCopyToClipboard(text);
    }
  };

  const downloadOcrText = () => {
    const text = ocrTextByPage[pageNumber];
    if (!text) return;
    const element = document.createElement("a");
    const fileBlob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = `${file.name.replace(/\.[^/.]+$/, "")}_Page_${pageNumber}_OCR.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Coordinate mapping helper from standard view rectangle percentages
  const getCoordinatesFromEvent = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  // Drawing stroke start or Text Box drop
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotating) return;
    const coords = getCoordinatesFromEvent(e);
    if (!coords) return;

    if (annotationMode === 'draw') {
      setIsDrawing(true);
      setCurrentStroke([coords]);
    } else if (annotationMode === 'text') {
      const newBox: TextBox = {
        id: `txt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        x: coords.x,
        y: coords.y,
        text: '',
        color: currentColor,
        fontSize,
        isEditing: true,
      };
      setTextByPage((prev) => ({
        ...prev,
        [pageNumber]: [...(prev[pageNumber] || []), newBox],
      }));
    }
  };

  // Drag-draw event
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotating || !isDrawing || annotationMode !== 'draw') return;
    const coords = getCoordinatesFromEvent(e);
    if (!coords) return;
    setCurrentStroke((prev) => [...prev, coords]);
  };

  // Append finalized drawing stroke
  const handleMouseUp = () => {
    if (!isAnnotating || !isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      const newStroke: DrawingStroke = {
        id: `str_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        points: currentStroke,
        color: currentColor,
        brushSize,
      };
      setStrokesByPage((prev) => ({
        ...prev,
        [pageNumber]: [...(prev[pageNumber] || []), newStroke],
      }));
    }
    setCurrentStroke([]);
  };

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isAnnotating) return;
    if (annotationMode === 'draw') {
      e.stopPropagation();
    }
    const coords = getCoordinatesFromEvent(e);
    if (!coords) return;

    if (annotationMode === 'draw') {
      setIsDrawing(true);
      setCurrentStroke([coords]);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isAnnotating || !isDrawing || annotationMode !== 'draw') return;
    e.stopPropagation();
    const coords = getCoordinatesFromEvent(e);
    if (!coords) return;
    setCurrentStroke((prev) => [...prev, coords]);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // Text inputs management
  const updateTextBoxText = (id: string, text: string) => {
    setTextByPage((prev) => {
      const list = prev[pageNumber] || [];
      return {
        ...prev,
        [pageNumber]: list.map((b) => (b.id === id ? { ...b, text } : b)),
      };
    });
  };

  const finishEditingTextBox = (id: string) => {
    setTextByPage((prev) => {
      const list = prev[pageNumber] || [];
      const updated = list.map((b) => (b.id === id ? { ...b, isEditing: false } : b));
      // filter out completely blank additions
      return {
        ...prev,
        [pageNumber]: updated.filter((b) => b.text.trim() !== ''),
      };
    });
  };

  const startEditingTextBox = (id: string) => {
    setTextByPage((prev) => {
      const list = prev[pageNumber] || [];
      return {
        ...prev,
        [pageNumber]: list.map((b) => (b.id === id ? { ...b, isEditing: true } : b)),
      };
    });
  };

  const deleteTextBox = (id: string) => {
    setTextByPage((prev) => {
      const list = prev[pageNumber] || [];
      return {
        ...prev,
        [pageNumber]: list.filter((b) => b.id !== id),
      };
    });
  };

  const clearPageAnnotations = () => {
    setStrokesByPage((prev) => ({ ...prev, [pageNumber]: [] }));
    setTextByPage((prev) => ({ ...prev, [pageNumber]: [] }));
  };

  const getSvgPathFromPoints = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  // Automatically switch to compressed preview if available on completion
  useEffect(() => {
    if (file.stage === 'complete' && file.compressedBlobUrl) {
      setPreviewMode('compressed');
    } else {
      setPreviewMode('original');
    }
  }, [file]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setIsLoading(false);
    setPdfLoadError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF JS loading error:', error);
    setPdfLoadError(error.message || 'Fatal error rendering PDF canvas client-side.');
    setIsLoading(false);
  };

  // Safe navigation controls
  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const target = prevPageNumber + offset;
      if (numPages && target >= 1 && target <= numPages) {
        return target;
      }
      return prevPageNumber;
    });
  };

  const handleZoom = (factor: number) => {
    setScale((prev) => Math.min(Math.max(prev + factor, 0.5), 2.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  // Keyboard shortcut listener for keyboard-bound previews
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') changePage(1);
      if (e.key === 'ArrowLeft') changePage(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

  // Determine active URL based on state override
  const getActiveBlobUrl = () => {
    if (previewMode === 'compressed' && file.compressedBlobUrl) {
      return file.compressedBlobUrl;
    }
    // Fall back to original URL
    return file.originalBlobUrl || file.compressedBlobUrl || '';
  };

  const activeUrl = getActiveBlobUrl();

  return (
    <div id="pdf-preview-backdrop" className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center bg-[#030305]/95 backdrop-blur-md p-0 md:p-6 select-none font-sans overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="w-full h-full max-w-7xl bg-[#09090e] border-0 md:border border-zinc-900 md:rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl"
      >
        {/* Main PDF Visual Canvas Viewport */}
        <div className="flex-1 flex flex-col bg-[#050508] relative min-h-0">
          
          {/* Header Action HUD */}
          <div className="h-14 border-b border-zinc-900/60 px-4 flex items-center justify-between gap-4 bg-[#09090e]/80 backdrop-blur-sm z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-heading text-xs font-black text-brand uppercase tracking-wider bg-brand/5 border border-brand/20 px-2 py-0.5 rounded leading-none">
                Inspect HUD
              </span>
              <h3 className="font-heading text-xs text-zinc-300 font-bold truncate max-w-[200px] sm:max-w-xs" title={file.name}>
                {file.name}
              </h3>
            </div>

            {/* Source Switcher (Original VS Optimized) if available */}
            {file.compressedBlobUrl && (
              <div className="bg-zinc-950 p-1 rounded-lg border border-zinc-900/80 flex items-center gap-1">
                <button
                  onClick={() => setPreviewMode('original')}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold transition-all ${
                    previewMode === 'original'
                      ? 'bg-zinc-900 text-white border border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setPreviewMode('compressed')}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold transition-all ${
                    previewMode === 'compressed'
                      ? 'bg-brand text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Compressed
                </button>
              </div>
            )}

            {/* Quick close button on mobile */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Core Interactive stage scroll wrapper */}
          <div className="flex-1 overflow-auto p-4 flex justify-center items-start relative min-h-0 bg-[#050508]">
            <AnimatePresence mode="wait">
              {pdfLoadError ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-md mx-auto my-auto p-6 bg-red-950/10 border border-red-900/30 rounded-2xl text-center space-y-4"
                >
                  <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-heading text-xs font-black uppercase text-red-400 tracking-wider">Canvas Render Interrupted</h4>
                    <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                      {pdfLoadError.includes('Missing PDF') || pdfLoadError.includes('Failed to fetch')
                        ? 'Raw binary stream could not be loaded into memory. Select a valid source file, or re-run operations.'
                        : pdfLoadError}
                    </p>
                  </div>
                  
                  {/* Standard embedded element as alternative preview fallback */}
                  <div className="pt-2">
                    <a
                      href={activeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 hover:text-white"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Open in Browser Tab Instead</span>
                    </a>
                  </div>
                </motion.div>
              ) : file.isImage && file.imageSrc && previewMode === 'original' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="max-w-full max-h-[75vh] flex flex-col items-center justify-center space-y-4 my-auto"
                >
                  <div className="relative group rounded-2xl overflow-hidden border border-zinc-900 bg-zinc-950 p-2 shadow-2xl">
                    <img 
                      src={file.imageSrc} 
                      alt={file.name} 
                      className="max-w-full max-h-[60vh] object-contain rounded-xl select-none"
                    />
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-950 border border-zinc-900 px-3 py-1 rounded-full">
                    Source Upload Asset Image
                  </span>
                </motion.div>
              ) : activeUrl ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={`${activeUrl}-${pageNumber}-${scale}`}
                  className="bg-black/40 border border-zinc-900/70 p-3 rounded-2xl shadow-xl hover:border-brand-border/10 transition-all z-0 max-w-full"
                >
                  {isLoading && (
                    <div className="py-24 text-center space-y-3">
                      <Loader2 className="w-7 h-7 text-brand animate-spin mx-auto" />
                      <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Parsing binary structure...</p>
                    </div>
                  )}

                  <Document
                    file={activeUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="py-24 text-center space-y-3">
                        <Loader2 className="w-7 h-7 text-brand animate-spin mx-auto" />
                        <p className="font-mono text-[10px] text-zinc-550 uppercase tracking-widest">Linearizing document stream...</p>
                      </div>
                    }
                  >
                    <div 
                      id="pdf-annotation-container"
                      className="relative block rounded-xl overflow-hidden shadow-lg select-none"
                      style={{ 
                        userSelect: isAnnotating && annotationMode === 'draw' ? 'none' : 'auto',
                        touchAction: 'none'
                      }}
                    >
                      <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        loading={
                          <div className="py-20 text-center text-zinc-650 font-mono text-[9px] uppercase tracking-widest animate-pulse">
                            Assembling vector page...
                          </div>
                        }
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="max-w-full overflow-hidden rounded-xl"
                      />

                      {/* Interactive Annotation Canvas Overlay */}
                      {isAnnotating && (
                        <div
                          id="annotation-canvas-overlay"
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          className="absolute inset-0 z-30"
                          style={{
                            cursor: annotationMode === 'draw' ? 'crosshair' : 'text'
                          }}
                        >
                          {/* Render Existing Strokes */}
                          <svg 
                            className="absolute inset-0 w-full h-full pointer-events-none" 
                            viewBox="0 0 100 100" 
                            preserveAspectRatio="none"
                          >
                            {(strokesByPage[pageNumber] || []).map((stroke) => (
                              <path
                                key={stroke.id}
                                d={getSvgPathFromPoints(stroke.points)}
                                fill="none"
                                stroke={stroke.color}
                                strokeWidth={stroke.brushSize * 0.16}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            ))}
                            {currentStroke.length > 0 && (
                              <path
                                d={getSvgPathFromPoints(currentStroke)}
                                fill="none"
                                stroke={currentColor}
                                strokeWidth={brushSize * 0.16}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                          </svg>

                          {/* Render Existing Text Boxes */}
                          {(textByPage[pageNumber] || []).map((box) => (
                            <div
                              key={box.id}
                              className="absolute z-40"
                              style={{
                                left: `${box.x}%`,
                                top: `${box.y}%`,
                                transform: 'translate(-50%, -50%)',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              {box.isEditing ? (
                                <input
                                  type="text"
                                  value={box.text}
                                  onChange={(e) => updateTextBoxText(box.id, e.target.value)}
                                  onBlur={() => finishEditingTextBox(box.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') finishEditingTextBox(box.id);
                                  }}
                                  autoFocus
                                  className="bg-[#050508]/95 text-white rounded px-2 py-1 font-sans border-2 border-brand shadow-2xl text-[12px] outline-none min-w-[120px] text-center"
                                  style={{
                                    color: box.color,
                                    fontSize: `${box.fontSize}px`,
                                  }}
                                />
                              ) : (
                                <div className="flex items-center gap-1.5 bg-[#09090f]/95 hover:bg-[#0d0d14]/95 backdrop-blur-sm px-2.5 py-1 rounded border border-zinc-800/85 hover:border-zinc-700 transition-all shadow-md group">
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingTextBox(box.id);
                                    }}
                                    className="cursor-text font-serif select-all font-medium tracking-wide whitespace-nowrap"
                                    style={{
                                      color: box.color,
                                      fontSize: `${box.fontSize}px`,
                                    }}
                                  >
                                    {box.text || 'Type...'}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTextBox(box.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-red-400 rounded hover:bg-zinc-800 transition-all cursor-pointer"
                                    title="Delete Text"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Document>
                </motion.div>
              ) : (
                <div className="my-auto text-center font-mono text-xs text-zinc-500">
                  No reference URL generated. Select a valid source.
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Floating Controls HUD bar */}
          {!pdfLoadError && numPages && numPages > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#09090f]/80 backdrop-blur-md border border-zinc-850/60 p-2.5 rounded-2xl flex items-center gap-3.5 shadow-2xl z-20">
              {/* Pagination section */}
              <div className="flex items-center gap-1 border-r border-zinc-850 pr-3">
                <button
                  onClick={() => changePage(-1)}
                  disabled={pageNumber <= 1}
                  className="p-1 px-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Previous Page (Left Arrow)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-[10px] text-zinc-305 px-1 min-w-[70px] text-center">
                  Page <strong className="text-white">{pageNumber}</strong> of {numPages}
                </span>
                <button
                  onClick={() => changePage(1)}
                  disabled={pageNumber >= numPages}
                  className="p-1 px-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Next Page (Right Arrow)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Scaling HUD */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleZoom(-0.15)}
                  disabled={scale <= 0.6}
                  className="p-1 px-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-30 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={resetZoom}
                  className="font-mono text-[10px] text-zinc-350 hover:text-white px-1.5 py-0.5 rounded border border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900 transition-colors"
                  title="Reset Zoom"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  onClick={() => handleZoom(0.15)}
                  disabled={scale >= 2.4}
                  className="p-1 px-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-30 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info & Side Audit Desk */}
        <div className="w-full md:w-80 bg-[#09090e] border-t md:border-t-0 md:border-l border-zinc-900 p-5 flex flex-col justify-between overflow-y-auto select-none space-y-6 flex-shrink-0">
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900/60">
              {/* Unified Side Tabs Switcher */}
              <div className="flex-1 grid grid-cols-3 gap-0.5 p-1 bg-zinc-950 rounded-xl border border-zinc-900 mr-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('annotations')}
                  className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[9px] uppercase tracking-wider font-mono font-bold transition-all cursor-pointer ${
                    activeTab === 'annotations'
                      ? 'bg-brand text-zinc-950 font-black shadow-[0_0_12.5px_rgba(245,158,11,0.15)]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <PenTool className="w-2.5 h-2.5" />
                  <span>Markup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ocr')}
                  className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[9px] uppercase tracking-wider font-mono font-bold transition-all cursor-pointer ${
                    activeTab === 'ocr'
                      ? 'bg-brand text-zinc-950 font-black shadow-[0_0_12.5px_rgba(245,158,11,0.15)]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <FileText className="w-2.5 h-2.5 text-inherit" />
                  <span>OCR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('metadata')}
                  className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[9px] uppercase tracking-wider font-mono font-bold transition-all cursor-pointer ${
                    activeTab === 'metadata'
                      ? 'bg-brand text-zinc-950 font-black shadow-[0_0_12.5px_rgba(245,158,11,0.15)]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Sliders className="w-2.5 h-2.5" />
                  <span>Meta</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="hidden md:flex p-1.5 rounded-lg bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Exit preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content for Tabs */}
            <AnimatePresence mode="wait">
              {activeTab === 'annotations' ? (
                <motion.div
                  key="annotations"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-1 inline-flex w-full">
                    <span className="text-[10px] font-heading font-black text-brand uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-brand" /> Editor Workspace
                    </span>
                    
                    {/* Master Switcher Toggle */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">Interactive</span>
                      <button
                        type="button"
                        onClick={() => setIsAnnotating(p => !p)}
                        className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                          isAnnotating ? 'bg-emerald-500' : 'bg-zinc-800'
                        }`}
                        aria-label="Toggle annotations view overlay"
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-black shadow transition-transform duration-200 ${
                            isAnnotating ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {isAnnotating ? (
                    <div className="space-y-4">
                      {/* Tool Pickers (Draw vs Text) */}
                      <div className="space-y-1">
                        <span className="block text-[8px] uppercase tracking-widest text-zinc-550 font-mono">Annotate Mode</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAnnotationMode('draw')}
                            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 font-mono text-xs font-bold border transition-all cursor-pointer ${
                              annotationMode === 'draw'
                                ? 'bg-zinc-900 border-zinc-750 text-white shadow-md'
                                : 'bg-zinc-950/40 border-zinc-900 text-zinc-550 hover:text-zinc-400'
                            }`}
                          >
                            <PenTool className="w-3.5 h-3.5 text-brand" />
                            <span>Pen Draw</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAnnotationMode('text')}
                            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 font-mono text-xs font-bold border transition-all cursor-pointer ${
                              annotationMode === 'text'
                                ? 'bg-zinc-900 border-zinc-750 text-white shadow-md'
                                : 'bg-zinc-950/40 border-zinc-900 text-zinc-550 hover:text-zinc-400'
                            }`}
                          >
                            <Type className="w-3.5 h-3.5 text-brand" />
                            <span>Text Box</span>
                          </button>
                        </div>
                      </div>

                      {/* Palette Selector */}
                      <div className="space-y-1.5">
                        <span className="block text-[8px] uppercase tracking-widest text-zinc-550 font-mono">Palette Choice</span>
                        <div className="grid grid-cols-6 gap-1 bg-zinc-950 p-2 rounded-xl border border-zinc-900">
                          {[
                            { value: '#fbbf24', label: 'Amber' },
                            { value: '#10b981', label: 'Emerald' },
                            { value: '#3b82f6', label: 'Blue' },
                            { value: '#ef4444', label: 'Cardinal' },
                            { value: '#ffffff', label: 'White' },
                            { value: '#0f0f15', label: 'Dark' }
                          ].map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => setCurrentColor(color.value)}
                              className="w-6 h-6 rounded-full border border-zinc-800 flex items-center justify-center relative transition-all hover:scale-110 cursor-pointer mx-auto"
                              style={{ backgroundColor: color.value }}
                              title={color.label}
                            >
                              {currentColor === color.value && (
                                <Check className={`w-3.5 h-3.5 font-bold ${color.value === '#ffffff' ? 'text-black' : 'text-white'}`} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Attribute Sliders/Buttons */}
                      {annotationMode === 'draw' ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] uppercase tracking-widest text-zinc-550 font-mono">Line Thickness</span>
                            <span className="font-mono text-[10px] text-zinc-400 font-bold">{brushSize}px</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-900">
                            {[2, 4, 8, 14].map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setBrushSize(size)}
                                className={`py-1 rounded font-mono text-[9px] font-bold uppercase transition-all text-center cursor-pointer ${
                                  brushSize === size
                                    ? 'bg-[#181824] text-white border border-zinc-750'
                                    : 'text-zinc-500 hover:text-zinc-400'
                                }`}
                              >
                                {size === 2 ? 'Thin' : size === 4 ? 'Med' : size === 8 ? 'Thick' : 'Mark'}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] uppercase tracking-widest text-zinc-550 font-mono">Font Scale</span>
                            <span className="font-mono text-[10px] text-zinc-400 font-bold">{fontSize}px</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-900">
                            {[12, 16, 22, 32].map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setFontSize(size)}
                                className={`py-1 rounded font-mono text-[9px] font-bold uppercase transition-all text-center cursor-pointer ${
                                  fontSize === size
                                    ? 'bg-[#181824] text-white border border-zinc-750'
                                    : 'text-zinc-500 hover:text-zinc-400'
                                }`}
                              >
                                {size === 12 ? 'Small' : size === 16 ? 'Norm' : size === 22 ? 'Large' : 'Hero'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Active Status stats panel */}
                      <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-900 space-y-2.5 text-[11px]">
                        <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono pb-1 border-b border-zinc-900/50 flex justify-between items-center">
                          <span>Active Markup (Page {pageNumber})</span>
                          <span className="font-mono text-[9.5px] text-brand">Workspace Live</span>
                        </div>
                        
                        <div className="space-y-1 text-zinc-400 font-sans text-[10.5px]">
                          <ul className="list-disc pl-3.5 space-y-1">
                            <li>Strokes drawn: <strong className="text-zinc-300 font-mono">{(strokesByPage[pageNumber] || []).length}</strong></li>
                            <li>Text boxes: <strong className="text-zinc-300 font-mono">{(textByPage[pageNumber] || []).length}</strong></li>
                          </ul>
                        </div>
                        
                        <button
                          type="button"
                          onClick={clearPageAnnotations}
                          disabled={!(strokesByPage[pageNumber]?.length || textByPage[pageNumber]?.length)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-red-950 text-[10px] font-mono uppercase bg-red-950/10 text-red-400 hover:bg-red-950/25 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear Page {pageNumber}</span>
                        </button>
                      </div>

                      {/* Export markup options */}
                      <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-900 space-y-2 text-[11px]">
                        <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono pb-1 border-b border-zinc-900/50">
                          Export Page with Annotations
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleExportAnnotatedPage('png')}
                            disabled={isExportingMarkup}
                            className="py-2 px-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white text-[10px] font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5 text-brand" />
                            <span>PNG Image</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportAnnotatedPage('pdf')}
                            disabled={isExportingMarkup}
                            className="py-2 px-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white text-[10px] font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <FileText className="w-3.5 h-3.5 text-brand" />
                            <span>PDF Page</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#0b0b12] p-2.5 rounded-xl border border-zinc-900/60 text-[10px] text-zinc-500 flex gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-brand select-none flex-shrink-0 mt-0.5" />
                        <p className="leading-relaxed font-sans">
                          {annotationMode === 'draw' 
                            ? 'Draw directly onto the document canvas above. Your vector strokes will remain local.' 
                            : 'Click anywhere on the PDF cover to place customizable textual annotations.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-1.5 border border-dashed border-zinc-900 rounded-xl">
                      <span className="block text-zinc-500 font-mono text-[10px] uppercase">Markup overlay hidden</span>
                      <span className="block text-zinc-650 text-[9px]">Toggle the dynamic overlay back on to edit documents manually.</span>
                    </div>
                  )}
                </motion.div>
              ) : activeTab === 'metadata' ? (
                <motion.div
                  key="metadata"
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <span className="block text-[8px] uppercase tracking-widest text-zinc-550 font-mono">Filename / Handle</span>
                    <span className="block text-xs text-white font-medium font-mono truncate bg-zinc-950 px-2.5 py-1.5 rounded border border-zinc-900/40">
                      {file.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <span className="block text-[8px] uppercase tracking-widest text-zinc-550 font-mono">Original File Size</span>
                      <span className="block text-xs font-mono font-bold text-zinc-300">
                        {file.originalSizeStr}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[8px] uppercase tracking-widest text-zinc-550 font-mono">Modified Size</span>
                      <span className={`block text-xs font-mono font-bold ${file.compressedSizeStr ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {file.compressedSizeStr || 'Operational Pending'}
                      </span>
                    </div>
                  </div>

                  {file.metadata && (
                    <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-900 space-y-3 text-[11px]">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono pb-1 border-b border-zinc-900/50">
                        Injected PDF Metadata
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-zinc-550 text-[9px] block">Title Override</span>
                        <span className="text-zinc-300 font-medium truncate block">{file.metadata.title || 'None / Not set'}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <span className="text-zinc-550 text-[9px] block">Author</span>
                          <span className="text-zinc-300 font-medium truncate block">{file.metadata.author || 'None'}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-550 text-[9px] block">Subject</span>
                          <span className="text-zinc-300 font-medium truncate block">{file.metadata.subject || 'None'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Watermark Stencil Settings */}
                  {file.watermarkType && file.watermarkType !== 'none' && (
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-brand/10 space-y-2.5 text-[11px]">
                      <div className="text-[9px] uppercase tracking-wider text-brand/70 font-mono pb-1 border-b border-brand/5">
                        Watermark Overlay Layer
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-zinc-550 text-[9px] block">Type</span>
                          <span className="text-zinc-300 font-semibold uppercase">{file.watermarkType}</span>
                        </div>
                        <div>
                          <span className="text-zinc-550 text-[9px] block">Position</span>
                          <span className="text-zinc-300 font-semibold uppercase">{file.watermarkPosition}</span>
                        </div>
                      </div>
                      {file.watermarkType === 'text' && (
                        <div>
                          <span className="text-zinc-550 text-[9px] block font-mono">Overlay Text Content</span>
                          <span className="text-white block font-mono truncate bg-zinc-950 px-2 py-1 rounded border border-zinc-900/60 text-[10.5px]">
                            "{file.watermarkText}"
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                /* OCR TAB COMPONENT GRAPHIC UTILITY */
                <motion.div
                  key="ocr-workspace"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div className="pb-1 inline-flex w-full">
                    <span className="text-[10px] font-heading font-black text-brand uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" /> OCR Text Engine
                    </span>
                  </div>

                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-900 space-y-3.5">
                    <div className="space-y-1">
                      <label className="block text-[8px] uppercase tracking-widest text-zinc-500 font-mono">Trained Language Model</label>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => {
                          setSelectedLanguage(e.target.value);
                          setOcrError(null);
                        }}
                        disabled={isOcrRunning}
                        className="w-full bg-[#050508] border border-zinc-850 rounded-lg px-2.5 py-2 text-white font-sans text-xs focus:outline-none focus:border-brand/40 uppercase tracking-wide cursor-pointer disabled:opacity-40"
                      >
                        <option value="eng">English (General)</option>
                        <option value="spa">Spanish (Español)</option>
                        <option value="fra">French (Français)</option>
                        <option value="deu">German (Deutsch)</option>
                        <option value="por">Portuguese (Português)</option>
                      </select>
                      <p className="text-[9px] text-zinc-650 leading-normal font-sans">
                        Select dictionary targeting document vocabularies for precise transcribing.
                      </p>
                    </div>

                    {isOcrRunning ? (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span>{ocrProgress?.status || 'Analyzing bitmap...'}</span>
                          <span>{ocrProgress ? Math.round(ocrProgress.progress * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div 
                            className="bg-brand h-full rounded-full transition-all duration-300"
                            style={{ width: `${(ocrProgress?.progress || 0) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRunOcr}
                        className="w-full py-2.5 px-3 rounded-lg bg-brand hover:bg-brand-hover text-zinc-950 font-heading text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                        <span>Extract Text — Page {pageNumber}</span>
                      </button>
                    )}
                  </div>

                  {ocrError && (
                    <div className="p-3 bg-red-950/10 border border-red-900/30 text-rose-400 font-mono text-[10px] rounded-lg italic leading-relaxed">
                      {ocrError}
                    </div>
                  )}

                  {ocrTextByPage[pageNumber] !== undefined ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-550 border-b border-zinc-900 pb-1">
                        <span>Extracted Text Bounds</span>
                        <span className="text-emerald-400 font-bold">Successfully Scanned</span>
                      </div>

                      {ocrTextByPage[pageNumber].trim() === '' ? (
                        <div className="p-4 bg-zinc-950 rounded-xl border border-dashed border-zinc-900 text-center space-y-1.5">
                          <p className="text-[11px] font-mono text-zinc-500 uppercase">Blank Page Matrix</p>
                          <p className="text-[9.5px] text-zinc-650 leading-normal font-sans">No physical characters matching alphabets were isolated. Ensure page is not a blank layout.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <pre className="p-3 bg-zinc-950 rounded-xl border border-zinc-900/80 text-white font-mono text-[11px] leading-relaxed max-h-[180px] overflow-y-auto whitespace-pre-wrap select-text selection:bg-brand/35 scrollbar-thin">
                            {ocrTextByPage[pageNumber]}
                          </pre>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={copyOcrText}
                              className={`py-2 px-3 rounded-lg border text-[10px] font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                copiedText
                                  ? 'bg-emerald-950/10 border-emerald-900/30 text-emerald-400'
                                  : 'bg-zinc-900 border-zinc-805 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white'
                              }`}
                            >
                              {copiedText ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Text</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={downloadOcrText}
                              className="py-2 px-3 rounded-lg border border-zinc-805 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-305 hover:text-white text-[10px] font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-brand" />
                              <span>Save (.txt)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-zinc-950/50 rounded-xl border border-dashed border-zinc-900 text-center py-6 select-none leading-normal">
                      <p className="text-zinc-550 text-[10px] uppercase font-mono font-bold">Unscanned Page Content</p>
                      <p className="text-zinc-600 text-[10px] mt-1 max-w-[200px] mx-auto font-sans">Click extract to transcribe standard digital image/canvas page data into searchable markdown layouts.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-900/60">
            <div className="bg-[#0b0b12] p-3 rounded-xl border border-zinc-900 text-[11.5px] text-zinc-400 flex gap-2">
              <Info className="w-4 h-4 text-brand select-none flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed font-sans">
                You are inspecting a client-side sandbox environment render. PDF content remains completely local.
              </p>
            </div>

            {/* Quick interactive file save */}
            {activeUrl && (
              <a
                href={activeUrl}
                download={file.stage === 'complete' ? `APEX_Optimized_${file.name}` : file.name}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-heading font-black uppercase text-white tracking-widest transition-all cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4 text-brand" />
                <span>Save File</span>
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

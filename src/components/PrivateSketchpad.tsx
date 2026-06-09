import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, Square, Circle, Minus, ArrowRight, Type, Eraser, 
  MousePointer, Undo, Redo, Trash2, Download, Copy, Info, 
  Sparkles, Check, ChevronDown, Save, FolderOpen, Grid, RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { logToolUsage } from '../utils/toolAnalytics';
import useLocalStoragePersistence from '../hooks/useLocalStoragePersistence';

// Interface definitions for scalable vector shapes
interface Point {
  x: number;
  y: number;
}

interface ShapeElement {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'arrow' | 'pen' | 'text';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  points?: Point[]; // Only used for freehand pen
  text?: string;
  strokeColor: string;
  fillColor: string; // 'transparent', semi-transparent glaze, or solid
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  isSketchy: boolean; // Enables Excalidraw-like organic wobbly math
}

type ActiveTool = 'select' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'pen' | 'text' | 'eraser';
type GridStyle = 'dots' | 'grid' | 'none';

// Luxury preset color palette
const COLOR_PRESETS = [
  { value: '#ffffff', name: 'Alabaster White' },
  { value: '#10b981', name: 'Emerald Glow' },
  { value: '#3b82f6', name: 'Cobalt Neon' },
  { value: '#a855f7', name: 'Amethyst Pulse' },
  { value: '#f43f5e', name: 'Crimson Ember' },
  { value: '#eab308', name: 'Solar Amber' },
  { value: '#06b6d4', name: 'Cyan Chill' },
];

const FILL_OPACITY_PRESETS = [
  { value: 'transparent', label: 'Outline Only' },
  { value: 'rgba(255, 255, 255, 0.1)', label: 'Semi Glaze' },
  { value: 'solid', label: 'Solid Core' }
];

export default function PrivateSketchpad() {
  const { t } = useLanguage();
  
  // Element list & Canvas setup states with offline periodic persistence
  const [elements, setElements, { lastSaved, forceSave }] = useLocalStoragePersistence<ShapeElement[]>(
    'apex_private_sketchpad_data',
    [],
    { interval: 4000 }
  );
  
  const [history, setHistory] = useState<ShapeElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [gridStyle, setGridStyle] = useState<GridStyle>('dots');
  const [sketchyHandDrawn, setSketchyHandDrawn] = useState<boolean>(true);
  
  // Brush styling states
  const [strokeColor, setStrokeColor] = useState<string>('#ffffff');
  const [fillColorOption, setFillColorOption] = useState<string>('transparent'); // 'transparent', 'glaze', 'solid'
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [strokeStyle, setStrokeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  
  // Interaction & mouse tracking refs/states
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [action, setAction] = useState<'none' | 'drawing' | 'moving' | 'editing'>('none');
  const [textInputVal, setTextInputVal] = useState<string>('');
  const [activeTextPos, setActiveTextPos] = useState<Point | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartPos = useRef<Point>({ x: 0, y: 0 });
  const startDragPositions = useRef<Record<string, { x1: number; y1: number; x2: number; y2: number; points?: Point[] }>>({});
  
  // Toast, copy progress, export loading notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 500 });

  // Auto load history from LocalStorage/Hook loaded state on count
  useEffect(() => {
    logToolUsage('private-sketchpad');
    if (elements && elements.length > 0 && history.length === 0) {
      setHistory([elements]);
      setHistoryIndex(0);
      showToast('Draft Auto-Recovered Safely Offline!');
    }
  }, [elements]);

  // Save current elements to LocalStorage using manual force save mechanism of hook
  const saveToLocal = (currentElements: ShapeElement[]) => {
    forceSave(currentElements);
  };

  // Toast notifier helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Push new state to history stack for continuous Undos
  const pushState = (newElements: ShapeElement[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    setHistory([...updatedHistory, newElements]);
    setHistoryIndex(updatedHistory.length);
    setElements(newElements);
    saveToLocal(newElements);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setElements(history[nextIdx]);
      saveToLocal(history[nextIdx]);
      setSelectedId(null);
      showToast('Undone');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setElements(history[nextIdx]);
      saveToLocal(history[nextIdx]);
      showToast('Redone');
    }
  };

  // Handles responsive canvas size mapping to the parent node bounding rect.
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setCanvasDimensions({
          width: Math.max(600, rect.width - 2),
          height: Math.max(450, window.innerHeight - 340)
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Excalidraw wobbly math line drawer
  // Returns points for the hand-drawn organic jitter curve
  const getHandDrawnPoints = (x1: number, y1: number, x2: number, y2: number, seedOffset = 1.3): Point[] => {
    const distance = Math.hypot(x2 - x1, y2 - y1);
    if (distance < 5) return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    
    const steps = Math.max(3, Math.min(10, Math.floor(distance / 40)));
    const pts: Point[] = [{ x: x1, y: y1 }];
    
    for (let i = 1; i < steps; i++) {
      const ratio = i / steps;
      const tx = x1 + (x2 - x1) * ratio;
      const ty = y1 + (y2 - y1) * ratio;
      
      // Add orthogonal shift noise
      const normalX = -(y2 - y1) / distance;
      const normalY = (x2 - x1) / distance;
      const jitter = (Math.random() - 0.5) * seedOffset * 2.4;
      
      pts.push({
        x: tx + normalX * jitter,
        y: ty + normalY * jitter
      });
    }
    pts.push({ x: x2, y: y2 });
    return pts;
  };

  // Dynamic canvas drawing routine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and match crisp device resolutions
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Grid backing patterns
    if (gridStyle === 'dots') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      const sizeList = 24;
      for (let x = 0; x < canvas.width; x += sizeList) {
        for (let y = 0; y < canvas.height; y += sizeList) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (gridStyle === 'grid') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      const spacing = 30;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();
    }

    // 2. Map through elements and render
    elements.forEach((el) => {
      ctx.save();
      
      // Style parameters
      ctx.strokeStyle = el.strokeColor;
      ctx.lineWidth = el.strokeWidth;
      
      if (el.strokeStyle === 'dashed') {
        ctx.setLineDash([8, 8]);
      } else if (el.strokeStyle === 'dotted') {
        ctx.setLineDash([2, 6]);
      } else {
        ctx.setLineDash([]);
      }

      const isGlaze = el.fillColor && el.fillColor.startsWith('rgba');
      const isSolid = el.fillColor && el.fillColor !== 'transparent' && !isGlaze;
      ctx.fillStyle = isSolid ? el.strokeColor : (isGlaze ? el.fillColor : 'transparent');

      // Utility sketchy line drawer with subtle overlaps
      const drawSketchyLine = (sx1: number, sy1: number, sx2: number, sy2: number) => {
        // Draw double line stroke with random slight differences for Excalidraw vibe
        for (let attempt = 0; attempt < 2; attempt++) {
          const pathPoints = getHandDrawnPoints(sx1, sy1, sx2, sy2, el.strokeWidth * 0.65);
          ctx.beginPath();
          ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
          for (let i = 1; i < pathPoints.length; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
          }
          ctx.stroke();
        }
      };

      if (el.type === 'rectangle') {
        const rx = Math.min(el.x1, el.x2);
        const ry = Math.min(el.y1, el.y2);
        const rw = Math.abs(el.x2 - el.x1);
        const rh = Math.abs(el.y2 - el.y1);

        if (el.fillColor !== 'transparent') {
          ctx.beginPath();
          ctx.rect(rx, ry, rw, rh);
          ctx.fill();
        }

        if (el.isSketchy) {
          // Sketchy layout draws 4 independent bounding lines
          drawSketchyLine(rx, ry, rx + rw, ry);
          drawSketchyLine(rx + rw, ry, rx + rw, ry + rh);
          drawSketchyLine(rx + rw, ry + rh, rx, ry + rh);
          drawSketchyLine(rx, ry + rh, rx, ry);
        } else {
          ctx.beginPath();
          ctx.rect(rx, ry, rw, rh);
          ctx.stroke();
        }
      } 
      else if (el.type === 'circle') {
        const rx = Math.min(el.x1, el.x2);
        const ry = Math.min(el.y1, el.y2);
        const rw = Math.abs(el.x2 - el.x1);
        const rh = Math.abs(el.y2 - el.y1);

        const cx = rx + rw / 2;
        const cy = ry + rh / 2;
        const radiusX = rw / 2;
        const radiusY = rh / 2;

        if (el.fillColor !== 'transparent') {
          ctx.beginPath();
          ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        if (el.isSketchy) {
          // Draw wobbly ellipse with double passes
          for (let pass = 0; pass < 2; pass++) {
            ctx.beginPath();
            const segments = 32;
            for (let i = 0; i <= segments; i++) {
              const theta = (i / segments) * Math.PI * 2;
              const radialJitter = 1 + (Math.random() - 0.5) * 0.04;
              const ex = cx + radiusX * Math.cos(theta) * radialJitter;
              const ey = cy + radiusY * Math.sin(theta) * radialJitter;
              if (i === 0) {
                ctx.moveTo(ex, ey);
              } else {
                ctx.lineTo(ex, ey);
              }
            }
            ctx.stroke();
          }
        } else {
          ctx.beginPath();
          ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } 
      else if (el.type === 'line') {
        if (el.isSketchy) {
          drawSketchyLine(el.x1, el.y1, el.x2, el.y2);
        } else {
          ctx.beginPath();
          ctx.moveTo(el.x1, el.y1);
          ctx.lineTo(el.x2, el.y2);
          ctx.stroke();
        }
      } 
      else if (el.type === 'arrow') {
        // Draw arrow body shaft
        if (el.isSketchy) {
          drawSketchyLine(el.x1, el.y1, el.x2, el.y2);
        } else {
          ctx.beginPath();
          ctx.moveTo(el.x1, el.y1);
          ctx.lineTo(el.x2, el.y2);
          ctx.stroke();
        }

        // Draw arrow head tip pointing to end dest coordinate
        const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
        const headlen = Math.max(12, el.strokeWidth * 4); // Arrowhead dynamic width
        const headX1 = el.x2 - headlen * Math.cos(angle - Math.PI / 6);
        const headY1 = el.y2 - headlen * Math.sin(angle - Math.PI / 6);
        const headX2 = el.x2 - headlen * Math.cos(angle + Math.PI / 6);
        const headY2 = el.y2 - headlen * Math.sin(angle + Math.PI / 6);

        if (el.isSketchy) {
          drawSketchyLine(el.x2, el.y2, headX1, headY1);
          drawSketchyLine(el.x2, el.y2, headX2, headY2);
        } else {
          ctx.beginPath();
          ctx.moveTo(el.x2, el.y2);
          ctx.lineTo(headX1, headY1);
          ctx.moveTo(el.x2, el.y2);
          ctx.lineTo(headX2, headY2);
          ctx.stroke();
        }
      } 
      else if (el.type === 'pen') {
        if (el.points && el.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
        }
      } 
      else if (el.type === 'text') {
        ctx.fillStyle = el.strokeColor;
        ctx.font = `bold ${14 + el.strokeWidth * 2}px var(--font-mono, "JetBrains Mono", monospace)`;
        ctx.textBaseline = 'top';
        ctx.fillText(el.text || '', el.x1, el.y1);
      }

      ctx.restore();

      // Show temporary selection borders for active highlight
      if (selectedId === el.id) {
        ctx.save();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        
        const minX = Math.min(el.x1, el.x2) - 8;
        const minY = Math.min(el.y1, el.y2) - 8;
        const maxX = Math.max(el.x1, el.x2) + 8;
        const maxY = Math.max(el.y1, el.y2) + 8;

        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        
        // Selection handle dots
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(minX - 3, minY - 3, 6, 6);
        ctx.fillRect(maxX - 3, minY - 3, 6, 6);
        ctx.fillRect(maxX - 3, maxY - 3, 6, 6);
        ctx.fillRect(minX - 3, maxY - 3, 6, 6);
        ctx.restore();
      }
    });
  }, [elements, gridStyle, selectedId, canvasDimensions]);

  // Point hit test calculator for mouse selection
  const isPointNearElement = (px: number, py: number, el: ShapeElement): boolean => {
    const threshold = 10;
    
    if (el.type === 'rectangle') {
      const minX = Math.min(el.x1, el.x2) - threshold;
      const minY = Math.min(el.y1, el.y2) - threshold;
      const maxX = Math.max(el.x1, el.x2) + threshold;
      const maxY = Math.max(el.y1, el.y2) + threshold;
      return px >= minX && px <= maxX && py >= minY && py <= maxY;
    }
    
    if (el.type === 'circle') {
      // Bounding check for ease of select
      const minX = Math.min(el.x1, el.x2) - threshold;
      const minY = Math.min(el.y1, el.y2) - threshold;
      const maxX = Math.max(el.x1, el.x2) + threshold;
      const maxY = Math.max(el.y1, el.y2) + threshold;
      return px >= minX && px <= maxX && py >= minY && py <= maxY;
    }
    
    if (el.type === 'line' || el.type === 'arrow') {
      // Calculate perpendicular distance to a line segment
      const dx = el.x2 - el.x1;
      const dy = el.y2 - el.y1;
      const lengthSquared = dx * dx + dy * dy;
      if (lengthSquared === 0) return Math.hypot(px - el.x1, py - el.y1) < threshold;
      
      let tValue = ((px - el.x1) * dx + (py - el.y1) * dy) / lengthSquared;
      tValue = Math.max(0, Math.min(1, tValue));
      const closestX = el.x1 + tValue * dx;
      const closestY = el.y1 + tValue * dy;
      return Math.hypot(px - closestX, py - closestY) < threshold;
    }
    
    if (el.type === 'pen') {
      if (!el.points) return false;
      return el.points.some(pt => Math.hypot(px - pt.x, py - pt.y) < threshold);
    }
    
    if (el.type === 'text') {
      const minX = Math.min(el.x1, el.x2) - threshold;
      const minY = Math.min(el.y1, el.y2) - threshold;
      // Estimate broad height for text selection
      return px >= minX && px <= el.x1 + 180 && py >= minY && py <= el.y1 + 40;
    }
    
    return false;
  };

  // Canvas Mouse Coordinates Extractor
  const getMouseCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Escape text editing
    if (action === 'editing') return;

    const { x, y } = getMouseCoords(e);
    dragStartPos.current = { x, y };

    if (activeTool === 'select' || activeTool === 'eraser') {
      // Match element under cursor (search backwards to pick topmost shape)
      const clickedEl = [...elements].reverse().find(el => isPointNearElement(x, y, el));
      
      if (clickedEl) {
        if (activeTool === 'eraser') {
          const remaining = elements.filter(el => el.id !== clickedEl.id);
          pushState(remaining);
          setSelectedId(null);
          showToast('Element Removed');
        } else {
          // Select & prepare moving
          setSelectedId(clickedEl.id);
          setAction('moving');
          
          // Capture start coords for translations
          startDragPositions.current = elements.reduce((acc, el) => {
            acc[el.id] = { 
              x1: el.x1, 
              y1: el.y1, 
              x2: el.x2, 
              y2: el.y2,
              points: el.points ? [...el.points] : undefined
            };
            return acc;
          }, {} as any);
        }
      } else {
        setSelectedId(null);
      }
    } 
    else if (activeTool === 'text') {
      // Spawn text node inline
      setActiveTextPos({ x, y });
      setTextInputVal('');
      setAction('editing');
    } 
    else {
      // Create new shape element
      const finalColor = fillColorOption === 'transparent' 
        ? 'transparent' 
        : (fillColorOption === 'solid' ? strokeColor : 'rgba(255, 255, 255, 0.15)');

      const newEl: ShapeElement = {
        id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: activeTool,
        x1: x,
        y1: y,
        x2: x,
        y2: y,
        points: activeTool === 'pen' ? [{ x, y }] : undefined,
        strokeColor,
        fillColor: finalColor,
        strokeWidth,
        strokeStyle,
        isSketchy: sketchyHandDrawn
      };

      setElements([...elements, newEl]);
      setAction('drawing');
      setSelectedId(newEl.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (action === 'none') return;
    const { x, y } = getMouseCoords(e);

    if (action === 'drawing' && selectedId) {
      // Update dimensions of current shape
      setElements(prev => prev.map(el => {
        if (el.id === selectedId) {
          if (el.type === 'pen' && el.points) {
            return { ...el, points: [...el.points, { x, y }], x2: x, y2: y };
          }
          return { ...el, x2: x, y2: y };
        }
        return el;
      }));
    } 
    else if (action === 'moving' && selectedId) {
      // Shift coordinates relative to drag start offset
      const dx = x - dragStartPos.current.x;
      const dy = y - dragStartPos.current.y;

      setElements(prev => prev.map(el => {
        if (el.id === selectedId) {
          const original = startDragPositions.current[selectedId];
          if (!original) return el;
          
          if (el.type === 'pen' && original.points) {
            return {
              ...el,
              x1: original.x1 + dx,
              y1: original.y1 + dy,
              x2: original.x2 + dx,
              y2: original.y2 + dy,
              points: original.points.map(pt => ({ x: pt.x + dx, y: pt.y + dy }))
            };
          }
          return {
            ...el,
            x1: original.x1 + dx,
            y1: original.y1 + dy,
            x2: original.x2 + dx,
            y2: original.y2 + dy
          };
        }
        return el;
      }));
    }
  };

  const handleMouseUp = () => {
    if (action === 'drawing' || action === 'moving') {
      setAction('none');
      pushState(elements); // Save to local state history
    }
  };

  // Submit inline text entry
  const handleSubmitText = () => {
    if (!activeTextPos || !textInputVal.trim()) {
      setAction('none');
      setActiveTextPos(null);
      return;
    }

    const { x, y } = activeTextPos;
    const newEl: ShapeElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      x1: x,
      y1: y,
      x2: x + 150,
      y2: y + 25,
      text: textInputVal,
      strokeColor,
      fillColor: 'transparent',
      strokeWidth,
      strokeStyle: 'solid',
      isSketchy: false
    };

    const nextElements = [...elements, newEl];
    pushState(nextElements);
    setAction('none');
    setActiveTextPos(null);
    setTextInputVal('');
    setActiveTool('select');
  };

  // Clear workspace board completely
  const handleClearWorkspace = () => {
    if (window.confirm('Delete all drawn elements and clear the sketchpad?')) {
      pushState([]);
      setSelectedId(null);
      localStorage.removeItem('apex_private_sketchpad_data');
      showToast('Workspace Cleared Off');
    }
  };

  // Delete matching selection key listener support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in textarea inputs
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') {
        return;
      }
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const remaining = elements.filter(el => el.id !== selectedId);
        pushState(remaining);
        setSelectedId(null);
        showToast('Element Deleted');
      }

      // Keyboard hotkeys for fast sketching tool select
      const keyUpper = e.key.toUpperCase();
      if (keyUpper === 'V') setActiveTool('select');
      else if (keyUpper === 'R') setActiveTool('rectangle');
      else if (keyUpper === 'O') setActiveTool('circle');
      else if (keyUpper === 'L') setActiveTool('line');
      else if (keyUpper === 'A') setActiveTool('arrow');
      else if (keyUpper === 'P') setActiveTool('pen');
      else if (keyUpper === 'T') setActiveTool('text');
      else if (keyUpper === 'E') setActiveTool('eraser');

      // Undo combinations
      if (e.ctrlKey && keyUpper === 'Z') {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && keyUpper === 'Y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, historyIndex, history]);

  // Export raster high-res PNG locally
  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const tempLink = document.createElement('a');
      tempLink.href = dataUrl;
      tempLink.download = `APEX_Sketch_${Date.now()}.png`;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      showToast('Saved PNG Sketch!');
    } catch (e) {
      console.error(e);
      showToast('Export failed. Check canvas taint');
    }
  };

  // Export Vector SVG cleanly
  const handleDownloadSVG = () => {
    if (elements.length === 0) {
      showToast('Standard Outline: Sketchpad is empty!');
      return;
    }

    const { width, height } = canvasDimensions;
    let svgContent = `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Ambient background backing -->
  <rect width="100%" height="100%" fill="#0a0a0c" />
`;

    elements.forEach(el => {
      // Map attributes
      const stroke = el.strokeColor;
      const width = el.strokeWidth;
      const fill = el.fillColor === 'transparent' ? 'none' : el.fillColor;
      let dashArrayStr = '';
      if (el.strokeStyle === 'dashed') dashArrayStr = ` stroke-dasharray="8,8"`;
      else if (el.strokeStyle === 'dotted') dashArrayStr = ` stroke-dasharray="2,6"`;

      if (el.type === 'rectangle') {
        const rx = Math.min(el.x1, el.x2);
        const ry = Math.min(el.y1, el.y2);
        const rw = Math.abs(el.x2 - el.x1);
        const rh = Math.abs(el.y2 - el.y1);
        svgContent += `  <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" stroke="${stroke}" stroke-width="${width}" fill="${fill}"${dashArrayStr} />\n`;
      } 
      else if (el.type === 'circle') {
        const rx = Math.min(el.x1, el.x2);
        const ry = Math.min(el.y1, el.y2);
        const rw = Math.abs(el.x2 - el.x1);
        const rh = Math.abs(el.y2 - el.y1);
        const cx = rx + rw / 2;
        const cy = ry + rh / 2;
        const rxRadius = rw / 2;
        const ryRadius = rh / 2;
        svgContent += `  <ellipse cx="${cx}" cy="${cy}" rx="${rxRadius}" ry="${ryRadius}" stroke="${stroke}" stroke-width="${width}" fill="${fill}"${dashArrayStr} />\n`;
      } 
      else if (el.type === 'line') {
        svgContent += `  <line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="${stroke}" stroke-width="${width}"${dashArrayStr} />\n`;
      } 
      else if (el.type === 'arrow') {
        // Arrow line
        svgContent += `  <line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="${stroke}" stroke-width="${width}" />\n`;
        
        // Simple SVG markers or secondary lines
        const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
        const headlen = 12;
        const headX1 = el.x2 - headlen * Math.cos(angle - Math.PI / 6);
        const headY1 = el.y2 - headlen * Math.sin(angle - Math.PI / 6);
        const headX2 = el.x2 - headlen * Math.cos(angle + Math.PI / 6);
        const headY2 = el.y2 - headlen * Math.sin(angle + Math.PI / 6);
        svgContent += `  <polyline points="${headX1},${headY1} ${el.x2},${el.y2} ${headX2},${headY2}" fill="none" stroke="${stroke}" stroke-width="${width}" />\n`;
      } 
      else if (el.type === 'pen') {
        if (el.points && el.points.length > 0) {
          const pathD = el.points.map((pt, index) => `${index === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
          svgContent += `  <path d="${pathD}" fill="none" stroke="${stroke}" stroke-width="${width}" />\n`;
        }
      } 
      else if (el.type === 'text') {
        svgContent += `  <text x="${el.x1}" y="${el.y1}" fill="${stroke}" font-family="monospace" font-size="${14 + el.strokeWidth * 2}" font-weight="bold">${el.text || ''}</text>\n`;
      }
    });

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.download = `APEX_Wireframe_${Date.now()}.svg`;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    URL.revokeObjectURL(url);
    showToast('Saved Scalable SVGs!');
  };

  return (
    <div className="space-y-6 animate-fade-in text-zinc-300">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-xs font-mono tracking-wide z-50 animate-scale-up shadow-xl flex items-center gap-2">
          <Check className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Workspace Header Dashboard banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-850 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[9px] font-bold uppercase tracking-widest">
              OFFLINE SECURE CRYPTO-NODE
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
              ● LOCAL PRIVATE DATA
            </span>
            {lastSaved && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/22 text-emerald-400 font-mono text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1 select-none">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                AUTOSAVED {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <PenTool className="w-5 h-5 text-amber-400" />
            {t.navigation.privateSketchpad}
          </h1>
          <p className="text-xs text-zinc-400">
            {t.navigation.privateSketchpadDesc}. Fully sandboxed vector editor for flowcharts, UI mockups, and hand-drawn architecture sketches.
          </p>
        </div>

        {/* Global Toolbar Action CTAs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-750 text-xs font-mono rounded text-zinc-300 flex items-center gap-1 transition-all cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
            <span>UNDO</span>
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-750 text-xs font-mono rounded text-zinc-300 flex items-center gap-1 transition-all cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
            <span>REDO</span>
          </button>

          <button
            onClick={handleDownloadSVG}
            disabled={elements.length === 0}
            className="px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-750 border border-zinc-700 text-xs font-bold font-mono rounded text-orange-400 flex items-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT SVG</span>
          </button>

          <button
            onClick={handleDownloadPNG}
            disabled={elements.length === 0}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-555 hover:to-orange-555 active:scale-95 text-xs font-bold font-mono text-white rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD PNG</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Frame container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Drawing Instrument Parameter Control Box */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Main Attributes Config card */}
          <div className="p-4 rounded-lg bg-[#0d0d12]/95 border border-zinc-800/70 space-y-4 shadow-xl">
            <h2 className="text-[10px] font-mono tracking-widest uppercase text-zinc-400 flex items-center gap-1.5 border-b border-zinc-900 pb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              Styling Studio
            </h2>

            {/* Dynamic Hand-Drawn "Sketchy" Switch */}
            <div className="p-2.5 rounded bg-[#07070a] border border-zinc-850/60 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-200 block">Excalidraw Aesthetics</span>
                <span className="text-[9px] text-zinc-500 font-mono">Organic wobbly vector outlines</span>
              </div>
              <button
                type="button"
                onClick={() => setSketchyHandDrawn(!sketchyHandDrawn)}
                className={`px-2 py-1 rounded font-mono text-[9px] font-bold block transition-all ${
                  sketchyHandDrawn 
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                }`}
              >
                {sketchyHandDrawn ? 'HAND-DRAWN' : 'CRISP PRO'}
              </button>
            </div>

            {/* Grid Backing Switch block */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Canvas backing Grid</label>
              <div className="grid grid-cols-3 gap-1.5 p-0.5 bg-zinc-950/70 border border-zinc-850 rounded">
                {[
                  { value: 'dots', label: 'Dots Backing' },
                  { value: 'grid', label: 'Solid Mesh' },
                  { value: 'none', label: 'Clear' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setGridStyle(item.value as GridStyle)}
                    className={`py-1 text-center font-mono text-[9px] font-bold rounded uppercase transition-all ${
                      gridStyle === item.value 
                        ? 'bg-zinc-850 text-white' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {item.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Stroke Outline presets */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Stroke color outline</label>
              <div className="grid grid-cols-7 gap-1">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      setStrokeColor(color.value);
                      if (selectedId) {
                        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, strokeColor: color.value } : el));
                        pushState(elements.map(el => el.id === selectedId ? { ...el, strokeColor: color.value } : el));
                      }
                    }}
                    className={`h-6 rounded-md relative flex items-center justify-center transition-all cursor-pointer ${
                      strokeColor === color.value ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-900' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value === '#ffffff' ? '#ffffff' : color.value }}
                    title={color.name}
                  >
                    {strokeColor === color.value && (
                      <Check className={`w-3 h-3 ${color.value === '#ffffff' ? 'text-zinc-900' : 'text-white'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Outline hex code */}
            <div className="space-y-1 text-xs">
              <input
                type="text"
                value={strokeColor}
                onChange={(e) => {
                  setStrokeColor(e.target.value);
                  if (selectedId) {
                    setElements(prev => prev.map(el => el.id === selectedId ? { ...el, strokeColor: e.target.value } : el));
                  }
                }}
                className="w-full bg-[#07070a] border border-zinc-850 rounded p-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-amber-500/50"
                placeholder="#ffffff hex code"
              />
            </div>

            {/* Fill glaze options */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Wireframe core volume fill</label>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#050508] border border-zinc-850 rounded">
                {FILL_OPACITY_PRESETS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setFillColorOption(item.value);
                      const finalColor = item.value === 'transparent' 
                        ? 'transparent' 
                        : (item.value === 'solid' ? strokeColor : 'rgba(255, 255, 255, 0.15)');
                      
                      if (selectedId) {
                        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fillColor: finalColor } : el));
                        pushState(elements.map(el => el.id === selectedId ? { ...el, fillColor: finalColor } : el));
                      }
                    }}
                    className={`py-1 text-center font-mono text-[9px] rounded uppercase transition-all ${
                      fillColorOption === item.value 
                        ? 'bg-zinc-850 text-white font-bold' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brush Thickness slider controls */}
            <div className="space-y-1 text-xs pt-1 border-t border-zinc-900">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Stroke Brush Width</label>
                <span className="font-mono text-[10px] text-zinc-400">{strokeWidth}px</span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                value={strokeWidth}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setStrokeWidth(val);
                  if (selectedId) {
                    setElements(prev => prev.map(el => el.id === selectedId ? { ...el, strokeWidth: val } : el));
                    pushState(elements.map(el => el.id === selectedId ? { ...el, strokeWidth: val } : el));
                  }
                }}
                className="w-full accent-amber-500 bg-zinc-900 h-1 rounded cursor-pointer"
              />
            </div>

            {/* Stroke Line style dashed/dotted/solid */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Dash pattern options</label>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#050508] border border-zinc-850 rounded">
                {[
                  { value: 'solid', label: 'Solid' },
                  { value: 'dashed', label: 'Dashed' },
                  { value: 'dotted', label: 'Dotted' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setStrokeStyle(item.value as any);
                      if (selectedId) {
                        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, strokeStyle: item.value as any } : el));
                        pushState(elements.map(el => el.id === selectedId ? { ...el, strokeStyle: item.value as any } : el));
                      }
                    }}
                    className={`py-1 text-center font-mono text-[9px] rounded uppercase transition-all ${
                      strokeStyle === item.value 
                        ? 'bg-zinc-850 text-white font-bold' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Help Hotkeys guidelines card */}
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-900 text-[11px] text-zinc-400 space-y-2">
            <h3 className="font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-500" />
              Canvas Keyboard Hotkeys
            </h3>
            <ul className="space-y-1.5 font-mono leading-relaxed">
              <li className="flex justify-between border-b border-zinc-900 pb-1">
                <span>Select Tool:</span>
                <span className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded text-[9px]">V</span>
              </li>
              <li className="flex justify-between border-b border-zinc-900 pb-1">
                <span>Rectangle / Square:</span>
                <span className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded text-[9px]">R</span>
              </li>
              <li className="flex justify-between border-b border-zinc-900 pb-1">
                <span>Circle / Ellipse:</span>
                <span className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded text-[9px]">O</span>
              </li>
              <li className="flex justify-between border-b border-zinc-900 pb-1">
                <span>Line / Segment:</span>
                <span className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded text-[9px]">L</span>
              </li>
              <li className="flex justify-between border-b border-zinc-900 pb-1">
                <span>Pointy Arrow:</span>
                <span className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded text-[9px]">A</span>
              </li>
              <li className="flex justify-between border-b border-zinc-900 pb-1">
                <span>Freehand Pen:</span>
                <span className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded text-[9px]">P</span>
              </li>
              <li className="flex justify-between border-b border-zinc-900 pb-1">
                <span>Text Node:</span>
                <span className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded text-[9px]">T</span>
              </li>
              <li className="flex justify-between border-b border-zinc-900 pb-1">
                <span>Eraser Brush:</span>
                <span className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded text-[9px]">E</span>
              </li>
              <li className="flex justify-between">
                <span>Delete element:</span>
                <span className="text-rose-400 bg-rose-950/20 border border-rose-900 px-1 rounded text-[9px]">DEL / BACKSPACE</span>
              </li>
            </ul>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Drawing Board & Overlay controls */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* Floating UI Tool Selector */}
          <div className="p-2 rounded-lg bg-[#0d0d12]/95 border border-zinc-800/80 shadow-xl flex items-center justify-between gap-2 overflow-x-auto select-none">
            
            <div className="flex items-center gap-1">
              {[
                { id: 'select', icon: MousePointer, label: 'Select' },
                { id: 'rectangle', icon: Square, label: 'Rectangle' },
                { id: 'circle', icon: Circle, label: 'Ellipse' },
                { id: 'line', icon: Minus, label: 'Line' },
                { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
                { id: 'pen', icon: PenTool, label: 'Pen Draw' },
                { id: 'text', icon: Type, label: 'Text Core' },
                { id: 'eraser', icon: Eraser, label: 'Eraser' },
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id as ActiveTool);
                    if (tool.id !== 'select') setSelectedId(null);
                  }}
                  className={`px-3 py-2 rounded flex items-center justify-center gap-1.5 font-mono text-[10px] font-semibold transition-all cursor-pointer ${
                    activeTool === tool.id 
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow' 
                      : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent'
                  }`}
                  title={`${tool.label} Instrument`}
                >
                  <tool.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline uppercase">{tool.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
              <button
                onClick={handleClearWorkspace}
                className="px-2.5 py-1.5 border border-rose-950/50 bg-rose-950/10 hover:bg-rose-950/25 text-rose-400 text-[10px] font-mono tracking-wider font-bold rounded flex items-center gap-1"
                title="Wipe canvas clean"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">CLEAR WORKSPACE</span>
              </button>
            </div>

          </div>

          {/* Interactive HTML5 Canvas stage container */}
          <div 
            ref={containerRef}
            className="w-full relative rounded-lg border border-zinc-800 bg-[#08080a] shadow-inner flex items-center justify-center overflow-hidden transition-all duration-300 select-none cursor-crosshair min-h-[450px]"
          >
            
            <canvas
              ref={canvasRef}
              width={canvasDimensions.width}
              height={canvasDimensions.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="absolute inset-0 block h-full w-full select-none"
            />

            {/* Inline Text Area Editor overlay popups for real-time text input */}
            {action === 'editing' && activeTextPos && (
              <div 
                className="absolute p-3 rounded-lg bg-zinc-950 border border-zinc-800 shadow-2xl z-20 space-y-2 select-text"
                style={{
                  left: `${activeTextPos.x}px`,
                  top: `${activeTextPos.y}px`
                }}
              >
                <textarea
                  value={textInputVal}
                  onChange={(e) => setTextInputVal(e.target.value)}
                  placeholder="Type anything here..."
                  className="bg-[#050508] border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-300 w-48 h-20 focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => { setAction('none'); setActiveTextPos(null); }}
                    className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-[9px] font-mono rounded text-zinc-400"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleSubmitText}
                    className="px-2 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-mono rounded font-bold"
                  >
                    ADD TEXT
                  </button>
                </div>
              </div>
            )}

            {/* Info display stats badge pinned on canvas edge */}
            <div className="absolute bottom-3 left-3 bg-[#0a0a0c]/90 border border-zinc-850 px-2.5 py-1.5 rounded text-[10px] text-zinc-500 font-mono flex items-center gap-4 shadow backdrop-blur select-none pointer-events-none">
              <span>ElementsCount: {elements.length} nodes</span>
              {selectedId && (
                <span className="text-amber-400 font-bold">● SELECTING ACTIVE SHAPE</span>
              )}
            </div>

            {/* Hint instruction watermark if canvas is completely empty */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none select-none opacity-45">
                <Grid className="w-10 h-10 text-zinc-500 mb-2 animate-pulse" />
                <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">
                  SECURE WIREFRAME STAGE READY
                </h3>
                <p className="text-[11px] text-zinc-500 max-w-sm">
                  Select rectangular, elliptical, arrow models above to draw. Drag shapes under selection index to reposition. All data saved is private in your browser block.
                </p>
              </div>
            )}

          </div>

          {/* Quick instructions alert footer bar */}
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-900/60 leading-normal text-xs flex gap-3 text-zinc-400 shadow">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-zinc-200">Local Vector Diagrammer Advantage</span>
              <p className="text-zinc-500 leading-normal">
                Unlike cloud services that telemetry and analyze sketches, the APEX Sketchpad works **100% locally client-side**. No images are transmitted outward. Download pure, crisp **Scalable Vector Graphics (SVG)** files or lossless **PNG** shots instantly at zero network cost. Perfect for structural engineers, frontend UI developers, or database outline designers.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

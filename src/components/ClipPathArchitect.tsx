import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crop,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Eye,
  Settings,
  HelpCircle,
  Code,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  Move,
  Maximize2,
  Image as ImageIcon,
  MousePointer,
  Shuffle,
  Undo,
  BookOpen,
  Info
} from 'lucide-react';

interface Vertex {
  id: string;
  x: number; // 0 to 100
  y: number; // 0 to 100
}

// Predefined beautiful presets
const PRESETS = [
  {
    name: 'Triangle',
    icon: '▲',
    vertices: [
      { id: '1', x: 50, y: 0 },
      { id: '2', x: 0, y: 100 },
      { id: '3', x: 100, y: 100 }
    ]
  },
  {
    name: 'Trapezoid',
    icon: '▰',
    vertices: [
      { id: '1', x: 20, y: 0 },
      { id: '2', x: 80, y: 0 },
      { id: '3', x: 100, y: 100 },
      { id: '4', x: 0, y: 100 }
    ]
  },
  {
    name: 'Parallelogram',
    icon: '▱',
    vertices: [
      { id: '1', x: 25, y: 0 },
      { id: '2', x: 100, y: 0 },
      { id: '3', x: 75, y: 100 },
      { id: '4', x: 0, y: 100 }
    ]
  },
  {
    name: 'Rhombus',
    icon: '◆',
    vertices: [
      { id: '1', x: 50, y: 0 },
      { id: '2', x: 100, y: 50 },
      { id: '3', x: 50, y: 100 },
      { id: '4', x: 0, y: 50 }
    ]
  },
  {
    name: 'Pentagon',
    icon: '⬠',
    vertices: [
      { id: '1', x: 50, y: 0 },
      { id: '2', x: 100, y: 38 },
      { id: '3', x: 82, y: 100 },
      { id: '4', x: 18, y: 100 },
      { id: '5', x: 0, y: 38 }
    ]
  },
  {
    name: 'Hexagon',
    icon: '⬡',
    vertices: [
      { id: '1', x: 50, y: 0 },
      { id: '2', x: 100, y: 25 },
      { id: '3', x: 100, y: 75 },
      { id: '4', x: 50, y: 100 },
      { id: '5', x: 0, y: 75 },
      { id: '6', x: 0, y: 25 }
    ]
  },
  {
    name: 'Octagon',
    icon: ' octagon',
    vertices: [
      { id: '1', x: 30, y: 0 },
      { id: '2', x: 70, y: 0 },
      { id: '3', x: 100, y: 30 },
      { id: '4', x: 100, y: 70 },
      { id: '5', x: 70, y: 100 },
      { id: '6', x: 30, y: 100 },
      { id: '7', x: 0, y: 70 },
      { id: '8', x: 0, y: 30 }
    ]
  },
  {
    name: 'Star',
    icon: '★',
    vertices: [
      { id: '1', x: 50, y: 0 },
      { id: '2', x: 61, y: 35 },
      { id: '3', x: 98, y: 35 },
      { id: '4', x: 68, y: 57 },
      { id: '5', x: 79, y: 91 },
      { id: '6', x: 50, y: 70 },
      { id: '7', x: 21, y: 91 },
      { id: '8', x: 32, y: 57 },
      { id: '9', x: 2, y: 35 },
      { id: '10', x: 39, y: 35 }
    ]
  },
  {
    name: 'Cross',
    icon: '✚',
    vertices: [
      { id: '1', x: 35, y: 0 },
      { id: '2', x: 65, y: 0 },
      { id: '3', x: 65, y: 35 },
      { id: '4', x: 100, y: 35 },
      { id: '5', x: 100, y: 65 },
      { id: '6', x: 65, y: 65 },
      { id: '7', x: 65, y: 100 },
      { id: '8', x: 35, y: 100 },
      { id: '9', x: 35, y: 65 },
      { id: '10', x: 0, y: 65 },
      { id: '11', x: 0, y: 35 },
      { id: '12', x: 35, y: 35 }
    ]
  },
  {
    name: 'Arrow',
    icon: '➔',
    vertices: [
      { id: '1', x: 0, y: 30 },
      { id: '2', x: 60, y: 30 },
      { id: '3', x: 60, y: 0 },
      { id: '4', x: 100, y: 50 },
      { id: '5', x: 60, y: 100 },
      { id: '6', x: 60, y: 70 },
      { id: '7', x: 0, y: 70 }
    ]
  },
  {
    name: 'Message',
    icon: '💬',
    vertices: [
      { id: '1', x: 0, y: 0 },
      { id: '2', x: 100, y: 0 },
      { id: '3', x: 100, y: 75 },
      { id: '4', x: 75, y: 75 },
      { id: '5', x: 75, y: 100 },
      { id: '6', x: 50, y: 75 },
      { id: '7', x: 0, y: 75 }
    ]
  },
  {
    name: 'Shield',
    icon: '🛡️',
    vertices: [
      { id: '1', x: 50, y: 0 },
      { id: '2', x: 100, y: 10 },
      { id: '3', x: 90, y: 70 },
      { id: '4', x: 50, y: 100 },
      { id: '5', x: 10, y: 70 },
      { id: '6', x: 0, y: 10 }
    ]
  }
];

// Beautiful backgrounds for sandbox preview
const BACKGROUNDS = [
  {
    id: 'gradient-retro',
    name: 'Sunset Glow',
    style: { background: 'linear-gradient(135deg, #ff007f 0%, #7928ca 50%, #b800ff 100%)' }
  },
  {
    id: 'gradient-ocean',
    name: 'Cyber Teal',
    style: { background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' }
  },
  {
    id: 'gradient-emerald',
    name: 'Lime Spark',
    style: { background: 'linear-gradient(135deg, #f9d423 0%, #ff4e50 100%)' }
  },
  {
    id: 'solid-pink',
    name: 'Rose Quartz',
    style: { backgroundColor: '#f43f5e' }
  },
  {
    id: 'image-nature',
    name: 'Mystic Forest',
    style: {
      backgroundImage: 'url("https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  },
  {
    id: 'image-cyberpunk',
    name: 'Neo Neon',
    style: {
      backgroundImage: 'url("https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  },
  {
    id: 'image-abstract',
    name: 'Fluid Paint',
    style: {
      backgroundImage: 'url("https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
];

export default function ClipPathArchitect() {
  const [vertices, setVertices] = useState<Vertex[]>([
    { id: '1', x: 50, y: 10 },
    { id: '2', x: 90, y: 85 },
    { id: '3', x: 10, y: 85 }
  ]);

  const [activeVertexId, setActiveVertexId] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [snapThreshold, setSnapThreshold] = useState<number>(5); // 1, 2, 5, 10
  const [lockAxis, setLockAxis] = useState<'none' | 'x' | 'y'>('none');
  const [precision, setPrecision] = useState<number>(1); // 0, 1, 2, 3 decimal places
  const [activePreset, setActivePreset] = useState<string>('Triangle');

  // Interactive transforms
  const [rotation, setRotation] = useState<number>(0);
  const [scale, setScale] = useState<number>(100); // percentage scale
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);

  // Undo/Redo stack
  const [history, setHistory] = useState<Vertex[][]>([[
    { id: '1', x: 50, y: 10 },
    { id: '2', x: 90, y: 85 },
    { id: '3', x: 10, y: 85 }
  ]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Sandbox UI state
  const [previewBg, setPreviewBg] = useState<number>(0);
  const [showOriginalBorder, setShowOriginalBorder] = useState<boolean>(true);
  const [dropShadowDepth, setDropShadowDepth] = useState<number>(15); // drop-shadow blur
  const [dropShadowColor, setDropShadowColor] = useState<string>('rgba(0, 0, 0, 0.45)');
  const [customText, setCustomText] = useState<string>('DESIGN CRAFT');
  const [copiedType, setCopiedType] = useState<'css' | 'tailwind' | 'svg' | null>(null);
  const [activeTab, setActiveTab] = useState<'css' | 'tailwind' | 'svg'>('css');

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const vertexDragOffset = useRef<{ x: number; y: number } | null>(null);

  // Push new state onto history
  const pushToHistory = (newVertices: Vertex[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(JSON.parse(JSON.stringify(newVertices)));
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setVertices(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setVertices(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  // Preset Handler
  const applyPreset = (presetName: string) => {
    const preset = PRESETS.find(p => p.name === presetName);
    if (preset) {
      const newVertices = preset.vertices.map((v, i) => ({
        id: String(Date.now() + i + Math.random()),
        x: v.x,
        y: v.y
      }));
      setVertices(newVertices);
      setActivePreset(presetName);
      // Reset transforms
      setRotation(0);
      setScale(100);
      setTranslateX(0);
      setTranslateY(0);
      pushToHistory(newVertices);
    }
  };

  // Convert vertex percentage coordinates to absolute SVG/Canvas coordinates
  const formatCoord = (val: number) => {
    return Number(Math.max(0, Math.min(100, val)).toFixed(precision));
  };

  // Computed strings
  const polygonPointsStr = useMemo(() => {
    return vertices.map(v => `${formatCoord(v.x)}% ${formatCoord(v.y)}%`).join(', ');
  }, [vertices, precision]);

  const cssClipPathCode = useMemo(() => {
    return `clip-path: polygon(${polygonPointsStr});`;
  }, [polygonPointsStr]);

  const tailwindClipPathCode = useMemo(() => {
    return `clip-path-[polygon(${polygonPointsStr.replace(/ /g, '_')})]`;
  }, [polygonPointsStr]);

  const svgClipPathCode = useMemo(() => {
    const normalizedPoints = vertices.map(v => `${(v.x / 100).toFixed(3)} ${(v.y / 100).toFixed(3)}`).join(', ');
    return `<svg width="0" height="0" style="position: absolute;">
  <defs>
    <clipPath id="custom-clip" clipPathUnits="objectBoundingBox">
      <polygon points="${normalizedPoints}" />
    </clipPath>
  </defs>
</svg>

<!-- Inline CSS Usage: -->
<!-- clip-path: url(#custom-clip); -->`;
  }, [vertices]);

  // Pointer move dragging handler
  const handlePointerDown = (e: React.PointerEvent, vertexId: string) => {
    e.stopPropagation();
    setActiveVertexId(vertexId);

    const vertex = vertices.find(v => v.id === vertexId);
    if (vertex && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const currentXPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const currentYPercent = ((e.clientY - rect.top) / rect.height) * 100;

      vertexDragOffset.current = {
        x: currentXPercent - vertex.x,
        y: currentYPercent - vertex.y
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeVertexId || !canvasRef.current || !vertexDragOffset.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let newXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    let newYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    // Apply offset so cursor doesn't jump to center of handle
    newXPercent -= vertexDragOffset.current.x;
    newYPercent -= vertexDragOffset.current.y;

    // Apply Snap to Grid
    if (snapToGrid) {
      newXPercent = Math.round(newXPercent / snapThreshold) * snapThreshold;
      newYPercent = Math.round(newYPercent / snapThreshold) * snapThreshold;
    }

    // Enforce lock axes
    const currentVertex = vertices.find(v => v.id === activeVertexId);
    if (currentVertex) {
      if (lockAxis === 'x') {
        newYPercent = currentVertex.y;
      } else if (lockAxis === 'y') {
        newXPercent = currentVertex.x;
      }
    }

    // Clamping
    newXPercent = Math.max(0, Math.min(100, newXPercent));
    newYPercent = Math.max(0, Math.min(100, newYPercent));

    setVertices(prev =>
      prev.map(v => (v.id === activeVertexId ? { ...v, x: newXPercent, y: newYPercent } : v))
    );
  };

  const handlePointerUp = () => {
    if (activeVertexId) {
      setActiveVertexId(null);
      vertexDragOffset.current = null;
      pushToHistory(vertices);
    }
  };

  // Add vertex by double clicking canvas or clicking near lines
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    let yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    if (snapToGrid) {
      xPercent = Math.round(xPercent / snapThreshold) * snapThreshold;
      yPercent = Math.round(yPercent / snapThreshold) * snapThreshold;
    }

    // Insert at optimal position: find closest line segment
    let bestIndex = vertices.length;
    let minDistance = Infinity;

    for (let i = 0; i < vertices.length; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % vertices.length];

      // Distance from point to line segment
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const l2 = dx * dx + dy * dy;

      let t = ((xPercent - p1.x) * dx + (yPercent - p1.y) * dy) / l2;
      t = Math.max(0, Math.min(1, t));

      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;

      const dist = Math.hypot(xPercent - projX, yPercent - projY);
      if (dist < minDistance) {
        minDistance = dist;
        bestIndex = i + 1;
      }
    }

    const newVertex: Vertex = {
      id: String(Date.now()),
      x: Math.max(0, Math.min(100, xPercent)),
      y: Math.max(0, Math.min(100, yPercent))
    };

    const updatedVertices = [...vertices];
    updatedVertices.splice(bestIndex, 0, newVertex);
    setVertices(updatedVertices);
    setActiveVertexId(newVertex.id);
    pushToHistory(updatedVertices);
  };

  // Quick Action modifiers
  const handleReset = () => {
    applyPreset('Triangle');
  };

  const handleCleanAll = () => {
    const resetVertices = [
      { id: '1', x: 20, y: 20 },
      { id: '2', x: 80, y: 20 },
      { id: '3', x: 80, y: 80 },
      { id: '4', x: 20, y: 80 }
    ];
    setVertices(resetVertices);
    setRotation(0);
    setScale(100);
    setTranslateX(0);
    setTranslateY(0);
    pushToHistory(resetVertices);
  };

  const handleCopyCode = async (codeStr: string, type: 'css' | 'tailwind' | 'svg') => {
    try {
      await navigator.clipboard.writeText(codeStr);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Mathematical adjustments
  const applyMathTransforms = (
    currentRotation: number,
    currentScale: number,
    currTranslateX: number,
    currTranslateY: number
  ) => {
    // Start from the base preset or first state in history to avoid compounding mathematical distortion
    const baseState = history[0] || [
      { id: '1', x: 50, y: 10 },
      { id: '2', x: 90, y: 85 },
      { id: '3', x: 10, y: 85 }
    ];

    // Find center of gravity
    let cx = 0;
    let cy = 0;
    baseState.forEach(v => {
      cx += v.x;
      cy += v.y;
    });
    cx /= baseState.length;
    cy /= baseState.length;

    const rad = (currentRotation * Math.PI) / 180;
    const s = currentScale / 100;

    const transformed = baseState.map(v => {
      // Scale relative to center
      let px = cx + (v.x - cx) * s;
      let py = cy + (v.y - cy) * s;

      // Rotate relative to center
      const rx = cx + (px - cx) * Math.cos(rad) - (py - cy) * Math.sin(rad);
      const ry = cy + (px - cx) * Math.sin(rad) + (py - cy) * Math.cos(rad);

      // Translate
      let tx = rx + currTranslateX;
      let ty = ry + currTranslateY;

      // Clamp values
      return {
        ...v,
        x: Math.max(0, Math.min(100, tx)),
        y: Math.max(0, Math.min(100, ty))
      };
    });

    setVertices(transformed);
  };

  // Listen to transform sliders to apply batch changes smoothly
  const handleRotationChange = (val: number) => {
    setRotation(val);
    applyMathTransforms(val, scale, translateX, translateY);
  };

  const handleScaleChange = (val: number) => {
    setScale(val);
    applyMathTransforms(rotation, val, translateX, translateY);
  };

  const handleTranslateXChange = (val: number) => {
    setTranslateX(val);
    applyMathTransforms(rotation, scale, val, translateY);
  };

  const handleTranslateYChange = (val: number) => {
    setTranslateY(val);
    applyMathTransforms(rotation, scale, translateX, val);
  };

  // Flip or mirror shape actions
  const flipHorizontal = () => {
    const flipped = vertices.map(v => ({ ...v, x: 100 - v.x }));
    setVertices(flipped);
    pushToHistory(flipped);
  };

  const flipVertical = () => {
    const flipped = vertices.map(v => ({ ...v, y: 100 - v.y }));
    setVertices(flipped);
    pushToHistory(flipped);
  };

  const reverseWinding = () => {
    const reversed = [...vertices].reverse();
    setVertices(reversed);
    pushToHistory(reversed);
  };

  // Handle single vertex edits or removals
  const removeVertex = (id: string) => {
    if (vertices.length <= 3) return; // Maintain polygon structure
    const updated = vertices.filter(v => v.id !== id);
    setVertices(updated);
    pushToHistory(updated);
  };

  const updateVertexField = (id: string, field: 'x' | 'y', value: number) => {
    const updated = vertices.map(v => {
      if (v.id === id) {
        return { ...v, [field]: Math.max(0, Math.min(100, value)) };
      }
      return v;
    });
    setVertices(updated);
    pushToHistory(updated);
  };

  const addMidpointVertex = () => {
    // Add midpoint between vertex 0 and 1
    if (vertices.length < 3) return;
    const v1 = vertices[0];
    const v2 = vertices[1];
    const midX = (v1.x + v2.x) / 2;
    const midY = (v1.y + v2.y) / 2;

    const newVertex: Vertex = {
      id: String(Date.now()),
      x: Math.round(midX),
      y: Math.round(midY)
    };

    const updated = [...vertices];
    updated.splice(1, 0, newVertex);
    setVertices(updated);
    pushToHistory(updated);
  };

  return (
    <div className="bg-zinc-950 text-zinc-100 rounded-3xl border border-zinc-800/80 shadow-2xl p-6 space-y-8 max-w-7xl mx-auto overflow-hidden">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/30 text-rose-400">
              <Crop className="w-6 h-6" id="clip-path-header-icon" />
            </div>
            <h2 className="text-xl font-bold font-sans tracking-tight text-white">
              CSS Clip-Path Polygon Architect
            </h2>
          </div>
          <p className="text-sm text-zinc-400 mt-1.5 font-sans">
            Design beautiful clipping paths, drag visual polygon nodes, toggle quick presets, and auto-generate responsive Tailwind & SVG codes.
          </p>
        </div>

        {/* Global actions: Undo, Redo, Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Redo"
          >
            <span className="text-xs font-mono font-bold block transform scale-x-[-1]"><Undo className="w-4 h-4" /></span>
          </button>
          <button
            onClick={handleReset}
            className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Designer & Options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Canvas & Presets */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Canvas Toolbar Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/50">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Snap to grid switch */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-950 text-rose-500 focus:ring-rose-500/30 w-4 h-4"
                />
                <span className="text-xs font-medium text-zinc-300">Snap to Grid</span>
              </label>

              {/* Grid threshold selection */}
              {snapToGrid && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-zinc-500 uppercase font-mono">Size:</span>
                  <select
                    value={snapThreshold}
                    onChange={(e) => setSnapThreshold(Number(e.target.value))}
                    className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg text-xs py-1 px-1.5 focus:ring-1 focus:ring-rose-500/50"
                  >
                    <option value={1}>1%</option>
                    <option value={2}>2%</option>
                    <option value={5}>5%</option>
                    <option value={10}>10%</option>
                    <option value={20}>20%</option>
                  </select>
                </div>
              )}

              {/* Lock Axis selection */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500 uppercase font-mono">Axis Lock:</span>
                <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                  {(['none', 'x', 'y'] as const).map((axis) => (
                    <button
                      key={axis}
                      onClick={() => setLockAxis(axis)}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider transition ${
                        lockAxis === axis
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {axis === 'none' ? 'Free' : axis}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Vertex count or action button */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
                {vertices.length} Nodes
              </span>
              <button
                onClick={addMidpointVertex}
                className="p-1 px-2.5 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-lg text-xs flex items-center gap-1 transition shadow-lg shadow-rose-950/20"
                title="Split & Inject midpoint vertex"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Node
              </button>
            </div>
          </div>

          {/* Interactive Canvas Container */}
          <div className="space-y-2">
            <div
              ref={canvasRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onDoubleClick={handleCanvasDoubleClick}
              className="w-full aspect-square relative bg-zinc-950 border-2 border-zinc-800 rounded-3xl shadow-inner select-none cursor-crosshair overflow-hidden group touch-none"
              style={{
                backgroundImage: `radial-gradient(circle, rgba(244, 63, 94, 0.08) 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
              }}
            >
              {/* Coordinate info tag */}
              <div className="absolute top-3 left-3 bg-zinc-900/90 backdrop-blur border border-zinc-800 text-[10px] font-mono text-zinc-400 p-1.5 px-2.5 rounded-lg pointer-events-none">
                Double click inside to insert custom node at position
              </div>

              {/* Dynamic Coordinate indicator */}
              <div className="absolute bottom-3 right-3 bg-zinc-900/90 backdrop-blur border border-zinc-800 text-[10px] font-mono text-zinc-400 p-1.5 px-2.5 rounded-lg pointer-events-none">
                {snapToGrid ? `Snap to Grid: ${snapThreshold}%` : 'Free Dragging'}
              </div>

              {/* SVG drawing layer */}
              <svg className="w-full h-full absolute inset-0 pointer-events-none">
                {/* SVG polygon rendering */}
                <polygon
                  points={vertices.map(v => `${v.x}%,${v.y}%`).join(' ')}
                  className="fill-rose-500/10 stroke-rose-500/50 stroke-[1.5]"
                  style={{
                    vectorEffect: 'non-scaling-stroke'
                  }}
                />
              </svg>

              {/* Interactive handles overlayed absolutely using percentages */}
              {vertices.map((v, idx) => {
                const isActive = activeVertexId === v.id;
                return (
                  <div
                    key={v.id}
                    onPointerDown={(e) => handlePointerDown(e, v.id)}
                    className="absolute w-7 h-7 -ml-3.5 -mt-3.5 flex items-center justify-center cursor-move touch-none z-10 group/handle"
                    style={{
                      left: `${v.x}%`,
                      top: `${v.y}%`
                    }}
                  >
                    {/* Glowing outer ring */}
                    <div
                      className={`absolute inset-0 rounded-full transition duration-150 ${
                        isActive 
                          ? 'bg-rose-500/40 scale-125' 
                          : 'bg-rose-500/15 group-hover/handle:bg-rose-500/25 group-hover/handle:scale-110'
                      }`}
                    />
                    {/* Inner core handle */}
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 transition duration-150 shadow-md ${
                        isActive 
                          ? 'bg-rose-400 border-white scale-110' 
                          : 'bg-zinc-950 border-rose-500 group-hover/handle:bg-rose-500 group-hover/handle:border-white'
                      }`}
                    />
                    {/* Floating label identifier showing index */}
                    <span className="absolute -bottom-5 bg-zinc-900 text-zinc-300 text-[9px] font-mono px-1 rounded border border-zinc-800 pointer-events-none group-hover/handle:opacity-100 opacity-60 transition">
                      {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-500 text-center font-sans italic">
              Pro-Tip: Drag circles to shape your custom design. Use the Lock Axis buttons above to constrain vectors smoothly.
            </p>
          </div>

          {/* Preset Shapes Gallery */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              Standard Geometric Presets
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset.name)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                    activePreset === preset.name
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 font-medium'
                      : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="text-base leading-none block">{preset.icon}</span>
                  <span className="text-[10px] tracking-wide block">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Shape Transformers */}
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              Math & Symmetry Modifiers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Rotation</span>
                  <span className="text-rose-400">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotation}
                  onChange={(e) => handleRotationChange(Number(e.target.value))}
                  className="w-full accent-rose-500 bg-zinc-950 rounded-lg h-1.5"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Scale Shape</span>
                  <span className="text-rose-400">{scale}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={scale}
                  onChange={(e) => handleScaleChange(Number(e.target.value))}
                  className="w-full accent-rose-500 bg-zinc-950 rounded-lg h-1.5"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Translate X</span>
                  <span className="text-rose-400">{translateX > 0 ? `+${translateX}` : translateX}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={translateX}
                  onChange={(e) => handleTranslateXChange(Number(e.target.value))}
                  className="w-full accent-rose-500 bg-zinc-950 rounded-lg h-1.5"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Translate Y</span>
                  <span className="text-rose-400">{translateY > 0 ? `+${translateY}` : translateY}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={translateY}
                  onChange={(e) => handleTranslateYChange(Number(e.target.value))}
                  className="w-full accent-rose-500 bg-zinc-950 rounded-lg h-1.5"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/40">
              <button
                onClick={flipHorizontal}
                className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-[11px] rounded-lg text-zinc-300 hover:text-white transition flex items-center gap-1"
              >
                ⇄ Flip Horizontal
              </button>
              <button
                onClick={flipVertical}
                className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-[11px] rounded-lg text-zinc-300 hover:text-white transition flex items-center gap-1"
              >
                ⇅ Flip Vertical
              </button>
              <button
                onClick={reverseWinding}
                className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-[11px] rounded-lg text-zinc-300 hover:text-white transition flex items-center gap-1"
              >
                ⟳ Reverse Order
              </button>
              <button
                onClick={handleCleanAll}
                className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-[11px] rounded-lg text-rose-400 hover:text-rose-300 transition ml-auto"
              >
                Clear to Canvas Box
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Sandbox Sandbox & Code Exporters */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live Preview Sandbox */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-rose-400" />
                Live Clipping Preview
              </h3>
              
              {/* Show original bounds button */}
              <button
                onClick={() => setShowOriginalBorder(!showOriginalBorder)}
                className={`text-[10px] px-2 py-1 rounded transition border ${
                  showOriginalBorder
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {showOriginalBorder ? 'Original Box: ON' : 'Original Box: OFF'}
              </button>
            </div>

            {/* Simulated Live Block with Custom ClipPath applied */}
            <div className="relative w-full aspect-video bg-zinc-950 rounded-2xl border border-zinc-800/60 overflow-hidden flex items-center justify-center p-4">
              
              {/* Transparent grid background helper */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                  backgroundSize: '15px 15px'
                }}
              />

              {/* Dotted indicator of unclipped boundaries */}
              {showOriginalBorder && (
                <div className="absolute w-44 h-44 rounded border border-dashed border-zinc-700 pointer-events-none" />
              )}

              {/* The active clip element wrapper - applying simulated drop shadow because clip-path clips normal box shadows */}
              <div
                className="w-44 h-44 transition-all duration-75 relative flex items-center justify-center"
                style={{
                  filter: `drop-shadow(0px ${dropShadowDepth / 2}px ${dropShadowDepth}px ${dropShadowColor})`
                }}
              >
                {/* The actual clipped content block */}
                <div
                  className="w-full h-full relative transition-all duration-75 flex flex-col items-center justify-center text-center p-4"
                  style={{
                    clipPath: `polygon(${polygonPointsStr})`,
                    ...BACKGROUNDS[previewBg].style
                  }}
                >
                  {/* Floating Content showcasing real typography flow */}
                  <div className="relative z-10 select-none px-2 py-1 text-center">
                    <span className="block text-[14px] font-black font-sans text-white tracking-widest leading-none drop-shadow-md">
                      {customText || 'CLIP'}
                    </span>
                    <span className="block text-[8px] font-mono font-bold text-white/70 uppercase tracking-widest mt-1">
                      Polygon
                    </span>
                  </div>

                  {/* Aesthetic light reflection sheet overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/15 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Sandbox customization controls */}
            <div className="space-y-4 pt-1">
              
              {/* Custom Title Input */}
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-mono block">Overlay Display Text:</label>
                <input
                  type="text"
                  maxLength={18}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white rounded-xl py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500"
                  placeholder="Change preview label..."
                />
              </div>

              {/* Background Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-400 font-mono block">Clipped Background Asset:</label>
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {BACKGROUNDS.map((bg, index) => (
                    <button
                      key={bg.id}
                      onClick={() => setPreviewBg(index)}
                      className={`flex-shrink-0 p-1 rounded-xl border transition ${
                        previewBg === index
                          ? 'border-rose-500/60 bg-zinc-900/60'
                          : 'border-zinc-850 hover:border-zinc-700 bg-zinc-950'
                      }`}
                      title={bg.name}
                    >
                      <div
                        className="w-7 h-7 rounded-lg"
                        style={{
                          ...bg.style,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated Ambient Shadows */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Simulated Floating Depth</span>
                  <span className="text-zinc-500">{dropShadowDepth}px blur</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={dropShadowDepth}
                  onChange={(e) => setDropShadowDepth(Number(e.target.value))}
                  className="w-full accent-rose-500 bg-zinc-950 rounded-lg h-1"
                />
              </div>
            </div>
          </div>

          {/* Code Export Panel */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 space-y-4">
            
            {/* Tab switch for exporters */}
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <div className="flex bg-zinc-950 p-0.5 rounded-xl border border-zinc-800">
                {(['css', 'tailwind', 'svg'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                      activeTab === tab
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab === 'css' ? 'CSS Code' : tab === 'tailwind' ? 'Tailwind' : 'SVG Markup'}
                  </button>
                ))}
              </div>

              {/* Decimal Precision config */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500 font-mono">Precision:</span>
                <select
                  value={precision}
                  onChange={(e) => setPrecision(Number(e.target.value))}
                  className="bg-zinc-950 border border-zinc-850 text-zinc-300 rounded-lg text-[10px] p-1 py-0.5 focus:ring-1 focus:ring-rose-500/50"
                >
                  <option value={0}>0 d.p.</option>
                  <option value={1}>1 d.p.</option>
                  <option value={2}>2 d.p.</option>
                  <option value={3}>3 d.p.</option>
                </select>
              </div>
            </div>

            {/* Live export block */}
            <div className="space-y-3">
              <div className="relative">
                <pre className="text-[11px] font-mono bg-zinc-950/80 p-4 rounded-2xl border border-zinc-850 text-emerald-400 overflow-x-auto max-h-48 whitespace-pre-wrap select-all">
                  {activeTab === 'css' && cssClipPathCode}
                  {activeTab === 'tailwind' && tailwindClipPathCode}
                  {activeTab === 'svg' && svgClipPathCode}
                </pre>

                {/* Floating copy button */}
                <button
                  onClick={() =>
                    handleCopyCode(
                      activeTab === 'css'
                        ? cssClipPathCode
                        : activeTab === 'tailwind'
                        ? tailwindClipPathCode
                        : svgClipPathCode,
                      activeTab
                    )
                  }
                  className="absolute top-2.5 right-2.5 p-2 bg-zinc-900 hover:bg-rose-500 text-zinc-400 hover:text-white rounded-xl transition shadow-lg border border-zinc-800 hover:border-rose-400/20"
                  title="Copy to Clipboard"
                >
                  {copiedType === activeTab ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {activeTab === 'svg' && (
                <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                  Note: The SVG clipPath output has coordinates scaled from 0.0 to 1.0 (using <code>objectBoundingBox</code>). This lets you apply responsive clipping vectors regardless of the unclipped target size.
                </p>
              )}
            </div>
          </div>

          {/* Node Coordinates List / Manual Editing */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Node Coordinates List
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {vertices.map((v, index) => (
                <div
                  key={v.id}
                  className="flex items-center gap-2 bg-zinc-950/60 p-2 rounded-xl border border-zinc-850 hover:border-zinc-800 transition"
                >
                  {/* Index identifier indicator */}
                  <span className="w-5 h-5 flex items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[10px] font-bold">
                    {index + 1}
                  </span>

                  {/* Manual Inputs */}
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-[10px] font-mono text-zinc-500">X:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step={1}
                      value={Math.round(v.x)}
                      onChange={(e) => updateVertexField(v.id, 'x', Number(e.target.value))}
                      className="w-14 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 p-1 text-center focus:ring-1 focus:ring-rose-500/30"
                    />
                    <span className="text-[10px] font-mono text-zinc-400">%</span>

                    <span className="text-[10px] font-mono text-zinc-500 ml-1.5">Y:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step={1}
                      value={Math.round(v.y)}
                      onChange={(e) => updateVertexField(v.id, 'y', Number(e.target.value))}
                      className="w-14 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 p-1 text-center focus:ring-1 focus:ring-rose-500/30"
                    />
                    <span className="text-[10px] font-mono text-zinc-400">%</span>
                  </div>

                  {/* Delete Vertex option */}
                  <button
                    disabled={vertices.length <= 3}
                    onClick={() => removeVertex(v.id)}
                    className="p-1.5 bg-zinc-900 hover:bg-rose-950/30 border border-zinc-800 hover:border-rose-900/30 text-zinc-400 hover:text-rose-400 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove vertex handle"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Google AdSense Compliant Informational Article & FAQs Footer */}
      <div className="border-t border-zinc-900 pt-12 mt-12 space-y-10 text-left max-w-5xl mx-auto px-4">
        
        {/* Editorial Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Developer Guide: Custom CSS Clip-Path Polygon Vectors</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">
            A Deep Dive into CSS Clip-Path & High-Performance Geometric Design
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Struggling to build premium diagonal section dividers, star ratings, or custom polygonal hero frames? Learn how the CSS <code>clip-path</code> property provides standard hardware-accelerated clipping masks natively in your browser.
          </p>
        </div>

        {/* 2-Column Article Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Article Column 1 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-rose-500 font-mono">01.</span>
                What is CSS Clip-Path?
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                The **CSS clip-path property** allows developers to specify a specific region of an element that should remain visible, masking out the rest of the layout boundaries. This is highly useful for building modern shapes (such as triangles, trapezoids, circles, or custom multi-node polygons) without resorting to heavy image assets or complex canvas logic.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                By defining coordinates as percentage boundaries (ranging from <code>0% 0%</code> at the top-left to <code>100% 100%</code> at the bottom-right), clipping regions automatically scale fluidly across diverse mobile, tablet, and desktop display viewports.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-rose-500 font-mono">02.</span>
                Leveraging Polygons for Advanced Visual Architectures
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Among the diverse functions supported by clip-path (like <code>circle()</code>, <code>ellipse()</code>, and <code>inset()</code>), the **<code>polygon()</code> function** is by far the most versatile. It accepts an infinite array of vertex pairs defining the boundary track coordinates:
              </p>
              <ul className="space-y-2 text-zinc-400 text-xs pl-4 list-disc">
                <li><strong className="text-zinc-200">Point Coordinates:</strong> Each point is declared as an <code>X Y</code> pair, separated by a space, and separated from adjacent points by a comma.</li>
                <li><strong className="text-zinc-200">Connecting Tracks:</strong> The browser automatically connects the final listed vertex back to the first, creating a sealed, closed-path vector outline.</li>
              </ul>
            </div>
          </div>

          {/* Article Column 2 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-rose-500 font-mono">03.</span>
                Combining SVG Masks and CSS Clip-Paths
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                While standard polygons handle linear geometric bounds perfectly, organic curves require SVG mask mappings. Our utility supports a dedicated **SVG Markup exporter**, rendering your coordinates with normalized values (0.0 to 1.0) inside an <code>objectBoundingBox</code> scale.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                This lets developers easily reference custom SVG clipping definitions inside their global stylesheets via <code>clip-path: url(#custom-clip)</code>, maintaining perfect responsive vector behavior.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-rose-500 font-mono">04.</span>
                Step-by-Step Custom Mask Construction
              </h4>
              <ol className="space-y-1.5 text-zinc-400 text-xs pl-4 list-decimal">
                <li>Select from our library of standard geometric presets (triangle, trapezoid, message bubble) to load a starting node array.</li>
                <li>Drag nodes around our high-contrast 2D grid canvas to construct custom polygonal paths.</li>
                <li>Enable "Snap to Grid" to align coordinates with clean, rounded percentage integers (such as 1%, 5%, or 10%).</li>
                <li>Tweak rotational sliders or flip axes to build symmetrical structures in real-time.</li>
                <li>Copy clean CSS, custom Tailwind CSS bracket utilities, or scalable SVG defs into your project source.</li>
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
            <p className="text-zinc-500 text-xs">Got questions about CSS polygon layouts and browser support? Read on.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                Are elements clipped with clip-path still interactive in the clipped areas?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                No! The clipped-out portions of the element do not register mouse pointers, hover events, or touch taps. Pointer events flow directly through to elements located underneath, keeping your layouts extremely interactive.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                Why are box-shadows cut off when I apply a clip-path property?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Since box-shadows exist outside the element's traditional boundaries, they are immediately clipped out by the clip-path mask. To add a shadow, wrap your clipped element in a container with a CSS <code>filter: drop-shadow()</code> property applied.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                Is this utility 100% free and private?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Yes! The entire coordinate calculations, presets, and transformations execute locally on your device inside your browser sandbox. Your custom layout geometries are never sent to external servers, ensuring full data privacy.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                What browser engines support CSS polygon clip-paths?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                CSS clip-path polygon declarations enjoy near-universal support (over 98.5% global compatibility) across modern Chrome, Safari, Edge, Firefox, and major mobile browser engines.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

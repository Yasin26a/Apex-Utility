import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PenTool,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Download,
  Grid,
  Maximize2,
  Sliders,
  Settings,
  Layers,
  HelpCircle,
  Code,
  Sparkles,
  Info,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Plus,
  Play
} from 'lucide-react';

// Anchor point interface for single curve mode
interface CurvePoint {
  x: number;
  y: number;
  label: string;
  role: 'start' | 'end' | 'cp1' | 'cp2';
}

// Node interface for the Path Composer mode
interface PathNode {
  id: string;
  type: 'move' | 'line' | 'quadratic' | 'cubic';
  x: number; // Anchor point coordinate X
  y: number; // Anchor point coordinate Y
  cp1x?: number; // Control point 1 X
  cp1y?: number; // Control point 1 Y
  cp2x?: number; // Control point 2 X (only for cubic)
  cp2y?: number; // Control point 2 Y (only for cubic)
}

// Preset templates for quick inspiration
const PRESETS = {
  wave: {
    name: 'S-Curve Wave',
    mode: 'cubic' as const,
    points: [
      { x: 50, y: 250, label: 'Start Point (P0)', role: 'start' as const },
      { x: 150, y: 50, label: 'Control Point 1 (C1)', role: 'cp1' as const },
      { x: 250, y: 350, label: 'Control Point 2 (C2)', role: 'cp2' as const },
      { x: 350, y: 150, label: 'End Point (P1)', role: 'end' as const },
    ]
  },
  dome: {
    name: 'Quadratic Arch',
    mode: 'quadratic' as const,
    points: [
      { x: 50, y: 300, label: 'Start Point (P0)', role: 'start' as const },
      { x: 200, y: 50, label: 'Control Point (C1)', role: 'cp1' as const },
      { x: 350, y: 300, label: 'End Point (P1)', role: 'end' as const },
    ]
  },
  infinity: {
    name: 'Loop / Infinite',
    mode: 'cubic' as const,
    points: [
      { x: 100, y: 200, label: 'Start Point (P0)', role: 'start' as const },
      { x: 300, y: 50, label: 'Control Point 1 (C1)', role: 'cp1' as const },
      { x: 100, y: 350, label: 'Control Point 2 (C2)', role: 'cp2' as const },
      { x: 300, y: 200, label: 'End Point (P1)', role: 'end' as const },
    ]
  },
  leaf: {
    name: 'Leaf Point',
    mode: 'cubic' as const,
    points: [
      { x: 80, y: 320, label: 'Start Point (P0)', role: 'start' as const },
      { x: 100, y: 80, label: 'Control Point 1 (C1)', role: 'cp1' as const },
      { x: 320, y: 100, label: 'Control Point 2 (C2)', role: 'cp2' as const },
      { x: 320, y: 320, label: 'End Point (P1)', role: 'end' as const },
    ]
  }
};

const COMPOSER_PRESETS = [
  {
    name: 'Classic Heart Shape',
    nodes: [
      { id: '1', type: 'move' as const, x: 200, y: 130 },
      { id: '2', type: 'cubic' as const, x: 200, y: 340, cp1x: 50, cp1y: 40, cp2x: 50, cp2y: 260 },
      { id: '3', type: 'cubic' as const, x: 200, y: 130, cp1x: 350, cp1y: 260, cp2x: 350, cp2y: 40 }
    ],
    closed: true
  },
  {
    name: 'Smooth Teardrop',
    nodes: [
      { id: '1', type: 'move' as const, x: 200, y: 80 },
      { id: '2', type: 'cubic' as const, x: 200, y: 320, cp1x: 100, cp1y: 180, cp2x: 100, cp2y: 320 },
      { id: '3', type: 'cubic' as const, x: 200, y: 80, cp1x: 300, cp1y: 320, cp2x: 300, cp2y: 180 }
    ],
    closed: true
  },
  {
    name: 'Vector Mountain Ridge',
    nodes: [
      { id: '1', type: 'move' as const, x: 40, y: 320 },
      { id: '2', type: 'quadratic' as const, x: 140, y: 160, cp1x: 90, cp1y: 220 },
      { id: '3', type: 'quadratic' as const, x: 240, y: 240, cp1x: 190, cp1y: 120 },
      { id: '4', type: 'cubic' as const, x: 360, y: 120, cp1x: 280, cp1y: 280, cp2x: 320, cp2y: 80 },
      { id: '5', type: 'line' as const, x: 360, y: 320 }
    ],
    closed: true
  }
];

export default function BezierSpline() {
  // Playground mode: 'simple' (single cubic/quadratic segment) or 'composer' (multi-node editor)
  const [activeMode, setActiveMode] = useState<'simple' | 'composer'>('simple');
  const [simpleCurveType, setSimpleCurveType] = useState<'cubic' | 'quadratic'>('cubic');

  // Simple Mode Points State
  const [simplePoints, setSimplePoints] = useState<CurvePoint[]>(PRESETS.wave.points);

  // Composer Mode Nodes State
  const [composerNodes, setComposerNodes] = useState<PathNode[]>(COMPOSER_PRESETS[0].nodes);
  const [composerClosed, setComposerClosed] = useState<boolean>(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('2');

  // General Canvas Settings
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(20);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Styling properties
  const [fillColor, setFillColor] = useState<string>('#6366f1'); // Indigo-500
  const [strokeColor, setStrokeColor] = useState<string>('#4f46e5'); // Indigo-600
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [strokeDash, setStrokeDash] = useState<string>('none');
  const [fillOpacity, setFillOpacity] = useState<number>(10); // Percent
  const [strokeOpacity, setStrokeOpacity] = useState<number>(90); // Percent
  const [enableGradient, setEnableGradient] = useState<boolean>(true);
  const [gradientColor2, setGradientColor2] = useState<string>('#06b6d4'); // Cyan-500

  // Drag state
  const [activeDragElement, setActiveDragElement] = useState<{
    index: number;
    type: 'simple' | 'composer';
    handleType?: 'anchor' | 'cp1' | 'cp2';
  } | null>(null);

  const canvasRef = useRef<SVGSVGElement | null>(null);
  const [copiedType, setCopiedType] = useState<'svg' | 'react' | 'path' | null>(null);

  // Load a preset for single curve mode
  const handleLoadSimplePreset = (key: keyof typeof PRESETS) => {
    const preset = PRESETS[key];
    setSimpleCurveType(preset.mode);
    setSimplePoints(JSON.parse(JSON.stringify(preset.points)));
  };

  // Load a preset for composer mode
  const handleLoadComposerPreset = (presetIndex: number) => {
    const preset = COMPOSER_PRESETS[presetIndex];
    setComposerNodes(JSON.parse(JSON.stringify(preset.nodes)));
    setComposerClosed(preset.closed);
    if (preset.nodes.length > 0) {
      setSelectedNodeId(preset.nodes[0].id);
    }
  };

  // Toggle single curve type between cubic and quadratic
  useEffect(() => {
    if (activeMode === 'simple') {
      if (simpleCurveType === 'quadratic' && simplePoints.length === 4) {
        // Convert cubic to quadratic: drop CP2, map CP1 to mid-point
        const start = simplePoints[0];
        const cp1 = simplePoints[1];
        const end = simplePoints[3];
        setSimplePoints([
          start,
          { x: cp1.x, y: cp1.y, label: 'Control Point (C1)', role: 'cp1' },
          { x: end.x, y: end.y, label: 'End Point (P1)', role: 'end' }
        ]);
      } else if (simpleCurveType === 'cubic' && simplePoints.length === 3) {
        // Convert quadratic to cubic: add CP2
        const start = simplePoints[0];
        const cp1 = simplePoints[1];
        const end = simplePoints[2];
        setSimplePoints([
          start,
          { x: cp1.x - 30, y: cp1.y - 20, label: 'Control Point 1 (C1)', role: 'cp1' },
          { x: cp1.x + 30, y: cp1.y + 20, label: 'Control Point 2 (C2)', role: 'cp2' },
          { x: end.x, y: end.y, label: 'End Point (P1)', role: 'end' }
        ]);
      }
    }
  }, [simpleCurveType, activeMode]);

  // Compute Path Data String (d attribute)
  const getPathData = (): string => {
    if (activeMode === 'simple') {
      const p0 = simplePoints[0];
      if (!p0) return '';
      
      if (simpleCurveType === 'quadratic' && simplePoints.length >= 3) {
        const c1 = simplePoints[1];
        const p1 = simplePoints[2];
        return `M ${p0.x} ${p0.y} Q ${c1.x} ${c1.y}, ${p1.x} ${p1.y}`;
      } else if (simpleCurveType === 'cubic' && simplePoints.length >= 4) {
        const c1 = simplePoints[1];
        const c2 = simplePoints[2];
        const p1 = simplePoints[3];
        return `M ${p0.x} ${p0.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p1.x} ${p1.y}`;
      }
    } else {
      // Composer path assembler
      if (composerNodes.length === 0) return '';
      let d = '';
      composerNodes.forEach((node, idx) => {
        if (idx === 0 || node.type === 'move') {
          d += `M ${node.x} ${node.y} `;
        } else if (node.type === 'line') {
          d += `L ${node.x} ${node.y} `;
        } else if (node.type === 'quadratic') {
          d += `Q ${node.cp1x ?? (node.x - 40)} ${node.cp1y ?? (node.y - 40)}, ${node.x} ${node.y} `;
        } else if (node.type === 'cubic') {
          d += `C ${node.cp1x ?? (node.x - 60)} ${node.cp1y ?? (node.y - 60)}, ${node.cp2x ?? (node.x - 20)} ${node.cp2y ?? (node.y - 20)}, ${node.x} ${node.y} `;
        }
      });
      if (composerClosed) {
        d += 'Z';
      }
      return d.trim();
    }
    return '';
  };

  const pathDataString = getPathData();

  // Helper: Snap to Grid coordinate calculation
  const snap = (val: number): number => {
    if (!snapToGrid) return Math.round(val);
    return Math.round(val / gridSize) * gridSize;
  };

  // Drag movement tracker
  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!activeDragElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // Bound coordinates inside canvas workspace (400x400 view size)
    const boundedX = Math.max(0, Math.min(400, rawX));
    const boundedY = Math.max(0, Math.min(400, rawY));

    const finalX = snap(boundedX);
    const finalY = snap(boundedY);

    if (activeDragElement.type === 'simple') {
      setSimplePoints(prev => {
        const next = [...prev];
        if (next[activeDragElement.index]) {
          next[activeDragElement.index] = {
            ...next[activeDragElement.index],
            x: finalX,
            y: finalY
          };
        }
        return next;
      });
    } else {
      // Composer Drag update
      setComposerNodes(prev => {
        const next = [...prev];
        const node = next[activeDragElement.index];
        if (node) {
          if (activeDragElement.handleType === 'anchor') {
            // Move anchor point. If it's a curve, offset its control points correspondingly to preserve segment shapes!
            const dx = finalX - node.x;
            const dy = finalY - node.y;
            node.x = finalX;
            node.y = finalY;
            if (node.cp1x !== undefined) node.cp1x = snap(node.cp1x + dx);
            if (node.cp1y !== undefined) node.cp1y = snap(node.cp1y + dy);
            if (node.cp2x !== undefined) node.cp2x = snap(node.cp2x + dx);
            if (node.cp2y !== undefined) node.cp2y = snap(node.cp2y + dy);
          } else if (activeDragElement.handleType === 'cp1') {
            node.cp1x = finalX;
            node.cp1y = finalY;
          } else if (activeDragElement.handleType === 'cp2') {
            node.cp2x = finalX;
            node.cp2y = finalY;
          }
        }
        return next;
      });
    }
  };

  const stopDragging = () => {
    setActiveDragElement(null);
  };

  // Composer mode actions: Add a new node at center or after current active node
  const handleAddComposerNode = (type: 'line' | 'quadratic' | 'cubic') => {
    const id = Date.now().toString();
    // Default coords based on last node or center
    let prevNode = composerNodes[composerNodes.length - 1];
    if (selectedNodeId) {
      const foundIdx = composerNodes.findIndex(n => n.id === selectedNodeId);
      if (foundIdx !== -1) {
        prevNode = composerNodes[foundIdx];
      }
    }

    const baseX = prevNode ? prevNode.x : 200;
    const baseY = prevNode ? prevNode.y : 200;

    const newX = Math.min(380, baseX + 60);
    const newY = Math.min(380, baseY + 40);

    const newNode: PathNode = {
      id,
      type,
      x: newX,
      y: newY
    };

    if (type === 'quadratic') {
      newNode.cp1x = Math.round((baseX + newX) / 2);
      newNode.cp1y = Math.round((baseY + newY) / 2) - 40;
    } else if (type === 'cubic') {
      newNode.cp1x = Math.round(baseX + 20);
      newNode.cp1y = Math.round(baseY - 30);
      newNode.cp2x = Math.round(newX - 20);
      newNode.cp2y = Math.round(newY - 30);
    }

    // Insert after selected node or at the end
    setComposerNodes(prev => {
      if (!selectedNodeId) return [...prev, newNode];
      const idx = prev.findIndex(n => n.id === selectedNodeId);
      if (idx === -1) return [...prev, newNode];
      const nextList = [...prev];
      nextList.splice(idx + 1, 0, newNode);
      return nextList;
    });

    setSelectedNodeId(id);
  };

  // Remove selected composer node
  const handleRemoveComposerNode = (id: string) => {
    if (composerNodes.length <= 1) return; // Must keep at least start point
    const idx = composerNodes.findIndex(n => n.id === id);
    setComposerNodes(prev => prev.filter(n => n.id !== id));
    
    // Select near sibling
    if (idx !== -1) {
      const nextIdx = idx === 0 ? 0 : idx - 1;
      const remaining = composerNodes.filter(n => n.id !== id);
      if (remaining[nextIdx]) {
        setSelectedNodeId(remaining[nextIdx].id);
      }
    }
  };

  // Manual point coordinate inputs modifier
  const handleUpdateNodeCoordinate = (
    nodeIdx: number, 
    field: 'x' | 'y' | 'cp1x' | 'cp1y' | 'cp2x' | 'cp2y', 
    val: number
  ) => {
    const safeVal = Math.max(0, Math.min(400, val));
    if (activeMode === 'simple') {
      setSimplePoints(prev => {
        const next = [...prev];
        if (next[nodeIdx]) {
          next[nodeIdx] = {
            ...next[nodeIdx],
            [field]: safeVal
          };
        }
        return next;
      });
    } else {
      setComposerNodes(prev => {
        const next = [...prev];
        const node = next[nodeIdx];
        if (node) {
          node[field] = safeVal;
        }
        return next;
      });
    }
  };

  // Code Copy Utilities
  const copyToClipboard = (text: string, type: 'svg' | 'react' | 'path') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const getFullSvgCode = (): string => {
    const fillDef = enableGradient
      ? `url(#bezier-gradient-${activeMode})`
      : fillColor;
    const dashAttr = strokeDash !== 'none' ? ` stroke-dasharray="${strokeDash}"` : '';

    return `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  ${enableGradient ? `<defs>
    <linearGradient id="bezier-gradient-${activeMode}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${fillColor}" />
      <stop offset="100%" stop-color="${gradientColor2}" />
    </linearGradient>
  </defs>` : ''}
  <path
    d="${pathDataString}"
    fill="${fillDef}"
    fill-opacity="${fillOpacity / 100}"
    stroke="${strokeColor}"
    stroke-width="${strokeWidth}"
    stroke-opacity="${strokeOpacity / 100}"${dashAttr}
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>`;
  };

  const getReactCode = (): string => {
    const fillDef = enableGradient
      ? `url(#bezier-gradient-${activeMode})`
      : fillColor;
    const dashAttr = strokeDash !== 'none' ? ` strokeDasharray="${strokeDash}"` : '';

    return `import React from 'react';

export default function CustomVectorShape() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-md mx-auto">
      ${enableGradient ? `<defs>
        <linearGradient id="bezier-gradient-${activeMode}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="${fillColor}" />
          <stop offset="100%" stopColor="${gradientColor2}" />
        </linearGradient>
      </defs>` : ''}
      <path
        d="${pathDataString}"
        fill="${fillDef}"
        fillOpacity={${fillOpacity / 100}}
        stroke="${strokeColor}"
        strokeWidth={${strokeWidth}}
        strokeOpacity={${strokeOpacity / 100}}${dashAttr}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />
    </svg>
  );
}`;
  };

  return (
    <div className="space-y-6 text-white pb-10" id="bezier-playground-root">
      
      {/* Brand & Heading section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
              VECTOR LAB
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 animate-pulse">
              SVG ENGINE v2
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <PenTool className="w-8 h-8 text-amber-400" />
            Bézier Spline Playground &amp; Illustrator
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Draw curves, trace smooth spline paths, and configure premium CSS gradients. Create custom vector assets, illustrations, or UI waves, and copy production-ready code.
          </p>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex bg-slate-900 border border-white/10 p-1 rounded-2xl shrink-0 self-start md:self-center">
          <button
            onClick={() => setActiveMode('simple')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'simple'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Simple Spline
          </button>
          <button
            onClick={() => setActiveMode('composer')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'composer'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Spline Composer (Multi-Segment)
          </button>
        </div>
      </div>

      {/* Main Studio grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="bezier-body">
        
        {/* LEFT COLUMN: INTERACTIVE CANVAS WORKSPACE (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Quick presets toolbar */}
          <div className="bg-slate-900/80 border border-white/10 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Presets Library:</span>
            </div>
            
            {activeMode === 'simple' ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleLoadSimplePreset(key)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors border border-white/5"
                  >
                    {PRESETS[key].name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {COMPOSER_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLoadComposerPreset(idx)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors border border-white/5"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Vector Stage */}
          <div className="relative bg-[#090d16] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col items-center justify-center">
            
            {/* Legend Coordinates & Snap information indicator */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-slate-400 pointer-events-none">
              <Grid className="w-3.5 h-3.5 text-amber-400" />
              <span>Canvas Space: 400x400</span>
              <span className="text-slate-600">|</span>
              <span>Snap: {snapToGrid ? `${gridSize}px` : 'Free'}</span>
            </div>

            {/* Toggle view controls top-right */}
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-1.5 rounded-lg transition-colors ${showGrid ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400 hover:text-white'}`}
                title="Toggle Canvas Grid"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowGuides(!showGuides)}
                className={`p-1.5 rounded-lg transition-colors ${showGuides ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400 hover:text-white'}`}
                title="Toggle Vector Guide Lines"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`p-1.5 rounded-lg transition-colors ${showLabels ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400 hover:text-white'}`}
                title="Toggle Point Coordinates Labels"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Main Interactive SVG Vector Canvas */}
            <svg
              ref={canvasRef}
              viewBox="0 0 400 400"
              className="w-full aspect-square max-w-[480px] bg-[#0c1527] border border-white/5 rounded-xl cursor-default relative overflow-visible mt-6"
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
              id="bezier-interactive-svg"
            >
              {/* Optional Grid Background */}
              {showGrid && (
                <g opacity="0.15">
                  {Array.from({ length: 400 / gridSize + 1 }).map((_, i) => {
                    const coord = i * gridSize;
                    return (
                      <React.Fragment key={i}>
                        {/* Horizontal Gridline */}
                        <line x1="0" y1={coord} x2="400" y2={coord} stroke="#3b82f6" strokeWidth="1" />
                        {/* Vertical Gridline */}
                        <line x1={coord} y1="0" x2={coord} y2="400" stroke="#3b82f6" strokeWidth="1" />
                      </React.Fragment>
                    );
                  })}
                </g>
              )}

              {/* Dynamic Gradients Definitions */}
              <defs>
                <linearGradient id="live-bezier-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={fillColor} />
                  <stop offset="100%" stopColor={gradientColor2} />
                </linearGradient>
              </defs>

              {/* THE CORE DRAWN SPLINE / SVG SHAPE PATH */}
              <path
                d={pathDataString}
                fill={enableGradient ? 'url(#live-bezier-gradient)' : fillColor}
                fillOpacity={fillOpacity / 100}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity / 100}
                strokeDasharray={strokeDash !== 'none' ? strokeDash : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Simple Mode control handles and guide lines */}
              {activeMode === 'simple' && showGuides && (
                <g>
                  {/* Guideline Start-CP1 */}
                  <line
                    x1={simplePoints[0].x}
                    y1={simplePoints[0].y}
                    x2={simplePoints[1].x}
                    y2={simplePoints[1].y}
                    stroke="#fbbf24"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />
                  
                  {/* Guideline End-CP2 (if cubic) */}
                  {simpleCurveType === 'cubic' && simplePoints[2] && simplePoints[3] && (
                    <line
                      x1={simplePoints[3].x}
                      y1={simplePoints[3].y}
                      x2={simplePoints[2].x}
                      y2={simplePoints[2].y}
                      stroke="#fbbf24"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      opacity="0.6"
                    />
                  )}

                  {/* Guideline End-CP1 (if quadratic) */}
                  {simpleCurveType === 'quadratic' && simplePoints[1] && simplePoints[2] && (
                    <line
                      x1={simplePoints[2].x}
                      y1={simplePoints[2].y}
                      x2={simplePoints[1].x}
                      y2={simplePoints[1].y}
                      stroke="#fbbf24"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      opacity="0.6"
                    />
                  )}
                </g>
              )}

              {/* Composer Mode control handles and lines */}
              {activeMode === 'composer' && showGuides && (
                <g>
                  {composerNodes.map((node, idx) => {
                    const prevNode = idx > 0 ? composerNodes[idx - 1] : null;
                    if (!prevNode) return null;

                    return (
                      <g key={node.id}>
                        {/* If quadratic curve node */}
                        {node.type === 'quadratic' && node.cp1x !== undefined && node.cp1y !== undefined && (
                          <>
                            <line x1={prevNode.x} y1={prevNode.y} x2={node.cp1x} y2={node.cp1y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                            <line x1={node.x} y1={node.y} x2={node.cp1x} y2={node.cp1y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                          </>
                        )}
                        {/* If cubic curve node */}
                        {node.type === 'cubic' && node.cp1x !== undefined && node.cp1y !== undefined && node.cp2x !== undefined && node.cp2y !== undefined && (
                          <>
                            <line x1={prevNode.x} y1={prevNode.y} x2={node.cp1x} y2={node.cp1y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                            <line x1={node.x} y1={node.y} x2={node.cp2x} y2={node.cp2y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                          </>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* INTERACTIVE DRAGGABLE ANCHOR DOTS Layer */}
              {/* Simple Mode Interactive Points */}
              {activeMode === 'simple' &&
                simplePoints.map((point, index) => {
                  const isControlPoint = point.role === 'cp1' || point.role === 'cp2';
                  return (
                    <g key={index}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={isControlPoint ? 7 : 9}
                        fill={isControlPoint ? '#f59e0b' : '#3b82f6'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="cursor-pointer transition-all hover:scale-125 hover:fill-indigo-400 active:scale-95"
                        onMouseDown={() =>
                          setActiveDragElement({
                            index,
                            type: 'simple'
                          })
                        }
                      />
                      {showLabels && (
                        <text
                          x={point.x}
                          y={point.y - 14}
                          fill="#f8fafc"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="middle"
                          className="bg-slate-900 pointer-events-none select-none font-bold"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                        >
                          {point.role === 'start' ? 'P0' : point.role === 'end' ? 'P1' : point.role === 'cp1' ? 'C1' : 'C2'} ({point.x},{point.y})
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* Composer Mode Interactive Points */}
              {activeMode === 'composer' &&
                composerNodes.map((node, index) => {
                  const isNodeSelected = selectedNodeId === node.id;
                  return (
                    <g key={node.id}>
                      {/* Main Anchor node */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={8}
                        fill={isNodeSelected ? '#a855f7' : '#10b981'}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        className="cursor-pointer transition-all hover:scale-125 hover:fill-purple-400"
                        onMouseDown={() => {
                          setSelectedNodeId(node.id);
                          setActiveDragElement({
                            index,
                            type: 'composer',
                            handleType: 'anchor'
                          });
                        }}
                      />
                      
                      {/* Control point 1 circle handle */}
                      {node.cp1x !== undefined && node.cp1y !== undefined && (
                        <circle
                          cx={node.cp1x}
                          cy={node.cp1y}
                          r={6.5}
                          fill="#f59e0b"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="cursor-pointer transition-all hover:scale-125"
                          onMouseDown={() => {
                            setSelectedNodeId(node.id);
                            setActiveDragElement({
                              index,
                              type: 'composer',
                              handleType: 'cp1'
                            });
                          }}
                        />
                      )}

                      {/* Control point 2 circle handle (cubic only) */}
                      {node.type === 'cubic' && node.cp2x !== undefined && node.cp2y !== undefined && (
                        <circle
                          cx={node.cp2x}
                          cy={node.cp2y}
                          r={6.5}
                          fill="#ef4444"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="cursor-pointer transition-all hover:scale-125"
                          onMouseDown={() => {
                            setSelectedNodeId(node.id);
                            setActiveDragElement({
                              index,
                              type: 'composer',
                              handleType: 'cp2'
                            });
                          }}
                        />
                      )}

                      {/* Optional Coordinate label rendering */}
                      {showLabels && (
                        <text
                          x={node.x}
                          y={node.y - 14}
                          fill={isNodeSelected ? '#c084fc' : '#34d399'}
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="middle"
                          className="pointer-events-none select-none font-bold"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                        >
                          Node {index + 1} ({node.x},{node.y})
                        </text>
                      )}
                    </g>
                  );
                })}
            </svg>

            {/* Canvas Info Help Footer */}
            <p className="text-slate-500 text-xs text-center mt-4 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {activeMode === 'simple'
                  ? 'Drag the blue circles to change anchors, or drag orange circles to adjust Bézier curves curvature.'
                  : 'Click on any green circle to select node, then add line, quadratic, or cubic segments sequentially.'}
              </span>
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: VECTOR PROPERTIES & CODE PANEL (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Node Segments List Organizer (ONLY IN COMPOSER MODE) */}
          {activeMode === 'composer' && (
            <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Path Nodes List
                </h3>

                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-lg border border-white/5 font-mono font-bold">
                  {composerNodes.length} Nodes
                </span>
              </div>

              {/* Node cards table */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
                {composerNodes.map((node, idx) => {
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-purple-600/15 border-purple-500/50 text-purple-200' 
                          : 'bg-black/40 border-white/5 hover:border-white/15 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] text-slate-500">#{idx + 1}</span>
                        <div className="space-y-0.5">
                          <span className="font-bold font-sans uppercase text-[11px]">
                            {idx === 0 ? 'Move To (M)' : node.type === 'line' ? 'Line Segment (L)' : node.type === 'quadratic' ? 'Quadratic Curve (Q)' : 'Cubic Curve (C)'}
                          </span>
                          <p className="font-mono text-[10px] text-slate-400">Anchor: X:{node.x}, Y:{node.y}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {idx > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveComposerNode(node.id);
                            }}
                            className="p-1 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded transition-colors"
                            title="Remove Node"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Action Buttons to insert segments */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleAddComposerNode('line')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-[11px] font-bold text-slate-200 flex items-center justify-center gap-1 transition-colors border border-white/5"
                >
                  <Plus className="w-3 h-3 text-emerald-400" /> + Line
                </button>
                <button
                  onClick={() => handleAddComposerNode('quadratic')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-[11px] font-bold text-slate-200 flex items-center justify-center gap-1 transition-colors border border-white/5"
                >
                  <Plus className="w-3 h-3 text-amber-400" /> + Quad
                </button>
                <button
                  onClick={() => handleAddComposerNode('cubic')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-[11px] font-bold text-slate-200 flex items-center justify-center gap-1 transition-colors border border-white/5"
                >
                  <Plus className="w-3 h-3 text-indigo-400" /> + Cubic
                </button>
              </div>

              {/* Is closed path checklist toggle */}
              <label className="flex items-center gap-2.5 bg-black/30 p-2.5 rounded-xl border border-white/5 cursor-pointer hover:bg-black/40">
                <input
                  type="checkbox"
                  checked={composerClosed}
                  onChange={(e) => setComposerClosed(e.target.checked)}
                  className="rounded border-white/20 bg-slate-800 text-purple-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs text-slate-300 font-semibold select-none">Close Path automatically with Z (fills the vector segment smoothly)</span>
              </label>
            </div>
          )}

          {/* Simple Mode Segment Coordinates Inputs */}
          {activeMode === 'simple' && (
            <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Anchor Coordinates Inspector
                </h3>

                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-white/5 text-[10px]">
                  <button
                    onClick={() => setSimpleCurveType('cubic')}
                    className={`px-2 py-1 rounded font-bold transition-all ${simpleCurveType === 'cubic' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    Cubic
                  </button>
                  <button
                    onClick={() => setSimpleCurveType('quadratic')}
                    className={`px-2 py-1 rounded font-bold transition-all ${simpleCurveType === 'quadratic' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    Quadratic
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {simplePoints.map((point, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center bg-black/40 p-2 rounded-xl border border-white/5">
                    <div className="col-span-5 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${point.role.startsWith('cp') ? 'bg-amber-400' : 'bg-blue-400'}`} />
                      <span className="text-xs font-semibold text-slate-300">{point.role === 'start' ? 'Start (P0)' : point.role === 'end' ? 'End (P1)' : point.role === 'cp1' ? 'Control 1' : 'Control 2'}</span>
                    </div>

                    {/* X axis slider/numeric input */}
                    <div className="col-span-3 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-mono">X:</span>
                      <input
                        type="number"
                        value={point.x}
                        onChange={(e) => handleUpdateNodeCoordinate(index, 'x', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-slate-800 border border-white/5 rounded-lg p-1 font-mono text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                      />
                    </div>

                    {/* Y axis slider/numeric input */}
                    <div className="col-span-3 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-mono">Y:</span>
                      <input
                        type="number"
                        value={point.y}
                        onChange={(e) => handleUpdateNodeCoordinate(index, 'y', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-slate-800 border border-white/5 rounded-lg p-1 font-mono text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SVG Vector styling customized panel */}
          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              SVG Styling customizer
            </h3>

            {/* Grid coordinates configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold uppercase mb-1">Fill Type:</label>
                <div className="flex bg-slate-800 p-0.5 rounded-xl border border-white/5 text-[11px]">
                  <button
                    onClick={() => setEnableGradient(false)}
                    className={`flex-1 py-1 rounded-lg font-bold transition-all ${!enableGradient ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    Solid Color
                  </button>
                  <button
                    onClick={() => setEnableGradient(true)}
                    className={`flex-1 py-1 rounded-lg font-bold transition-all ${enableGradient ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    Gradient
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold uppercase mb-1">Stroke Type:</label>
                <select
                  value={strokeDash}
                  onChange={(e) => setStrokeDash(e.target.value)}
                  className="w-full bg-slate-800 border border-white/5 rounded-xl p-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="none">Solid Line</option>
                  <option value="4 4">Dashed (4 4)</option>
                  <option value="10 5">Dashed Wide (10 5)</option>
                  <option value="2 2">Dotted (2 2)</option>
                </select>
              </div>
            </div>

            {/* Colors picker controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold uppercase mb-1">
                  {enableGradient ? 'Gradient Start:' : 'Fill Color:'}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    className="flex-1 bg-slate-800 border border-white/5 rounded-xl px-2 py-1 font-mono text-xs text-white"
                  />
                </div>
              </div>

              {enableGradient ? (
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold uppercase mb-1">Gradient End:</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={gradientColor2}
                      onChange={(e) => setGradientColor2(e.target.value)}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={gradientColor2}
                      onChange={(e) => setGradientColor2(e.target.value)}
                      className="flex-1 bg-slate-800 border border-white/5 rounded-xl px-2 py-1 font-mono text-xs text-white"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold uppercase mb-1">Stroke Color:</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="flex-1 bg-slate-800 border border-white/5 rounded-xl px-2 py-1 font-mono text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Optional Stroke Color configuration for Gradients mode */}
            {enableGradient && (
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold uppercase mb-1">Stroke Color:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="flex-1 bg-slate-800 border border-white/5 rounded-xl px-2 py-1 font-mono text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* Range adjustments slider */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase mb-1">
                  <span>Fill Opacity:</span>
                  <span>{fillOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={fillOpacity}
                  onChange={(e) => setFillOpacity(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase mb-1">
                    <span>Stroke Width:</span>
                    <span>{strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase mb-1">
                    <span>Stroke Opacity:</span>
                    <span>{strokeOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={strokeOpacity}
                    onChange={(e) => setStrokeOpacity(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Snap configuration switch */}
            <div className="flex items-center justify-between bg-black/30 p-2.5 rounded-xl border border-white/5 text-xs">
              <span className="text-slate-300 font-semibold">Snap to grid-spacing intersections:</span>
              <button
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  snapToGrid 
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-400 border border-white/5'
                }`}
              >
                {snapToGrid ? 'ON (20px)' : 'OFF'}
              </button>
            </div>
          </div>

          {/* CODE EXPORTS OUTPUT BAR */}
          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Code className="w-4 h-4 text-amber-400" />
              Production Code Exporters
            </h3>

            {/* Path Coordinates raw string box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">SVG Path Data (d):</span>
                <button
                  onClick={() => copyToClipboard(pathDataString, 'path')}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  {copiedType === 'path' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copy Data Only
                </button>
              </div>
              <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 text-[11px] font-mono text-emerald-400 select-all max-h-[60px] overflow-y-auto break-all">
                {pathDataString}
              </div>
            </div>

            {/* Split Svg vs React tab exporter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Full Component Markup:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(getFullSvgCode(), 'svg')}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    {copiedType === 'svg' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy raw SVG
                  </button>
                  <button
                    onClick={() => copyToClipboard(getReactCode(), 'react')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors border border-white/5"
                  >
                    {copiedType === 'react' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy React JSX
                  </button>
                </div>
              </div>

              <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                <pre className="text-[10px] font-mono text-slate-300 max-h-[140px] overflow-y-auto whitespace-pre leading-normal scrollbar-thin">
                  {getReactCode()}
                </pre>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

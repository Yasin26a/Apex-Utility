import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Network,
  Upload,
  Download,
  Copy,
  Check,
  Search,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Info,
  HelpCircle,
  Sparkles,
  Database,
  Sliders,
  Play,
  CheckCircle2,
  Code,
  ZoomIn,
  ZoomOut,
  Focus,
  Braces
} from 'lucide-react';
import html2canvas from 'html2canvas';

// Types for JSON Spatial Nodes
interface JSONNode {
  id: string; // unique path: e.g. "root.users.0.name"
  key: string; // "name" or index
  value?: any; // primitive value
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  depth: number;
  parentId: string | null;
  collapsed: boolean;
  childrenIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

// Preset Premium Examples
const EXAMPLES = {
  telemetry: {
    serviceName: "apex-gateway-router",
    status: "healthy",
    metrics: {
      uptimeSeconds: 84920,
      memoryUsageMB: 142.8,
      cpuPercent: 4.2,
      activeChannels: [
        { id: "ch-01", type: "websocket", pingMs: 14 },
        { id: "ch-02", type: "http-polling", pingMs: 42 }
      ]
    },
    security: {
      sslEnabled: true,
      jwtIssuer: "https://auth.apex.io"
    }
  },
  orgHierarchy: {
    company: "Apex Labs Inc",
    ceo: "Sarah Jenkins",
    offices: ["San Francisco", "London", "Tokyo"],
    departments: {
      engineering: {
        vp: "Alex Rivera",
        teams: ["Infra", "UX Core", "AI Agents"],
        budgetUSD: 1250000
      },
      product: {
        vp: "Elena Rostova",
        priorityLevel: 10,
        nextLaunch: "v2.4-stable"
      }
    }
  },
  simpleConfig: {
    appName: "Web Workspace Suite",
    version: "1.0.0",
    offlineMode: true,
    maxUploadLimitBytes: 10485760,
    database: null,
    features: {
      enableAiCopywriting: true,
      enableOfflineSync: false,
      themes: ["dark", "light", "cosmic"]
    }
  }
};

export default function JSONNodeMap() {
  // Input State
  const [jsonInput, setJsonInput] = useState<string>(JSON.stringify(EXAMPLES.telemetry, null, 2));
  const [error, setError] = useState<string | null>(null);
  
  // Interactive Nodes state
  const [nodes, setNodes] = useState<Record<string, JSONNode>>({});
  const [rootId, setRootId] = useState<string>('root');
  
  // Canvas View State (Pan & Zoom)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 50 });
  const [scale, setScale] = useState<number>(0.9);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Search/Filter Highlights
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  
  // UI states
  const [activePreset, setActivePreset] = useState<keyof typeof EXAMPLES>('telemetry');
  const [copiedType, setCopiedType] = useState<'json' | 'branch' | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Parse JSON & build the initial flat node dictionary
  const parseJsonToNodes = (rawText: string) => {
    try {
      const parsed = JSON.parse(rawText);
      setError(null);
      
      const newNodes: Record<string, JSONNode> = {};
      
      const traverse = (data: any, key: string, parentId: string | null, depth: number, currentPath: string) => {
        let type: JSONNode['type'] = 'null';
        if (data === null) type = 'null';
        else if (Array.isArray(data)) type = 'array';
        else if (typeof data === 'object') type = 'object';
        else if (typeof data === 'string') type = 'string';
        else if (typeof data === 'number') type = 'number';
        else if (typeof data === 'boolean') type = 'boolean';

        const childrenIds: string[] = [];
        const node: JSONNode = {
          id: currentPath,
          key,
          type,
          depth,
          parentId,
          collapsed: depth >= 2, // Auto collapse nodes deeper than depth 2
          childrenIds,
          x: 0,
          y: 0,
          width: 180,
          height: 52,
        };

        newNodes[currentPath] = node;

        if (type === 'object') {
          Object.entries(data).forEach(([childKey, childValue]) => {
            const childPath = `${currentPath}.${childKey}`;
            childrenIds.push(childPath);
            traverse(childValue, childKey, currentPath, depth + 1, childPath);
          });
        } else if (type === 'array') {
          data.forEach((childValue: any, index: number) => {
            const childPath = `${currentPath}.[${index}]`;
            childrenIds.push(childPath);
            traverse(childValue, `[${index}]`, currentPath, depth + 1, childPath);
          });
        } else {
          node.value = data;
        }
      };

      traverse(parsed, 'JSON Root', null, 0, 'root');
      setRootId('root');
      setNodes(newNodes);
      setSelectedNodeId(null);
    } catch (err: any) {
      setError(err.message || 'Invalid JSON format');
    }
  };

  // Run parser on mount or preset changes
  useEffect(() => {
    parseJsonToNodes(jsonInput);
  }, []);

  // Preset Selection Handler
  const handleLoadPreset = (key: keyof typeof EXAMPLES) => {
    setActivePreset(key);
    const jsonStr = JSON.stringify(EXAMPLES[key], null, 2);
    setJsonInput(jsonStr);
    parseJsonToNodes(jsonStr);
  };

  // Run JSON formatting validation manually
  const handleFormatInput = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      parseJsonToNodes(JSON.stringify(parsed, null, 2));
    } catch (err: any) {
      setError(err.message || 'Invalid JSON format');
    }
  };

  // --- LAYOUT & COORDINATES ASSIGNMENT ALGORITHM ---
  const HORIZONTAL_GAP = 240;
  const ROW_HEIGHT = 70;

  // Compute live visual coordinates layout based on active expanded state
  const getLayoutComputedNodes = (): Record<string, JSONNode> => {
    if (!nodes[rootId]) return {};
    
    const subtreeRows: Record<string, number> = {};
    
    // 1. Calculate how many rows each subtree occupies
    const getSubtreeRows = (id: string): number => {
      const node = nodes[id];
      if (!node) return 0;
      if (node.collapsed || node.childrenIds.length === 0) {
        subtreeRows[id] = 1;
        return 1;
      }
      let total = 0;
      for (const childId of node.childrenIds) {
        total += getSubtreeRows(childId);
      }
      subtreeRows[id] = total;
      return total;
    };
    
    getSubtreeRows(rootId);
    
    // 2. Pre-order traversal coordinates assignment
    const layoutNodes = { ...nodes };
    
    const assignCoords = (id: string, startY: number, x: number) => {
      const node = layoutNodes[id];
      if (!node) return;
      
      const heightRows = subtreeRows[id] || 1;
      const centerY = startY + (heightRows * ROW_HEIGHT) / 2 - ROW_HEIGHT / 2;
      
      node.x = x;
      node.y = centerY;
      
      if (!node.collapsed && node.childrenIds.length > 0) {
        let currentY = startY;
        for (const childId of node.childrenIds) {
          assignCoords(childId, currentY, x + HORIZONTAL_GAP);
          currentY += (subtreeRows[childId] || 1) * ROW_HEIGHT;
        }
      }
    };
    
    assignCoords(rootId, 40, 50);
    return layoutNodes;
  };

  const computedNodes = getLayoutComputedNodes();

  // Handle Search Queries (highlights matching nodes)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setHighlightedNodes(new Set());
      return;
    }
    
    const matches = new Set<string>();
    const query = searchQuery.toLowerCase();

    Object.entries(nodes).forEach(([id, node]) => {
      const keyMatch = node.key.toLowerCase().includes(query);
      const valueMatch = node.value !== undefined && String(node.value).toLowerCase().includes(query);
      const typeMatch = node.type.toLowerCase().includes(query);

      if (keyMatch || valueMatch || typeMatch) {
        matches.add(id);
        
        // Auto expand all parent nodes to ensure the match is visible in viewport!
        let parentId = node.parentId;
        while (parentId) {
          if (nodes[parentId]) {
            nodes[parentId].collapsed = false;
          }
          parentId = nodes[parentId]?.parentId || null;
        }
      }
    });

    setHighlightedNodes(matches);
  }, [searchQuery, nodes]);

  // Expand / Collapse Toggler
  const toggleNodeCollapse = (id: string) => {
    setNodes(prev => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          ...prev[id],
          collapsed: !prev[id].collapsed
        }
      };
    });
  };

  // Expand All / Collapse All Utility
  const setAllCollapseState = (collapsed: boolean) => {
    setNodes(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (key !== rootId) {
          next[key] = { ...next[key], collapsed };
        }
      });
      return next;
    });
  };

  // Focus/Center camera view on a node
  const handleFocusNode = (node: JSONNode) => {
    setSelectedNodeId(node.id);
    if (!viewportRef.current) return;
    const width = viewportRef.current.clientWidth;
    const height = viewportRef.current.clientHeight;
    
    setPan({
      x: width / 2 - node.x * scale,
      y: height / 2 - node.y * scale
    });
  };

  // Extract / Copy selected Node's sub-JSON data slice
  const handleCopySubBranch = (node: JSONNode) => {
    try {
      const fullParsed = JSON.parse(jsonInput);
      
      // Parse the JSON path path to retrieve branch
      const pathParts = node.id.split('.').slice(1); // skip "root"
      let currentSlice = fullParsed;
      
      for (const part of pathParts) {
        if (part.startsWith('[') && part.endsWith(']')) {
          const index = parseInt(part.slice(1, -1), 10);
          currentSlice = currentSlice[index];
        } else {
          currentSlice = currentSlice[part];
        }
      }

      navigator.clipboard.writeText(JSON.stringify(currentSlice, null, 2));
      setCopiedType('branch');
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // fallback to key
      navigator.clipboard.writeText(JSON.stringify({ [node.key]: node.value ?? {} }, null, 2));
    }
  };

  // --- PAN & DRAG CANVAS CONTROLS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-node-card')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.05;
    const nextScale = e.deltaY < 0 ? Math.min(2, scale + zoomFactor) : Math.max(0.4, scale - zoomFactor);
    setScale(nextScale);
  };

  const handleResetView = () => {
    setPan({ x: 40, y: 80 });
    setScale(0.9);
    setSelectedNodeId(null);
  };

  // Export visual network canvas to high-res PNG using HTML5 Canvas
  const handleExportPNG = async () => {
    const targetElement = document.getElementById('nodes-visual-render');
    if (!targetElement) return;

    // Temporarily reset pan/scale coordinates for standard static capture
    const originalPan = pan;
    const originalScale = scale;
    
    // Fit canvas bounds to center for screenshot rendering
    setPan({ x: 30, y: 30 });
    setScale(1.0);

    setTimeout(async () => {
      try {
        const canvas = await html2canvas(targetElement, {
          backgroundColor: '#090d16',
          logging: false,
          scale: 2 // High definition scale multiplier
        });
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `apex-spatial-json-${activePreset}.png`;
        link.click();
      } catch (err) {
        console.error('PNG snapshot render failure', err);
      } finally {
        // Restore view bounds
        setPan(originalPan);
        setScale(originalScale);
      }
    }, 150);
  };

  // Node Color classification by JSON value type
  const getTypeColorClasses = (type: JSONNode['type']) => {
    switch (type) {
      case 'object':
        return {
          border: 'border-indigo-500/40 hover:border-indigo-400 group-hover:shadow-indigo-500/20',
          text: 'text-indigo-300',
          badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
        };
      case 'array':
        return {
          border: 'border-teal-500/40 hover:border-teal-400 group-hover:shadow-teal-500/20',
          text: 'text-teal-300',
          badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20'
        };
      case 'string':
        return {
          border: 'border-emerald-500/40 hover:border-emerald-400 group-hover:shadow-emerald-500/20',
          text: 'text-emerald-300',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
      case 'number':
        return {
          border: 'border-amber-500/40 hover:border-amber-400 group-hover:shadow-amber-500/20',
          text: 'text-amber-300',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        };
      case 'boolean':
        return {
          border: 'border-pink-500/40 hover:border-pink-400 group-hover:shadow-pink-500/20',
          text: 'text-pink-300',
          badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20'
        };
      default:
        return {
          border: 'border-slate-500/40 hover:border-slate-400 group-hover:shadow-slate-500/20',
          text: 'text-slate-300',
          badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        };
    }
  };

  return (
    <div className="space-y-6 text-white pb-10" id="json-node-map-root">
      
      {/* Header and Brand Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
              DEV TOOLS
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
              SPATIAL INTERACTIVE
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Network className="w-8 h-8 text-emerald-400" />
            Spatial JSON Node Map
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Map nested arrays, objects, and configurations visually onto a dynamic 2D canvas workspace. Easily drill down, expand subtrees, and search telemetry values.
          </p>
        </div>

        {/* Example Presets selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Load Preset:
          </span>
          {(['telemetry', 'orgHierarchy', 'simpleConfig'] as const).map((key) => (
            <button
              key={key}
              onClick={() => handleLoadPreset(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activePreset === key 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {key === 'telemetry' ? 'Gateway Metrics' : key === 'orgHierarchy' ? 'Org Hierarchy' : 'App Settings'}
            </button>
          ))}
        </div>
      </div>

      {/* Main split work layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="json-node-body">
        
        {/* LEFT COLUMN: JSON Input Terminal & Node Detail inspector */}
        <div className="xl:col-span-4 space-y-6 flex flex-col">
          
          {/* JSON Text Input Panel */}
          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                Raw JSON Payload
              </h3>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFormatInput}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors border border-white/5"
                  title="Validate format and auto-align"
                >
                  <RefreshCw className="w-3 h-3" /> Validate &amp; Align
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  parseJsonToNodes(e.target.value);
                }}
                placeholder="Paste your JSON payload here..."
                rows={12}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600 transition-all resize-y"
              />
              {error && (
                <div className="absolute bottom-2 left-2 right-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-[10px] text-red-300 font-mono flex items-start gap-1">
                  <span className="font-bold uppercase shrink-0">Error:</span>
                  <span className="leading-normal">{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Inspector Detail view of highlighted node */}
          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl flex-1 flex flex-col justify-between min-h-[220px]">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
                <Info className="w-4 h-4 text-indigo-400" />
                Node Properties Inspector
              </h3>

              {selectedNodeId && nodes[selectedNodeId] ? (
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-slate-500">Node Path ID:</span>
                    <p className="text-indigo-300 break-all select-all font-semibold mt-0.5">{nodes[selectedNodeId].id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500">Key Name:</span>
                      <p className="text-white font-semibold">{nodes[selectedNodeId].key}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Primitive Type:</span>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border mt-0.5 uppercase ${getTypeColorClasses(nodes[selectedNodeId].type).badge}`}>
                        {nodes[selectedNodeId].type}
                      </span>
                    </div>
                  </div>

                  {nodes[selectedNodeId].value !== undefined && (
                    <div className="bg-black/50 p-3 rounded-xl border border-white/5 mt-2">
                      <span className="text-slate-500 block mb-1">Stored Value:</span>
                      <pre className="text-emerald-400 font-semibold whitespace-pre-wrap select-all max-h-[80px] overflow-y-auto">
                        {String(nodes[selectedNodeId].value)}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleCopySubBranch(nodes[selectedNodeId!])}
                      className="flex-1 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 rounded-xl font-semibold flex items-center justify-center gap-1.5 text-[11px] transition-all"
                    >
                      {copiedType === 'branch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Sub-JSON Slice
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs py-8 text-center space-y-1">
                  <Braces className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>Click any node key in the map to inspect its data properties and copy branches instantly</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-[11px] text-slate-300 mt-4">
              <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Use standard mouse controls to drag the workspace canvas. Scroll or click controllers on the top-right of the map to Zoom.
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Zoomable Visual Canvas */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          
          {/* Canvas Sub-header Toolbelt */}
          <div className="bg-slate-900/80 border border-white/10 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Search filter nodes */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search key, value or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
              />
            </div>

            {/* Global Tree Expand Controllers */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAllCollapseState(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors text-slate-300"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" /> Expand All
              </button>
              <button
                onClick={() => setAllCollapseState(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors text-slate-300"
              >
                <EyeOff className="w-3.5 h-3.5 text-rose-400" /> Collapse All
              </button>
            </div>

            {/* Pan & Zoom Utilities */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setScale(prev => Math.max(0.4, prev - 0.1))}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetView}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white text-xs font-bold"
                title="Reset View Bounds"
              >
                <Focus className="w-3.5 h-3.5" />
              </button>
              <div className="border-l border-white/10 h-4 mx-1" />
              <button
                onClick={handleExportPNG}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-[10px] font-bold flex items-center gap-1 text-white shadow-lg shadow-indigo-600/10"
                title="Download current node layout state as high-definition PNG image"
              >
                <Download className="w-3 h-3" /> Snapshot PNG
              </button>
            </div>
          </div>

          {/* Visual Workspace Canvas */}
          <div
            ref={viewportRef}
            className={`relative bg-[#090d16] border border-white/10 rounded-2xl min-h-[580px] overflow-hidden select-none select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheelZoom}
            id="nodes-viewport-canvas"
          >
            {/* Ambient visual background Grid */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none" 
              style={{
                backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Dynamic visual transform node container */}
            <div
              id="nodes-visual-render"
              className="absolute origin-top-left transition-all duration-75"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                width: '3000px',
                height: '3000px'
              }}
            >
              
              {/* Dynamic Connecting Bezier SVG Link layer */}
              <svg className="absolute inset-0 pointer-events-none w-full h-full">
                <g>
                  {Object.entries(computedNodes).map(([id, node]) => {
                    if (node.collapsed || node.childrenIds.length === 0) return null;
                    
                    return node.childrenIds.map(childId => {
                      const child = computedNodes[childId];
                      if (!child) return null;

                      // Start coordinate coordinates
                      const startX = node.x + node.width;
                      const startY = node.y + node.height / 2;
                      // Target coordinates
                      const endX = child.x;
                      const endY = child.y + child.height / 2;

                      // Create beautiful cubic bezier paths
                      const cp1x = startX + 60;
                      const cp2x = endX - 60;
                      
                      const isHighlightedPath = highlightedNodes.has(child.id) || highlightedNodes.has(node.id);

                      return (
                        <path
                          key={`${node.id}-${child.id}`}
                          d={`M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`}
                          fill="none"
                          stroke={isHighlightedPath ? '#fbbf24' : '#1e293b'}
                          strokeWidth={isHighlightedPath ? 2.5 : 1.5}
                          strokeDasharray={isHighlightedPath ? 'none' : 'none'}
                          opacity={isHighlightedPath ? 0.9 : 0.6}
                          className="transition-all duration-300"
                        />
                      );
                    });
                  })}
                </g>
              </svg>

              {/* Dynamic Interactive Node cards */}
              {Object.entries(computedNodes).map(([id, node]) => {
                const colors = getTypeColorClasses(node.type);
                const isSelected = selectedNodeId === node.id;
                const isMatch = highlightedNodes.has(node.id);
                
                return (
                  <div
                    key={node.id}
                    className="absolute transition-all duration-300"
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: `${node.width}px`,
                      height: `${node.height}px`
                    }}
                  >
                    <div
                      onClick={() => handleFocusNode(node)}
                      className={`interactive-node-card select-none group w-full h-full bg-[#0d1527]/95 border-2 rounded-xl p-2 flex flex-col justify-between transition-all duration-200 hover:scale-[1.03] cursor-pointer hover:shadow-lg ${
                        colors.border
                      } ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-400' : ''} ${
                        isMatch ? 'ring-2 ring-amber-500 border-amber-400 shadow-lg shadow-amber-500/10' : ''
                      }`}
                    >
                      {/* Top key row */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-white truncate max-w-[110px]" title={node.key}>
                          {node.key}
                        </span>
                        
                        {/* Type badge or index details */}
                        <span className={`px-1 rounded text-[8px] font-extrabold uppercase border tracking-wider scale-95 shrink-0 ${colors.badge}`}>
                          {node.type}
                        </span>
                      </div>

                      {/* Bottom value row / toggle arrow */}
                      <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-1 mt-1">
                        
                        {/* Print representation of primitive values */}
                        <div className={`text-[10px] truncate max-w-[130px] font-mono leading-none ${colors.text}`}>
                          {node.type === 'object' && ` { ${node.childrenIds.length} properties }`}
                          {node.type === 'array' && ` [ ${node.childrenIds.length} items ]`}
                          {node.type === 'string' && `"${String(node.value)}"`}
                          {node.type === 'number' && String(node.value)}
                          {node.type === 'boolean' && String(node.value)}
                          {node.type === 'null' && 'null'}
                        </div>

                        {/* Expand/Collapse dynamic trigger button */}
                        {node.childrenIds.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleNodeCollapse(node.id);
                            }}
                            className="p-0.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
                          >
                            {node.collapsed ? (
                              <ChevronRight className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Grid, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  RotateCcw, 
  Layout, 
  Sparkles, 
  Palette, 
  Sliders, 
  Code, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUp, 
  ArrowDown, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Maximize2, 
  Minimize2,
  Info,
  ExternalLink,
  Star,
  CheckCircle2,
  User,
  Activity,
  Heart,
  TrendingUp,
  Briefcase,
  Terminal,
  Layers,
  Zap,
  Globe,
  Settings2,
  Download
} from 'lucide-react';

// Define Interface for Bento Grid Block
interface BentoBlock {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  colSpan: number; // 1 to 4
  rowSpan: number; // 1 to 4
  bgType: 'solid' | 'gradient' | 'glass';
  bgValue: string; // Hex code or gradient classes or custom styles
  textColor: string; // 'dark' or 'light'
  accentColor?: string;
  hoverEffect: 'lift' | 'scale' | 'glow' | 'border' | 'none';
  customContent?: string;
}

// Icon dictionary for selection
const ICON_OPTIONS = {
  Sparkles: Sparkles,
  Zap: Zap,
  Layers: Layers,
  Terminal: Terminal,
  Briefcase: Briefcase,
  TrendingUp: TrendingUp,
  Globe: Globe,
  Heart: Heart,
  Activity: Activity,
  User: User,
  Grid: Grid,
  Palette: Palette,
};

// Preset gradient lists
const GRADIENTS = [
  'from-pink-500 via-red-500 to-yellow-500',
  'from-purple-600 to-blue-500',
  'from-green-400 to-blue-500',
  'from-yellow-200 via-pink-200 to-pink-400',
  'from-indigo-500 via-purple-500 to-pink-500',
  'from-blue-600 to-violet-600',
  'from-emerald-500 to-teal-700',
  'from-rose-400 to-orange-300',
  'from-slate-900 via-purple-900 to-slate-900',
  'from-gray-900 to-gray-800',
];

const SOLIDS = [
  'bg-slate-800',
  'bg-indigo-950',
  'bg-emerald-950',
  'bg-rose-950',
  'bg-amber-950',
  'bg-zinc-900',
  'bg-blue-600',
  'bg-purple-600',
  'bg-rose-500',
  'bg-emerald-500',
];

// Preset Templates
const TEMPLATE_PORTFOLIO: BentoBlock[] = [
  {
    id: 'block-1',
    title: 'Hi, I am Alex 👋',
    subtitle: 'Full-stack software crafter designing elegant interfaces & powerful cloud services.',
    iconName: 'User',
    colSpan: 2,
    rowSpan: 2,
    bgType: 'gradient',
    bgValue: 'from-blue-600 to-violet-600',
    textColor: 'light',
    hoverEffect: 'lift',
    badge: 'Available for hire',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
  },
  {
    id: 'block-2',
    title: 'Main Tech Stack',
    subtitle: 'React, Node.js, TS, Tailwind, Cloud Run, Postgres & Python.',
    iconName: 'Terminal',
    colSpan: 1,
    rowSpan: 2,
    bgType: 'solid',
    bgValue: 'bg-slate-900 border border-slate-800',
    textColor: 'light',
    hoverEffect: 'glow',
    accentColor: '#6366f1'
  },
  {
    id: 'block-3',
    title: 'Global Delivery',
    subtitle: 'Optimized serverless edge microservices.',
    iconName: 'Globe',
    colSpan: 1,
    rowSpan: 1,
    bgType: 'glass',
    bgValue: 'bg-white/5 backdrop-blur-md border border-white/10',
    textColor: 'light',
    hoverEffect: 'scale',
    badge: '100% Green'
  },
  {
    id: 'block-4',
    title: 'Featured Project',
    subtitle: 'BentoGrid Composer - dynamic design studio.',
    iconName: 'Grid',
    colSpan: 2,
    rowSpan: 1,
    bgType: 'gradient',
    bgValue: 'from-indigo-500 via-purple-500 to-pink-500',
    textColor: 'light',
    hoverEffect: 'lift',
    badge: 'Live Demo'
  },
  {
    id: 'block-5',
    title: 'Recent Stats',
    subtitle: '250+ Github contributions this month. Active developer.',
    iconName: 'Activity',
    colSpan: 1,
    rowSpan: 1,
    bgType: 'solid',
    bgValue: 'bg-zinc-900 border border-zinc-800',
    textColor: 'light',
    hoverEffect: 'glow'
  },
  {
    id: 'block-6',
    title: 'Productivity & Focus',
    subtitle: 'Constantly shipping features with maximum layout craft.',
    iconName: 'Sparkles',
    colSpan: 1,
    rowSpan: 1,
    bgType: 'gradient',
    bgValue: 'from-amber-500 to-rose-500',
    textColor: 'light',
    hoverEffect: 'lift'
  }
];

const TEMPLATE_SAAS: BentoBlock[] = [
  {
    id: 'saas-1',
    title: 'Supercharge Analytics',
    subtitle: 'Track your growth with real-time AI analytics dashboards that sync directly with your data lake.',
    iconName: 'Activity',
    colSpan: 2,
    rowSpan: 2,
    bgType: 'gradient',
    bgValue: 'from-slate-900 via-purple-900 to-slate-900',
    textColor: 'light',
    hoverEffect: 'glow',
    badge: 'v2.0 Out Now',
    badgeBg: 'bg-purple-500/20 text-purple-300'
  },
  {
    id: 'saas-2',
    title: 'Blazing Fast Integration',
    subtitle: 'A single line of JS is all you need to plug into our high-speed global telemetry network.',
    iconName: 'Zap',
    colSpan: 1,
    rowSpan: 1,
    bgType: 'gradient',
    bgValue: 'from-amber-400 to-orange-500',
    textColor: 'light',
    hoverEffect: 'lift'
  },
  {
    id: 'saas-3',
    title: 'Developer Friendly API',
    subtitle: 'Fully-typed SDKs for React, Svelte, Vue, Go, and Python. Crafted for optimal DX.',
    iconName: 'Terminal',
    colSpan: 1,
    rowSpan: 2,
    bgType: 'solid',
    bgValue: 'bg-zinc-950 border border-zinc-800',
    textColor: 'light',
    hoverEffect: 'glow'
  },
  {
    id: 'saas-4',
    title: 'Secure by Default',
    subtitle: 'End-to-end AES-256 GCM encryption, SOC-2 Type II compliant security standard.',
    iconName: 'Layers',
    colSpan: 2,
    rowSpan: 1,
    bgType: 'glass',
    bgValue: 'bg-white/5 backdrop-blur-md border border-white/10',
    textColor: 'light',
    hoverEffect: 'scale',
    badge: 'Enterprise Certified'
  },
  {
    id: 'saas-5',
    title: 'Global Edge Cache',
    subtitle: 'Ultra-low latency across 85 edge centers.',
    iconName: 'Globe',
    colSpan: 1,
    rowSpan: 1,
    bgType: 'gradient',
    bgValue: 'from-emerald-500 to-teal-700',
    textColor: 'light',
    hoverEffect: 'lift'
  }
];

const TEMPLATE_GALLERY: BentoBlock[] = [
  {
    id: 'gal-1',
    title: 'Creative Moodboard',
    subtitle: 'A compilation of aesthetic visual layouts, typography systems, and modern gradients.',
    iconName: 'Palette',
    colSpan: 2,
    rowSpan: 1,
    bgType: 'gradient',
    bgValue: 'from-pink-500 via-red-500 to-yellow-500',
    textColor: 'light',
    hoverEffect: 'lift'
  },
  {
    id: 'gal-2',
    title: 'UI Design Systems',
    subtitle: 'Figma prototypes and component patterns.',
    iconName: 'Layers',
    colSpan: 1,
    rowSpan: 2,
    bgType: 'solid',
    bgValue: 'bg-violet-950',
    textColor: 'light',
    hoverEffect: 'scale'
  },
  {
    id: 'gal-3',
    title: 'Innovative Branding',
    subtitle: 'Crafting unique corporate aesthetics.',
    iconName: 'Sparkles',
    colSpan: 1,
    rowSpan: 1,
    bgType: 'gradient',
    bgValue: 'from-rose-400 to-orange-300',
    textColor: 'light',
    hoverEffect: 'glow'
  },
  {
    id: 'gal-4',
    title: 'Glassmorphism Style',
    subtitle: 'Pure CSS background filter blur styles.',
    iconName: 'Grid',
    colSpan: 2,
    rowSpan: 1,
    bgType: 'glass',
    bgValue: 'bg-white/10 backdrop-blur-lg border border-white/20',
    textColor: 'light',
    hoverEffect: 'lift',
    badge: 'Experimental'
  }
];

export default function BentoGridComposer() {
  // States
  const [blocks, setBlocks] = useState<BentoBlock[]>(TEMPLATE_PORTFOLIO);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>('block-1');
  const [activePreset, setActivePreset] = useState<'portfolio' | 'saas' | 'gallery' | 'custom'>('portfolio');
  
  // Grid config states
  const [gridColumns, setGridColumns] = useState<number>(3); // 1 to 6
  const [gridGap, setGridGap] = useState<string>('gap-4'); // gap-2, gap-4, gap-6, gap-8
  const [borderRadius, setBorderRadius] = useState<string>('rounded-2xl'); // rounded-md, rounded-xl, rounded-2xl, rounded-3xl
  const [outerPadding, setOuterPadding] = useState<string>('p-6'); // p-4, p-6, p-8
  const [innerPadding, setInnerPadding] = useState<string>('p-6'); // p-4, p-6, p-8
  const [canvasBg, setCanvasBg] = useState<'dark' | 'light' | 'grid'>('dark');

  // Preview Mode
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [viewMode, setViewMode] = useState<'editor' | 'code'>('editor');
  const [codeType, setCodeType] = useState<'react-tailwind' | 'html-tailwind' | 'pure-css'>('react-tailwind');
  const [copied, setCopied] = useState(false);

  // Get active selected block details
  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  // Handle Preset updates
  const loadPreset = (preset: 'portfolio' | 'saas' | 'gallery') => {
    setActivePreset(preset);
    if (preset === 'portfolio') {
      setBlocks(TEMPLATE_PORTFOLIO);
      setGridColumns(3);
      setGridGap('gap-4');
      setSelectedBlockId('block-1');
    } else if (preset === 'saas') {
      setBlocks(TEMPLATE_SAAS);
      setGridColumns(3);
      setGridGap('gap-4');
      setSelectedBlockId('saas-1');
    } else if (preset === 'gallery') {
      setBlocks(TEMPLATE_GALLERY);
      setGridColumns(3);
      setGridGap('gap-4');
      setSelectedBlockId('gal-1');
    }
  };

  // Add new block
  const handleAddBlock = () => {
    const randomGradients = GRADIENTS;
    const randGradient = randomGradients[Math.floor(Math.random() * randomGradients.length)];
    const newBlock: BentoBlock = {
      id: `block-${Date.now()}`,
      title: 'New Bento Grid Block',
      subtitle: 'Add a detailed description about your feature, product stat, or layout highlight.',
      iconName: 'Sparkles',
      colSpan: 1,
      rowSpan: 1,
      bgType: 'gradient',
      bgValue: randGradient,
      textColor: 'light',
      hoverEffect: 'lift',
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setActivePreset('custom');
  };

  // Delete block
  const handleDeleteBlock = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = blocks.filter(b => b.id !== id);
    setBlocks(updated);
    if (selectedBlockId === id) {
      setSelectedBlockId(updated.length > 0 ? updated[0].id : null);
    }
    setActivePreset('custom');
  };

  // Update specific block property
  const updateBlock = (id: string, updates: Partial<BentoBlock>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
    setActivePreset('custom');
  };

  // Move block index in array to reorder
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setBlocks(updated);
    setActivePreset('custom');
  };

  // Render the selected icon helper
  const renderIcon = (name: string, className = "w-6 h-6") => {
    const IconComp = ICON_OPTIONS[name as keyof typeof ICON_OPTIONS] || Sparkles;
    return <IconComp className={className} />;
  };

  // Copy code to clipboard helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate CSS Grid code
  const generatePureCSS = () => {
    const blockStyles = blocks.map((block, idx) => {
      let bgStyle = '';
      if (block.bgType === 'solid') {
        bgStyle = `background-color: ${block.bgValue.includes('bg-slate') ? '#0f172a' : block.bgValue.includes('bg-indigo') ? '#1e1b4b' : '#18181b'};`;
      } else if (block.bgType === 'gradient') {
        bgStyle = `background: linear-gradient(135deg, #4f46e5, #ec4899); /* Approximate gradient */`;
      } else {
        bgStyle = `background: rgba(255, 255, 255, 0.05);\n  backdrop-filter: blur(12px);\n  border: 1px solid rgba(255, 255, 255, 0.1);`;
      }
      return `.bento-item-${idx + 1} {
  grid-column: span ${block.colSpan};
  grid-row: span ${block.rowSpan};
  ${bgStyle}
  color: ${block.textColor === 'light' ? '#ffffff' : '#0f172a'};
  padding: 24px;
  border-radius: 16px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.bento-item-${idx + 1}:hover {
  ${block.hoverEffect === 'lift' ? 'transform: translateY(-5px);' : block.hoverEffect === 'scale' ? 'transform: scale(1.02);' : block.hoverEffect === 'glow' ? 'box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);' : ''}
}`;
    }).join('\n\n');

    return `/* Bento Grid CSS Stylesheet */
.bento-grid-container {
  display: grid;
  grid-template-columns: repeat(${gridColumns}, minmax(0, 1fr));
  gap: 16px;
  padding: 24px;
  background-color: #09090b;
}

@media (max-width: 1024px) {
  .bento-grid-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .bento-grid-container {
    grid-template-columns: 1fr;
  }
}

${blockStyles}`;
  };

  // Generate Responsive React Code
  const generateReactCode = () => {
    const blockMapping = blocks.map((block) => {
      let bgClass = '';
      if (block.bgType === 'solid') bgClass = block.bgValue;
      else if (block.bgType === 'gradient') bgClass = `bg-gradient-to-br ${block.bgValue}`;
      else bgClass = `bg-white/5 backdrop-blur-md border border-white/10`;

      let hoverClass = '';
      if (block.hoverEffect === 'lift') hoverClass = 'hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300';
      else if (block.hoverEffect === 'scale') hoverClass = 'hover:scale-[1.02] transition-transform duration-300';
      else if (block.hoverEffect === 'glow') hoverClass = 'hover:shadow-[0_0_25px_rgba(99,102,241,0.2)] hover:border-indigo-500/30 transition-all duration-300';
      else if (block.hoverEffect === 'border') hoverClass = 'hover:border-white/30 border border-transparent transition-colors duration-300';

      const colSpanClass = {
        1: 'lg:col-span-1',
        2: 'lg:col-span-2',
        3: 'lg:col-span-3',
        4: 'lg:col-span-4',
      }[block.colSpan] || 'lg:col-span-1';

      const rowSpanClass = {
        1: 'row-span-1',
        2: 'row-span-2',
        3: 'row-span-3',
        4: 'row-span-4',
      }[block.rowSpan] || 'row-span-1';

      return `      {/* Card: ${block.title} */}
      <div className="${colSpanClass} ${rowSpanClass} col-span-1 ${bgClass} ${borderRadius} ${innerPadding} flex flex-col justify-between ${hoverClass} relative overflow-hidden group">
        {/* Background glow effects or decorative patterns */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500" />
        
        <div>
          {/* Top Row with Badge and Icon */}
          <div className="flex items-center justify-between mb-6">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm text-white">
              <${block.iconName} className="w-5 h-5" />
            </div>
            ${block.badge ? `<span className="px-3 py-1 text-xs font-medium rounded-full ${block.badgeBg || 'bg-white/10 text-white/90 border border-white/10'}">${block.badge}</span>` : ''}
          </div>

          {/* Heading */}
          <h3 className="text-xl font-semibold tracking-tight text-white mb-2 leading-snug">
            ${block.title}
          </h3>
          <p className="text-sm text-slate-300 font-normal leading-relaxed">
            ${block.subtitle}
          </p>
        </div>

        {/* Action Button or visual link footer */}
        <div className="mt-8 flex items-center text-xs font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors">
          <span>Learn more</span>
          <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>`;
    }).join('\n\n');

    return `import React from 'react';
import { 
  Sparkles, 
  Zap, 
  Layers, 
  Terminal, 
  Briefcase, 
  TrendingUp, 
  Globe, 
  Heart, 
  Activity, 
  User, 
  Grid, 
  Palette 
} from 'lucide-react';

export default function BentoGridSection() {
  return (
    <section className="py-20 px-4 md:px-8 bg-zinc-950 text-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
            Modular Layout
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3 text-white">
            Designed for Impact
          </h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto">
            A beautiful, fully fluid Bento Grid system optimized for modular storytelling.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${gridColumns} ${gridGap} ${outerPadding}">
${blockMapping}
        </div>
      </div>
    </section>
  );
}`;
  };

  // Generate Responsive Tailwind HTML Code
  const generateHTMLCode = () => {
    const blockMapping = blocks.map((block) => {
      let bgClass = '';
      if (block.bgType === 'solid') bgClass = block.bgValue;
      else if (block.bgType === 'gradient') bgClass = `bg-gradient-to-br ${block.bgValue}`;
      else bgClass = `bg-white/5 backdrop-blur-md border border-white/10`;

      let hoverClass = '';
      if (block.hoverEffect === 'lift') hoverClass = 'hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300';
      else if (block.hoverEffect === 'scale') hoverClass = 'hover:scale-[1.02] transition-transform duration-300';
      else if (block.hoverEffect === 'glow') hoverClass = 'hover:shadow-[0_0_25px_rgba(99,102,241,0.2)] hover:border-indigo-500/30 transition-all duration-300';
      else if (block.hoverEffect === 'border') hoverClass = 'hover:border-white/30 border border-transparent transition-colors duration-300';

      const colSpanClass = {
        1: 'lg:col-span-1',
        2: 'lg:col-span-2',
        3: 'lg:col-span-3',
        4: 'lg:col-span-4',
      }[block.colSpan] || 'lg:col-span-1';

      const rowSpanClass = {
        1: 'row-span-1',
        2: 'row-span-2',
        3: 'row-span-3',
        4: 'row-span-4',
      }[block.rowSpan] || 'row-span-1';

      return `    <!-- Bento Card -->
    <div class="${colSpanClass} ${rowSpanClass} col-span-1 ${bgClass} ${borderRadius} ${innerPadding} flex flex-col justify-between ${hoverClass} relative overflow-hidden group">
      <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
      <div>
        <div class="flex items-center justify-between mb-6">
          <div class="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm text-white">
            <!-- Icon -->
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          ${block.badge ? `<span class="px-3 py-1 text-xs font-medium rounded-full ${block.badgeBg || 'bg-white/10 text-white/90 border border-white/10'}">${block.badge}</span>` : ''}
        </div>
        <h3 class="text-xl font-semibold tracking-tight text-white mb-2 leading-snug">${block.title}</h3>
        <p class="text-sm text-slate-300 font-normal leading-relaxed">${block.subtitle}</p>
      </div>
      <div class="mt-8 flex items-center text-xs font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors">
        <span>Learn more</span>
        <svg class="w-4 h-4 ml-1 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>`;
    }).join('\n\n');

    return `<section class="py-20 px-4 md:px-8 bg-zinc-950 text-white">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <span class="text-xs font-semibold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">Layout Builder</span>
      <h2 class="text-3xl md:text-5xl font-bold tracking-tight mt-3 text-white">Modular Showcase</h2>
    </div>

    <!-- Bento Grid Container -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${gridColumns} ${gridGap} ${outerPadding}">
${blockMapping}
    </div>
  </div>
</section>`;
  };

  // Active Code output based on selected tab
  const getActiveCode = () => {
    if (codeType === 'react-tailwind') return generateReactCode();
    if (codeType === 'html-tailwind') return generateHTMLCode();
    return generatePureCSS();
  };

  return (
    <div className="space-y-6 text-white pb-10" id="bento-grid-root">
      {/* Header section with brand tags */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6" id="bento-header">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
              VIRAL & TRENDY
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
              PREMIUM
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Layout className="w-8 h-8 text-indigo-400" />
            Bento Grid Composer
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Build and optimize ultra-modern showcase grids with responsive spans, custom backdrops, shadows, and instant code export.
          </p>
        </div>

        {/* Presets and template selection */}
        <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => loadPreset('portfolio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activePreset === 'portfolio' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => loadPreset('saas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activePreset === 'saas' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            SaaS
          </button>
          <button
            onClick={() => loadPreset('gallery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activePreset === 'gallery' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            Gallery Preset
          </button>
        </div>
      </div>

      {/* Main content grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="bento-composer-grid">
        
        {/* LEFT COLUMN: Visual Live Sandbox Canvas */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Canvas header controls */}
          <div className="bg-slate-900/80 border border-white/10 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Canvas:</span>
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                <button
                  onClick={() => setCanvasBg('dark')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${canvasBg === 'dark' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Dark
                </button>
                <button
                  onClick={() => setCanvasBg('light')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${canvasBg === 'light' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Light
                </button>
                <button
                  onClick={() => setCanvasBg('grid')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${canvasBg === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Dot Grid
                </button>
              </div>
            </div>

            {/* Device preview toggles */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded transition-colors ${previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Desktop View"
              >
                <Laptop className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1.5 rounded transition-colors ${previewDevice === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Tablet View"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded transition-colors ${previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddBlock}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Block
              </button>
              <button
                onClick={() => {
                  setBlocks(TEMPLATE_PORTFOLIO);
                  setActivePreset('portfolio');
                  setGridColumns(3);
                }}
                className="p-1.5 hover:bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors"
                title="Reset Workspace"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive visual layout rendering window */}
          <div 
            className={`rounded-2xl border min-h-[500px] flex items-center justify-center transition-all overflow-auto ${
              canvasBg === 'dark' ? 'bg-zinc-950 border-white/10' : 
              canvasBg === 'light' ? 'bg-slate-100 border-slate-300 text-slate-900' : 
              'bg-zinc-950 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] border-white/10'
            } p-6`}
          >
            <div 
              className={`w-full mx-auto transition-all duration-300 ${
                previewDevice === 'mobile' ? 'max-w-[375px]' : 
                previewDevice === 'tablet' ? 'max-w-[768px]' : 'max-w-full'
              }`}
            >
              {/* Actual Grid render container */}
              <div 
                className={`grid ${
                  previewDevice === 'mobile' ? 'grid-cols-1' :
                  previewDevice === 'tablet' ? 'grid-cols-2' :
                  `grid-cols-${gridColumns}`
                } ${gridGap} ${outerPadding}`}
                style={{
                  gridTemplateColumns: previewDevice === 'mobile' ? '1fr' : 
                                       previewDevice === 'tablet' ? 'repeat(2, minmax(0, 1fr))' : 
                                       `repeat(${gridColumns}, minmax(0, 1fr))`
                }}
              >
                <AnimatePresence mode="popLayout">
                  {blocks.map((block, index) => {
                    const isSelected = block.id === selectedBlockId;
                    
                    // Col and row span styles
                    const colSpanClass = previewDevice === 'mobile' ? 'col-span-1' : {
                      1: 'lg:col-span-1',
                      2: 'lg:col-span-2',
                      3: 'lg:col-span-3',
                      4: 'lg:col-span-4',
                      5: 'lg:col-span-5',
                      6: 'lg:col-span-6',
                    }[block.colSpan] || 'lg:col-span-1';

                    const rowSpanClass = previewDevice === 'mobile' ? 'row-span-1' : {
                      1: 'row-span-1',
                      2: 'row-span-2',
                      3: 'row-span-3',
                      4: 'row-span-4',
                    }[block.rowSpan] || 'row-span-1';

                    let bgStyle = '';
                    let customBgClass = '';
                    if (block.bgType === 'solid') {
                      customBgClass = block.bgValue;
                    } else if (block.bgType === 'gradient') {
                      customBgClass = `bg-gradient-to-br ${block.bgValue}`;
                    } else if (block.bgType === 'glass') {
                      customBgClass = `bg-white/5 backdrop-blur-md border border-white/10`;
                    }

                    return (
                      <motion.div
                        key={block.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => setSelectedBlockId(block.id)}
                        className={`${colSpanClass} ${rowSpanClass} ${customBgClass} ${borderRadius} ${innerPadding} flex flex-col justify-between relative cursor-pointer group transition-all min-h-[160px] ${
                          isSelected 
                            ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-zinc-950 shadow-2xl shadow-indigo-500/20' 
                            : 'hover:shadow-lg border border-transparent'
                        }`}
                      >
                        {/* Interactive overlay edit helper bars */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1 rounded-lg backdrop-blur-md z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBlock(index, 'up');
                            }}
                            disabled={index === 0}
                            className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Left/Up"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBlock(index, 'down');
                            }}
                            disabled={index === blocks.length - 1}
                            className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Right/Down"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteBlock(block.id, e)}
                            className="p-1 hover:bg-rose-500/30 rounded text-slate-300 hover:text-rose-400"
                            title="Delete Block"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Card inner visual assets */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm text-white">
                              {renderIcon(block.iconName, "w-5 h-5")}
                            </div>
                            {block.badge && (
                              <span className={`px-2.5 py-0.5 text-[10px] font-semibold tracking-wide rounded-full uppercase ${block.badgeBg || 'bg-white/10 text-white/90 border border-white/10'}`}>
                                {block.badge}
                              </span>
                            )}
                          </div>
                          
                          <h4 className="text-lg font-bold tracking-tight text-white mb-1">
                            {block.title}
                          </h4>
                          <p className="text-xs text-slate-300 font-normal leading-relaxed">
                            {block.subtitle}
                          </p>
                        </div>

                        {/* Static bento look link indicators */}
                        <div className="mt-6 flex items-center text-[10px] font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors uppercase tracking-wider">
                          <span>Explore detail</span>
                          <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Quick Layout Sizers and Gaps Settings */}
          <div className="bg-slate-900/60 border border-white/10 p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Global Layout Properties
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Columns count */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 flex justify-between">
                  <span>Grid Columns (Large Screens)</span>
                  <span className="font-bold text-indigo-400">{gridColumns} Cols</span>
                </label>
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                  {[2, 3, 4, 5, 6].map((cols) => (
                    <button
                      key={cols}
                      onClick={() => setGridColumns(cols)}
                      className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${gridColumns === cols ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      {cols}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid gaps selection */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 flex justify-between">
                  <span>Card Gap Spacing</span>
                  <span className="font-bold text-indigo-400">{gridGap}</span>
                </label>
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                  {['gap-2', 'gap-4', 'gap-6', 'gap-8'].map((gap) => (
                    <button
                      key={gap}
                      onClick={() => setGridGap(gap)}
                      className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${gridGap === gap ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      {gap.replace('gap-', '')}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Corner Rounding selection */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 flex justify-between">
                  <span>Corner Rounding</span>
                  <span className="font-bold text-indigo-400">{borderRadius}</span>
                </label>
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                  {['rounded-md', 'rounded-xl', 'rounded-2xl', 'rounded-3xl'].map((radius) => (
                    <button
                      key={radius}
                      onClick={() => setBorderRadius(radius)}
                      className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${borderRadius === radius ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      {radius.replace('rounded-', '')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Card Customizer Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Customizer Panel */}
          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-400" />
                Block Editor
              </h3>
              {selectedBlock && (
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-300 rounded-full uppercase tracking-wider">
                  Active Customizer
                </span>
              )}
            </div>

            {selectedBlock ? (
              <div className="space-y-4">
                
                {/* Text Content Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Block Title</label>
                    <input
                      type="text"
                      value={selectedBlock.title}
                      onChange={(e) => updateBlock(selectedBlock.id, { title: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Title text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Subtitle / Description</label>
                    <textarea
                      value={selectedBlock.subtitle}
                      onChange={(e) => updateBlock(selectedBlock.id, { subtitle: e.target.value })}
                      rows={2}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                      placeholder="Short explanatory block text"
                    />
                  </div>
                </div>

                {/* Grid Spans Customizers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Column Span</label>
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                      {[1, 2, 3, 4].map((span) => (
                        <button
                          key={span}
                          onClick={() => updateBlock(selectedBlock.id, { colSpan: span })}
                          className={`flex-1 py-1 rounded text-xs font-bold transition-colors ${selectedBlock.colSpan === span ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                        >
                          {span}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Row Span</label>
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                      {[1, 2, 3, 4].map((span) => (
                        <button
                          key={span}
                          onClick={() => updateBlock(selectedBlock.id, { rowSpan: span })}
                          className={`flex-1 py-1 rounded text-xs font-bold transition-colors ${selectedBlock.rowSpan === span ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                        >
                          {span}y
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Badge settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Pill Badge Tag</label>
                    <input
                      type="text"
                      value={selectedBlock.badge || ''}
                      onChange={(e) => updateBlock(selectedBlock.id, { badge: e.target.value || undefined })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. New"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Icon Preset</label>
                    <select
                      value={selectedBlock.iconName}
                      onChange={(e) => updateBlock(selectedBlock.id, { iconName: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {Object.keys(ICON_OPTIONS).map((opt) => (
                        <option key={opt} value={opt} className="bg-slate-900 text-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Card Background Customization */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-400">Card Background & Style</label>
                  
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => updateBlock(selectedBlock.id, { bgType: 'solid', bgValue: SOLIDS[0] })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedBlock.bgType === 'solid' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Solid
                    </button>
                    <button
                      onClick={() => updateBlock(selectedBlock.id, { bgType: 'gradient', bgValue: GRADIENTS[0] })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedBlock.bgType === 'gradient' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Gradient
                    </button>
                    <button
                      onClick={() => updateBlock(selectedBlock.id, { bgType: 'glass', bgValue: 'bg-white/5 backdrop-blur-md' })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedBlock.bgType === 'glass' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Glassmorphism
                    </button>
                  </div>

                  {/* Render list of color options depending on bgType */}
                  {selectedBlock.bgType === 'gradient' && (
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {GRADIENTS.map((grad) => (
                        <button
                          key={grad}
                          onClick={() => updateBlock(selectedBlock.id, { bgValue: grad })}
                          className={`h-7 rounded-lg bg-gradient-to-br ${grad} border transition-transform ${selectedBlock.bgValue === grad ? 'scale-110 border-white ring-1 ring-indigo-500' : 'border-transparent hover:scale-105'}`}
                        />
                      ))}
                    </div>
                  )}

                  {selectedBlock.bgType === 'solid' && (
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {SOLIDS.map((solid) => (
                        <button
                          key={solid}
                          onClick={() => updateBlock(selectedBlock.id, { bgValue: solid })}
                          className={`h-7 rounded-lg ${solid} border transition-transform ${selectedBlock.bgValue === solid ? 'scale-110 border-white ring-1 ring-indigo-500' : 'border-transparent hover:scale-105'}`}
                        />
                      ))}
                    </div>
                  )}

                  {selectedBlock.bgType === 'glass' && (
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-[11px] text-slate-300">
                      Uses backdrop blur-md, transparent white border highlights, and semi-transparent dark vectors for premium high-contrast layouts.
                    </div>
                  )}
                </div>

                {/* Card Hover effects select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Hover Interaction Animation</label>
                  <select
                    value={selectedBlock.hoverEffect}
                    onChange={(e) => updateBlock(selectedBlock.id, { hoverEffect: e.target.value as any })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="lift" className="bg-slate-900 text-white">Translate Lift & Shadow Drop</option>
                    <option value="scale" className="bg-slate-900 text-white">Delicate Micro-Scaling</option>
                    <option value="glow" className="bg-slate-900 text-white">Aesthetic Indigo Glow Highlight</option>
                    <option value="border" className="bg-slate-900 text-white">Border Light Transition</option>
                    <option value="none" className="bg-slate-900 text-white">No Animation</option>
                  </select>
                </div>

                {/* Block management list buttons */}
                <div className="pt-2">
                  <button
                    onClick={() => handleDeleteBlock(selectedBlock.id)}
                    className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Block Entirely
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Info className="w-8 h-8 mx-auto mb-2 text-indigo-400 opacity-60" />
                <p className="text-xs">Click any block inside the live visual editor to start customizing its content, layouts, or gradient colors.</p>
              </div>
            )}
          </div>

          {/* Code Exporter panel */}
          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Code className="w-4.5 h-4.5 text-indigo-400" />
                Code Exporter
              </h3>
              <button
                onClick={() => handleCopyCode(getActiveCode())}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Code type tabs */}
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setCodeType('react-tailwind')}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  codeType === 'react-tailwind' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                React + Tailwind
              </button>
              <button
                onClick={() => setCodeType('html-tailwind')}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  codeType === 'html-tailwind' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                HTML + Tailwind
              </button>
              <button
                onClick={() => setCodeType('pure-css')}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  codeType === 'pure-css' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                CSS Grid
              </button>
            </div>

            {/* Code display window */}
            <div className="relative">
              <pre className="bg-black/80 rounded-xl p-3 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-[220px] border border-white/5">
                <code>{getActiveCode()}</code>
              </pre>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

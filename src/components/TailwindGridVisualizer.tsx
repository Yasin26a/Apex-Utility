import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Sliders, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Laptop, 
  Tablet, 
  Smartphone, 
  Monitor, 
  BookOpen, 
  Code, 
  Info, 
  ExternalLink, 
  Layout, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Settings, 
  Maximize2 
} from 'lucide-react';

interface BreakpointConfig {
  cols: number;
  rows: number;
  gapX: string;
  gapY: string;
  justifyItems: string;
  alignItems: string;
  gridFlow: string;
}

interface ItemBreakpointConfig {
  colSpan: string; // '1' to '12', 'full', or 'auto'
  rowSpan: string; // '1' to '6', 'full', or 'auto'
  colStart: string; // '1' to '13', or 'auto'
  colEnd: string; // '1' to '13', or 'auto'
  rowStart: string; // '1' to '7', or 'auto'
  rowEnd: string; // '1' to '7', or 'auto'
}

interface GridItem {
  id: string;
  label: string;
  bgTheme: string; // 'slate', 'violet', 'emerald', 'amber', 'rose', 'indigo', 'transparent'
  contentPreset: 'number' | 'text' | 'stat' | 'button' | 'chart' | 'avatar';
  title: string;
  subtitle: string;
  // Base settings
  colSpan: string;
  rowSpan: string;
  colStart: string;
  colEnd: string;
  rowStart: string;
  rowEnd: string;
  justifySelf: string;
  alignSelf: string;
  // Breakpoint overrides
  sm?: Partial<ItemBreakpointConfig>;
  md?: Partial<ItemBreakpointConfig>;
  lg?: Partial<ItemBreakpointConfig>;
  xl?: Partial<ItemBreakpointConfig>;
}

export default function TailwindGridVisualizer() {
  // --- General State ---
  const [activeTab, setActiveTab] = useState<'visualizer' | 'cheatsheet'>('visualizer');
  const [previewDevice, setPreviewDevice] = useState<'all' | 'mobile' | 'tablet' | 'laptop' | 'desktop'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [codeLanguage, setCodeLanguage] = useState<'jsx' | 'html' | 'classes'>('jsx');
  const [searchDocQuery, setSearchDocQuery] = useState<string>('');

  // --- Grid Settings State ---
  // Base settings
  const [baseConfig, setBaseConfig] = useState<BreakpointConfig>({
    cols: 4,
    rows: 3,
    gapX: 'gap-x-4',
    gapY: 'gap-y-4',
    justifyItems: 'justify-items-stretch',
    alignItems: 'align-items-stretch',
    gridFlow: 'grid-flow-row'
  });

  // Breakpoints toggles & configs
  const [enabledBreakpoints, setEnabledBreakpoints] = useState<{ [key: string]: boolean }>({
    sm: false,
    md: true,
    lg: true,
    xl: false
  });

  const [smConfig, setSmConfig] = useState<BreakpointConfig>({
    cols: 4,
    rows: 3,
    gapX: 'gap-x-4',
    gapY: 'gap-y-4',
    justifyItems: 'justify-items-stretch',
    alignItems: 'align-items-stretch',
    gridFlow: 'grid-flow-row'
  });

  const [mdConfig, setMdConfig] = useState<BreakpointConfig>({
    cols: 6,
    rows: 3,
    gapX: 'gap-x-4',
    gapY: 'gap-y-4',
    justifyItems: 'justify-items-stretch',
    alignItems: 'align-items-stretch',
    gridFlow: 'grid-flow-row'
  });

  const [lgConfig, setLgConfig] = useState<BreakpointConfig>({
    cols: 12,
    rows: 3,
    gapX: 'gap-x-6',
    gapY: 'gap-y-6',
    justifyItems: 'justify-items-stretch',
    alignItems: 'align-items-stretch',
    gridFlow: 'grid-flow-row'
  });

  const [xlConfig, setXlConfig] = useState<BreakpointConfig>({
    cols: 12,
    rows: 4,
    gapX: 'gap-x-6',
    gapY: 'gap-y-6',
    justifyItems: 'justify-items-stretch',
    alignItems: 'align-items-stretch',
    gridFlow: 'grid-flow-row'
  });

  // Active configuring breakpoint (for editing global rules)
  const [activeConfigBreakpoint, setActiveConfigBreakpoint] = useState<'base' | 'sm' | 'md' | 'lg' | 'xl'>('base');

  // --- Grid Items State ---
  const [items, setItems] = useState<GridItem[]>([
    {
      id: 'item-1',
      label: 'Card 1',
      bgTheme: 'violet',
      contentPreset: 'stat',
      title: '74.2k',
      subtitle: 'Active Developer Sessions',
      colSpan: '12',
      rowSpan: '1',
      colStart: 'auto',
      colEnd: 'auto',
      rowStart: 'auto',
      rowEnd: 'auto',
      justifySelf: 'justify-self-auto',
      alignSelf: 'align-self-auto',
      md: { colSpan: '3' },
      lg: { colSpan: '4' }
    },
    {
      id: 'item-2',
      label: 'Card 2',
      bgTheme: 'amber',
      contentPreset: 'chart',
      title: 'Conversion Rate',
      subtitle: '98.5% Server Uptime',
      colSpan: '12',
      rowSpan: '1',
      colStart: 'auto',
      colEnd: 'auto',
      rowStart: 'auto',
      rowEnd: 'auto',
      justifySelf: 'justify-self-auto',
      alignSelf: 'align-self-auto',
      md: { colSpan: '3' },
      lg: { colSpan: '4' }
    },
    {
      id: 'item-3',
      label: 'Card 3',
      bgTheme: 'emerald',
      contentPreset: 'button',
      title: 'API Status',
      subtitle: '24ms Avg Latency',
      colSpan: '12',
      rowSpan: '1',
      colStart: 'auto',
      colEnd: 'auto',
      rowStart: 'auto',
      rowEnd: 'auto',
      justifySelf: 'justify-self-auto',
      alignSelf: 'align-self-auto',
      md: { colSpan: '6' },
      lg: { colSpan: '4' }
    },
    {
      id: 'item-4',
      label: 'Card 4',
      bgTheme: 'indigo',
      contentPreset: 'text',
      title: 'Core Engine Logs',
      subtitle: 'Streaming real-time metrics cleanly',
      colSpan: '12',
      rowSpan: '2',
      colStart: 'auto',
      colEnd: 'auto',
      rowStart: 'auto',
      rowEnd: 'auto',
      justifySelf: 'justify-self-auto',
      alignSelf: 'align-self-auto',
      md: { colSpan: '4' },
      lg: { colSpan: '8' }
    },
    {
      id: 'item-5',
      label: 'Card 5',
      bgTheme: 'slate',
      contentPreset: 'avatar',
      title: 'Active Engineers',
      subtitle: 'Multi-threaded team synced',
      colSpan: '12',
      rowSpan: '1',
      colStart: 'auto',
      colEnd: 'auto',
      rowStart: 'auto',
      rowEnd: 'auto',
      justifySelf: 'justify-self-auto',
      alignSelf: 'align-self-auto',
      md: { colSpan: '2' },
      lg: { colSpan: '4' }
    },
    {
      id: 'item-6',
      label: 'Card 6',
      bgTheme: 'rose',
      contentPreset: 'number',
      title: '06',
      subtitle: 'Pending Deployments',
      colSpan: '12',
      rowSpan: '1',
      colStart: 'auto',
      colEnd: 'auto',
      rowStart: 'auto',
      rowEnd: 'auto',
      justifySelf: 'justify-self-auto',
      alignSelf: 'align-self-auto',
      md: { colSpan: '12' },
      lg: { colSpan: '12' }
    }
  ]);

  // --- Presets Handler ---
  const applyPreset = (presetName: string) => {
    setSelectedItemId(null);
    switch (presetName) {
      case 'responsive-cards':
        setBaseConfig({
          cols: 1,
          rows: 4,
          gapX: 'gap-x-4',
          gapY: 'gap-y-4',
          justifyItems: 'justify-items-stretch',
          alignItems: 'align-items-stretch',
          gridFlow: 'grid-flow-row'
        });
        setEnabledBreakpoints({ sm: true, md: true, lg: true, xl: false });
        setSmConfig(prev => ({ ...prev, cols: 2 }));
        setMdConfig(prev => ({ ...prev, cols: 3 }));
        setLgConfig(prev => ({ ...prev, cols: 4 }));
        setItems([
          { id: 'item-1', label: 'Feature Alpha', bgTheme: 'violet', contentPreset: 'stat', title: '78%', subtitle: 'Core performance increase', colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto' },
          { id: 'item-2', label: 'Feature Beta', bgTheme: 'amber', contentPreset: 'button', title: 'Security Shield', subtitle: 'All ports protected', colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto' },
          { id: 'item-3', label: 'Feature Gamma', bgTheme: 'emerald', contentPreset: 'chart', title: 'Conversion Rate', subtitle: '+12.4% this quarter', colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto' },
          { id: 'item-4', label: 'Feature Delta', bgTheme: 'indigo', contentPreset: 'text', title: 'Analytics Core', subtitle: 'High speed tracking logs', colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto' },
        ]);
        break;

      case 'holy-grail':
        setBaseConfig({
          cols: 1,
          rows: 5,
          gapX: 'gap-x-4',
          gapY: 'gap-y-4',
          justifyItems: 'justify-items-stretch',
          alignItems: 'align-items-stretch',
          gridFlow: 'grid-flow-row'
        });
        setEnabledBreakpoints({ sm: false, md: true, lg: true, xl: false });
        setMdConfig(prev => ({ ...prev, cols: 4, rows: 3 }));
        setLgConfig(prev => ({ ...prev, cols: 4, rows: 3 }));
        setItems([
          { 
            id: 'item-1', label: 'Header', bgTheme: 'slate', contentPreset: 'text', title: '🖥️ Master Header Nav', subtitle: 'Always spanning across full viewport columns', 
            colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            md: { colSpan: '4' }, lg: { colSpan: '4' }
          },
          { 
            id: 'item-2', label: 'Sidebar Left', bgTheme: 'indigo', contentPreset: 'button', title: '📁 Explorer Menu', subtitle: 'Utility rails & components', 
            colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            md: { colSpan: '1' }, lg: { colSpan: '1' }
          },
          { 
            id: 'item-3', label: 'Main Content Body', bgTheme: 'violet', contentPreset: 'chart', title: '📊 Analytics Live Control Stage', subtitle: 'Fully flexible workspace layout block', 
            colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            md: { colSpan: '2' }, lg: { colSpan: '2' }
          },
          { 
            id: 'item-4', label: 'Sidebar Right', bgTheme: 'rose', contentPreset: 'stat', title: '🔔 Logs', subtitle: 'Critical system warnings', 
            colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            md: { colSpan: '1' }, lg: { colSpan: '1' }
          },
          { 
            id: 'item-5', label: 'Footer', bgTheme: 'slate', contentPreset: 'text', title: '🌐 System Status Footer', subtitle: 'Standardized operational copyright metadata lines', 
            colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            md: { colSpan: '4' }, lg: { colSpan: '4' }
          }
        ]);
        break;

      case 'bento-highlight':
        setBaseConfig({
          cols: 2,
          rows: 4,
          gapX: 'gap-x-4',
          gapY: 'gap-y-4',
          justifyItems: 'justify-items-stretch',
          alignItems: 'align-items-stretch',
          gridFlow: 'grid-flow-row'
        });
        setEnabledBreakpoints({ sm: false, md: true, lg: true, xl: false });
        setMdConfig(prev => ({ ...prev, cols: 3, rows: 2 }));
        setLgConfig(prev => ({ ...prev, cols: 4, rows: 2 }));
        setItems([
          { 
            id: 'item-1', label: 'Hero Block', bgTheme: 'violet', contentPreset: 'text', title: '🚀 Launching v2.4 Engine', subtitle: 'Our custom ultra-speed layout framework is live.', 
            colSpan: '2', rowSpan: '2', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            md: { colSpan: '2', rowSpan: '2' }, lg: { colSpan: '2', rowSpan: '2' }
          },
          { 
            id: 'item-2', label: 'Top Accent', bgTheme: 'emerald', contentPreset: 'stat', title: '+99.9%', subtitle: 'Accuracy metric standard', 
            colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            md: { colSpan: '1', rowSpan: '1' }, lg: { colSpan: '1', rowSpan: '1' }
          },
          { 
            id: 'item-3', label: 'Middle Accent', bgTheme: 'amber', contentPreset: 'button', title: 'Secure Key', subtitle: 'RSA-4096 Encrypted token', 
            colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            md: { colSpan: '1', rowSpan: '1' }, lg: { colSpan: '1', rowSpan: '1' }
          },
          { 
            id: 'item-4', label: 'Footer Highlight', bgTheme: 'indigo', contentPreset: 'chart', title: 'Resource Sync Rate', subtitle: 'Balanced memory pools', 
            colSpan: '2', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            md: { colSpan: '3', rowSpan: '1' }, lg: { colSpan: '2', rowSpan: '1' }
          }
        ]);
        break;

      case 'dashboard':
        setBaseConfig({
          cols: 1,
          rows: 4,
          gapX: 'gap-x-4',
          gapY: 'gap-y-4',
          justifyItems: 'justify-items-stretch',
          alignItems: 'align-items-stretch',
          gridFlow: 'grid-flow-row'
        });
        setEnabledBreakpoints({ sm: true, md: true, lg: true, xl: false });
        setSmConfig(prev => ({ ...prev, cols: 2 }));
        setMdConfig(prev => ({ ...prev, cols: 6 }));
        setLgConfig(prev => ({ ...prev, cols: 12 }));
        setItems([
          { 
            id: 'item-1', label: 'Stat 1', bgTheme: 'slate', contentPreset: 'stat', title: '$48,250', subtitle: 'Monthly recurring sales', 
            colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            sm: { colSpan: '1' }, md: { colSpan: '2' }, lg: { colSpan: '3' }
          },
          { 
            id: 'item-2', label: 'Stat 2', bgTheme: 'violet', contentPreset: 'stat', title: '92.4k', subtitle: 'Direct browser signups', 
            colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            sm: { colSpan: '1' }, md: { colSpan: '2' }, lg: { colSpan: '3' }
          },
          { 
            id: 'item-3', label: 'Stat 3', bgTheme: 'emerald', contentPreset: 'stat', title: '4.9/5★', subtitle: 'Customer review rating', 
            colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            sm: { colSpan: '1' }, md: { colSpan: '2' }, lg: { colSpan: '3' }
          },
          { 
            id: 'item-4', label: 'Stat 4', bgTheme: 'amber', contentPreset: 'stat', title: '24ms', subtitle: 'Average response threshold', 
            colSpan: '1', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            sm: { colSpan: '1' }, md: { colSpan: '6' }, lg: { colSpan: '3' }
          },
          { 
            id: 'item-5', label: 'Chart Main', bgTheme: 'indigo', contentPreset: 'chart', title: 'Operational Performance Trend', subtitle: 'Staggered metrics from 12 edge nodes worldwide', 
            colSpan: '1', rowSpan: '2', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            sm: { colSpan: '2' }, md: { colSpan: '4' }, lg: { colSpan: '8' }
          },
          { 
            id: 'item-6', label: 'Side Terminal', bgTheme: 'rose', contentPreset: 'text', title: '🚨 Real-time Exceptions', subtitle: 'No high-risk security errors discovered inside standard memory dumps.', 
            colSpan: '1', rowSpan: '2', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto',
            sm: { colSpan: '2' }, md: { colSpan: '2' }, lg: { colSpan: '4' }
          },
        ]);
        break;

      default:
        break;
    }
  };

  // --- Add/Delete Item Handlers ---
  const handleAddItem = () => {
    const newId = `item-${Date.now()}`;
    const newLabel = `Card ${items.length + 1}`;
    const colors: GridItem['bgTheme'][] = ['violet', 'emerald', 'amber', 'rose', 'indigo', 'slate'];
    const randomColor = colors[items.length % colors.length];
    
    const newItem: GridItem = {
      id: newId,
      label: newLabel,
      bgTheme: randomColor,
      contentPreset: 'text',
      title: 'Custom Grid Block',
      subtitle: 'Configured and placed inside coordinates',
      colSpan: '1',
      rowSpan: '1',
      colStart: 'auto',
      colEnd: 'auto',
      rowStart: 'auto',
      rowEnd: 'auto',
      justifySelf: 'justify-self-auto',
      alignSelf: 'align-self-auto',
    };

    setItems([...items, newItem]);
    setSelectedItemId(newId);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  // --- Update Single Item Config Handlers ---
  const updateSelectedItemField = (field: keyof GridItem, value: string) => {
    if (!selectedItemId) return;
    setItems(items.map(item => {
      if (item.id === selectedItemId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const updateSelectedItemBreakpointField = (
    breakpoint: 'sm' | 'md' | 'lg' | 'xl', 
    field: keyof ItemBreakpointConfig, 
    value: string
  ) => {
    if (!selectedItemId) return;
    setItems(items.map(item => {
      if (item.id === selectedItemId) {
        const bpObj = item[breakpoint] || {};
        return {
          ...item,
          [breakpoint]: {
            ...bpObj,
            [field]: value
          }
        };
      }
      return item;
    }));
  };

  const clearSelectedItemBreakpointOverride = (
    breakpoint: 'sm' | 'md' | 'lg' | 'xl',
    field: keyof ItemBreakpointConfig
  ) => {
    if (!selectedItemId) return;
    setItems(items.map(item => {
      if (item.id === selectedItemId) {
        const bpObj = { ...(item[breakpoint] || {}) };
        delete bpObj[field];
        return {
          ...item,
          [breakpoint]: Object.keys(bpObj).length > 0 ? bpObj : undefined
        };
      }
      return item;
    }));
  };

  // --- Reset Entire Playground ---
  const handleReset = () => {
    setBaseConfig({
      cols: 4,
      rows: 3,
      gapX: 'gap-x-4',
      gapY: 'gap-y-4',
      justifyItems: 'justify-items-stretch',
      alignItems: 'align-items-stretch',
      gridFlow: 'grid-flow-row'
    });
    setEnabledBreakpoints({
      sm: false,
      md: true,
      lg: true,
      xl: false
    });
    setSmConfig({
      cols: 4,
      rows: 3,
      gapX: 'gap-x-4',
      gapY: 'gap-y-4',
      justifyItems: 'justify-items-stretch',
      alignItems: 'align-items-stretch',
      gridFlow: 'grid-flow-row'
    });
    setMdConfig({
      cols: 6,
      rows: 3,
      gapX: 'gap-x-4',
      gapY: 'gap-y-4',
      justifyItems: 'justify-items-stretch',
      alignItems: 'align-items-stretch',
      gridFlow: 'grid-flow-row'
    });
    setLgConfig({
      cols: 12,
      rows: 3,
      gapX: 'gap-x-6',
      gapY: 'gap-y-6',
      justifyItems: 'justify-items-stretch',
      alignItems: 'align-items-stretch',
      gridFlow: 'grid-flow-row'
    });
    setItems([
      { id: 'item-1', label: 'Card 1', bgTheme: 'violet', contentPreset: 'stat', title: '74.2k', subtitle: 'Active Sessions', colSpan: '12', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto', md: { colSpan: '3' }, lg: { colSpan: '4' } },
      { id: 'item-2', label: 'Card 2', bgTheme: 'amber', contentPreset: 'chart', title: 'Performance Metrics', subtitle: '98.5% Uptime Rate', colSpan: '12', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto', md: { colSpan: '3' }, lg: { colSpan: '4' } },
      { id: 'item-3', label: 'Card 3', bgTheme: 'emerald', contentPreset: 'button', title: 'API Nodes', subtitle: 'Online globally', colSpan: '12', rowSpan: '1', colStart: 'auto', colEnd: 'auto', rowStart: 'auto', rowEnd: 'auto', justifySelf: 'justify-self-auto', alignSelf: 'align-self-auto', md: { colSpan: '6' }, lg: { colSpan: '4' } },
    ]);
    setSelectedItemId(null);
  };

  // --- Helper to Generate Classes based on state ---
  const buildContainerClasses = () => {
    let classes = ['grid'];

    // Base config classes
    classes.push(`grid-cols-${baseConfig.cols}`);
    if (baseConfig.rows > 1) classes.push(`grid-rows-${baseConfig.rows}`);
    classes.push(baseConfig.gapX);
    classes.push(baseConfig.gapY);
    if (baseConfig.justifyItems !== 'justify-items-stretch') classes.push(baseConfig.justifyItems);
    if (baseConfig.alignItems !== 'align-items-stretch') classes.push(baseConfig.alignItems);
    if (baseConfig.gridFlow !== 'grid-flow-row') classes.push(baseConfig.gridFlow);

    // sm overrides
    if (enabledBreakpoints.sm) {
      classes.push(`sm:grid-cols-${smConfig.cols}`);
      if (smConfig.rows > 1) classes.push(`sm:grid-rows-${smConfig.rows}`);
      classes.push(smConfig.gapX.replace('gap-x-', 'sm:gap-x-'));
      classes.push(smConfig.gapY.replace('gap-y-', 'sm:gap-y-'));
      if (smConfig.justifyItems !== 'justify-items-stretch') classes.push(smConfig.justifyItems.replace('justify-items-', 'sm:justify-items-'));
      if (smConfig.alignItems !== 'align-items-stretch') classes.push(smConfig.alignItems.replace('align-items-', 'sm:align-items-'));
      if (smConfig.gridFlow !== 'grid-flow-row') classes.push(smConfig.gridFlow.replace('grid-flow-', 'sm:grid-flow-'));
    }

    // md overrides
    if (enabledBreakpoints.md) {
      classes.push(`md:grid-cols-${mdConfig.cols}`);
      if (mdConfig.rows > 1) classes.push(`md:grid-rows-${mdConfig.rows}`);
      classes.push(mdConfig.gapX.replace('gap-x-', 'md:gap-x-'));
      classes.push(mdConfig.gapY.replace('gap-y-', 'md:gap-y-'));
      if (mdConfig.justifyItems !== 'justify-items-stretch') classes.push(mdConfig.justifyItems.replace('justify-items-', 'md:justify-items-'));
      if (mdConfig.alignItems !== 'align-items-stretch') classes.push(mdConfig.alignItems.replace('align-items-', 'md:align-items-'));
      if (mdConfig.gridFlow !== 'grid-flow-row') classes.push(mdConfig.gridFlow.replace('grid-flow-', 'md:grid-flow-'));
    }

    // lg overrides
    if (enabledBreakpoints.lg) {
      classes.push(`lg:grid-cols-${lgConfig.cols}`);
      if (lgConfig.rows > 1) classes.push(`lg:grid-rows-${lgConfig.rows}`);
      classes.push(lgConfig.gapX.replace('gap-x-', 'lg:gap-x-'));
      classes.push(lgConfig.gapY.replace('gap-y-', 'lg:gap-y-'));
      if (lgConfig.justifyItems !== 'justify-items-stretch') classes.push(lgConfig.justifyItems.replace('justify-items-', 'lg:justify-items-'));
      if (lgConfig.alignItems !== 'align-items-stretch') classes.push(lgConfig.alignItems.replace('align-items-', 'lg:align-items-'));
      if (lgConfig.gridFlow !== 'grid-flow-row') classes.push(lgConfig.gridFlow.replace('grid-flow-', 'lg:grid-flow-'));
    }

    // xl overrides
    if (enabledBreakpoints.xl) {
      classes.push(`xl:grid-cols-${xlConfig.cols}`);
      if (xlConfig.rows > 1) classes.push(`xl:grid-rows-${xlConfig.rows}`);
      classes.push(xlConfig.gapX.replace('gap-x-', 'xl:gap-x-'));
      classes.push(xlConfig.gapY.replace('gap-y-', 'xl:gap-y-'));
      if (xlConfig.justifyItems !== 'justify-items-stretch') classes.push(xlConfig.justifyItems.replace('justify-items-', 'xl:justify-items-'));
      if (xlConfig.alignItems !== 'align-items-stretch') classes.push(xlConfig.alignItems.replace('align-items-', 'xl:align-items-'));
      if (xlConfig.gridFlow !== 'grid-flow-row') classes.push(xlConfig.gridFlow.replace('grid-flow-', 'xl:grid-flow-'));
    }

    return classes.join(' ');
  };

  const buildItemClasses = (item: GridItem) => {
    let classes: string[] = [];

    // Col span base
    if (item.colSpan !== 'auto') {
      classes.push(item.colSpan === 'full' ? 'col-span-full' : `col-span-${item.colSpan}`);
    }
    // Row span base
    if (item.rowSpan !== 'auto') {
      classes.push(item.rowSpan === 'full' ? 'row-span-full' : `row-span-${item.rowSpan}`);
    }
    // Starts & Ends base
    if (item.colStart !== 'auto') classes.push(`col-start-${item.colStart}`);
    if (item.colEnd !== 'auto') classes.push(`col-end-${item.colEnd}`);
    if (item.rowStart !== 'auto') classes.push(`row-start-${item.rowStart}`);
    if (item.rowEnd !== 'auto') classes.push(`row-end-${item.rowEnd}`);

    // Self alignment base
    if (item.justifySelf !== 'justify-self-auto') classes.push(item.justifySelf);
    if (item.alignSelf !== 'align-self-auto') classes.push(item.alignSelf);

    // Breakpoint overrides
    const breakpoints: ('sm' | 'md' | 'lg' | 'xl')[] = ['sm', 'md', 'lg', 'xl'];
    breakpoints.forEach(bp => {
      if (enabledBreakpoints[bp] && item[bp]) {
        const config = item[bp]!;
        if (config.colSpan) {
          classes.push(config.colSpan === 'full' ? `${bp}:col-span-full` : `${bp}:col-span-${config.colSpan}`);
        }
        if (config.rowSpan) {
          classes.push(config.rowSpan === 'full' ? `${bp}:row-span-full` : `${bp}:row-span-${config.rowSpan}`);
        }
        if (config.colStart) classes.push(`${bp}:col-start-${config.colStart}`);
        if (config.colEnd) classes.push(`${bp}:col-end-${config.colEnd}`);
        if (config.rowStart) classes.push(`${bp}:row-start-${config.rowStart}`);
        if (config.rowEnd) classes.push(`${bp}:row-end-${config.rowEnd}`);
      }
    });

    return classes.join(' ');
  };

  // --- Code Generation Helpers ---
  const generateCode = () => {
    const containerClass = buildContainerClasses();
    
    if (codeLanguage === 'classes') {
      return containerClass;
    }

    if (codeLanguage === 'html') {
      const itemsHtml = items.map((item, index) => {
        const itemClass = buildItemClasses(item);
        const bgStyle = getBgStyles(item.bgTheme);
        return `  <!-- Card ${index + 1} -->
  <div class="${itemClass} ${bgStyle.htmlBg} border ${bgStyle.htmlBorder} rounded-2xl p-6 flex flex-col justify-between transition-all hover:scale-[1.01]">
    <div>
      <div class="flex justify-between items-center mb-4">
        <span class="text-xs font-mono uppercase ${bgStyle.htmlText}">${item.label}</span>
      </div>
      <h3 class="text-xl font-bold font-sans text-white mt-1">${item.title}</h3>
      <p class="text-xs text-slate-400 mt-1">${item.subtitle}</p>
    </div>
  </div>`;
      }).join('\n\n');

      return `<div class="${containerClass} w-full max-w-7xl mx-auto p-4 min-h-[400px]">
${itemsHtml}
</div>`;
    }

    // JSX Mode
    const itemsJsx = items.map((item, index) => {
      const itemClass = buildItemClasses(item);
      const themeColors = getBgStyles(item.bgTheme);
      return `      {/* ${item.label} */}
      <div className="${itemClass} ${themeColors.jsxBg} border ${themeColors.jsxBorder} rounded-2xl p-6 flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-brand/5">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest ${themeColors.jsxText}">${item.label}</span>
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight font-sans">${item.title}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">${item.subtitle}</p>
        </div>
      </div>`;
    }).join('\n\n');

    return `import React from 'react';

export default function CustomLayoutGrid() {
  return (
    <div className="${containerClass} w-full max-w-7xl mx-auto p-6 bg-[#030304] rounded-3xl border border-zinc-900">
${itemsJsx}
    </div>
  );
}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // --- Render theme coloring logic helper ---
  const getBgStyles = (theme: string) => {
    switch (theme) {
      case 'violet':
        return {
          preview: 'bg-violet-950/40 border-violet-500/20 text-violet-400 hover:border-violet-500/40',
          badge: 'bg-violet-400/10 text-violet-400 border border-violet-400/20',
          jsxBg: 'bg-violet-950/40',
          jsxBorder: 'border-violet-500/20',
          jsxText: 'text-violet-400',
          htmlBg: 'bg-violet-950/40',
          htmlBorder: 'border-violet-500/20',
          htmlText: 'text-violet-400'
        };
      case 'emerald':
        return {
          preview: 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40',
          badge: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
          jsxBg: 'bg-emerald-950/40',
          jsxBorder: 'border-emerald-500/20',
          jsxText: 'text-emerald-400',
          htmlBg: 'bg-emerald-950/40',
          htmlBorder: 'border-emerald-500/20',
          htmlText: 'text-emerald-400'
        };
      case 'amber':
        return {
          preview: 'bg-amber-950/40 border-amber-500/20 text-amber-400 hover:border-amber-500/40',
          badge: 'bg-amber-400/10 text-amber-400 border border-amber-400/20',
          jsxBg: 'bg-amber-950/40',
          jsxBorder: 'border-amber-500/20',
          jsxText: 'text-amber-400',
          htmlBg: 'bg-amber-950/40',
          htmlBorder: 'border-amber-500/20',
          htmlText: 'text-amber-400'
        };
      case 'rose':
        return {
          preview: 'bg-rose-950/40 border-rose-500/20 text-rose-400 hover:border-rose-500/40',
          badge: 'bg-rose-400/10 text-rose-400 border border-rose-400/20',
          jsxBg: 'bg-rose-950/40',
          jsxBorder: 'border-rose-500/20',
          jsxText: 'text-rose-400',
          htmlBg: 'bg-rose-950/40',
          htmlBorder: 'border-rose-500/20',
          htmlText: 'text-rose-400'
        };
      case 'indigo':
        return {
          preview: 'bg-indigo-950/40 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/40',
          badge: 'bg-indigo-400/10 text-indigo-400 border border-indigo-400/20',
          jsxBg: 'bg-indigo-950/40',
          jsxBorder: 'border-indigo-500/20',
          jsxText: 'text-indigo-400',
          htmlBg: 'bg-indigo-950/40',
          htmlBorder: 'border-indigo-500/20',
          htmlText: 'text-indigo-400'
        };
      case 'transparent':
        return {
          preview: 'bg-[#0a0a0f]/20 border-zinc-800/60 text-zinc-400 hover:border-zinc-700',
          badge: 'bg-zinc-800/40 text-zinc-400 border border-zinc-800/50',
          jsxBg: 'bg-[#0a0a0f]/20',
          jsxBorder: 'border-zinc-800/60',
          jsxText: 'text-zinc-400',
          htmlBg: 'bg-[#0a0a0f]/20',
          htmlBorder: 'border-zinc-800/60',
          htmlText: 'text-zinc-400'
        };
      case 'slate':
      default:
        return {
          preview: 'bg-zinc-900/50 border-zinc-750 text-zinc-300 hover:border-zinc-600',
          badge: 'bg-zinc-700/20 text-zinc-300 border border-zinc-700/30',
          jsxBg: 'bg-zinc-900/50',
          jsxBorder: 'border-zinc-750',
          jsxText: 'text-zinc-300',
          htmlBg: 'bg-zinc-900/50',
          htmlBorder: 'border-zinc-750',
          htmlText: 'text-zinc-300'
        };
    }
  };

  // Mock rendering elements inside preview cards
  const renderCardContent = (item: GridItem) => {
    switch (item.contentPreset) {
      case 'stat':
        return (
          <div className="space-y-1">
            <span className="block font-mono text-2xl font-black text-white tracking-tight">{item.title}</span>
            <span className="block text-[10px] text-zinc-400 truncate">{item.subtitle}</span>
          </div>
        );
      case 'button':
        return (
          <div className="space-y-2">
            <span className="block text-xs font-bold text-white truncate">{item.title}</span>
            <button className="px-3 py-1.5 w-full bg-brand hover:bg-brand/90 text-[10px] text-black font-black uppercase rounded transition-all">
              Initialize Node
            </button>
          </div>
        );
      case 'chart':
        return (
          <div className="space-y-2">
            <span className="block text-xs font-bold text-white truncate">{item.title}</span>
            <div className="h-10 flex items-end gap-1 px-1 bg-black/20 rounded border border-zinc-850/60">
              <div className="w-full bg-brand/35 rounded-t h-1/4"></div>
              <div className="w-full bg-brand/50 rounded-t h-2/5"></div>
              <div className="w-full bg-brand/75 rounded-t h-3/5"></div>
              <div className="w-full bg-brand/90 rounded-t h-4/5"></div>
              <div className="w-full bg-brand rounded-t h-3/4"></div>
              <div className="w-full bg-brand/60 rounded-t h-2/3"></div>
            </div>
          </div>
        );
      case 'avatar':
        return (
          <div className="space-y-2">
            <span className="block text-xs font-bold text-white truncate">{item.title}</span>
            <div className="flex -space-x-2 overflow-hidden py-1">
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#07070a] bg-violet-500 flex items-center justify-center text-[8px] text-white font-bold">YA</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#07070a] bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">JD</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#07070a] bg-amber-500 flex items-center justify-center text-[8px] text-white font-bold">MK</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#07070a] bg-zinc-700 flex items-center justify-center text-[8px] text-zinc-300 font-bold">+5</div>
            </div>
          </div>
        );
      case 'number':
        return (
          <div className="flex items-center gap-3">
            <span className="font-mono text-4xl font-black text-brand/85">{item.title}</span>
            <span className="text-[10px] text-zinc-400 font-sans leading-tight">{item.subtitle}</span>
          </div>
        );
      case 'text':
      default:
        return (
          <div className="space-y-1">
            <h4 className="font-heading font-black text-xs text-white uppercase tracking-wider">{item.title}</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed truncate">{item.subtitle}</p>
          </div>
        );
    }
  };

  // --- Active config breakpoint selector helper ---
  const getActiveConfigObject = (): BreakpointConfig => {
    switch (activeConfigBreakpoint) {
      case 'sm': return smConfig;
      case 'md': return mdConfig;
      case 'lg': return lgConfig;
      case 'xl': return xlConfig;
      case 'base':
      default:
        return baseConfig;
    }
  };

  const updateActiveConfigField = (field: keyof BreakpointConfig, value: any) => {
    switch (activeConfigBreakpoint) {
      case 'sm':
        setSmConfig({ ...smConfig, [field]: value });
        break;
      case 'md':
        setMdConfig({ ...mdConfig, [field]: value });
        break;
      case 'lg':
        setLgConfig({ ...lgConfig, [field]: value });
        break;
      case 'xl':
        setXlConfig({ ...xlConfig, [field]: value });
        break;
      case 'base':
      default:
        setBaseConfig({ ...baseConfig, [field]: value });
        break;
    }
  };

  // --- Cheatsheet Data list ---
  const cheatsheetDocs = [
    {
      title: 'Grid Columns',
      classes: 'grid-cols-1 ... grid-cols-12, grid-cols-none',
      css: 'grid-template-columns: repeat(N, minmax(0, 1fr));',
      desc: 'Controls the amount of explicit column tracks inside the CSS grid layout.'
    },
    {
      title: 'Grid Rows',
      classes: 'grid-rows-1 ... grid-rows-6, grid-rows-none',
      css: 'grid-template-rows: repeat(N, minmax(0, 1fr));',
      desc: 'Defines the vertical row tracks. Usually fluid on dynamic content.'
    },
    {
      title: 'Column Spans',
      classes: 'col-span-1 ... col-span-12, col-span-full, col-span-auto',
      css: 'grid-column: span N / span N;',
      desc: 'Sets how many columns a grid item should occupy from its left track.'
    },
    {
      title: 'Row Spans',
      classes: 'row-span-1 ... row-span-6, row-span-full, row-span-auto',
      css: 'grid-row: span N / span N;',
      desc: 'Sets how many horizontal rows a grid item stretches vertically.'
    },
    {
      title: 'Grid Gaps',
      classes: 'gap-0 ... gap-16, gap-x-4, gap-y-6',
      css: 'gap: Npx; column-gap: Npx; row-gap: Npx;',
      desc: 'Determines spacing between row & column boundaries.'
    },
    {
      title: 'Grid Auto Flow',
      classes: 'grid-flow-row, grid-flow-col, grid-flow-row-dense, grid-flow-col-dense',
      css: 'grid-auto-flow: [row | column] [dense];',
      desc: 'Determines the packing algorithm order for implicitly positioned item blocks.'
    }
  ];

  const filteredDocs = cheatsheetDocs.filter(doc => 
    doc.title.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
    doc.classes.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
    doc.desc.toLowerCase().includes(searchDocQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-white pb-10" id="tailwind-grid-root">
      {/* Title & Nav Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold tracking-widest text-brand uppercase flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5" />
            Vite Developer Suite
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight font-sans">
            Tailwind Grid & Layout Visualizer
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Interactive playground to size grid tracks, configure complex responsive breakpoints, and copy flawless Tailwind markup.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-zinc-950/60 p-1 rounded-xl border border-zinc-900 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'visualizer' 
                ? 'bg-brand text-black shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Grid Visualizer
          </button>
          <button
            onClick={() => setActiveTab('cheatsheet')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'cheatsheet' 
                ? 'bg-brand text-black shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Tailwind Cheat Sheet
          </button>
        </div>
      </div>

      {activeTab === 'cheatsheet' ? (
        /* --- CHEATSHEET TAB VIEW --- */
        <div className="space-y-6 animate-fadeIn">
          {/* Docs Search Filter */}
          <div className="beveled-panel p-5 bg-[#07070a]/90 border border-zinc-900 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <h3 className="font-heading font-black text-xs uppercase text-zinc-300 tracking-wider">
                  Utility Reference Guide & Cheat Sheet
                </h3>
                <p className="text-[10px] text-zinc-500">Quickly map standard CSS Grid attributes back to Tailwind utilities</p>
              </div>
              <input
                type="text"
                placeholder="Search utilities (e.g. gap, span, cols)..."
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                className="px-3 py-1.5 bg-zinc-950/85 border border-zinc-850 rounded-lg text-xs text-white placeholder-zinc-550 w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-brand/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/25 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold font-heading text-brand">{doc.title}</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400">Tailwind css</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">{doc.desc}</p>
                    <div className="space-y-1.5 pt-2 border-t border-zinc-950">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-zinc-500">Utilities:</span>
                        <span className="text-white text-right font-semibold select-all">{doc.classes}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-zinc-500">CSS:</span>
                        <span className="text-zinc-400 text-right italic">{doc.css}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-10 text-zinc-500 text-xs font-mono">
                  No matching Tailwind CSS grid guidelines found.
                </div>
              )}
            </div>
          </div>

          {/* Quick interactive examples */}
          <div className="beveled-panel p-5 bg-[#07070a]/90 border border-zinc-900 rounded-2xl space-y-3">
            <h4 className="font-heading font-black text-xs uppercase text-zinc-300 tracking-wider">
              Common Responsive Breakpoint Idioms
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-zinc-950/30 rounded-xl border border-zinc-900/40 text-xs font-mono space-y-1">
                <div className="text-brand font-bold">Responsive Auto-fit:</div>
                <div className="text-zinc-300">grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4</div>
                <p className="text-[10px] text-zinc-500 font-sans mt-1">Excellent for general product lists or visual portfolio card collections. Adapts seamlessly across phone, tablet, and widescreen layouts.</p>
              </div>
              <div className="p-3 bg-zinc-950/30 rounded-xl border border-zinc-900/40 text-xs font-mono space-y-1">
                <div className="text-brand font-bold">Sidebar + Content Split:</div>
                <div className="text-zinc-300">grid-cols-1 md:grid-cols-4 {"->"} sidebar (col-span-1) & main content (col-span-3)</div>
                <p className="text-[10px] text-zinc-500 font-sans mt-1">Ideal for modern documentation, SaaS consoles, or workspace file explorers. Resizes to clean stack on mobile automatically.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* --- VISUALIZER TAB VIEW --- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* --- LEFT PANEL: CONFIGURATOR (COL-SPAN-4) --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Presets Panel */}
            <div className="beveled-panel p-5 bg-[#07070a]/90 border border-zinc-900 rounded-2xl space-y-3">
              <h3 className="font-heading font-black text-xs uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand" />
                Layout Preset Starters
              </h3>
              <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                Kickstart your grid layout instantly with common pre-engineered developer paradigms.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => applyPreset('responsive-cards')}
                  className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-850 hover:border-brand/40 hover:text-white rounded-lg text-[10.5px] font-bold text-zinc-300 text-left transition-all"
                >
                  🚀 Cards Grid
                </button>
                <button
                  onClick={() => applyPreset('holy-grail')}
                  className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-850 hover:border-brand/40 hover:text-white rounded-lg text-[10.5px] font-bold text-zinc-300 text-left transition-all"
                >
                  🧱 Holy Grail
                </button>
                <button
                  onClick={() => applyPreset('bento-highlight')}
                  className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-850 hover:border-brand/40 hover:text-white rounded-lg text-[10.5px] font-bold text-zinc-300 text-left transition-all"
                >
                  📐 Bento Highlight
                </button>
                <button
                  onClick={() => applyPreset('dashboard')}
                  className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-850 hover:border-brand/40 hover:text-white rounded-lg text-[10.5px] font-bold text-zinc-300 text-left transition-all"
                >
                  📈 Dashboard Node
                </button>
              </div>
            </div>

            {/* Breakpoint Configurator Section */}
            <div className="beveled-panel p-5 bg-[#07070a]/90 border border-zinc-900 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-black text-xs uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-brand" />
                  Grid Architecture
                </h3>
                <button 
                  onClick={handleReset}
                  className="text-zinc-500 hover:text-white flex items-center gap-1 text-[10px] font-mono"
                  title="Reset completely"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              {/* Breakpoint Selector Selector Buttons */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Configure Breakpoint Tracks
                </span>
                <div className="flex flex-wrap bg-zinc-950 p-1 rounded-xl border border-zinc-900 gap-1">
                  <button
                    onClick={() => setActiveConfigBreakpoint('base')}
                    className={`flex-1 min-w-[50px] px-2 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      activeConfigBreakpoint === 'base'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Base
                  </button>
                  {['sm', 'md', 'lg', 'xl'].map((bp) => {
                    const isEnabled = enabledBreakpoints[bp];
                    const isActive = activeConfigBreakpoint === bp;
                    return (
                      <button
                        key={bp}
                        onClick={() => {
                          setActiveConfigBreakpoint(bp as any);
                          if (!isEnabled) {
                            // Turn it on if clicked
                            setEnabledBreakpoints({
                              ...enabledBreakpoints,
                              [bp]: true
                            });
                          }
                        }}
                        className={`flex-1 min-w-[50px] px-2 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                          isActive 
                            ? 'bg-brand text-black' 
                            : isEnabled 
                              ? 'bg-zinc-900 text-zinc-300' 
                              : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                      >
                        <span className={`w-1 h-1 rounded-full ${isEnabled ? 'bg-emerald-400' : 'bg-zinc-700'}`}></span>
                        {bp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Breakpoint Enabler Checkbox if not base */}
              {activeConfigBreakpoint !== 'base' && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-900/60">
                  <div className="space-y-0.5">
                    <span className="block text-[10.5px] font-bold text-zinc-200 uppercase">Enable {activeConfigBreakpoint.toUpperCase()}: Breakpoint</span>
                    <span className="block text-[9.5px] text-zinc-500">Override grid layout parameters on {activeConfigBreakpoint}: viewports</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enabledBreakpoints[activeConfigBreakpoint]}
                    onChange={(e) => {
                      setEnabledBreakpoints({
                        ...enabledBreakpoints,
                        [activeConfigBreakpoint]: e.target.checked
                      });
                    }}
                    className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-brand focus:ring-brand/30"
                  />
                </div>
              )}

              {/* Columns & Rows Controls */}
              {(!enabledBreakpoints[activeConfigBreakpoint] && activeConfigBreakpoint !== 'base') ? (
                <div className="p-6 text-center rounded-xl bg-zinc-950/20 border border-dashed border-zinc-900 text-xs text-zinc-500 font-mono">
                  {activeConfigBreakpoint.toUpperCase()} settings disabled.<br />
                  <span className="text-[10px] text-zinc-650">Defaulting to previous breakpoint dimensions.</span>
                </div>
              ) : (
                <div className="space-y-4 pt-1 animate-fadeIn">
                  {/* Column Count */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10.5px] font-mono">
                      <span className="text-zinc-400">Column Count (1-12)</span>
                      <span className="text-brand font-bold">
                        {getActiveConfigObject().cols === 12 ? '12 Cols (Full Width)' : `${getActiveConfigObject().cols} Cols`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={getActiveConfigObject().cols}
                      onChange={(e) => updateActiveConfigField('cols', parseInt(e.target.value))}
                      className="w-full accent-brand h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8.5px] font-mono text-zinc-600">
                      <span>1 col</span>
                      <span>4</span>
                      <span>8</span>
                      <span>12 cols</span>
                    </div>
                  </div>

                  {/* Row Count */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10.5px] font-mono">
                      <span className="text-zinc-400">Row Count (1-12)</span>
                      <span className="text-brand font-bold">{getActiveConfigObject().rows} Rows</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={getActiveConfigObject().rows}
                      onChange={(e) => updateActiveConfigField('rows', parseInt(e.target.value))}
                      className="w-full accent-brand h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8.5px] font-mono text-zinc-600">
                      <span>1 row</span>
                      <span>4</span>
                      <span>8</span>
                      <span>12 rows</span>
                    </div>
                  </div>

                  {/* Gaps Configs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Column Gap</label>
                      <select
                        value={getActiveConfigObject().gapX}
                        onChange={(e) => updateActiveConfigField('gapX', e.target.value)}
                        className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                      >
                        <option value="gap-x-0">gap-x-0 (0px)</option>
                        <option value="gap-x-1">gap-x-1 (4px)</option>
                        <option value="gap-x-2">gap-x-2 (8px)</option>
                        <option value="gap-x-3">gap-x-3 (12px)</option>
                        <option value="gap-x-4">gap-x-4 (16px)</option>
                        <option value="gap-x-6">gap-x-6 (24px)</option>
                        <option value="gap-x-8">gap-x-8 (32px)</option>
                        <option value="gap-x-12">gap-x-12 (48px)</option>
                        <option value="gap-x-16">gap-x-16 (64px)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Row Gap</label>
                      <select
                        value={getActiveConfigObject().gapY}
                        onChange={(e) => updateActiveConfigField('gapY', e.target.value)}
                        className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                      >
                        <option value="gap-y-0">gap-y-0 (0px)</option>
                        <option value="gap-y-1">gap-y-1 (4px)</option>
                        <option value="gap-y-2">gap-y-2 (8px)</option>
                        <option value="gap-y-3">gap-y-3 (12px)</option>
                        <option value="gap-y-4">gap-y-4 (16px)</option>
                        <option value="gap-y-6">gap-y-6 (24px)</option>
                        <option value="gap-y-8">gap-y-8 (32px)</option>
                        <option value="gap-y-12">gap-y-12 (48px)</option>
                        <option value="gap-y-16">gap-y-16 (64px)</option>
                      </select>
                    </div>
                  </div>

                  {/* Alignment properties */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Justify Items</label>
                      <select
                        value={getActiveConfigObject().justifyItems}
                        onChange={(e) => updateActiveConfigField('justifyItems', e.target.value)}
                        className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                      >
                        <option value="justify-items-stretch">stretch (default)</option>
                        <option value="justify-items-start">start</option>
                        <option value="justify-items-center">center</option>
                        <option value="justify-items-end">end</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Align Items</label>
                      <select
                        value={getActiveConfigObject().alignItems}
                        onChange={(e) => updateActiveConfigField('alignItems', e.target.value)}
                        className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                      >
                        <option value="align-items-stretch">stretch (default)</option>
                        <option value="align-items-start">start</option>
                        <option value="align-items-center">center</option>
                        <option value="align-items-end">end</option>
                      </select>
                    </div>
                  </div>

                  {/* Grid Auto Flow */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Implicit Grid Flow</label>
                    <select
                      value={getActiveConfigObject().gridFlow}
                      onChange={(e) => updateActiveConfigField('gridFlow', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none animate-fadeIn"
                    >
                      <option value="grid-flow-row">Row-first (grid-flow-row)</option>
                      <option value="grid-flow-col">Col-first (grid-flow-col)</option>
                      <option value="grid-flow-row-dense">Dense Row packing (grid-flow-row-dense)</option>
                      <option value="grid-flow-col-dense">Dense Col packing (grid-flow-col-dense)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Tips panel */}
            <div className="beveled-panel p-5 bg-[#07070a]/70 border border-zinc-900 rounded-2xl space-y-2">
              <h4 className="text-[10.5px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                Interactive Tips
              </h4>
              <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                💡 **Click** on any layout element card in the canvas preview stage to select it, size its individual track spans, customize themes, and add tailored dashboard widgets.
              </p>
            </div>
          </div>

          {/* --- MIDDLE PANEL: STAGE & CODE VIEW (COL-SPAN-8) --- */}
          <div className="lg:col-span-8 space-y-6">

            {/* Device preview bar & utilities */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-zinc-950/80 rounded-2xl border border-zinc-900/60">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-brand" />
                <span className="font-sans font-bold text-xs text-white uppercase">Device Viewport Simulation</span>
              </div>

              {/* Device Selector buttons */}
              <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-850">
                <button
                  onClick={() => setPreviewDevice('all')}
                  className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${
                    previewDevice === 'all' ? 'bg-brand text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Full Width Grid Blueprint view"
                >
                  <Maximize2 className="w-3 h-3" /> All (Fluid)
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-2 py-1 text-[10px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${
                    previewDevice === 'mobile' ? 'bg-brand text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Mobile Viewport <= 640px"
                >
                  <Smartphone className="w-3 h-3" /> Mobile
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`px-2 py-1 text-[10px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${
                    previewDevice === 'tablet' ? 'bg-brand text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Tablet Viewport MD >= 768px"
                >
                  <Tablet className="w-3 h-3" /> Tablet
                </button>
                <button
                  onClick={() => setPreviewDevice('laptop')}
                  className={`px-2 py-1 text-[10px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${
                    previewDevice === 'laptop' ? 'bg-brand text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Laptop Viewport LG >= 1024px"
                >
                  <Laptop className="w-3 h-3" /> Laptop
                </button>
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-2 py-1 text-[10px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${
                    previewDevice === 'desktop' ? 'bg-brand text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Desktop Viewport XL >= 1280px"
                >
                  <Monitor className="w-3 h-3" /> Desktop
                </button>
              </div>

              {/* Add item button */}
              <button
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-brand hover:text-white rounded-xl text-[10.5px] font-black uppercase flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-brand" /> Add Card
              </button>
            </div>

            {/* --- LIVE PREVIEW STAGE CANVAS CONTAINER --- */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 px-1">
                <span>STAGE CANVAS</span>
                <span className="text-zinc-600">Simulating: {previewDevice.toUpperCase()} WIDTH</span>
              </div>

              {/* Wrapper that scales widths according to the simulator */}
              <div className="flex justify-center bg-[#050507] p-5 rounded-3xl border border-zinc-900 overflow-x-auto min-h-[460px] relative">
                
                {/* Background grid guides to show structural cells */}
                <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-4 p-5 opacity-5 pointer-events-none">
                  {Array.from({ length: 72 }).map((_, i) => (
                    <div key={i} className="border border-brand rounded-md"></div>
                  ))}
                </div>

                <div 
                  className={`w-full transition-all duration-300 relative z-10 ${
                    previewDevice === 'mobile' 
                      ? 'max-w-[360px] border-x border-brand/20 px-2' 
                      : previewDevice === 'tablet' 
                        ? 'max-w-[720px] border-x border-brand/10' 
                        : previewDevice === 'laptop' 
                          ? 'max-w-[960px]' 
                          : previewDevice === 'desktop' 
                            ? 'max-w-[1200px]' 
                            : 'max-w-full'
                  }`}
                >
                  {/* Dynamic rendering grid with configured classes */}
                  <div className={buildContainerClasses()}>
                    {items.length > 0 ? (
                      items.map((item) => {
                        const isSelected = selectedItemId === item.id;
                        const itemClass = buildItemClasses(item);
                        const bgColors = getBgStyles(item.bgTheme);

                        return (
                          <div
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItemId(item.id);
                            }}
                            className={`group cursor-pointer rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 border relative ${itemClass} ${bgColors.preview} ${
                              isSelected 
                                ? 'ring-2 ring-brand border-brand/60 shadow-lg shadow-brand/10 scale-[1.01]' 
                                : 'shadow-sm'
                            }`}
                          >
                            <div className="space-y-3 h-full flex flex-col justify-between">
                              {/* Top Bar label inside Card */}
                              <div className="flex items-center justify-between pb-1">
                                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 group-hover:text-brand transition-colors truncate">
                                  {item.label}
                                </span>
                                
                                {/* Quick individual remove button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(item.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-rose-500/20 rounded text-zinc-500 hover:text-rose-400 transition-all"
                                  title="Remove block"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Card Content Preset Display */}
                              <div className="py-1">
                                {renderCardContent(item)}
                              </div>

                              {/* Footer coordinates indicator */}
                              <div className="pt-2 border-t border-zinc-900/40 flex items-center justify-between text-[8px] font-mono text-zinc-500">
                                <span className="truncate max-w-[80%]">
                                  w: {item.colSpan === 'full' ? '12/12' : `${item.colSpan} col`}
                                  {item.rowSpan !== '1' && ` × h: ${item.rowSpan}`}
                                </span>
                                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-brand' : 'bg-transparent'}`}></span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-16 text-center text-zinc-600 font-mono text-xs flex flex-col items-center justify-center gap-3">
                        <Sliders className="w-8 h-8 text-zinc-800" />
                        No Grid items found. Click "Add Card" to populate columns tracks.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected item details inspector drawer / Panel */}
            {selectedItemId && (() => {
              const selectedItem = items.find(it => it.id === selectedItemId);
              if (!selectedItem) return null;

              return (
                <div className="beveled-panel p-5 bg-zinc-950/90 border-2 border-brand/20 rounded-2xl space-y-4 animate-slideIn">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                    <div className="flex items-center gap-2">
                      <Layout className="w-4 h-4 text-brand" />
                      <div>
                        <h4 className="font-heading font-black text-xs uppercase text-zinc-200">
                          Configure Individual Card: {selectedItem.label}
                        </h4>
                        <p className="text-[9.5px] text-zinc-500">Customize coordinate alignment spans & responsive overrides</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(selectedItemId)}
                      className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-black rounded-lg text-[10px] font-black uppercase text-rose-400 transition-all flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Card
                    </button>
                  </div>

                  {/* Grid Spans controls (Standard Base View) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Size and Spacing spans */}
                    <div className="md:col-span-7 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Col span control */}
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest block">Column Span</label>
                          <select
                            value={selectedItem.colSpan}
                            onChange={(e) => updateSelectedItemField('colSpan', e.target.value)}
                            className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                          >
                            <option value="auto">auto</option>
                            <option value="1">span 1</option>
                            <option value="2">span 2</option>
                            <option value="3">span 3</option>
                            <option value="4">span 4</option>
                            <option value="5">span 5</option>
                            <option value="6">span 6</option>
                            <option value="8">span 8</option>
                            <option value="10">span 10</option>
                            <option value="12">span 12</option>
                            <option value="full">span-full</option>
                          </select>
                        </div>

                        {/* Row span control */}
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest block">Row Span</label>
                          <select
                            value={selectedItem.rowSpan}
                            onChange={(e) => updateSelectedItemField('rowSpan', e.target.value)}
                            className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                          >
                            <option value="auto">auto</option>
                            <option value="1">span 1</option>
                            <option value="2">span 2</option>
                            <option value="3">span 3</option>
                            <option value="4">span 4</option>
                            <option value="5">span 5</option>
                            <option value="6">span 6</option>
                            <option value="full">span-full</option>
                          </select>
                        </div>
                      </div>

                      {/* Precise track placing (start / end coordinates) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest block">Col Start Coordinate</label>
                          <select
                            value={selectedItem.colStart}
                            onChange={(e) => updateSelectedItemField('colStart', e.target.value)}
                            className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none text-zinc-400"
                          >
                            <option value="auto">col-start-auto</option>
                            {Array.from({ length: 13 }).map((_, i) => (
                              <option key={i+1} value={`${i+1}`}>col-start-{i+1}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest block">Col End Coordinate</label>
                          <select
                            value={selectedItem.colEnd}
                            onChange={(e) => updateSelectedItemField('colEnd', e.target.value)}
                            className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none text-zinc-400"
                          >
                            <option value="auto">col-end-auto</option>
                            {Array.from({ length: 13 }).map((_, i) => (
                              <option key={i+1} value={`${i+1}`}>col-end-{i+1}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Breakpoint overrides for the active card */}
                      <div className="space-y-1.5 pt-1">
                        <span className="block text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest">
                          Responsive Spanning overrides (Optional)
                        </span>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {/* md Breakpoint Override col span */}
                          <div className="space-y-1 bg-zinc-900/60 p-2 rounded-xl border border-zinc-850">
                            <span className="block text-[8px] font-mono text-brand uppercase font-bold">md: Override</span>
                            <select
                              value={selectedItem.md?.colSpan || 'auto'}
                              onChange={(e) => {
                                if (e.target.value === 'auto') {
                                  clearSelectedItemBreakpointOverride('md', 'colSpan');
                                } else {
                                  updateSelectedItemBreakpointField('md', 'colSpan', e.target.value);
                                }
                              }}
                              className="w-full bg-zinc-950 border border-zinc-850 rounded py-0.5 px-1 text-[10px] text-white focus:outline-none"
                            >
                              <option value="auto">inherit</option>
                              <option value="1">span 1</option>
                              <option value="2">span 2</option>
                              <option value="3">span 3</option>
                              <option value="4">span 4</option>
                              <option value="6">span 6</option>
                              <option value="8">span 8</option>
                              <option value="12">span 12</option>
                              <option value="full">full</option>
                            </select>
                          </div>

                          {/* lg Breakpoint Override col span */}
                          <div className="space-y-1 bg-zinc-900/60 p-2 rounded-xl border border-zinc-850">
                            <span className="block text-[8px] font-mono text-brand uppercase font-bold">lg: Override</span>
                            <select
                              value={selectedItem.lg?.colSpan || 'auto'}
                              onChange={(e) => {
                                if (e.target.value === 'auto') {
                                  clearSelectedItemBreakpointOverride('lg', 'colSpan');
                                } else {
                                  updateSelectedItemBreakpointField('lg', 'colSpan', e.target.value);
                                }
                              }}
                              className="w-full bg-zinc-950 border border-zinc-850 rounded py-0.5 px-1 text-[10px] text-white focus:outline-none"
                            >
                              <option value="auto">inherit</option>
                              <option value="1">span 1</option>
                              <option value="2">span 2</option>
                              <option value="3">span 3</option>
                              <option value="4">span 4</option>
                              <option value="6">span 6</option>
                              <option value="8">span 8</option>
                              <option value="12">span 12</option>
                              <option value="full">full</option>
                            </select>
                          </div>

                          {/* lg row override */}
                          <div className="space-y-1 bg-zinc-900/60 p-2 rounded-xl border border-zinc-850">
                            <span className="block text-[8px] font-mono text-brand uppercase font-bold">lg: Row override</span>
                            <select
                              value={selectedItem.lg?.rowSpan || 'auto'}
                              onChange={(e) => {
                                if (e.target.value === 'auto') {
                                  clearSelectedItemBreakpointOverride('lg', 'rowSpan');
                                } else {
                                  updateSelectedItemBreakpointField('lg', 'rowSpan', e.target.value);
                                }
                              }}
                              className="w-full bg-zinc-950 border border-zinc-850 rounded py-0.5 px-1 text-[10px] text-white focus:outline-none"
                            >
                              <option value="auto">inherit</option>
                              <option value="1">span 1</option>
                              <option value="2">span 2</option>
                              <option value="3">span 3</option>
                              <option value="4">span 4</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cosmetic settings & content placeholder options */}
                    <div className="md:col-span-5 space-y-4">
                      {/* Theme selection */}
                      <div className="space-y-1.5">
                        <label className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest block">Cosmetic Color Theme</label>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {[
                            { name: 'slate', color: 'bg-zinc-800' },
                            { name: 'violet', color: 'bg-violet-600' },
                            { name: 'emerald', color: 'bg-emerald-600' },
                            { name: 'amber', color: 'bg-amber-600' },
                            { name: 'rose', color: 'bg-rose-600' },
                            { name: 'indigo', color: 'bg-indigo-600' },
                            { name: 'transparent', color: 'border border-dashed border-zinc-600 bg-transparent' }
                          ].map((theme) => (
                            <button
                              key={theme.name}
                              onClick={() => updateSelectedItemField('bgTheme', theme.name)}
                              className={`w-6 h-6 rounded-full transition-all flex items-center justify-center ${theme.color} ${
                                selectedItem.bgTheme === theme.name ? 'ring-2 ring-brand ring-offset-2 ring-offset-zinc-950 scale-105' : 'opacity-85 hover:opacity-100'
                              }`}
                              title={`Apply ${theme.name} palette`}
                            >
                              {selectedItem.bgTheme === theme.name && <Check className="w-3 h-3 text-black font-bold" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Content Preset widget selector */}
                      <div className="space-y-1.5">
                        <label className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest block">Card Content Preset Widget</label>
                        <select
                          value={selectedItem.contentPreset}
                          onChange={(e) => updateSelectedItemField('contentPreset', e.target.value as any)}
                          className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                        >
                          <option value="text">Title & Subtitle description</option>
                          <option value="stat">Large Dashboard Statistic numeric</option>
                          <option value="button">Action Call Button element</option>
                          <option value="chart">Mini simulated visual chart block</option>
                          <option value="avatar">Engineers user team cluster</option>
                          <option value="number">Huge numeric coordinates accent</option>
                        </select>
                      </div>

                      {/* Custom Titles and subtitles */}
                      <div className="space-y-2">
                        <div>
                          <input
                            type="text"
                            placeholder="Custom title string..."
                            value={selectedItem.title}
                            onChange={(e) => updateSelectedItemField('title', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Custom description text..."
                            value={selectedItem.subtitle}
                            onChange={(e) => updateSelectedItemField('subtitle', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* --- EXPORT CODE PANEL --- */}
            <div className="beveled-panel p-5 bg-[#07070a]/90 border border-zinc-900 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-zinc-900">
                <div className="space-y-1">
                  <h3 className="font-heading font-black text-xs uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-brand" />
                    Generated Tailwind Classes & Code Markup
                  </h3>
                  <p className="text-[10px] text-zinc-500">Copy optimized structural vectors into your production setup</p>
                </div>

                {/* Language tab selector */}
                <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-850 self-stretch sm:self-auto justify-center">
                  <button
                    onClick={() => setCodeLanguage('jsx')}
                    className={`px-3 py-1 text-[9.5px] font-black uppercase rounded-md transition-all ${
                      codeLanguage === 'jsx' ? 'bg-brand text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    React JSX
                  </button>
                  <button
                    onClick={() => setCodeLanguage('html')}
                    className={`px-3 py-1 text-[9.5px] font-black uppercase rounded-md transition-all ${
                      codeLanguage === 'html' ? 'bg-brand text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    HTML5
                  </button>
                  <button
                    onClick={() => setCodeLanguage('classes')}
                    className={`px-3 py-1 text-[9.5px] font-black uppercase rounded-md transition-all ${
                      codeLanguage === 'classes' ? 'bg-brand text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Copy only classes list string"
                  >
                    Class String
                  </button>
                </div>
              </div>

              {/* Code output display box */}
              <div className="relative">
                <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-[300px] leading-relaxed scrollbar-thin">
                  <code>{generateCode()}</code>
                </pre>

                {/* Copy floating button */}
                <button
                  onClick={handleCopyCode}
                  className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase transition-all flex items-center gap-1 shadow-md ${
                    copiedCode 
                      ? 'bg-emerald-500 text-black' 
                      : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>

              {/* Code stats note */}
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <Info className="w-3.5 h-3.5 text-brand" />
                <span>Responsive markup renders seamlessly on standard dynamic viewports. Mobile view defaults to structured column cards.</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Google AdSense Compliant Informational Article & FAQs Footer */}
      <div className="border-t border-zinc-900 pt-12 mt-12 space-y-10 text-left max-w-5xl mx-auto px-4">
        
        {/* Editorial Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Developer Guide: Tailwind CSS Grid & Layout Systems</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">
            The Ultimate Guide to Modern CSS Grids & Tailwind Layout Architects
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Struggling to build pixel-perfect bento grids or complex multi-column responsive dashboard structures? Discover how Tailwind's powerful CSS Grid engine handles fraction structures, track spacings, and cell spans under standard viewports.
          </p>
        </div>

        {/* 2-Column Article Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Article Column 1 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-indigo-500 font-mono">01.</span>
                What is CSS Grid?
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                The **CSS Grid Layout Module** is a two-dimensional layout system for the web. It lets you align elements into structured rows and columns, offering complete control over sizes, offsets, alignment flow direction, and cell overlaps. Unlike Flexbox (which is primarily one-dimensional), CSS Grid handles both horizontal and vertical bounds simultaneously.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Tailwind CSS abstracts standard CSS grid declarations into highly readable utility classes (like <code>grid-cols-12</code>, <code>col-span-4</code>, and <code>gap-4</code>), dramatically accelerating front-end UI construction.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-indigo-500 font-mono">02.</span>
                Demystifying Bento Grids & Card Layouts
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Originating from traditional Japanese bento lunchboxes, the **Bento Grid** design pattern has taken the web by storm. It focuses on organizing clean, rounded card modules of unequal proportions into a beautifully unified, dense visual collage.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                By configuring specific grid-cell properties like <code>col-span</code> (width columns spanned) and <code>row-span</code> (height tracks spanned), you can direct attention, group features, and construct striking marketing sections.
              </p>
            </div>
          </div>

          {/* Article Column 2 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-indigo-500 font-mono">03.</span>
                The Role of Fractional (fr) Units & Gaps
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                For flexible responsive grids, developers utilize the **fractional unit (fr)**:
              </p>
              <ul className="space-y-2 text-zinc-400 text-xs pl-4 list-disc">
                <li><strong className="text-zinc-200">Flexible Columns:</strong> <code>1fr</code> represents a single portion of the total available free space within the grid container.</li>
                <li><strong className="text-zinc-200">Adaptive Gaps:</strong> The <code>gap</code> or gutter property manages cell separations without requiring margin overrides, preventing visual breakages.</li>
                <li><strong className="text-zinc-200">Alignment:</strong> Properties like <code>justify-items</code> and <code>align-items</code> control cell placement on horizontal and vertical planes.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-indigo-500 font-mono">04.</span>
                Step-by-Step Layout Creation Process
              </h4>
              <ol className="space-y-1.5 text-zinc-400 text-xs pl-4 list-decimal">
                <li>Select the total baseline columns (e.g., 12 cols for standard layouts) and row limits.</li>
                <li>Adjust baseline column gaps and row spacings on our dynamic playground slider rail.</li>
                <li>Click <strong className="text-indigo-400">Add Cell</strong> and drag or configure individual col/row spans to construct elements.</li>
                <li>Toggle between viewport simulations (Desktop, Laptop, Tablet, Mobile) to ensure a fluid look.</li>
                <li>Copy clean, modular Tailwind JSX or raw HTML codes instantly into your project workspace.</li>
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
            <p className="text-zinc-500 text-xs">Got questions about grid calculations and compiling rules? Read on.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                What is the difference between CSS Grid and Flexbox?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                CSS Grid is built for 2-dimensional layouts (structuring both columns and rows at the same time). Flexbox is a 1-dimensional system designed to lay out items in a single direction (either a row OR a column).
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                Why should I use a 12-column baseline grid configuration?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                The number 12 is highly divisible. It can be divided perfectly into halves (6), thirds (4), quarters (3), and sixths (2). This makes 12-column grids incredibly versatile for building complex dashboard layouts.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                How does this layout visualizer protect my data?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Our visualizer operates entirely in your local browser sandbox. No configurations, drafts, or code blocks are transmitted to external servers, providing total data sovereignty.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                Does Tailwind support nested grids?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Yes! Any grid cell can be turned into a grid container itself. Just apply the <code>grid</code> class to a nested cell element to create sub-grid structures.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

export interface ToolUsageEvent {
  id: string;
  toolId: string;
  timestamp: string; // ISO String
}

const TOOL_MUTUAL_LABELS: Record<string, string> = {
  'compress-pdf': 'PDF Compressor',
  'webp-converter': 'WebP Converter',
  'json-beautifier': 'JSON Parser & Beauter',
  'sitemap-seo': 'SEO Site Inspect',
  'image-to-pdf': 'Image to PDF Forge',
  'join-pdf': 'PDF Joiner Engine',
  'ai-writer': 'AI Word Smith',
  'password-generator': 'Pass Matrix Engine',
  'qr-generator': 'QR Code Matrix',
  'image-vectorizer': 'Image Vectorizer',
  'unit-converter': 'Unit Converter Shift',
  'svg-rasterizer': 'SVG Vector Rasterizer',
  'batch-processor': 'Parallel Batch Processor',
  'json-diff': 'JSON-Diff Matrix',
  'code-snapshot': 'Code Snapshot Canvas',
  'private-sketchpad': 'Secure Vector Sketchpad'
};

const STORAGE_KEY = 'apex_tool_usage_events_stream';

export const logToolUsage = (toolId: string) => {
  if (toolId === 'dashboard') return;
  try {
    const rawEvents = localStorage.getItem(STORAGE_KEY);
    let events: ToolUsageEvent[] = [];
    if (rawEvents) {
      events = JSON.parse(rawEvents);
    }

    const now = new Date();
    const newEvent: ToolUsageEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      toolId,
      timestamp: now.toISOString()
    };

    // Filter events only from the past 7 days to avoid memory leaking
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    events = [newEvent, ...events].filter(e => {
      const et = new Date(e.timestamp);
      return et >= sevenDaysAgo;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    window.dispatchEvent(new CustomEvent('apex_tool_analytics_updated'));
  } catch (e) {
    console.error('Failed to log tool usage event', e);
  }
};

export const getToolUsageData = (): { toolId: string; toolLabel: string; count: number }[] => {
  try {
    const rawEvents = localStorage.getItem(STORAGE_KEY);
    let events: ToolUsageEvent[] = [];
    if (rawEvents) {
      events = JSON.parse(rawEvents);
    }

    // Filter last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    events = events.filter(e => {
      const et = new Date(e.timestamp);
      return et >= sevenDaysAgo;
    });

    // If completely empty, seed a beautiful representative mock list for a great first-time dashboard look and feel!
    if (events.length === 0) {
      events = seedUsageEvents();
    }

    // Count per tool
    const counts: Record<string, number> = {};
    Object.keys(TOOL_MUTUAL_LABELS).forEach(key => {
      counts[key] = 0;
    });

    events.forEach(e => {
      if (counts[e.toolId] !== undefined) {
        counts[e.toolId]++;
      }
    });

    // Map into sorted list
    return Object.entries(counts)
      .map(([toolId, count]) => ({
        toolId,
        toolLabel: TOOL_MUTUAL_LABELS[toolId] || toolId,
        count
      }))
      .sort((a, b) => b.count - a.count);
  } catch (e) {
    console.error('Failed aggregating tool usage analytics', e);
    return [];
  }
};

const seedUsageEvents = (): ToolUsageEvent[] => {
  const seeded: ToolUsageEvent[] = [];
  const tools = Object.keys(TOOL_MUTUAL_LABELS);
  
  // Seed with realistic frequency clusters
  const distribution: Record<string, number> = {
    'webp-converter': 18,
    'compress-pdf': 14,
    'json-beautifier': 11,
    'password-generator': 8,
    'qr-generator': 7,
    'json-diff': 5,
    'unit-converter': 3
  };

  const now = new Date();

  tools.forEach(t => {
    const quantity = distribution[t] || 0;
    for (let i = 0; i < quantity; i++) {
      // randomly offsets timestamps into the past 1-6 days
      const daysOffset = Math.floor(Math.random() * 7);
      const hoursOffset = Math.floor(Math.random() * 24);
      const randomDate = new Date(now.getTime() - (daysOffset * 24 * 60 * 60 * 1000) - (hoursOffset * 60 * 60 * 1000));
      
      seeded.push({
        id: `seed_${Math.random().toString(36).substring(2, 8)}`,
        toolId: t,
        timestamp: randomDate.toISOString()
      });
    }
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  } catch (e) {
    console.error('Seeding dummy telemetry failed', e);
  }

  return seeded;
};

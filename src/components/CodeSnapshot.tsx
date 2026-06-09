import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { 
  Laptop, Sliders, Image as ImageIcon, Download, Copy, RefreshCw, 
  Sparkles, Check, Type, Info, AlignLeft, Shield, Grid, Code, ChevronDown, 
  Monitor, Plus, RefreshCcw, Smile, FileCode, CheckCircle, Flame
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { logToolUsage } from '../utils/toolAnalytics';

// Token interface for our high-fidelity regex-based highlighter
interface Token {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'property' | 'operator' | 'type' | 'builtin' | 'boolean' | 'punctuation' | 'text';
  value: string;
}

// Language Preset types
type PresetLanguage = 'typescript' | 'javascript' | 'python' | 'rust' | 'go' | 'html' | 'css' | 'json' | 'sql' | 'shell';

// Presets mapping of code templates
const CODE_PRESETS: Record<PresetLanguage, { label: string; file: string; code: string }> = {
  typescript: {
    label: 'TypeScript',
    file: 'index.ts',
    code: `import { APIService, Metrics } from "./apex-core";\n\ninterface UserProfile {\n  uid: string;\n  name: string;\n  role: "admin" | "developer" | "guest";\n  isActive: boolean;\n}\n\n// Instantiates high-integrity context logs\nexport async function fetchUserMetrics(user: UserProfile): Promise<Metrics> {\n  const startTime = Date.now();\n  console.log(\`[Core Thread] Resolving telemetry for: \${user.name}\`);\n\n  try {\n    const payload = await APIService.get(\`/v2/metrics/\${user.uid}\`);\n    const duration = Date.now() - startTime;\n    \n    return {\n      records: payload.data,\n      latencyMs: duration,\n      secureSignature: "sha256-5ea7a4ee..."\n    };\n  } catch (error) {\n    throw new Error(\`Metrics resolution crashed: \${error.message}\`);\n  }\n}`
  },
  javascript: {
    label: 'JavaScript',
    file: 'reactor.js',
    code: `// Creative Canvas Particle Animation System\nclass Particle {\n  constructor(x, y, radius, color) {\n    this.x = x;\n    this.y = y;\n    this.radius = radius;\n    this.color = color;\n    this.velocity = {\n      x: (Math.random() - 0.5) * 3,\n      y: (Math.random() - 0.5) * 3\n    };\n  }\n\n  draw(context) {\n    context.beginPath();\n    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);\n    context.fillStyle = this.color;\n    context.fill();\n  }\n\n  update(canvas, context) {\n    this.draw(context);\n    if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {\n      this.velocity.x = -this.velocity.x;\n    }\n    this.x += this.velocity.x;\n  }\n}`
  },
  python: {
    label: 'Python',
    file: 'model.py',
    code: `import torch\nimport torch.nn as nn\n\nclass ApexTransformerBlock(nn.Module):\n    """\n    High-performance modern attention block with pre-layer normalization\n    """\n    def __init__(self, embed_dim, num_heads, dropout=0.1):\n        super().__init__()\n        self.ln1 = nn.LayerNorm(embed_dim)\n        self.ln2 = nn.LayerNorm(embed_dim)\n        self.attn = nn.MultiheadAttention(embed_dim, num_heads, dropout=dropout)\n        self.mlp = nn.Sequential(\n            nn.Linear(embed_dim, 4 * embed_dim),\n            nn.GELU(),\n            nn.Dropout(dropout),\n            nn.Linear(4 * embed_dim, embed_dim)\n        )\n\n    def forward(self, x, mask=None):\n        # Multi-head attention loop\n        norm_x = self.ln1(x)\n        attn_out, _ = self.attn(norm_x, norm_x, norm_x, attn_mask=mask)\n        x = x + attn_out\n        \n        # Multi-layer perceptron flow\n        x = x + self.mlp(self.ln2(x))\n        return x`
  },
  rust: {
    label: 'Rust',
    file: 'main.rs',
    code: `use std::collections::HashMap;\n\npub struct CacheEngine<T> {\n    registryName: String,\n    buffer_size: usize,\n    records: HashMap<String, T>,\n}\n\nimpl<T> CacheEngine<T> {\n    pub fn new(name: &str, limit: usize) -> Self {\n        CacheEngine {\n            registryName: name.to_string(),\n            buffer_size: limit,\n            records: HashMap::with_capacity(limit),\n        }\n    }\n\n    pub fn query_record(&self, key: &str) -> Option<&T> {\n        println!("Searching thread safe registry for [{}].", key);\n        self.records.get(key)\n    }\n}`
  },
  go: {
    label: 'Go',
    file: 'server.go',
    code: `package main\n\nimport (\n\t"encoding/json"\n\t"fmt"\n\t"net/http"\n)\n\ntype ClientResponse struct {\n\tRequestID string            \`json:"requestId"\`\n\tHealthy   bool              \`json:"healthy"\`\n\tMetadata  map[string]string \`json:"meta"\`\n}\n\nfunc healthCheckHandler(w http.ResponseWriter, r *http.Request) {\n\tw.Header().Set("Content-Type", "application/json")\n\tw.WriteHeader(http.StatusOK)\n\t\n\tres := ClientResponse{\n\t\tRequestID: "req_f829c910",\n\t\tHealthy:   true,\n\t\tMetadata:  map[string]string{"env": "production"},\n\t}\n\n\tjson.NewEncoder(w).Encode(res)\n}`
  },
  html: {
    label: 'HTML',
    file: 'card.html',
    code: `<div class="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl relative overflow-hidden group">\n  <!-- Neon background accents -->\n  <div class="absolute -top-24 -left-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-500"></div>\n  \n  <div class="flex items-center gap-4">\n    <div class="p-3 bg-[#0d0d12] border border-cyan-500/20 text-cyan-400 rounded-xl">\n      <svg class="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">\n        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />\n      </svg>\n    </div>\n    <div>\n      <h3 class="text-xs font-mono tracking-widest text-zinc-500 uppercase">System Status</h3>\n      <p class="text-xl font-bold text-zinc-100">Core Engine Engaged</p>\n    </div>\n  </div>\n</div>`
  },
  css: {
    label: 'CSS',
    file: 'glowing-card.css',
    code: `@keyframes holographic-glow {\n  0% { background-position: 0% 50%; }\n  50% { background-position: 100% 50%; }\n  100% { background-position: 0% 50%; }\n}\n\n.card-container {\n  position: relative;\n  border-radius: 16px;\n  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);\n  background-size: 400% 400%;\n  animation: holographic-glow 15s ease infinite;\n  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);\n  padding: 1px; /* Glass stroke */\n}`
  },
  json: {
    label: 'JSON',
    file: 'metadata.json',
    code: `{\n  "appName": "Apex Suite Studio",\n  "version": "4.2.1-lts",\n  "integrityHash": "sha384-NvZjV4gMhFh...",\n  "features": {\n    "offlineSecureExecution": true,\n    "wasmProcessingGrid": true,\n    "compressionBuffers": ["pdf", "png", "webp", "gif"]\n  },\n  "systemLoadMetrics": {\n    "cachedFramesThreshold": 450,\n    "quantizationBitDepth": 8\n  }\n}`
  },
  sql: {
    label: 'SQL',
    file: 'query.sql',
    code: `SELECT\n  u.user_id,\n  u.username,\n  COUNT(t.transaction_id) AS total_transactions,\n  SUM(t.payout_amount) AS total_revenue,\n  ROUND(AVG(t.latency_metric_ms), 2) AS average_latency\nFROM apex_users u\nINNER JOIN secure_ledger_transactions t \n  ON u.user_id = t.authorized_by_id\nWHERE u.status = 'ACTIVE'\n  AND t.payout_date >= NOW() - INTERVAL '30 days'\nGROUP BY u.user_id, u.username\nHAVING SUM(t.payout_amount) > 1000\nORDER BY total_revenue DESC;`
  },
  shell: {
    label: 'Shell / Bash',
    file: 'deploy.sh',
    code: `#!/usr/bin/env bash\n# Real-time deployment pipeline check\n\nset -euo pipefail\nexport NODE_ENV=production\n\necho "==> Locating local workspace repository..."\nif [ ! -f "package.json" ]; then\n  echo "Error: Directory does not contain package manifest." >&2\n  exit 1\nfi\n\necho "==> Engaging build optimization engines..."\nnpm run build --silent\n\necho "==> Deploying container layers to secure production node..."\nheroku docker:release || gcloud run deploy apex-terminal --source .`
  }
};

// Gradient Presets list
const GRADIENTS = [
  { id: 'dusk', label: 'Dusk Sunset', css: 'linear-gradient(135deg, #f97316 0%, #a855f7 50%, #4f46e5 100%)' },
  { id: 'arctic', label: 'Arctic Aurora', css: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)' },
  { id: 'cyberpunk', label: 'Cyber Neon', css: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d5 100%)' },
  { id: 'cotton', label: 'Cotton Candy', css: 'linear-gradient(135deg, #fbcfe8 0%, #ddd6fe 50%, #bae6fd 100%)' },
  { id: 'cosmos', label: 'Obsidian Nebula', css: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 40%, #4c1d95 80%, #09090b 100%)' },
  { id: 'charcoal', label: 'Matte Charcoal', css: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #030712 100%)' },
  { id: 'holographic', label: 'Prism Glass', css: 'linear-gradient(135deg, #818cf8 0%, #f472b6 35%, #fb7185 70%, #38bdf8 100%)' },
  { id: 'retro', label: 'Vintage Coral', css: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 30%, #f97316 70%, #e11d48 100%)' },
  { id: 'none', label: 'Transparent Base', css: 'transparent' }
];

// Highlight theme definitions
interface CodeHighlightTheme {
  name: string;
  background: string;
  text: string;
  comment: string;
  keyword: string;
  string: string;
  number: string;
  function: string;
  type: string;
  builtin: string;
  boolean: string;
  operator: string;
}

const HIGHLIGHT_THEMES: Record<string, CodeHighlightTheme> = {
  onedark: {
    name: 'One Dark Pro',
    background: 'bg-[#282c34]',
    text: '#abb2bf',
    comment: '#5c6370',
    keyword: '#c678dd',
    string: '#98c379',
    number: '#d19a66',
    function: '#61afef',
    type: '#e5c07b',
    builtin: '#4facfe',
    boolean: '#e06c75',
    operator: '#56b6c2'
  },
  dracula: {
    name: 'Dracula',
    background: 'bg-[#282a36]',
    text: '#f8f8f2',
    comment: '#6272a4',
    keyword: '#ff79c6',
    string: '#f1fa8c',
    number: '#bd93f9',
    function: '#50fa7b',
    type: '#8be9fd',
    builtin: '#ffb86c',
    boolean: '#bd93f9',
    operator: '#ff79c6'
  },
  synthwave: {
    name: "Synthwave '84",
    background: 'bg-[#2b213a]',
    text: '#fdfdfd',
    comment: '#848bb3',
    keyword: '#fede5d',
    string: '#ff7edb',
    number: '#f97e72',
    function: '#36f9f6',
    type: '#fe4450',
    builtin: '#00f2fe',
    boolean: '#fede5d',
    operator: '#36f9f6'
  },
  nightowl: {
    name: 'Night Owl',
    background: 'bg-[#011627]',
    text: '#d6deeb',
    comment: '#637777',
    keyword: '#c792ea',
    string: '#ecc48d',
    number: '#f78c6c',
    function: '#82aaff',
    type: '#decb6b',
    builtin: '#addb67',
    boolean: '#ff5874',
    operator: '#7fdbca'
  },
  nord: {
    name: 'Nord Studio',
    background: 'bg-[#2e3440]',
    text: '#d8dee9',
    comment: '#4c566a',
    keyword: '#81a1c1',
    string: '#a3be8c',
    number: '#b48ead',
    function: '#88c0d0',
    type: '#8fbcbb',
    builtin: '#ebcb8b',
    boolean: '#d08770',
    operator: '#81a1c1'
  },
  light: {
    name: 'Winter Minimal (Light)',
    background: 'bg-[#f4f4f5]',
    text: '#27272a',
    comment: '#71717a',
    keyword: '#0f766e',
    string: '#16a34a',
    number: '#ea580c',
    function: '#2563eb',
    type: '#7c3aed',
    builtin: '#db2777',
    boolean: '#b91c1c',
    operator: '#0f766e'
  }
};

// Sequential regex tokenizer
const tokenizeCode = (code: string, lang: PresetLanguage): Token[] => {
  if (!code) return [];

  // Core regular expressions for tokens matching
  const rules = [
    { type: 'comment' as const, regex: /^(\/\/.*|\/\*[\s\S]*?\*\/|#.*)/ },
    { type: 'string' as const, regex: /^("(?:\\"|[^"])*"|'(?:\\'|[^'])*'|`(?:\\`|[^`])*`)/ },
    { type: 'number' as const, regex: /^(0x[0-9a-fA-F]+|\b\d+(?:\.\d+)?\b)/ },
    { type: 'keyword' as const, regex: /^\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|import|export|from|class|extends|new|this|typeof|instanceof|try|catch|finally|throw|async|await|yield|pub|use|mod|let|mut|struct|enum|impl|trait|where|fn|def|elif|lambda|pass|global|nonlocal|raise|except|assert|import|package|go|select|chan|defer|fallthrough|type|map|struct|interface|nil|var|func|default)\b/ },
    { type: 'boolean' as const, regex: /^\b(true|false|null|undefined|nil|True|False|None)\b/ },
    { type: 'builtin' as const, regex: /^\b(console|window|document|process|Object|Array|String|Number|Boolean|Function|Promise|Map|Set|print|len|range|str|int|float|list|dict|tuple|self|fmt|Println|Printf|append|make|panic|recover|error)\b/ },
    { type: 'type' as const, regex: /^\b(string|number|boolean|any|unknown|never|void|UserProfile|Metrics|APIService|Particle|ApexTransformerBlock|CacheEngine|ClientResponse)\b/ },
    { type: 'function' as const, regex: /^([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/ },
    { type: 'punctuation' as const, regex: /^([{}()\[\].,:;])/ },
    { type: 'operator' as const, regex: /^([+\-*/%&|^!=<>:~?]+)/ },
    { type: 'property' as const, regex: /^([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*:)/ },
  ];

  let remaining = code;
  const tokens: Token[] = [];

  while (remaining.length > 0) {
    let matched = false;

    for (const rule of rules) {
      const match = rule.regex.exec(remaining);
      if (match && match.index === 0) {
        tokens.push({ type: rule.type, value: match[1] });
        remaining = remaining.substring(match[1].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Collect standard white space or words until we hit next boundary
      const nextChar = remaining.charAt(0);
      let matchLen = 1;

      // Scan until alphanumeric/regex boundary
      while (matchLen < remaining.length && !rules.some(r => r.regex.test(remaining.substring(matchLen)))) {
        matchLen++;
      }

      tokens.push({ type: 'text', value: remaining.substring(0, matchLen) });
      remaining = remaining.substring(matchLen);
    }
  }

  return tokens;
};

export default function CodeSnapshot() {
  const { t } = useLanguage();
  
  // Custom states
  const [code, setCode] = useState<string>(CODE_PRESETS.typescript.code);
  
  useEffect(() => {
    logToolUsage('code-snapshot');
  }, []);
  const [language, setLanguage] = useState<PresetLanguage>('typescript');
  const [fileName, setFileName] = useState<string>('index.ts');
  const [theme, setTheme] = useState<string>('onedark');
  const [bgType, setBgType] = useState<'gradient' | 'solid'>('gradient');
  const [bgGradient, setBgGradient] = useState<string>('dusk');
  const [bgSolidColor, setBgSolidColor] = useState<string>('#101016');
  const [bgBlobs, setBgBlobs] = useState<boolean>(true);
  const [backdropVisible, setBackdropVisible] = useState<boolean>(true);
  const [windowStyle, setWindowStyle] = useState<'macos' | 'macos-light' | 'windows' | 'retro' | 'none'>('macos');
  const [padding, setPadding] = useState<number>(64);
  const [borderRadius, setBorderRadius] = useState<number>(12);
  const [lineNumbers, setLineNumbers] = useState<boolean>(true);
  const [shadowDepth, setShadowDepth] = useState<'none' | 'soft' | 'heavy' | 'neon'>('heavy');
  const [fontFamily, setFontFamily] = useState<'sans' | 'mono'>('mono');
  const [fontSize, setFontSize] = useState<number>(14);
  const [exporting, setExporting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Custom Canvas Refs for image export bounding
  const canvasStageRef = useRef<HTMLDivElement | null>(null);

  // Sync preset files when select preset language
  const handlePresetSelect = (lang: PresetLanguage) => {
    setLanguage(lang);
    setCode(CODE_PRESETS[lang].code);
    setFileName(CODE_PRESETS[lang].file);
  };

  // Convert canvas and export locally 100% offline
  const handleDownloadImage = async () => {
    if (!canvasStageRef.current) return;
    setExporting(true);
    
    try {
      // Small tick to ensure rendering thread catches up
      await new Promise((resolve) => setTimeout(resolve, 80));
      
      const canvas = await html2canvas(canvasStageRef.current, {
        backgroundColor: null,
        scale: 2.5, // High definition 2x scaling
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `ApexCode_${fileName.split('.')[0] || 'snapshot'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      logToolUsage('code-snapshot');
    } catch (err) {
      console.error("Local PNG render exception:", err);
    } finally {
      setExporting(false);
    }
  };

  // Copy PNG image direct to OS Clipboard
  const handleCopyImageToClipboard = async () => {
    if (!canvasStageRef.current) return;
    setExporting(true);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 80));
      const canvas = await html2canvas(canvasStageRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (clipErr) {
          console.error("Clipboard permission failed, copy SVG/Raw mode instead:", clipErr);
        }
      }, 'image/png');
      
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  // Apply custom theme matching on rendering tokens
  const activeThemeObj = HIGHLIGHT_THEMES[theme] || HIGHLIGHT_THEMES.onedark;

  // Render highlighted spans
  const renderHighlightedCode = () => {
    const tokens = tokenizeCode(code, language);
    return tokens.map((token, i) => {
      let color = activeThemeObj.text;
      
      if (token.type !== 'text') {
        color = activeThemeObj[token.type] || activeThemeObj.text;
      }

      return (
        <span 
          key={i} 
          style={{ color }}
          className={
            token.type === 'comment' 
              ? 'italic opacity-85' 
              : token.type === 'keyword' 
                ? 'font-semibold' 
                : ''
          }
        >
          {token.value}
        </span>
      );
    });
  };

  // Shadow level class generator
  const getShadowClass = () => {
    switch (shadowDepth) {
      case 'none': return 'shadow-none';
      case 'soft': return 'shadow-md shadow-black/30';
      case 'heavy': return 'shadow-2xl shadow-black/85';
      case 'neon': return 'shadow-[0_0_50px_rgba(34,211,238,0.35)] border border-cyan-500/25';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-zinc-300">
      
      {/* Structural Headers */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-850 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold">
              PREMIUM DEVELOPER STUDIO
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Laptop className="w-5 h-5 text-emerald-400" />
            Code Snapshot Canvas
          </h1>
          <p className="text-xs text-zinc-400">
            Design elegant, presentation-ready code tiles beautifully styled for social feeds, documentation, or presentations. 
          </p>
        </div>
        
        {/* CTAs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={handleCopyImageToClipboard}
            disabled={exporting}
            className="flex-1 md:flex-none px-4 py-2 bg-zinc-800 hover:bg-zinc-750 active:scale-95 disabled:opacity-50 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer font-mono shadow-md border border-zinc-700/60"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400 animate-scale-up" />
                <span className="text-green-400">COPIED AS IMAGE!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>COPY TO CLIPBOARD</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleDownloadImage}
            disabled={exporting}
            className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-555 hover:to-cyan-555 active:scale-95 disabled:opacity-50 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer font-mono shadow-lg text-white"
          >
            {exporting ? (
              <>
                <RefreshCcw className="w-4 h-4 animate-spin text-zinc-200" />
                <span>EXPORTING...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>DOWNLOAD FILE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side Control Panel Column */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* General Design parameters Group Card */}
          <div className="p-5 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/95 space-y-4 shadow-xl">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] flex items-center gap-2 border-b border-[#18181b] pb-2">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Canvas Settings
            </h2>

            {/* Quick Presets Select */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Code Template Preset</label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => handlePresetSelect(e.target.value as PresetLanguage)}
                  className="w-full bg-[#07070a] border border-zinc-850 rounded p-2 text-zinc-300 focus:outline-none focus:border-emerald-500/50 appearance-none font-sans"
                >
                  {Object.entries(CODE_PRESETS).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Backdrop controls */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Backdrop Mode</label>
                <div className="flex bg-[#07070a] border border-zinc-850 rounded p-0.5">
                  <button
                    onClick={() => { setBgType('gradient'); setBackdropVisible(true); }}
                    className={`flex-1 py-1 text-center font-semibold rounded text-[10px] uppercase transition-all ${
                      bgType === 'gradient' && backdropVisible
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                    }`}
                  >
                    Gradient
                  </button>
                  <button
                    onClick={() => { setBgType('solid'); setBackdropVisible(true); }}
                    className={`flex-1 py-1 text-center font-semibold rounded text-[10px] uppercase transition-all ${
                      bgType === 'solid' && backdropVisible
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                    }`}
                  >
                    Solid
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Show Outer Canvas</label>
                <button
                  onClick={() => setBackdropVisible(!backdropVisible)}
                  className={`w-full py-1.5 rounded border text-[11px] font-semibold transition-all cursor-pointer ${
                    backdropVisible 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-[#07070a] border-zinc-850 text-zinc-500'
                  }`}
                >
                  {backdropVisible ? 'ENABLED' : 'DISABLED / TRANSPARENT'}
                </button>
              </div>
            </div>

            {/* Gradient Select of Active Gradient list */}
            {bgType === 'gradient' && backdropVisible && (
              <div className="space-y-1.5 text-xs">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Backdrop Preset Gradient</label>
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENTS.filter(g => g.id !== 'none').map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setBgGradient(g.id)}
                      className={`p-1.5 rounded border text-[10px] flex items-center gap-1.5 transition-all text-left truncate cursor-pointer ${
                        bgGradient === g.id 
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold' 
                          : 'bg-[#07070a] border-zinc-850 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0" 
                        style={{ background: g.css }}
                      />
                      <span className="truncate">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Solid color Select if active solid background */}
            {bgType === 'solid' && backdropVisible && (
              <div className="space-y-1.5 text-xs">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Solid Frame Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={bgSolidColor}
                    onChange={(e) => setBgSolidColor(e.target.value)}
                    className="w-10 h-8 rounded bg-[#07070a] border border-zinc-800 p-0.5 cursor-pointer appearance-none"
                  />
                  <input
                    type="text"
                    value={bgSolidColor}
                    onChange={(e) => setBgSolidColor(e.target.value)}
                    placeholder="#101016"
                    className="flex-1 bg-[#07070a] border border-zinc-850 rounded p-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            )}

            {/* Dynamic blobs toggle */}
            {backdropVisible && (
              <div className="flex items-center justify-between py-1 border-t border-zinc-850/50 pt-2 text-xs">
                <span className="text-zinc-400">Ambient Neon Glass Blobs</span>
                <button
                  type="button"
                  onClick={() => setBgBlobs(!bgBlobs)}
                  className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                    bgBlobs 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                  }`}
                >
                  {bgBlobs ? 'ACTIVE' : 'DEACTIVATED'}
                </button>
              </div>
            )}

          </div>

          {/* Window Shell Design Parameters */}
          <div className="p-5 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/95 space-y-4 shadow-xl">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] flex items-center gap-2 border-b border-[#18181b] pb-2">
              <Monitor className="w-3.5 h-3.5 text-emerald-400" />
              Window Shell Options
            </h2>

            {/* Window Chrome Style Selection */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Chrome Shell Frame</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'macos', label: 'macOS Dark' },
                  { id: 'macos-light', label: 'macOS Light' },
                  { id: 'windows', label: 'Windows Modern' },
                  { id: 'retro', label: 'Retro Terminal' },
                  { id: 'none', label: 'None (Plain Code)' }
                ].map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => setWindowStyle(ws.id as any)}
                    className={`p-1.5 rounded border text-[10px] font-semibold text-center cursor-pointer transition-all ${
                      windowStyle === ws.id 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                        : 'bg-[#07070a] border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {ws.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom file input badge */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Window File Title</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="index.ts"
                  className="w-full bg-[#07070a] border border-zinc-850 rounded p-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block font-mono">Syntax Highlight Theme</label>
                <div className="relative">
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full bg-[#07070a] border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50 appearance-none font-sans"
                  >
                    {Object.entries(HIGHLIGHT_THEMES).map(([key, value]) => (
                      <option key={key} value={key}>{value.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Padding slider & border radius */}
            <div className="space-y-3.5 pt-1 border-t border-zinc-850/50 pt-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Canvas Padding</label>
                  <span className="text-[10px] font-mono text-zinc-400 font-semibold">{padding}px</span>
                </div>
                <input
                  type="range"
                  min={16}
                  max={96}
                  step={16}
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-900 h-1 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Window Rounded Corners</label>
                  <span className="text-[10px] font-mono text-zinc-400 font-semibold">{borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={4}
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-900 h-1 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Font Font Size</label>
                  <span className="text-[10px] font-mono text-zinc-400 font-semibold">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={18}
                  step={1}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-900 h-1 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Drop Shadows and line counting toggles */}
            <div className="grid grid-cols-2 gap-4 pt-1 border-t border-zinc-850/50 pt-3 text-xs">
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Shadow Depth</label>
                <div className="relative">
                  <select
                    value={shadowDepth}
                    onChange={(e) => setShadowDepth(e.target.value as any)}
                    className="w-full bg-[#07070a] border border-zinc-850 rounded p-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-emerald-500/50 appearance-none font-sans"
                  >
                    <option value="none">None (Flat)</option>
                    <option value="soft">Soft Ambient</option>
                    <option value="heavy">Heavy Pro Shadow</option>
                    <option value="neon">Cyan Neon Glow</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Line Numbers</label>
                <button
                  onClick={() => setLineNumbers(!lineNumbers)}
                  className={`w-full py-1.5 rounded border text-[11px] font-semibold transition-all cursor-pointer ${
                    lineNumbers 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-[#07070a] border-zinc-850 text-zinc-500'
                  }`}
                >
                  {lineNumbers ? 'SHOWN' : 'HIDDEN'}
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* Right Side Editing & Canvas Core Area Column */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Code input text area panel */}
          <div className="p-4 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/95 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block font-bold flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-[#a855f7]" />
                Interactive Script Input
              </span>
              <span className="text-[9px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-820 px-2 py-0.5 rounded">
                ⚡ LIVE RENDER REAL-TIME
              </span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={9}
              className="w-full bg-[#050508] border border-zinc-850 rounded p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/40 resize-y block leading-relaxed"
              spellCheck="false"
              placeholder="// Paste or write your source script code blocks here..."
            />
            
            <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono pt-1">
              <span>Length: {code.length} chars</span>
              <span>LinesCount: {code.split('\n').length} lines</span>
            </div>
          </div>

          {/* Core Interactive Export Canvas Window */}
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block font-bold">
              Canvas Live Preview Render (HD 2x Output Area)
            </span>
            
            {/* Scroll wrapper box to prevent layout cropping on tablets or high padding widths */}
            <div className="w-full overflow-x-auto rounded-lg border border-zinc-850 bg-[#060608] p-4 flex items-center justify-center shadow-inner">
              
              {/* Outer Bounding container element designated for capturing via html2canvas */}
              <div 
                ref={canvasStageRef}
                id="apex-snapshot-target"
                className="relative overflow-hidden transition-all duration-300 w-full max-w-[800px] flex-shrink-0"
                style={{
                  padding: backdropVisible ? `${padding}px` : '0px',
                  background: backdropVisible 
                    ? (bgType === 'gradient' 
                        ? (GRADIENTS.find(g => g.id === bgGradient)?.css || 'transparent') 
                        : bgSolidColor)
                    : 'transparent',
                }}
              >
                
                {/* Visual Ambient Blur blobs in background if enabled */}
                {backdropVisible && bgBlobs && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-color-dodge opacity-30 select-none">
                    <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-cyan-400 blur-3xl animate-pulse" />
                    <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-purple-500 blur-3xl animate-pulse" />
                  </div>
                )}

                {/* macOS mockup layout Window Frame style element */}
                <div 
                  className={`w-full overflow-hidden flex flex-col transition-all border border-white/5 shadow-2xl relative ${
                    HIGHLIGHT_THEMES[theme]?.background || 'bg-zinc-950'
                  } ${getShadowClass()}`}
                  style={{ borderRadius: `${borderRadius}px` }}
                >
                  
                  {/* Decorative Windows/macOS title-bars */}
                  {windowStyle !== 'none' && (
                    <div className="px-4 py-3 flex items-center justify-between border-b border-black/15 bg-black/10 select-none relative">
                      
                      {/* Left Window actions dots */}
                      {windowStyle.startsWith('macos') && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-[#ff5f56] opacity-90 border border-black/10"></span>
                          <span className="w-3 h-3 rounded-full bg-[#ffbd2e] opacity-90 border border-black/10"></span>
                          <span className="w-3 h-3 rounded-full bg-[#27c93f] opacity-90 border border-black/10"></span>
                        </div>
                      )}

                      {/* Left dots for retro terminal */}
                      {windowStyle === 'retro' && (
                        <span className="text-[10px] text-green-400 font-mono uppercase font-black tracking-widest animate-pulse flex items-center gap-1">
                          ● ONLINE
                        </span>
                      )}

                      {/* Left space offset for flat modern windows */}
                      {windowStyle === 'windows' && (
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-400 font-mono">
                          <FileCode className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Console Workspace</span>
                        </div>
                      )}

                      {/* Custom Title centered */}
                      <span className={`text-[11px] font-semibold font-mono tracking-wide absolute left-1/2 -translate-x-1/2 ${
                        windowStyle === 'macos-light' ? 'text-zinc-650' : 'text-zinc-400'
                      }`}>
                        {fileName}
                      </span>
                      
                      {/* Right-aligned extension badges */}
                      {windowStyle.startsWith('macos') && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded capitalize ${
                          windowStyle === 'macos-light' ? 'bg-black/5 text-zinc-500' : 'bg-white/5 text-zinc-400'
                        }`}>
                          {language}
                        </span>
                      )}

                      {/* Windows Window controls actions */}
                      {windowStyle === 'windows' && (
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-0.5 bg-zinc-550 block"></span>
                          <span className="w-2.5 h-2 border border-zinc-550 block"></span>
                          <span className="text-zinc-550 font-sans text-xs">×</span>
                        </div>
                      )}

                      {/* Retro prompt design */}
                      {windowStyle === 'retro' && (
                        <span className="text-[9px] font-mono text-zinc-500">
                          SYS_GRID_READY
                        </span>
                      )}

                    </div>
                  )}

                  {/* Highlight code contents wrapper */}
                  <div className="p-5 flex items-start gap-4 overflow-x-auto relative">
                    
                    {/* Line Numbers indices column vertical rail */}
                    {lineNumbers && (
                      <div className="select-none text-right font-mono text-xs opacity-35 border-r border-white/5 pr-3 pt-0.5 h-full space-y-1 sm:block hidden min-w-[20px]" style={{ fontSize: `${fontSize}px` }}>
                        {code.split('\n').map((_, index) => (
                          <div key={index}>{index + 1}</div>
                        ))}
                      </div>
                    )}

                    {/* Highlighted text container box */}
                    <pre 
                      className="flex-1 font-semibold leading-relaxed overflow-x-auto whitespace-pre block text-left"
                      style={{ 
                        fontFamily: fontFamily === 'mono' ? '"JetBrains Mono", "Fira Code", monospace' : 'ui-sans-serif, system-ui',
                        fontSize: `${fontSize}px`,
                        color: activeThemeObj.text
                      }}
                    >
                      <code>{renderHighlightedCode()}</code>
                    </pre>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* Helpful Tips alert guidance cards */}
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-900 flex gap-3 text-xs leading-normal">
            <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-zinc-200">Tips on Quality Exports</p>
              <p className="text-zinc-500 leading-normal">
                Exports are rendered with standard <span className="font-mono text-zinc-400">2.5× Retina Scaling</span> to keep code blocks crystal-clear at high desktop resolutions. You can paste custom code, configure padding boundaries, turn off backgrounds to output raw code frames with transparent PNG grids.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

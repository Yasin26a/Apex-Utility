import React, { useState } from 'react';
import { 
  BookOpen, Search, Clock, ArrowRight, Tag, HelpCircle, 
  Terminal, Sparkles, User, Calendar, ExternalLink, ThumbsUp, 
  ChevronRight, ArrowLeft, Bookmark, Heart, Share2, MessageSquare,
  QrCode, FileCode, Wand2, Shield
} from 'lucide-react';
import { ActiveTab } from '../types';

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  topic: string;
  icon: typeof BookOpen;
  readTime: string;
  date: string;
  author: string;
  role: string;
  relatedTool: ActiveTab;
  tags: string[];
  content: React.ReactNode;
}

interface GuidesProps {
  onTabChange: (tab: ActiveTab) => void;
}

export default function Guides({ onTabChange }: GuidesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({
    'wasm-pdf': 28,
    'webp-demystified': 19,
    'crypto-passwords': 35,
    'seo-sitemaps': 42,
    'local-ai': 51,
    'qr-architecture': 48,
    'json-ast-diff': 31,
    'raster-vectorizer': 64,
    'exif-metadata-stripping': 57
  });
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});
  const [suggestionName, setSuggestionName] = useState('');
  const [suggestionTopic, setSuggestionTopic] = useState('');
  const [submittedSuggestion, setSubmittedSuggestion] = useState(false);

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userLiked[id]) {
      setLikes(prev => ({ ...prev, [id]: prev[id] - 1 }));
      setUserLiked(prev => ({ ...prev, [id]: false }));
    } else {
      setLikes(prev => ({ ...prev, [id]: prev[id] + 1 }));
      setUserLiked(prev => ({ ...prev, [id]: true }));
    }
  };

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestionName && suggestionTopic) {
      setSubmittedSuggestion(true);
      setTimeout(() => {
        setSuggestionName('');
        setSuggestionTopic('');
        setSubmittedSuggestion(false);
      }, 2500);
    }
  };

  const articles: Article[] = [
    {
      id: 'wasm-pdf',
      title: 'Under the Hood of Client-Side WASM PDF Compression',
      excerpt: 'Learn how WebAssembly compilers and bicubic canvas scaling shrink bloated PDF documents from 50MB down to the 2.0MB ATS threshold without flattening vector text layers.',
      topic: 'Document Engineering',
      icon: Terminal,
      readTime: '6 min read',
      date: 'June 10, 2026',
      author: 'APEX RESEARCH',
      role: 'Lead Architect',
      relatedTool: 'compress-pdf',
      tags: ['WASM', 'PDF', 'WebAssembly', 'ATS Optimization'],
      content: (
        <div className="space-y-6 font-sans text-sm text-zinc-300 leading-relaxed text-justify">
          <p>
            For engineering candidates and creators alike, uploading portfolios or detailed PDF curriculum vitae to enterprise Applicant Tracking Systems (ATS) can be incredibly challenging. The master database files created by robust software systems like Adobe InDesign or Figma often exceed standard 2MB uploading limits. This is because these files embed massive structural components: high-density pixel layers, multi-megabyte outline tables, and complex vector nodes.
          </p>
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 font-mono text-[11px] text-zinc-400 space-y-2">
            <div className="text-zinc-200 uppercase tracking-widest font-extrabold text-[9px] flex items-center gap-1.5 mb-1 text-brand">
              <Terminal className="w-3 h-3" />
              <span>Diagnostic Memory Mapping</span>
            </div>
            <div>[INIT] Client PDF uploaded to browser container heap</div>
            <div>[INFO] Scanning cross-reference dictionary blocks (xref table)</div>
            <div>[INFO] Found 14 high-density graphic assets (43.2 MB total weight)</div>
            <div>[OPTIMIZE] Triggering bicubic downsampling engine: Target DPI = 150</div>
            <div>[WRITE] Output PDF buffer generated in-memory. Result: 1.84 MB (95% shrank)</div>
          </div>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            Why Standard Online Flattening Ruin Resumes
          </h3>
          <p>
            Traditional PDF downscalers solve bloating by simply converting every page of your document into a giant flat PNG image. While this forces the size below the limit, it introduces a severe structural flaw: <strong className="text-white underline">it completely strips vector text hierarchies.</strong> Crawler bots deployed by ATS networks cannot run OCR on low-quality flat images efficiently. This means your achievements, layout elements, and keyword strings will be invisible to recruiters, resulting in automated rejections.
          </p>
          <p>
            To address this, our localized tool targets PDF dictionaries. It parses document components, finds redundant font files, compresses internal byte offsets, and downsamples heavy assets using a 2D canvas interpolation pipeline. This maintains perfect text outline paths, keeping your files searchable and compliant.
          </p>
          <blockquote className="border-l-2 border-brand/50 pl-4 py-1 italic text-xs text-zinc-400">
            "By utilizing client-side WebAssembly, developer workforces can optimize secure corporate reports or job resumes inside an isolated browser environment, with zero risk of database leakage."
          </blockquote>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            Step-by-Step Optimization Best Practices
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-white">Verify Native OCR:</strong> Ensure the source PDF contains real selectable text. If you can double-click and copy words inside your browser, the parser can index it.
            </li>
            <li>
              <strong className="text-white">Isolate Target DPI:</strong> For standard job submissions, 150 DPI is the sweet spot. It delivers extreme size reduction while keeping screen fonts crisp.
            </li>
            <li>
              <strong className="text-white">Avoid Password Walls:</strong> Decrypt locked files before feeding them into client-side compilers, as locked dictionaries prevent standard index parsing.
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'webp-demystified',
      title: 'WebP Format Demystified: Transparent PNG vs Progressive JPG',
      excerpt: 'Explore the internal layout differences, compression speeds, and transparency configurations between modern WebP codecs and legacy layout files.',
      topic: 'Graphics Optimization',
      icon: Sparkles,
      readTime: '5 min read',
      date: 'June 08, 2026',
      author: 'APEX RESEARCH',
      role: 'Frontend Architect',
      relatedTool: 'webp-converter',
      tags: ['WebP', 'PNG', 'Graphics', 'Performance'],
      content: (
        <div className="space-y-6 font-sans text-sm text-zinc-300 leading-relaxed text-justify">
          <p>
            WebP, introduced by Google, has quickly become the web standard for high-performance images. It provides lossless and lossy compression parameters that outperform the oldest formats: PNG and JPG. WebP images are typically 26% smaller than PNGs and up to 34% smaller than equivalent JPGs, all while preserving alpha transparency channels.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-center">
              <span className="block text-[10px] font-mono text-zinc-500 uppercase">Legacy JPG</span>
              <span className="font-heading text-base font-black text-red-400">Heavy Weight</span>
              <span className="block text-[9px] text-zinc-500 mt-1">No Transparency</span>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-center">
              <span className="block text-[10px] font-mono text-zinc-500 uppercase">Transparent PNG</span>
              <span className="font-heading text-base font-black text-orange-400">Bloated Bytes</span>
              <span className="block text-[9px] text-zinc-500 mt-1">High fidelity</span>
            </div>
            <div className="p-3 bg-zinc-950 border border-brand/20 rounded-lg text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-brand/5 pointer-events-none" />
              <span className="block text-[10px] font-mono text-zinc-400 uppercase">Modern WebP</span>
              <span className="font-heading text-base font-black text-brand">Ultra Compact</span>
              <span className="block text-[9px] text-brand/80 mt-1">High fidelity & Alpha</span>
            </div>
          </div>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            How the Browser Rasterizes WebP Offline
          </h3>
          <p>
            When utilizing our WebP converter, your graphics are never processed by external server-side systems. The app mounts a virtual <span className="font-mono text-zinc-200">OffscreenCanvas</span> worker thread, which receives your source image bytes, decodes the pixel structures, and projects the variables onto a 2D matrix canvas. From there, we export the files natively using highly specialized browser rendering algorithms.
          </p>
          <p>
            This decentralized setup ensures you can process client brand elements, mockups, or sensitive receipts without worrying about network snooping or server-side breaches.
          </p>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            Key Formatting Differences to Remember
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-white">Lossy vs. Lossless:</strong> Use lossy mode for photography to maximize space savings. For UI wireframes, logos, or typography illustrations, choose lossless mode to keep clean gradients and pixel-perfect transparency.
            </li>
            <li>
              <strong className="text-white">Decoding Overhead:</strong> While WebP provides much smaller file sizes, decoding it requires slightly more CPU power than traditional JPGs. However, the massive page-load speedups far outweigh this minor overhead.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'crypto-passwords',
      title: 'Mastering Front-End Cryptography: Secure Key Conversions & Entropy',
      excerpt: 'Learn the math behind the Web Crypto API, password crack times, and how to verify file integrity locally without exposing private databases.',
      topic: 'Frontend Security',
      icon: Bookmark,
      readTime: '7 min read',
      date: 'June 05, 2026',
      author: 'APEX RESEARCH',
      role: 'Security Specialist',
      relatedTool: 'password-generator',
      tags: ['Security', 'Cryptography', 'Web Crypto', 'Entropy'],
      content: (
        <div className="space-y-6 font-sans text-sm text-zinc-300 leading-relaxed text-justify">
          <p>
            Many developers make the mistake of using basic, predictable algorithms to generate passwords or hash digital files. In standard programming, function calls like <span className="font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900 text-brand">Math.random()</span> are pseudorandom. This means their outputs can be predicted by modern analysis tools, leaving your user accounts, cloud servers, and directories vulnerable to exploit.
          </p>
          <blockquote className="border-l-2 border-brand/50 pl-4 py-1 italic text-xs text-zinc-400">
            "Our security tool utilizes the cryptographically secure Web Crypto interface, which taps directly into operating system entropy sources. This guarantees that your passwords are brute-force resistant."
          </blockquote>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            Understanding Password Entropy Formulas
          </h3>
          <p>
            Entropy is measured in bits. It quantifies how difficult a password is to guess or brute-force by evaluating its total possibilities mathematically. The calculation follows this standard formula:
          </p>
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 font-mono text-[12px] text-zinc-300 text-center">
            E = L &times; log₂ ( P )
          </div>
          <p className="text-xs text-zinc-400 leading-normal">
            Where <span className="font-mono text-white">L</span> is the total character length representation, and <span className="font-mono text-white">P</span> is the maximum possible pool of characters selected (e.g., 26 for lowercase, 52 for mixed case, 62 with numbers, and 94 with symbols).
          </p>
          <p>
            To establish secure boundaries:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-white">Below 50 Bits:</strong> Highly insecure. These standard configurations can be cracked in minutes by basic GPU systems.
            </li>
            <li>
              <strong className="text-white">60 to 75 Bits:</strong> Medium protection. Safe for average daily forums but insufficient for advanced bank databases.
            </li>
            <li>
              <strong className="text-white">Above 80 Bits:</strong> Cryptographically shielded. These configurations require trillions of years to guess with current supercomputers.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'seo-sitemaps',
      title: 'The Complete SEO Sitemap Blueprint & Structural Indexing',
      excerpt: 'A comprehensive checklist on how crawler bots index dynamic subpages, schema prioritization, and how our offline XML tool boosts organic rankings.',
      topic: 'SEO & Growth',
      icon: BookOpen,
      readTime: '4 min read',
      date: 'May 28, 2026',
      author: 'APEX RESEARCH',
      role: 'Growth Strategist',
      relatedTool: 'sitemap-seo',
      tags: ['SEO', 'XML Sitemaps', 'Indexing', 'Search Console'],
      content: (
        <div className="space-y-6 font-sans text-sm text-zinc-300 leading-relaxed text-justify">
          <p>
            A high-fidelity XML sitemap serves as a structured map for Google, Bing, and other search engines to index your website efficiently. Rather than leaving index structures to chance, publishing an explicit XML blueprint guarantees that new routes, tool modules, and blog posts are indexed and ranked.
          </p>
          <p>
            Our generator parses dynamic paths, normalizes trailing slashes, and formats files to comply with official Schema.org standards. It outputs clean grids of XML coordinates that search engine crawlers can scan in milliseconds.
          </p>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            Best Practices for XML Sitemap Submissions
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-white">Limit Sitemap Bloat:</strong> Google allows up to 50,000 URLs or a maximum 50MB uncompressed file weight per sitemap. If your application exceeds this, divide paths across index blocks.
            </li>
            <li>
              <strong className="text-white">Target High Priority:</strong> Assign high priority values (e.g., <span className="font-mono">1.0</span> or <span className="font-mono">0.9</span>) only to core landing hubs and utility workspaces. Overusing high priorities across all matching URLs confuses crawler weighting systems.
            </li>
            <li>
              <strong className="text-white">Keep Changefreqs Accurate:</strong> Set blog pages to update "weekly" and tools to "monthly" to match actual content updates, preventing bots from wasting scan cycles.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'local-ai',
      title: 'Decentralized AI: Real-Time Local Audio Transcription with Client-Side Whisper',
      excerpt: 'How modern browsers leverage WebGL, Web Audio API, and WebAssembly to transcribe high-fidelity audio files entirely offline, preserving maximum data privacy with zero-cost servers.',
      topic: 'Local AI & WASM',
      icon: Sparkles,
      readTime: '6 min read',
      date: 'June 12, 2026',
      author: 'APEX RESEARCH',
      role: 'Lead AI Architect',
      relatedTool: 'ai-transcriber',
      tags: ['Local AI', 'Whisper', 'WebAssembly', 'WASM'],
      content: (
        <div className="space-y-6 font-sans text-sm text-zinc-300 leading-relaxed text-justify">
          <p>
            Machine Learning (ML) has historically lived behind walled gardens: massive cloud server farms, expensive REST API gateways, and specialized hardware. For developers and users transcribing sensitive discussions, brainstorming loops, or audio interviews, sending raw file streams to remote servers introduces serious security liabilities—along with high API pricing constraints.
          </p>
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 font-mono text-[11px] text-zinc-400 space-y-2">
            <div className="text-zinc-200 uppercase tracking-widest font-extrabold text-[9px] flex items-center gap-1.5 mb-1 text-brand">
              <Sparkles className="w-3 h-3 text-brand" />
              <span>In-Browser Transformer Execution</span>
            </div>
            <div>[INIT] Web Audio Context initialized at 16000Hz sampling rate</div>
            <div>[MODEL] Downloading ONNX quantized weights (79 MB / Whisper-Tiny)</div>
            <div>[DEVICE] Compiling WebGL shader matrices for parallel compute</div>
            <div>[TRANSCRIPTION] Processing speech segment: "Leveraging local web workers..."</div>
            <div>[SUCCESS] Digital text stream flushed to active document sandbox: 100% Secure</div>
          </div>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            How Client-Side Transformers Work in a Browser Tab
          </h3>
          <p>
            With the rapid optimization of the ONNX Runtime and compiled WebAssembly, modern web browsers can now execute complex deep neural networks like OpenAI's Whisper model locally. In our custom <strong>AI Audio Transcriber</strong> workspace, your audio bytes are decoded via the browser's native <span className="font-mono text-zinc-200">AudioContext</span> API, downsampled to a monophonic 16kHz float channel, and fed directly into the model's tensor layers compiled to run on WebGL or WebGPU.
          </p>
          <p>
            Because the weights are cached inside the browser's indexedDB repository on the initial load, subsequent audio transcriptions take place in mere seconds—completely offline and private.
          </p>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            Advantages of Decentralized Browser AI
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-white">Absolute Privacy:</strong> Your voice memos, legal audio documents, and business meetings never travel over the internet, remaining 100% confidential.
            </li>
            <li>
              <strong className="text-white">Zero Maintenance Costs:</strong> Since the user's local device handles the compute loads, you pay no server maintenance fees or recurring API credits.
            </li>
            <li>
              <strong className="text-white">Predictable Latency:</strong> Offline pipelines bypass traditional network bottlenecks, maintaining fluid performance regardless of network status.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'qr-architecture',
      title: 'Decoding QR Code Core Architecture: Error Correction Codes & High-Contrast Scans',
      excerpt: 'Unpack the mathematics of Reed-Solomon error correction codes, finder patterns, and quiet-zone specifications used to compile resilient vectors offline.',
      topic: 'Vector Mathematics',
      icon: QrCode,
      readTime: '5 min read',
      date: 'June 13, 2026',
      author: 'APEX RESEARCH',
      role: 'Lead Cryptographer',
      relatedTool: 'qr-generator',
      tags: ['Cryptography', 'QR Code', 'Reed-Solomon', 'Vector Math'],
      content: (
        <div className="space-y-6 font-sans text-sm text-zinc-300 leading-relaxed text-justify">
          <p>
            Quick Response (QR) codes are ubiquitous, bridging raw physical mediums with instant high-speed digital networks. But underneath their blocky monochrome surfaces lies a highly resilient mathematical apparatus. Originally designed for industrial automotive parts tracking, modern custom-branded QR generators must balance raw scan accuracy with clean visual aesthetics.
          </p>
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 font-mono text-[11px] text-zinc-400 space-y-2 text-left">
            <div className="text-zinc-200 uppercase tracking-widest font-extrabold text-[9px] flex items-center gap-1.5 mb-1 text-brand">
              <QrCode className="w-3.5 h-3.5 text-brand" />
              <span>QR Vector Parser Diagnosis</span>
            </div>
            <div>[INIT] Compiling QR matrix character payload: "https://apexutility.live"</div>
            <div>[MATH] Generating Reed-Solomon polynomial correction blocks</div>
            <div>[ECC_MODE] Configured for LEVEL_H (30% total recovery tolerance)</div>
            <div>[MASK] Selecting optimal matrix grid mask reference pattern #5</div>
            <div>[RASTER] 33x33 matrix buffer compiled as layered scalable vectors</div>
          </div>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            How Reed-Solomon Math Repels Physical Smudges
          </h3>
          <p>
            The secret to a QR code's remarkable resilience is <strong>Reed-Solomon Error Correction</strong>. By oversampling the underlying raw string bits into custom polynomial correction blocks, the matrix can remain readable even when up to 30% of the graphic is physically scratched, stained, or covered by a custom brand logo icon.
          </p>
          <p>
            There are four distinct error correction levels designed for different deployment profiles:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-white">Level L (Low):</strong> Tolerates roughly 7% damage. It produces the sparsest, simplest matrix dots ideal for high-density URLs.
            </li>
            <li>
              <strong className="text-white">Level M (Medium):</strong> Tolerates roughly 15% damage. This is the industrial default balance configuration.
            </li>
            <li>
              <strong className="text-white">Level Q (Quartile):</strong> Tolerates roughly 25% damage. Essential for rough outdoor poster prints or high-wear business cards.
            </li>
            <li>
              <strong className="text-white">Level H (High):</strong> Tolerates up to 30% structural damage. It yields high-density grids but supports prominent custom logo inserts directly centered on the canvas.
            </li>
          </ul>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            The Three Pillars of Instant Camera Recognition
          </h3>
          <p>
            For a smartphone or terminal scanner to instantly identify a QR matrix in any orientation, they rely on three standard geometric anchors:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-white">Finder Patterns:</strong> The three dominant concentric square blocks in the corners. They calibrate scale, position, and absolute canvas rotation.
            </li>
            <li>
              <strong className="text-white">The Quiet Zone:</strong> A mandatory bare border surrounding the code. Without this high-contrast frame, scanner software gets confused by nearby graphics or text blocks.
            </li>
            <li>
              <strong className="text-white">Alignment Patterns:</strong> Smaller square clusters that assist in correcting perspective distortions when scanning at an extreme angle.
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'json-ast-diff',
      title: 'JSON Micro-Optimizations: AST Parsing, Minification Speeds, and Visual Structural Diffs',
      excerpt: 'Deep-dive into Abstract Syntax Tree (AST) tokenization, performance metrics of lexical analysis, and how to spot nested JSON drift programmatically.',
      topic: 'Data Serialization',
      icon: FileCode,
      relatedTool: 'json-diff',
      readTime: '6 min read',
      date: 'June 12, 2026',
      author: 'APEX RESEARCH',
      role: 'Lead Systems Developer',
      tags: ['JSON', 'AST Parser', 'Performance', 'Beautify'],
      content: (
        <div className="space-y-6 font-sans text-sm text-zinc-300 leading-relaxed text-justify">
          <p>
            JSON (JavaScript Object Notation) forms the operational spine of nearly every modern API. From small server microservices to monolithic databases, gigabytes of raw records flow as unstructured strings across global networks. When these files contain deeply nested hierarchies, tracking slight schema changes manually becomes virtually impossible.
          </p>
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 font-mono text-[11px] text-zinc-400 space-y-2 text-left">
            <div className="text-zinc-200 uppercase tracking-widest font-extrabold text-[9px] flex items-center gap-1.5 mb-1 text-brand">
              <FileCode className="w-3.5 h-3.5 text-brand" />
              <span>Lexical Analyzer & AST Mapper Output</span>
            </div>
            <div>[STREAM] Parsing 102,400 raw byte characters</div>
            <div>[TOKENIZE] Emitted 8,412 visual tokens (CurlyBraceOpen, Key, Value, ArrayClose)</div>
            <div>[TREE] Abstract Syntax Tree compiled in 1.48 ms</div>
            <div>[COMPARE] Diff running... Row 45: Key "api_version" drifted from 1.0.0 to 1.1.0</div>
            <div>[SYNC] Matching objects paired perfectly. Drift isolated successfully</div>
          </div>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            How Browsers Tokenize Complex JSON Strings
          </h3>
          <p>
            Under the hood of any high-performance beautification utility or structural diff viewer, the engine must convert primitive characters into tokenized nodes. Rather than doing basic regular expression replacements (which easily fail on edge-case quoting, arrays, or double-escapes), our parser uses a state-machine lexical scanner.
          </p>
          <p>
            This parser constructs an <strong>Abstract Syntax Tree (AST)</strong>. Each branch in this tree represents a concrete JavaScript primitive: lists, variables, floats, or objects. By structurally comparing two independent trees, our algorithm highlights actual functional changes while completely ignoring surface-level whitespacing or line-break drift between files.
          </p>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            JSON Best Practices for Web Developers
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-white">Strict Spec Adherence:</strong> Ensure key characters are always wrapped in double quotes. Single quoting or trailing commas are invalid configurations that immediately break standard AST tokenizers.
            </li>
            <li>
              <strong className="text-white">Strategic Minification:</strong> When transmitting data blocks over networks, remove redundant spaces. Minification can shrink raw data packets by 20% to 30% before standard network gzip stream compressions.
            </li>
            <li>
              <strong className="text-white font-semibold">Keys Normalization:</strong> Keep object key orders deterministic during serialization to facilitate instant line comparisons and cache matches on proxy server pipelines.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'raster-vectorizer',
      title: 'Modern Vector Physics: Converting Raster Bitmaps to Clean SVG Paths in Vanilla JS',
      excerpt: 'Explore edge-detection formulas, Bezier fitting algorithms, and the benefits of browser-native canvas raster-to-vector processing.',
      topic: 'Graphics Engine',
      icon: Wand2,
      relatedTool: 'image-vectorizer',
      readTime: '7 min read',
      date: 'June 11, 2026',
      author: 'APEX RESEARCH',
      role: 'Core Graphics Engineer',
      tags: ['SVG', 'Vectorization', 'Bezier Math', 'Offscreen Canvas'],
      content: (
        <div className="space-y-6 font-sans text-sm text-zinc-300 leading-relaxed text-justify">
          <p>
            Raster images (PNGs, JPEGs) represent digital illustrations as coordinate grids of stationary, static colored pixels. While this is great for highly complex photography, simple icons, wireframes, and logos pixelate, blur, and lose fidelity when scaled up on high-density Retina or 4K layouts.
          </p>
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 font-mono text-[11px] text-zinc-400 space-y-2 text-left">
            <div className="text-zinc-200 uppercase tracking-widest font-extrabold text-[9px] flex items-center gap-1.5 mb-1 text-brand">
              <Wand2 className="w-3.5 h-3.5 text-brand" />
              <span>Vectorizer Pipeline Telemetry</span>
            </div>
            <div>[LOAD] Source image dimension mapping: 512x512 pixels</div>
            <div>[IMAGE] Extracting red, green, blue, alpha luminance arrays</div>
            <div>[EDGE] Calculating pixel gradients via Sobel-operator filters</div>
            <div>[FITTING] Optimizing cubic Bezier outline tracks (Tolerance: 0.8)</div>
            <div>[OUTPUT] Compiled 14 path loops into high-performance SVG source</div>
          </div>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            Bezier Curve Fitting: The Math of Infinitely Scalable Art
          </h3>
          <p>
            Tracing raster paths is a multi-stage math problem. The vectorizer must find bounding edges where pixel colors transition dramatically, isolate those paths into contiguous trace coordinates, and fit those rigid pixel tracks into fluid <strong>Quadratic or Cubic Bezier Curves</strong>.
          </p>
          <p>
            A cubic Bezier curve is defined by four coordinate points: a starting node, an ending node, and two independent steering anchor control points. The formula solves for smooth transitions using this polynomial equation:
          </p>
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-100/10 font-mono text-[12px] text-zinc-300 text-center">
            {"B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃"}
          </div>
          <p className="text-xs text-zinc-400 leading-normal">
            By finding optimal control anchors for parameter <span className="font-mono text-white">t</span> within the bounds of 0 and 1, our algorithm synthesizes crisp path variables that scale, rotate, and warp infinitely without ever generating pixelated artifacts.
          </p>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            The Performance Wins of Native SVG Layouts
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-white font-semibold">Infinite Scalability:</strong> Render logos on massive billboard scales or tiny mobile footers using the exact same light byte footprint.
            </li>
            <li>
              <strong className="text-white font-semibold">DOM Manipulation:</strong> Since SVGs are standard XML, developers can target individual path layers with standard CSS styling properties or interactive JavaScript animations.
            </li>
            <li>
              <strong className="text-white font-semibold">Speed Optimization:</strong> Text and flat shapes compressed into clean SVG structures download in milliseconds, dramatically enhancing Core Web Vitals and SEO rankings.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'exif-metadata-stripping',
      title: 'Stripping Hidden Digital Fingerprints: Exif JPEG Metadata Security & Dynamic Canvas Re-Rendering',
      excerpt: 'How smartphone cameras embed GPS coordinates, serial numbers, and device indicators into JPEGs, and why localized EXIF clearing is vital for data privacy.',
      topic: 'Metadata Security',
      icon: Shield,
      relatedTool: 'exif-stripper',
      readTime: '6 min read',
      date: 'June 10, 2026',
      author: 'APEX RESEARCH',
      role: 'Cybersecurity Analyst',
      tags: ['Security', 'Exif Stripping', 'Data Privacy', 'JPEG Specs'],
      content: (
        <div className="space-y-6 font-sans text-sm text-zinc-300 leading-relaxed text-justify">
          <p>
            Every snapshot captured on modern smartphones or smart cameras contains far more than visual pixels. Hidden within the binary headers of standard JPEG and RAW files format are deeply detailed catalogs of metadata known as <strong>Exchangeable Image File Format (Exif)</strong> data. While helpful for professional photographers, sharing un-stripped raw files online poses major privacy risks.
          </p>
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 font-mono text-[11px] text-zinc-400 space-y-2 text-left">
            <div className="text-zinc-200 uppercase tracking-widest font-extrabold text-[9px] flex items-center gap-1.5 mb-1 text-brand">
              <Shield className="w-3.5 h-3.5 text-brand" />
              <span>Metadata Interception Audit</span>
            </div>
            <div>[READ] Reading binary EXIF segments from TIFF file headers</div>
            <div>[WARNING] Found GPS Latitude/Longitude coordinates (Home Location)</div>
            <div>[WARNING] Found Device Identifier: Apple iPhone 15 Pro, Serial #49281X</div>
            <div>[STRIP] Cleared APP1 directory structures, focal stats, and date markers</div>
            <div>[WRITE] Output graphic rewritten to disk: 100% Secure, 0 Embedded ID tags</div>
          </div>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            The Danger of Unchecked Exif Data Streams
          </h3>
          <p>
            When users upload profile photos, marketplace listings, or documentation receipts to open forums or social web interfaces, scraping bots can immediately harvest these embedded binary headers. These scripts index private details, including the precise GPS coordinates of your home, unique hardware serial numbers, and the specific date-time stamp of the file.
          </p>
          <p>
            To prevent these leaks, our specialized <strong>Exif Metadata Stripper</strong> processes files entirely inside your local sandbox. It parses the binary JPEG block headers, detects segment markers (such as the <span className="font-mono text-zinc-200">APP1</span> directory containing Exif variables), isolates the raw image compressions, and discards all tracking tags completely before packaging the secure file back to your device.
          </p>
          <h3 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-4">
            Best Practices for Complete Media Privacy
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <strong className="text-white font-semibold">Strip Before Uploading:</strong> Pass active screenshots or photography through local sanitizers before sharing them on collaborative project portals or public boards.
            </li>
            <li>
              <strong className="text-white font-semibold">Disable GPS Embeddings:</strong> Configure default mobile operating system camera preferences to bypass geotagging to secure files at creation.
            </li>
            <li>
              <strong className="text-white font-semibold">Verify Dynamic Canvas Sanitization:</strong> Our exporter uses secure pixel drawing rendering loops that isolate visual buffers entirely, giving you peace of mind that no tracking strings persist in your downloads.
            </li>
          </ul>
        </div>
      )
    }
  ];

  const filteredArticles = articles.filter(art => {
    const matchesSearch = 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedTag) {
      return matchesSearch && art.tags.includes(selectedTag);
    }
    return matchesSearch;
  });

  const allTags = Array.from(new Set(articles.flatMap(art => art.tags)));

  const currentArticle = articles.find(art => art.id === selectedArticleId);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Panel */}
      <div className="beveled-panel bg-[#09090d]/95 p-6 md:p-10 border-brand-border/40 shadow-2xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none -mr-40 -mt-40" style={{ backgroundColor: 'var(--theme-glow)', opacity: 0.15 }} />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/35 text-brand px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-extrabold shadow-sm">
              <BookOpen className="w-3.5 h-3.5 animate-pulse" />
              <span>Developer Knowledge Station</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-black tracking-wider uppercase bg-clip-text text-white leading-tight">
              APEX GUIDES & BLOGS
            </h1>
            <p className="font-sans text-sm text-zinc-300 leading-relaxed max-w-xl">
              Equip your development workflow with human-written, highly detailed technical guides. Demystifying format transformations, frontend cryptography, WebAssembly pipelines, and SEO crawlers.
            </p>
          </div>

          <div className="flex gap-2.5 shrink-0 max-sm:grid max-sm:grid-cols-2">
            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl text-center min-w-[110px]">
              <div className="font-sans text-[10px] text-zinc-500 font-bold uppercase tracking-wider">INDEX RATE</div>
              <div className="font-mono text-sm text-emerald-400 font-extrabold">100% LIVE</div>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl text-center min-w-[110px]">
              <div className="font-sans text-[10px] text-zinc-500 font-bold uppercase tracking-wider">GUIDES COUNT</div>
              <div className="font-mono text-sm text-cyan-400 font-extrabold">{articles.length} MODULES</div>
            </div>
          </div>
        </div>
      </div>

      {currentArticle ? (
        /* Full Article View */
        <div className="space-y-6">
          {/* Back button and Meta info */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => setSelectedArticleId(null)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-900 bg-zinc-950/60 text-zinc-400 hover:text-brand hover:border-brand/40 text-xs font-heading font-extrabold tracking-wider uppercase transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Knowledge Index</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 bg-zinc-950/40 px-3/1 border border-zinc-950 rounded-full py-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Published: {currentArticle.date}</span>
            </div>
          </div>

          {/* Article Card */}
          <div className="beveled-panel bg-[#09090d]/95 p-6 md:p-10 border-brand-border/40 shadow-xl text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none -mr-16 -mt-16 bg-brand/5" />
            
            <div className="space-y-6 relative z-10">
              {/* Author and Topic */}
              <div className="flex items-center gap-3 border-b border-zinc-900/60 pb-4">
                <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-heading font-black text-sm uppercase shrink-0">
                  {currentArticle.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-xs font-black text-white uppercase tracking-wider">
                      {currentArticle.author}
                    </span>
                    <span className="text-[10px] bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded text-brand font-mono font-bold uppercase shrink-0">
                      {currentArticle.topic}
                    </span>
                  </div>
                  <div className="font-sans text-[11px] text-zinc-500">{currentArticle.role} &bull; {currentArticle.readTime}</div>
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-4">
                <h2 className="font-heading text-xl sm:text-2xl font-black text-white tracking-wide uppercase leading-tight">
                  {currentArticle.title}
                </h2>
                
                {/* Human Written Core Paragraph Checkpoint */}
                <div className="pt-2 border-t border-zinc-900/40">
                  {currentArticle.content}
                </div>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-2 pt-6 border-t border-[#1e1e2d] mt-8">
                {currentArticle.tags.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-900 text-zinc-400 font-mono text-[10px] uppercase">
                    #{t}
                  </span>
                ))}
              </div>

              {/* Action Board (Related Tool link & Likes count) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl mt-6">
                <div className="flex items-center gap-3.5 max-sm:text-center max-sm:flex-col">
                  <div className="p-2.5 rounded-lg bg-brand/10 text-brand shrink-0">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div className="text-left max-sm:text-center">
                    <h4 className="font-heading text-xs font-black text-white uppercase tracking-wider">Deploy This Feature Locally</h4>
                    <p className="font-sans text-[11px] text-zinc-500 mt-0.5">This article operates concurrently with our secure workspace modules.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 shrink-0 max-sm:w-full max-sm:grid max-sm:grid-cols-2">
                  <button 
                    onClick={() => onTabChange(currentArticle.relatedTool)}
                    className="px-4 py-2 bg-brand text-zinc-950 hover:bg-brand-hover hover:text-white transition-all font-heading text-[11px] font-black tracking-wider uppercase rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>LAUNCH WORKSPACE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleLike(currentArticle.id, e)}
                    className={`px-4 py-2 rounded-lg border transition-all font-heading text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                      userLiked[currentArticle.id]
                        ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]'
                        : 'bg-zinc-900 border-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-800'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${userLiked[currentArticle.id] ? 'fill-current' : ''}`} />
                    <span>{likes[currentArticle.id]} APPRECIATIONS</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Guides Catalog Listing */
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Bar */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search index keywords, parameters, formats..."
                className="w-full bg-zinc-950/80 border border-zinc-900 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-brand/40"
              />
            </div>
            
            {/* Tag Filter row */}
            <div className="md:col-span-6 flex flex-wrap gap-1.5 justify-end max-md:justify-start">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  selectedTag === null
                    ? 'bg-brand/10 border-brand text-brand'
                    : 'bg-zinc-950/40 border-zinc-950 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                ALL GENERAL
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-brand/10 border-brand text-brand'
                      : 'bg-zinc-950/40 border-zinc-950 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            {filteredArticles.map((art) => {
              const Icon = art.icon;
              return (
                <article
                  key={art.id}
                  onClick={() => setSelectedArticleId(art.id)}
                  className="beveled-panel bg-[#09090d]/95 p-5 border-brand-border/30 hover:border-brand-border/60 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[220px]"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-all" />
                  
                  <div className="space-y-3 relative z-10">
                    {/* Topic and Read Time */}
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                      <span className="bg-[#13131a] border border-[#232331] px-2 py-0.5 rounded text-brand/80 font-bold uppercase">
                        {art.topic}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {art.readTime}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-heading text-xs uppercase font-black text-white group-hover:text-brand transition-colors tracking-wide leading-relaxed">
                      {art.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="font-sans text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed line-clamp-3">
                      {art.excerpt}
                    </p>
                  </div>

                  {/* Footers of card */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-950 mt-4 relative z-10">
                    <span className="text-[10px] text-zinc-500 font-mono">By {art.author} &bull; {art.date}</span>
                    
                    <button 
                      onClick={(e) => handleLike(art.id, e)}
                      className={`font-mono text-[9.5px] font-bold px-2 py-1 rounded flex items-center gap-1 hover:bg-[#10b981]/5 hover:text-[#10b981] transition-all cursor-pointer border ${
                        userLiked[art.id] 
                          ? 'border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981]' 
                          : 'border-transparent text-zinc-500'
                      }`}
                      title="Like this article"
                    >
                      <Heart className={`w-3 h-3 ${userLiked[art.id] ? 'fill-current text-[#10b981]' : ''}`} />
                      <span>{likes[art.id]}</span>
                    </button>
                  </div>
                </article>
              );
            })}

            {filteredArticles.length === 0 && (
              <div className="md:col-span-2 text-center py-12 border border-dashed border-zinc-900 rounded-2xl bg-[#09090d]/35">
                <HelpCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="font-heading text-xs font-black text-zinc-500 uppercase tracking-widest">No Guides Match Query</p>
                <p className="font-sans text-xs text-zinc-600 mt-1">Try resetting the search terms or general filter buttons.</p>
              </div>
            )}
          </div>

          {/* Interactive Suggestion Form */}
          <div className="beveled-panel bg-[#09090d]/95 p-6 border-brand-border/40 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
              <div className="md:col-span-5 space-y-2">
                <h4 className="font-heading text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-brand" />
                  <span>Request an Engineering Guide</span>
                </h4>
                <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                  Is there a specific WASM format conversion, PDF metadata structure, or cryptographic encryption standard you want the APEX TEAM to audit? Submit a research topic block!
                </p>
              </div>

              <form onSubmit={handleSuggestionSubmit} className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8]/70 font-mono mb-1">Your Alias</label>
                  <input
                    type="text"
                    required
                    placeholder="WASM Developer"
                    value={suggestionName}
                    onChange={(e) => setSuggestionName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand/40"
                  />
                </div>

                <div className="relative">
                  <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8]/70 font-mono mb-1">Topic Core Focus</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. SVG Vector Thresholds"
                      value={suggestionTopic}
                      onChange={(e) => setSuggestionTopic(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand/40"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-brand text-zinc-950 hover:bg-brand-hover hover:text-white transition-all font-heading text-[10px] font-black tracking-wider uppercase rounded-lg shrink-0 cursor-pointer"
                    >
                      REQUEST
                    </button>
                  </div>
                </div>

                {submittedSuggestion && (
                  <p className="sm:col-span-2 text-[9px] font-mono text-emerald-400 uppercase tracking-wide text-center mt-1">
                    Suggestion transmitted! We will compute and compile content arrays on this terminal loop.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

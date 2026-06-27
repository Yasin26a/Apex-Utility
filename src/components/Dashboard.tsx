import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useMotionTemplate, AnimatePresence } from 'motion/react';
import { FileDown, Image, Sparkles, Braces, ArrowRight, ShieldCheck, Zap, Globe, Cpu, Clock, Download, CheckCircle, FileText, FileImage, Trash2, Camera, Loader2, Search, Copy, Check, Info, Activity, AlertCircle, Layers, ChevronLeft, ChevronRight, GripVertical, Minus, Plus, RotateCcw, Settings, ArrowLeft, Upload, Database, QrCode, Scale, FileCode, Sliders, GitPullRequest, LayoutGrid, List, Hash, Palette, Gauge, Binary, Regex, ArrowLeftRight, Shrink, Pin, Volume2, Mic, Eye, Video, PenTool, History, Type } from 'lucide-react';
import { ActiveTab } from '../types';
import { AlignLeft, Crop, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import { getRecentOperations, getSessionDownloadUrl, RecentOperation } from '../utils/recentOperations';
import DashboardCaptureModal from './DashboardCaptureModal';
import { useLanguage } from '../context/LanguageContext';
import TaskQueue from './TaskQueue';
import ContextMenu from './ContextMenu';

interface DashboardProps {
  onTabChange: (tab: ActiveTab) => void;
}

// Interactive Tilt Card Component with Advanced Glossy Shine and 3D Mechanics
function ThreeDTiltCard({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Subtle 3D tilt coordinates (max 8 degrees for clean, elegant movement)
  const rotateX = useTransform(y, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8]);

  // Coordinate mapping for the glossy spotlight highlight
  const shineX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const shineY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  // Dynamic GPU-accelerated backdrop gradient template
  const background = useMotionTemplate`radial-gradient(circle 240px at ${shineX} ${shineY}, rgba(255, 255, 255, 0.08) 0%, var(--theme-glow) 45%, transparent 100%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{
        scale: 1.018,
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75), 0 0 30px var(--theme-glow)',
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className={`perspective-container cursor-pointer text-left ${className}`}
    >
      <div 
        className="beveled-panel p-6 h-full flex flex-col justify-between border-neutral-800/80 hover:border-brand/60 transition-all duration-300 relative group"
        style={{
          transform: 'translateZ(18px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Hardware Reflection Glistening Overlay - Activated dynamically via Framer Motion */}
        <motion.div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 rounded-xl"
          style={{ background }}
        />
        
        {/* Dynamic Category Bottom Ambient Inset Glow */}
        <div className="absolute inset-x-0 bottom-0 h-[80px] pointer-events-none bg-gradient-to-t from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0 rounded-b-xl" />

        <div className="relative z-10 h-full flex flex-col justify-between" style={{ transformStyle: 'preserve-3d' }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

interface DashboardCard {
  id: string;
  title: string;
  desc: string;
  tagline: string;
  category: string;
  categoryIcon: string;
  cardIcon: string;
  textClass: string;
  buttonLabel: string;
  colSpan?: number;
  heightLevel?: number;
  pinned?: boolean;
}

const DEFAULT_CARDS: DashboardCard[] = [
  {
    id: 'css-generator',
    title: 'CSS Glass & Shadow Generator',
    desc: 'Design backdrop filters, interactive glass surfaces, and complex organic box-shadow layers with production-ready CSS and Tailwind exporters.',
    tagline: '"interactive glassmorphism builder and soft ambient shadow tester offline"',
    category: 'Design & Signals',
    categoryIcon: 'Palette',
    cardIcon: 'Layers',
    textClass: 'text-violet-400 font-bold',
    buttonLabel: 'Launch CSS Studio',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'webp-converter',
    title: 'WebP Image Converter',
    desc: 'Convert standard images (JPEG, PNG, GIF) into highly-optimized WebP files using Canvas API structures, with side-by-side comparative previews.',
    tagline: '"optimize images to webp to boost page load speed"',
    category: 'Media Lab',
    categoryIcon: 'Image',
    cardIcon: 'Image',
    textClass: 'text-orange-400',
    buttonLabel: 'Engage Canvas Engine',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'compress-pdf',
    title: 'Smart PDF Compressor',
    desc: 'Compress and structurally shrink document payload sizes without rasterization errors.',
    tagline: '"compress pdf to 2mb for job application online free"',
    category: 'Document Optimization',
    categoryIcon: 'FileDown',
    cardIcon: 'FileDown',
    textClass: 'text-red-400',
    buttonLabel: 'Deploy Compressor Forge',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'image-to-pdf',
    title: 'JPG/PNG to PDF Converter',
    desc: 'Merge multiple JPG, JPEG, and PNG images into a single highly optimized PDF document locally.',
    tagline: '"merge and compile raster designs into pdf portfolio"',
    category: 'PDF Compilation',
    categoryIcon: 'FileImage',
    cardIcon: 'FileImage',
    textClass: 'text-emerald-400',
    buttonLabel: 'Engage Compilation Forge',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'join-pdf',
    title: 'PDF Joiner & Reorder',
    desc: 'Upload multiple existing PDF documents and merge them into a single file with page-by-page drag-and-drop reordering.',
    tagline: '"combine multiple pdf documents and reorder pages free"',
    category: 'PDF Joiner',
    categoryIcon: 'Layers',
    cardIcon: 'Layers',
    textClass: 'text-teal-400',
    buttonLabel: 'Engage Joining Forge',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'json-beautifier',
    title: 'JSON Parser & Beautifier',
    desc: 'Validate structural arrays and format complex unreadable telemetry blocks instantly with clean layouts.',
    tagline: '"format unreadable json data tool"',
    category: 'Developer Operations',
    categoryIcon: 'Braces',
    cardIcon: 'Braces',
    textClass: 'text-indigo-400',
    buttonLabel: 'Boot Formatting Terminal',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'ai-writer',
    title: 'Apex AI Content Writer',
    desc: 'Draft publications, articles, formal emails, or markdown instantly and refine their structure using Gemini.',
    tagline: '"ai copywriter and professional editor"',
    category: 'AI Copywriting',
    categoryIcon: 'Sparkles',
    cardIcon: 'Sparkles',
    textClass: 'text-indigo-400 animate-pulse',
    buttonLabel: 'Boot Writing Forge',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'password-generator',
    title: 'Shield Vault Generator',
    desc: 'Generate strong random password keys or memorable multi-word passphrases locally offline.',
    tagline: '"secure cryptographic key builder and entropy diagnostic offline"',
    category: 'Security Vault',
    categoryIcon: 'ShieldCheck',
    cardIcon: 'ShieldCheck',
    textClass: 'text-emerald-400',
    buttonLabel: 'Engage Shield Vault',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'qr-generator',
    title: 'QR & Barcode Studio',
    desc: 'Generate highly custom QR codes and multi-format linear barcodes offline. Personalize colors, margins, text sizes, and error levels.',
    tagline: '"custom high-resolution client-side vector qr and linear barcode generator"',
    category: 'Design & Signals',
    categoryIcon: 'QrCode',
    cardIcon: 'QrCode',
    textClass: 'text-amber-400',
    buttonLabel: 'Engage Code Studio',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'unit-converter',
    title: 'Metric Solver & Converter',
    desc: 'Convert length, weight, volume, and temperature metrics in real-time with an instant preview comparison matrix.',
    tagline: '"custom high-resolution secure metric conversion grid"',
    category: 'Design & Signals',
    categoryIcon: 'Scale',
    cardIcon: 'Scale',
    textClass: 'text-rose-400',
    buttonLabel: 'Engage Solver Engine',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'svg-rasterizer',
    title: 'Vector SVG Rasterizer',
    desc: 'Load or paste raw SVG code, edit in real-time, scale up to 8x for high-resolution PNG, JPG, or WebP outputs natively.',
    tagline: '"custom high-resolution client-side vector to raster image compiler"',
    category: 'Design & Signals',
    categoryIcon: 'FileCode',
    cardIcon: 'FileCode',
    textClass: 'text-sky-400',
    buttonLabel: 'Engage Converter Engine',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'batch-processor',
    title: 'Multi-threaded Batch Processor',
    desc: 'Load or drag multiple image assets, adjust compression quality, apply scales, and optimize files dynamically in parallel with fluid metrics.',
    tagline: '"secure client-side multi-threaded image transformation engine"',
    category: 'Design & Signals',
    categoryIcon: 'Sliders',
    cardIcon: 'Sliders',
    textClass: 'text-emerald-400',
    buttonLabel: 'Engage Batch Engine',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'image-vectorizer',
    title: 'Local Image Vectorizer',
    desc: 'Convert PNG, JPEG, and WebP images into high-quality scalable SVG vectors offline with customizable tracing styles.',
    tagline: '"free offline PNG/JPEG to scalable SVG vectorizer"',
    category: 'Media Lab',
    categoryIcon: 'Palette',
    cardIcon: 'Palette',
    textClass: 'text-fuchsia-400',
    buttonLabel: 'Engage Vectorizer Engine',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'json-diff',
    title: 'JSON Object Diff Checker',
    desc: 'Compare two JSON schemas, detect additions, deletions, slight drifts or value updates, side-by-side with color-coded highlights.',
    tagline: '"accurate client-side structural diff compiler"',
    category: 'Design & Signals',
    categoryIcon: 'GitPullRequest',
    cardIcon: 'GitPullRequest',
    textClass: 'text-amber-400',
    buttonLabel: 'Engage Diff Engine',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'secure-hash',
    title: 'Cryptographic Hash Vault',
    desc: 'Input text parameters to instantly compile multiple secure cryptographic hashes (MD5, SHA-1, SHA-256, SHA-512) completely offline.',
    tagline: '"secure client-side password hash and cryptography machine"',
    category: 'Security Vault',
    categoryIcon: 'Hash',
    cardIcon: 'Hash',
    textClass: 'text-indigo-400',
    buttonLabel: 'Engage Hash Engine',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'color-palette',
    title: 'Aesthetic Color Palette Suite',
    desc: 'Generate perfect harmonious color schemes from hex base codes, extract dominant brand palettes from images, and compile exportable CSS/Tailwind variables 100% offline.',
    tagline: '"premium offline color palette studio & brand extractor"',
    category: 'Design & Signals',
    categoryIcon: 'Palette',
    cardIcon: 'Palette',
    textClass: 'text-sky-400',
    buttonLabel: 'Launch Palette Engine',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'digital-signature',
    title: 'Digital Signature Studio',
    desc: 'Create beautiful, high-fidelity drawn or text-based signatures. Customize pen style, sizing, and color, and export vector-ready PNGs/SVGs for documents.',
    tagline: '"professional ink and typography signature builder"',
    category: 'Design & Signals',
    categoryIcon: 'Signature',
    cardIcon: 'Signature',
    textClass: 'text-indigo-400',
    buttonLabel: 'Launch Signature Lab',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'seo-optimizer',
    title: 'SEO Content Optimizer',
    desc: 'Analyze text in real-time for keyword targets, Flesch-Kincaid readability ease, word counts, and metadata. Preview instant Google and social media snippets.',
    tagline: '"ultra-premium search snippet builder & copy optimizer"',
    category: 'Design & Signals',
    categoryIcon: 'Gauge',
    cardIcon: 'Gauge',
    textClass: 'text-emerald-400',
    buttonLabel: 'Launch SEO Suite',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'content-planner',
    title: 'AI Content & Intent Planner',
    desc: 'Analyze search goals, discover critical LSI keywords, and generate detailed article outlines with checklists instantly via Gemini AI.',
    tagline: '"ai search intent engine & editorial planner"',
    category: 'AI Copywriting',
    categoryIcon: 'Sparkles',
    cardIcon: 'Sparkles',
    textClass: 'text-rose-452 text-rose-400 font-bold',
    buttonLabel: 'Launch Intent Planner',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'schema-generator',
    title: 'JSON-LD Schema Architect',
    desc: 'Generate valid, structured, fully-compliant Schema.org microdata (Articles, FAQs, Products, Job Postings, and more) or use AI to extract rich schemas instantly.',
    tagline: '"google compliant microdata architect"',
    category: 'AI Copywriting',
    categoryIcon: 'Sparkles',
    cardIcon: 'Braces',
    textClass: 'text-rose-400 font-bold',
    buttonLabel: 'Launch Schema Studio',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'content-gap',
    title: 'Competitor Content-Gap Analyzer',
    desc: 'Audit your contents directly against rivals side-by-side. Discover missing keywords, heading gap severities, and receive step-by-step optimization recommendations from AI.',
    tagline: '"on-page optimization keyword and topical auditor"',
    category: 'AI Copywriting',
    categoryIcon: 'Sparkles',
    cardIcon: 'ArrowLeftRight',
    textClass: 'text-emerald-400 font-bold',
    buttonLabel: 'Analyze Content Gaps',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'sitemap-generator',
    title: 'Sitemap XML Generator',
    desc: 'Enter custom URL domains, specify change frequency, structure page-by-page paths, and instantly compile standard-compliant XML sitemaps locally.',
    tagline: '"custom in-browser xml sitemap builder and exporter"',
    category: 'Design & Signals',
    categoryIcon: 'FileCode',
    cardIcon: 'FileCode',
    textClass: 'text-rose-400',
    buttonLabel: 'Launch Sitemap Builder',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'base64-converter',
    title: 'Base64 Encoder/Decoder',
    desc: 'Encode strings, convert files and asset blobs directly to Base64 data URLs. Generate raw data snippets or responsive image integrations offline.',
    tagline: '"instant asset-to-URI compiler & base64 toolkit"',
    category: 'Design & Signals',
    categoryIcon: 'Binary',
    cardIcon: 'Binary',
    textClass: 'text-cyan-400',
    buttonLabel: 'Launch Encoder Lab',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'regex-tester',
    title: 'Regex Validator & Tester',
    desc: 'Input regular expression patterns and test strings to analyze real-time search matching highlights, character diagnostics, and capture group tables.',
    tagline: '"real-time pattern validation & capture group diagnostic suite"',
    category: 'Design & Signals',
    categoryIcon: 'Regex',
    cardIcon: 'Regex',
    textClass: 'text-rose-400',
    buttonLabel: 'Launch Regex Lab',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'csv-json-converter',
    title: 'CSV ⇄ JSON Converter',
    desc: 'Convert structured tabular CSV files list into JSON schemas or convert nested JSON objects into clean, downloadable CSV tables in real-time.',
    tagline: '"instant structured data compiler & delimiter mapper"',
    category: 'Design & Signals',
    categoryIcon: 'ArrowLeftRight',
    cardIcon: 'ArrowLeftRight',
    textClass: 'text-amber-400',
    buttonLabel: 'Launch Converter Lab',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'image-compressor',
    title: 'Image Compressor Studio',
    desc: 'Reduce file size and dimensions for JPEG, PNG, and WebP images. Customize quality level and compare original vs compressed files side-by-side.',
    tagline: '"high-fidelity image optimizer & dimension scale mapper"',
    category: 'Design & Signals',
    categoryIcon: 'Shrink',
    cardIcon: 'Shrink',
    textClass: 'text-emerald-400',
    buttonLabel: 'Launch Compressor Studio',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'quick-image-optimizer',
    title: 'Quick Image Optimizer',
    desc: 'Bulk resize, compress, and optimize custom image filenames simultaneously for SEO compliance, loading speed, and Core Web Vitals wins.',
    tagline: '"parallel bulk media size compressor and layout dimensions batch scaler"',
    category: 'Design & Signals',
    categoryIcon: 'FileImage',
    cardIcon: 'FileImage',
    textClass: 'text-brand',
    buttonLabel: 'Launch Quick Optimizer',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'rich-text-stats',
    title: 'Rich Text Statistics',
    desc: 'Detail character, word, sentence, and readability metrics for custom text inputs in real-time.',
    tagline: '"real-time characters and reading speed analyst with readability index charts"',
    category: 'Content Operations',
    categoryIcon: 'FileText',
    cardIcon: 'FileText',
    textClass: 'text-brand',
    buttonLabel: 'Launch Text Analyst',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'audio-trimmer',
    title: 'Audio Trimmer Studio',
    desc: 'Visually select, preview, and extract specific regions of your audio files securely with lossless client-side conversion.',
    tagline: '"trim local audio files instantly with interactive visual preview handles"',
    category: 'Media Lab',
    categoryIcon: 'Volume2',
    cardIcon: 'Volume2',
    textClass: 'text-indigo-400',
    buttonLabel: 'Launch Audio Trimmer',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'ai-transcriber',
    title: 'AI Audio Transcriber',
    desc: 'Upload files and leverage Gemini AI to transcribe speech and conversations into time-coded SRT or TXT paragraphs.',
    tagline: '"accurate speech to text captions generated by expert gemini models"',
    category: 'Media Lab',
    categoryIcon: 'Mic',
    cardIcon: 'Mic',
    textClass: 'text-indigo-400',
    buttonLabel: 'Launch AI Transcriber',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'pdf-analyst',
    title: 'AI Document & PDF Analyst',
    desc: 'Upload files (PDF, TXT, JSON, CSV) and engage in deep conversational research, semantic searches, and strategic summaries.',
    tagline: '"converse with papers, reports, schemas, and technical audits securely in real-time"',
    category: 'Media Lab',
    categoryIcon: 'FileText',
    cardIcon: 'FileText',
    textClass: 'text-indigo-400',
    buttonLabel: 'Launch Document Q&A',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'exif-stripper',
    title: 'EXIF Metadata Inspector',
    desc: 'Load image uploads, analyze hidden EXIF binary streams, detect exact location details, and purge data tags instantly to strip online fingerprint tracks.',
    tagline: '"analyze headers, visual maps logging, and wipe markers before publishing"',
    category: 'Media Lab',
    categoryIcon: 'Eye',
    cardIcon: 'Eye',
    textClass: 'text-rose-400',
    buttonLabel: 'Launch EXIF Purge',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'video-recorder',
    title: 'Screen Recorder & GIF Exporter',
    desc: 'Record screen feeds, windows, microphone inputs, and export instantly to High-Quality looping GIFs or fluid WebM presentations 100% locally with offline dithering and quantization controls.',
    tagline: '"instant capture, high-fidelity custom FPS looping GIFs, and offline-secure HD record reels"',
    category: 'Media Lab',
    categoryIcon: 'Video',
    cardIcon: 'Video',
    textClass: 'text-cyan-450',
    buttonLabel: 'Launch Screen Studio',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'code-snapshot',
    title: 'Code Snapshot Canvas',
    desc: 'Generate beautiful, presentation-ready code snapshots (like Carbon and Ray.so) with customized neon gradients, padding, line numbers, macOS frames, shadow depth, font families, and instant PNG downloads.',
    tagline: '"turn raw source scripts into stunning presentation-ready cards 100% locally with offline precision"',
    category: 'Developer Operations',
    categoryIcon: 'Braces',
    cardIcon: 'FileCode',
    textClass: 'text-emerald-450',
    buttonLabel: 'Launch Code Snapshot',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'case-converter',
    title: 'Case Converter & Formatter',
    desc: 'Transform letter cases (UPPER/lower/Title/Sentence/Camel/Snake/Slug), eliminate raw whitespace gaps, run regex search replacements, and render detailed letter weight maps in real-time.',
    tagline: '"universal local case converter, string trimmer, and telemetry stats processor offline free"',
    category: 'Developer Operations',
    categoryIcon: 'Braces',
    cardIcon: 'Type',
    textClass: 'text-sky-400',
    buttonLabel: 'Boot Case Converter',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'lorem-generator',
    title: 'Lorem Ipsum & Placeholders',
    desc: 'Generate customizable classical Latin paragraphs, lists or HTML wraps, and construct beautifully styled multi-gradient vector placeholder image layers instantly.',
    tagline: '"secure client-side lorem ipsum maker, random latin generator, responsive dummy placeholder svg"',
    category: 'Developer Operations',
    categoryIcon: 'Braces',
    cardIcon: 'AlignLeft',
    textClass: 'text-indigo-400',
    buttonLabel: 'Open Mockup Generator',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'image-cropper',
    title: 'Image Cropper & Resizer',
    desc: 'Crop screenshots, adjust aspect ratios (16:9, 4:3, 1:1, etc.), resize target pixel dimensions, and balance canvases with solid or blurred backdrops fully offline.',
    tagline: '"secure visual cropper, image resizer, aspect ratio lock, canvas expanded pads offline"',
    category: 'Developer Operations',
    categoryIcon: 'Braces',
    cardIcon: 'Crop',
    textClass: 'text-violet-400',
    buttonLabel: 'Launch Ratio Balancer',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'date-calculator',
    title: 'Time & Date Calculator',
    desc: 'Find intervals, count business workdays, simulate milestones, add/subtract custom periods, and convert UTC/local timezone offsets fully offline.',
    tagline: '"secure timeline planner, date difference, count business days, timezone converter offline"',
    category: 'Developer Operations',
    categoryIcon: 'Braces',
    cardIcon: 'Calendar',
    textClass: 'text-sky-400',
    buttonLabel: 'Boot Date Calculator',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'private-sketchpad',
    title: 'Private Vector Sketchpad',
    desc: 'Draft vector graphics, write notes, design wireframes, and draw prototypes with pen pressure simulator and custom grids, fully client-side and offline.',
    tagline: '"interactive vector sketching, client-side sketchpad, pen and pressure canvas fully sandbox protected"',
    category: 'Design & Signals',
    categoryIcon: 'Cpu',
    cardIcon: 'PenTool',
    textClass: 'text-amber-400',
    buttonLabel: 'Launch Free Sketchpad',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'seo-inspect',
    title: 'Google Index Audit & Crawler',
    desc: 'Simulate search engine crawling spiders, audit sitemap nodes, analyze meta tags, check responsive standards, and inspect domain settings.',
    tagline: '"on-page inspector, robot audit, indexing spider, metadata and structure validator offline"',
    category: 'Design & Signals',
    categoryIcon: 'Cpu',
    cardIcon: 'Globe',
    textClass: 'text-rose-400',
    buttonLabel: 'Run Domain Audit',
    colSpan: 1,
    heightLevel: 2
  },
  {
    id: 'keyword-cluster',
    title: 'AI Keyword Clustering Engine',
    desc: 'Group raw search terms into high-intent thematic query hubs, design layout hubs, and map parent semantical topics using Gemini AI power.',
    tagline: '"intent keyword mapping, cluster groups, search engine semantical clustering with Gemini"',
    category: 'AI Copywriting',
    categoryIcon: 'Sparkles',
    cardIcon: 'Sparkles',
    textClass: 'text-emerald-400',
    buttonLabel: 'Cluster Keywords',
    colSpan: 1,
    heightLevel: 2
  }
];

const iconMap: Record<string, React.ComponentType<any>> = {
  Image: Image,
  FileDown: FileDown,
  FileImage: FileImage,
  FileText: FileText,
  Layers: Layers,
  Braces: Braces,
  Sparkles: Sparkles,
  ShieldCheck: ShieldCheck,
  QrCode: QrCode,
  Scale: Scale,
  FileCode: FileCode,
  Sliders: Sliders,
  GitPullRequest: GitPullRequest,
  Hash: Hash,
  Palette: Palette,
  Signature: PenTool,
  Gauge: Gauge,
  Binary: Binary,
  Regex: Regex,
  ArrowLeftRight: ArrowLeftRight,
  Shrink: Shrink,
  Volume2: Volume2,
  Mic: Mic,
  Eye: Eye,
  Video: Video,
  Type: Type,
  AlignLeft: AlignLeft,
  Crop: Crop,
  Calendar: Calendar,
  PenTool: PenTool,
  Globe: Globe
};

const recentToolsLabels = {
  en: {
    title: 'Recently Accessed Utilities',
    subtitle: 'Quick one-click access to your top recently launched tools.',
    noTools: 'No utilities launched recently. Open some tool from below!',
    launch: 'Launch'
  },
  es: {
    title: 'Utilidades Recientes',
    subtitle: 'Acceso rápido con un clic a sus utilidades abiertas recientemente.',
    noTools: 'Ninguna utilidad abierta recientemente. ¡Abra alguna herramienta abajo!',
    launch: 'Abrir'
  },
  fr: {
    title: 'Outils Récents',
    subtitle: 'Accès rapide en un clic à vos outils récemment ouverts.',
    noTools: 'Aucun outil ouvert récemment. Activez-en un ci-dessous !',
    launch: 'Lancer'
  },
  de: {
    title: 'Zuletzt genutzte Anwendungen',
    subtitle: 'Schnellzugriff auf Ihre zuletzt gestarteten Anwendungen mit einem Klick.',
    noTools: 'Keine Anwendungen in letzter Zeit geöffnet. Starten Sie eine unten!',
    launch: 'Starten'
  },
  pt: {
    title: 'Utilidades Recentes',
    subtitle: 'Acesso rápido com um clique de volta aos seus utilitários abertos recentemente.',
    noTools: 'Nenhum utilitário aberto recentemente. Inicie alguma ferramenta abaixo!',
    launch: 'Iniciar'
  }
};

export default function Dashboard({ onTabChange }: DashboardProps) {
  const { t, language } = useLanguage();

  const dashboardUI = {
    en: {
      canvasCustomizerActive: 'Canvas Customizer Active',
      canvasCustomizerDesc: 'Drag widgets to swap positions. Click sizing +/- buttons or grab card corners to adjust cell spans.',
      mechanicalGrid: 'Mechanical Grid',
      minimalistList: 'Minimalist List',
      factoryReset: 'Factory Reset',
      applyAndSave: 'Apply & Save',
      recentFilesLedger: 'Recent Files Ledger',
      ledgerDesc: 'Durable local session registry auditing files processed in your browser. Active conversions can be re-downloaded instantly without repeating the WASM pipeline.',
      formatLedgerHistory: 'Format Ledger History',
      auditedTransactions: 'Audited Transactions',
      localOptimizerImpact: 'Local Optimizer Impact',
      ledgerSecurityMatrix: 'Ledger Security Matrix',
      clientSideIsolated: '100% Client-Side Isolated',
      allFormats: 'All Formats',
      lookupPlaceholder: 'Lookup processed files by name...',
      sandboxLedgerIdle: 'Sandbox Ledger Idle',
      chipsetsActive: 'CHIPSETS: WASM CORE-ACTIVE',
      grabDragHandle: 'GRAB DRAG HANDLE',
      gridWidthSpan: 'Grid Width Span',
      widgetHeight: 'Widget Height',
      shiftUpstream: 'Shift elements upstream',
      shiftDownstream: 'Shift elements downstream',
      editingActive: 'EDITING ACTIVE',
      targetCapability: 'Target Capability',
    },
    es: {
      canvasCustomizerActive: 'Personalizador de Lienzo Activo',
      canvasCustomizerDesc: 'Arrastre los widgets para cambiar sus posiciones. Haga clic en los botones de tamaño +/- o agarre las esquinas de las tarjetas para ajustar las dimensiones de las celdas.',
      mechanicalGrid: 'Cuadrícula Mecánica',
      minimalistList: 'Lista Minimalista',
      factoryReset: 'Restablecimiento de Fábrica',
      applyAndSave: 'Aplicar y Guardar',
      recentFilesLedger: 'Libro de Archivos Recientes',
      ledgerDesc: 'Registro duradero de la sesión local que audita los archivos procesados en su navegador. Las conversiones activas se pueden volver a descargar al instante sin repetir el proceso WASM.',
      formatLedgerHistory: 'Formatear Historial del Libro',
      auditedTransactions: 'Transacciones Auditadas',
      localOptimizerImpact: 'Impacto del Optimizador Local',
      ledgerSecurityMatrix: 'Matriz de Seguridad del Libro',
      clientSideIsolated: '100% Aislado en el Cliente',
      allFormats: 'Todos los Formatos',
      lookupPlaceholder: 'Buscar archivos procesados por nombre...',
      sandboxLedgerIdle: 'Libro de Sandbox Inactivo',
      chipsetsActive: 'CHIPSETS: NÚCLEO WASM ACTIVO',
      grabDragHandle: 'CARRIL DE ARRASTRE',
      gridWidthSpan: 'Ancho de Cuadrícula',
      widgetHeight: 'Alto del Widget',
      shiftUpstream: 'Desplazar elementos arriba',
      shiftDownstream: 'Desplazar elementos abajo',
      editingActive: 'EDICIÓN ACTIVA',
      targetCapability: 'Capacidad de Destino',
    },
    fr: {
      canvasCustomizerActive: 'Personnalisateur de Canevas Actif',
      canvasCustomizerDesc: 'Faites glisser les widgets pour échanger leurs positions. Cliquez sur les boutons de taille +/- ou saisissez les coins des cartes pour ajuster les dimensions des cellules.',
      mechanicalGrid: 'Grille Mécanique',
      minimalistList: 'Liste Minimaliste',
      factoryReset: 'Réinitialisation d\'Usine',
      applyAndSave: 'Appliquer & Enregistrer',
      recentFilesLedger: 'Registre des Fichiers Récents',
      ledgerDesc: 'Registre durable de session locale auditant les fichiers traités dans votre navigateur. Les conversions actives peuvent être re-téléchargées instantanément sans relancer le pipeline WASM.',
      formatLedgerHistory: 'Vider l\'Historique du Registre',
      auditedTransactions: 'Transactions Auditées',
      localOptimizerImpact: 'Impact de l\'Optimiseur Local',
      ledgerSecurityMatrix: 'Matrice de Sécurité du Registre',
      clientSideIsolated: '100% Isolé Côté Client',
      allFormats: 'Tous les Formats',
      lookupPlaceholder: 'Rechercher des fichiers traités par nom...',
      sandboxLedgerIdle: 'Registre du Sandbox Inactif',
      chipsetsActive: 'CHIPSETS: WASM CORE ACTIF',
      grabDragHandle: 'POIGNÉE DE GLISSEMENT',
      gridWidthSpan: 'Largeur de Grille',
      widgetHeight: 'Hauteur du Widget',
      shiftUpstream: 'Déplacer vers le haut',
      shiftDownstream: 'Déplacer vers le bas',
      editingActive: 'EDITION ACTIVE',
      targetCapability: 'Capacité Cible',
    },
    de: {
      canvasCustomizerActive: 'Layout-Anpasser aktiv',
      canvasCustomizerDesc: 'Ziehen Sie Widgets, um die Positionen zu tauschen. Klicken Sie auf die Schaltflächen +/- oder ziehen Sie an den Kartenecken, um die Zellenspannen anzupassen.',
      mechanicalGrid: 'Mechanisches Raster',
      minimalistList: 'Minimalistische Liste',
      factoryReset: 'Werkseinstellung',
      applyAndSave: 'Übernehmen & Speichern',
      recentFilesLedger: 'Buch der letzten Dateien',
      ledgerDesc: 'Dauerhaftes lokales Sitzungsprotokoll, das in Ihrem Browser verarbeitete Dateien prüft. Aktive Konvertierungen können sofort erneut heruntergeladen werden, ohne die WASM-Pipeline zu wiederholen.',
      formatLedgerHistory: 'Protokollverlauf löschen',
      auditedTransactions: 'Geprüfte Transaktionen',
      localOptimizerImpact: 'Lokaler Optimierungseffekt',
      ledgerSecurityMatrix: 'Protokollsicherheitsmatrix',
      clientSideIsolated: '100% Client-seitig isoliert',
      allFormats: 'Alle Formate',
      lookupPlaceholder: 'Verarbeitete Dateien nach Name suchen...',
      sandboxLedgerIdle: 'Protokoll im Leerlauf',
      chipsetsActive: 'CHIPSETS: WASM-KERN AKTIV',
      grabDragHandle: 'ZIEHGRIFF GREIFEN',
      gridWidthSpan: 'Rasterbreite',
      widgetHeight: 'Widgethöhe',
      shiftUpstream: 'Nach oben verschieben',
      shiftDownstream: 'Nach unten verschieben',
      editingActive: 'BEARBEITUNG AKTIV',
      targetCapability: 'Zielkapazität',
    },
    pt: {
      canvasCustomizerActive: 'Personalizador de Layout Ativo',
      canvasCustomizerDesc: 'Arraste os widgets para trocar de posição. Clique nos botões de tamanho +/- ou segure os cantos do cartão para ajustar o tamanho da célula.',
      mechanicalGrid: 'Grade Mecânica',
      minimalistList: 'Lista Minimalista',
      factoryReset: 'Restaurar Padrões',
      applyAndSave: 'Aplicar e Salvar',
      recentFilesLedger: 'Registro de Arquivos Recentes',
      ledgerDesc: 'Registro durável do histórico de sessões locais que audita os arquivos processados no seu navegador. As conversões ativas podem ser baixadas novamente de forma instantânea sem repetir o pipeline do WASM.',
      formatLedgerHistory: 'Limpar Histórico do Registro',
      auditedTransactions: 'Transações Auditadas',
      localOptimizerImpact: 'Impacto do Otimizador Local',
      ledgerSecurityMatrix: 'Matriz de Segurança do Registro',
      clientSideIsolated: '100% Isolado no Cliente',
      allFormats: 'Todos os Formatos',
      lookupPlaceholder: 'Buscar arquivos processados por nome...',
      sandboxLedgerIdle: 'Registro do Sandbox Ocioso',
      chipsetsActive: 'CHIPSETS: NÚCLEO WASM ATIVO',
      grabDragHandle: 'SEGURAR ALÇA DE ARRASTE',
      gridWidthSpan: 'Largura da Grade',
      widgetHeight: 'Altura do Widget',
      shiftUpstream: 'Mover elementos para cima',
      shiftDownstream: 'Mover elementos para baixo',
      editingActive: 'EDIÇÃO ATIVA',
      targetCapability: 'Capacidade do Alvo',
    }
  };

  const getTranslatedCategory = (category: string, lang: string): string => {
    const dicts: Record<string, Record<string, string>> = {
      en: {
        'Media Lab': 'Media Lab',
        'Document Optimization': 'Document Optimization',
        'PDF Compilation': 'PDF Compilation',
        'PDF Joiner': 'PDF Joiner',
        'Developer Operations': 'Developer Operations',
        'AI Copywriting': 'AI Copywriting',
        'Security Vault': 'Security Vault',
        'Design & Signals': 'Design & Signals',
        'PDF Utilities': 'PDF Utilities',
        'SEO Tools': 'SEO Tools',
        'Coding & Dev': 'Coding & Dev'
      },
      es: {
        'Media Lab': 'Laboratorio de Medios',
        'Document Optimization': 'Optimización de Documentos',
        'PDF Compilation': 'Compilación de PDF',
        'PDF Joiner': 'Unidor de PDF',
        'Developer Operations': 'Operaciones de Desarrollo',
        'AI Copywriting': 'Redacción de IA',
        'Security Vault': 'Bóveda de Seguridad',
        'Design & Signals': 'Diseño y Señales',
        'PDF Utilities': 'Utilidades PDF',
        'SEO Tools': 'Herramientas SEO',
        'Coding & Dev': 'Código y Desarrollo'
      },
      fr: {
        'Media Lab': 'Laboratoire Média',
        'Document Optimization': 'Optimisation de Documents',
        'PDF Compilation': 'Compilation PDF',
        'PDF Joiner': 'Assemblage PDF',
        'Developer Operations': 'Opérations Développeur',
        'AI Copywriting': 'Rédaction IA',
        'Security Vault': 'Coffre de Sécurité',
        'Design & Signals': 'Design & Signaux',
        'PDF Utilities': 'Utilitaires PDF',
        'SEO Tools': 'Outils SEO',
        'Coding & Dev': 'Codage & Dev'
      },
      de: {
        'Media Lab': 'Medienlabor',
        'Document Optimization': 'Dokumentenoptimierung',
        'PDF Compilation': 'PDF-Zusammenstellung',
        'PDF Joiner': 'PDF-Zusammenfügung',
        'Developer Operations': 'Entwickler-Operationen',
        'AI Copywriting': 'KI-Texterstellung',
        'Security Vault': 'Sicherheits-Tresor',
        'Design & Signals': 'Design & Signale',
        'PDF Utilities': 'PDF-Dienstprogramme',
        'SEO Tools': 'SEO-Tools',
        'Coding & Dev': 'Programmierung & Entwicklung'
      },
      pt: {
        'Media Lab': 'Laboratório de Mídia',
        'Document Optimization': 'Otimização de Documentos',
        'PDF Compilation': 'Compilação de PDF',
        'PDF Joiner': 'Unificador de PDF',
        'Developer Operations': 'Operações de Desenvolvedor',
        'AI Copywriting': 'Redação de IA',
        'Security Vault': 'Cofre de Segurança',
        'Design & Signals': 'Design e Sinais',
        'PDF Utilities': 'Utilitários PDF',
        'SEO Tools': 'Ferramentas de SEO',
        'Coding & Dev': 'Código e Dev'
      }
    };
    return dicts[lang]?.[category] || category;
  };

  const getTranslatedTagline = (cardId: string, defaultTagline: string, lang: string): string => {
    const dicts: Record<string, Record<string, string>> = {
      en: {
        'webp-converter': "convert webp to jpg instantly without registration",
        'compress-pdf': "online secure pdf compressor free",
        'join-pdf': "join pdf files offline instantly",
        'image-to-pdf': "merge convert offline images to pdf secure",
        'json-beautifier': "beautify draft json files locally free",
        'sitemap-seo': "crawler index validation with seo telemetry",
        'sitemap-generator': "custom in-browser xml sitemap builder and exporter",
        'ai-writer': "automated generative AI writing client-side",
        'password-generator': "offline secure custom password generation",
        'qr-generator': "local qr code builder engine with logo insertion",
        'unit-converter': "scientific metric converter with custom precision",
        'svg-rasterizer': "convert svg vectors to high-resolution png or jpg",
        'batch-processor': "multi-stage compression profiles with web worker queues",
        'json-diff': "compare two json objects side-by-side with delta highlighting",
        'secure-hash': "generate cryptographic md5, sha-1, sha-256 and sha-512 hashes",
        'color-palette': "extract harmonious brand palettes from key focal color nodes",
        'digital-signature': "create, preview and download custom drawn or text signatures",
        'seo-optimizer': "analyze text keyword density, readability, and meta-descriptions",
        'content-planner': "analyze search intent, map lsi keywords and generate article outlines with ai",
        'base64-converter': "convert files, images, or texts to secure Base64 data blocks",
        'regex-tester': "validate and debug regular expressions with real-time highlighting",
        'csv-json-converter': "convert files or text between CSV and JSON formats instantly",
        'image-compressor': "compress and resize jpeg, png, and webp images securely",
        'case-converter': "convert letter cases, strip html tags, clean whitespaces offline",
        'lorem-generator': "generate randomized latin placeholder words, lists, or svg mockups offline",
        'image-cropper': "crop image aspect ratios, customize pixel scales, and balance backgrounds offline",
        'date-calculator': "find date differences, count net business days, and convert timezones offline",
        'private-sketchpad': "interactive vector sketching, client-side sketchpad, pen and pressure canvas fully sandbox protected",
        'seo-inspect': "on-page inspector, robot audit, indexing spider, metadata and structure validator offline",
        'keyword-cluster': "intent keyword mapping, cluster groups, search engine semantical clustering with Gemini"
      },
      es: {
        'webp-converter': "convertir webp a jpg al instante sin registrarse",
        'compress-pdf': "compresor de pdf seguro en línea gratis",
        'join-pdf': "unir archivos pdf sin conexión al instante",
        'image-to-pdf': "combinar y convertir imágenes a pdf sin conexión de forma segura",
        'json-beautifier': "embellecer y dar formato a archivos json localmente gratis",
        'sitemap-seo': "validación de índice de rastreador con telemetría seo",
        'sitemap-generator': "generador y exportador de mapas de sitio xml en el navegador",
        'ai-writer': "redacción automatizada con IA generativa en el cliente",
        'password-generator': "generación de contraseñas personalizada segura y sin conexión",
        'qr-generator': "motor local de creación de códigos qr con inserción de logotipos",
        'unit-converter': "conversor métrico científico con precisión personalizada",
        'svg-rasterizer': "convertir vectores svg a png o jpg de alta resolución",
        'batch-processor': "perfiles de compresión de múltiples etapas con colas de web worker",
        'json-diff': "comparar dos objetos json lado a lado con resaltado de cambios",
        'secure-hash': "generar hashes criptográficos md5, sha-1, sha-256 y sha-512",
        'color-palette': "extraer paletas armoniosas de marcas a partir de nodos de color clave",
        'digital-signature': "crear, previsualizar y descargar firmas personalizadas dibujadas o de texto",
        'seo-optimizer': "analizar la densidad de palabras clave, legibilidad y meta-descripciones de texto",
        'content-planner': "analizar la intención de búsqueda, mapear palabras clave lsi y generar esquemas de artículos con ia",
        'base64-converter': "convertir archivos, imágenes o textos a bloques de datos Base64 seguros",
        'regex-tester': "validar y depurar expresiones regulares con resaltado en tiempo real",
        'csv-json-converter': "convertir archivos o texto entre formatos CSV y JSON al instante",
        'image-compressor': "comprimir y redimensionar imágenes jpeg, png y webp de forma segura",
        'case-converter': "convertir mayúsculas y minúsculas, eliminar etiquetas html y limpiar espacios",
        'lorem-generator': "genere texto lorem ipsum, listas, párrafos u observables svg personalizados offline",
        'image-cropper': "recorte fotos, ajuste relaciones, redimensione píxeles y equilibre resoluções offline",
        'date-calculator': "calcule diferencias de fechas, cuente días laborables y convierta zonas horarias sin conexión"
      },
      fr: {
        'webp-converter': "convertir instantanément webp en jpg sans inscription",
        'compress-pdf': "compresseur pdf sécurisé en ligne gratuit",
        'join-pdf': "fusionner des fichiers pdf hors ligne instantanément",
        'image-to-pdf': "fusionner et convertir des images en pdf hors ligne de manière sécurisée",
        'json-beautifier': "embellir des fichiers json localement et gratuitement",
        'sitemap-seo': "validation de l'index du robot d'exploration avec télémétrie seo",
        'sitemap-generator': "générateur et exportateur de sitemaps xml personnalisés",
        'ai-writer': "rédaction automatisée par IA générative côté client",
        'password-generator': "génération sécurisée et hors ligne de mots de passe personnalisés",
        'qr-generator': "moteur local de création de codes qr avec inscription de logo",
        'unit-converter': "convertisseur métrique scientifique avec précision personnalisée",
        'svg-rasterizer': "convertir des vecteurs svg en png ou jpg haute résolution",
        'batch-processor': "profils de compression multi-étapes avec files d'attente web worker",
        'json-diff': "comparer deux objets json côte à côte avec mise en évidence des deltas",
        'secure-hash': "générer des hachages cryptographiques md5, hachage sha-1, sha-256 et sha-512",
        'color-palette': "extraire des palettes harmonieuses à partir de nœuds de couleur clés",
        'digital-signature': "créer, prévisualiser et télécharger des signatures personnalisées dessinées ou textuelles",
        'seo-optimizer': "analyser la densité des mots-clés, la lisibilité et les méta-descriptions du texte",
        'content-planner': "analyser l'intention de recherche, cartographier les mots-clés LSI et générer des plans d'articles avec l'IA",
        'base64-converter': "convertir des fichiers, des images ou des textes en blocs de données Base64 sécurisés",
        'regex-tester': "valider et déboguer des expressions régulières avec mise en évidence en temps réel",
        'csv-json-converter': "convertir instantanément des fichiers ou du texte entre formats CSV et JSON",
        'image-compressor': "compresser et redimensionner les images jpeg, png et webp en toute sécurité",
        'case-converter': "convertir la casse, supprimer les balises html et nettoyer les espaces hors connexion",
        'lorem-generator': "générer du texte lorem ipsum temporaire, listes html ou images SVG hors connexion",
        'image-cropper': "recadrez des images au pixel près, verrouillez les proportions et équilibrez le canevas",
        'date-calculator': "calculez les intervalles de dates, comptez les jours ouvrables et convertissez les fuseaux horaires"
      },
      de: {
        'webp-converter': "webp sofort ohne registrierung in jpg konvertieren",
        'compress-pdf': "online sicherer pdf-kompressor kostenlos",
        'join-pdf': "pdf-dateien sofort offline zusammenfügen",
        'image-to-pdf': "bilder offline sicher in pdf zusammenführen und konvertieren",
        'json-beautifier': "json-dateien lokal kostenlos verschönern",
        'sitemap-seo': "crawler-index-validierung mit seo-telemetrie",
        'sitemap-generator': "benutzerdefinierter xml-sitemap-builder und -exporter",
        'ai-writer': "automatisches generatives KI-Schreiben auf Client-Seite",
        'password-generator': "sichere benutzerdefinierte offline-passwortgenerierung",
        'qr-generator': "lokaler qr-code-builder mit logo-einfügung",
        'unit-converter': "wissenschaftlicher metrischer konverter mit benutzerdefinierter präzision",
        'svg-rasterizer': "svg-vektoren in hochauflösende png oder jpg konvertieren",
        'batch-processor': "mehrstufige kompressionsprofile mit web-worker-warteschlangen",
        'json-diff': "vergleichen sie zwei json-objekte nebeneinander mit delta-hervorhebung",
        'secure-hash': "kryptografische md5-, sha-1-, sha-256- und sha-512-hashes generieren",
        'color-palette': "harmonische markenpaletten aus schlüssel-farbknoten extrahieren",
        'digital-signature': "erstellen, vorschauen und herunterladen von gezeichneten oder text-signaturen",
        'seo-optimizer': "text-keyword-dichte, lesbarkeit und meta-beschreibungen analysieren",
        'content-planner': "suchintention analysieren, lsi-keywords zuordnen und artikelstrukturen mit ki planen",
        'base64-converter': "dateien, bilder oder texte in sichere Base64-Datenblöcke konvertieren",
        'regex-tester': "reguläre ausdrücke mit echtzeit-hervorhebung validieren und debuggen",
        'csv-json-converter': "dateien oder text sofort zwischen den formaten CSV und JSON konvertieren",
        'image-compressor': "jpeg-, png- und webp-bilder sicher komprimieren und in der größe anpassen",
        'case-converter': "text-schreibweise konvertieren, html-tags entfernen und leerzeichen bereinigen",
        'lorem-generator': "generieren sie lorem ipsum platzhalter, listen oder responsive svg mockups offline",
        'image-cropper': "bilder zuschneiden, ziel pixelmaße anpassen und qualitäten offline optimieren",
        'date-calculator': "berechnen sie datumsdifferenzen, zählen sie arbeitstage und konvertieren sie zeitzonen offline"
      },
      pt: {
        'webp-converter': "converter webp para jpg instantaneamente sem registro",
        'compress-pdf': "compressor de pdf seguro online grátis",
        'join-pdf': "juntar arquivos pdf offline instantaneamente",
        'image-to-pdf': "mesclar e converter imagens offline para pdf com segurança",
        'json-beautifier': "embelezar arquivos json localmente de graça",
        'sitemap-seo': "validação de índice de rastreador com telemetria seo",
        'sitemap-generator': "gerador e exportador de sitemaps xml no navegador",
        'ai-writer': "redação automatizada com IA generativa no cliente",
        'password-generator': "geração de senhas personalizada segura e offline",
        'qr-generator': "motor local de criação de códigos qr com inserção de logotipo",
        'unit-converter': "conversor métrico científico com precisão personalizada",
        'svg-rasterizer': "converter vetores svg para png ou jpg de alta resolução",
        'batch-processor': "perfis de compressão de múltiplas etapas com filas de web worker",
        'json-diff': "comparar dois objetos json lado a lado com destaque de alterações",
        'secure-hash': "gerar hashes criptográficos md5, sha-1, sha-256 e sha-512",
        'color-palette': "extraer paletas harmoniosas de marcas a partir de nós de cores chave",
        'digital-signature': "criar, visualizar e baixar assinaturas personalizadas desenhadas ou de texto",
        'seo-optimizer': "analisar a densidade de palavras-chave, legibilidade e meta-descrições do texto",
        'content-planner': "analisar a intenção de pesquisa, mapear palavras-chave lsi e gerar esboços de artigos com ia",
        'base64-converter': "converter arquivos, imagens ou textos para blocos de dados Base64 seguros",
        'regex-tester': "validar e depurar expressões regulares com destaque em tempo real",
        'csv-json-converter': "converter arquivos ou texto entre formatos CSV e JSON instantaneamente",
        'image-compressor': "comprimir e redimensionar imagens jpeg, png e webp com segurança",
        'case-converter': "converter maiúsculas e minúsculas, remover tags html e limpar espaços offline",
        'lorem-generator': "gere textos de preenchimento lorem ipsum, listas, ou imagens svg offline",
        'image-cropper': "corte imagens e proporções de tela, redimensione pixels e equilibre resoluções localmente",
        'date-calculator': "calcule intervalos entre datas, conte dias úteis e converta fusos horários offline"
      }
    };
    return dicts[lang]?.[cardId] || defaultTagline;
  };

  const getSubDesc = (lang: string) => {
    const dict: Record<string, string> = {
      en: 'Select an operational terminal below to boot local processing canvas.',
      es: 'Seleccione un terminal operativo a continuación para iniciar el lienzo de procesamiento local.',
      fr: 'Sélectionnez un terminal opérationnel ci-dessous pour démarrer le canevas de traitement local.',
      de: 'Wählen Sie unten ein Betriebsterminal aus, um die lokale Verarbeitungsumgebung zu starten.',
      pt: 'Selecione um terminal operacional abaixo para iniciar a área de processamento local.'
    };
    return dict[lang] || dict.en;
  };

  const getCustomizeLabel = (lang: string, active: boolean) => {
    const dict: Record<string, Record<string, string>> = {
      en: { lock: 'Lock Layout', customize: 'Customize Layout' },
      es: { lock: 'Bloquear Diseño', customize: 'Personalizar Diseño' },
      fr: { lock: 'Verrouiller la Disposition', customize: 'Personnaliser la Disposition' },
      de: { lock: 'Layout sperren', customize: 'Layout anpassen' },
      pt: { lock: 'Bloquear Layout', customize: 'Personalizar Layout' }
    };
    const activeLang = dict[lang] || dict.en;
    return active ? activeLang.lock : activeLang.customize;
  };

  const getExportImageLabel = (lang: string) => {
    const dict: Record<string, string> = {
      en: 'Export as Image',
      es: 'Exportar como Imagen',
      fr: 'Exporter en Image',
      de: 'Als Bild exportieren',
      pt: 'Exportar como Imagem'
    };
    return dict[lang] || dict.en;
  };

  const toCamelCase = (str: string): string => {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  };

  const getCardTranslations = (cardId: string, defaultTitle: string, defaultDesc: string, defaultButtonLabel: string) => {
    const camelKeyStr = toCamelCase(cardId);
    const camelKey = camelKeyStr as keyof typeof t.navigation;
    const title = t.navigation[camelKey] || defaultTitle;
    const descKey = `${camelKeyStr}Desc` as keyof typeof t.navigation;
    const desc = t.navigation[descKey] || defaultDesc;
    const buttonLabel = t.dashboard?.launchTool || defaultButtonLabel;
    return { title, desc, buttonLabel };
  };

  const currentLang = (['en', 'es', 'fr', 'de', 'pt'].includes(language) ? language : 'en') as 'en' | 'es' | 'fr' | 'de' | 'pt';
  const dict = dashboardUI[currentLang];

  const [recentTools, setRecentTools] = useState<{ id: string; title: string; category?: string; textClass?: string; icon: any }[]>([]);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const rawEvents = localStorage.getItem('apex_tool_usage_events_stream');
        let events: any[] = [];
        if (rawEvents) {
          events = JSON.parse(rawEvents);
        }
        
        const uniqueToolIds: string[] = [];
        events.forEach(evt => {
          if (evt && evt.toolId && evt.toolId !== 'dashboard' && !uniqueToolIds.includes(evt.toolId)) {
            uniqueToolIds.push(evt.toolId);
          }
        });

        const top5Ids = uniqueToolIds.slice(0, 5);

        const mapped = top5Ids.map(toolId => {
          const card = DEFAULT_CARDS.find(c => c.id === toolId);
          
          const camelKeyStr = toCamelCase(toolId);
          const camelKey = camelKeyStr as any;
          const translatedTitle = t.navigation && (t.navigation as any)[camelKey] ? (t.navigation as any)[camelKey] : (card ? card.title : toolId);

          let iconComponent: any = Sparkles;
          if (card && card.cardIcon && iconMap[card.cardIcon]) {
            iconComponent = iconMap[card.cardIcon];
          } else if (toolId === 'private-sketchpad') {
            iconComponent = PenTool;
          }

          return {
            id: toolId,
            title: translatedTitle,
            category: card ? card.category : 'Interactive Sandbox',
            textClass: card ? card.textClass : 'text-amber-400',
            icon: iconComponent
          };
        });

        setRecentTools(mapped);
      } catch (err) {
        console.error('Failed to load recent tools', err);
      }
    };

    handleUpdate();

    window.addEventListener('apex_tool_analytics_updated', handleUpdate);
    return () => {
      window.removeEventListener('apex_tool_analytics_updated', handleUpdate);
    };
  }, [language, t]);

  const [recentOps, setRecentOps] = useState<RecentOperation[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'PDF Compression' | 'WebP Conversion' | 'Image to PDF'>('All');
  const [toolSearch, setToolSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    toolId: string;
    toolTitle: string;
  } | null>(null);

  // Layout Engine States
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [dashboardViewMode, setDashboardViewMode] = useState<'grid' | 'list'>(() => {
    try {
      const saved = localStorage.getItem('apex_dashboard_view_mode');
      return (saved === 'list' ? 'list' : 'grid');
    } catch (e) {
      return 'grid';
    }
  });
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [cards, setCards] = useState<DashboardCard[]>(() => {
    const saved = localStorage.getItem('apex_dashboard_layout');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const parsedOrder = new Map();
          const parsedData = new Map();
          parsed.forEach((item: any, idx: number) => {
            if (item && item.id) {
              parsedOrder.set(item.id, idx);
              parsedData.set(item.id, item);
            }
          });

          const merged = DEFAULT_CARDS.map(dc => {
            const savedItem = parsedData.get(dc.id);
            if (savedItem) {
              return {
                ...dc,
                colSpan: savedItem.colSpan || dc.colSpan || 1,
                heightLevel: savedItem.heightLevel || dc.heightLevel || 2,
                pinned: savedItem.pinned !== undefined ? savedItem.pinned : (dc.pinned || false),
              };
            }
            return {
              ...dc,
              colSpan: dc.colSpan || 1,
              heightLevel: dc.heightLevel || 2,
              pinned: dc.pinned || false,
            };
          });

          merged.sort((a, b) => {
            if (a.pinned !== b.pinned) {
              return a.pinned ? -1 : 1;
            }
            const orderA = parsedOrder.has(a.id) ? parsedOrder.get(a.id) : 999;
            const orderB = parsedOrder.has(b.id) ? parsedOrder.get(b.id) : 999;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            const idxA = DEFAULT_CARDS.findIndex(d => d.id === a.id);
            const idxB = DEFAULT_CARDS.findIndex(d => d.id === b.id);
            return idxA - idxB;
          });

          return merged;
        }
      } catch (e) {
        console.error('Failed to parse saved layout config', e);
      }
    }
    return DEFAULT_CARDS;
  });

  const filteredCards = cards.filter(card => {
    const { title: localizedTitle, desc: localizedDesc } = getCardTranslations(
      card.id,
      card.title,
      card.desc,
      card.buttonLabel
    );
    const localizedCat = getTranslatedCategory(card.category, language);
    
    const searchLower = toolSearch.toLowerCase();
    const matchesSearch =
      localizedTitle.toLowerCase().includes(searchLower) ||
      localizedDesc.toLowerCase().includes(searchLower) ||
      localizedCat.toLowerCase().includes(searchLower) ||
      card.id.toLowerCase().includes(searchLower);

    let matchesCategory = false;
    if (selectedCategory === 'All') {
      matchesCategory = true;
    } else if (selectedCategory === 'PDF Utilities') {
      matchesCategory = 
        card.category.toLowerCase().includes('pdf') ||
        card.id.toLowerCase().includes('pdf') ||
        card.title.toLowerCase().includes('pdf') ||
        card.desc.toLowerCase().includes('pdf');
    } else if (selectedCategory === 'SEO Tools') {
      matchesCategory = 
        card.category.toLowerCase().includes('seo') ||
        card.id.toLowerCase().includes('seo') ||
        card.id.toLowerCase().includes('keyword') ||
        card.title.toLowerCase().includes('seo') ||
        card.desc.toLowerCase().includes('seo');
    } else if (selectedCategory === 'Coding & Dev') {
      matchesCategory = 
        card.category === 'Developer Operations' ||
        card.id.toLowerCase().includes('code') ||
        card.title.toLowerCase().includes('code') ||
        card.desc.toLowerCase().includes('code') ||
        card.id.toLowerCase().includes('sandbox') ||
        card.title.toLowerCase().includes('sandbox');
    } else {
      matchesCategory = card.category === selectedCategory;
    }
    return matchesSearch && matchesCategory;
  });

  // Local storage telemetry analytics calculation
  const [storageStats, setStorageStats] = useState({ totalKb: 0, usedKeysCount: 0, percentage: 0 });

  const calculateStorageStats = () => {
    try {
      let totalBytes = 0;
      let usedKeys = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('apex_')) {
          const val = localStorage.getItem(key);
          if (val) {
            totalBytes += (key.length + val.length) * 2; // UTF-16 representation bounds
            usedKeys++;
          }
        }
      }
      const totalKb = parseFloat((totalBytes / 1024).toFixed(2));
      // Standard local storage capacity is typically 5MB
      const percentage = Math.min(100, parseFloat(((totalBytes / (5 * 1024 * 1024)) * 100).toFixed(3)));
      setStorageStats({ totalKb, usedKeysCount: usedKeys, percentage });
    } catch (e) {
      console.error('Failed calculating local sandbox telemetry sizes', e);
    }
  };

  useEffect(() => {
    calculateStorageStats();
    window.addEventListener('storage', calculateStorageStats);
    window.addEventListener('apex_recent_ops_updated', calculateStorageStats);
    return () => {
      window.removeEventListener('storage', calculateStorageStats);
      window.removeEventListener('apex_recent_ops_updated', calculateStorageStats);
    };
  }, [recentOps]);

  const handleExportBackup = () => {
    try {
      const keysToBackup = [
        'apex_custom_presets',
        'apex_recent_ops',
        'apex_active_settings',
        'apex_active_preset_id',
        'apex_language',
        'apex_theme_mode',
        'apex_theme',
        'apex_dashboard_layout',
        'apex_active_tab',
        'apex_password_history'
      ];
      
      const backupData: Record<string, string | null> = {};
      keysToBackup.forEach((key) => {
        backupData[key] = localStorage.getItem(key);
      });
      
      const payload = {
        app: 'APEX UTILITY',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        data: backupData
      };
      
      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `apex_utility_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('Aesthetics presets, passwords and layout backup exported successfully!', 'success');
      calculateStorageStats();
    } catch (error) {
      console.error('Error exporting backup:', error);
      showNotification('Export configuration backup failed!', 'error');
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON format');
        }
        
        const sourceData = parsed.data || parsed;
        if (typeof sourceData !== 'object' || sourceData === null) {
          throw new Error('Data payload missing or invalid');
        }

        const keysToImport = [
          'apex_custom_presets',
          'apex_recent_ops',
          'apex_active_settings',
          'apex_active_preset_id',
          'apex_language',
          'apex_theme_mode',
          'apex_theme',
          'apex_dashboard_layout',
          'apex_active_tab',
          'apex_password_history'
        ];

        let importCount = 0;
        keysToImport.forEach((key) => {
          if (key in sourceData) {
            const value = sourceData[key];
            if (value === null) {
              localStorage.removeItem(key);
            } else if (typeof value === 'string') {
              localStorage.setItem(key, value);
              importCount++;
            } else {
              localStorage.setItem(key, JSON.stringify(value));
              importCount++;
            }
          }
        });

        if (importCount === 0) {
          throw new Error('No valid APEX database keys found.');
        }

        showNotification('Workspace state imported successfully! Reloading...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1200);

      } catch (err: any) {
        console.error('Import backup failure:', err);
        showNotification(err.message || 'Invalid backup config file.', 'error');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleFactoryResetAllAll = () => {
    if (confirm('Are you absolutely sure you want to restore the workspace to defaults? This will erase all your custom layouts, preferred tools, saved configurations and generated history.')) {
      try {
        const keysToClear = [
          'apex_custom_presets',
          'apex_recent_ops',
          'apex_active_settings',
          'apex_active_preset_id',
          'apex_language',
          'apex_theme_mode',
          'apex_theme',
          'apex_dashboard_layout',
          'apex_active_tab',
          'apex_password_history'
        ];
        keysToClear.forEach(k => localStorage.removeItem(k));
        showNotification('All application preferences, configurations, and layouts have been wiped!', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (e) {
        console.error(e);
        showNotification('Failed to perform system state format', 'error');
      }
    }
  };

  const getGridSpanClass = (span: number) => {
    switch (span) {
      case 1: return 'xl:col-span-1 lg:col-span-1 md:col-span-1 col-span-1';
      case 2: return 'xl:col-span-2 lg:col-span-2 md:col-span-1 col-span-1';
      case 3: return 'xl:col-span-3 lg:col-span-3 md:col-span-2 col-span-1';
      case 4: return 'xl:col-span-3 lg:col-span-3 md:col-span-2 col-span-2';
      case 5: return 'xl:col-span-3 lg:col-span-3 md:col-span-2 col-span-2';
      case 6: return 'xl:col-span-3 lg:col-span-3 md:col-span-2 col-span-2';
      default: return 'xl:col-span-1 lg:col-span-1 md:col-span-1 col-span-1';
    }
  };

  const getHeightClass = (heightLevel: number) => {
    switch (heightLevel) {
      case 1: return 'h-60';
      case 2: return 'h-72';
      case 3: return 'h-80';
      case 4: return 'h-96';
      case 5: return 'h-[32rem]';
      default: return 'h-72';
    }
  };

  const moveCard = (id: string, direction: number) => {
    const fromIndex = cards.findIndex(c => c.id === id);
    if (fromIndex === -1) return;
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= cards.length) return;

    const updated = [...cards];
    const card = updated[fromIndex];
    const targetCard = updated[toIndex];

    if (card.pinned !== targetCard.pinned) {
      card.pinned = targetCard.pinned;
    }

    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);

    const pinned = updated.filter(c => c.pinned);
    const unpinned = updated.filter(c => !c.pinned);
    setCards([...pinned, ...unpinned]);
  };

  const togglePin = (id: string) => {
    setCards(prev => {
      const updated = prev.map(c => {
        if (c.id === id) {
          const newPinned = !c.pinned;
          return { ...c, pinned: newPinned };
        }
        return c;
      });

      // Pin forces these tools to stay at the top. Let's sort: pinned cards first, then unpinned.
      // We partition them while maintaining their existing relative order in each group.
      const pinned = updated.filter(c => c.pinned);
      const unpinned = updated.filter(c => !c.pinned);
      const reordered = [...pinned, ...unpinned];

      try {
        localStorage.setItem('apex_dashboard_layout', JSON.stringify(reordered.map(c => ({
          id: c.id,
          colSpan: c.colSpan,
          heightLevel: c.heightLevel,
          pinned: c.pinned
        }))));
      } catch (e) {
        console.error('Failed to persist layout including pin state', e);
      }

      // Localized notification alerts
      const card = prev.find(c => c.id === id);
      if (card) {
        const title = getCardTranslations(card.id, card.title, card.desc, card.buttonLabel).title;
        const msg = !card.pinned
          ? (language === 'es' ? `"${title}" fijado al principio!` : language === 'fr' ? `"${title}" épinglé en haut!` : language === 'de' ? `"${title}" oben angeheftet!` : language === 'pt' ? `"${title}" fixado no topo!` : `"${title}" pinned to top!`)
          : (language === 'es' ? `"${title}" desfijado del principio.` : language === 'fr' ? `"${title}" dépinglé du haut.` : language === 'de' ? `"${title}" Anheftung oben aufgehoben.` : language === 'pt' ? `"${title}" desafixado do topo.` : `"${title}" unpinned from top.`);
        showNotification(msg, 'success');
      }

      return reordered;
    });
  };

  const updateCardSize = (id: string, widthChange: number, heightChange: number) => {
    setCards(prev => prev.map(c => {
      if (c.id === id) {
        const newColSpan = Math.max(1, Math.min(6, (c.colSpan || 1) + widthChange));
        const newHeightLevel = Math.max(1, Math.min(5, (c.heightLevel || 2) + heightChange));
        return { ...c, colSpan: newColSpan, heightLevel: newHeightLevel };
      }
      return c;
    }));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === id) return;

    const draggedIndex = cards.findIndex(c => c.id === draggedId);
    const targetIndex = cards.findIndex(c => c.id === id);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const updated = [...cards];
      const draggedCard = updated[draggedIndex];
      const targetCard = updated[targetIndex];

      if (draggedCard.pinned !== targetCard.pinned) {
        draggedCard.pinned = targetCard.pinned;
      }

      const [removed] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, removed);

      const pinned = updated.filter(c => c.pinned);
      const unpinned = updated.filter(c => !c.pinned);
      setCards([...pinned, ...unpinned]);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const targetCard = cards.find(c => c.id === cardId);
    if (!targetCard) return;

    const initialX = e.clientX;
    const initialY = e.clientY;
    const initialColSpan = targetCard.colSpan || 1;
    const initialHeightLevel = targetCard.heightLevel || 2;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - initialX;
      const deltaY = moveEvent.clientY - initialY;

      const newWidthAdd = Math.round(deltaX / 180);
      const newHeightAdd = Math.round(deltaY / 55);

      const computedColSpan = Math.max(1, Math.min(6, initialColSpan + newWidthAdd));
      const computedHeightLevel = Math.max(1, Math.min(5, initialHeightLevel + newHeightAdd));

      setCards(prev => prev.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            colSpan: computedColSpan,
            heightLevel: computedHeightLevel
          };
        }
        return c;
      }));
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const resetDefaultLayout = () => {
    localStorage.removeItem('apex_dashboard_layout');
    setCards(DEFAULT_CARDS);
    showNotification('Layout restored to factory presets.', 'info');
  };

  const saveLayoutConfig = () => {
    try {
      localStorage.setItem('apex_dashboard_layout', JSON.stringify(cards.map(c => ({
        id: c.id,
        colSpan: c.colSpan,
        heightLevel: c.heightLevel,
        pinned: c.pinned
      }))));
      setIsCustomizing(false);
      showNotification('Dashboard layout configuration successfully synchronized!', 'success');
    } catch (e) {
      console.error(e);
      showNotification('Failed to synchronize layout configuration to localStorage', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => prev?.message === message ? null : prev);
    }, 4500);
  };

  const parseSizeToBytes = (sizeStr: string): number => {
    if (!sizeStr) return 0;
    const match = sizeStr.trim().match(/^([\d.]+)\s*(KB|MB|GB|B)?$/i);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();
    if (unit === 'KB') return val * 1024;
    if (unit === 'MB') return val * 1024 * 1024;
    if (unit === 'GB') return val * 1024 * 1024 * 1024;
    return val;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCopyFilename = (opId: string, filename: string) => {
    navigator.clipboard.writeText(filename).then(() => {
      setCopiedId(opId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Calculate cumulative stats from all recentOps in history
  const historyStats = React.useMemo(() => {
    let totalOriginal = 0;
    let totalNew = 0;
    let savingsCount = 0;

    recentOps.forEach((op) => {
      const orig = parseSizeToBytes(op.originalSize);
      const updated = parseSizeToBytes(op.newSize);
      
      if (orig > 0 && updated > 0) {
        totalOriginal += orig;
        totalNew += updated;
        savingsCount++;
      }
    });

    const totalSavedBytes = Math.max(0, totalOriginal - totalNew);
    const avgSavingsPercent = totalOriginal > 0 ? Math.round((totalSavedBytes / totalOriginal) * 100) : 0;

    return {
      totalSavedStr: formatBytes(totalSavedBytes),
      avgSavingsPercent,
      hasCompressionData: savingsCount > 0 && totalSavedBytes > 0
    };
  }, [recentOps]);

  const handleExportImage = () => {
    setIsCaptureModalOpen(true);
  };

  useEffect(() => {
    // Collect pre-existing processed files from localStorage
    setRecentOps(getRecentOperations());

    // Setup real-time callback when new transformations are generated
    const handleOpsChanged = () => {
      setRecentOps(getRecentOperations());
    };

    window.addEventListener('apex_recent_ops_updated', handleOpsChanged);
    return () => {
      window.removeEventListener('apex_recent_ops_updated', handleOpsChanged);
    };
  }, []);

  const clearSessionActivity = () => {
    try {
      localStorage.removeItem('apex_recent_ops');
      setRecentOps([]);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOps = recentOps.filter((op) => {
    const matchesSearch = op.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || op.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div id="workspace-dashboard-layout" className="space-y-12 p-1.5 rounded-2xl">
      {/* Premium Hero Banner */}
      <div id="dashboard-hero-banner" className="relative rounded-2xl border border-brand-border/40 bg-gradient-to-br from-[#0c0c10] to-[#050505] p-8 md:p-12 overflow-hidden shadow-2xl transition-all duration-500">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-all duration-700" style={{ backgroundColor: 'var(--theme-glow)', opacity: 0.6 }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none transition-all duration-700" style={{ backgroundColor: 'var(--theme-glow)', opacity: 0.4 }} />

        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold uppercase tracking-wider transition-all duration-500">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apex Processing Labs</span>
          </div>
          
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight uppercase">
            {t.dashboard.welcome}
          </h1>
          
          <p className="font-sans text-[#94a3b8] text-sm sm:text-base max-w-2xl leading-relaxed">
            {t.dashboard.subtitle}
          </p>

          <div className="pt-4 flex flex-wrap gap-4 font-mono text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{(() => {
                const dictBadge: Record<string, string> = {
                  en: 'Full Local Isolation',
                  es: 'Aislamiento Local Completo',
                  fr: 'Isolation Locale Complète',
                  de: 'Vollständige lokale Isolation',
                  pt: 'Isolamento Local Completo'
                };
                return dictBadge[language] || dictBadge.en;
              })()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{(() => {
                const dictBadge: Record<string, string> = {
                  en: 'WASM-Engine Power',
                  es: 'Energía del Motor WASM',
                  fr: 'Puissance du Moteur WASM',
                  de: 'WASM-Engine-Leistung',
                  pt: 'Poder do Motor WASM'
                };
                return dictBadge[language] || dictBadge.en;
              })()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800">
              <Globe className="w-4 h-4 text-emerald-500" />
              <span>{(() => {
                const dictBadge: Record<string, string> = {
                  en: '100% Free Service',
                  es: 'Servicio 100% Gratis',
                  fr: 'Service 100% Gratuit',
                  de: '100 % kostenloser Service',
                  pt: 'Serviço 100% Gratuito'
                };
                return dictBadge[language] || dictBadge.en;
              })()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customizer Control Bar */}
      {isCustomizing && (
        <motion.div 
          initial={{ opacity: 0, y: -15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          className="p-5 bg-[#0e0e15]/95 border border-brand/20 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-5 text-center select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group"
        >
          {/* Subtle accent border-glowing bar */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent opacity-80" />

          <div className="flex items-center gap-3.5 text-left flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/25 flex items-center justify-center text-brand flex-shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse">
              <Settings className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-heading text-xs sm:text-sm font-bold text-white block uppercase tracking-wider">{dict.canvasCustomizerActive}</span>
              <span className="font-sans text-[11px] text-zinc-400 block truncate sm:whitespace-normal">{dict.canvasCustomizerDesc}</span>
            </div>
          </div>

          {/* Visual Toggle for Mechanical Grid / Minimalist List views */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950/90 rounded-xl border border-zinc-850 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] mx-auto md:mx-0 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setDashboardViewMode('grid');
                localStorage.setItem('apex_dashboard_view_mode', 'grid');
                showNotification('Switched dashboard layout to Mechanical Grid view!', 'info');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer select-none ${
                dashboardViewMode === 'grid'
                  ? 'bg-brand text-zinc-950 shadow-[0_2px_8px_rgba(245,158,11,0.25)] font-extrabold scale-102'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
              }`}
              title="Activate 3D tilting Mechanical Grid with customizable cell spans"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{dict.mechanicalGrid}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDashboardViewMode('list');
                localStorage.setItem('apex_dashboard_view_mode', 'list');
                showNotification('Switched dashboard layout to Minimalist List view!', 'info');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer select-none ${
                dashboardViewMode === 'list'
                  ? 'bg-brand text-zinc-950 shadow-[0_2px_8px_rgba(245,158,11,0.25)] font-extrabold scale-102'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
              }`}
              title="Activate space-efficient streamlined linear List layout"
            >
              <List className="w-3.5 h-3.5" />
              <span>{dict.minimalistList}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-center flex-shrink-0">
            <button
              type="button"
              onClick={resetDefaultLayout}
              className="px-3.5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-[10.5px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Reset configuration back to factory parameters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{dict.factoryReset}</span>
            </button>
            <button
              type="button"
              onClick={saveLayoutConfig}
              className="px-4 py-2 rounded-lg bg-brand text-zinc-950 hover:bg-brand/90 text-[10.5px] font-heading font-extrabold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{dict.applyAndSave}</span>
            </button>
          </div>
        </motion.div>
      )}



      {/* Recent Tools Widget */}
      <div id="recent-tools-widget" className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/60 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-brand-border/10 pb-3">
          <History className="w-5 h-5 text-brand animate-pulse" />
          <div>
            <h2 className="font-heading text-base font-bold text-white uppercase tracking-wider">
              {recentToolsLabels[language as keyof typeof recentToolsLabels]?.title || recentToolsLabels.en.title}
            </h2>
            <p className="font-sans text-xs text-zinc-400">
              {recentToolsLabels[language as keyof typeof recentToolsLabels]?.subtitle || recentToolsLabels.en.subtitle}
            </p>
          </div>
        </div>

        {recentTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {recentTools.map((tool) => {
              const ToolIcon = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  whileHover={{ y: -3, scale: 1.015 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  onClick={() => onTabChange(tool.id as ActiveTab)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      toolId: tool.id,
                      toolTitle: tool.title,
                    });
                  }}
                  className="beveled-panel p-4 bg-zinc-950/40 border border-zinc-900 hover:border-brand/40 hover:bg-[#07070a]/80 transition-all duration-300 cursor-pointer flex flex-col justify-between h-28 group relative overflow-hidden select-none"
                >
                  {/* Subtle hover backlight */}
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl group-hover:bg-brand/5 pointer-events-none transition-all duration-300" />
                  
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-lg bg-zinc-900 border border-zinc-850 flex-shrink-0 group-hover:border-brand/35 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.15)] transition-all duration-300 ${tool.textClass || 'text-brand'}`}>
                        <ToolIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading text-xs font-bold text-white group-hover:text-brand truncate leading-tight transition-colors">
                          {tool.title}
                        </h3>
                        <span className="font-sans text-[10px] text-zinc-500 block truncate uppercase tracking-wide mt-0.5">
                          {tool.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-900/40 pt-2.5 mt-2 font-mono text-[9px] text-zinc-500">
                    <span className="uppercase text-[8px] tracking-wider text-zinc-600 font-semibold">
                      APEX LABS
                    </span>
                    <span className="inline-flex items-center gap-1 text-brand font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 duration-300">
                      <span>{recentToolsLabels[language as keyof typeof recentToolsLabels]?.launch || recentToolsLabels.en.launch}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center border border-dashed border-zinc-900/60 rounded-xl bg-zinc-950/15">
            <p className="font-sans text-xs text-zinc-500">
              {recentToolsLabels[language as keyof typeof recentToolsLabels]?.noTools || recentToolsLabels.en.noTools}
            </p>
          </div>
        )}
      </div>

      {/* Dynamic Drag-and-Resize Utilities Matrix */}
      <div id="dashboard-core-vault" className="mb-14 sm:mb-20">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-3 pb-3 border-b border-zinc-900/40">
          <div>
            <h2 className="font-heading text-xl font-bold text-white uppercase tracking-wider">{t.dashboard.toolsTitle}</h2>
            <p className="font-sans text-xs text-zinc-500 mt-1">{getSubDesc(language)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {!isCustomizing && (
              <button
                type="button"
                onClick={resetDefaultLayout}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#16161c] hover:bg-[#20202a] border border-zinc-900/60 text-zinc-400 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-md"
                title="Reset layout grid back to factory defaults"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                <span>
                  {language === 'es' ? 'Restablecer Cuadrícula' :
                   language === 'fr' ? 'Réinitialiser la Grille' :
                   language === 'de' ? 'Raster zurücksetzen' :
                   language === 'pt' ? 'Restaurar Grade' :
                   'Reset Grid'}
                </span>
              </button>
            )}

            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                isCustomizing
                  ? 'bg-brand/20 border-brand text-brand hover:bg-brand/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-[#16161c] hover:bg-[#20202a] border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white shadow-md'
              }`}
              title="Activate workspace arrangement customizer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{getCustomizeLabel(language, isCustomizing)}</span>
            </button>

            <button
              onClick={handleExportImage}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#16161c] hover:bg-[#20202a] border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-md"
              title="Save active workspace layout and metrics as a high-resolution PNG image"
            >
              <Camera className="w-3.5 h-3.5 text-brand" />
              <span>{getExportImageLabel(language)}</span>
            </button>
            
            <div className="flex items-center gap-2 text-brand text-xs font-mono font-bold bg-brand/10 px-3 py-1.5 rounded-lg border border-brand/35 transition-all duration-500 shadow-sm">
              <Cpu className="w-4 h-4 animate-spin [animation-duration:8s]" />
              <span>{dict.chipsetsActive}</span>
            </div>
          </div>
        </div>

        {/* Modern Tools Search & Filter Panel */}
        <div className="mb-10 lg:mb-12 p-4 bg-[#0e0e15]/40 border border-zinc-900/70 rounded-2xl flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
          {/* Left Side: Category choice buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none scroll-smooth min-w-0 flex-1">
            {['All', 'PDF Utilities', 'SEO Tools', 'Coding & Dev', 'Design & Signals', 'Media Lab', 'Document Optimization', 'Developer Operations', 'Security Vault', 'AI Copywriting'].map((cat) => {
              const isSelected = selectedCategory === cat;
              const displayLabel = cat === 'All'
                ? (language === 'es' ? 'Todas' : language === 'fr' ? 'Toutes' : language === 'de' ? 'Alle' : language === 'pt' ? 'Todas' : 'All Formats')
                : getTranslatedCategory(cat, language);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-heading font-extrabold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-brand text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'bg-zinc-950 hover:bg-[#12121a] text-zinc-500 hover:text-zinc-200 border border-zinc-900/80 hover:border-zinc-850'
                  }`}
                >
                  {displayLabel}
                </button>
              );
            })}
          </div>

          {/* Right Side: Search bar of Tools */}
          <div className="relative w-full md:w-64 flex-shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              placeholder={
                language === 'es' ? 'Buscar herramienta...' :
                language === 'fr' ? 'Rechercher un outil...' :
                language === 'de' ? 'Werkzeug suchen...' :
                language === 'pt' ? 'Buscar ferramenta...' :
                'Search tool...'
              }
              className="w-full pl-9 pr-8 py-2 bg-zinc-950 border border-zinc-900 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand/40 font-sans transition-all duration-200"
            />
            {toolSearch && (
              <button
                type="button"
                onClick={() => setToolSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 rotate-45" />
              </button>
            )}
          </div>
        </div>

        {filteredCards.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-zinc-950/20 border border-dashed border-zinc-900/80 max-w-md mx-auto space-y-4 my-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-900/60 flex items-center justify-center text-zinc-500 border border-zinc-850/80">
              <Search className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="font-heading text-sm font-bold text-zinc-300">
                {language === 'es' ? 'Sin resultados' : 'No tools matched your search'}
              </p>
              <p className="font-sans text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                {language === 'es' ? 'Prueba ajustando tus filtros o términos de búsqueda.' : 'Try adjusting your search query or switching categories.'}
              </p>
            </div>
            <button
              onClick={() => { setToolSearch(''); setSelectedCategory('All'); }}
              className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-xs font-mono font-bold text-[#fafafa] border border-zinc-800 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          dashboardViewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid-flow-row-dense gap-x-8 gap-y-12 lg:gap-x-10 lg:gap-y-16 pb-16">
              {filteredCards.map((card, index) => {
                const CategoryIcon = iconMap[card.categoryIcon] || Image;
                const CardIcon = iconMap[card.cardIcon] || Image;
                const isAiWriter = card.id === 'ai-writer';
                const colSpanClass = getGridSpanClass(card.colSpan || 1);
              
              const localizedCat = getTranslatedCategory(card.category, language);
              const { title: localizedTitle, desc: localizedDesc, buttonLabel: localizedBtn } = getCardTranslations(card.id, card.title, card.desc, card.buttonLabel);
              const localizedTagline = getTranslatedTagline(card.id, card.tagline, language);

              return (
                <motion.div
                  key={card.id}
                  layout
                  onDragOver={(e) => handleDragOver(e, card.id)}
                  className={`space-y-4 rounded-2xl transition-all duration-300 relative ${colSpanClass} ${
                    isCustomizing 
                      ? 'border-2 border-dashed border-brand/30 bg-brand/[0.015] p-3 shadow-inner' 
                      : ''
                  }`}
                >
                  {/* Visual Card customizer metrics details */}
                  <div className="flex items-center justify-between pl-1">
                    <div className="flex items-center gap-2 select-none min-w-0">
                      <CategoryIcon className="w-4.5 h-4.5 text-brand transition-colors duration-500 flex-shrink-0" />
                      <h3 className="font-heading text-xs uppercase font-bold text-[#f8fafc] tracking-widest truncate">{localizedCat}</h3>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 pointer-events-auto">
                      {/* Pinned Indicator / Pin Action Button */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); togglePin(card.id); }}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          card.pinned 
                            ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.25)]' 
                            : 'text-zinc-650 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent'
                        }`}
                        title={
                          card.pinned 
                            ? (language === 'es' ? 'Desfijar herramienta de la parte superior' : language === 'fr' ? 'Dépingler' : language === 'de' ? 'Anheftung aufheben' : language === 'pt' ? 'Desafixar topo' : 'Unpin Tool')
                            : (language === 'es' ? 'Fijar herramienta al principio' : language === 'fr' ? 'Épingler en haut' : language === 'de' ? 'Werkzeug oben anheften' : language === 'pt' ? 'Fixar topo' : 'Pin Tool to Top')
                        }
                      >
                        <Pin className={`w-3.5 h-3.5 transition-all duration-300 ${card.pinned ? 'rotate-0 text-amber-400 fill-amber-400/30 scale-110' : '-rotate-45 group-hover:scale-110'}`} />
                      </button>

                      {isCustomizing && (
                        <>
                          <div className="text-[9px] font-mono text-brand/90 px-1 bg-brand/10 border border-brand/20 rounded font-semibold">
                            {card.colSpan}x{card.heightLevel}
                          </div>
                          
                          <div className="flex items-center gap-0.5 bg-zinc-950 rounded p-0.5 border border-zinc-900 shadow-sm">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); moveCard(card.id, -1); }}
                              disabled={index === 0}
                              className="p-1 rounded hover:bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
                              title="Move card left / up"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); moveCard(card.id, 1); }}
                              disabled={index === cards.length - 1}
                              className="p-1 rounded hover:bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
                              title="Move card right / down"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {isCustomizing && (
                    <div 
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onDragEnd={handleDragEnd}
                      className="flex items-center gap-2 cursor-grab active:cursor-grabbing py-1.5 bg-zinc-950 hover:bg-[#16161f] border border-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200 justify-center text-[10px] font-mono select-none pointer-events-auto transition-colors"
                      title="Drag and drop card to swap grid order"
                    >
                      <GripVertical className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400" />
                      <span>{dict.grabDragHandle}</span>
                    </div>
                  )}
                  
                  <div 
                    className="relative"
                    onContextMenu={(e) => {
                      if (!isCustomizing) {
                        e.preventDefault();
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          toolId: card.id,
                          toolTitle: localizedTitle,
                        });
                      }
                    }}
                  >
                    <ThreeDTiltCard 
                      onClick={() => !isCustomizing && onTabChange(card.id as ActiveTab)} 
                      className={`${getHeightClass(card.heightLevel || 2)} transition-all duration-300 relative`}
                    >
                      <div className="space-y-4 h-full flex flex-col justify-between" style={{ transformStyle: 'preserve-3d' }}>
                        <div className="space-y-4" style={{ transformStyle: 'preserve-3d' }}>
                          {/* 3D Popping Icon Block */}
                          <div 
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-2 border-red-950/60 hover:border-brand/60 flex items-center justify-center text-brand shadow-lg shadow-brand/20 transition-all duration-300 relative group-hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]" 
                            style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}
                          >
                            <CardIcon className={`w-7 h-7 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.3)] transition-all duration-300 group-hover:scale-110 ${isAiWriter ? 'text-indigo-400 animate-pulse' : card.textClass}`} style={{ transform: 'translateZ(10px)' }} />
                            <div className="absolute inset-0 bg-brand/5 rounded-2xl blur-md -z-10 group-hover:bg-brand/10 transition-all duration-300" />
                          </div>
                          
                          {/* 3D Elevated Title & Description */}
                          <div style={{ transform: 'translateZ(20px)' }}>
                            <h4 className="font-heading text-lg font-extrabold text-white tracking-tight leading-snug group-hover:text-brand transition-colors duration-300">{localizedTitle}</h4>
                            <p className="font-sans text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed line-clamp-3" title={localizedDesc}>
                              {localizedDesc}
                            </p>
                          </div>
                          
                          {/* 3D Offset Tagline */}
                          <div className="border-t border-zinc-900/60 pt-3" style={{ transform: 'translateZ(10px)' }}>
                            <p className="font-mono text-[9px] text-[#94a3b8] uppercase tracking-wider mb-1">{dict.targetCapability}</p>
                            <p className="font-sans text-[11px] text-zinc-500 italic truncate" title={localizedTagline}>{localizedTagline}</p>
                          </div>
                        </div>

                        {/* 3D Popping Action Button */}
                        <div 
                          className="flex items-center justify-between text-xs text-brand font-bold group-hover:text-brand transition-all duration-500 mt-4 pt-2 border-t border-brand-border/10"
                          style={{ transform: 'translateZ(25px)' }}
                        >
                          <span>{localizedBtn}</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </ThreeDTiltCard>

                    {isCustomizing && (
                      <>
                        {/* Interactive size customization controller overlay */}
                        <div 
                          className="absolute inset-x-2 bottom-12 z-20 flex flex-col gap-2 p-3 rounded-xl bg-zinc-950/95 border border-zinc-900 shadow-2xl backdrop-blur-sm pointer-events-auto transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                            <span className="text-[9.5px] font-mono text-zinc-400 font-bold uppercase tracking-wider">{dict.gridWidthSpan}</span>
                            <span className="text-[10px] font-mono text-emerald-400 font-extrabold">{(card.colSpan || 1)}x Width</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-zinc-900/40 p-1 rounded-lg border border-zinc-950">
                            <button
                              type="button"
                              onClick={() => updateCardSize(card.id, -1, 0)}
                              disabled={(card.colSpan || 1) <= 1}
                              className="flex-1 py-1 px-2 rounded-md bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-20 font-bold font-mono text-[11px] transition-all cursor-pointer border border-zinc-900"
                            >
                              <Minus className="w-3 h-3 mx-auto" />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCardSize(card.id, 1, 0)}
                              disabled={(card.colSpan || 1) >= 6}
                              className="flex-1 py-1 px-2 rounded-md bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-20 font-bold font-mono text-[11px] transition-all cursor-pointer border border-zinc-900"
                            >
                              <Plus className="w-3 h-3 mx-auto" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between border-b border-zinc-900 pt-1 pb-1.5 mt-1">
                            <span className="text-[9.5px] font-mono text-zinc-400 font-bold uppercase tracking-wider">{dict.widgetHeight}</span>
                            <span className="text-[10px] font-mono text-amber-500 font-extrabold">{getHeightClass(card.heightLevel || 2)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-zinc-900/40 p-1 rounded-lg border border-zinc-950">
                            <button
                              type="button"
                              onClick={() => updateCardSize(card.id, 0, -1)}
                              disabled={(card.heightLevel || 2) <= 1}
                              className="flex-1 py-1 px-2 rounded-md bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-20 font-bold font-mono text-[11px] transition-all cursor-pointer border border-zinc-900"
                            >
                              <Minus className="w-3 h-3 mx-auto" />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCardSize(card.id, 0, 1)}
                              disabled={(card.heightLevel || 2) >= 5}
                              className="flex-1 py-1 px-2 rounded-md bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-20 font-bold font-mono text-[11px] transition-all cursor-pointer border border-zinc-900"
                            >
                              <Plus className="w-3 h-3 mx-auto" />
                            </button>
                          </div>
                        </div>

                        {/* Direct pointer corner resize handle */}
                        <div 
                          onPointerDown={(e) => handleResizeStart(e, card.id)}
                          className="absolute bottom-1 right-1 w-6 h-6 rounded-br-lg cursor-se-resize flex items-end justify-end p-0.5 z-30 select-none group/resize pointer-events-auto"
                          title="Drag corner directly to resize card spans!"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="w-3.5 h-3.5 border-r-2 border-b-2 border-brand/50 group-hover/resize:border-brand transition-colors rounded-br" style={{ borderStyle: 'solid solid' }} />
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Minimalist List view of elements */
          <div className="flex flex-col gap-5 sm:gap-6 w-full max-w-5xl mx-auto pb-16">
            {filteredCards.map((card, index) => {
              const CategoryIcon = iconMap[card.categoryIcon] || Image;
              const CardIcon = iconMap[card.cardIcon] || Image;
              const isAiWriter = card.id === 'ai-writer';
              
              const localizedCat = getTranslatedCategory(card.category, language);
              const { title: localizedTitle, desc: localizedDesc, buttonLabel: localizedBtn } = getCardTranslations(card.id, card.title, card.desc, card.buttonLabel);
              const localizedTagline = getTranslatedTagline(card.id, card.tagline, language);

              return (
                <motion.div
                  key={card.id}
                  layout
                  onDragOver={(e) => handleDragOver(e, card.id)}
                  onContextMenu={(e) => {
                    if (!isCustomizing) {
                      e.preventDefault();
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        toolId: card.id,
                        toolTitle: localizedTitle,
                      });
                    }
                  }}
                  className={`rounded-2xl border transition-all duration-300 relative bg-[#07070a]/90 flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 ${
                    isCustomizing
                      ? 'border-dashed border-brand/40 bg-brand/[0.015] p-4 shadow-inner'
                      : 'border-zinc-900 hover:border-brand/45 hover:bg-[#0c0c11]/90 shadow-lg'
                  }`}
                >
                  {/* Left Side: Drag Handle & Meta info & Title */}
                  <div className="flex flex-1 items-start sm:items-center gap-4 min-w-0">
                    {/* Reordering handle when customizing is active */}
                    {isCustomizing && (
                      <div 
                        draggable
                        onDragStart={(e) => handleDragStart(e, card.id)}
                        onDragEnd={handleDragEnd}
                        className="p-2 cursor-grab active:cursor-grabbing bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
                        title="Drag unit to swap sequence"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}

                    {/* Compact Icon */}
                    <div className="w-11 h-11 rounded-xl bg-zinc-950/70 border border-zinc-850 flex items-center justify-center text-brand flex-shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
                      <CardIcon className={`w-5.5 h-5.5 ${isAiWriter ? 'text-indigo-400 animate-pulse' : card.textClass}`} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <span className="font-heading text-[10px] uppercase font-bold text-brand tracking-widest bg-brand/5 px-2 py-0.5 rounded border border-brand/10">
                          {localizedCat}
                        </span>
                        <h4 className="font-heading text-sm font-bold text-white truncate">{localizedTitle}</h4>
                      </div>
                      
                      <p className="font-sans text-xs text-zinc-400 truncate max-w-3xl">
                        {localizedDesc}
                      </p>
                    </div>
                  </div>

                  {/* Mid-Right: Dynamic tagline details if space allows */}
                  <div className="hidden lg:block w-48 text-right flex-shrink-0 border-l border-zinc-900/40 pl-4">
                    <span className="font-mono text-[9px] text-[#94a3b8] uppercase tracking-wider block">{dict.targetCapability}</span>
                    <span className="font-sans text-[11px] text-zinc-500 italic block truncate" title={localizedTagline}>{localizedTagline}</span>
                  </div>

                  {/* Far Right: Actions and modifiers */}
                  <div className="flex items-center gap-3 justify-end flex-shrink-0">
                    {/* Pin/Unpin Action Button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); togglePin(card.id); }}
                      className={`p-2 rounded-lg transition-all cursor-pointer ${
                        card.pinned 
                          ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.25)]' 
                          : 'text-zinc-655 hover:text-zinc-300 hover:bg-zinc-900 border border-zinc-900'
                      }`}
                      title={
                        card.pinned 
                          ? (language === 'es' ? 'Desfijar herramienta de la parte superior' : language === 'fr' ? 'Dépingler' : language === 'de' ? 'Anheftung aufheben' : language === 'pt' ? 'Desafixar topo' : 'Unpin Tool')
                          : (language === 'es' ? 'Fijar herramienta al principio' : language === 'fr' ? 'Épingler en haut' : language === 'de' ? 'Werkzeug oben anheften' : language === 'pt' ? 'Fixar topo' : 'Pin Tool to Top')
                      }
                    >
                      <Pin className={`w-3.5 h-3.5 transition-all duration-300 ${card.pinned ? 'rotate-0 text-amber-400 fill-amber-400/30 scale-110' : '-rotate-45 group-hover:scale-110'}`} />
                    </button>

                    {isCustomizing && (
                      <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-900 shadow-sm">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveCard(card.id, -1); }}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
                          title={dict.shiftUpstream}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveCard(card.id, 1); }}
                          disabled={index === cards.length - 1}
                          className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
                          title={dict.shiftDownstream}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        <div className="text-[10px] font-mono text-zinc-500 px-2 border-l border-zinc-850">
                          Pos: #{index + 1}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isCustomizing}
                      onClick={() => !isCustomizing && onTabChange(card.id as ActiveTab)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-heading font-extrabold tracking-wider uppercase transition-all ${
                        isCustomizing
                          ? 'bg-zinc-900/20 text-zinc-600 border border-zinc-950 cursor-not-allowed'
                          : 'bg-zinc-900 hover:bg-brand hover:text-zinc-950 text-brand border border-zinc-800 hover:border-brand-border cursor-pointer shadow-md'
                      }`}
                    >
                      <span>{isCustomizing ? dict.editingActive : localizedBtn}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}
      </div>

      {/* Concurrent WASM Task Queue Module */}
      <TaskQueue />

      {/* Recent Files & Sandbox Downloads Ledger */}
      <div id="dashboard-files-ledger" className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/60 space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-brand-border/20 pb-5">
          <div className="space-y-1.5 flex-1 select-none">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand transition-colors duration-500 animate-pulse" />
              <h2 className="font-heading text-lg font-bold text-white uppercase tracking-wider">{dict.recentFilesLedger}</h2>
            </div>
            <p className="font-sans text-xs text-zinc-400 max-w-2xl leading-relaxed">
              {dict.ledgerDesc}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {recentOps.length > 0 && (
              <button
                onClick={clearSessionActivity}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-zinc-950 border border-zinc-800/80 text-xs font-mono font-bold text-zinc-400 hover:text-red-400 hover:border-red-900/50 transition-all cursor-pointer shadow-md select-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{dict.formatLedgerHistory}</span>
              </button>
            )}
          </div>
        </div>

        {recentOps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
            {/* STAT A: Operations Audited */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-900/60 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-brand" />
                <span>{dict.auditedTransactions}</span>
              </div>
              <div className="font-mono text-xl font-bold text-white flex items-baseline gap-1">
                <span>{recentOps.length}</span>
                <span className="text-zinc-600 text-xs font-normal">/ 5 max</span>
              </div>
            </div>

            {/* STAT B: Total Savings Metrics */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-900/60 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>{dict.localOptimizerImpact}</span>
              </div>
              <div className="font-mono text-xl font-bold text-emerald-400 flex items-baseline gap-1.5">
                <span>{historyStats.hasCompressionData ? historyStats.totalSavedStr : "N/A"}</span>
                {historyStats.hasCompressionData && (
                  <span className="text-emerald-500 text-xs bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    ~{historyStats.avgSavingsPercent}% saved
                  </span>
                )}
              </div>
            </div>

            {/* STAT C: Registry Sandbox Durability */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-900/60 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                <span>{dict.ledgerSecurityMatrix}</span>
              </div>
              <div className="font-mono text-xs font-bold text-zinc-300 h-7 flex items-center">
                <span className="bg-[#0c0c10] border border-brand/20 text-brand px-2 py-0.5 rounded text-[10px] uppercase font-semibold">
                  {dict.clientSideIsolated}
                </span>
              </div>
            </div>
          </div>
        )}

        {recentOps.length > 0 && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1 bg-[#09090d]/30 p-3 rounded-lg border border-zinc-900/50">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', 'PDF Compression', 'WebP Conversion', 'Image to PDF'] as const).map((type) => {
                const isActive = filterType === type;
                const filterLabels: Record<string, Record<string, string>> = {
                  en: {
                    'All': 'All Formats',
                    'PDF Compression': 'PDF Compression',
                    'WebP Conversion': 'WebP Conversion',
                    'Image to PDF': 'Image to PDF'
                  },
                  es: {
                    'All': 'Todos los Formatos',
                    'PDF Compression': 'Compresión PDF',
                    'WebP Conversion': 'Conversión WebP',
                    'Image to PDF': 'Imagen a PDF'
                  },
                  fr: {
                    'All': 'Tous les Formats',
                    'PDF Compression': 'Compression PDF',
                    'WebP Conversion': 'Conversion WebP',
                    'Image to PDF': 'Image en PDF'
                  },
                  de: {
                    'All': 'Alle Formate',
                    'PDF Compression': 'PDF-Komprimierung',
                    'WebP Conversion': 'WebP-Konvertierung',
                    'Image to PDF': 'Bild in PDF'
                  },
                  pt: {
                    'All': 'Todos os Formatos',
                    'PDF Compression': 'Compressão PDF',
                    'WebP Conversion': 'Conversão WebP',
                    'Image to PDF': 'Imagem para PDF'
                  }
                };
                const displayLabel = filterLabels[language]?.[type] || type;

                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded text-xs font-heading font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-brand text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {displayLabel}
                  </button>
                );
              })}
            </div>

            {/* Live Search bar */}
            <div className="relative flex-1 max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={dict.lookupPlaceholder}
                className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand/50 font-sans transition-colors"
              />
            </div>
          </div>
        )}

        {recentOps.length === 0 ? (
          <div className="py-16 text-center rounded-xl bg-zinc-950/25 border border-dashed border-zinc-900/60 max-w-lg mx-auto space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-500 border border-zinc-800/80 animate-pulse">
              <Clock className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="font-heading text-sm font-bold text-zinc-300">
                {(() => {
                  const m: Record<string, string> = {
                    en: 'Sandbox Ledger Idle',
                    es: 'Libro de Sandbox Inactivo',
                    fr: 'Registre du Sandbox Inactif',
                    de: 'Protokoll im Leerlauf',
                    pt: 'Registro do Sandbox Ocioso'
                  };
                  return m[language] || m.en;
                })()}
              </p>
              <p className="font-sans text-xs text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                {(() => {
                  const m: Record<string, string> = {
                    en: 'No files processed during this runtime loop. Initialize any process from the utility deck above to populate history.',
                    es: 'No se procesaron archivos durante este bucle de ejecución. Inicie cualquier proceso desde la cubierta de utilidades de arriba para completar el historial.',
                    fr: 'Aucun fichier traité au cours de cette boucle d\'exécution. Initialisez n\'importe quel processus à partir du deck d\'utilitaires ci-dessus pour alimenter l\'historique.',
                    de: 'In dieser Laufzeitschleife wurden keine Dateien verarbeitet. Starten Sie einen beliebigen Prozess im obigen Bereich, um das Protokoll zu füllen.',
                    pt: 'Nenhum arquivo processado durante este loop de execução. Inicie qualquer processo no menu de utilitários acima para preencher o histórico.'
                  };
                  return m[language] || m.en;
                })()}
              </p>
            </div>
            <div className="pt-2">
              <span className="font-mono text-[9px] text-zinc-600 bg-zinc-950 border border-zinc-900/80 px-2 py-1 rounded">
                {(() => {
                  const m: Record<string, string> = {
                    en: 'DURABLE LOCALSTORAGE ENGINE STANDBY',
                    es: 'BÓVEDA DE MOTOR LOCAL REFORZADA',
                    fr: 'MOTEUR DE STOCKAGE LOCAL EN ATTENTE',
                    de: 'LOKALES SPEICHER-SYSTEM BEREIT',
                    pt: 'MOTOR DE ARMAZENAMENTO LOCAL EM ESPERA'
                  };
                  return m[language] || m.en;
                })()}
              </span>
            </div>
          </div>
        ) : filteredOps.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-zinc-950/15 border border-dashed border-zinc-900/40 max-w-md mx-auto space-y-3">
            <div className="mx-auto w-10 h-10 rounded-full bg-zinc-900/50 flex items-center justify-center text-zinc-600">
              <Search className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="font-heading text-xs font-bold text-zinc-400">
                {(() => {
                  const m: Record<string, string> = {
                    en: 'No matching operations found',
                    es: 'No se encontraron operaciones coincidentes',
                    fr: 'Aucune opération correspondante trouvée',
                    de: 'Keine übereinstimmenden Operationen gefunden',
                    pt: 'Nenhuma operação correspondente encontrada'
                  };
                  return m[language] || m.en;
                })()}
              </p>
              <p className="font-sans text-[11px] text-zinc-500 mt-1">
                {(() => {
                  const m: Record<string, string> = {
                    en: 'Refine your lookup keyword or format criteria.',
                    es: 'Refine su palabra clave de búsqueda o criterios de formato.',
                    fr: 'Affinez votre mot-clé de recherche ou vos critères de format.',
                    de: 'Verfeinern Sie Ihren Suchbegriff oder Ihre Formatkriterien.',
                    pt: 'Refine sua palavra-chave de pesquisa ou critérios de formato.'
                  };
                  return m[language] || m.en;
                })()}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredOps.map((op) => {
              const liveUrl = getSessionDownloadUrl(op.id);
              const isPdf = op.type === 'PDF Compression' || op.type === 'Image to PDF';
              const isImageToPdf = op.type === 'Image to PDF';
              const Icon = isImageToPdf ? FileImage : (isPdf ? FileText : Image);

              // Calculate individual conversion savings if any
              const origBytes = parseSizeToBytes(op.originalSize);
              const newBytes = parseSizeToBytes(op.newSize);
              const savedBytes = origBytes > newBytes ? origBytes - newBytes : 0;
              const individualSavingsPercent = origBytes > 0 && savedBytes > 0 
                ? Math.round((savedBytes / origBytes) * 100) 
                : 0;

              return (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="beveled-panel bg-zinc-950/45 border-zinc-900/50 hover:border-brand-border/20 p-4.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 transition-all duration-300"
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                    <div className={`p-3 rounded-xl border flex-shrink-0 ${
                      op.type === 'PDF Compression'
                        ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' 
                        : op.type === 'Image to PDF'
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                          : 'bg-orange-500/5 border-orange-500/20 text-orange-400'
                    }`}>
                      <Icon className="w-5.5 h-5.5" />
                    </div>
                    
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-xs font-bold text-white truncate max-w-[220px] sm:max-w-md block" title={op.name}>
                          {op.name}
                        </span>
                        
                        <span className={`font-mono text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${
                          op.type === 'PDF Compression'
                            ? 'bg-rose-950/25 border border-rose-900/35 text-rose-400' 
                            : op.type === 'Image to PDF'
                              ? 'bg-emerald-950/25 border border-emerald-900/35 text-emerald-400'
                              : 'bg-orange-950/25 border border-orange-900/35 text-orange-400'
                        }`}>
                          {op.type}
                        </span>
                        
                        <span className="font-mono text-[9px] text-zinc-600">
                          {op.timestamp}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-zinc-400 leading-none">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-600">Scale Delta:</span>
                          <span className="text-zinc-500 line-through">{op.originalSize}</span>
                          <span className="text-zinc-600">&rarr;</span>
                          <span className={`${savedBytes > 0 ? 'text-emerald-400 font-bold' : 'text-zinc-300 font-semibold'}`}>
                            {op.newSize}
                          </span>
                        </div>
                        
                        {individualSavingsPercent > 0 && (
                          <div className="flex items-center gap-1 text-emerald-500/90 font-medium bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] uppercase">
                            <span>-{individualSavingsPercent}%</span>
                            <span className="text-zinc-600 text-[8px] font-normal font-sans">Compacted</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:items-center justify-between lg:justify-end gap-3 border-t lg:border-t-0 border-zinc-900/60 pt-3 lg:pt-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyFilename(op.id, op.name)}
                        className="p-2 rounded bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer animate-none"
                        title="Copy filename to clipboard"
                      >
                        {copiedId === op.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 scale-105" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Display active status pulse */}
                      {liveUrl ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 font-mono text-[9px] uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                          <span>Session Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-950 border border-zinc-900 text-zinc-500 font-mono text-[9px] uppercase">
                          <span>Session Expired</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {liveUrl ? (
                        <a
                          href={liveUrl}
                          download={op.downloadName}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 font-heading font-extrabold text-xs transition-all uppercase tracking-wider cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.02)]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Re-download</span>
                        </a>
                      ) : (
                        <div 
                          className="group relative cursor-help inline-flex items-center justify-center p-2 rounded bg-zinc-950 border border-zinc-900 text-zinc-600"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span className="pointer-events-none absolute bottom-full right-0 mb-2 w-48 scale-0 transition-all rounded bg-zinc-950 border border-zinc-800 p-2 text-[9px] font-mono text-zinc-400 leading-relaxed shadow-xl group-hover:scale-100 z-30">
                            Blob memory was garbage collected upon tab reload. Re-convert your source file to recover download.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Workspace Preferences & Storage Diagnostics */}
      <div id="dashboard-preferences-diagnostics" className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/60 space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-brand-border/20 pb-5">
          <div className="space-y-1.5 flex-1 select-none">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-brand transition-colors duration-500 animate-pulse" />
              <h2 className="font-heading text-lg font-bold text-white uppercase tracking-wider">Preferences & Config Vault</h2>
            </div>
            <p className="font-sans text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Synchronize, export, or restore your customized utility layout configurations, aesthetics, complexity criteria, and translation selections directly back to your sandboxed offline disk database.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
            <button
              onClick={handleExportBackup}
              className="px-3.5 py-2 rounded bg-zinc-950 hover:bg-zinc-900 border border-zinc-805 text-xs font-mono font-bold text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 shadow-md hover:border-brand/40"
              title="Download your layout preferences and tool configurations as a transportable JSON backup config"
            >
              <Download className="w-4 h-4 text-brand" />
              <span>Export Presets JSON</span>
            </button>
            <label
              htmlFor="dashboard-backup-upload-input"
              className="px-3.5 py-2 rounded bg-zinc-950 hover:bg-zinc-900 border border-zinc-805 text-xs font-mono font-bold text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 shadow-md hover:border-brand/40 select-none text-center"
              title="Upload an exported configurations JSON backup to fully restore your settings state"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Import Presets JSON</span>
            </label>
            <input
              id="dashboard-backup-upload-input"
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
            <button
              onClick={handleFactoryResetAllAll}
              className="px-3.5 py-2 rounded bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/50 text-xs font-mono font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer flex items-center gap-2 shadow-md"
              title="Clear all stored customized layouts, history, presets, and preferred navigation selections completely"
            >
              <RotateCcw className="w-4 h-4 text-red-500" />
              <span>Format Disk Storage</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
          {/* Diagnostic Stats A: Key Occupations */}
          <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Storage Sector Keys</span>
              <span className="text-[10px] font-mono text-zinc-400 font-bold max-w-[120px] truncate">apex_registry</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1 bg-zinc-900/40 p-2 border border-zinc-900/60 rounded-lg">
                <span className="font-mono text-2xl font-bold text-white">{storageStats.usedKeysCount}</span>
                <span className="text-zinc-500 text-xs">active records</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans leading-normal">
                Includes active layouts, default tool sliders, password complexity records, translation settings, and history states.
              </p>
            </div>
          </div>

          {/* Diagnostic Stats B: Storage Footprint Size */}
          <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Disk Capacity Allocated</span>
              <span className="text-[10px] font-mono text-brand font-bold">Client-Side Cache</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5 bg-zinc-900/40 p-2 border border-zinc-900/60 rounded-lg">
                <span className="font-mono text-2xl font-bold text-brand">{storageStats.totalKb} KB</span>
                <span className="text-zinc-500 text-[10px] font-semibold bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-900/80">Offline Disks</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans leading-normal">
                Strict browser local storage footprint sandbox. No network socket overhead is spent syncing variables.
              </p>
            </div>
          </div>

          {/* Diagnostic Stats C: Relative Storage Bar */}
          <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-xl space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Local Latency Index</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">&larr; 1ms Instant Response</span>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/60 relative">
                <div 
                  className="h-full bg-gradient-to-r from-brand to-emerald-400 transition-all duration-700" 
                  style={{ width: `${Math.max(1.5, storageStats.percentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-zinc-600">
                <span>Used: {storageStats.percentage}%</span>
                <span>Max Capacity: 5 MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Compliance Monitor and Search Engine Keywords Panel */}
      <div id="dashboard-seo-indicators" className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/60">
        <h3 className="font-heading text-xs uppercase font-bold text-brand tracking-wider mb-3 transition-colors duration-500">Principal Technical SEO Indicators</h3>
        <p className="font-sans text-xs text-zinc-400 leading-relaxed mb-4">
          This hub provides integrated semantic metadata models, JSON-LD structured schemas, and strict, crawls-compliant DOM layouts mapped directly into the static routes. No heavy script hydration to secure absolute indexing capabilities.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-[10px]">
          <div className="p-3 bg-zinc-950 rounded border border-zinc-900">
            <span className="text-zinc-500 block mb-1">Targeting Payload 1:</span>
            <span className="text-zinc-300 font-semibold uppercase">PDF Compressor</span>
          </div>
          <div className="p-3 bg-zinc-950 rounded border border-zinc-900">
            <span className="text-zinc-500 block mb-1">Targeting Payload 2:</span>
            <span className="text-zinc-300 font-semibold uppercase">WebP Converter</span>
          </div>
          <div className="p-3 bg-zinc-950 rounded border border-zinc-900">
            <span className="text-zinc-500 block mb-1">Targeting Payload 3:</span>
            <span className="text-brand font-semibold uppercase font-bold transition-colors duration-500">Client-Side WASM</span>
          </div>
          <div className="p-3 bg-zinc-950 rounded border border-zinc-900">
            <span className="text-zinc-500 block mb-1">Sitemap Priority Weights:</span>
            <span className="text-emerald-400 font-bold">1.0 / 0.8 Weekly</span>
          </div>
        </div>
      </div>

      {/* Workspace Capture Studio Modal */}
      <DashboardCaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        targetElementId="workspace-dashboard-layout"
        onSuccess={(msg) => showNotification(msg, 'success')}
        onError={(msg) => showNotification(msg, 'error')}
      />

      {/* Toast Notification HUD */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full shadow-2xl pointer-events-auto"
          >
            <div className={`p-4 rounded-xl border flex items-start gap-3 bg-[#0a0a0f] ${
              notification.type === 'success' 
                ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] text-emerald-400'
                : notification.type === 'error'
                  ? 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)] text-red-400'
                  : 'border-brand/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] text-brand'
            }`}>
              <div className="flex-shrink-0 mt-0.5 animate-pulse">
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : notification.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <Info className="w-5 h-5 text-brand" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading text-xs uppercase font-extrabold tracking-wider leading-none mb-1">
                  System Notification
                </p>
                <p className="font-sans text-xs text-zinc-300 leading-normal">
                  {notification.message}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          toolId={contextMenu.toolId}
          toolTitle={contextMenu.toolTitle}
          onLaunch={() => onTabChange(contextMenu.toolId as ActiveTab)}
          onAskGemini={() => {
            window.dispatchEvent(
              new CustomEvent('open-ai-assistant', {
                detail: {
                  text: `How do I use the ${contextMenu.toolTitle}? Tell me about its features, search crawler relevance, and how to optimize it for Google AdSense compliance in 2026.`
                }
              })
            );
          }}
          onCreateQR={() => {
            onTabChange('qr-generator');
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent('populate-qr-data', {
                  detail: {
                    text: `${window.location.origin}/#${contextMenu.toolId}`
                  }
                })
              );
            }, 400);
          }}
        />
      )}
    </div>
  );
}

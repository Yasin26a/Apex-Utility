import React from 'react';
import { BookOpen, ShieldCheck, Cpu, Star, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ActiveTab } from '../types';
import { SEO_H1_MAPPING } from '../seo-mapping';

interface ContextualSEOSectionProps {
  activeTab: ActiveTab;
}

interface ToolCategoryMeta {
  categoryName: string;
  badgeColor: string;
  borderColor: string;
  textColor: string;
  iconBg: string;
  techStack: string[];
  commonKeywords: string[];
  benefitDescription: string;
  useCaseDescription: string;
}

const CATEGORY_META_MAPPING: Record<string, ToolCategoryMeta> = {
  pdf: {
    categoryName: 'Secure PDF Document Engineering',
    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
    borderColor: 'border-red-950/30',
    textColor: 'text-red-400',
    iconBg: 'bg-red-950/20',
    techStack: ['pdfjs-dist', 'PDF-Lib.js', 'Web Assembly (WASM)', 'Client-Side File System API'],
    commonKeywords: ['PDF compression', 'merge PDF online', 'secure PDF unlocker', 'sign PDF', 'edit PDF pages', 'offline PDF converter'],
    benefitDescription: 'All PDF processing executes entirely within your browser sandboxed workspace. Your corporate sensitive documents, legal agreements, and personal papers are never uploaded to remote servers, safeguarding your data sovereignty and complying with strict GDPR, CCPA, and enterprise-grade data privacy regulations.',
    useCaseDescription: 'Ideal for legal paralegals combining contracts, marketing specialists compressing media portfolios, and developers auditing document structure without leaking proprietary code or metadata to cloud backends.'
  },
  image: {
    categoryName: 'High-Fidelity Graphic & Image Processing',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    borderColor: 'border-emerald-950/30',
    textColor: 'text-emerald-400',
    iconBg: 'bg-emerald-950/20',
    techStack: ['HTML5 Canvas API', 'WebP Codec', 'IndexedDB', 'GPU Acceleration', 'FileReader API'],
    commonKeywords: ['WebP to PNG', 'bulk image converter', 'compress JPEG offline', 'SVG rasterizer', 'image cropper', 'lossless image optimizer'],
    benefitDescription: 'Our image optimization and vectorization engine utilizes browser-level GPU acceleration and modern canvas layouts. It optimizes visual assets and rasterizes vectors locally at sub-millisecond speeds, maintaining razor-sharp rendering quality and pixel density while shrinking file sizes up to 85% to help pass Google PageSpeed Core Web Vitals.',
    useCaseDescription: 'Saves hours for frontend developers aiming for flawless WebP image delivery, UI/UX designers building responsive high-res mockups, and content creators bulk-compressing site graphics.'
  },
  dev: {
    categoryName: 'Technical Developer & Format Sandbox',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    borderColor: 'border-purple-950/30',
    textColor: 'text-purple-400',
    iconBg: 'bg-purple-950/20',
    techStack: ['JSON Parse Engine', 'Web Cryptography API', 'AST Parsing', 'Regular Expressions', 'Regex Railroad Flowcharts'],
    commonKeywords: ['JSON beautifier', 'CSV to JSON converter', 'secure hash generator', 'regex tester', 'JSON diff checker', 'base64 decoder'],
    benefitDescription: 'Perfect for debugging formatted data arrays, validating complex schemas, generating cryptographically secure hashes (MD5, SHA-256, SHA-512), or compiling markdown syntax. Because the compiler is 100% offline, your sensitive credentials, secret tokens, database logs, and system payloads are completely secure from third-party interception.',
    useCaseDescription: 'Essential for system architects inspecting JSON Web Tokens (JWT), devops engineers building cron expression schedules, and backend engineers testing regex patterns or API payload schemas.'
  },
  seo: {
    categoryName: 'SEO Intelligence & Indexability Diagnostics',
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    borderColor: 'border-teal-950/30',
    textColor: 'text-teal-400',
    iconBg: 'bg-teal-950/20',
    techStack: ['XML Parser', 'Semantic LSI Modeling', 'DOM Parser API', 'Search Layout Simulator', 'Robots.txt Validator'],
    commonKeywords: ['Sitemap SEO audit', 'schema markup generator', 'keyword cluster tool', 'competitor gap analyzer', 'SERP snippet optimizer', 'robots.txt creator'],
    benefitDescription: 'Elevate your search visibility and streamline search layout optimization without paying for costly subscription software. Run rich schema validators, audit XML sitemap indexability metrics, analyze meta tag compliance, and audit redirect chains instantly to safeguard your on-page SEO layout structure against automated low-value-content filters.',
    useCaseDescription: 'Leveraged by SEO consultants auditing site headers, digital marketers generating structured product metadata, and webmasters looking to secure fast Google AdSense approval workflows.'
  },
  ai: {
    categoryName: 'Advanced AI Assistance & Semantic Content Synthesizer',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    borderColor: 'border-indigo-950/30',
    textColor: 'text-indigo-400',
    iconBg: 'bg-indigo-950/20',
    techStack: ['Gemini 3.5 Flash SDK', 'Structured JSON Schema Outlines', 'Vector Embeddings', 'Speech Recognition (STT)', 'Whisper Local Buffer'],
    commonKeywords: ['AI copywriting writer', 'AI humanizer converter', 'SEO content brief generator', 'AI audio transcriber', 'ATS resume checker', 'alt text generator'],
    benefitDescription: 'Our AI suite pairs cutting-edge models with structured templates. Draft multi-level article heading outlines, analyze semantic sentiment, rewrite machine-generated copy into fluent human styles, transcribe long-form speech recordings, or optimize your resume layout to clear rigorous Applicant Tracking System (ATS) algorithms with zero hassle.',
    useCaseDescription: 'A game-changer for content strategists constructing SEO keyword clusters, copywriters bypassing content detector flags, and job hunters structuring resumes to maximize interview rates.'
  },
  media: {
    categoryName: 'Client-Side Audio & Video Studio',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    borderColor: 'border-amber-950/30',
    textColor: 'text-amber-400',
    iconBg: 'bg-amber-950/20',
    techStack: ['Web Audio API', 'MediaRecorder API', 'AudioContext Timeline', 'HTML5 Video Players', 'SRT/VTT Translators'],
    commonKeywords: ['online audio trimmer', 'screen recorder free', 'mute video online', 'extract audio from MP4', 'video converter WebM', 'mic tester online'],
    benefitDescription: 'Perform rapid timeline cuts, transcode files, or record clean audio and video streams without downloading bloatware or uploading large gigabyte files. By running all rendering and timeline operations locally in browser memory, you experience instantaneous previews, infinite timeline edits, and zero data-leak security risks.',
    useCaseDescription: 'Perfect for social media managers converting MP4 video to looping GIFs, educators recording high-def webcam tutorials, and podcasters checking microphone input levels or editing raw audio clips.'
  },
  calc: {
    categoryName: 'Precision Engineering & Scientific Calculators',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    borderColor: 'border-blue-950/30',
    textColor: 'text-blue-400',
    iconBg: 'bg-blue-950/20',
    techStack: ['Amortization Formula Matrix', 'Floating Point Precision Math', 'Relative Timestamp Calculations', 'Hex-to-RGB Conversion Engine'],
    commonKeywords: ['loan amortization calculator', 'date interval calculator', 'BMI calculator online', 'color palette generator', 'unit measurement converter'],
    benefitDescription: 'Experience high-precision calculations, customized decimal formatting, and visual charts. Whether calculating monthly EMI interest balances, mapping dates with holidays, or converting metric and imperial measurements, our calculators deliver exact mathematical correctness instantly without sending your private financial or health inputs across the web.',
    useCaseDescription: 'Utilized by real-estate buyers computing monthly home mortgage rates, athletes tracking daily basal metabolic rates, and web designers crafting gorgeous color palettes.'
  }
};

// Map each ActiveTab to one of the category keys
const TAB_TO_CATEGORY_MAP: Record<ActiveTab, string> = {
  dashboard: 'calc',
  'compress-pdf': 'pdf',
  'webp-converter': 'image',
  'json-beautifier': 'dev',
  'sitemap-seo': 'seo',
  'sitemap-generator': 'seo',
  'image-to-pdf': 'pdf',
  'join-pdf': 'pdf',
  'ai-writer': 'ai',
  'password-generator': 'dev',
  'qr-generator': 'image',
  'unit-converter': 'calc',
  'svg-rasterizer': 'image',
  'batch-processor': 'image',
  'json-diff': 'dev',
  'secure-hash': 'dev',
  'color-palette': 'calc',
  'digital-signature': 'pdf',
  'seo-optimizer': 'seo',
  'base64-converter': 'dev',
  'regex-tester': 'dev',
  'csv-json-converter': 'dev',
  'image-compressor': 'image',
  'quick-image-optimizer': 'image',
  'rich-text-stats': 'dev',
  'audio-trimmer': 'media',
  'ai-transcriber': 'ai',
  'pdf-analyst': 'pdf',
  'exif-stripper': 'image',
  'image-vectorizer': 'image',
  'code-snapshot': 'image',
  'private-sketchpad': 'image',
  'case-converter': 'dev',
  'lorem-generator': 'dev',
  'image-cropper': 'image',
  'date-calculator': 'calc',
  'seo-inspect': 'seo',
  'privacy-policy': 'dev',
  'terms-of-service': 'dev',
  'about-us': 'dev',
  guides: 'seo',
  'content-planner': 'seo',
  'schema-generator': 'seo',
  'content-gap': 'seo',
  'keyword-cluster': 'seo',
  'css-generator': 'image',
  'robots-txt': 'seo',
  'dns-lookup': 'dev',
  'user-agent': 'dev',
  'html-markdown': 'dev',
  'meta-tags': 'seo',
  'ai-humanizer': 'ai',
  'tone-analyzer': 'ai',
  'resume-optimizer': 'ai',
  'text-summarizer': 'ai',
  'passport-photo': 'image',
  'meme-generator': 'image',
  'headshot-generator': 'ai',
  'image-upscaler': 'ai',
  'mockup-generator': 'image',
  'pdf-converter': 'pdf',
  'pdf-form-filler': 'pdf',
  'pdf-signer': 'pdf',
  'uuid-generator': 'dev',
  'cron-builder': 'dev',
  'jwt-decoder': 'dev',
  'favicon-generator': 'image',
  'gradient-generator': 'image',
  'password-sharer': 'dev',
  'data-breach': 'dev',
  'checksum-verifier': 'dev',
  'age-calculator': 'calc',
  'loan-calculator': 'calc',
  'bmi-calculator': 'calc',
  'video-recorder': 'media',
  'screen-recorder': 'media',
  'webcam-recorder': 'media',
  'voice-recorder': 'media',
  'video-compressor': 'media',
  'video-resizer': 'media',
  'video-cutter': 'media',
  'mute-video': 'media',
  'video-speed': 'media',
  'video-rotator': 'media',
  'video-merger': 'media',
  'video-converter': 'media',
  'video-to-gif': 'media',
  'video-to-mp3': 'media',
  'audio-converter': 'media',
  'subtitle-converter': 'media',
  'microphone-tester': 'media',
  'webcam-check': 'media',
  'speaker-tester': 'media',
  'bento-grid': 'image',
  'tailwind-grid': 'image',
  'clip-path': 'image',
  'pattern-blob': 'image',
  'json-node-map': 'dev',
  'bezier-spline': 'image',
  'glass-brutalist': 'image',
  'regex-flowchart': 'dev',
  'redirect-auditor': 'seo',
  'google-serp': 'seo',
  'sql-formatter': 'dev',
  'subnet-cidr': 'dev',
  'svg-wave': 'image',
  'box-shadow': 'image',
  'social-hooks': 'ai',
  'code-explainer': 'ai',
  'alt-text-generator': 'ai',
  'keyword-difficulty': 'seo',
  'url-slugifier': 'seo',
  'meta-tag-auditor': 'seo',
  'rest-playpen': 'dev',
  'markdown-compiler': 'dev',
  'visual-pdf-organizer': 'pdf',
  'pdf-unlocker': 'pdf',
  'ai-content-brief': 'ai'
};

export const ContextualSEOSection: React.FC<ContextualSEOSectionProps> = ({ activeTab }) => {
  const toolTitle = SEO_H1_MAPPING[activeTab] || 'Secure Productivity Tool';
  const categoryKey = TAB_TO_CATEGORY_MAP[activeTab] || 'calc';
  const meta = CATEGORY_META_MAPPING[categoryKey];

  if (!meta) return null;

  const displayWords = toolTitle.toLowerCase().replace(/free\s+|online\s+/gi, '').trim();

  return (
    <section 
      id={`seo-manual-${activeTab}`} 
      className="mt-16 pt-12 border-t border-zinc-900 w-full max-w-5xl mx-auto space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${meta.badgeColor}`}>
              {meta.categoryName}
            </span>
            <span className="bg-zinc-900 text-zinc-500 text-[10px] font-mono px-2 py-1 rounded-full border border-zinc-800">
              Ver. 1.0.8 Offline
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            SEO &amp; Technical Manual: <span className="text-zinc-400 font-normal">{toolTitle}</span>
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Local Data Sandbox verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Core Educational Content (200-300 Words) */}
        <div className="lg:col-span-8 space-y-6 text-sm text-zinc-400 leading-relaxed font-sans">
          <p>
            Understanding the precise underlying pipeline of the <strong>{displayWords}</strong> is critical for achieving optimal workflow productivity. Unlike server-side alternatives that transfer files and parameter payloads to remote endpoints, our tool relies exclusively on client-side sandboxed execution. This ensures that your private files, analytical queries, and generated materials remain in your browser memory.
          </p>

          <p>
            The major technical benefit of this localized processing architecture is twofold: <strong>absolute speed</strong> and <strong>complete data privacy</strong>. Without the network overhead of uploading or downloading assets, tasks complete in microseconds. Utilizing native Web APIs like the {meta.techStack.slice(0, 2).join(' and ')}, calculations and modifications execute seamlessly across different desktop and mobile operating systems.
          </p>

          <p>
            Common integration use cases include high-intensity development environments, search engine optimization planning campaigns, and secure offline-first content preparation. By utilizing this suite, team members can bypass traditional software installation blocks, optimize pages for Core Web Vitals, and ensure that no sensitive data is leaked during daily administrative operations.
          </p>

          <div className="bg-[#050508]/60 border border-zinc-900/80 rounded-xl p-5 space-y-3.5">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Core Execution Pipeline Specs
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase font-mono">Latency Ratio</p>
                <p className="text-white font-mono font-extrabold text-sm">&lt; 0.15ms</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase font-mono">Server Upload</p>
                <p className="text-rose-400 font-mono font-extrabold text-sm">0% Blocked</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase font-mono">Thread Pool</p>
                <p className="text-emerald-400 font-mono font-extrabold text-sm">Main/Worker</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase font-mono">AdSense Status</p>
                <p className="text-brand font-mono font-extrabold text-sm">Compliant</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Meta Matrix & Key-Value Specs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#050508]/80 border border-zinc-900/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider font-mono">
              <BookOpen className="w-3.5 h-3.5 text-brand" />
              <span>Target LSI Keywords</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {meta.commonKeywords.map((kw, i) => (
                <span 
                  key={i} 
                  className="bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-400 font-mono px-2 py-1 rounded border border-zinc-800/80 hover:text-white transition-colors cursor-default"
                >
                  #{kw.replace(/\s+/g, '-')}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-zinc-950/20 border border-zinc-900/60 rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-500 uppercase font-mono">Built-In Libraries</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {meta.techStack.map((tech, i) => (
                  <span key={i} className="bg-zinc-900/60 text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-900">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-900/80 space-y-2">
              <div className="flex items-start gap-2 text-xs text-zinc-400 leading-normal">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Prevents "Low Value Content" search rejection triggers.</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-zinc-400 leading-normal">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Injects valid structural Schema descriptors dynamically.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

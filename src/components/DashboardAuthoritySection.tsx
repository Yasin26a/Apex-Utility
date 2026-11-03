import React, { useState } from 'react';
import { 
  ShieldCheck, Cpu, Zap, Lock, BookOpen, Layers, 
  CheckCircle2, ArrowRight, Activity, Terminal, Globe, 
  HelpCircle, ChevronDown, ChevronUp, FileCode, Sparkles, Scale
} from 'lucide-react';
import { ActiveTab } from '../types';

interface DashboardAuthoritySectionProps {
  onTabChange?: (tab: ActiveTab) => void;
}

export default function DashboardAuthoritySection({ onTabChange }: DashboardAuthoritySectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(prev => prev === idx ? null : idx);
  };

  const architecturalPillars = [
    {
      title: 'Decentralized Browser Memory Architecture',
      icon: Cpu,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      description: 'Unlike traditional cloud processing sites that force you to upload documents and media to remote servers, APEX executes all binary calculations directly inside your browser virtual memory using WebAssembly (WASM), Web Workers, and the HTML5 Canvas API. Your sensitive corporate PDFs, photos, and code snippets never cross the internet or touch an external hard drive.'
    },
    {
      title: 'Core Web Vitals Performance Optimization',
      icon: Zap,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      description: 'Every utility in our suite is designed to elevate Google PageSpeed benchmarks. From converting bloated PNGs to high-efficiency WebP images to stripping unmapped PDF metadata streams and minifying JSON payloads, our tools help developers slash Largest Contentful Paint (LCP) times and eliminate Cumulative Layout Shift (CLS).'
    },
    {
      title: 'Cryptographic Privacy & Data Sovereignty',
      icon: Lock,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      description: 'We adhere strictly to the principle of Data Protection by Design and by Default (GDPR Article 25). Built-in client-side cryptographic functions utilize the browser SubtleCrypto Web Cryptography API to generate SHA-256 and SHA-512 checksums without server logging, third-party analytics telemetry, or persistent tracking cookies.'
    },
    {
      title: 'Search Engine Indexability & Clean Markup',
      icon: Globe,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      description: 'Built for professional webmasters and SEO strategists, our suite provides Schema.org JSON-LD generation, XML sitemap validation, robots.txt auditing, and SERP snippet simulation to guarantee search engines parse, understand, and index your content without crawling bottlenecks or technical penalties.'
    }
  ];

  const comparisonRows = [
    {
      feature: 'Data Processing Location',
      apex: '100% In-Browser RAM (Zero Server Upload)',
      legacy: 'Uploaded to Remote Cloud Server Farms',
      advantage: 'apex'
    },
    {
      feature: 'Execution Speed & Latency',
      apex: 'Sub-Millisecond Instant Local Rendering',
      legacy: 'Queued Server Jobs (5 - 45s Network Wait)',
      advantage: 'apex'
    },
    {
      feature: 'Document Security & Privacy',
      apex: 'Complete Sovereignty (Zero Data Retention)',
      legacy: 'Stored Temporarily on Cloud Drives',
      advantage: 'apex'
    },
    {
      feature: 'Ad Distraction & Pop-Ups',
      apex: 'Zero Intrusive Pop-Ups or Forced Redirects',
      legacy: 'Aggressive Interstitial Popups & Fake Download Buttons',
      advantage: 'apex'
    },
    {
      feature: 'Export Watermarking',
      apex: '100% Watermark-Free Lossless Exports',
      legacy: 'Watermarks Placed on Free Tiers',
      advantage: 'apex'
    },
    {
      feature: 'Offline Usability',
      apex: 'Runs Completely Offline via PWA Caching',
      legacy: 'Requires Constant High-Speed Internet',
      advantage: 'apex'
    }
  ];

  const editorialFaqs = [
    {
      question: 'Why does APEX process files locally instead of on a backend cloud server?',
      answer: 'Processing files locally in your browser memory offers two transformative benefits: privacy and speed. When processing sensitive documents (such as legal contracts, tax forms, or proprietary source code), uploading them to a third-party server creates significant data security risks and potential GDPR violations. By executing all logic client-side via WebAssembly and HTML5 APIs, your files never leave your computer. Furthermore, bypassing network uploads and downloads allows tasks—like WebP compression or PDF restructuring—to complete almost instantaneously.'
    },
    {
      question: 'How do the image and PDF tools help improve Google PageSpeed Core Web Vitals?',
      answer: 'Google ranks websites based on user experience metrics known as Core Web Vitals. Heavy image assets and unoptimized PDF brochures significantly delay Largest Contentful Paint (LCP) and cause Cumulative Layout Shift (CLS). By converting JPGs and PNGs to next-generation WebP format, you can shrink image payloads by up to 85% with zero visible quality loss. Similarly, our PDF compressor strips redundant font subsets, unreferenced metadata nodes, and applies bicubic downscaling to keep document downloads under 2MB.'
    },
    {
      question: 'Are my uploaded files or text inputs ever logged or stored?',
      answer: 'No. APEX Utility operates with zero server-side storage infrastructure. There are no backend database clusters, file caches, or telemetry collectors recording your files. All operations occur in temporary virtual memory (RAM) allocated to your browser tab. Once you close or refresh the tab, that memory is instantly garbage-collected by your operating system.'
    },
    {
      question: 'What is the advantage of generating Schema.org structured data in JSON-LD format?',
      answer: 'Google explicitly recommends JSON-LD (JavaScript Object Notation for Linked Data) as the gold standard for structured data. Unlike legacy Microdata or RDFa that clutter your visible HTML tags, JSON-LD is embedded cleanly within a script tag. This enables Googlebot and Bingbot to parse entity relationships (such as FAQs, Product ratings, Articles, and Organization information) with 100% accuracy, qualifying your pages for visual rich snippets on search results.'
    },
    {
      question: 'How does the client-side XML Sitemap Generator handle large websites?',
      answer: 'Our XML Sitemap Generator builds standards-compliant sitemaps containing <url>, <loc>, <lastmod>, <changefreq>, and <priority> XML nodes in real-time. By leveraging client-side batching and memory arrays, it can generate clean XML maps for thousands of URLs without hitting API rate limits or timing out, ready to be deployed directly to your root domain and submitted to Google Search Console.'
    },
    {
      question: 'Can I use APEX utilities offline without an active internet connection?',
      answer: 'Yes. APEX is architected as an offline-first Progressive Web App (PWA). Once loaded into your browser, core WebAssembly binaries, canvas compressors, calculators, and syntax formatters are securely cached locally, enabling full functionality even in airplane mode or during network outages.'
    }
  ];

  return (
    <section className="mt-16 pt-12 border-t border-brand-border/30 max-w-5xl mx-auto space-y-16 text-zinc-300 font-sans leading-relaxed">
      
      {/* Section Header */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/20 text-[11px] font-mono tracking-widest text-brand uppercase font-bold">
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          <span>Webmaster & Developer Architectural Handbook</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight text-white leading-tight">
          High-Performance Client-Side Utilities for Modern Web Engineering
        </h2>
        <p className="text-sm text-zinc-400 font-sans leading-relaxed">
          Comprehensive technical documentation, performance benchmarks, and privacy architecture guidelines designed for developers, SEO strategists, and digital creators.
        </p>
      </div>

      {/* 4 Architectural Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {architecturalPillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div 
              key={idx}
              className="p-6 rounded-2xl bg-zinc-950/70 border border-zinc-900/80 hover:border-zinc-800 transition-all duration-300 space-y-3.5 shadow-lg relative group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${pillar.bgColor} ${pillar.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider">
                  {pillar.title}
                </h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed text-justify">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* In-Depth Technical Deep Dive Article */}
      <article className="p-8 rounded-2xl bg-[#07070b] border border-zinc-900 space-y-6 text-xs text-zinc-400 leading-relaxed text-justify shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-4">
          <Terminal className="w-4 h-4 text-brand shrink-0" />
          <h3 className="font-heading text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Client-Side Computing: Architectural Whitepaper & Security Model
          </h3>
        </div>

        <p className="indent-3">
          For over two decades, the dominant paradigm for web-based file transformation and developer utilities relied on server-side compute farms. When a user compressed a PDF, converted an image, or tested a regular expression, their local data was uploaded to an unknown cloud server, processed in an external container, and streamed back down. While functional, this legacy architecture introduces two severe drawbacks: <strong className="text-zinc-200">unacceptable latency bottlenecks</strong> caused by bidirectional network transfers, and <strong className="text-zinc-200">critical privacy vulnerabilities</strong> where confidential corporate documents, user identity records, and source code are cached on third-party servers.
        </p>

        <p className="indent-3">
          APEX Utility Labs represents a fundamental architectural departure from this legacy model. By leveraging contemporary advancements in browser virtual execution environments—specifically <strong className="text-zinc-200">WebAssembly (WASM)</strong>, <strong className="text-zinc-200">HTML5 Canvas hardware acceleration</strong>, <strong className="text-zinc-200">Web Workers</strong>, and the <strong className="text-zinc-200">Web Cryptography API (SubtleCrypto)</strong>—all computation is compiled and executed directly inside your local CPU and GPU pipelines.
        </p>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 font-mono text-[11px] text-zinc-400 space-y-2 my-4 not-italic">
          <div className="text-brand font-bold uppercase tracking-wider text-[10px]">Technical Guarantee & Security Verification:</div>
          <ul className="list-disc pl-5 space-y-1 text-zinc-400">
            <li><span className="text-zinc-200 font-semibold">Zero-Network File Pipeline:</span> Raw PDF streams, image buffers, and code snippets never generate POST payloads to remote storage endpoints.</li>
            <li><span className="text-zinc-200 font-semibold">Decentralized RAM Lifecycle:</span> Data is stored in ephemeral JavaScript ArrayBuffers, immediately purged from device RAM upon tab closure.</li>
            <li><span className="text-zinc-200 font-semibold">W3C & ISO Compliance:</span> Operates in strict compliance with GDPR Article 25 (Privacy by Design), California CCPA, and W3C Web Application Security standards.</li>
          </ul>
        </div>

        <p className="indent-3">
          This decentralized execution model delivers unprecedented speed. Because multi-megabyte payloads do not traverse internet cables or endure cloud server job queuing, high-intensity operations like PDF restructuring, WebP quantization, and SHA-512 cryptographic hashing execute in microseconds. Webmasters and developers gain an enterprise-grade digital laboratory that is completely private, permanent, and accessible across any modern desktop or mobile browser.
        </p>
      </article>

      {/* Side-by-Side Comparison Matrix */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-brand shrink-0" />
          <h3 className="font-heading text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Technical Architecture Comparison: APEX vs Legacy Cloud Utilities
          </h3>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-zinc-950/60 shadow-xl">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-900/40 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                <th className="p-3.5 pl-4">Architecture Parameter</th>
                <th className="p-3.5 text-brand font-bold">APEX Client-Side Suite</th>
                <th className="p-3.5 text-zinc-500">Legacy Cloud Server Farms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/20 transition-colors">
                  <td className="p-3.5 pl-4 font-medium text-zinc-200">{row.feature}</td>
                  <td className="p-3.5 text-emerald-400 font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{row.apex}</span>
                  </td>
                  <td className="p-3.5 text-zinc-500 font-mono">{row.legacy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Editorial FAQ Section with Interactive Accordions */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-brand shrink-0" />
            <h3 className="font-heading text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Frequently Asked Technical Questions (Webmaster Knowledge Base)
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Answers to common engineering, search indexability, and privacy compliance questions.
          </p>
        </div>

        <div className="space-y-3">
          {editorialFaqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="rounded-xl border border-zinc-900 hover:border-zinc-800 bg-[#07070b] overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 flex items-center justify-between text-left font-heading text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer select-none"
                >
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
                      0{idx + 1}
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <div className="p-1 rounded bg-zinc-900 text-zinc-400 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-4 pt-1 border-t border-zinc-900/60 font-sans text-xs text-zinc-400 leading-relaxed bg-zinc-950/30">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Editorial E-E-A-T Standards Notice */}
      <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-900 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>APEX Editorial Review &amp; Quality Constitution</span>
        </div>
        <p className="text-xs text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          All technical documentation, code snippets, and benchmark calculations published on APEX Utility Labs undergo peer review by certified software engineers and technical SEO professionals. Revised continuously to maintain compliance with 2026 Google Search Quality Rater Guidelines, Core Web Vitals thresholds, and browser security policies.
        </p>
      </div>

    </section>
  );
}

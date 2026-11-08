import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, Copy, Check, Download, ShieldCheck, 
  ChevronDown, ChevronUp, ArrowRight, Activity, Network, 
  Wifi, Globe, Search, Shield
} from 'lucide-react';
import { AdSlot } from '../AdSlot';
import { AffiliateRecommendations } from '../AffiliateRecommendations';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface RelatedTool {
  id: string;
  name: string;
  path: string;
  desc: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const ALL_NETWORK_TOOLS: RelatedTool[] = [
  {
    id: 'network-tools',
    name: 'Network Tools Suite Hub',
    path: '/network-tools',
    desc: 'Complete overview and quick diagnostic checks across all tools.',
    icon: Network
  },
  {
    id: 'internet-speed-test',
    name: 'Free Internet Speed Test',
    path: '/internet-speed-test',
    desc: 'Measure real-time download and upload bandwidth in Mbps with latency and jitter.',
    icon: Wifi
  },
  {
    id: 'ping-test',
    name: 'Free Online Ping Test',
    path: '/ping-test',
    desc: 'Measure HTTPS round-trip latency, connection jitter, and packet stability.',
    icon: Activity
  },
  {
    id: 'what-is-my-ip',
    name: 'What Is My IP Address',
    path: '/what-is-my-ip',
    desc: 'Detect your public IPv4 and IPv6 address, network provider, and browser info.',
    icon: Search
  },
  {
    id: 'dns-test',
    name: 'DNS Lookup & Speed Benchmark',
    path: '/dns-test',
    desc: 'Query DNS-over-HTTPS records (A, AAAA, MX, TXT) and compare resolver speeds.',
    icon: Globe
  },
  {
    id: 'ip-location',
    name: 'IP Location Finder',
    path: '/ip-location',
    desc: 'Lookup country, region, city, ISP, and approximate map area for any IP.',
    icon: Shield
  }
];

export interface ToolLayoutProps {
  currentToolId?: string;
  title: string;
  metaDescription?: string;
  canonicalPath?: string;
  badge?: string;
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  introDescription?: string;
  description?: string;
  resultForExport?: string;
  copyDownloadContent?: string;
  downloadFileName?: string;
  children: React.ReactNode;
  contentSections?: React.ReactNode;
  faqs: FaqItem[];
  onNavigateTab?: (path: string) => void;
  ariaAnnouncement?: string;
  announceMessage?: string;
  relatedTools?: Array<{
    id: string;
    name: string;
    path: string;
    desc?: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
}

export function ToolLayout({
  currentToolId = 'network-tools',
  title,
  metaDescription,
  canonicalPath,
  badge,
  badgeText,
  badgeIcon,
  introDescription,
  description,
  resultForExport,
  copyDownloadContent,
  downloadFileName,
  children,
  contentSections,
  faqs,
  onNavigateTab,
  ariaAnnouncement,
  announceMessage,
  relatedTools: customRelatedTools
}: ToolLayoutProps) {
  const [copied, setCopied] = useState(false);
  const [openFaqIndices, setOpenFaqIndices] = useState<Record<number, boolean>>({ 0: true });

  const effectiveBadge = badge || badgeText || 'Free Network Utility';
  const effectiveIntro = introDescription || description || '';
  const effectiveExport = resultForExport || copyDownloadContent || '';
  const effectiveAnnouncement = ariaAnnouncement || announceMessage || '';
  const effectiveCanonical = canonicalPath || `/${currentToolId}`;
  const effectiveMetaDesc = metaDescription || effectiveIntro;
  const effectiveDownloadFileName = downloadFileName || `${currentToolId}-results-${Date.now()}.txt`;

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopyResults = () => {
    if (!effectiveExport) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(effectiveExport)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy(effectiveExport));
    } else {
      fallbackCopy(effectiveExport);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Fallback copy failed:', e);
    }
    document.body.removeChild(textArea);
  };

  const handleDownloadTxt = () => {
    if (!effectiveExport) return;
    const blob = new Blob([effectiveExport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = effectiveDownloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Structured Data (JSON-LD) Ingestion
  useEffect(() => {
    const fullCanonicalUrl = `https://apexutility.live${effectiveCanonical}`;

    // 1. WebApplication Schema
    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: title,
      url: fullCanonicalUrl,
      description: effectiveMetaDesc,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    };

    // 2. BreadcrumbList Schema
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://apexutility.live/'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Network Tools',
          item: 'https://apexutility.live/network-tools'
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: title,
          item: fullCanonicalUrl
        }
      ]
    };

    // 3. FAQPage Schema
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer
        }
      }))
    };

    const scriptIds = ['jsonld-webapp', 'jsonld-breadcrumbs', 'jsonld-faq'];
    const schemas = [webAppSchema, breadcrumbSchema, faqSchema];

    scriptIds.forEach((id, i) => {
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schemas[i]);
    });

    return () => {
      scriptIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    };
  }, [effectiveCanonical, title, effectiveMetaDesc, faqs]);

  const resolvedRelatedTools: RelatedTool[] = customRelatedTools
    ? customRelatedTools.map(t => ({
        id: t.id,
        name: t.name,
        path: t.path,
        desc: t.desc || t.description || '',
        icon: t.icon || Network
      }))
    : ALL_NETWORK_TOOLS.filter(t => t.id !== currentToolId);

  return (
    <article className="max-w-6xl mx-auto space-y-10 pb-20 text-zinc-100">
      {/* Accessible live region for phase announcements (no tick spam) */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {effectiveAnnouncement}
      </div>

      {/* =====================================================================
          BREADCRUMBS & TOP HEADER
          ===================================================================== */}
      <header className="space-y-4 pt-2">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-400">
          <a 
            href="/"
            onClick={e => {
              if (onNavigateTab) {
                e.preventDefault();
                onNavigateTab('dashboard');
              }
            }}
            className="hover:text-white transition-colors"
          >
            Home
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <a 
            href="/network-tools"
            onClick={e => {
              if (onNavigateTab) {
                e.preventDefault();
                onNavigateTab('network-tools');
              }
            }}
            className="hover:text-white transition-colors"
          >
            Network Tools
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-zinc-200 font-semibold truncate" aria-current="page">
            {title}
          </span>
        </nav>

        {/* Title, Badge & Subheader */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
              {badgeIcon}
              <span>{effectiveBadge}</span>
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs text-zinc-400">
              No sign-up required
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs text-emerald-400 font-medium">
              100% In-Browser Privacy
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {title}
          </h1>

          {effectiveIntro && (
            <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
              {effectiveIntro}
            </p>
          )}
        </div>
      </header>

      {/* =====================================================================
          MAIN TOOL INTERACTIVE WORKSPACE
          ===================================================================== */}
      <section 
        aria-label="Interactive Diagnostic Tool" 
        className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-2xl relative"
      >
        {children}

        {/* Global Result Actions & Estimates Disclaimer */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-zinc-400 italic leading-relaxed">
            Note: Results are estimates and vary with your device, Wi-Fi, VPN, browser and network conditions.
          </p>

          {effectiveExport && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyResults}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Copy output results to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                <span>{copied ? 'Copied' : 'Copy Results'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download results as .txt file"
              >
                <Download className="w-4 h-4 text-zinc-400" />
                <span>Download as .txt</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          DATA PRIVACY & INTEGRITY STATEMENT
          ===================================================================== */}
      <section 
        aria-label="Privacy & Handling Statement"
        className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-start gap-4"
      >
        <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 text-xs text-zinc-400 leading-relaxed">
          <h2 className="text-sm font-bold text-white tracking-tight">
            How We Handle Your Data
          </h2>
          <p>
            Diagnostic measurements and results are displayed exclusively to you in your active browser session. This application does not log, store, or sell your IP address or query results to data brokers or advertising networks. Standard server access connection logs may be temporarily retained by our hosting infrastructure and edge CDN as outlined in our{' '}
            <a 
              href="/privacy-policy" 
              onClick={e => {
                if (onNavigateTab) {
                  e.preventDefault();
                  onNavigateTab('privacy-policy');
                }
              }}
              className="text-red-400 hover:underline font-medium"
            >
              Privacy Policy
            </a>.
          </p>
        </div>
      </section>

      {/* =====================================================================
          DETAILED WRITTEN CONTENT & TECHNICAL EXPLANATION SECTIONS
          ===================================================================== */}
      {contentSections && (
        <div className="space-y-10 prose prose-invert max-w-none">
          {contentSections}
        </div>
      )}

      {/* =====================================================================
          MONETIZATION & COMPLIANCE LAYER: IN-CONTENT AD & AFFILIATES
          Strictly positioned below tool results and content, zero CLS
          ===================================================================== */}
      <AdSlot variant="in-content" />

      <AffiliateRecommendations 
        page={currentToolId} 
        onNavigateTab={onNavigateTab} 
      />

      {/* =====================================================================
          FREQUENTLY ASKED QUESTIONS (ACCORDION & SCHEMA MATCHED)
          ===================================================================== */}
      {faqs && faqs.length > 0 && (
        <section aria-label="Frequently Asked Questions" className="space-y-4 pt-6 border-t border-zinc-800">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Answers to common questions regarding technical network routing, measurements, and security.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {faqs.map((faq, idx) => {
              const isOpen = !!openFaqIndices[idx];
              return (
                <div 
                  key={idx}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-950 overflow-hidden transition-colors hover:border-zinc-700"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-sm font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="leading-snug">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-red-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-900 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =====================================================================
          RELATED NETWORK TOOLS NAVIGATION CARDS
          ===================================================================== */}
      <section aria-label="Related Network Tools" className="space-y-4 pt-6 border-t border-zinc-800">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Explore Companion Network Tools
          </h2>
          <p className="text-xs text-zinc-400">
            Run diagnostic checks across bandwidth, latency, IP address validation, and DNS resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {resolvedRelatedTools.map(tool => {
            const Icon = tool.icon || Network;
            return (
              <a
                key={tool.id}
                href={tool.path}
                onClick={e => {
                  if (onNavigateTab) {
                    e.preventDefault();
                    onNavigateTab(tool.id);
                  }
                }}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all group flex flex-col justify-between cursor-pointer space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-red-400 group-hover:text-red-300 transition-colors">
                      <Icon className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                      {tool.name}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-red-400 group-hover:text-red-300">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </article>
  );
}

export default ToolLayout;

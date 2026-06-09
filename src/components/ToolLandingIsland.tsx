import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { getLandingPageConfig } from '../utils/seoLandingPages';
import { HelpCircle, ChevronRight, BookOpen, Layers, Sparkles, ExternalLink } from 'lucide-react';

interface ToolLandingIslandProps {
  toolId: ActiveTab;
  onTabChange?: (tab: ActiveTab) => void;
}

export default function ToolLandingIsland({ toolId, onTabChange }: ToolLandingIslandProps) {
  const config = getLandingPageConfig(toolId);
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({ 0: true });

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <article 
      className="mt-16 border-t border-brand-border/30 pt-12 max-w-4xl mx-auto space-y-12 text-zinc-300 font-sans leading-relaxed pb-8"
      id={`landing-seo-island-${toolId}`}
    >
      {/* Dynamic Semantic Section Header */}
      <div className="space-y-3.5 text-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/5 border border-brand/20 text-[10px] font-mono tracking-widest text-brand uppercase animate-pulse">
          <Sparkles className="w-3 h-3 text-brand" />
          <span>Search Engine Optimized Crawl Island</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-medium tracking-tight text-white leading-tight">
          {config.title}
        </h1>
        <p className="text-sm text-zinc-400 font-sans max-w-2xl mx-auto">
          {config.headline} &mdash; <span className="text-zinc-500">{config.subheadline}</span>
        </p>
      </div>

      {/* Grid containing Intro & Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Intro */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand shrink-0" />
            <h2 className="font-heading text-[12px] uppercase tracking-wider font-bold text-zinc-200">
              Technical Documentation & Overview
            </h2>
          </div>
          <p className="text-xs text-zinc-400 leading-normal text-justify">
            {config.introParagraph}
          </p>
          <div className="p-3 rounded bg-zinc-950/40 border border-zinc-900/60 font-mono text-[10px] text-zinc-500 space-y-1">
            <div><span className="text-brand">Target Index:</span> Free Client Utility Matrix</div>
            <div><span className="text-brand">Runtime Security:</span> 100% Fully Sandbox Sealed (Local Memory)</div>
            <div><span className="text-brand">SEO Target Queries:</span> {config.toolId.replace('-', ' ')} tool, free online offline</div>
          </div>
        </div>

        {/* Benefits List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand shrink-0" />
            <h2 className="font-heading text-[12px] uppercase tracking-wider font-bold text-zinc-200">
              Key Value Benchmarks
            </h2>
          </div>
          <ul className="space-y-2.5">
            {config.benefits.map((benefit, idx) => {
              const [title, desc] = benefit.split(': ');
              return (
                <li key={idx} className="flex gap-2 text-xs text-zinc-400 align-top">
                  <span className="text-brand font-mono leading-none mt-0.5">•</span>
                  <span>
                    <strong className="text-zinc-200">{title}</strong>: {desc}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Step Process Section */}
      <div className="beveled-panel bg-zinc-950/20 p-5 rounded-lg border-brand-border/40 space-y-4">
        <h2 className="font-heading text-[12px] uppercase tracking-wider font-bold text-zinc-200">
          How to Optimize & Process Files: Step-by-Step
        </h2>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {config.howToSteps.map((step, idx) => (
            <li key={idx} className="space-y-1.5 flex flex-col">
              <span className="font-mono text-[10px] text-brand/80 font-bold border-b border-brand-border/30 pb-0.5 max-w-max">
                STEP 0{idx + 1}
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* Structured microdata Schema.org Compliant FAQ Section (Accents Rich Listings) */}
      <div 
        className="space-y-4"
        itemScope 
        itemType="https://schema.org/FAQPage"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-brand shrink-0" />
          <h2 className="font-heading text-[12px] uppercase tracking-wider font-bold text-zinc-200">
            Frequently Asked Questions
          </h2>
        </div>
        
        <div className="space-y-2">
          {config.faqs.map((faq, idx) => {
            const isOpen = !!openFaqs[idx];
            return (
              <div 
                key={idx}
                itemProp="mainEntity"
                itemScope
                itemType="https://schema.org/Question"
                className="border border-zinc-900/60 rounded overflow-hidden transition-all bg-zinc-950/20"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-3 text-left flex justify-between items-center transition-colors hover:bg-zinc-950/60"
                >
                  <span itemProp="name" className="text-xs font-semibold text-zinc-200 pr-4">
                    {faq.question}
                  </span>
                  <ChevronRight 
                    className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-90 text-brand' : ''
                    }`} 
                  />
                </button>
                
                {isOpen && (
                  <div 
                    itemProp="acceptedAnswer" 
                    itemScope 
                    itemType="https://schema.org/Answer"
                    className="p-3 bg-zinc-950/40 border-t border-zinc-900/50 text-xs text-zinc-400 leading-relaxed"
                  >
                    <p itemProp="text">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Internal Navigation links mapping to support deep crawler paths */}
      {onTabChange && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded border border-zinc-900/40 bg-zinc-950/10">
          <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
            Explore more offline developers kits:
          </span>
          <div className="flex flex-wrap gap-2 justify-center">
            {config.relatedTools.map((related, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onTabChange(related.tab)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono border border-zinc-800 text-zinc-400 hover:text-brand hover:border-brand/40 bg-zinc-950 transition-all cursor-pointer"
              >
                <span>{related.label}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

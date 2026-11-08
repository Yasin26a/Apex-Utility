import React from 'react';
import { ShieldCheck, Info, ExternalLink, Scale, CheckCircle2, AlertCircle } from 'lucide-react';
import { BUSINESS_DETAILS } from '../../config/businessDetails';

export default function AffiliateDisclosurePage() {
  return (
    <article className="max-w-4xl mx-auto space-y-8 pb-16 text-zinc-100">
      <header className="space-y-3 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-950/60 border border-emerald-900/40 text-emerald-400 font-semibold">
            FTC &amp; Consumer Protection Compliance
          </span>
          <span className="text-xs text-zinc-500 font-mono">Effective: {BUSINESS_DETAILS.lastUpdatedDate}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Affiliate &amp; Commercial Disclosure
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Full transparency regarding commercial partnerships, affiliate links, and editorial standards at {BUSINESS_DETAILS.brandName}.
        </p>
      </header>

      {/* Primary FTC Statement Banner */}
      <section className="p-6 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-900/40 text-emerald-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white tracking-tight">
              FTC Disclosure Statement (16 CFR Part 255)
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              In compliance with the United States Federal Trade Commission (FTC) guidelines concerning the use of endorsements and testimonials in advertising, please assume that certain links appearing on <strong>{BUSINESS_DETAILS.domain}</strong> may be affiliate links.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed space-y-2">
          <p>
            When you click on an affiliate link and make a purchase or subscribe to a third-party service, <strong className="text-white">{BUSINESS_DETAILS.brandName}</strong> may receive a monetary commission or compensation from the vendor at <strong className="text-white">absolutely no additional cost to you</strong>.
          </p>
          <p className="text-zinc-400">
            All outbound commercial partner links on our website are programmatically tagged with <code className="text-red-300 font-mono bg-zinc-950 px-1 py-0.5 rounded">rel=&quot;sponsored noopener noreferrer&quot;</code> in accordance with search engine webmaster guidelines.
          </p>
        </div>
      </section>

      {/* Editorial Independence Principles */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Scale className="w-5 h-5 text-red-500" />
          <span>Editorial Independence &amp; Quality Commitment</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No Sponsored Reviews</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              We never accept payment to publish positive reviews, fabricate benchmarking statistics, or distort tool performance comparisons.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero Fake Scarcity</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              We prohibit fabricated countdown timers, artificial stock counters, fake customer ratings, and phantom purchase popups.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Technical Vetting</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Every recommended product is vetted by our engineering team for technical integrity, privacy compliance, and developer value.
            </p>
          </div>
        </div>
      </section>

      {/* Third-Party Trademark Disclaimer */}
      <section className="p-5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400 leading-relaxed space-y-2">
        <div className="font-semibold text-white flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Third-Party Trademarks &amp; Non-Affiliation Disclaimer</span>
        </div>
        <p>
          All product names, logos, trademarks, and registered trademarks mentioned on this website (including but not limited to Whop®, Google®, Cloudflare®, Ookla®, Speedtest®, and Speedtest Intelligence®) are the property of their respective owners. Reference to any specific company, commercial product, or trademark on {BUSINESS_DETAILS.domain} does not constitute or imply endorsement, sponsorship, or recommendation by {BUSINESS_DETAILS.brandName}, nor does it imply that {BUSINESS_DETAILS.brandName} is endorsed or sponsored by said trademark holders.
        </p>
      </section>

      {/* Contact Section */}
      <footer className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-zinc-500">
        <div>
          Published by <span className="text-zinc-300 font-semibold">{BUSINESS_DETAILS.brandName}</span> ({BUSINESS_DETAILS.contactEmail})
        </div>
        <div className="font-mono text-[11px]">
          Compliant with FTC Guides 16 CFR Part 255
        </div>
      </footer>
    </article>
  );
}

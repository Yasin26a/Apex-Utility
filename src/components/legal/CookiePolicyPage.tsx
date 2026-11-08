import React, { useState } from 'react';
import { Cookie, ShieldCheck, Settings, Eye, CheckCircle, RefreshCcw, Lock, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { BUSINESS_DETAILS } from '../../config/businessDetails';
import { useConsent } from '../../context/ConsentContext';

export default function CookiePolicyPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const { consent, openCookieSettings } = useConsent();

  const sections = [
    {
      id: 'overview',
      label: '1. Overview & Consent Mode v2',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
          <p>
            At <strong className="text-white">{BUSINESS_DETAILS.brandName}</strong> (
            <span className="font-mono text-zinc-200">{BUSINESS_DETAILS.domain}</span>), we believe in absolute transparency regarding browser storage, device tokens, and tracking technologies.
          </p>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Google Consent Mode v2 Enforced
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              In strict accordance with the European Union General Data Protection Regulation (GDPR), the UK Data Protection Act, and ePrivacy Directives, our platform initializes with all non-essential storage keys (<code className="text-red-300 bg-zinc-950 px-1 py-0.5 rounded">ad_storage</code>, <code className="text-red-300 bg-zinc-950 px-1 py-0.5 rounded">ad_user_data</code>, <code className="text-red-300 bg-zinc-950 px-1 py-0.5 rounded">ad_personalization</code>, and <code className="text-red-300 bg-zinc-950 px-1 py-0.5 rounded">analytics_storage</code>) set to <strong>denied</strong> by default until explicit consent is recorded.
            </p>
          </div>
          <p className="text-xs text-zinc-400">
            Current status in this session:
            <span className="ml-2 font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400">
              Ads: {consent.ad_storage.toUpperCase()} | Analytics: {consent.analytics_storage.toUpperCase()}
            </span>
          </p>
        </div>
      )
    },
    {
      id: 'cookie-categories',
      label: '2. Cookie & Storage Categories',
      icon: Cookie,
      content: (
        <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1">
              <div className="text-white font-semibold flex items-center justify-between">
                <span>A. Strictly Necessary &amp; Functional Storage</span>
                <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">Exempt from consent</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Used purely to preserve local client-side tool states (such as active themes, offline articles saved in IndexedDB, and speed test local history). No data is transmitted to remote analytics servers or advertising brokers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1">
              <div className="text-white font-semibold flex items-center justify-between">
                <span>B. Performance &amp; Analytics (GA4 &amp; Edge Telemetry)</span>
                <span className="text-[10px] font-mono bg-red-950/60 border border-red-900/40 text-red-300 px-2 py-0.5 rounded">Consent required</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                When consented, anonymized event aggregates (<code className="text-zinc-300">tool_start</code>, <code className="text-zinc-300">tool_complete</code>) are dispatched without user IP addresses, input parameters, or calculation payloads.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1">
              <div className="text-white font-semibold flex items-center justify-between">
                <span>C. Advertising &amp; Personalization (Google AdSense)</span>
                <span className="text-[10px] font-mono bg-red-950/60 border border-red-900/40 text-red-300 px-2 py-0.5 rounded">Consent required</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Google AdSense and its certified advertising partners may use cookies to serve non-intrusive advertisements based on previous website interactions. You may opt out of personalized advertising at any time.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'cmp-management',
      label: '3. Managing Your Preferences & Certified CMP',
      icon: Settings,
      content: (
        <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
          <p>
            You have the perpetual right to update, modify, or revoke your consent at any time during your browsing session.
          </p>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="font-semibold text-white">Interactive Consent Controls</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Click the button below to invoke our consent management modal or reopen Google&apos;s certified CMP interface:
            </p>
            <button
              type="button"
              onClick={openCookieSettings}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-lg shadow-red-950 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>Open Cookie &amp; Privacy Settings</span>
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            External network opt-outs can also be executed via the{' '}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">
              Google Ad Settings Portal
            </a>{' '}
            or the{' '}
            <a href="https://aboutads.info/choices" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">
              Digital Advertising Alliance Consumer Choice Gate
            </a>.
          </p>
        </div>
      )
    },
    {
      id: 'contact',
      label: '4. Contact & Regulatory Enquiries',
      icon: Info,
      content: (
        <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
          <p>
            For questions regarding our cookie practices, technical implementation of Google Consent Mode v2, or privacy rights, please reach out to:
          </p>
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 font-mono text-xs space-y-1 text-zinc-300">
            <div><strong>Organization:</strong> {BUSINESS_DETAILS.brandName}</div>
            <div><strong>Legal Contact:</strong> {BUSINESS_DETAILS.contactEmail}</div>
            <div><strong>Operating Domain:</strong> {BUSINESS_DETAILS.fullDomainUrl}</div>
            <div><strong>Last Reviewed:</strong> {BUSINESS_DETAILS.lastUpdatedDate}</div>
          </div>
        </div>
      )
    }
  ];

  return (
    <article className="max-w-4xl mx-auto space-y-8 pb-16 text-zinc-100">
      <header className="space-y-3 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-red-950/60 border border-red-900/40 text-red-400 font-semibold">
            Regulatory Compliance
          </span>
          <span className="text-xs text-zinc-500 font-mono">Updated: {BUSINESS_DETAILS.lastUpdatedDate}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Cookie &amp; Tracking Technology Policy
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Detailed transparency regarding our Google Consent Mode v2 implementation, local storage boundaries, and consumer rights.
        </p>
      </header>

      {/* Navigation tabs */}
      <nav aria-label="Cookie Policy Sections" className="flex flex-wrap gap-2 pb-2">
        {sections.map(section => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{section.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Active Section Content */}
      <section className="p-6 sm:p-8 rounded-2xl bg-zinc-950/80 border border-zinc-800 shadow-xl">
        {sections.find(s => s.id === activeSection)?.content}
      </section>
    </article>
  );
}

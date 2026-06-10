import React, { useState } from 'react';
import { Gavel, Scale, AlertCircle, FileText, Ban, Sparkles, HelpCircle } from 'lucide-react';

export default function TermsOfService() {
  const [activeTab, setActiveTab] = useState('acceptance');

  const tabs = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms & Context',
      icon: Gavel,
      content: (
        <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
          <p>
            By accessing or operating the workspace systems available at <span className="text-brand font-bold">Apex Utility Labs</span> (<span className="font-mono text-zinc-200 underline">https://apexutility.live</span>), you explicitly agree to compile and execute our client-side modules in accordance with these binding Terms of Service, all applicable consumer protection decrees, and local system regulations.
          </p>
          <p>
            If you do not accept these digital rules in full, you must immediately terminate your workspace connections and cease all file operations inside our terminal nodes.
          </p>
          <div className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-lg text-xs leading-normal text-zinc-400">
            <span className="text-white font-extrabold block mb-1">AESTHETIC LICENSING & AGE ATTESTATION:</span>
            Users must be of legal age or possess parental authorization within their native jurisdiction to deploy and interact with the compilers here.
          </div>
        </div>
      )
    },
    {
      id: 'calculations',
      title: '2. Client-Side Processing Paradigm',
      icon: Sparkles,
      content: (
        <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
          <p>
            APEX UTILITY is a collection of client-side web tools. By processing files on our site, you acknowledge and agree that:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <span className="text-white font-semibold">Decentralized Execution:</span> No documents lookups, conversion states, or parameter calculations are processed on cloud nodes or external servers. All activities happen in the virtual sandbox of your client web browser.
            </li>
            <li>
              <span className="text-white font-semibold">Precision Limitations:</span> Mathematical algorithms, scientific units, and layout parsing routines (including regex parsers, color palette calculations, and sitemap utilities) translate theoretical values with precision targets that may deviate from precise astronomical or physical constraints.
            </li>
            <li>
              <span className="text-white font-semibold">User Storage:</span> Setting saves are archived on local storage variables. You are solely responsible for managing your backup files using the selective "Backup & Move" utility.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'prohibited',
      title: '3. Prohibited Exploitees & Structural Safety',
      icon: Ban,
      content: (
        <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
          <p>
            You are strictly prohibited from exploiting our local assets in any of the following manners:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <span className="text-white font-semibold">No Scraping or Frame Hijacking:</span> Engaging in automated query farming, scrapers, data miners, or embedding sections inside sub-iframes without prior written authorization from the system registrar.
            </li>
            <li>
              <span className="text-white font-semibold">No Payload Overloads:</span> Compiling abnormally large nested buffers containing malware parameters in order to cause local buffer overflow flags inside other visitor's sandboxes.
            </li>
            <li>
              <span className="text-white font-semibold">Intellectual Property Preservation:</span> The mechanical stylesheets, build configs, font arrangements, and branding logos of **APEX UTILITY** belong exclusively to the site development operator. You may utilize compile code outputs freely for active monetization, but the app canvas templates themselves are protected under international code copyright regimes.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'disclaimer',
      title: '4. Absolute Disclaimer & "AS-IS" Protocols',
      icon: AlertCircle,
      content: (
        <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
          <p className="font-mono text-xs text-brand font-extrabold uppercase">
            SECTION 4: SYSTEM AS-IS WARRANTY MUTATION DECLARATION
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950 p-4 border border-zinc-900 rounded-lg">
            THE UTILITIES, WIDGETS, PDF PROCESSORS, AND COMPILER LOGS ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" STRUCTURAL STANDARD WITHOUT EXPRESS OR IMPLIED WARRANTY MATRIX SIGNS. WE APEX UTILITY DEVELOPERS DO NOT VOUCH FOR TRANSIT AVAILABILITY, PERMUTATION ACCURACY, LOG LOSS PREVENTION, OR FILE RETRIEVAL STABILITY. UNDER NO CIRCUMSTANCES SHALL YASIN ALAM OR APEX UTILITY BE LIABLE FOR CODE CRASHES, HARDWARE FLICKERS, DATA SELECTION LEAKS CODES, OR DIRECT PROPERTY DESTRUCTION RELATING TO YOUR APPLICATION USAGE FLOW.
          </p>
          <p>
            Users carry absolute personal liability for files processed. Always keep separate backup files of your sensitive code screenshots, rich-text logs, and design vectors before feeding them into client-side filters.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Visual Header card */}
      <div className="beveled-panel bg-[#09090d]/95 p-6 md:p-8 border-brand-border/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" style={{ backgroundColor: 'var(--theme-glow)', opacity: 0.15 }} />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/35 text-brand px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-extrabold">
              <Scale className="w-3.5 h-3.5" />
              <span>Binding Legal Standard Code</span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-black tracking-wider uppercase bg-clip-text text-white">
              Terms of Service
            </h1>
            <p className="font-mono text-xs text-zinc-500 leading-normal">
              CURRENT PROTOCOL VERSION: 2.1.0 • PUBLISHED AT: 2026-06-10T08:53:00Z • DOMAIN: APEXUTILITY.LIVE
            </p>
          </div>
          
          <div className="flex flex-col text-right max-md:text-left">
            <span className="text-[10px] text-zinc-500 font-mono uppercase">LEGAL REGISTER</span>
            <span className="text-sm font-extrabold text-white font-sans uppercase">GOVERNED GLOBALLY</span>
          </div>
        </div>
      </div>

      {/* Workspace Selector Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left p-3.5 rounded-xl border font-heading text-xs font-extrabold tracking-wider transition-all duration-300 flex items-center gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-brand/10 border-brand text-brand shadow-[0_0_15px_var(--theme-glow)]'
                    : 'bg-[#09090d]/80 border-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-brand/10 text-brand' : 'bg-zinc-950 text-zinc-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{tab.title.split('.')[1].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Content reader terminal */}
        <div className="lg:col-span-8">
          <div className="beveled-panel bg-[#09090d]/95 p-6 md:p-8 border-brand-border/40 shadow-xl min-h-[350px]">
            {tabs.map((tab) => {
              if (tab.id !== activeTab) return null;
              return (
                <div key={tab.id} className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-brand-border/20 mb-4">
                    <tab.icon className="w-5 h-5 text-brand" />
                    <h3 className="font-heading text-sm md:text-base font-extrabold text-white tracking-wider uppercase">
                      {tab.title}
                    </h3>
                  </div>
                  {tab.content}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compliance stamp info bar */}
      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 text-center text-[10px] text-zinc-500 font-mono">
        Apex Utility Labs reserves the absolute right to expand or suspend the local offline pipeline modules at any point without prior notice matrices. For further inquiries contact <a href="mailto:Yasinalam67@gmail.com" className="text-brand hover:underline">Yasinalam67@gmail.com</a>.
      </div>
    </div>
  );
}

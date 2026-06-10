import React, { useState } from 'react';
import { ShieldCheck, Eye, Database, Cookie, Lock, FileText, CheckCircle, RefreshCcw, Scale, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('data-processing');

  const complianceStamps = [
    { title: 'GDPR Coherent', desc: 'General Data Protection Regulation compliant standard protocols' },
    { title: 'CCPA Verified', desc: 'California Consumer Privacy Act user protection modules' },
    { title: 'COPPA Shield', desc: 'Complete Children Online Privacy Protection safeguard' },
    { title: 'AdSense Ready', desc: 'Doubleclick DART cookie dynamic transparency' }
  ];

  const sections = [
    {
      id: 'data-processing',
      label: '1. Client-Side & Core Offline Data Handling',
      icon: Database,
      content: (
        <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
          <p>
            At <span className="text-brand font-bold">Apex Utility Labs</span> (available via <span className="font-mono text-zinc-200 underline">https://apexutility.live</span>), user privacy is our highest constitutional priority. Unlike traditional cloud computing utilities, APEX UTILITY operates on an advanced client-side framework:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <span className="text-white font-semibold">Local WASM Workstation Pipelines:</span> Your uploaded files (including PDFs, image assets, source code elements, video recordings, and text buffers) are compiled, compressed, styled, and parsed <span className="text-brand font-bold underline">entirely inside your local web browser sandbox</span>.
            </li>
            <li>
              <span className="text-white font-semibold">Zero Server Storage Overhead:</span> No user data files processed inside our terminal rooms are ever uploaded to, cached in, or recorded on remote servers. All active calculations are localized within the boundaries of your physical hardware.
            </li>
            <li>
              <span className="text-white font-semibold">Local Storage Variables:</span> We use native browser storage indicators (e.g., <span className="font-mono bg-zinc-950 px-1 py-0.5 rounded border border-zinc-900">localStorage</span>) strictly to store your structural layout variables, active widget language settings, selected theme configurations, and custom tool preferences so they persist locally across system boot cycles. No personal credentials are saved.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'google-adsense',
      label: '2. Google AdSense & Third-Party Advertising Policy',
      icon: Cookie,
      content: (
        <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
          <p className="border-l-2 border-brand/50 pl-3 italic text-zinc-400">
            Mandatory disclosure for dynamic advertisement distribution: We integrate premium advertising programs to fund the free continuous development of high-performance WASM utilities.
          </p>
          <p>
            Google, as a premium third-party service vendor, uses specialized tracking protocols to distribute contextually targeted advertisements on our workspace pages:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <span className="text-white font-semibold">Google AdSense Integration:</span> Google's use of advertising cookies enables it and its partner network partners to serve custom ads to our users based on their active visiting trail on <span className="font-mono text-brand font-bold">apexutility.live</span> and other sites across the global internet infrastructure.
            </li>
            <li>
              <span className="text-white font-semibold">The DoubleClick DART Cookie:</span> Google uses cookies (specifically the DART cookie) when distributing personalized advertisements. The DART cookie tracks online behavior signals to curate highly relevant advertisement templates for your viewing setup.
            </li>
            <li>
              <span className="text-white font-semibold">Dynamic Opt-Out Procedures:</span> Users can opt out of the personalized DoubleClick DART cookies at any point. To manage your advertising preferences, visit the official Google Ad Settings dashboard at <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline font-mono">https://adssettings.google.com</a>. Alternatively, you may choose to decline third-party vendor tracking cookies for personalized advertising by going to the Network Advertising Initiative opt-out gate at <a href="https://aboutads.info" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline font-mono">https://aboutads.info</a>.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'analytics',
      label: '3. Analytics, Pixels & Access Log Trails',
      icon: Eye,
      content: (
        <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
          <p>
            Standard internet telemetry is handled automatically by hosting node servers and network firewalls. This includes the collection of non-personally identifiable variables:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>
              <span className="text-white font-semibold">Access Log Parameters:</span> Standard parameters collected include your device's raw IP address address, browser user-agent signatures, active landing timestamp parameters, language settings, and referring/exit page telemetry.
            </li>
            <li>
              <span className="text-white font-semibold">Web Beacons & Code Scripts:</span> Third-party advertisers and analytical platforms may use script tags, active cookies, or tracking pixels to analyze campaign impact.
            </li>
            <li>
              <span className="text-white font-semibold">No Data Conflation:</span> These mechanical logs are never joined or merged with your local client files. We operate an isolated sandboxed ecosystem to ensure no file parameters migrate outwards.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'compliance',
      label: '4. Legal Framework Rules (GDPR & CCPA Rights)',
      icon: Scale,
      content: (
        <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
          <p>
            We adhere tightly to localized legal frameworks rules and consumer protection decrees around the globe:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg">
              <h5 className="font-heading text-xs font-extrabold text-white uppercase tracking-wider mb-1">GDPR User Entitlements (EU)</h5>
              <p className="text-xs text-zinc-400 leading-relaxed">
                EU citizens retain ultimate correction, portability, and "right to be forgotten" authorization controls. Since our servers do not store your data, there is no master database containing your private documents. For local preferences, you may wipe all saved state profiles instantly using the "System Reset" setting.
              </p>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg">
              <h5 className="font-heading text-xs font-extrabold text-white uppercase tracking-wider mb-1">CCPA Consumer Privileges (CA)</h5>
              <p className="text-xs text-zinc-400 leading-relaxed">
                California residents hold the authority to request a audit of data processing, opt-out of cookie-based metrics trading, and request total removal. APEX UTILITY complies in full, and does not sell or trade user file data to third-party databases.
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-2">
            Children's Protection Notice (COPPA): We do not knowingly solicit, record, or track variables from children under the age of 13.
          </p>
        </div>
      )
    },
    {
      id: 'contact',
      label: '5. Contact and Governance Authority',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
          <p>
            Our overall compliance is monitored regularly to ensure perfect technical and moral alignment with current security practices.
          </p>
          <p>
            If you have any questions, compliance queries, custom audit requests, or need help managing your cookie preferences, reach out to our privacy officer directly:
          </p>
          <div className="p-4 rounded-xl bg-gradient-to-r from-brand/10 to-transparent border border-brand/20 my-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500 font-mono">REPRESENTATIVE COMPLIANCE OFFICER:</span>
              <span className="text-sm font-bold text-white uppercase tracking-wide">YASIN ALAM</span>
              <span className="text-xs text-zinc-500 font-mono mt-1">DIRECT CONTACT DIRECTORY:</span>
              <a href="mailto:Yasinalam67@gmail.com" className="text-brand hover:underline font-mono text-sm">Yasinalam67@gmail.com</a>
              <span className="text-xs text-zinc-500 font-mono mt-1">PRIMARY DOMAIN PROTOCOL:</span>
              <span className="text-xs text-white font-mono">https://apexutility.live</span>
            </div>
          </div>
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
            <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/35 text-brand px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-extrabold shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 animate-pulse" />
              <span>Compliant & Secure Platform</span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-black tracking-wider uppercase bg-clip-text text-white">
              Privacy Policy & Cookie Audit
            </h1>
            <p className="font-mono text-xs text-zinc-500 leading-normal">
              LAST COMPILED PROTOCOL: 2026-06-10T08:53:00Z • DOMAIN TARGET: APEXUTILITY.LIVE
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0 max-sm:grid max-sm:grid-cols-2">
            <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-center">
              <div className="font-sans text-xs text-zinc-500 font-bold uppercase tracking-wider">OFFLINE</div>
              <div className="font-mono text-xs text-emerald-400 font-extrabold">100% SECURE</div>
            </div>
            <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-center">
              <div className="font-sans text-xs text-zinc-500 font-bold uppercase tracking-wider">TRACKING</div>
              <div className="font-mono text-xs text-cyan-400 font-extrabold">OPT-OUT ON</div>
            </div>
          </div>
        </div>

        {/* Global summary badge group */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-8 pt-6 border-t border-brand-border/25">
          {complianceStamps.map((stamp, idx) => (
            <div key={idx} className="p-3 bg-zinc-950/60 border border-zinc-900/80 rounded-xl hover:border-brand/30 transition-all">
              <div className="flex items-center gap-1.5 text-xs text-white font-heading font-extrabold uppercase tracking-wide mb-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{stamp.title}</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-snug">{stamp.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main layout container with sidebar sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation columns */}
        <div className="lg:col-span-4 space-y-2">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isSelected = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full text-left p-3.5 rounded-xl border font-heading text-xs font-extrabold tracking-wider transition-all duration-300 flex items-center gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-brand/10 border-brand text-brand shadow-[0_0_15px_var(--theme-glow)]'
                    : 'bg-[#09090d]/80 border-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-brand/10 text-brand' : 'bg-zinc-950 text-zinc-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{sec.label.split('.')[1].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Display panels */}
        <div className="lg:col-span-8">
          <div className="beveled-panel bg-[#09090d]/95 p-6 md:p-8 border-brand-border/40 shadow-xl min-h-[380px]">
            {sections.map((sec) => {
              if (sec.id !== activeSection) return null;
              return (
                <div key={sec.id} className="space-y-4">
                  <div className="flex items-center gap-3.5 pb-4 border-b border-brand-border/20 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand leading-none">
                      <sec.icon className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="font-heading text-sm md:text-base font-extrabold text-white tracking-wider uppercase">
                      {sec.label}
                    </h3>
                  </div>
                  {sec.content}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer reassurance banner */}
      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 hover:border-brand-border/30 text-center flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500 font-sans">
        <div className="flex items-center justify-center gap-1.5">
          <Lock className="w-4 h-4 text-emerald-500" />
          <span>Local calculations isolate operations parameters on device storage structures.</span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand underline font-mono text-[10.5px]">Ad Settings</a>
          <span>•</span>
          <a href="https://aboutads.info" target="_blank" rel="noopener noreferrer" className="hover:text-brand underline font-mono text-[10.5px]">Opt-Out Panel</a>
        </div>
      </div>
    </div>
  );
}

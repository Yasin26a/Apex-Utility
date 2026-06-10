import React, { useState } from 'react';
import { Mail, Shield, Zap, Sparkles, Terminal, CheckCircle2, Bookmark, Send, Info } from 'lucide-react';

export default function AboutUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Feedback');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const stats = [
    { value: '100% Offline', label: 'Local Sandbox Processing' },
    { value: '35+ Tools', label: 'High-Performance Utilities' },
    { value: 'Zero Server Log', label: 'Absolute Leakproof Privacy' },
    { value: 'No Ads Wall', label: 'Completely Open Access' }
  ];

  const values = [
    {
      title: 'Decentralized Architecture',
      desc: 'All file parsing, video recording, image vectorizing, and document compression compiles instantly inside your local web browser using WebAssembly. Your files never migrate outside.',
      icon: Terminal
    },
    {
      title: 'Performance & Precision',
      desc: 'Engineered with strict algorithmic paradigms to execute high-density transformations such as WebP rasterization or secure SHA compilations with instantaneous speed.',
      icon: Zap
    },
    {
      title: 'Transparency & Freedom',
      desc: 'No hidden paywalls, no registration hurdles, and no sneaky subscription traps. This suite of utilities runs on the premise of making elite development assets available to everyone.',
      icon: Shield
    }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Simulate sending form securely
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Editorial Profile Header */}
      <div className="beveled-panel bg-[#09090d]/95 p-6 md:p-10 border-brand-border/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none -mr-40 -mt-40" style={{ backgroundColor: 'var(--theme-glow)', opacity: 0.18 }} />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10 text-left">
          <div className="md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/30 text-brand px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-extrabold shadow-sm">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>THE ULTIMATE WORKSPACE</span>
            </div>
            
            <h1 className="font-heading text-3xl md:text-4xl font-black tracking-wider uppercase bg-clip-text text-white leading-tight">
              About Apex Utility Labs
            </h1>
            
            <p className="font-sans text-sm text-zinc-300 leading-relaxed max-w-xl">
              Apex Utility is a state-of-the-art developer pipeline engineered strictly to execute high-density file formatting, security compilations, document operations, and rich-text calculations. Built entirely upon secure, offline-first serverless architecture, we put control back into the hands of global developers.
            </p>
            
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-brand" /> No Account Required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-brand" /> 100% Client-Side</span>
            </div>
          </div>
          
          {/* Stats Matrix Block */}
          <div className="md:col-span-5 grid grid-cols-2 gap-3.5">
            {stats.map((s, idx) => (
              <div key={idx} className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-brand/20 transition-all text-center">
                <div className="font-heading text-lg font-black text-white tracking-wide">{s.value}</div>
                <div className="font-sans text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Core Values & Creator Bio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {/* Core Pillars */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-brand" />
            Our Founding Pillars
          </h2>
          <div className="space-y-4">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="p-4 bg-[#09090d]/85 border border-zinc-900/60 rounded-xl flex gap-3.5 items-start">
                  <div className="p-2 rounded-lg bg-zinc-950 text-brand border border-zinc-900 shrink-0 mt-0.5">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-heading text-xs font-black text-white uppercase tracking-wider mb-1">
                      {v.title}
                    </h4>
                    <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                      {v.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Developer Bio card with fully interactive message form */}
        <div className="beveled-panel bg-[#09090d]/95 p-6 border-brand-border/40 space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-900 pb-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center text-brand font-heading font-black text-base uppercase shrink-0">
              YA
            </div>
            <div>
              <div className="font-heading text-xs font-black text-white uppercase tracking-wider">PROJECT FOUNDER / COMPLIANCE GURU</div>
              <h3 className="font-sans text-base font-bold text-brand mt-0.5">Yasin Alam</h3>
              <a href="mailto:Yasinalam67@gmail.com" className="text-[11px] font-mono text-zinc-500 hover:text-brand underline">Yasinalam67@gmail.com</a>
            </div>
          </div>
          
          <p className="font-sans text-xs text-zinc-300 leading-relaxed mb-4">
            Hello! I registered <span className="text-white font-semibold">apexutility.live</span> specifically to empower creators with an absolute zero-friction, incredibly fast utility workbench. This app represents thousands of hours of architectural crafting to ensure compliance, usability, and pure speed are locked in. If you want to collaborate, report compliance nodes, or request a custom WASM tool, send me an electronic message below!
          </p>

          <form onSubmit={handleSendMessage} className="space-y-3 pt-2">
            <div>
              <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8]/70 font-mono mb-1">Your Identity</label>
              <input
                type="text"
                required
                placeholder="Joe Dev"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand/40"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8]/70 font-mono mb-1">Electronic Mail</label>
                <input
                  type="email"
                  required
                  placeholder="joe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand/40"
                />
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8]/70 font-mono mb-1">Topic</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand/40 cursor-pointer"
                >
                  <option value="General Feedback">General Feedback</option>
                  <option value="Compliance Audit">Compliance Audit</option>
                  <option value="Feature Expansion">Feature Expansion</option>
                  <option value="WASM Collaboration">Collaboration</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[8px] uppercase tracking-widest text-[#94a3b8]/70 font-mono mb-1">Your Message</label>
              <textarea
                required
                rows={3}
                placeholder="Enter details here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand/40 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-brand text-zinc-950 hover:bg-brand-hover hover:text-white disabled:opacity-40 transition-all font-heading text-xs font-black tracking-wider uppercase rounded-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
                  <span>TRANSMITTING MESSAGE...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>SECURE SEND DATA</span>
                </>
              )}
            </button>

            {submitStatus === 'success' && (
              <p className="text-[10px] font-mono text-emerald-400 text-center uppercase tracking-wide">
                Message transmitted successfully! I will correspond with you shortly.
              </p>
            )}
            {submitStatus === 'error' && (
              <p className="text-[10px] font-mono text-red-400 text-center uppercase tracking-wide">
                Please complete all required input fields.
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Advisory transparency note */}
      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900/80 text-zinc-500 font-sans text-xs flex gap-2.5 items-start text-left">
        <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        <p className="leading-normal">
          <span className="text-white font-semibold">Transparency Declaration:</span> APEX UTILITY operates entirely without secondary funding loops, cloud investments, or secret tracking grids. Our operations represent a unified open utility hub designed to keep client files local, lightning fast, and absolutely secure under clean regulations.
        </p>
      </div>
    </div>
  );
}

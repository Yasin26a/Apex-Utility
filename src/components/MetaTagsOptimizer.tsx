import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Copy, Check, Eye, Globe, Share2, FileCode } from 'lucide-react';

export default function MetaTagsOptimizer() {
  const [title, setTitle] = useState('Apex Utility Labs — Developer Tool Suite');
  const [description, setDescription] = useState('An offline-first technical tools dashboard and dynamic developer workspace utility system built on high-contrast modular grids.');
  const [ogImage, setOgImage] = useState('https://apex-utility.com/og-banner.png');
  const [url, setUrl] = useState('https://apex-utility.com');
  const [copied, setCopied] = useState(false);

  const generateMetaHTML = () => {
    return `<!-- SEO Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}">
<meta name="description" content="${description}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${ogImage}">

<!-- Twitter / X -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${url}">
<meta property="twitter:title" content="${title}">
<meta property="twitter:description" content="${description}">
<meta property="twitter:image" content="${ogImage}">`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMetaHTML());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" id="meta-tags-optimizer-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Share2 className="w-6 h-6 text-brand" />
          <span>Meta Tags Social & SEO Optimizer</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Optimize your website title, description, and preview assets. Simulate layouts for Google, Facebook, and Twitter/X feeds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Box */}
        <div className="bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4">
          <h3 className="text-zinc-200 text-sm font-bold uppercase tracking-wider font-heading border-b border-zinc-900 pb-2">
            SEO parameters Set
          </h3>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none">
              Web Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-900 text-sm font-sans text-zinc-300 rounded px-3 py-2.5 focus:outline-none focus:border-brand/45"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none">
              Meta Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-900 text-sm font-sans text-zinc-300 rounded p-3 focus:outline-none focus:border-brand/45"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none">
              OG Image URL
            </label>
            <input
              type="url"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-900 text-sm font-mono text-zinc-300 rounded px-3 py-2.5 focus:outline-none focus:border-brand/45"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none">
              Canonical URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-900 text-sm font-mono text-zinc-300 rounded px-3 py-2.5 focus:outline-none focus:border-brand/45"
            />
          </div>
        </div>

        {/* Live Simulator Preview */}
        <div className="space-y-6">
          <div className="bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4">
            <h3 className="text-zinc-200 text-sm font-bold uppercase tracking-wider font-heading border-b border-zinc-900 pb-2">
              Snippet Layout Previews
            </h3>

            {/* Google Search Result Preview */}
            <div className="space-y-1 p-3.5 rounded bg-zinc-900/10 border border-zinc-900/60">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Google SERP Preview</span>
              <p className="text-[11px] text-zinc-500 font-mono truncate">{url}</p>
              <h4 className="text-blue-400 text-sm font-medium hover:underline cursor-pointer">{title}</h4>
              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{description}</p>
            </div>

            {/* Facebook / OG Feed Layout */}
            <div className="p-3.5 rounded bg-zinc-900/10 border border-zinc-900/60 space-y-2">
              <span className="text-[10px] font-mono text-[#1877f2] uppercase tracking-wider block">Facebook Rich Snippet Preview</span>
              <div className="border border-zinc-800 rounded overflow-hidden bg-zinc-950">
                <div className="h-32 bg-zinc-900 flex items-center justify-center overflow-hidden">
                  <img src={ogImage} alt="OG Preview" className="w-full h-full object-cover" onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=500&q=80';
                  }} referrerPolicy="no-referrer" />
                </div>
                <div className="p-3 border-t border-zinc-900 text-left space-y-1">
                  <p className="text-[10px] font-mono text-zinc-600 truncate">{new URL(url).hostname}</p>
                  <p className="text-xs font-bold text-zinc-300 truncate">{title}</p>
                  <p className="text-[10.5px] text-zinc-500 line-clamp-1">{description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Block export */}
      <div className="bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-3">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-bold text-zinc-300 font-heading tracking-wide uppercase flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-brand" />
            Meta Tags Header Snippet
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-brand transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-brand" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Header Snippet'}</span>
          </button>
        </div>

        <pre className="p-4 rounded bg-zinc-950 border border-zinc-900 text-xs font-mono text-cyan-400 overflow-x-auto">
          {generateMetaHTML()}
        </pre>
      </div>
    </div>
  );
}

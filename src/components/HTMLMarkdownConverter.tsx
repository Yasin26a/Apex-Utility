import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Copy, Check, FileText, Sparkles, RefreshCw } from 'lucide-react';

export default function HTMLMarkdownConverter() {
  const [inputText, setInputText] = useState('## Sample Markdown\n\nThis is an **extremely** fast HTML-Markdown translation utility.\n- Bullet 1\n- Bullet 2\n\n[Visit Apex](https://example.com)');
  const [outputText, setOutputText] = useState('');
  const [direction, setDirection] = useState<'md-to-html' | 'html-to-md'>('md-to-html');
  const [copied, setCopied] = useState(false);

  // Clean and robust conversion function
  const handleConvert = () => {
    if (direction === 'md-to-html') {
      // Simple custom markdown parsing regular expressions
      let html = inputText;
      
      // Headers
      html = html.replace(/^### (.*)$/gim, '<h3>$1</h3>');
      html = html.replace(/^## (.*)$/gim, '<h2>$1</h2>');
      html = html.replace(/^# (.*)$/gim, '<h1>$1</h1>');
      
      // Bold & Italic
      html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
      html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
      
      // Links
      html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>');
      
      // Unordered lists
      html = html.replace(/^\s*-\s*(.*)$/gim, '<li>$1</li>');
      // Wrap surrounding li
      
      setOutputText(html);
    } else {
      // Simple HTML to Markdown
      let md = inputText;
      md = md.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n');
      md = md.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n');
      md = md.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n');
      md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
      md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
      md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
      md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
      md = md.replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)');
      md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
      
      setOutputText(md);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swapDirection = () => {
    const newDir = direction === 'md-to-html' ? 'html-to-md' : 'md-to-html';
    setDirection(newDir);
    const prevIn = inputText;
    setInputText(outputText || '');
    setOutputText(prevIn || '');
  };

  return (
    <div className="space-y-6" id="html-markdown-converter-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand" />
          <span>HTML &lt;&gt; Markdown Converter</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Seamlessly translate markup text between standard Markdown formats and native HTML structure code with zero server-side trips.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-900 gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">Translation Mode:</span>
          <span className="px-3 py-1 font-heading text-xs font-bold rounded bg-brand/10 border border-brand/20 text-brand">
            {direction === 'md-to-html' ? 'Markdown ➜ HTML' : 'HTML ➜ Markdown'}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={swapDirection}
            className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-brand/40 text-xs font-sans text-zinc-300 hover:text-brand transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Swap Source</span>
          </button>

          <button
            type="button"
            onClick={handleConvert}
            className="px-3 py-1.5 rounded bg-brand hover:bg-brand-hover text-zinc-950 text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Translate Code</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-2">
          <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            {direction === 'md-to-html' ? 'Raw Markdown Syntax Source' : 'Clean HTML Code Source'}
          </label>
          <textarea
            rows={10}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-zinc-950 p-4 border border-zinc-900 rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-brand/40"
            placeholder={direction === 'md-to-html' ? 'Type or paste markdown hier...' : '<p>Paste raw HTML tags...</p>'}
          />
        </div>

        {/* Output panel */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Compiled Result Code
            </label>
            {outputText && (
              <button
                type="button"
                onClick={handleCopy}
                className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-brand transition-all flex items-center gap-1 text-[10px] font-mono cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-brand" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Output'}</span>
              </button>
            )}
          </div>
          <textarea
            rows={10}
            value={outputText}
            readOnly
            className="w-full bg-zinc-950 p-4 border border-zinc-900 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none"
            placeholder="Compiled code output will render automatically when you click 'Translate Code'"
          />
        </div>
      </div>
    </div>
  );
}

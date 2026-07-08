import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  Sparkles, 
  Download, 
  Eye, 
  ChevronRight,
  ChevronDown,
  Info,
  Maximize2,
  Minimize2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  RefreshCw,
  Sigma,
  BookOpen,
  Hash,
  Play
} from 'lucide-react';
import katex from 'katex';
import { marked } from 'marked';
import 'katex/dist/katex.min.css';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

const TEMPLATES = [
  {
    name: 'README Template',
    description: 'Perfect for standard open-source GitHub document projects.',
    icon: FileText,
    content: `# 🚀 APEX Utility Labs - Developer Workspace

Welcome to the ultimate open-source suite of visual developer utilities! This project acts as an ecosystem for front-end and operations toolkits.

## ✨ Key Features
- **PDF Compressor:** Advanced metadata parsing and stream optimizer.
- **REST Playpen:** Fully browser-based HTTP tester with proxy CORS capability.
- **Markdown Live Compiler:** Real-time split-pane Markdown, GFM, and LaTeX rendering workspace.

## 🛠️ Installation Guide

Follow these three basic command line sequences to begin development:

\`\`\`bash
# Clone the repository
git clone https://github.com/apex-labs/apex-utility-labs.git

# Install necessary npm dependencies
npm install

# Spin up local development server on Port 3000
npm run dev
\`\`\`

## 📊 Deployment Stats

| Environment | Status | Host Domain | Port |
| :--- | :---: | :--- | :---: |
| Production | \`Active\` | https://apex-labs.org | 443 |
| Development | \`Local\` | http://localhost | 3000 |
| Staging | \`Standby\` | https://stage.apex-labs.org | 8080 |

## 🌟 Contributions & Feedback
Contributions make the open-source community an amazing place to learn, inspire, and create. Feel free to fork and open pull requests!`
  },
  {
    name: 'LaTeX Math Notes',
    description: 'Renders formulas and calculus equations using KaTeX stream parser.',
    icon: Sigma,
    content: `# 🎓 Advanced Mathematics & Quantum Physics Cheat Sheet

This document compiles common formulas and math expressions parsed inside our live editor via LaTeX and KaTeX libraries.

---

## 📐 Calculus & Limits

First, let's look at the limit definition of the derivative for a continuous function $f(x)$:

$$ f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h} $$

The fundamental theorem of calculus establishes a connection between differentiation and integration:

$$ \\int_{a}^{b} f(x) \\, dx = F(b) - F(a) $$

---

## ⚡ Quantum Mechanics

The **Time-Dependent Schrödinger Equation** describes the wave function $\\psi(r, t)$ of a quantum system over time:

$$ i\\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t) $$

Where the Hamiltonian operator $\\hat{H}$ is defined as:

$$ \\hat{H} = -\\frac{\\hbar^2}{2m}\\nabla^2 + V(\\mathbf{r}) $$

---

## 💫 General Relativity

Einstein's field equations relate the geometry of spacetime with the mass-energy distribution:

$$ G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu} $$

---

## 📝 Miscellaneous Math Accents
- Inline formula: Euler's identity is beautifully expressed as $e^{i\\pi} + 1 = 0$.
- Standard quadratic root formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.
- Gaussian normal probability distribution function:

$$ f(x | \\mu, \\sigma^2) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2} $$`
  },
  {
    name: 'GFM Planner & Tracker',
    description: 'GitHub-Flavored Markdown checklist, tables, and warnings.',
    icon: CheckSquare,
    content: `# 📅 Sprint Roadmap & Operational Checklist

Use this planner to track active product deliverables and release pipelines.

---

## 🚦 Release Stage Log
- [x] Integrate WebP Image Converter pipeline
- [x] Setup Client-Side REST HTTP engine
- [x] Configure dynamic CORS Proxy bypass toggle
- [ ] Add real-time PDF editing annotations support
- [ ] Implement spatial node map custom visual engine

---

## 📌 Priority Assignments

| Priority | Feature Spec | Engineer | Due Date | Status |
| :---: | :--- | :---: | :---: | :---: |
| \`P0\` | Core PDF Compression pipeline | Alice | July 15 | **Ready** |
| \`P1\` | SQLite / Workspace offline syncing | Bob | July 22 | *In Review* |
| \`P2\` | Custom icon generator presets | Charlie | August 05 | Draft |

---

## 💡 Engineering Guidelines

> **IMPORTANT TIP**
> All developer utilities built for our container systems must strictly bind to the internal port 3000. DO NOT expose alternate ports in production releases.

---

### Key Contact Points
For critical server outages, contact our team lead at **engineering@apex-utility-labs.dev**.`
  }
];

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState<string>('');
  const [compiledHtml, setCompiledHtml] = useState<string>('');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const [copiedMd, setCopiedMd] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [showOutline, setShowOutline] = useState<boolean>(true);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Load from local storage or set default readme
  useEffect(() => {
    try {
      const saved = localStorage.getItem('apex_markdown_content');
      if (saved) {
        setMarkdown(saved);
      } else {
        setMarkdown(TEMPLATES[0].content);
      }
    } catch (e) {
      setMarkdown(TEMPLATES[0].content);
    }
  }, []);

  // Update compiled html on markdown change
  useEffect(() => {
    // Save to localstorage
    try {
      localStorage.setItem('apex_markdown_content', markdown);
    } catch (e) {
      console.error(e);
    }

    // Compile Markdown & LaTeX
    const html = renderMarkdownWithLatex(markdown);
    setCompiledHtml(html);

    // Extract headings for outline map
    const extractedHeadings: HeadingItem[] = [];
    const lines = markdown.split('\n');
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim().replace(/[*_`~$]/g, '');
        extractedHeadings.push({
          id: `heading-${index}`,
          text,
          level
        });
      }
    });
    setHeadings(extractedHeadings);
  }, [markdown]);

  // Synchronized scrolling logic
  const handleEditorScroll = () => {
    if (!syncScroll || !editorRef.current || !previewContainerRef.current || viewMode !== 'split') return;
    const editor = editorRef.current;
    const preview = previewContainerRef.current;
    
    // Percentage of scroll
    const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
  };

  const handlePreviewScroll = () => {
    if (!syncScroll || !editorRef.current || !previewContainerRef.current || viewMode !== 'split') return;
    const editor = editorRef.current;
    const preview = previewContainerRef.current;
    
    const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    editor.scrollTop = percentage * (editor.scrollHeight - editor.clientHeight);
  };

  // Safe latex + markdown parser helper
  const renderMarkdownWithLatex = (text: string): string => {
    const blocks: string[] = [];
    const inlines: string[] = [];

    // 1. Extract Block Math: $$ ... $$
    let processed = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
      try {
        const rendered = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        blocks.push(rendered);
        return `%%BLOCK_MATH_${blocks.length - 1}%%`;
      } catch (err) {
        blocks.push(`<span class="text-red-500 font-mono text-xs">LaTeX Error: ${err}</span>`);
        return `%%BLOCK_MATH_${blocks.length - 1}%%`;
      }
    });

    // 2. Extract Inline Math: $ ... $
    processed = processed.replace(/\$([^\$\s](?:[^\$]*?[^\$\s])?)\$/g, (_, math) => {
      try {
        const rendered = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        inlines.push(rendered);
        return `%%INLINE_MATH_${inlines.length - 1}%%`;
      } catch (err) {
        inlines.push(`<span class="text-red-500 font-mono text-xs">LaTeX Error: ${err}</span>`);
        return `%%INLINE_MATH_${inlines.length - 1}%%`;
      }
    });

    // 3. Compile Markdown using marked
    let html = '';
    try {
      html = marked.parse(processed) as string;
    } catch (e) {
      html = `<p class="text-red-400">Marked Compilation Error: ${e}</p>`;
    }

    // 4. Restore Block Math
    blocks.forEach((rendered, idx) => {
      html = html.replace(`%%BLOCK_MATH_${idx}%%`, `<div class="katex-block-wrapper my-4 overflow-x-auto select-all bg-zinc-950/40 p-3 rounded-lg border border-zinc-900/60">${rendered}</div>`);
    });

    // 5. Restore Inline Math
    inlines.forEach((rendered, idx) => {
      html = html.replace(`%%INLINE_MATH_${idx}%%`, `<span class="katex-inline-wrapper select-all mx-1 inline-block">${rendered}</span>`);
    });

    return html;
  };

  // Insertion helper for toolbar buttons
  const insertText = (before: string, after: string = '', placeholder: string = 'text') => {
    if (!editorRef.current) return;
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end) || placeholder;

    const replacement = before + selected + after;
    setMarkdown(
      textarea.value.substring(0, start) +
      replacement +
      textarea.value.substring(end)
    );

    // Focus and select the replaced text block
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 50);
  };

  // Action utilities
  const handleCopyMd = () => {
    navigator.clipboard.writeText(markdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(compiledHtml);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    const skeleton = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compiled Markdown Export</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
    }
    h1, h2, h3 { border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    code { background-color: rgba(27,31,35,0.05); padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; }
    pre { background-color: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
    blockquote { border-left: 4px solid #dfe2e5; color: #6a737d; padding-left: 16px; margin-left: 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #dfe2e5; padding: 8px 12px; }
    th { background-color: #f6f8fa; }
  </style>
</head>
<body>
  ${compiledHtml}
</body>
</html>`;
    const blob = new Blob([skeleton], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'compiled-export.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Text metrics
  const wordCount = markdown.trim() === '' ? 0 : markdown.trim().split(/\s+/).length;
  const charCount = markdown.length;
  const lineCount = markdown.split('\n').length;
  const readingTime = Math.ceil(wordCount / 225); // Estimated read time at 225 WPM

  return (
    <div className="space-y-6 select-none font-sans" id="markdown-live-compiler">
      
      {/* Template Presets Segment */}
      <div className="bg-slate-950/55 border border-brand/10 p-4 rounded-xl space-y-3">
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" /> Launch Ready Preset Templates
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TEMPLATES.map((tmpl, idx) => {
            const Icon = tmpl.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setMarkdown(tmpl.content)}
                className="p-3 bg-zinc-900/40 border border-zinc-800 hover:border-brand/20 rounded-xl transition-all hover:bg-zinc-900/80 text-left cursor-pointer flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-brand/5 group-hover:bg-brand/10 text-brand border border-brand/10">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-zinc-200 truncate">{tmpl.name}</h4>
                  <p className="text-[10px] text-zinc-500 leading-normal truncate">{tmpl.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor & Preview Split-Pane Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Headings Outline Map (LHS Sidebar - Column Span 2) */}
        {showOutline && headings.length > 0 && viewMode !== 'preview' && (
          <div className="xl:col-span-2 bg-[#08080c]/60 border border-brand/15 rounded-xl p-4 space-y-3.5 shadow-sm max-h-[580px] overflow-y-auto scrollbar-thin">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider block border-b border-zinc-900/60 pb-2">
              🧭 Document Outline
            </span>
            <div className="space-y-1.5">
              {headings.map((heading, i) => (
                <div
                  key={i}
                  className="text-left select-none text-[11px] text-zinc-400 font-sans hover:text-white transition-colors flex items-center gap-1 truncate"
                  style={{ paddingLeft: `${(heading.level - 1) * 8}px` }}
                >
                  <Hash className="w-3 h-3 text-brand shrink-0 opacity-40" />
                  <span className="truncate cursor-pointer">{heading.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Core Editor / Split Area (LHS Main Panel) */}
        <div className={`${(showOutline && headings.length > 0 && viewMode !== 'preview') ? 'xl:col-span-10' : 'xl:col-span-12'} grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch`}>
          
          {/* Main Workspace Frame */}
          <div className={`${viewMode === 'preview' ? 'hidden' : 'block'} bg-[#08080c]/60 border border-brand/15 rounded-xl p-5 space-y-4 flex flex-col`}>
            
            {/* Header / Mode Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-900/60 pb-3">
              <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-brand" /> Interactive WYSIWYG Editor
              </span>
              
              {/* Quick View toggles */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-zinc-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode('edit')}
                  className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    viewMode === 'edit' ? 'bg-brand/10 border border-brand/30 text-brand font-bold' : 'text-zinc-500 hover:text-white border border-transparent'
                  }`}
                >
                  Edit only
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    viewMode === 'split' ? 'bg-brand/10 border border-brand/30 text-brand font-bold' : 'text-zinc-500 hover:text-white border border-transparent'
                  }`}
                >
                  Split View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    viewMode === 'preview' ? 'bg-brand/10 border border-brand/30 text-brand font-bold' : 'text-zinc-500 hover:text-white border border-transparent'
                  }`}
                >
                  Compiled only
                </button>
              </div>
            </div>

            {/* Editing Style Formatting Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-950 rounded-lg border border-zinc-900">
              <button
                type="button"
                onClick={() => insertText('**', '**', 'bold text')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertText('*', '*', 'italic text')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertText('~~', '~~', 'strikethrough text')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Strikethrough"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              
              <div className="w-px h-5 bg-zinc-900 mx-1.5" />

              <button
                type="button"
                onClick={() => insertText('# ', '', 'Heading 1')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Heading 1"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertText('## ', '', 'Heading 2')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Heading 2"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertText('### ', '', 'Heading 3')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Heading 3"
              >
                <Heading3 className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-5 bg-zinc-900 mx-1.5" />

              <button
                type="button"
                onClick={() => insertText('> ', '', 'block quote')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Quote block"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertText('- ', '', 'bullet list item')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Bullet list"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertText('1. ', '', 'ordered list item')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Numbered list"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertText('- [ ] ', '', 'todo item')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Checklist task"
              >
                <CheckSquare className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-5 bg-zinc-900 mx-1.5" />

              <button
                type="button"
                onClick={() => insertText('`', '`', 'code snippet')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Inline Code"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertText('```typescript\n', '\n```', '// paste code blocks here')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Language block"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-5 bg-zinc-900 mx-1.5" />

              <button
                type="button"
                onClick={() => insertText('$', '$', 'a^2 + b^2 = c^2')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer font-bold text-xs"
                title="Inline LaTeX Math"
              >
                <span className="font-mono text-[10px]">Inline $</span>
              </button>
              <button
                type="button"
                onClick={() => insertText('$$\n', '\n$$', '\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer font-bold text-xs"
                title="Block LaTeX Math"
              >
                <span className="font-mono text-[10px]">Block $$</span>
              </button>

              <div className="w-px h-5 bg-zinc-900 mx-1.5" />

              <button
                type="button"
                onClick={() => insertText('[', '](https://example.com)', 'hyperlink text')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Link hyperlink"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertText('![alt description](', ')', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Image placeholder"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertText('| Header 1 | Header 2 |\n| :--- | :---: |\n| Row value | Alternate cell |')}
                className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Markdown GFM table"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-5 bg-zinc-900 mx-1.5" />

              <button
                type="button"
                onClick={() => setMarkdown('')}
                className="p-1.5 hover:bg-red-950 text-zinc-400 hover:text-red-400 rounded transition-colors ml-auto cursor-pointer"
                title="Clear content"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Textarea field */}
            <div className="relative flex-1 min-h-[440px]">
              <textarea
                ref={editorRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onScroll={handleEditorScroll}
                placeholder="# Enter your Markdown text with optional LaTeX $math$ syntax here..."
                className="w-full h-full min-h-[440px] bg-zinc-950/70 border border-zinc-900/80 rounded-xl p-4 font-mono text-xs text-zinc-300 focus:outline-none focus:border-brand/20 resize-none select-text leading-relaxed"
              />
            </div>

            {/* Document Metrics Block */}
            <div className="grid grid-cols-4 gap-2 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-900/60 text-center text-[10px] font-mono text-zinc-500">
              <div className="space-y-0.5">
                <span className="uppercase text-zinc-600 block text-[8px]">WORDS</span>
                <span className="text-zinc-300 font-bold">{wordCount}</span>
              </div>
              <div className="space-y-0.5 border-x border-zinc-900">
                <span className="uppercase text-zinc-600 block text-[8px]">CHARACTERS</span>
                <span className="text-zinc-300 font-bold">{charCount}</span>
              </div>
              <div className="space-y-0.5 border-r border-zinc-900">
                <span className="uppercase text-zinc-600 block text-[8px]">LINES</span>
                <span className="text-zinc-300 font-bold">{lineCount}</span>
              </div>
              <div className="space-y-0.5">
                <span className="uppercase text-zinc-600 block text-[8px]">READ TIME</span>
                <span className="text-zinc-300 font-bold">{readingTime} min</span>
              </div>
            </div>
          </div>

          {/* Compiled Live Preview Frame */}
          <div className={`${viewMode === 'edit' ? 'hidden' : 'block'} ${viewMode === 'preview' ? 'lg:col-span-2' : ''} bg-[#08080c]/60 border border-brand/15 rounded-xl p-5 space-y-4 flex flex-col`}>
            
            {/* Header / Compiling Status */}
            <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
              <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-brand" /> Compiled HTML & LaTeX Preview
              </span>

              {viewMode === 'preview' && (
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className="px-2 py-0.5 rounded text-[10px] font-mono uppercase text-brand border border-brand/20 bg-brand/5 hover:bg-brand/10 cursor-pointer"
                >
                  Return to editor
                </button>
              )}

              {viewMode !== 'preview' && (
                <div className="flex items-center gap-3">
                  {/* Sync scroll checker */}
                  <label className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncScroll}
                      onChange={(e) => setSyncScroll(e.target.checked)}
                      className="rounded border-zinc-850 text-brand focus:ring-brand cursor-pointer h-3 w-3 bg-zinc-950"
                    />
                    <span>Sync Scroll</span>
                  </label>
                </div>
              )}
            </div>

            {/* Top export shortcuts */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-zinc-950 rounded-lg border border-zinc-900">
              <button
                type="button"
                onClick={handleCopyMd}
                className="px-2.5 py-1 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded border border-zinc-800 text-[10px] font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedMd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedMd ? 'Copied MD!' : 'Copy raw MD'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyHtml}
                className="px-2.5 py-1 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded border border-zinc-800 text-[10px] font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedHtml ? <Check className="w-3 h-3 text-emerald-400" /> : <Code className="w-3 h-3" />}
                <span>{copiedHtml ? 'Copied HTML!' : 'Copy raw HTML'}</span>
              </button>

              <div className="w-px h-5 bg-zinc-900 mx-1" />

              <button
                type="button"
                onClick={handleDownloadMd}
                className="px-2.5 py-1 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded border border-zinc-800 text-[10px] font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Save .md</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadHtml}
                className="px-2.5 py-1 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded border border-zinc-800 text-[10px] font-mono transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <BookOpen className="w-3 h-3 text-brand" />
                <span>Export Styled HTML</span>
              </button>
            </div>

            {/* Scrollable preview viewport */}
            <div
              ref={previewContainerRef}
              onScroll={handlePreviewScroll}
              className="flex-1 min-h-[440px] max-h-[500px] overflow-y-auto bg-zinc-950/20 border border-zinc-900/60 rounded-xl scrollbar-thin select-text text-left relative"
            >
              {markdown.trim() === '' ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-20">
                  <Play className="w-6 h-6 text-zinc-700 animate-pulse" />
                  <p className="text-xs text-zinc-500 font-mono">Your parsed document outputs here in real-time</p>
                </div>
              ) : (
                <div 
                  className="markdown-body p-6 space-y-4 max-w-full leading-relaxed select-text font-sans text-zinc-300 [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-white [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:border-b [&_h1]:border-zinc-900 [&_h1]:pb-2 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-zinc-100 [&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-zinc-900/40 [&_h2]:pb-1.5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-zinc-200 [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:text-sm [&_p]:text-zinc-400 [&_p]:leading-relaxed [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 [&_li]:text-sm [&_li]:text-zinc-400 [&_li]:my-1.5 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-zinc-950 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-brand [&_code]:border [&_code]:border-zinc-900 [&_pre]:bg-zinc-950/80 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-zinc-900 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:border-none [&_pre_code]:p-0 [&_pre_code]:text-zinc-300 [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_blockquote]:bg-brand/5 [&_blockquote]:py-2 [&_blockquote]:px-4 [&_blockquote]:rounded-r-lg [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-zinc-900 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-zinc-950 [&_th]:text-zinc-300 [&_th]:text-xs [&_th]:font-mono [&_th]:uppercase [&_th]:font-bold [&_td]:border [&_td]:border-zinc-900/60 [&_td]:px-3 [&_td]:py-2 [&_td]:text-zinc-400 [&_td]:text-sm [&_a]:text-brand [&_a]:underline [&_a]:hover:text-brand-hover [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_hr]:border-zinc-900 [&_hr]:my-6"
                  dangerouslySetInnerHTML={{ __html: compiledHtml }}
                />
              )}
            </div>

            {/* Render details footer */}
            <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-900/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>Status: Synchronized (GFM + LaTeX)</span>
              <span>Parser: marked + katex.js</span>
            </div>
          </div>

        </div>

      </div>

      {/* Google AdSense Compliant Informational Article & FAQs Footer */}
      <div className="border-t border-zinc-900 pt-12 mt-12 space-y-10 text-left">
        
        {/* Editorial Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Academic & Editorial Guide: Markdown & LaTeX</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">
            The Ultimate Guide to Real-Time WYSIWYG Markdown & LaTeX Compilers
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-3xl">
            Struggling to format scientific papers, documentation files, or blog layouts in perfect markdown styling? Learn how a real-time, browser-based GFM and LaTeX compiler streamlines your publishing workflows while guaranteeing absolute privacy.
          </p>
        </div>

        {/* 2-Column Article Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Article Column 1 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-violet-500 font-mono">01.</span>
                What is GFM (GitHub-Flavored Markdown)?
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Markdown is a lightweight markup language with plain-text formatting syntax designed to be converted to HTML. **GitHub-Flavored Markdown (GFM)** is a robust extension of standard markdown, supporting advanced, real-world layout structures such as checklist checkboxes, direct data tables, auto-linked URLs, and strike-through accents.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Our dynamic workspace utilizes high-compliance parsing frameworks to guarantee that your README files, changelogs, and wiki tables compile identically to GitHub's native parser.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-violet-500 font-mono">02.</span>
                LaTeX & KaTeX Stream Parsing Integration
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Writing mathematical expressions and formulas online has historically been complex. By integrating the high-performance **KaTeX** library, our compiler lets you embed beautiful LaTeX math formulas inline or as block structures using the standard <code>$</code> wrapper syntax.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Calculus limits, integral boundaries, matrix formations, and physical equations are parsed on-the-fly directly inside your browser tab at high speed.
              </p>
            </div>
          </div>

          {/* Article Column 2 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-violet-500 font-mono">03.</span>
                Why Choose Offline Browser-Based Compilers?
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Traditional compilers send your document drafts to centralized remote database systems. This introduces lag and creates security compliance concerns for proprietary research papers or legal reports.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Our workspace uses local memory buffers. Everything you write is compiled directly inside your browser sandboxed workspace, with auto-save backups safely committed to your local client-side storage index.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-violet-500 font-mono">04.</span>
                Step-by-Step Document Assembly
              </h4>
              <ol className="space-y-1.5 text-zinc-400 text-xs pl-4 list-decimal">
                <li>Load one of our ready-made templates (README, LaTeX sheet, GFM roadmap) as a starting canvas.</li>
                <li>Write or paste your markdown text into the local editor screen.</li>
                <li>Utilize our formatting toolbar buttons to quickly insert complex structures (tables, checklists, math vectors).</li>
                <li>Watch the live split-view update dynamically with pixel-perfect styles.</li>
                <li>Export raw files as <code>.md</code> or standard styled standalone <code>HTML</code> documents.</li>
              </ol>
            </div>
          </div>

        </div>

        {/* Separator */}
        <div className="border-t border-zinc-900/60" />

        {/* FAQ Section */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white tracking-tight">Frequently Asked Questions (FAQ)</h4>
            <p className="text-zinc-500 text-xs">Got questions about markdown structures and math formatting? Read on.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                How do I format a block LaTeX formula vs an inline LaTeX expression?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Use a single dollar sign (e.g. <code>$E = mc^2$</code>) for inline expressions that flow naturally with your text paragraph. Use double dollar signs (e.g. <code>$$ ... $$</code>) on their own lines to compile centered, full-width display math blocks.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                Can I print or save my compiled document as a PDF?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Yes! Export the styled HTML document to your computer, open it in any standard browser, and use the print menu (Ctrl+P or Cmd+P) to "Save as PDF" with beautiful, native vector rendering.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                Will my document progress be lost if I refresh my browser tab?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                No, your progress is automatically saved locally using client-side localStorage. When you return or refresh the page, your workspace state is restored exactly as you left it.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                Are there any limits on file imports or export structures?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                There are absolutely no software limits! Because all compiler calculations run client-side on your device's browser, you can compose extensive multi-chapter textbooks or mathematical formulas seamlessly.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

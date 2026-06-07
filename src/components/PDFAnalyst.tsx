import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Sparkles, Upload, Download, Trash2, ArrowLeft, Check, Copy, 
  AlertCircle, Info, Loader2, Bot, CornerDownRight, RefreshCw, Send,
  FileSearch, CheckCircle, HelpCircle, Search, Layers, ChevronRight, Activity, BookOpen
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { logToolUsage } from '../utils/toolAnalytics';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface LoadedFile {
  name: string;
  size: number;
  type: string;
  base64Data: string;
}

export default function PDFAnalyst() {
  const { language } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [sessionWordCount, setSessionWordCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggestions depending on English or other translations
  const suggestions = [
    {
      label: '📋 Executive Summary',
      prompt: 'Construct a highly professional, 3-paragraph executive summary highlighting key findings, results, and critical takeaways.',
      desc: 'Get an instant strategic overview'
    },
    {
      label: '🔬 Critical Analysis',
      prompt: 'Review the document contents thoroughly. What are the core strengths, minor weaknesses, and main strategic opportunities identified here?',
      desc: 'Unbiased risk & potential audit'
    },
    {
      label: '💡 Core Actionable Insights',
      prompt: 'Extract the top 5 most actionable bullet-point recommendations or insights. Briefly support each with direct values or sections from the text.',
      desc: 'Quick decision-making pointers'
    },
    {
      label: '📊 Data & KPI Extraction',
      prompt: 'Create a clean markdown table summarizing all key metrics, datasets, statistics, or KPIs mentioned throughout the document.',
      desc: 'Isolate crucial quantitative facts'
    },
    {
      label: '❓ Generate Q&A Outline',
      prompt: 'Act as an auditor. Formulate 4 critical, probing questions about the content and provide their direct answers from the document structure.',
      desc: 'Self-study or preparation guide'
    }
  ];

  // Initialize tool usage analytics
  useEffect(() => {
    logToolUsage('pdf-analyst');
    
    // Clear state or load from sessionStorage
    const savedFile = sessionStorage.getItem('apex_pdf_saved_file');
    const savedChat = sessionStorage.getItem('apex_pdf_saved_chat');
    if (savedFile) {
      try {
        setFile(JSON.parse(savedFile));
      } catch (e) {}
    }
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {}
    }
  }, []);

  // Save session to sessionStorage
  useEffect(() => {
    if (file) {
      sessionStorage.setItem('apex_pdf_saved_file', JSON.stringify(file));
    } else {
      sessionStorage.removeItem('apex_pdf_saved_file');
    }
  }, [file]);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('apex_pdf_saved_chat', JSON.stringify(messages));
      
      // Calculate word counts
      const counts = messages.reduce((acc, m) => acc + m.content.split(/\s+/).filter(Boolean).length, 0);
      setSessionWordCount(counts);
    } else {
      sessionStorage.removeItem('apex_pdf_saved_chat');
      setSessionWordCount(0);
    }
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Convert File to Base64
  const convertToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip out the metadata prefix to get raw base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(f);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (rawFile: File) => {
    const validTypes = ['application/pdf', 'text/plain', 'application/json', 'text/csv'];
    const extension = rawFile.name.split('.').pop()?.toLowerCase();
    
    // Support standard file extensions even if MIME type is missing
    const isValidType = validTypes.includes(rawFile.type) || 
                        ['pdf', 'txt', 'csv', 'json'].includes(extension || '');

    if (!isValidType) {
      setError('Unsupported file format. Please upload a secure PDF, Text, CSV, or JSON document.');
      return;
    }

    // Size limit check: 20MB
    if (rawFile.size > 20 * 1024 * 1024) {
      setError('File is too large. Apex limits payloads to 20MB for fast cloud compilation.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    
    try {
      // Simulate high fidelity analysis progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 15;
        });
      }, 100);

      const base64 = await convertToBase64(rawFile);
      
      clearInterval(interval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setFile({
          name: rawFile.name,
          size: rawFile.size,
          type: rawFile.type || `application/${extension}`,
          base64Data: base64
        });
        setIsUploading(false);
        setUploadProgress(0);
        
        // Push initial greeting message stating file loaded
        setMessages([
          {
            id: 'system-init',
            role: 'assistant',
            content: `### 📂 Document Processed Succesfully\n\nI have securely processed **${rawFile.name}** (${formatBytes(rawFile.size)}). \n\nI am ready to perform a comprehensive Q&A, structured audits, or metadata extractions. Access the **suggested commands** on the left panel or type your custom instruction below to begin!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 300);

    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(0);
      setError(`Failed to read source file buffers: ${err.message}`);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || userInput;
    if (!promptToSend.trim() || isSending) return;

    if (!file) {
      setError('Please upload a source file before querying the analyst.');
      return;
    }

    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    if (!customPrompt) setUserInput('');
    setIsSending(true);
    setError(null);

    try {
      // Format history messages
      // Keep only user and assistant roles to map to server-side endpoint
      const preparedMessages = [...messages, newMessage]
        .filter(m => m.id !== 'system-init')
        .map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }));

      const res = await fetch('/api/pdf-analyst/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfData: file.base64Data,
          mimeType: file.type,
          fileName: file.name,
          messages: preparedMessages
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server query failed with status code ${res.status}`);
      }

      const data = await res.json();
      
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: data.text || 'Empty response returned from document analysis nodes.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

    } catch (err: any) {
      setError(err.message || 'An unexpected networking failure occurred inside the Q&A channel.');
      // Remove last user message on failure to maintain accurate history sync
      setMessages(prev => prev.filter(m => m.id !== newMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = () => {
    if (confirm('Are you certain you wish to reset the active workspace session? This erases chat buffers and loaded files.')) {
      setFile(null);
      setMessages([]);
      setUserInput('');
      setError(null);
      sessionStorage.removeItem('apex_pdf_saved_file');
      sessionStorage.removeItem('apex_pdf_saved_chat');
    }
  };

  const handleCopy = (txt: string, msgId: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleDownloadTranscript = () => {
    if (messages.length === 0) return;
    
    let textOut = `APEX AI DOCUMENT ANALYSIS SYSTEM TRANSCRIPT\n`;
    textOut += `Document Reference: ${file ? file.name : 'None'} (${file ? formatBytes(file.size) : '0 B'})\n`;
    textOut += `Export Time: ${new Date().toLocaleString()}\n`;
    textOut += `========================================================================\n\n`;

    messages.forEach(m => {
      const speaker = m.role === 'assistant' ? 'AI ANALYST' : 'USER';
      textOut += `[${m.timestamp}] ${speaker}:\n${m.content}\n\n`;
      textOut += `------------------------------------------------------------------------\n\n`;
    });

    const blob = new Blob([textOut], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Apex_Q&A_Transcript_${file?.name || 'Session'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Custom Inline Markdown Parser with precise code block support
  const parseMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Code blocks toggle
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          // close block
          inCodeBlock = false;
          elements.push(
            <pre key={`code-${idx}`} className="p-3 my-2.5 rounded bg-[#09090c] border border-zinc-800 text-[11px] font-mono whitespace-pre-wrap text-emerald-400 overflow-x-auto max-w-full leading-relaxed">
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          );
          codeBuffer = [];
        } else {
          // open block
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // Empty line spacing
      if (trimmed === '') {
        elements.push(<div key={`spacer-${idx}`} className="h-2" />);
        return;
      }

      // Main markdown headings
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${idx}`} className="text-sm font-heading font-bold text-white mt-4 mb-1.5 first:mt-0 flex items-center gap-1.5 border-b border-zinc-900 pb-1">
            <CornerDownRight className="w-3.5 h-3.5 text-zinc-500" />
            {formatLineInline(trimmed.replace('### ', ''))}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${idx}`} className="text-sm font-heading font-extrabold text-zinc-100 mt-5 mb-2 first:mt-0 uppercase tracking-wider border-b border-zinc-800/60 pb-1">
            {formatLineInline(trimmed.replace('## ', ''))}
          </h2>
        );
        return;
      }
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${idx}`} className="text-base font-heading font-black text-white mt-6 mb-2.5 first:mt-0">
            {formatLineInline(trimmed.replace('# ', ''))}
          </h1>
        );
        return;
      }

      // Ordered / Unordered lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        elements.push(
          <div key={`li-${idx}`} className="flex gap-2 text-zinc-300 ml-3 py-0.5 text-xs font-sans leading-relaxed">
            <span className="text-zinc-500 select-none">•</span>
            <span>{formatLineInline(content)}</span>
          </div>
        );
        return;
      }

      // Table formatting helper (basic detection check)
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && !trimmed.includes('---')) {
        const cells = trimmed.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        elements.push(
          <div key={`table-row-${idx}`} className="grid grid-cols-5 gap-2 px-3 py-1.5 border border-zinc-900 bg-[#09090c]/40 text-[10px] font-mono text-zinc-300">
            {cells.map((cell, cidx) => (
              <span key={cidx} className="truncate">{formatLineInline(cell)}</span>
            ))}
          </div>
        );
        return;
      }

      // Default paragraph line
      elements.push(
        <p key={`p-${idx}`} className="text-zinc-300 text-xs py-0.5 leading-relaxed font-sans">
          {formatLineInline(line)}
        </p>
      );
    });

    return <div className="space-y-1">{elements}</div>;
  };

  const formatLineInline = (line: string) => {
    const parts = [];
    let index = 0;
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
      const matchIndex = match.index;
      const matchText = match[0];

      if (matchIndex > index) {
        parts.push(line.substring(index, matchIndex));
      }

      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        const labelText = matchText.slice(2, -2);
        parts.push(
          <strong key={matchIndex} className="font-bold text-white tracking-tight">
            {labelText}
          </strong>
        );
      } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
        const codeText = matchText.slice(1, -1);
        parts.push(
          <code key={matchIndex} className="font-mono text-[10px] bg-[#0c0c0f] text-indigo-400 px-1 py-0.5 rounded border border-zinc-800">
            {codeText}
          </code>
        );
      }

      index = match.index + matchText.length;
    }

    if (index < line.length) {
      parts.push(line.substring(index));
    }

    return parts.length > 0 ? parts : line;
  };

  // Chat filter
  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-1 max-w-7xl mx-auto space-y-6">
      
      {/* Dynamic Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[9px] uppercase tracking-widest font-bold">
              Cognitive Engine
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="font-heading text-3xl font-black text-white tracking-tight flex items-center gap-2">
            AI Document & PDF Q&A Analyst
          </h1>
          <p className="font-sans text-xs text-[#94a3b8] max-w-2xl leading-relaxed">
            Upload enterprise PDFs, datasheets, reports, or formatted raw texts to perform semantic audits. Access real-time conversational Q&A backed by the high token capacity of Gemini 3.5.
          </p>
        </div>

        {/* Global Stats Node */}
        {file && (
          <div className="flex items-center gap-3 bg-[#0d0d12]/90 border border-zinc-800/80 p-3 rounded-lg font-mono">
            <div className="p-1.5 bg-[#07070a] border border-zinc-900 rounded">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-[10px]">
              <div className="text-[#94a3b8] uppercase font-bold text-[9px]">Loaded Payload</div>
              <div className="text-zinc-200 mt-0.5 truncate max-w-[140px]" title={file.name}>
                {file.name}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Dual Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Workspace Document Uploader & Suggestion Bank */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Uploader Box Component */}
          <div className="p-5 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/90 space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Document Vector Loader
            </h2>

            {!file ? (
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-all text-center ${
                  dragActive 
                  ? 'border-indigo-500 bg-indigo-500/5' 
                  : 'border-zinc-800 hover:border-zinc-700 bg-[#07070a]/50'
                }`}
              >
                <input 
                  type="file"
                  id="pdf-upload-file"
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.json,.csv"
                  className="hidden"
                  disabled={isUploading}
                />
                <label 
                  htmlFor="pdf-upload-file" 
                  className="cursor-pointer space-y-3 flex flex-col items-center"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0d0d12] border border-zinc-800 flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-zinc-400">
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-200">
                      Drag file here or <span className="text-indigo-400 underline hover:text-indigo-300">browse folders</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                      PDF, TXT, JSON, CSV UP TO 20MB
                    </p>
                  </div>
                </label>

                {/* File Upload Progress Bar */}
                {isUploading && (
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-[#0d0d12]/95 border-t border-zinc-800/60 rounded-b-lg space-y-2">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400 uppercase">
                      <span>Chunking file structures...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-200" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Success File Card Status Display */
              <div className="p-4 rounded border border-indigo-500/20 bg-indigo-500/[0.02] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#07070a] rounded border border-zinc-800 text-indigo-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 truncate">
                      <div className="text-xs font-semibold text-zinc-100 truncate max-w-[200px]" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-2 uppercase">
                        <span>{formatBytes(file.size)}</span>
                        <span>•</span>
                        <span>{file.type ? file.type.split('/').pop() : 'Document'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleClear}
                    className="p-1 px-1.5 rounded bg-[#09090c] border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors tooltip"
                    title="Clear current active source file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-2 bg-[#07070a]/60 rounded border border-zinc-900 text-[10px] text-zinc-400 leading-normal flex gap-1.5 items-start">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>The source file was processed natively. Gemini is holding the token structures. You can continuously request custom formulas, summaries, tables or validations.</span>
                </div>
              </div>
            )}

            {/* Error messaging state */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-950/20 border border-red-500/20 text-red-400/90 rounded text-[11px] leading-relaxed flex gap-2 items-start"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </div>

          {/* Direct Suggested Prompts Deck */}
          <div className="p-5 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/90 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Quick Analytical Directives
              </h2>
              <HelpCircle className="w-3.5 h-3.5 text-zinc-600" />
            </div>

            <div className="space-y-2.5">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s.prompt)}
                  disabled={!file || isSending}
                  className="w-full text-left p-3 rounded bg-[#07070a] border border-zinc-900 hover:border-zinc-800/80 hover:bg-[#0c0c10] transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex justify-between items-center"
                >
                  <div className="space-y-1 pr-4">
                    <span className="text-xs font-bold text-zinc-200 block group-hover:text-indigo-400 transition-colors">
                      {s.label}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-sans leading-normal block">
                      {s.desc}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Chat Transcript Workstation Console */}
        <div className="lg:col-span-7 flex flex-col h-[700px] rounded-lg border border-zinc-800/60 bg-[#0d0d12]/95 overflow-hidden">
          
          {/* Panel Controls & Context Plate */}
          <div className="p-4 border-b border-zinc-900 flex justify-between items-center flex-wrap gap-3 bg-[#0a0a0e]">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <div className="font-mono text-xs text-zinc-300">
                Analysis Session
              </div>
            </div>

            {/* Chat Helper Functions Row */}
            <div className="flex items-center gap-2">
              {/* Search filter input */}
              {messages.length > 0 && (
                <div className="relative">
                  <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter chat history..."
                    className="pl-7 pr-2.5 py-1 w-[140px] text-[10px] font-mono bg-[#07070a] border border-zinc-800 rounded placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-300 transition-all"
                  />
                </div>
              )}

              {/* Download history button */}
              {messages.length > 2 && (
                <button
                  onClick={handleDownloadTranscript}
                  className="p-1 px-2 rounded bg-zinc-900 hover:bg-[#07070a] border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all text-[10px] font-mono flex items-center gap-1.5"
                  title="Export raw conversation block"
                >
                  <Download className="w-3 h-3" />
                  <span>Export</span>
                </button>
              )}
            </div>
          </div>

          {/* Messaging Core Transcript Container */}
          <div className="flex-1 overflow-y-auto p-5 bg-[#07070a]/20 space-y-4">
            {messages.length === 0 ? (
              /* Stale default state helper */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-12 h-12 rounded-full border border-zinc-800 bg-[#0d0d12] flex items-center justify-center text-zinc-600">
                  <FileSearch className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-widest">
                    Transcript Buffer Empty
                  </h3>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Once you upload a document file on the left panel, the analysis terminal will initialize and begin auditing the target vectors.
                  </p>
                </div>
              </div>
            ) : (
              /* Render filtered list of bubbles */
              filteredMessages.map((m, idx) => (
                <div 
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-lg p-4 space-y-2 relative border group transition-all ${
                    m.role === 'user' 
                    ? 'bg-zinc-900/40 border-zinc-800/60 rounded-tr-none text-zinc-100' 
                    : 'bg-[#0d0d12]/95 border-zinc-900 rounded-tl-none text-zinc-300'
                  }`}>
                    {/* Speaker Header Card */}
                    <div className="flex items-center justify-between gap-6 pb-1 border-b border-zinc-900/40 font-mono text-[9px] uppercase tracking-wider text-zinc-550 select-none">
                      <span className="flex items-center gap-1">
                        {m.role === 'user' ? 'Direct Command' : 'AI Analyst Response'}
                      </span>
                      <span>
                        {m.timestamp}
                      </span>
                    </div>

                    {/* Parser Body Output */}
                    <div className="whitespace-pre-wrap leading-relaxed select-text select-all">
                      {m.role === 'user' ? m.content : parseMarkdown(m.content)}
                    </div>

                    {/* Copy specific bubble action block */}
                    <div className="absolute right-2.5 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#07070a]/90 px-1 py-0.5 rounded border border-zinc-800 z-10">
                      <button
                        onClick={() => handleCopy(m.content, m.id)}
                        className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
                        title="Copy text content"
                      >
                        {copiedMessageId === m.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Simulated typing animation block when processing Gemini responses */}
            {isSending && (
              <div className="flex justify-start">
                <div className="max-w-[400px] rounded-lg rounded-tl-none border border-zinc-900 bg-[#0d0d12]/95 p-4 space-y-3">
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-zinc-550 select-none pb-1.5 border-b border-zinc-900/40">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                      Streaming analysis tokens...
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form Command Editor & Terminal Interface */}
          <div className="p-4 border-t border-zinc-900 bg-[#0a0a0e]/95 space-y-2">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-[#060608] border border-zinc-800 focus-within:border-zinc-700 p-1.5 rounded-md transition-all"
            >
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={file ? "Instruct document analyst..." : "Upload a file to begin chatting..."}
                disabled={!file || isSending}
                className="flex-1 bg-transparent px-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-0 resize-none leading-relaxed transition-all p-1"
              />

              <button
                type="submit"
                disabled={!file || !userInput.trim() || isSending}
                className="p-1 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 border border-indigo-500/20 disabled:border-zinc-800 text-white disabled:text-zinc-650 rounded hover:scale-105 active:scale-95 disabled:scale-100 transition-all flex items-center justify-center gap-1 text-xs cursor-pointer font-semibold font-mono"
              >
                <Send className="w-3.5 h-3.5" />
                <span>SEND</span>
              </button>
            </form>

            {/* Info Metrics Strip */}
            <div className="flex items-center justify-between px-1 font-mono text-[9px] text-zinc-600 uppercase tracking-widest leading-none select-none">
              <span>ACTIVE MODEL: GEMINI-3.5-FLASH</span>
              <span>WORD BUFFER: {sessionWordCount} WORDS</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Sparkles, Sliders, ChevronDown, MessageSquareCode, ArrowUpRight } from 'lucide-react';
import { ActiveTab } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantSupervisorProps {
  currentTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const STARTER_PROMPTS = [
  {
    label: "Verify AdSense readiness",
    text: "How do I make my website compliant and ready for Google AdSense?"
  },
  {
    label: "Fix XML Sitemap issues",
    text: "I uploaded my sitemap.xml but search console only sees some pages. How can your XML Sitemap tool help?"
  },
  {
    label: "Explore Content-Gap audits",
    text: "Can you explain how the SEO Competitor Content-Gap Analyzer works and why it helps me rank?"
  },
  {
    label: "Use Keyword Cluster tool",
    text: "What is Keyword Clustering math and how do I use your semantic group builder?"
  }
];

export default function AIAssistantSupervisor({ currentTab, onTabChange }: AIAssistantSupervisorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your Apex AI Supervisor. I can guide you through optimizing your domain, explain technical SEO formulas, audit search intent maps, or direct you to any of our interactive web utilities. How can I assist your workflow today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      if (!response.ok) {
        throw new Error('Could not reach the AI Supervisor service.');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${error.message || 'The Gemini server did not respond. Please make sure process.env.GEMINI_API_KEY is configured.'}`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputValue);
    }
  };

  // Helper to detect references to standard tools and render quick-access buttons
  const renderInteractiveActionButtons = (content: string) => {
    const buttons: { label: string, tab: ActiveTab }[] = [];
    const contentLower = content.toLowerCase();

    if (contentLower.includes('sitemap') || contentLower.includes('robots')) {
      buttons.push({ label: 'Go to Sitemap & Robots Builder 🚀', tab: 'sitemap-generator' });
    }
    if (contentLower.includes('content-gap') || contentLower.includes('competitor') || contentLower.includes('gap analyzer')) {
      buttons.push({ label: 'Open Content-Gap Analyzer 📊', tab: 'content-gap' });
    }
    if (contentLower.includes('cluster') || contentLower.includes('semantic mapping')) {
      buttons.push({ label: 'Open Keyword Cluster Utility 🎯', tab: 'keyword-cluster' });
    }
    if (contentLower.includes('planner') || contentLower.includes('content planner')) {
      buttons.push({ label: 'Open AI Content Planner ✍️', tab: 'content-planner' });
    }
    if (contentLower.includes('schema') || contentLower.includes('json-ld')) {
      buttons.push({ label: 'Open Schema Generator 📝', tab: 'schema-generator' });
    }
    if (contentLower.includes('webp') || contentLower.includes('webp-converter')) {
      buttons.push({ label: 'Go to WebP Converter 🖼️', tab: 'webp-converter' });
    }

    if (buttons.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-800/60">
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            onClick={() => {
              onTabChange(btn.tab);
              // Small friendly self-notification
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Switched your workspace area directly to the **${btn.tab.toUpperCase()}** utility tab. Feel free to input your details there, and let me know if you need instructions on how to use it!`
              }]);
            }}
            className="flex items-center gap-1.5 text-[11px] bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-sky-400 font-medium px-2 py-1 rounded transition-all cursor-pointer"
          >
            {btn.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div id="ai-supervisor-container" className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Sparkles Trigger Button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          className="relative bg-gradient-to-tr from-rose-600 via-pink-600 to-indigo-600 p-3.5 rounded-full shadow-2xl text-white hover:shadow-rose-600/20 shadow-pink-500/10 cursor-pointer flex items-center justify-center border border-white/10 group overflow-hidden"
        >
          {/* Subtle breathing animation ring */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Bot className="w-6 h-6 animate-pulse" />
          <Sparkles className="w-3.5 h-3.5 absolute top-1 right-1 text-yellow-300 animate-bounce" />
          {/* Notification Badge indicator */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </motion.button>
      )}

      {/* Main chat window widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="bg-slate-950 w-[360px] sm:w-[390px] h-[520px] rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-950/20 via-slate-900 to-indigo-950/20 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                    Apex AI Supervisor
                    <span className="bg-emerald-950 text-emerald-400 font-mono text-[9px] font-bold px-1 rounded border border-emerald-900">COACH</span>
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Ask SEO &amp; AdSense guides
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Log viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
                      : 'bg-slate-900 border border-slate-800/80 text-slate-200 leading-relaxed'
                  }`}>
                    {/* Render plain-text line-breaks cleanly */}
                    <div className="whitespace-pre-line space-y-1 font-sans">
                      {msg.content}
                    </div>

                    {/* Check if dynamic assistant action links can be compiled */}
                    {msg.role === 'assistant' && renderInteractiveActionButtons(msg.content)}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                    <Bot className="w-4.5 h-4.5 animate-bounce text-pink-400" />
                    <span>Analyzing domain matrices...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Starter Suggestion Prompts */}
            {messages.length === 1 && (
              <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-900 space-y-1.5">
                <span className="text-[10px] font-mono tracking-wider uppercase text-slate-500 block">Suggested Workflows</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {STARTER_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt.text)}
                      className="text-left text-[10px] bg-slate-900/60 hover:bg-slate-900 border border-slate-800/50 hover:border-slate-700/80 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer font-medium leading-tight line-clamp-2"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Controls Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800/80 flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask our AI Supervisor anything..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:hover:bg-rose-500 scroll-p-2 text-white p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow mt-0 mb-0"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

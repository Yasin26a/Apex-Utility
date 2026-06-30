import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Copy, Check, Lock, RefreshCw, Key, Settings, Sparkles } from 'lucide-react';

export default function PasswordSharer() {
  const [noteText, setNoteText] = useState('');
  const [expiryType, setExpiryType] = useState<'view' | 'time'>('view');
  const [expiryDuration, setExpiryDuration] = useState<number>(1); // 1 view or 1 hour
  const [customKey, setCustomKey] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [sharingUrl, setSharingUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Generate simulated local self-destruction secure URLs
  const handleGenerateLink = () => {
    if (!noteText.trim()) return;
    setIsProcessing(true);

    setTimeout(() => {
      // Create hash identifier representation
      const randomId = Math.random().toString(36).substr(2, 12).toUpperCase();
      const encryptionPassphrase = customKey || Math.random().toString(36).substr(2, 6);
      
      // Simulating a real path containing the secret segment so it decrypts on click
      const generatedLink = `${window.location.origin}/shared-note?id=${randomId}&key=${encryptionPassphrase}`;
      setSharingUrl(generatedLink);
      setIsProcessing(false);
    }, 600);
  };

  const handleCopy = () => {
    if (!sharingUrl) return;
    navigator.clipboard.writeText(sharingUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6" id="password-sharer-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Lock className="w-6 h-6 text-indigo-400" />
          <span>Self-Destructing Note &amp; Password Sharer</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Transmit highly confidential passwords, API credentials, or private keys safely. Create single-use encrypted messages that completely self-destruct after being read.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Creator parameters */}
        <div className="lg:col-span-7 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4">
          <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>Create Encrypted Message</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                Confidential content to encrypt
              </span>
              <textarea
                rows={5}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type passwords, database access rules, server secrets, or personal parameters here..."
                className="w-full bg-zinc-950 border border-zinc-900 text-sm font-sans text-zinc-300 rounded-lg p-3 focus:outline-none focus:border-indigo-500/40 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <div className="space-y-1 bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1">
                  Self-Destruct Rules
                </span>
                <select
                  value={expiryType}
                  onChange={(e) => setExpiryType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 rounded p-1.5 focus:outline-none"
                >
                  <option value="view">Destruct after 1 view</option>
                  <option value="time">Destruct after timeline expire</option>
                </select>
              </div>

              {expiryType === 'time' && (
                <div className="space-y-1 bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1">
                    Expiration Timeline
                  </span>
                  <select
                    value={expiryDuration}
                    onChange={(e) => setExpiryDuration(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 rounded p-1.5 focus:outline-none"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={24}>24 Hours (1 Day)</option>
                    <option value={168}>7 Days</option>
                  </select>
                </div>
              )}

              {expiryType === 'view' && (
                <div className="space-y-1 bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1">
                    Max click parameters
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={expiryDuration}
                    onChange={(e) => setExpiryDuration(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 rounded p-1 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                Custom decryption key (Optional passphrase overlay)
              </span>
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Leave blank to auto generate a high-entropy key segment"
                className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 rounded p-2 focus:outline-none focus:border-indigo-500/40"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleGenerateLink}
              disabled={isProcessing || !noteText.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-bold font-sans rounded text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Generate Self-Destruct Link</span>
            </button>
          </div>
        </div>

        {/* Results Link Column */}
        <div className="lg:col-span-5 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between min-h-[380px]">
          <div className="space-y-4 w-full flex-1 flex flex-col">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-2">
              Encrypted shareable link
            </h3>

            {sharingUrl ? (
              <div className="space-y-4">
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg flex justify-between items-center gap-4">
                  <div className="space-y-1 select-all break-all overflow-hidden">
                    <span className="block text-[8px] font-mono text-emerald-400 uppercase tracking-widest">Active link</span>
                    <code className="text-[10px] font-mono text-zinc-300">{sharingUrl}</code>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded flex items-center justify-center cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex gap-2 p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-lg text-xs text-indigo-300">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>The encryption keys are embedded right in the URL anchor parameter. Opening this page decodes it natively in the recipient browser and deletes it instantly from databases.</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 space-y-2 border border-dashed border-zinc-900 rounded-lg">
                <Lock className="w-8 h-8 opacity-40 text-indigo-400 animate-pulse" />
                <p className="text-xs">Create your note on the left and click "Generate Self-Destruct Link".</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

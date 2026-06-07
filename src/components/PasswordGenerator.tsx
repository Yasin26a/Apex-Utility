import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Copy, RefreshCw, Check, Trash2, Cpu, Eye, EyeOff, 
  HelpCircle, ChevronDown, CheckCircle2, AlertTriangle, Sparkles, 
  Settings, Key, AlertCircle, ListPlus, Sliders, Type, Download, FileDown
} from 'lucide-react';
import { addRecentOperation } from '../utils/recentOperations';
import { usePresets } from '../context/PresetContext';

// Lightweight, curated list of tech, nature, and adventure words for memorable passphrases
const MEMORABLE_WORDS = [
  'crypto', 'secure', 'vault', 'shield', 'cyber', 'matrix', 'terminal', 'pixel', 'galaxy', 
  'nexus', 'beacon', 'cosmos', 'orbit', 'plasma', 'binary', 'qubit', 'silicon', 'quantum', 
  'cipher', 'vector', 'vertex', 'glitch', 'syntax', 'photon', 'vortex', 'shadow', 'aurora', 
  'signal', 'alpha', 'omega', 'helix', 'proton', 'fusion', 'apex', 'proxy', 'kernel', 
  'prompt', 'tensor', 'neural', 'pulse', 'grid', 'sonar', 'prism', 'zenith', 'quartz', 
  'vessel', 'horizon', 'nebula', 'specter', 'radar', 'safari', 'canyon', 'forest', 'summit', 
  'glacier', 'breeze', 'monolith', 'element', 'cascade', 'legacy', 'dynamic', 'stellar', 
  'echo', 'whisper', 'legend', 'cobalt', 'crimson', 'emerald', 'amber', 'indigo', 
  'obsidian', 'citrus', 'carbon', 'titan', 'gravity', 'velocity', 'magnet', 'phoenix', 
  'engine', 'tracker', 'bunker', 'haven', 'bento', 'samurai', 'ninja', 'spirit', 
  'cosmic', 'atomic', 'magnetic', 'synthetic', 'hybrid', 'electric', 'fossil', 'ancient', 
  'infinite', 'eternal', 'celestial', 'lunar', 'solar'
];

interface PasswordHistoryItem {
  id: string;
  value: string;
  type: 'random' | 'passphrase';
  entropy: number;
  strengthLabel: string;
  timestamp: string;
}

export default function PasswordGenerator() {
  const { activeSettings, updateActiveSettings } = usePresets();

  // Generation Settings
  const [genMode, setGenMode] = useState<'random' | 'passphrase'>(() => activeSettings.passwordGenMode || 'random');
  const [length, setLength] = useState(() => activeSettings.passwordLength ?? 16); // Random password length
  const [wordCount, setWordCount] = useState(() => activeSettings.passwordWordCount ?? 4); // Passphrase word count

  // Complexity Options
  const [includeUppercase, setIncludeUppercase] = useState(() => activeSettings.passwordIncludeUppercase ?? true);
  const [includeLowercase, setIncludeLowercase] = useState(() => activeSettings.passwordIncludeLowercase ?? true);
  const [includeNumbers, setIncludeNumbers] = useState(() => activeSettings.passwordIncludeNumbers ?? true);
  const [includeSymbols, setIncludeSymbols] = useState(() => activeSettings.passwordIncludeSymbols ?? true);
  
  // Custom Symbol Definitions
  const [customSymbols, setCustomSymbols] = useState(() => activeSettings.passwordCustomSymbols ?? '!@#$%^&*()_+-=[]{}|;:,.<>?');
  // Excluded Characters filter
  const [excludedChars, setExcludedChars] = useState(() => activeSettings.passwordExcludedChars ?? 'l1Io0O');

  // Passphrase configurations
  const [separator, setSeparator] = useState(() => activeSettings.passwordSeparator ?? '-');
  const [capitalizeWords, setCapitalizeWords] = useState(() => activeSettings.passwordCapitalizeWords ?? true);
  const [addNumber, setAddNumber] = useState(() => activeSettings.passwordAddNumber ?? true);

  // Sync local changes back to the global active preset
  useEffect(() => {
    updateActiveSettings({
      passwordGenMode: genMode,
      passwordLength: length,
      passwordWordCount: wordCount,
      passwordIncludeUppercase: includeUppercase,
      passwordIncludeLowercase: includeLowercase,
      passwordIncludeNumbers: includeNumbers,
      passwordIncludeSymbols: includeSymbols,
      passwordCustomSymbols: customSymbols,
      passwordExcludedChars: excludedChars,
      passwordSeparator: separator,
      passwordCapitalizeWords: capitalizeWords,
      passwordAddNumber: addNumber,
    });
  }, [
    genMode,
    length,
    wordCount,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    customSymbols,
    excludedChars,
    separator,
    capitalizeWords,
    addNumber,
  ]);

  // Sync local states when another preset is loaded
  useEffect(() => {
    if (activeSettings) {
      if (activeSettings.passwordGenMode !== undefined && activeSettings.passwordGenMode !== genMode) {
        setGenMode(activeSettings.passwordGenMode);
      }
      if (activeSettings.passwordLength !== undefined && activeSettings.passwordLength !== length) {
        setLength(activeSettings.passwordLength);
      }
      if (activeSettings.passwordWordCount !== undefined && activeSettings.passwordWordCount !== wordCount) {
        setWordCount(activeSettings.passwordWordCount);
      }
      if (activeSettings.passwordIncludeUppercase !== undefined && activeSettings.passwordIncludeUppercase !== includeUppercase) {
        setIncludeUppercase(activeSettings.passwordIncludeUppercase);
      }
      if (activeSettings.passwordIncludeLowercase !== undefined && activeSettings.passwordIncludeLowercase !== includeLowercase) {
        setIncludeLowercase(activeSettings.passwordIncludeLowercase);
      }
      if (activeSettings.passwordIncludeNumbers !== undefined && activeSettings.passwordIncludeNumbers !== includeNumbers) {
        setIncludeNumbers(activeSettings.passwordIncludeNumbers);
      }
      if (activeSettings.passwordIncludeSymbols !== undefined && activeSettings.passwordIncludeSymbols !== includeSymbols) {
        setIncludeSymbols(activeSettings.passwordIncludeSymbols);
      }
      if (activeSettings.passwordCustomSymbols !== undefined && activeSettings.passwordCustomSymbols !== customSymbols) {
        setCustomSymbols(activeSettings.passwordCustomSymbols);
      }
      if (activeSettings.passwordExcludedChars !== undefined && activeSettings.passwordExcludedChars !== excludedChars) {
        setExcludedChars(activeSettings.passwordExcludedChars);
      }
      if (activeSettings.passwordSeparator !== undefined && activeSettings.passwordSeparator !== separator) {
        setSeparator(activeSettings.passwordSeparator);
      }
      if (activeSettings.passwordCapitalizeWords !== undefined && activeSettings.passwordCapitalizeWords !== capitalizeWords) {
        setCapitalizeWords(activeSettings.passwordCapitalizeWords);
      }
      if (activeSettings.passwordAddNumber !== undefined && activeSettings.passwordAddNumber !== addNumber) {
        setAddNumber(activeSettings.passwordAddNumber);
      }
    }
  }, [activeSettings]);

  // Output password state
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [revealPassword, setRevealPassword] = useState(true); // Toggle text/password input

  // Bulk Export configurations
  const [bulkCount, setBulkCount] = useState(50);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkExportSuccess, setBulkExportSuccess] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<string[]>([]);

  // FAQ block state
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true,
    1: false,
  });

  // Local storage history of generated passwords
  const [history, setHistory] = useState<PasswordHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('apex_password_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save history to localStorage on modification
  const saveHistory = (newHistory: PasswordHistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('apex_password_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save password history to localStorage', e);
    }
  };

  // Core compile routine to retrieve a password string based on current directives
  const compilePassword = (): string => {
    let result = '';

    if (genMode === 'random') {
      const lowercaseSet = 'abcdefghijklmnopqrstuvwxyz';
      const uppercaseSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbersSet = '0123456789';
      const symbolsSet = customSymbols;

      let allowedPool = '';
      if (includeLowercase) allowedPool += lowercaseSet;
      if (includeUppercase) allowedPool += uppercaseSet;
      if (includeNumbers) allowedPool += numbersSet;
      if (includeSymbols) allowedPool += symbolsSet;

      // Filter out excluded characters
      if (excludedChars.length > 0) {
        const excludeRegex = new RegExp(`[${excludedChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]`, 'g');
        allowedPool = allowedPool.replace(excludeRegex, '');
      }

      if (allowedPool.length === 0) {
        return 'Error: Character pool is empty. Please enable at least one option.';
      }

      // Safeguard: Ensure at least one checked type is present (if pool allows it after exclusions)
      const getRandomChar = (set: string) => {
        let filtered = set;
        if (excludedChars.length > 0) {
          const excludeRegex = new RegExp(`[${excludedChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]`, 'g');
          filtered = set.replace(excludeRegex, '');
        }
        return filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : '';
      };

      // Populate base components to satisfy checkboxes first
      let requiredSlots = '';
      if (includeLowercase) requiredSlots += getRandomChar(lowercaseSet);
      if (includeUppercase) requiredSlots += getRandomChar(uppercaseSet);
      if (includeNumbers) requiredSlots += getRandomChar(numbersSet);
      if (includeSymbols) requiredSlots += getRandomChar(symbolsSet);

      requiredSlots = requiredSlots.replace(/\0/g, ''); // Clear any empty chars

      const neededRandomLength = Math.max(0, length - requiredSlots.length);
      for (let i = 0; i < neededRandomLength; i++) {
        result += allowedPool[Math.floor(Math.random() * allowedPool.length)];
      }

      // Insert required slots in random positions
      const tempArray = (result + requiredSlots).split('');
      for (let i = tempArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tempArray[i], tempArray[j]] = [tempArray[j], tempArray[i]];
      }
      result = tempArray.join('');
    } else {
      // Passphrase generate
      const chosenWords: string[] = [];
      const wordPool = MEMORABLE_WORDS.filter(w => !excludedChars.split('').some(c => w.includes(c)));
      
      const sourcePool = wordPool.length > 5 ? wordPool : MEMORABLE_WORDS;

      for (let i = 0; i < wordCount; i++) {
        let word = sourcePool[Math.floor(Math.random() * sourcePool.length)];
        if (capitalizeWords) {
          word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        chosenWords.push(word);
      }

      result = chosenWords.join(separator);

      if (addNumber) {
        const randNum = Math.floor(Math.random() * 90 + 10); // 2-digit number
        result += separator + randNum;
      }
    }

    return result;
  };

  // Generate a random password or memorable passphrase
  const handleGenerate = () => {
    const result = compilePassword();
    setPassword(result);
    setCopied(false);
  };

  // Instant action triggers when configs change for premium fluid reactive UI
  useEffect(() => {
    handleGenerate();
  }, [
    genMode, length, wordCount, includeUppercase, includeLowercase, 
    includeNumbers, includeSymbols, customSymbols, excludedChars, 
    separator, capitalizeWords, addNumber
  ]);

  // Sync background samples preview for bulk selector feedback
  useEffect(() => {
    const samples: string[] = [];
    for (let i = 0; i < Math.min(3, bulkCount); i++) {
      const p = compilePassword();
      if (p && !p.startsWith('Error:')) {
        samples.push(p);
      }
    }
    setBulkPreview(samples);
  }, [
    bulkCount, genMode, length, wordCount, includeUppercase, includeLowercase, 
    includeNumbers, includeSymbols, customSymbols, excludedChars, 
    separator, capitalizeWords, addNumber
  ]);

  // Evaluate Password Strength Metrics (Entropy in Bits & Visual Score)
  const calculateMetrics = () => {
    if (!password || password.startsWith('Error:')) {
      return { entropy: 0, strengthLabel: 'Weak', percent: 0, color: 'text-zinc-500', barColor: 'bg-zinc-800' };
    }

    let poolSize = 0;
    if (genMode === 'random') {
      if (includeLowercase) poolSize += 26;
      if (includeUppercase) poolSize += 26;
      if (includeNumbers) poolSize += 10;
      if (includeSymbols) poolSize += customSymbols.length;
      if (excludedChars.length > 0) {
        poolSize = Math.max(1, poolSize - excludedChars.length);
      }

      // Calculated Entropy Formula: H = L * log2(R)
      const entropy = Math.round(password.length * Math.log2(poolSize || 2));
      let strengthLabel = 'Weak';
      let percent = Math.min(100, Math.round((entropy / 128) * 100));
      let color = 'text-red-400';
      let barColor = 'bg-red-500';

      if (entropy >= 110) {
        strengthLabel = 'Military-Grade';
        color = 'text-[#22c55e]';
        barColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
      } else if (entropy >= 75) {
        strengthLabel = 'Extremely Secure';
        color = 'text-emerald-400';
        barColor = 'bg-emerald-500';
      } else if (entropy >= 45) {
        strengthLabel = 'Moderate / Safe';
        color = 'text-amber-400';
        barColor = 'bg-amber-500';
      }

      return { entropy, strengthLabel, percent, color, barColor };
    } else {
      // Passphrase entropy
      // Each word from a 100-word vocabulary with replacements contributes ~log2(100) = 6.64 bits.
      // Capitalization, separators, and appended digits boost this.
      let entropyVal = wordCount * Math.log2(MEMORABLE_WORDS.length);
      if (capitalizeWords) entropyVal += wordCount; // Cap bonus
      if (addNumber) entropyVal += Math.log2(100); // 2-digit number bonus
      
      const entropy = Math.round(entropyVal);
      let strengthLabel = 'Moderate';
      let percent = Math.min(100, Math.round((entropy / 128) * 100));
      let color = 'text-amber-400';
      let barColor = 'bg-amber-500';

      if (entropy >= 100) {
        strengthLabel = 'Fault-Proof Steel';
        color = 'text-[#22c55e]';
        barColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
      } else if (entropy >= 65) {
        strengthLabel = 'Extremely Strong';
        color = 'text-emerald-400';
        barColor = 'bg-emerald-500';
      }

      return { entropy, strengthLabel, percent, color, barColor };
    }
  };

  const metrics = calculateMetrics();

  // One-click secure copy implementation
  const handleCopy = async () => {
    if (!password || password.startsWith('Error:')) return;
    
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);

      // Fire a beautiful completed sandbox telemetry operation in ledger for aesthetics
      addRecentOperation(
        `vault_key_${password.substring(0, 4)}***.key`,
        'Shield Vault',
        `${password.length} Chars`,
        `${metrics.entropy} Bits`,
        `APEX_VAULT_KEY_${Date.now().toString().slice(-4)}.key`,
        `data:text/plain;base64,${btoa(password)}`
      );

      // Check if item already exists in local history, if not append it
      if (!history.some(h => h.value === password)) {
        const newItem: PasswordHistoryItem = {
          id: `pwd_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          value: password,
          type: genMode,
          entropy: metrics.entropy,
          strengthLabel: metrics.strengthLabel,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        saveHistory([newItem, ...history.slice(0, 19)]); // Keep history capped at 20 items for lightweight persistence
      }

    } catch (e) {
      console.error('Failed to copy keys into local systems:', e);
    }
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveHistory(history.filter(h => h.id !== id));
  };

  // Handle generating high volumes of passwords and downloading the CSV sheet
  const handleBulkExportCSV = async () => {
    if (bulkGenerating) return;
    setBulkGenerating(true);
    setBulkExportSuccess(false);

    // Satisfy interactive mechanical timing
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const firstRow = ['Index', 'Password', 'Type', 'Length', 'Entropy (Bits)', 'Strength'];
      const dataRows: string[][] = [firstRow];

      for (let i = 1; i <= bulkCount; i++) {
        const pwd = compilePassword();
        if (pwd.startsWith('Error:')) {
          alert('Failed to generate batch. ' + pwd);
          setBulkGenerating(false);
          return;
        }

        let entropy = 0;
        let strength = 'Weak';

        if (genMode === 'random') {
          let poolSize = 0;
          if (includeLowercase) poolSize += 26;
          if (includeUppercase) poolSize += 26;
          if (includeNumbers) poolSize += 10;
          if (includeSymbols) poolSize += customSymbols.length;
          if (excludedChars.length > 0) {
            poolSize = Math.max(1, poolSize - excludedChars.length);
          }

          entropy = Math.round(pwd.length * Math.log2(poolSize || 2));
          if (entropy >= 110) strength = 'Military-Grade';
          else if (entropy >= 75) strength = 'Extremely Secure';
          else if (entropy >= 45) strength = 'Moderate / Safe';
        } else {
          let entropyVal = wordCount * Math.log2(MEMORABLE_WORDS.length);
          if (capitalizeWords) entropyVal += wordCount;
          if (addNumber) entropyVal += Math.log2(100);
          entropy = Math.round(entropyVal);
          if (entropy >= 100) strength = 'Fault-Proof Steel';
          else if (entropy >= 65) strength = 'Extremely Strong';
          else strength = 'Moderate';
        }

        dataRows.push([
          String(i),
          pwd,
          genMode === 'random' ? 'Random String' : 'Memorable Phrasing',
          String(pwd.length),
          String(entropy),
          strength
        ]);
      }

      // Convert data grid to RFC 4180 CSV specifications
      const csvStr = dataRows
        .map((row) => row.map((field) => `"${field.replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const downloadLinkUrl = URL.createObjectURL(blob);

      const triggerAnchor = document.createElement('a');
      triggerAnchor.href = downloadLinkUrl;
      triggerAnchor.setAttribute('download', `Apex_Vault_Batch_${bulkCount}_${Date.now()}.csv`);
      document.body.appendChild(triggerAnchor);
      triggerAnchor.click();
      document.body.removeChild(triggerAnchor);

      // Log into sandbox suite operations
      addRecentOperation(
        `apex_vault_batch_${bulkCount}_export.csv`,
        'Shield Vault',
        `${bulkCount} Keys`,
        'CSV Sheet',
        `APEX_CSV_BATCH_${Date.now().toString().slice(-4)}.csv`,
        downloadLinkUrl
      );

      setBulkExportSuccess(true);
      setTimeout(() => setBulkExportSuccess(false), 4000);
    } catch (err) {
      console.error('Batch csv generation pipeline failure:', err);
    } finally {
      setBulkGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tool Header plate */}
      <div className="space-y-2 select-none">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded bg-brand/10 text-brand">
            <Key className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
              Shield Vault Compiler
            </h1>
            <p className="font-mono text-[10px] text-zinc-500">
              SECURE ENVELOPE OPERATIONAL SYSTEM / PASSWORD & PASSPHRASE GENERATION
            </p>
          </div>
        </div>
        <p className="font-sans text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
          Instantly generate non-sequential, cryptographically unpredictable keys and memorizable phrase patterns using secure user-constrained character pools and entropy diagnostics. No data is sent to the cloud.
        </p>
      </div>

      {/* Main Core Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Hand: Controls & Output Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Output Preview Block */}
          <div className="beveled-panel p-5 bg-[#07070a]/80 border-brand-border/40 space-y-4">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest select-none">
              <span className="flex items-center gap-1.5 font-bold">
                <Cpu className="w-3.5 h-3.5 text-brand" />
                Isolated Compiler Output
              </span>
              <span className="font-mono text-zinc-600">STATE: ENCRYPTED BUFFER</span>
            </div>

            {/* Generated display workspace bar */}
            <div className="flex items-stretch gap-2">
              <div className="flex-1 relative bg-zinc-950/80 rounded-lg border border-zinc-900/60 flex items-center justify-between hover:border-zinc-800 transition-colors">
                <input
                  type={revealPassword ? 'text' : 'password'}
                  readOnly
                  value={password}
                  placeholder="Compiling secure vault key..."
                  className={`w-full bg-transparent px-4 py-3.5 font-mono text-sm sm:text-base text-white tracking-wide border-none focus:outline-none focus:ring-0 ${
                    password.startsWith('Error:') ? 'text-rose-500 font-bold' : ''
                  }`}
                  id="apex-generated-password-output"
                />
                <div className="absolute right-3 flex items-center gap-1">
                  <button
                    onClick={() => setRevealPassword(!revealPassword)}
                    className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40 cursor-pointer transition-all active:scale-95"
                    title={revealPassword ? 'Mask Output Key' : 'Reveal Output Key'}
                  >
                    {revealPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40 cursor-pointer transition-all active:scale-95"
                    title="Regenerate Random Key"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleCopy}
                disabled={!password || password.startsWith('Error:')}
                className="px-5 rounded bg-brand text-zinc-950 font-heading font-extrabold text-xs uppercase tracking-wider hover:bg-brand/90 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center gap-2 transition-all cursor-pointer shadow-md select-none shrink-0 disabled:opacity-40 disabled:cursor-not-allowed border border-transparent"
                title="Secure Lock & Copy"
                id="apex-password-copy-action"
              >
                {copied ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
                <span>{copied ? 'Copied' : 'Lock & Copy'}</span>
              </button>
            </div>

            {/* Strength diagnostic dynamic bar and bits mapping */}
            <div className="pt-2 border-t border-zinc-900/40 space-y-2 select-none">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500 uppercase tracking-wider">Entropy Diagnostic:</span>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={`font-extrabold ${metrics.color}`}>{metrics.strengthLabel}</span>
                  <span className="text-zinc-400">({metrics.entropy} Bits)</span>
                </div>
              </div>

              {/* Strength visual track */}
              <div className="h-2 bg-zinc-950 rounded-full border border-zinc-900 overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.percent}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className={`h-full rounded-full ${metrics.barColor}`}
                />
              </div>

              <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                <span>Weak (&lt; 45 Bits)</span>
                <span>Optimal (75-110 Bits)</span>
                <span>Military-Grade (&gt; 110 Bits)</span>
              </div>
            </div>
          </div>

          {/* Section 2: Generation Setup Form Box */}
          <div className="beveled-panel p-5 bg-[#07070a]/80 border-brand-border/40 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <span className="font-heading text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 select-none">
                <Sliders className="w-4 h-4 text-brand" />
                Cryptographic Directives
              </span>
              <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-900 select-none">
                <button
                  onClick={() => setGenMode('random')}
                  className={`px-3 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    genMode === 'random' 
                      ? 'bg-brand/10 text-brand border border-brand/20' 
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  Pure Random
                </button>
                <button
                  onClick={() => setGenMode('passphrase')}
                  className={`px-3 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    genMode === 'passphrase' 
                      ? 'bg-brand/10 text-brand border border-brand/20' 
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  Memorable Phrases
                </button>
              </div>
            </div>

            {/* Render customizable directives matching selected generation mode */}
            {genMode === 'random' ? (
              <div className="space-y-6">
                {/* Character length range tracker */}
                <div className="space-y-2 select-none">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-zinc-400">Character Key String Length</span>
                    <span className="text-white font-extrabold">{length} Characters</span>
                  </div>
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="8"
                      max="128"
                      value={length}
                      onChange={(e) => setLength(Number(e.target.value))}
                      className="w-full accent-brand h-1 bg-zinc-950 rounded-lg cursor-pointer border border-zinc-900"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                      <span>8 Chars (Eco)</span>
                      <span>128 Chars (Ultra-Secure)</span>
                    </div>
                  </div>
                </div>

                {/* Checklist options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Lowercase checklist */}
                  <label className="p-3 bg-zinc-950/40 hover:bg-zinc-950/80 border border-zinc-900/60 hover:border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer select-none transition-all">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Lowercase Characters</span>
                      <span className="font-mono text-[9px] text-zinc-500">e.g. a-z (26 characters)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeLowercase}
                      onChange={(e) => setIncludeLowercase(e.target.checked)}
                      className="rounded border-zinc-900 bg-zinc-950 text-brand focus:ring-brand w-4.5 h-4.5 cursor-pointer"
                    />
                  </label>

                  {/* Uppercase checklist */}
                  <label className="p-3 bg-zinc-950/40 hover:bg-zinc-950/80 border border-zinc-900/60 hover:border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer select-none transition-all">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Uppercase Characters</span>
                      <span className="font-mono text-[9px] text-zinc-500">e.g. A-Z (26 characters)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeUppercase}
                      onChange={(e) => setIncludeUppercase(e.target.checked)}
                      className="rounded border-zinc-900 bg-zinc-950 text-brand focus:ring-brand w-4.5 h-4.5 cursor-pointer"
                    />
                  </label>

                  {/* Numbers checklist */}
                  <label className="p-3 bg-zinc-950/40 hover:bg-zinc-950/80 border border-zinc-900/60 hover:border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer select-none transition-all">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Numeral Elements</span>
                      <span className="font-mono text-[9px] text-zinc-500">e.g. 0-9 (10 digits)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeNumbers}
                      onChange={(e) => setIncludeNumbers(e.target.checked)}
                      className="rounded border-zinc-900 bg-zinc-950 text-brand focus:ring-brand w-4.5 h-4.5 cursor-pointer"
                    />
                  </label>

                  {/* Symbols check */}
                  <label className="p-3 bg-zinc-950/40 hover:bg-zinc-950/80 border border-zinc-900/60 hover:border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer select-none transition-all">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Special Symbols</span>
                      <span className="font-mono text-[9px] text-zinc-500">Customizable punctuation</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeSymbols}
                      onChange={(e) => setIncludeSymbols(e.target.checked)}
                      className="rounded border-zinc-900 bg-zinc-950 text-brand focus:ring-brand w-4.5 h-4.5 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Advanced characters configurations input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Symbols Custom pool input */}
                  <div className="space-y-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 font-bold block select-none">Custom Symbol Pool</span>
                    <input
                      type="text"
                      disabled={!includeSymbols}
                      value={customSymbols}
                      onChange={(e) => setCustomSymbols(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded px-2.5 py-1.5 font-mono text-xs text-white uppercase tracking-wider focus:outline-none focus:border-brand/40 hover:border-zinc-800 transition-colors disabled:opacity-40 disabled:hover:border-zinc-900"
                    />
                  </div>

                  {/* Avoid Similar Characters/Exclusions input */}
                  <div className="space-y-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 font-bold block select-none">Exclusions / Similar Characters</span>
                    <input
                      type="text"
                      placeholder="e.g. l1Io0O"
                      value={excludedChars}
                      onChange={(e) => setExcludedChars(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded px-2.5 py-1.5 font-mono text-xs text-white tracking-wider focus:outline-none focus:border-brand/40 hover:border-zinc-800 transition-colors"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Memorable Word Count Slider */}
                <div className="space-y-2 select-none">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-zinc-400">Total Dictionary Words</span>
                    <span className="text-white font-extrabold">{wordCount} Words</span>
                  </div>
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="3"
                      max="10"
                      value={wordCount}
                      onChange={(e) => setWordCount(Number(e.target.value))}
                      className="w-full accent-brand h-1 bg-zinc-950 rounded-lg cursor-pointer border border-zinc-900"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                      <span>3 Words (Minimal)</span>
                      <span>10 Words (Max)</span>
                    </div>
                  </div>
                </div>

                {/* Grid of toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Capitalize word tags */}
                  <label className="p-3 bg-zinc-950/40 hover:bg-zinc-950/80 border border-zinc-900/60 hover:border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer select-none transition-all">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Capitalization</span>
                      <span className="font-mono text-[9px] text-zinc-500">e.g. Apex-Quantum</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={capitalizeWords}
                      onChange={(e) => setCapitalizeWords(e.target.checked)}
                      className="rounded border-zinc-900 bg-zinc-950 text-brand focus:ring-brand w-4.5 h-4.5 cursor-pointer"
                    />
                  </label>

                  {/* Appending numerical suffix element */}
                  <label className="p-3 bg-zinc-950/40 hover:bg-zinc-950/80 border border-zinc-900/60 hover:border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer select-none transition-all">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Append Number</span>
                      <span className="font-mono text-[9px] text-zinc-500">e.g. quantum-37</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={addNumber}
                      onChange={(e) => setAddNumber(e.target.checked)}
                      className="rounded border-zinc-900 bg-zinc-950 text-brand focus:ring-brand w-4.5 h-4.5 cursor-pointer"
                    />
                  </label>

                  {/* Exclusions tracker */}
                  <div className="space-y-1.5 bg-zinc-950/20 px-3 py-2 rounded-xl border border-zinc-900/60">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 font-bold block select-none">Separator String</span>
                    <input
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-900 rounded px-2.5 py-1 font-mono text-xs text-white text-center tracking-widest focus:outline-none focus:border-brand/40"
                      value={separator}
                      onChange={(e) => setSeparator(e.target.value)}
                    />
                  </div>
                </div>

                {/* Exclusions in memorable passphrase word characters */}
                <div className="space-y-1.5 select-none text-left">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 font-bold block select-none">Exclude Specific Character List from Passphrase</span>
                  <input
                    type="text"
                    className="w-full max-w-md bg-zinc-950 border border-zinc-900 rounded px-2.5 py-1.5 font-mono text-xs text-white tracking-wider focus:outline-none focus:border-brand/40"
                    placeholder="e.g. abc (strictly removes words containing these letters)"
                    value={excludedChars}
                    onChange={(e) => setExcludedChars(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Bulk Key Compiler & CSV Export */}
          <div className="beveled-panel p-5 bg-[#07070a]/80 border-brand-border/40 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <span className="font-heading text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 select-none">
                <FileDown className="w-4 h-4 text-brand" />
                Bulk Key Compiler & Export
              </span>
              <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">CSV STREAM MODULE</span>
            </div>

            <div className="space-y-4">
              <p className="font-sans text-xs text-zinc-400">
                Generate high-volume batches of cryptographic keys instantaneously based on your active directives. Extract complete sheets containing entropy calculations, type indicators, and length audits.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Volume slider control */}
                <div className="space-y-3.5 bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-900/50">
                  <div className="flex items-center justify-between font-mono text-xs select-none">
                    <span className="text-zinc-500 font-medium">Batch Export Volume</span>
                    <span className="text-brand font-extrabold">{bulkCount} Passwords</span>
                  </div>
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="5"
                      max="1000"
                      step="5"
                      id="bulk-pwd-count-slider"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(Number(e.target.value))}
                      className="w-full accent-brand h-1 bg-zinc-950 rounded-lg cursor-pointer border border-zinc-900"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-600 font-mono select-none">
                      <span>5 units</span>
                      <span>1,000 units</span>
                    </div>
                  </div>

                  {/* Fast Select Presets */}
                  <div className="space-y-1.5 pt-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 font-bold block select-none">Fast Select Volumes</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[10, 50, 100, 500].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setBulkCount(v)}
                          className={`py-1.5 rounded border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            bulkCount === v
                              ? 'bg-brand/10 border-brand/40 text-brand'
                              : 'bg-zinc-950 border-zinc-900 hover:border-zinc-850 text-zinc-500 hover:text-zinc-350'
                          }`}
                        >
                          {v}qty
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Output Format Preview */}
                <div className="space-y-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 font-bold block select-none">
                    Responsive Output Preview
                  </span>
                  
                  {bulkPreview.length > 0 ? (
                    <div className="bg-[#030305]/95 border border-zinc-900/80 rounded-xl p-3.5 font-mono text-xs select-none space-y-2">
                      {bulkPreview.map((pwd, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-zinc-400 border-b border-zinc-950 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-zinc-600 text-[10px]">#{idx + 1}</span>
                          <span className="text-zinc-200 font-medium truncate flex-1 tracking-wide">{pwd}</span>
                          <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{genMode}</span>
                        </div>
                      ))}
                      <div className="text-[8px] text-zinc-650 text-center uppercase tracking-widest pt-1 border-t border-zinc-900/30">
                        * Preview updates reactive to options above
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 bg-zinc-950/40 border border-zinc-900/60 rounded-xl text-center font-mono text-[10px] text-rose-500/80 px-4">
                      Empty or invalid pool configurations. Enable more directives to display active stream preview.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-zinc-900/40">
                <p className="font-mono text-[10px] text-zinc-500 leading-normal max-w-sm">
                  * Generated sheet incorporates RFC compliant CSV format, compatible with standard Password Managers (e.g., Bitwarden, KeePass, 1Password).
                </p>

                <button
                  type="button"
                  onClick={handleBulkExportCSV}
                  disabled={bulkGenerating || bulkPreview.length === 0}
                  className={`w-full sm:w-auto px-6 py-3 rounded font-heading font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md select-none border shrink-0 ${
                    bulkExportSuccess
                      ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20'
                      : 'bg-brand text-zinc-950 border-transparent hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                  id="apex-bulk-export-csv-action"
                >
                  {bulkGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>Compiling Batch Pool...</span>
                    </>
                  ) : bulkExportSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>CSV Stream Exported!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 shrink-0" />
                      <span>Generate &amp; Export CSV</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Right Hand: Ledger History Tracker Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="beveled-panel p-5 bg-[#07070a]/80 border-brand-border/40 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 select-none">
              <span className="font-heading text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ListPlus className="w-4 h-4 text-brand" />
                Compiled Key Ledger
              </span>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="p-1 px-1.5 rounded bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-[10px] text-zinc-500 hover:text-red-400 cursor-pointer hover:border-red-950/40 transition-all font-mono font-bold"
                  title="Purge key cache ledger history"
                >
                  Flush Cache
                </button>
              )}
            </div>

            {/* List log container */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-0.5 scrollbar-thin">
              {history.length === 0 ? (
                <div className="py-12 border border-dashed border-zinc-900/60 rounded-xl text-center font-mono text-[11px] text-zinc-650 px-4 select-none">
                  <ShieldCheck className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-55" />
                  <p className="font-bold">Key Cache Empty</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Newly locked keys will dynamically populate this mechanical session storage ledger.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, y: -5 }}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(item.value);
                          // Trigger mini success notification
                        } catch {}
                      }}
                      className="p-3 bg-[#0a0a0f] border border-zinc-900 hover:border-zinc-800 rounded-xl flex flex-col gap-2 relative group cursor-pointer transition-colors"
                      title="Click directly to duplicate key to clipboard"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] bg-zinc-950 border border-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded font-semibold uppercase">
                            {item.type}
                          </span>
                          <span className="font-mono text-[9px] text-zinc-600 block mt-1">{item.timestamp}</span>
                        </div>
                        <button
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-zinc-900/60 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="font-mono text-xs text-white font-bold break-all pr-4">
                        {item.value}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-mono select-none">
                        <span className="text-zinc-600">Entropy: {item.entropy} Bits</span>
                        <span className="text-brand-light brightness-90">{item.strengthLabel}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Mechanical FAQ Box */}
      <div className="beveled-panel p-6 border-brand-border/30 bg-[#07070a]/60 space-y-4">
        <div className="flex items-center gap-2 border-b border-brand-border/20 pb-3 select-none">
          <HelpCircle className="w-5 h-5 text-brand" />
          <h2 className="font-heading text-sm font-extrabold text-white uppercase tracking-wider">Frequently Asked Diagnostic Logs</h2>
        </div>

        <div className="space-y-3 text-left">
          {[
            {
              q: 'How is thermodynamic entropy determined in the compiler?',
              a: 'The structural strength metrics utilize the standard cryptographic key size formula: Entropy = L × log₂(R) bits, where L represents key character length and R details the complexity pool size. Levels exceeding 75 bits represent strong defense barriers, and counts larger than 110 bits satisfy rigid defense standards (Military-Grade).'
            },
            {
              q: 'Why are similar alphabetic characters filtered?',
              a: 'Aesthetic key verification structures often confuse glyph blocks like l (lowercase L), 1 (numeral one), I (uppercase i), o (lowercase letter O), 0 (zero), or O (uppercase letter O). Excluding these elements removes human transposition errors without lowering key integrity.'
            }
          ].map((item, index) => {
            const isOpen = faqOpen[index];
            return (
              <div 
                key={index} 
                className="bg-[#050508]/80 border border-zinc-900/60 rounded-xl overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setFaqOpen(prev => ({ ...prev, [index]: !isOpen }))}
                  className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-950/40 select-none text-left focus:outline-none"
                >
                  <span className="font-heading text-xs font-bold text-zinc-300">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                    >
                      <div className="px-4 pb-4 font-sans text-xs text-zinc-400 border-t border-zinc-900/40 pt-3 leading-relaxed">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

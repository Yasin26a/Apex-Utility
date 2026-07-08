import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Regex,
  Play,
  Layers,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  Search,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Code,
  ArrowRight,
  Sparkles,
  Info,
  Sliders,
  Type,
  Plus,
  Eye,
  GitMerge,
  Maximize2
} from 'lucide-react';

// Define the structural node for the Regex Flowchart
interface RegexNode {
  id: string;
  type: 'start' | 'end' | 'literal' | 'charClass' | 'group' | 'lookaround' | 'alternation' | 'anchor' | 'whitespace' | 'unknown';
  label: string;
  raw: string;
  description: string;
  quantifier?: {
    min: number;
    max: number; // -1 for infinity
    label: string;
    raw: string;
  };
  subNodes?: RegexNode[]; // For groups/lookarounds
  branches?: RegexNode[][]; // For alternations
}

// Preset library for instant loading
interface RegexPreset {
  name: string;
  pattern: string;
  flags: string;
  description: string;
  testString: string;
}

const REGEX_PRESETS: RegexPreset[] = [
  {
    name: 'Email Address',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    flags: 'g',
    description: 'Matches standard email formats checking username, domain name, and top-level domain.',
    testString: 'hello.world_123@example-domain.co.uk\ninvalid_email@domain\ntest@gmail.com'
  },
  {
    name: 'Phone Format (US)',
    pattern: '^(?:\\+1[-. ]?)?\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$',
    flags: 'gm',
    description: 'Matches US phone formats with optional country code (+1), parentheses, and hyphens or dots.',
    testString: '+1 (555) 123-4567\n555.890.1234\n987-654-3210'
  },
  {
    name: 'Strength Lookahead',
    pattern: '^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    flags: 'g',
    description: 'Enforces safe password standards: at least 1 uppercase, 1 lowercase, 1 digit, 1 symbol, and min length of 8.',
    testString: 'P@ssw0rd2026\nweakpass\nSecure123!'
  },
  {
    name: 'URL Validator',
    pattern: '^(https?:\\/\\/)?(www\\.)?([a-zA-Z0-9-]+)\\.([a-z]{2,6})(\\/[a-zA-Z0-9#?=&._-]*)*$',
    flags: 'gi',
    description: 'Detects secure or insecure web links, domain elements, and optional subdirectories or query routes.',
    testString: 'https://ai.studio/build?ref=agent\nwww.wikipedia.org\nhttp://local-server/api/v1'
  },
  {
    name: 'Date (YYYY-MM-DD)',
    pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
    flags: 'g',
    description: 'Validates calendar format checking YYYY, MM (01-12) and DD (01-31 with partial leap year constraint check).',
    testString: '2026-07-01\n2025-13-45\n1999-12-31'
  }
];

// Simple tokenizer & parser to construct dynamic 2D sequence elements
function parseRegexToNodes(pattern: string): { nodes: RegexNode[]; isValid: boolean; error?: string } {
  if (!pattern) {
    return { nodes: [], isValid: true };
  }

  try {
    // Basic compilation check to make sure pattern is valid JavaScript RegExp
    new RegExp(pattern);
  } catch (err: any) {
    return { nodes: [], isValid: false, error: err.message || 'Invalid Regular Expression syntax' };
  }

  const nodes: RegexNode[] = [];
  let i = 0;
  let elementIdCounter = 0;

  const nextId = () => `node-${++elementIdCounter}`;

  // Helper to parse quantifiers following an element
  const parseQuantifier = (): { min: number; max: number; label: string; raw: string } | undefined => {
    if (i >= pattern.length) return undefined;
    const char = pattern[i];

    if (char === '*') {
      i++;
      if (pattern[i] === '?') { i++; return { min: 0, max: -1, label: '0 or more times (lazy)', raw: '*?' }; }
      return { min: 0, max: -1, label: '0 or more times (greedy)', raw: '*' };
    }
    if (char === '+') {
      i++;
      if (pattern[i] === '?') { i++; return { min: 1, max: -1, label: '1 or more times (lazy)', raw: '+?' }; }
      return { min: 1, max: -1, label: '1 or more times (greedy)', raw: '+' };
    }
    if (char === '?') {
      i++;
      if (pattern[i] === '?') { i++; return { min: 0, max: 1, label: '0 or 1 time (lazy / non-greedy)', raw: '??' }; }
      return { min: 0, max: 1, label: 'Optional (0 or 1 time)', raw: '?' };
    }
    if (char === '{') {
      const endIdx = pattern.indexOf('}', i);
      if (endIdx !== -1) {
        const rawQuantifier = pattern.substring(i, endIdx + 1);
        const inner = pattern.substring(i + 1, endIdx);
        i = endIdx + 1;
        
        const lazySuffix = pattern[i] === '?' ? '?' : '';
        if (lazySuffix) i++;

        const isLazy = lazySuffix === '?';
        const parts = inner.split(',');
        if (parts.length === 1) {
          const num = parseInt(parts[0].trim(), 10);
          return {
            min: num,
            max: num,
            label: `Exactly ${num} times${isLazy ? ' (lazy)' : ''}`,
            raw: rawQuantifier + lazySuffix
          };
        } else {
          const min = parts[0].trim() ? parseInt(parts[0].trim(), 10) : 0;
          const max = parts[1].trim() ? parseInt(parts[1].trim(), 10) : -1;
          const maxLabel = max === -1 ? 'or more' : `up to ${max}`;
          return {
            min,
            max,
            label: `Between ${min} and ${maxLabel} times${isLazy ? ' (lazy)' : ''}`,
            raw: rawQuantifier + lazySuffix
          };
        }
      }
    }
    return undefined;
  };

  // Helper to extract nested groups or character classes while respecting nested parenthesis
  const extractGroupContent = (openChar: string, closeChar: string): string => {
    let depth = 1;
    let start = i;
    while (i < pattern.length) {
      const char = pattern[i];
      if (char === '\\') {
        i += 2; // skip escape sequence
        continue;
      }
      if (char === openChar) depth++;
      if (char === closeChar) depth--;
      if (depth === 0) {
        const content = pattern.substring(start, i);
        i++; // skip close char
        return content;
      }
      i++;
    }
    return pattern.substring(start);
  };

  while (i < pattern.length) {
    const char = pattern[i];

    // Anchors
    if (char === '^') {
      nodes.push({
        id: nextId(),
        type: 'anchor',
        label: 'Line Start',
        raw: '^',
        description: 'Asserts the start of the matching line or string boundary.'
      });
      i++;
      continue;
    }
    if (char === '$') {
      nodes.push({
        id: nextId(),
        type: 'anchor',
        label: 'Line End',
        raw: '$',
        description: 'Asserts the end of the matching line or string boundary.'
      });
      i++;
      continue;
    }

    // Escape character classes / values
    if (char === '\\') {
      i++;
      if (i >= pattern.length) {
        nodes.push({ id: nextId(), type: 'unknown', label: 'Trailing Escape', raw: '\\', description: 'Incomplete escape sequence.' });
        break;
      }
      const escapeVal = pattern[i];
      const fullRaw = '\\' + escapeVal;
      i++;

      let nodeType: RegexNode['type'] = 'literal';
      let label = `Character '${escapeVal}'`;
      let desc = `Matches the exact character '${escapeVal}' (escaped literal)`;

      if (escapeVal === 'd') {
        nodeType = 'charClass';
        label = 'Digit (0-9)';
        desc = 'Matches any numerical character from 0 through 9.';
      } else if (escapeVal === 'D') {
        nodeType = 'charClass';
        label = 'Non-digit';
        desc = 'Matches any character that is not a numerical digit.';
      } else if (escapeVal === 'w') {
        nodeType = 'charClass';
        label = 'Alphanumeric / Word';
        desc = 'Matches letters, digits, and underscores [a-zA-Z0-9_].';
      } else if (escapeVal === 'W') {
        nodeType = 'charClass';
        label = 'Non-alphanumeric';
        desc = 'Matches any non-word character (symbols, spaces, etc.).';
      } else if (escapeVal === 's') {
        nodeType = 'whitespace';
        label = 'Whitespace';
        desc = 'Matches space, tabs, newlines, or carriage returns.';
      } else if (escapeVal === 'S') {
        nodeType = 'charClass';
        label = 'Non-whitespace';
        desc = 'Matches any character that is not a space or tab.';
      } else if (escapeVal === 'b') {
        nodeType = 'anchor';
        label = 'Word Boundary';
        desc = 'Matches the boundary position between a word and non-word character.';
      } else if (escapeVal === 'B') {
        nodeType = 'anchor';
        label = 'Non-word Boundary';
        desc = 'Matches any position that is not a standard word boundary.';
      }

      const q = parseQuantifier();
      nodes.push({
        id: nextId(),
        type: nodeType,
        label,
        raw: fullRaw,
        description: desc,
        quantifier: q
      });
      continue;
    }

    // Dot character class
    if (char === '.') {
      const q = parseQuantifier();
      nodes.push({
        id: nextId(),
        type: 'charClass',
        label: 'Any Character',
        raw: '.',
        description: 'Matches any single character except newline bounds.',
        quantifier: q
      });
      i++;
      continue;
    }

    // Character Sets [abc]
    if (char === '[') {
      i++; // skip '['
      const isNegated = pattern[i] === '^';
      if (isNegated) i++;

      const setContent = extractGroupContent('[', ']');
      const label = isNegated ? 'Excluded Set' : 'Character Set';
      
      // Polish up a nice descriptive text of character set members
      let parsedDesc = isNegated 
        ? 'Matches any character NOT in this set: ' 
        : 'Matches any single character present in this set: ';
      
      const cleanItems: string[] = [];
      for (let sIdx = 0; sIdx < setContent.length; sIdx++) {
        if (setContent[sIdx + 1] === '-' && setContent[sIdx + 2]) {
          cleanItems.push(`${setContent[sIdx]} to ${setContent[sIdx + 2]}`);
          sIdx += 2;
        } else {
          cleanItems.push(setContent[sIdx]);
        }
      }
      parsedDesc += cleanItems.join(', ');

      const q = parseQuantifier();
      nodes.push({
        id: nextId(),
        type: 'charClass',
        label: `${label} [${isNegated ? '^' : ''}${setContent}]`,
        raw: `[${isNegated ? '^' : ''}${setContent}]`,
        description: parsedDesc,
        quantifier: q
      });
      continue;
    }

    // Capture groups or lookarounds (...)
    if (char === '(') {
      i++; // skip '('
      let groupType: RegexNode['type'] = 'group';
      let label = 'Capturing Group';
      let desc = 'Creates a capture group to save matches or enforce evaluation precedence.';
      let skipChars = 0;

      // Detect lookarounds or non-capturing groups
      if (pattern.startsWith('?:', i)) {
        groupType = 'group';
        label = 'Non-Capturing Group';
        desc = 'Groups expressions together without creating a separate capture variable.';
        skipChars = 2;
      } else if (pattern.startsWith('?=', i)) {
        groupType = 'lookaround';
        label = 'Positive Lookahead';
        desc = 'Asserts that the upcoming character pattern matches here, without advancing the regex engine pointer.';
        skipChars = 2;
      } else if (pattern.startsWith('?!', i)) {
        groupType = 'lookaround';
        label = 'Negative Lookahead';
        desc = 'Asserts that the upcoming character pattern does NOT match here.';
        skipChars = 2;
      } else if (pattern.startsWith('?<=', i)) {
        groupType = 'lookaround';
        label = 'Positive Lookbehind';
        desc = 'Asserts that the preceding character pattern matches here.';
        skipChars = 3;
      } else if (pattern.startsWith('?<!', i)) {
        groupType = 'lookaround';
        label = 'Negative Lookbehind';
        desc = 'Asserts that the preceding character pattern does NOT match here.';
        skipChars = 3;
      }

      i += skipChars;
      const groupContent = extractGroupContent('(', ')');
      
      // Parse sub-nodes recursively
      const parsedSub = parseRegexToNodes(groupContent);
      const q = parseQuantifier();

      nodes.push({
        id: nextId(),
        type: groupType,
        label,
        raw: `(${pattern.substring(i - skipChars - 1, i + groupContent.length)})`,
        description: desc,
        subNodes: parsedSub.nodes,
        quantifier: q
      });
      continue;
    }

    // Alternations |
    if (char === '|') {
      // Alternations partition everything parsed so far on this level with everything upcoming
      // To build an alternation node, we merge left side nodes and prepare a split track.
      // For this interactive visual sandbox parser, we split the whole remaining pattern or group
      // into alternate branches to keep the flowchart beautifully structured.
      const currentBranches: RegexNode[][] = [];
      const leftBranch = [...nodes];
      nodes.length = 0; // empty current sequence to load alternations

      i++; // skip '|'
      
      // Grab remainder of pattern at this level or until closed bracket
      let remainder = '';
      let parenCount = 0;
      let bracketCount = 0;
      let startIdx = i;

      while (i < pattern.length) {
        const nextChar = pattern[i];
        if (nextChar === '\\') {
          i += 2;
          continue;
        }
        if (nextChar === '(') parenCount++;
        if (nextChar === ')') {
          if (parenCount === 0) break; // closed outer
          parenCount--;
        }
        if (nextChar === '[') bracketCount++;
        if (nextChar === ']') bracketCount--;

        if (nextChar === '|' && parenCount === 0 && bracketCount === 0) {
          // We found another alternate branch on same level
          const branchText = pattern.substring(startIdx, i);
          const branchParsed = parseRegexToNodes(branchText);
          currentBranches.push(branchParsed.nodes);
          startIdx = i + 1;
        }
        i++;
      }

      const lastBranchText = pattern.substring(startIdx, i);
      const lastBranchParsed = parseRegexToNodes(lastBranchText);
      
      currentBranches.unshift(leftBranch);
      currentBranches.push(lastBranchParsed.nodes);

      nodes.push({
        id: nextId(),
        type: 'alternation',
        label: 'Branch Alternation (OR)',
        raw: '|',
        description: 'Tries to match any of the parallel tracks. Evaluates left to right.',
        branches: currentBranches
      });
      continue;
    }

    // Fallback to literal characters sequence
    let literalSequence = char;
    i++;
    // Combine consecutive literals on the same level to avoid cluttered single letter boxes
    while (i < pattern.length) {
      const nextChar = pattern[i];
      const specialSymbols = ['^', '$', '\\', '.', '[', ']', '(', ')', '|', '*', '+', '?', '{'];
      if (specialSymbols.includes(nextChar)) {
        break;
      }
      literalSequence += nextChar;
      i++;
    }

    // Check if there is a quantifier on this sequence. If so, separate the last character 
    // from the sequence so the quantifier targets it correctly.
    if (i < pattern.length && ['*', '+', '?', '{'].includes(pattern[i])) {
      if (literalSequence.length > 1) {
        // split off last char
        const primaryLiteral = literalSequence.substring(0, literalSequence.length - 1);
        const quantizedChar = literalSequence[literalSequence.length - 1];

        nodes.push({
          id: nextId(),
          type: 'literal',
          label: `Text "${primaryLiteral}"`,
          raw: primaryLiteral,
          description: `Matches the exact string characters sequence "${primaryLiteral}".`
        });

        const q = parseQuantifier();
        nodes.push({
          id: nextId(),
          type: 'literal',
          label: `Character "${quantizedChar}"`,
          raw: quantizedChar,
          description: `Matches the exact character "${quantizedChar}".`,
          quantifier: q
        });
      } else {
        const q = parseQuantifier();
        nodes.push({
          id: nextId(),
          type: 'literal',
          label: `Character "${literalSequence}"`,
          raw: literalSequence,
          description: `Matches the exact character "${literalSequence}".`,
          quantifier: q
        });
      }
    } else {
      nodes.push({
        id: nextId(),
        type: 'literal',
        label: `Text "${literalSequence}"`,
        raw: literalSequence,
        description: `Matches the exact string characters sequence "${literalSequence}".`
      });
    }
  }

  return { nodes, isValid: true };
}

export default function RegexFlowchart() {
  const [pattern, setPattern] = useState<string>('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
  const [flags, setFlags] = useState<string>('g');
  const [testString, setTestString] = useState<string>('hello.world_123@example-domain.co.uk\ninvalid_email@domain\ntest@gmail.com');
  const [selectedPreset, setSelectedPreset] = useState<string>('Email Address');
  const [hoveredNode, setHoveredNode] = useState<RegexNode | null>(null);

  // Matcher state metrics
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [matchDuration, setMatchDuration] = useState<number>(0);

  // UI state
  const [showTesterGuide, setShowTesterGuide] = useState<boolean>(true);
  const [copiedRegex, setCopiedRegex] = useState<boolean>(false);

  // Trigger loading a preset
  const handleLoadPreset = (preset: RegexPreset) => {
    setPattern(preset.pattern);
    setFlags(preset.flags);
    setTestString(preset.testString);
    setSelectedPreset(preset.name);
  };

  // Compile on-the-fly parsed railroad node sequences
  const parsedResult = useMemo(() => {
    return parseRegexToNodes(pattern);
  }, [pattern]);

  // Compute live matches overlay inside the playground safely
  const matchResult = useMemo(() => {
    if (!pattern || !parsedResult.isValid) {
      return { html: testString, matchesCount: 0, groupsInfo: [] };
    }

    try {
      const startTime = performance.now();
      const safeFlags = flags.includes('g') ? flags : flags + 'g'; // Always use global flag internally for highlights
      const regexObj = new RegExp(pattern, safeFlags);
      
      let matchesCount = 0;
      let groupsInfo: { index: number; matchText: string; groups: (string | undefined)[] }[] = [];
      
      // Run match search
      const matches = Array.from(testString.matchAll(regexObj));
      matchesCount = matches.length;

      // Extract capture groups info
      matches.forEach((m, idx) => {
        if (idx < 20) { // Limit performance cost on complex matches
          groupsInfo.push({
            index: idx + 1,
            matchText: m[0],
            groups: m.slice(1)
          });
        }
      });

      // Simple HTML highlighter parser helper escaping HTML chars
      let highlightedHtml = '';
      let lastIndex = 0;
      
      // Reset index
      const highlightRegex = new RegExp(pattern, safeFlags);
      let match;
      let iterations = 0;

      while ((match = highlightRegex.exec(testString)) !== null && iterations < 150) {
        iterations++;
        const matchIndex = match.index;
        const matchText = match[0];

        // Append clean preceding text
        highlightedHtml += escapeHtml(testString.substring(lastIndex, matchIndex));

        // Append wrapped match tag
        highlightedHtml += `<span class="bg-emerald-500/25 border-b-2 border-emerald-400 text-emerald-100 px-0.5 rounded-sm font-semibold" title="Match #${iterations}: ${escapeHtml(matchText)}">${escapeHtml(matchText)}</span>`;

        lastIndex = highlightRegex.lastIndex;

        // Prevent infinite loops on empty regex matches (e.g. a*)
        if (match[0].length === 0) {
          highlightRegex.lastIndex++;
        }
      }

      // Remaining unmatched characters append
      highlightedHtml += escapeHtml(testString.substring(lastIndex));

      const duration = (performance.now() - startTime).toFixed(2);
      return {
        html: highlightedHtml,
        matchesCount,
        groupsInfo,
        duration
      };
    } catch (err) {
      return { html: escapeHtml(testString), matchesCount: 0, groupsInfo: [], error: String(err) };
    }
  }, [pattern, flags, testString, parsedResult.isValid]);

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br/>');
  }

  // Copy current active expression to clipboard
  const handleCopyRegex = () => {
    navigator.clipboard.writeText(`/${pattern}/${flags}`);
    setCopiedRegex(true);
    setTimeout(() => setCopiedRegex(false), 2000);
  };

  // Quick helper to choose coloring style based on node type
  const getNodeColorClasses = (type: RegexNode['type']) => {
    switch (type) {
      case 'anchor':
        return 'bg-pink-500/10 border-pink-500/40 text-pink-300';
      case 'literal':
        return 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300';
      case 'charClass':
        return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300';
      case 'whitespace':
        return 'bg-amber-500/10 border-amber-500/40 text-amber-300';
      case 'group':
        return 'bg-purple-500/5 border-purple-500/30 text-purple-300';
      case 'lookaround':
        return 'bg-cyan-500/5 border-cyan-500/35 border-dashed text-cyan-300';
      default:
        return 'bg-slate-800/80 border-slate-700 text-slate-300';
    }
  };

  // Render nodes list recursively for nested items inside railroad tracks
  const renderFlowchartNodes = (nodeList: RegexNode[]) => {
    if (nodeList.length === 0) {
      return (
        <div className="text-slate-500 font-mono text-[11px] py-2 px-3 italic">
          Empty track segment
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-3 py-1 relative">
        {nodeList.map((node, index) => {
          const colorClasses = getNodeColorClasses(node.type);
          const hasQuantifier = !!node.quantifier;

          return (
            <div
              key={node.id}
              className="relative flex items-center group/node"
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Left track line segment spacer */}
              {index > 0 && (
                <div className="w-3 h-0.5 bg-slate-700/60 shrink-0 self-center" />
              )}

              {/* Node content card wrapper */}
              <div
                className={`relative p-3 rounded-xl border-2 transition-all cursor-help select-none ${colorClasses} ${
                  hoveredNode?.id === node.id 
                    ? 'ring-2 ring-indigo-400 border-indigo-400 scale-[1.03] shadow-lg' 
                    : 'hover:border-slate-400'
                }`}
              >
                {/* Node category label */}
                <span className="block text-[8px] tracking-widest font-mono uppercase text-slate-400 mb-0.5">
                  {node.type === 'charClass' ? 'Character Set' : node.type}
                </span>

                {/* Main symbol or letters to look for */}
                <div className="font-mono text-sm font-bold flex items-center gap-1.5">
                  {node.raw.length > 25 ? `${node.raw.substring(0, 25)}...` : node.raw}
                </div>

                {/* Nested Group / Lookaround Sequence inside nested cards */}
                {(node.subNodes && node.subNodes.length > 0) && (
                  <div className="mt-2.5 p-2 bg-black/30 border border-white/5 rounded-lg space-y-1">
                    <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider mb-1.5 border-b border-white/5 pb-1">
                      {node.label} Inner Tracks:
                    </span>
                    {renderFlowchartNodes(node.subNodes)}
                  </div>
                )}

                {/* Alternation branches blocks split layout */}
                {node.branches && (
                  <div className="mt-2.5 space-y-2 border-l-2 border-indigo-500/20 pl-2">
                    <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">
                      Parallel Branches (OR Options):
                    </span>
                    <div className="space-y-2.5">
                      {node.branches.map((branch, bIdx) => (
                        <div key={bIdx} className="p-2 bg-black/20 rounded-lg border border-white/5 relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400/50 rounded-l" />
                          <div className="text-[8px] text-amber-300 font-mono mb-1 font-bold">BRANCH #{bIdx + 1}</div>
                          {renderFlowchartNodes(branch)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantifier loop decorator indicator badge */}
                {hasQuantifier && (
                  <div className="absolute -top-2.5 -right-2 bg-indigo-600 text-[9px] font-mono font-bold text-white px-2 py-0.5 rounded-full border border-indigo-400 flex items-center gap-0.5 shadow">
                    <span>↺</span> {node.quantifier?.raw}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-white pb-10" id="regex-flowchart-container">
      
      {/* Top Heading banner & active category status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
              SYNTAX ENGINE v2
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
              RAILROAD FLOWCHART
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Regex className="w-8 h-8 text-emerald-400" />
            Interactive Regex Flowchart &amp; Sandbox
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Build and visualizes any regular expression dynamically into a 2D sequential railroad track mapping capturing sets, alternates, and greedy repeat quantifiers.
          </p>
        </div>

        {/* Action presets loader dropdown selection */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Load Preset:
          </span>
          <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
            {REGEX_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => handleLoadPreset(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                  selectedPreset === p.name
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border-white/10'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main split grid workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="regex-grid-body">
        
        {/* LEFT COLUMN: REGEX COMPILED CONFIGURATIONS (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Regular Expression Input Panel */}
          <div className="bg-slate-900 border border-white/10 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Regular Expression
              </h3>
              <button
                onClick={handleCopyRegex}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition-colors bg-slate-800 px-2 py-1 rounded-lg border border-white/5"
              >
                {copiedRegex ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy /regex/
                  </>
                )}
              </button>
            </div>

            {/* Pattern input field row */}
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">Pattern String:</label>
              <div className="flex items-center bg-black/40 border border-white/10 rounded-xl focus-within:border-emerald-500 overflow-hidden px-3.5">
                <span className="text-slate-500 font-mono text-sm font-bold select-none mr-2">/</span>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => {
                    setPattern(e.target.value);
                    setSelectedPreset(''); // clear active preset highlight
                  }}
                  placeholder="e.g. ^[a-z]+$"
                  className="w-full bg-transparent border-0 font-mono text-sm text-emerald-300 py-3.5 focus:outline-none focus:ring-0 placeholder:text-slate-600"
                />
                <span className="text-slate-500 font-mono text-sm font-bold select-none ml-2">/</span>
                <input
                  type="text"
                  value={flags}
                  onChange={(e) => setFlags(e.target.value)}
                  placeholder="g"
                  className="w-10 bg-transparent border-0 text-center font-mono text-sm text-amber-400 py-3.5 focus:outline-none focus:ring-0"
                  title="Regex Flags (e.g., g, i, m)"
                />
              </div>
            </div>

            {/* Syntax Validation State Indicator */}
            {parsedResult.isValid ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3.5 py-2.5 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-semibold">Expression compiles successfully as RegExp</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 text-xs text-red-400 bg-red-500/10 px-3.5 py-2.5 rounded-xl border border-red-500/20">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-bold">Regex Syntax Error detected:</span>
                </div>
                <p className="font-mono text-[11px] text-red-300 pl-6 leading-relaxed bg-black/20 p-1.5 rounded">
                  {parsedResult.error}
                </p>
              </div>
            )}

            {/* Preset description label if loaded */}
            {selectedPreset && (
              <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Preset: {selectedPreset}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {REGEX_PRESETS.find(p => p.name === selectedPreset)?.description}
                </p>
              </div>
            )}
          </div>

          {/* NODE INSPECTOR HOVER COMPONENT CARD */}
          <div className="bg-slate-900 border border-white/10 p-5 rounded-2xl min-h-[180px] flex flex-col justify-between">
            <div>
              <div className="border-b border-white/5 pb-2.5 mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-400" />
                  Active Element Inspector
                </span>
                <span className="text-[10px] text-slate-500 font-mono">HOVER GRAPH</span>
              </div>

              {hoveredNode ? (
                <div className="space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {hoveredNode.type}
                    </span>
                    <span className="font-mono text-xs text-slate-400 font-bold">Raw: {hoveredNode.raw}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-white">
                      {hoveredNode.label}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {hoveredNode.description}
                    </p>
                  </div>

                  {hoveredNode.quantifier && (
                    <div className="mt-2.5 p-2 bg-indigo-500/5 rounded-lg border border-indigo-500/10 text-xs text-indigo-300 flex items-center gap-1.5 font-mono">
                      <span className="font-bold">Quantity Rule:</span>
                      <span>{hoveredNode.quantifier.label} ({hoveredNode.quantifier.raw})</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto">
                    Hover your mouse cursor over any card block element inside the 2D Sequential Flowchart to inspect full definitions, tokens, and logic.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-white/5 pt-3.5 text-[10px] text-slate-500 font-mono flex justify-between items-center">
              <span>Regex Flowchart v2.4</span>
              <span>Local client parser</span>
            </div>
          </div>

          {/* HELPFUL CHEAT SHEET BAR */}
          <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" /> Syntax Guide &amp; Token Cheats
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-white">^ / $</span>
                <span>Line start / end</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-white">\d / \D</span>
                <span>Digit / Non-digit</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-white">\w / \W</span>
                <span>Word / Non-word</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-white">\s / \S</span>
                <span>Space / Non-space</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-white">[a-z]</span>
                <span>Character range</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-white">(?:...)</span>
                <span>Non-capturing group</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-white">(?=...)</span>
                <span>Lookahead assertion</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-white">a|b</span>
                <span>Alternation option</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SEQUENTIAL FLOWCHART DIAGRAM & INTERACTIVE MATCHER (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* FLOWCHART RAILROAD DIAGRAM WORKSPACE */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col min-h-[300px]">
            
            {/* Diagram header bar */}
            <div className="bg-slate-950 px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                  2D Railroad Diagram Track Mapping
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-bold">
                <span>⚡ Sequential</span>
              </div>
            </div>

            {/* Diagram Stage Canvas Area */}
            <div className="p-6 overflow-x-auto relative bg-[#0b0f19] flex-1 flex items-center min-h-[220px]" id="railroad-stage-box">
              
              {/* Railroad background horizontal lines running across the stage */}
              <div className="absolute left-0 right-0 h-1 bg-slate-800/80 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/20 via-indigo-500/20 to-pink-500/20 top-1/2 transform -translate-y-1/2 pointer-events-none" />

              <div className="relative z-10 flex items-center gap-3 w-full pr-10">
                
                {/* Starting Anchor Circle */}
                <div className="flex items-center shrink-0">
                  <div className="w-7 h-7 rounded-full bg-slate-950 border-4 border-emerald-400 flex items-center justify-center font-mono text-[9px] font-extrabold text-emerald-400 shrink-0 shadow-lg">
                    IN
                  </div>
                  <div className="w-4 h-0.5 bg-slate-700 shrink-0" />
                </div>

                {/* Recursively compile mapped sequence flowcards */}
                {parsedResult.nodes.length > 0 ? (
                  renderFlowchartNodes(parsedResult.nodes)
                ) : (
                  <div className="text-slate-400 font-sans text-xs italic py-4 bg-slate-950/40 px-6 rounded-xl border border-white/5">
                    {pattern ? 'Parsing syntax...' : 'Please input a regular expression pattern to visualize.'}
                  </div>
                )}

                {/* Ending Anchor Circle */}
                <div className="flex items-center shrink-0">
                  <div className="w-4 h-0.5 bg-slate-700 shrink-0" />
                  <div className="w-7 h-7 rounded-full bg-slate-950 border-4 border-pink-400 flex items-center justify-center font-mono text-[9px] font-extrabold text-pink-400 shrink-0 shadow-lg">
                    OUT
                  </div>
                </div>

              </div>

            </div>

            <div className="bg-slate-950/80 px-4 py-2 border-t border-white/5 text-[10px] text-slate-500 flex justify-between items-center font-mono">
              <span>Track evaluation order: Left to Right</span>
              <span>Double lines indicate branch alternate selections</span>
            </div>
          </div>

          {/* INTERACTIVE PLAYGROUND MATCHING SANDBOX */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                    Sandbox Tester &amp; Matches Highlights
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Verify expression compatibility instantly against live test strings.
                  </p>
                </div>
              </div>

              {/* Match speed indicators */}
              <div className="flex gap-2 text-[10px] font-mono shrink-0">
                <div className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-1 rounded">
                  Matches: <span className="font-bold">{matchResult.matchesCount}</span>
                </div>
                {matchResult.duration && (
                  <div className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded">
                    Engine time: <span className="font-bold">{matchResult.duration}ms</span>
                  </div>
                )}
              </div>
            </div>

            {/* Twin editable area and highlighter container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Editable input test strings */}
              <div className="space-y-1.5">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Test Text Input:</span>
                <textarea
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  placeholder="Type sample text here to test your regex..."
                  className="w-full h-[180px] bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 resize-none scrollbar-thin"
                />
              </div>

              {/* Dynamic Live Highlights Window (Read-only styled overlay matches) */}
              <div className="space-y-1.5 flex flex-col">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Matches Highlight Preview:</span>
                <div
                  className="w-full h-[180px] bg-slate-950/80 border border-white/5 rounded-xl p-3 text-xs font-mono overflow-y-auto whitespace-pre-wrap leading-relaxed select-all scrollbar-thin text-slate-300"
                  dangerouslySetInnerHTML={{ __html: matchResult.html }}
                  title="HTML Matcher highlight overlay"
                />
              </div>

            </div>

            {/* CAPTURE GROUPS INSPECTOR SUB-PANEL */}
            {matchResult.groupsInfo.length > 0 && (
              <div className="bg-slate-950/60 rounded-xl p-4 border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-400" /> Capture Groups Evaluator (Matches)
                  </h5>
                  <span className="text-[10px] text-slate-500 font-mono">Showing first 20 matches</span>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
                  {matchResult.groupsInfo.map((m) => (
                    <div key={m.index} className="bg-slate-900 p-2.5 rounded-lg border border-white/5 text-xs flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-1">
                        <span className="text-emerald-400 font-bold">Match #{m.index}</span>
                        <span className="text-slate-500">Val: "{m.matchText}"</span>
                      </div>
                      
                      {m.groups.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px] pt-1">
                          {m.groups.map((grp, grpIdx) => (
                            <div key={grpIdx} className="flex justify-between bg-black/30 px-2 py-0.5 rounded border border-white/5">
                              <span className="text-slate-400">Group ${grpIdx + 1}:</span>
                              <span className="text-indigo-300 font-bold truncate max-w-[120px]" title={grp || 'undefined'}>
                                {grp !== undefined ? `"${grp}"` : 'null'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono italic">No capture group parenthesis in pattern</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive tips notice */}
            <div className="flex items-start gap-2.5 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-xs text-emerald-300">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Playground Tip:</span> Use the multiline flag (<span className="font-mono text-white bg-black/40 px-1 py-0.5 rounded">m</span>) to test regex against individual lines in the text box. The global (<span className="font-mono text-white bg-black/40 px-1 py-0.5 rounded">g</span>) flag is active by default to find all occurrences.
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Google AdSense Compliant Informational Article & FAQs Footer */}
      <div className="border-t border-zinc-900 pt-12 mt-12 space-y-10 text-left">
        
        {/* Editorial Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Developer Guide: Regular Expressions & Visualization</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight sm:text-2xl">
            A Comprehensive Deep Dive into Regular Expressions & Railroad Flowcharts
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-3xl">
            Struggling to decode complicated regular expression strings like email validators or lookahead strength checkers? Learn how our interactive 2D railroad flowchart breaks down token paths step-by-step to reveal the underlying matching logic.
          </p>
        </div>

        {/* 2-Column Article Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Article Column 1 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-emerald-500 font-mono">01.</span>
                What are Regular Expressions (Regex)?
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Regular Expressions, commonly referred to as **Regex**, are highly dense sequences of characters that define specific search patterns. They are widely used in modern software applications for validation (e.g. checking if an input matches an email structure), searching, and replacing sub-strings inside complex files.
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Because regex utilizes specialized symbolic characters (such as brackets, anchors, and quantifiers), long patterns quickly become unreadable. Visualizing these streams as physical tracks makes editing and debugging simple.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-emerald-500 font-mono">02.</span>
                The Power of Railroad Flowchart Visualization
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                A **railroad diagram** is a graphical representation of a context-free grammar. In this representation, the regex compiler maps character classes, literals, and anchors onto a 2D track going from left (IN) to right (OUT).
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Branching paths indicate alternations (using the pipe <code>|</code> operator), and loops denote quantifiers (such as <code>*</code>, <code>+</code>, or custom range loops). This structure helps you trace the exact path the regex engine travels to find matches.
              </p>
            </div>
          </div>

          {/* Article Column 2 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-emerald-500 font-mono">03.</span>
                Demystifying Assertions & Lookarounds
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                One of the most complex chapters in regex development is lookaround assertions:
              </p>
              <ul className="space-y-2 text-zinc-400 text-xs pl-4 list-disc">
                <li><strong className="text-zinc-200">Lookahead (Positive/Negative):</strong> Instructs the regex engine to peek forward to verify if a pattern succeeds or fails, without consuming any characters in the text stream.</li>
                <li><strong className="text-zinc-200">Lookbehind:</strong> Inspects preceding characters behind the current position pointer.</li>
                <li><strong className="text-zinc-200">Word Boundaries (\b):</strong> Asserts a position where a letter-character meets a non-letter, helping you isolate full words.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span className="text-emerald-500 font-mono">04.</span>
                How to Debug Patterns Step-by-Step
              </h4>
              <ol className="space-y-1.5 text-zinc-400 text-xs pl-4 list-decimal">
                <li>Select one of our preset templates (Email, US Phone, Password strength) to see a sample track.</li>
                <li>Observe how character ranges, literal sequences, and loops are grouped into custom-styled cards.</li>
                <li>Hover over any diagram block to view its grammatical rules, raw code, and technical definitions in the sidebar.</li>
                <li>Type test paragraphs inside the "Sandbox Tester" to verify match groups, boundaries, and timings in real-time.</li>
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
            <p className="text-zinc-500 text-xs">Got questions about regex mechanics and compiling rules? Read on.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                What is the difference between greedy and lazy quantifiers?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                By default, quantifiers like <code>+</code> or <code>*</code> are "greedy"—they match as much text as possible. Adding a trailing question mark (e.g. <code>+?</code> or <code>*?</code>) makes them "lazy," causing them to match as little text as possible before succeeding.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Why does this flowchart run client-side inside my browser?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                By compiling your regular expressions and testing matches inside the browser's sandbox runtime, we protect your input logs from remote database storage or tracking, assuring total safety for corporate or clinical logs.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                What do the colors of the flowchart boxes represent?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                To simplify visual navigation, green cards represent character classes (e.g. <code>\d</code> or ranges), purple/cyan indicate groups and lookarounds, yellow blocks show whitespace tokens, and blue outlines represent literals.
              </p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-1.5">
              <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Can I export or share these regular expressions easily?
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Yes! Click the "Copy /regex/" button to save the entire escaped pattern with flags, ready to paste directly into your JavaScript, Python, or Go source code files.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Regex,
  Check,
  Copy,
  Info,
  Sliders,
  Settings,
  HelpCircle,
  FileCode,
  Sparkles,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Code2,
  Bookmark,
  Layers,
  ChevronRight,
  Eye,
  Type
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Standard definitions for common Regex patterns
interface CommonPattern {
  name: string;
  category: string;
  pattern: string;
  flags: string;
  testString: string;
  description: string;
}

const COMMON_PATTERNS: CommonPattern[] = [
  {
    name: 'Email Address',
    category: 'Validation',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    flags: 'g',
    testString: 'john.doe@company.com\ninvalid-email@domain\nsupport+ticketing@sub.office.co.uk\nhello_world.123@gmail.org',
    description: 'Validates standard internet email addresses complying with common domains and subdomains.'
  },
  {
    name: 'URL Parser',
    category: 'Validation',
    pattern: 'https?:\\/\\/(www\\.)?([a-zA-Z0-9-]+)\\.([a-zA-Z]{2,})([^\\s\\?\\#]+)?(\\?[^\\s\\#]+)?',
    flags: 'gi',
    testString: 'Check these sites: https://www.google.com and http://github.com/trending/weekly?lang=ts for excellent open-source resources.',
    description: 'Extracts website protocols, host domains, URL folders and query string parameter segments.'
  },
  {
    name: 'Phone Number (International)',
    category: 'Validation',
    pattern: '\\+?\\(?\\d{1,4}\\)?[-\\s.]?\\d{1,4}[-\\s.]?\\d{1,4}[-\\s.]?\\d{1,9}',
    flags: 'g',
    testString: 'Office hotline: +1 (555) 019-2834\nWhatsApp contact: +44 20 7946 0192\nAlternative: 555.234.9876',
    description: 'Matches international and localized phone digits with varying separators and country prefixes.'
  },
  {
    name: 'IPv4 Address',
    category: 'Network',
    pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    flags: 'g',
    testString: 'Connecting from standard gateway 192.168.1.1 or database node 10.0.0.12. Testing loopback at 127.0.0.1 and broadcast 255.255.255.255.',
    description: 'Matches four dot-separated decimal integers ranging strictly between 0 and 255.'
  },
  {
    name: 'Date (YYYY-MM-DD)',
    category: 'Formatting',
    pattern: '\\b(?:\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b',
    flags: 'g',
    testString: 'Standard ISO: 2026-06-15. Incorrect values like 2023-14-35 or format like 25/12/2022 should be excluded.',
    description: 'Matches YYYY-MM-DD ISO format, capturing months (1-12) and days (1-31) separately.'
  },
  {
    name: 'Hex Color Value',
    category: 'Web Design',
    pattern: '#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b',
    flags: 'g',
    testString: 'Using styles with color: #ffffff; background: #3b82f6; borders at #ef444455; or low-res: #abc;',
    description: 'Validates css hex values of lengths 3, 4, 6 or 8 including alpha hex transparency channels.'
  },
  {
    name: 'HTML/XML Tags',
    category: 'Web Design',
    pattern: '<\\/?([a-zA-Z1-6]+)(?:\\s+[^>]*)?>',
    flags: 'g',
    testString: '<div id="container-section" class="flex p-4">\n  <h1 className="text-xl">Regex Lab</h1>\n  <p>Offline testing tools for markup elements</p>\n</div>',
    description: 'Matches open and closing markup tags with embedded custom parameters tags.'
  },
  {
    name: 'Credit Card Numbers',
    category: 'Validation',
    pattern: '\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b',
    flags: 'g',
    testString: 'Visa standard format: 4111 2222 3333 4444\nMastercard format: 5500-1111-2222-3333\nPlain syntax: 1234567812345678',
    description: 'Identifies standard 16-digit credit card arrays with custom dash or space delimiters.'
  }
];

const CHEATSHEET_ITEMS = [
  { Token: '\\d', Meaning: 'Any digit / number group (0-9)' },
  { Token: '\\w', Meaning: 'Alphanumeric character [a-zA-Z0-9_]' },
  { Token: '\\s', Meaning: 'Whitespace character (spaces, tabs, newlines)' },
  { Token: '.', Meaning: 'Any single character except newline' },
  { Token: '^', Meaning: 'Start of a line / string boundary' },
  { Token: '$', Meaning: 'End of a line / string boundary' },
  { Token: '\\b', Meaning: 'Word boundary boundary match' },
  { Token: '[a-z]', Meaning: 'Character class from lower a to z' },
  { Token: '[^abc]', Meaning: 'Negated character class (not a, b or c)' },
  { Token: '*', Meaning: 'Greedy match 0 or more occurrences' },
  { Token: '+', Meaning: 'Greedy match 1 or more occurrences' },
  { Token: '?', Meaning: 'Match optional / lazy qualifier' },
  { Token: '{n,m}', Meaning: 'Matches between n and m repetitions' },
  { Token: '(...)', Meaning: 'Capture group for nesting segments' },
  { Token: '(?:...)', Meaning: 'Non-matching capture segment group' },
  { Token: 'a|b', Meaning: 'Logical alternation match (a OR b)' }
];

export default function RegexTester() {
  const { t } = useLanguage();

  // Pattern input state
  const [regexPattern, setRegexPattern] = useState<string>('https?:\\/\\/(www\\.)?([a-zA-Z0-9-]+)\\.([a-zA-Z]{2,})');
  const [testString, setTestString] = useState<string>(
    `Explore standard resources at https://google.com or checkout the Git repo at http://www.github.com/apex-suite to begin.`
  );

  // Filter Active Categories
  const [selectedPatternCategory, setSelectedPatternCategory] = useState<string>('Validation');

  // Flag State toggles
  const [flags, setFlags] = useState({
    g: true,  // global
    i: true,  // case-insensitive
    m: false, // multiline
    s: false, // single-line (dotAll)
    u: false  // unicode
  });

  // UX feedbacks
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCodeLang, setActiveCodeLang] = useState<string>('js');
  const [cheatsheetSearch, setCheatsheetSearch] = useState<string>('');

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Compile full flag string
  const getFlagString = () => {
    let f = '';
    if (flags.g) f += 'g';
    if (flags.i) f += 'i';
    if (flags.m) f += 'm';
    if (flags.s) f += 's';
    if (flags.u) f += 'u';
    return f;
  };

  // Compute matches and capture groups safely
  const regexComputation = useMemo(() => {
    if (!regexPattern) {
      return {
        isValid: true,
        error: null as string | null,
        matches: [] as { index: number; length: number; value: string; groups: (string | undefined)[] }[],
        timeTakenMs: 0
      };
    }

    const flagStr = getFlagString();
    const startTime = performance.now();

    try {
      // Build regular expression safely
      const compiledRegex = new RegExp(regexPattern, flagStr);
      const matches: { index: number; length: number; value: string; groups: (string | undefined)[] }[] = [];

      // Avoid infinite loop if Regex matches empty string
      const isGlobal = flagStr.includes('g');

      if (isGlobal) {
        let match;
        // Keep a counter to avoid catastrophic infinite loops
        let iterations = 0;
        const maxIterations = 20000;

        while ((match = compiledRegex.exec(testString)) !== null && iterations < maxIterations) {
          matches.push({
            index: match.index,
            length: match[0].length,
            value: match[0],
            groups: match.slice(1) // Capture subgroups indices
          });
          
          iterations++;
          // If regex matched empty string, advance manually to prevent infinite loop
          if (match[0].length === 0) {
            compiledRegex.lastIndex++;
          }
        }
      } else {
        const match = compiledRegex.exec(testString);
        if (match) {
          matches.push({
            index: match.index,
            length: match[0].length,
            value: match[0],
            groups: match.slice(1)
          });
        }
      }

      const endTime = performance.now();

      return {
        isValid: true,
        error: null,
        matches,
        timeTakenMs: parseFloat((endTime - startTime).toFixed(3))
      };

    } catch (err: any) {
      return {
        isValid: false,
        error: err.message || 'Syntax pattern error.',
        matches: [],
        timeTakenMs: 0
      };
    }
  }, [regexPattern, testString, flags]);

  // Generate Explainer text deterministically based on patterns found in regexPattern
  const explanationPoints = useMemo(() => {
    if (!regexPattern) return ['Empty pattern. Insert a expression value to proceed.'];
    const p = regexPattern;
    const bullets: string[] = [];

    // Analyze pattern segments
    if (p.startsWith('^')) bullets.push('Starts matching strictly at the beginning of a line boundary.');
    if (p.endsWith('$')) bullets.push('Ends matching strictly at the end of a line boundary.');
    if (p.includes('\\d')) bullets.push('Looks for any digit character class from value range 0 to 9.');
    if (p.includes('\\w')) bullets.push('Scans for alphabetical letters, numerical digits, or underscore symbols (_)');
    if (p.includes('\\s')) bullets.push('Matches space bars, horizontal tab breaks, page separators or terminal new lines.');
    if (p.includes('[0-9]')) bullets.push('Requires explicit numbers falling inside the 0-9 boundary index.');
    if (p.includes('[a-z]')) bullets.push('Checks for lowercase letters from starting "a" through ending "z".');
    if (p.includes('[A-Z]')) bullets.push('Checks for uppercase capital characters starting "A" through ending "Z".');
    if (p.includes('\\b')) bullets.push('Checks word boundaries boundary limit positions (e.g. whitespace to letters).');
    if (p.includes('+')) bullets.push('Evaluates repeating patterns appearing one or more times (greedy matches).');
    if (p.includes('*')) bullets.push('Evaluates repeating patterns appearing zero or more times (greedy matches).');
    if (p.includes('?')) bullets.push('Marks preceding group symbols or match terms as optional or lazily evaluated.');
    if (p.includes('|')) bullets.push('Utilizes alternating logic OR queries (for example: match side A left or side B right).');
    if (p.includes('(') && p.includes(')')) bullets.push('Segments captured subvalues in separated Capture Groups arrays.');
    if (p.includes('{') && p.includes('}')) bullets.push('Specifies strict limit conditions of repetitions required for acceptance.');

    if (bullets.length === 0) {
      bullets.push('Performs a literal textual scanning query based on matching character inputs specified directly.');
    }

    return bullets;
  }, [regexPattern]);

  // Load a Common Pre-filled template
  const loadPattern = (item: CommonPattern) => {
    setRegexPattern(item.pattern);
    setTestString(item.testString);
    
    // Parse flags out
    setFlags({
      g: item.flags.includes('g'),
      i: item.flags.includes('i'),
      m: item.flags.includes('m'),
      s: item.flags.includes('s'),
      u: item.flags.includes('u')
    });
  };

  // Generate Developer Integrations Code
  const generatedSnippet = useMemo(() => {
    const rawPattern = regexPattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const flagString = getFlagString();

    switch (activeCodeLang) {
      case 'js':
        return `// JavaScript / TypeScript Regex Implementation
const pattern = /${regexPattern}/${flagString};
const testString = \`${testString.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;

// 1. Check validation boolean
const isValid = pattern.test(testString);
console.log("Match Found:", isValid);

// 2. Fetch matches or Capture Groups
let match;
while ((match = pattern.exec(testString)) !== null) {
  console.log(\`Matched value: \${match[0]} at index \${match.index}\`);
  match.forEach((subGroup, index) => {
    console.log(\`   Group \${index}: \${subGroup}\`);
  });
}`;
      
      case 'python':
        return `# Python Regex Implementation
import re

pattern = r"${regexPattern}"
flags = 0
${flags.i ? 'flags |= re.IGNORECASE' : ''}
${flags.m ? 'flags |= re.MULTILINE' : ''}
${flags.s ? 'flags |= re.DOTALL' : ''}

test_string = """${testString.replace(/"""/g, '\\"""')}"""

# Find all matches
matches = re.finditer(pattern, test_string, flags=flags)

for item in matches:
    print(f"Match: {item.group(0)} at position {item.start()}")
    for idx, group in enumerate(item.groups(), start=1):
        print(f"  Group {idx}: {group}")`;

      case 'python-simple':
        return `import re
# Check if match exists anywhere
if re.search(r"${regexPattern}", text):
    print("Pattern matched!")`;

      case 'php':
        return `<?php
// PHP Regex Engine Implementation
$pattern = '/${regexPattern.replace(/\//g, '\\/')}/${flagString}';
$testString = "${testString.replace(/"/g, '\\"')}";

if (preg_match_all($pattern, $testString, $matches, PREG_OFFSET_CAPTURE)) {
    echo "Total Matches found: " . count($matches[0]) . "\\n";
    foreach ($matches[0] as $index => $match) {
        echo "Match: " . $match[0] . " at index " . $match[1] . "\\n";
    }
}`;

      case 'go':
        return `package main

import (
	"fmt"
	"regexp"
)

func main() {
	// Note: Go regex engine uses RE2 which does not support backreferences or lookaheads
	regexStr := \`${regexPattern}\`
	testString := \`${testString}\`

	re, err := regexp.Compile(regexStr)
	if err != nil {
		fmt.Println("Error compiling regex:", err)
		return
	}

	// Find matches
	matches := re.FindAllStringSubmatch(testString, -1)
	for i, match := range matches {
		fmt.Printf("Match %d: %s\\n", i+1, match[0])
		for j, group := range match[1:] {
			fmt.Printf("  Group %d: %s\\n", j+1, group)
		}
	}
}`;

      default:
        return '';
    }
  }, [regexPattern, flags, testString, activeCodeLang]);

  // Highlight Text matches beautifully
  // We can render a stylized preview where matched terms are highlighted
  const highlightedPreview = useMemo(() => {
    if (!testString) return <span className="text-gray-500 italic">No testing string input provided.</span>;
    if (!regexPattern || !regexComputation.isValid || regexComputation.matches.length === 0) {
      return <span>{testString}</span>;
    }

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Filter overlapping or zero-length matches, and sort by offset index
    const sortedMatches = [...regexComputation.matches]
      .filter(m => m.length > 0)
      .sort((a, b) => a.index - b.index);

    let matchCount = 0;

    for (const match of sortedMatches) {
      // If we skipped parts or matched overlap, resolve index boundaries
      if (match.index < lastIndex) continue;

      // Add pre-match content
      if (match.index > lastIndex) {
        elements.push(testString.substring(lastIndex, match.index));
      }

      // Add match with custom visual color scheme representation
      const hueIndex = (matchCount % 4);
      let borderStyle = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      if (hueIndex === 1) borderStyle = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
      if (hueIndex === 2) borderStyle = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      if (hueIndex === 3) borderStyle = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';

      elements.push(
        <span 
          key={`match-${match.index}-${matchCount}`}
          className={`inline-block px-1 border rounded font-mono select-all transition relative group ${borderStyle}`}
          title={`Match #${matchCount + 1}\nOffset index: ${match.index}-${match.index + match.length}`}
        >
          {match.value}
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-[#12131a] text-gray-300 font-mono text-[9px] px-1 py-0.5 rounded border border-brand-border/80 z-25 transition-transform origin-bottom block whitespace-nowrap shadow-xl pointer-events-none">
            M#{matchCount + 1} ({match.length}ch)
          </span>
        </span>
      );

      lastIndex = match.index + match.length;
      matchCount++;
    }

    // Add trailing content
    if (lastIndex < testString.length) {
      elements.push(testString.substring(lastIndex));
    }

    return elements;
  }, [testString, regexPattern, regexComputation]);

  // Filtered Cheatsheet tokens
  const filteredCheatsheet = useMemo(() => {
    if (!cheatsheetSearch.trim()) return CHEATSHEET_ITEMS;
    const query = cheatsheetSearch.toLowerCase();
    return CHEATSHEET_ITEMS.filter(
      item => item.Token.toLowerCase().includes(query) || item.Meaning.toLowerCase().includes(query)
    );
  }, [cheatsheetSearch]);

  // Insert token helper in regex
  const insertToken = (token: string) => {
    setRegexPattern(prev => prev + token);
  };

  return (
    <div id="regex-tester-container" className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-brand-border/30">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 shadow-lg shadow-rose-500/5">
              <Regex className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-rose-400 tracking-widest block uppercase">Apex Signals Studio</span>
              <h1 className="text-3xl font-sans font-medium tracking-tight text-white mb-1">{t.navigation.regexTester}</h1>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2 max-w-xl">
            {t.navigation.regexTesterDesc}
          </p>
        </div>

        {/* Quick Diagnostic Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 bg-[#0c0d12]/80 border border-brand-border/40 rounded-xl flex items-center gap-2.5 shadow">
            <div className={`w-2 h-2 rounded-full ${regexComputation.isValid ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500 shadow-[0_0_8px_#ef4444]'}`} />
            <div className="font-mono text-xs">
              <span className="text-gray-500 uppercase font-bold block text-[10px]">Syntax Status</span>
              <span className={regexComputation.isValid ? 'text-emerald-400' : 'text-rose-400 font-semibold'}>
                {regexComputation.isValid ? 'VALID EXPR' : 'PATTERN ERROR'}
              </span>
            </div>
          </div>

          <div className="px-4 py-2 bg-[#0c0d12]/80 border border-brand-border/40 rounded-xl flex items-center gap-2.5 shadow">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            <div className="font-mono text-xs">
              <span className="text-gray-500 uppercase font-bold block text-[10px]">Total Matches</span>
              <span className="text-white font-medium">{regexComputation.matches.length} matches</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Editor Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Regex input, flags, presets, charts (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Pattern Builder Card */}
          <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-2xl">
            
            <div className="flex justify-between items-center pb-2 border-b border-brand-border/20">
              <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">Regular Expression Pattern</span>
              <span className="text-xs font-mono text-gray-500">PCRE / JS Flavors</span>
            </div>

            {/* Main regex input section */}
            <div className="space-y-4">
              <div className="flex items-center bg-[#07080b] border border-brand-border/50 focus-within:border-rose-500/50 rounded-xl px-4 py-2 transition-all shadow-inner relative">
                <span className="text-gray-500 font-mono text-lg select-none mr-2">/</span>
                
                <label htmlFor="in-regex-pattern" className="sr-only">Type Regular Expression Pattern</label>
                <input 
                  id="in-regex-pattern"
                  type="text"
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  placeholder="Insert pattern code here... (e.g. [a-z0-9]+)"
                  className="w-full bg-transparent focus:outline-none text-rose-300 font-mono text-sm leading-relaxed tracking-wide placeholder-gray-600 block min-w-0"
                />
                
                <span className="text-gray-500 font-mono text-lg select-none ml-2">/</span>
                <span className="text-rose-400 font-mono text-sm ml-1 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">
                  {getFlagString() || 'none'}
                </span>
              </div>

              {/* Error explanation banner */}
              {!regexComputation.isValid && regexComputation.error && (
                <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex gap-2.5 font-mono">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-bold">Regex Syntax Error:</span>
                    <span className="text-zinc-300 mt-1 block">{regexComputation.error}</span>
                  </div>
                </div>
              )}

              {/* Flag details switcher array */}
              <div className="bg-brand-surface/30 border border-brand-border/30 rounded-xl p-3.5 space-y-3">
                <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase block">Regular Expression Expression Flags</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <label id="lbl-flag-g" className={`flex flex-col p-2 border rounded-xl cursor-pointer select-none text-center transition ${flags.g ? 'border-rose-500/30 bg-rose-500/[0.04] text-rose-400' : 'border-brand-border/40 text-gray-400 hover:border-brand-border hover:bg-brand-surface/60'}`}>
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={flags.g} 
                      aria-labelledby="lbl-flag-g"
                      onChange={() => setFlags(f => ({ ...f, g: !f.g }))}
                    />
                    <span className="text-xs font-mono font-bold block">/g</span>
                    <span className="text-[9px] text-gray-500 mt-1">Global flag</span>
                  </label>

                  <label id="lbl-flag-i" className={`flex flex-col p-2 border rounded-xl cursor-pointer select-none text-center transition ${flags.i ? 'border-rose-500/30 bg-rose-500/[0.04] text-rose-400' : 'border-brand-border/40 text-gray-400 hover:border-brand-border hover:bg-brand-surface/60'}`}>
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={flags.i} 
                      aria-labelledby="lbl-flag-i"
                      onChange={() => setFlags(f => ({ ...f, i: !f.i }))}
                    />
                    <span className="text-xs font-mono font-bold block">/i</span>
                    <span className="text-[9px] text-gray-500 mt-1">Ignore Case</span>
                  </label>

                  <label id="lbl-flag-m" className={`flex flex-col p-2 border rounded-xl cursor-pointer select-none text-center transition ${flags.m ? 'border-rose-500/30 bg-rose-500/[0.04] text-rose-400' : 'border-brand-border/40 text-gray-400 hover:border-brand-border hover:bg-brand-surface/60'}`}>
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={flags.m} 
                      aria-labelledby="lbl-flag-m"
                      onChange={() => setFlags(f => ({ ...f, m: !f.m }))}
                    />
                    <span className="text-xs font-mono font-bold block">/m</span>
                    <span className="text-[9px] text-gray-500 mt-1">Multiline</span>
                  </label>

                  <label id="lbl-flag-s" className={`flex flex-col p-2 border rounded-xl cursor-pointer select-none text-center transition ${flags.s ? 'border-rose-500/30 bg-rose-500/[0.04] text-rose-400' : 'border-brand-border/40 text-gray-400 hover:border-brand-border hover:bg-brand-surface/60'}`}>
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={flags.s} 
                      aria-labelledby="lbl-flag-s"
                      onChange={() => setFlags(f => ({ ...f, s: !f.s }))}
                    />
                    <span className="text-xs font-mono font-bold block">/s</span>
                    <span className="text-[9px] text-gray-500 mt-1">Single Line</span>
                  </label>

                  <label id="lbl-flag-u" className={`flex flex-col p-2 border rounded-xl cursor-pointer select-none text-center transition ${flags.u ? 'border-rose-500/30 bg-rose-500/[0.04] text-rose-400' : 'border-brand-border/40 text-gray-400 hover:border-brand-border hover:bg-brand-surface/60'}`}>
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      aria-labelledby="lbl-flag-u"
                      checked={flags.u} 
                      onChange={() => setFlags(f => ({ ...f, u: !f.u }))}
                    />
                    <span className="text-xs font-mono font-bold block">/u</span>
                    <span className="text-[9px] text-gray-500 mt-1">Unicode</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Common Presets / Library Block */}
          <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-xl">
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-2 border-b border-brand-border/20">
              <span className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-rose-400" />
                Common Patterns Library
              </span>

              {/* Categorization controls */}
              <div className="flex gap-1 bg-brand-surface border border-brand-border/40 p-0.5 rounded-lg">
                {['Validation', 'Network', 'Formatting', 'Web Design'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedPatternCategory(cat)}
                    className={`px-2.5 py-1 text-[10px] font-mono rounded transition ${
                      selectedPatternCategory === cat 
                        ? 'bg-[#12131a] border border-brand-border/40 text-rose-400 shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COMMON_PATTERNS.filter(p => p.category === selectedPatternCategory).map((item) => (
                <div 
                  key={item.name}
                  onClick={() => loadPattern(item)}
                  className="p-3 bg-brand-surface/40 hover:bg-brand-surface/80 border border-brand-border/30 hover:border-rose-500/30 rounded-xl cursor-pointer transition flex flex-col justify-between group h-[115px]"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-medium text-white group-hover:text-rose-300 transition shrink-0">{item.name}</span>
                      <span className="text-[9px] font-mono text-gray-500 uppercase border border-brand-border/30 px-1 py-0.2 rounded shrink-0">
                        /{item.flags}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 leading-snug line-clamp-2">{item.description}</p>
                  </div>
                  
                  <div className="text-[9px] font-mono text-cyan-400 bg-cyan-500/5 border border-cyan-500/10 px-2 py-0.5 rounded truncate select-all">
                    {item.pattern}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Regex Explainer block */}
          <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-xl">
            
            <div className="flex justify-between items-center pb-2 border-b border-brand-border/20">
              <span className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                Regex Logic Explainer
              </span>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                Dynamic Analysis
              </span>
            </div>

            <div className="space-y-2.5">
              {explanationPoints.map((point, index) => (
                <div key={index} className="flex gap-2.5 items-start text-xs text-gray-300 leading-relaxed">
                  <div className="p-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded mt-0.5 shrink-0">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right column: Test String Input, Match Highlighter, Groups layout (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Test String Input Area */}
          <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-2xl">
            
            <div className="flex justify-between items-center pb-2 border-b border-brand-border/20">
              <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">Test Sample Content</span>
              <div className="text-xs font-mono text-gray-500 uppercase flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-gray-500" />
                Size: {testString.length} chars
              </div>
            </div>

            <div className="relative">
              <label htmlFor="tx-test-input-string" className="sr-only">Test input string</label>
              <textarea 
                id="tx-test-input-string"
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="Insert test characters or sentences here to analyze search match outlines..."
                className="w-full bg-[#07080b] border border-brand-border/50 focus:border-rose-500/50 rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-rose-500/20 font-mono resize-none h-[180px] leading-relaxed"
              />
              {testString && (
                <button 
                  onClick={() => setTestString('')}
                  className="absolute right-3 top-3 p-1.5 bg-brand-surface/80 border border-brand-border/40 rounded-lg text-gray-400 hover:text-rose-400 transition"
                  title="Clear playground"
                >
                  <Trash2Icon />
                </button>
              )}
            </div>
          </div>

          {/* Render real-time highlighted Matches box */}
          <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-2xl">
            
            <div className="flex justify-between items-center pb-2 border-b border-brand-border/20">
              <span className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-rose-400" />
                Highlighted Match Preview
              </span>
              
              <span className="text-[10px] font-mono text-gray-500">
                Processed in {regexComputation.timeTakenMs}ms
              </span>
            </div>

            <div className="w-full bg-[#050608] border border-brand-border/30 rounded-xl p-4 text-sm text-gray-300 font-mono h-[200px] overflow-y-auto whitespace-pre-wrap break-all leading-relaxed relative selection:bg-rose-500/20 select-text">
              {highlightedPreview}
            </div>
          </div>

          {/* Group Capture & Details Accordion/List */}
          <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-xl">
            
            <div className="flex justify-between items-center pb-2 border-b border-brand-border/20">
              <span className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-rose-400" />
                Capture Group Diagnosers
              </span>
              
              <span className="text-[10px] font-mono text-cyan-400 border border-cyan-500/20 bg-cyan-500/10 rounded px-1.5 py-0.5">
                {regexComputation.matches.length} matches detected
              </span>
            </div>

            {/* If no matches */}
            {regexComputation.matches.length === 0 ? (
              <div className="text-center py-6 border border-brand-border/20 border-dashed rounded-xl">
                <HelpCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-mono">No matching groups found inside testing string.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {regexComputation.matches.map((item, index) => (
                  <div key={index} className="p-3 bg-brand-surface/40 border border-brand-border/30 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs border-b border-brand-border/10 pb-1.5">
                      <span className="font-mono text-rose-400 font-bold">Match #{index + 1}</span>
                      <span className="font-mono text-gray-500 text-[10px]">
                        Offset index: {item.index} – {item.index + item.length}
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-xs">
                      {/* Full match $0 */}
                      <div className="flex gap-2 items-start justify-between py-1 border-b border-brand-border/10">
                        <span className="text-emerald-400 text-[11px] font-bold shrink-0">$0 (Full):</span>
                        <span className="text-white text-right truncate pl-4 select-all" title={item.value}>{item.value}</span>
                      </div>

                      {/* Display captured sub-groups if any */}
                      {item.groups.length > 0 ? (
                        item.groups.map((group, gIdx) => (
                          <div key={gIdx} className="flex gap-2 items-start justify-between py-1 border-b border-brand-border/5">
                            <span className="text-cyan-400 text-[11px] font-bold shrink-0">${gIdx + 1}:</span>
                            <span className="text-gray-300 text-right truncate pl-4 select-all" title={group ?? 'undefined'}>
                              {group !== undefined ? `"${group}"` : <span className="text-gray-600 italic">null</span>}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-gray-550 italic leading-snug text-center pt-1 text-gray-500">
                          No embedded subgroups parentheses.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Cheatsheet + Code Snippets Generator Double row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Cheat sheet (5 Columns) */}
        <div className="lg:col-span-5 bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-xl">
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-2 border-b border-brand-border/20">
            <span className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-rose-400" />
              Interactive Cheatsheet
            </span>

            <input 
              type="text"
              value={cheatsheetSearch}
              onChange={(e) => setCheatsheetSearch(e.target.value)}
              placeholder="Search token..."
              className="px-2.5 py-1 text-xs bg-[#07080b] border border-brand-border/40 focus:border-rose-500/40 rounded-lg focus:outline-none font-mono placeholder-gray-650 max-w-[140px] text-rose-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {filteredCheatsheet.map((item, index) => (
              <div 
                key={index} 
                onClick={() => insertToken(item.Token)}
                className="p-2 bg-[#0c1015]/40 hover:bg-rose-500/10 border border-brand-border/25 hover:border-rose-500/35 rounded-xl flex items-center justify-between cursor-pointer group transition"
                title="Click to insert at end of expression"
              >
                <code className="text-xs text-rose-400 font-mono font-bold group-hover:scale-105 transition duration-150">{item.Token}</code>
                <span className="text-[10px] text-gray-400 text-right truncate pl-3">{item.Meaning}</span>
              </div>
            ))}
            
            {filteredCheatsheet.length === 0 && (
              <p className="col-span-2 text-center text-xs text-gray-500 font-mono py-4">No matching cheatsheet tokens found.</p>
            )}
          </div>
        </div>

        {/* Code Generator (7 Columns) */}
        <div className="lg:col-span-7 bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-xl">
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-2 border-b border-brand-border/20">
            <span className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-rose-400" />
              Developer Code Exporter
            </span>

            {/* Language switches */}
            <div className="flex gap-1 bg-brand-surface border border-brand-border/40 p-0.5 rounded-lg">
              {[
                { id: 'js', label: 'JS / TS' },
                { id: 'python', label: 'Python' },
                { id: 'php', label: 'PHP' },
                { id: 'go', label: 'Golang' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setActiveCodeLang(lang.id)}
                  className={`px-3 py-1 text-[10px] font-mono rounded transition ${
                    activeCodeLang === lang.id 
                      ? 'bg-[#12131a] border border-brand-border/45 text-rose-400 shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <label htmlFor="tx-generated-code-snippet" className="sr-only">Generated regex developer integration code snippet</label>
            <textarea 
              id="tx-generated-code-snippet"
              value={generatedSnippet}
              readOnly
              rows={11}
              className="w-full bg-[#050608] border border-brand-border/40 rounded-xl p-4 text-xs font-mono text-zinc-300 leading-relaxed resize-none focus:outline-none"
            />
            
            <button 
              id="btn-copy-code"
              onClick={() => copyToClipboard(generatedSnippet, 'compiledCode')}
              className="absolute right-4 top-4 flex items-center gap-1.5 px-3 py-1.5 border border-brand-border/70 hover:border-rose-500/30 bg-brand-surface hover:bg-brand-surface/80 rounded-lg text-[10px] font-mono text-gray-400 hover:text-white transition"
            >
              {copiedId === 'compiledCode' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

function Trash2Icon() {
  return (
    <svg 
      className="w-4 h-4 text-rose-400 hover:text-rose-500" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  );
}

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, Sparkles, Copy, Check, RefreshCw, FileText, 
  Download, Search, AlertCircle, Play, FileCheck, Layers, 
  Maximize2, Minimize2, Info, Moon, Sliders, Settings, 
  HelpCircle, Trash2, ArrowRight, Eye, Code2
} from 'lucide-react';
import { format as sqlFormatter } from 'sql-formatter';

type Dialect = 'sql' | 'postgresql' | 'mysql' | 'sqlite' | 'tsql' | 'plsql' | 'mariadb';

interface SampleQuery {
  name: string;
  dialect: Dialect;
  code: string;
}

const SAMPLE_QUERIES: SampleQuery[] = [
  {
    name: 'Complex PostgreSQL JOIN',
    dialect: 'postgresql',
    code: `SELECT u.id, u.username, u.email, p.title AS post_title, c.comment_text, count(l.id) AS likes_count, CASE WHEN u.status = 'active' AND p.is_published = true THEN 'published_active' ELSE 'pending_review' END AS status_bucket FROM users u LEFT JOIN posts p ON p.author_id = u.id AND p.deleted_at IS NULL JOIN comments c ON c.post_id = p.id AND c.approved = true LEFT JOIN likes l ON l.target_id = p.id AND l.target_type = 'post' WHERE u.created_at >= '2026-01-01 00:00:00' AND u.country_code IN ('US', 'CA', 'GB') GROUP BY u.id, u.username, u.email, p.title, c.comment_text, u.status, p.is_published HAVING count(l.id) > 5 ORDER BY likes_count DESC, u.username ASC LIMIT 50 OFFSET 0;`
  },
  {
    name: 'DB Schema Creation (DDL)',
    dialect: 'postgresql',
    code: `CREATE TABLE IF NOT EXISTS organization_accounts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_name varchar(255) NOT NULL, domain_name varchar(100) UNIQUE, billing_tier varchar(50) DEFAULT 'free' CHECK (billing_tier IN ('free', 'pro', 'enterprise')), max_user_seats integer DEFAULT 5 NOT NULL, created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP); CREATE INDEX idx_org_domain ON organization_accounts(domain_name); ALTER TABLE users ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organization_accounts(id) ON DELETE SET NULL;`
  },
  {
    name: 'MySQL Insert & Updates',
    dialect: 'mysql',
    code: `INSERT INTO store_inventory (product_id, sku, quantity, warehouse_id, last_stocked_at) VALUES (1084, 'KTL-LHR-01', 150, 4, NOW()) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), last_stocked_at = CURRENT_TIMESTAMP(); UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_successful_login = NOW() WHERE email = 'admin@apex-labs.com' AND status = 'suspended' AND tenant_id = 99;`
  },
  {
    name: 'CTE & Subquery Analytics',
    dialect: 'sql',
    code: `WITH monthly_sales AS (SELECT DATE_TRUNC('month', order_date) AS sales_month, product_category, SUM(subtotal - discount) AS net_revenue, COUNT(DISTINCT customer_id) AS active_buyers FROM sales_orders WHERE status = 'completed' GROUP BY 1, 2), top_performers AS (SELECT sales_month, product_category, net_revenue, active_buyers, RANK() OVER (PARTITION BY sales_month ORDER BY net_revenue DESC) AS category_rank FROM monthly_sales) SELECT * FROM top_performers WHERE category_rank <= 3 ORDER BY sales_month DESC, category_rank ASC;`
  },
  {
    name: 'SQLite Transactions',
    dialect: 'sqlite',
    code: `BEGIN TRANSACTION; UPDATE bank_accounts SET balance = balance - 250.00, updated_at = datetime('now') WHERE account_id = 'ACC-88392' AND balance >= 250.00; INSERT INTO transaction_ledger (id, source_acc, dest_acc, amount, reference, created_at) VALUES (lower(hex(randomblob(16))), 'ACC-88392', 'ACC-11048', 250.00, 'Peer-to-peer Transfer', datetime('now')); UPDATE bank_accounts SET balance = balance + 250.00, updated_at = datetime('now') WHERE account_id = 'ACC-11048'; COMMIT;`
  }
];

export default function SQLFormatter() {
  const [rawInput, setRawInput] = useState<string>(SAMPLE_QUERIES[0].code);
  const [output, setOutput] = useState<string>('');
  const [mode, setMode] = useState<'format' | 'minify'>('format');
  const [dialect, setDialect] = useState<Dialect>('postgresql');
  const [tabWidth, setTabWidth] = useState<number>(2);
  const [keywordCase, setKeywordCase] = useState<'upper' | 'lower' | 'preserve'>('upper');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Performance benchmark (formatting/minifying speed metrics)
  const [processTimeMs, setProcessTimeMs] = useState<number>(0);

  // Simple diagnostics
  const [diagnostics, setDiagnostics] = useState<{
    severity: 'success' | 'warning' | 'info';
    message: string;
    details?: string;
  }[]>([]);

  // Minify SQL logic
  const minifySQL = (sql: string): string => {
    if (!sql) return '';
    
    // 1. Remove block comments /* ... */
    let result = sql.replace(/\/\*[\s\S]*?\*\//g, ' ');
    
    // 2. Remove line comments -- ...
    result = result.split('\n').map(line => {
      const idx = line.indexOf('--');
      if (idx !== -1) {
        // Simple guard to check if -- is inside a single-quoted string
        const before = line.substring(0, idx);
        const singleQuotesCount = (before.match(/'/g) || []).length;
        if (singleQuotesCount % 2 === 0) {
          return before;
        }
      }
      return line;
    }).join('\n');

    // 3. Normalize whitespaces (replace multiple spaces/tabs/newlines with a single space)
    result = result.replace(/\s+/g, ' ');

    // 4. Remove spacing around key operators and symbols where safety allows
    result = result.replace(/\s*([,;()=<>!+*/|])\s*/g, '$1');

    // 5. Trim bookends
    return result.trim();
  };

  // Run formatting or minification
  const handleProcess = () => {
    if (!rawInput.trim()) {
      setOutput('');
      setDiagnostics([]);
      return;
    }

    const startTime = performance.now();
    let processedResult = '';
    const currentDiagnostics: typeof diagnostics = [];

    try {
      if (mode === 'format') {
        processedResult = sqlFormatter(rawInput, {
          language: dialect === 'sqlite' ? 'sql' : dialect, // SQLite falls back nicely to standard sql format
          tabWidth: tabWidth,
          keywordCase: keywordCase === 'preserve' ? undefined : keywordCase,
          useTabs: false,
        });
      } else {
        processedResult = minifySQL(rawInput);
      }

      // Track processing duration
      const endTime = performance.now();
      setProcessTimeMs(parseFloat((endTime - startTime).toFixed(2)));

      // Perform custom heuristics diagnostic check
      const unmatchedParensLeft = (rawInput.match(/\(/g) || []).length;
      const unmatchedParensRight = (rawInput.match(/\)/g) || []).length;
      if (unmatchedParensLeft !== unmatchedParensRight) {
        currentDiagnostics.push({
          severity: 'warning',
          message: 'Mismatched Parentheses',
          details: `Found ${unmatchedParensLeft} open parentheses '(' and ${unmatchedParensRight} close parentheses ')'. Ensure nesting blocks are complete.`
        });
      }

      const singleQuoteCount = (rawInput.match(/'/g) || []).length;
      if (singleQuoteCount % 2 !== 0) {
        currentDiagnostics.push({
          severity: 'warning',
          message: 'Unbalanced Single Quotes',
          details: 'Your query contains an odd number of single quotes (\'). This may indicate an unclosed string or an unescaped character.'
        });
      }

      const hasSelect = /select/i.test(rawInput);
      const hasFrom = /from/i.test(rawInput);
      if (hasSelect && !hasFrom && !/select\s+(current_timestamp|version|now|uuid_generate|gen_random_uuid|last_insert_id)/i.test(rawInput)) {
        currentDiagnostics.push({
          severity: 'info',
          message: 'SELECT without FROM',
          details: 'You declared a SELECT block but are not querying from any tables. This is valid for scalar functions, but otherwise verify.'
        });
      }

      // Check if formatting was successful and did something
      if (currentDiagnostics.length === 0) {
        currentDiagnostics.push({
          severity: 'success',
          message: 'Query parsed successfully',
          details: `${mode === 'format' ? 'Indentation and uppercase keywords applied' : 'Minified into high-density database query layout'}.`
        });
      }

    } catch (err: any) {
      processedResult = rawInput; // Fallback to raw on failure
      currentDiagnostics.push({
        severity: 'warning',
        message: 'Formatting Warning',
        details: err?.message || 'Could not fully format query. Showing output in raw dialect arrangement.'
      });
    }

    setOutput(processedResult);
    setDiagnostics(currentDiagnostics);
  };

  // Re-run whenever input, mode, dialect, indentation size, or case settings change
  useEffect(() => {
    handleProcess();
  }, [rawInput, mode, dialect, tabWidth, keywordCase]);

  // Load sample query helper
  const handleLoadSample = (sample: SampleQuery) => {
    setRawInput(sample.code);
    setDialect(sample.dialect);
  };

  // Clipboard copy helper
  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // File Download helper
  const downloadSQLFile = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query-formatted-${dialect}-${new Date().toISOString().slice(0,10)}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Simulated Syntax Highlighting Renderer
  // Matches SQL key terms, strings, comments, numbers, functions to inject styled tags
  const renderSyntaxHighlighting = (text: string) => {
    if (!text) return <span className="text-zinc-600 italic">No query output available.</span>;

    // Standard high-visibility keyword regexes
    const KEYWORDS = /^(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|CROSS|ON|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|OFFSET|UNION|ALL|CREATE|TABLE|DATABASE|ALTER|DROP|INDEX|ADD|COLUMN|DEFAULT|CHECK|CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|REFERENCES|VALUES|INTO|SET|WITH|AS|AND|OR|NOT|IN|EXISTS|IS|NULL|LIKE|ILIKE|BETWEEN|CASE|WHEN|THEN|ELSE|END|BEGIN|COMMIT|ROLLBACK|TRANSACTION|TRUE|FALSE|INTO|ON\s+DUPLICATE\s+KEY\s+UPDATE|OVER|PARTITION\s+BY|RANK|ROW_NUMBER)$/i;
    
    const FUNCTIONS = /^(COUNT|SUM|AVG|MIN|MAX|COALESCE|NOW|CURRENT_TIMESTAMP|CURRENT_DATE|DATE_TRUNC|HEX|RANDOMBLOB|LOWER|GEN_RANDOM_UUID|DATETIME)$/i;

    // We split by tokens: comments, strings, words/keywords, punctuation
    // Tokenizer regex
    const tokenRegex = /(\/\*[\s\S]*?\*\/|--.*|'[^']*'|"[^"]*"|\b[a-zA-Z_][a-zA-Z0-9_]*\b|\d+(?:\.\d+)?|[\s;(),=<>!+*/|.-]+)/g;
    
    const tokens = text.match(tokenRegex);
    if (!tokens) return <span>{text}</span>;

    return (
      <code className="font-mono text-xs leading-relaxed tracking-normal whitespace-pre">
        {tokens.map((token, idx) => {
          // 1. Comments
          if (token.startsWith('--') || token.startsWith('/*')) {
            return <span key={idx} className="text-zinc-500 italic">{token}</span>;
          }
          // 2. Strings
          if (token.startsWith("'") || token.startsWith('"')) {
            // Check if search query matches part of it
            return <span key={idx} className="text-amber-400 font-medium">{token}</span>;
          }
          // 3. Numbers
          if (/^\d+(?:\.\d+)?$/.test(token)) {
            return <span key={idx} className="text-rose-400">{token}</span>;
          }
          // 4. SQL Keywords & Built-ins
          if (KEYWORDS.test(token)) {
            return <span key={idx} className="text-emerald-400 font-bold">{token}</span>;
          }
          // 5. Functions
          if (FUNCTIONS.test(token)) {
            return <span key={idx} className="text-cyan-400">{token}</span>;
          }
          
          // 6. Plain code text - search highlighted if match exists
          if (searchQuery.trim() && token.toLowerCase().includes(searchQuery.toLowerCase())) {
            return <mark key={idx} className="bg-yellow-500/30 text-white rounded px-0.5 border-b border-yellow-400">{token}</mark>;
          }

          return <span key={idx} className="text-zinc-200">{token}</span>;
        })}
      </code>
    );
  };

  // Compression & Reduction stats math
  const stats = useMemo(() => {
    const rawLen = rawInput.length;
    const outLen = output.length;
    const diff = rawLen - outLen;
    const percent = rawLen > 0 ? ((diff / rawLen) * 100).toFixed(1) : '0.0';
    return {
      rawLen,
      outLen,
      diff,
      percent,
      lineCount: output.split('\n').length,
      wordCount: (output.match(/\b\w+\b/g) || []).length
    };
  }, [rawInput, output]);

  return (
    <div className={`w-full space-y-6 ${isFullScreen ? 'fixed inset-0 bg-zinc-950 z-50 p-6 sm:p-10 overflow-y-auto' : ''}`}>
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-500 uppercase">Database Suite</span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-sans flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400 animate-pulse" />
            SQL Query Formatter & Minifier
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Format unreadable SQL queries into structured, syntax-highlighted blocks or compress them instantly for efficient database query logging.
          </p>
        </div>

        {/* Fullscreen control */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl transition-all"
            title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Editor Settings Sidebar & Templates (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* Quick templates preset selection */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              SQL Presets & Demos
            </span>
            <div className="flex flex-col gap-2">
              {SAMPLE_QUERIES.map((sample) => (
                <button
                  key={sample.name}
                  onClick={() => handleLoadSample(sample)}
                  className="w-full text-left p-2.5 rounded-xl border border-zinc-900 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-800 text-xs text-zinc-300 transition-all flex items-center justify-between group"
                >
                  <span className="font-medium truncate group-hover:text-emerald-400">{sample.name}</span>
                  <span className="text-[9px] font-mono font-bold bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-500 uppercase shrink-0">
                    {sample.dialect}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Settings */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
              <Settings className="w-3.5 h-3.5 text-emerald-400" />
              Formatting Settings
            </span>

            {/* Mode selection toggle */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block">Operation Mode</label>
              <div className="grid grid-cols-2 gap-1 bg-zinc-900/60 p-1 rounded-xl">
                <button
                  onClick={() => setMode('format')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    mode === 'format' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Format
                </button>
                <button
                  onClick={() => setMode('minify')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    mode === 'minify' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  Minify
                </button>
              </div>
            </div>

            {/* Dialect choice */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block">SQL Dialect</label>
              <select
                value={dialect}
                onChange={(e) => setDialect(e.target.value as Dialect)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-600 transition-all font-sans"
              >
                <option value="postgresql">PostgreSQL / Redshift</option>
                <option value="mysql">MySQL / MariaDB</option>
                <option value="sqlite">SQLite</option>
                <option value="sql">Standard ANSI SQL</option>
                <option value="tsql">SQL Server (T-SQL)</option>
                <option value="plsql">Oracle PL/SQL</option>
              </select>
            </div>

            {/* Format specifics (shown only in format mode) */}
            {mode === 'format' && (
              <div className="space-y-4 pt-2 border-t border-zinc-900/60">
                {/* Indent size selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block">Indentation Size</label>
                  <div className="grid grid-cols-3 gap-1 bg-zinc-900/40 p-1 rounded-xl text-center">
                    {[2, 4].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setTabWidth(sz)}
                        className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          tabWidth === sz ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {sz} spaces
                      </button>
                    ))}
                    <button
                      onClick={() => setTabWidth(4)} // Tabs mapped as 4 spaces
                      className="py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white"
                      title="Uses standard whitespace indents"
                    >
                      Tabs
                    </button>
                  </div>
                </div>

                {/* Case setting */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block">Keyword Casing</label>
                  <select
                    value={keywordCase}
                    onChange={(e) => setKeywordCase(e.target.value as 'upper' | 'lower' | 'preserve')}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-600 transition-all font-sans"
                  >
                    <option value="upper">UPPERCASE (Standard)</option>
                    <option value="lower">lowercase</option>
                    <option value="preserve">Preserve Original</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Double-Panel Workspace (9 cols) */}
        <div className="lg:col-span-9 space-y-5">
          
          {/* Main workspace editor split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Input SQL Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-zinc-500" />
                  Raw Input SQL
                </span>
                <button
                  onClick={() => setRawInput('')}
                  className="text-[10px] font-mono text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Code
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 focus:border-emerald-600 focus:outline-none rounded-2xl p-4 font-mono text-xs leading-relaxed text-white placeholder-zinc-700 min-h-[440px] resize-y"
                  placeholder="/* Paste or write your unformatted SQL here */&#10;SELECT * FROM users u JOIN orders o ON o.user_id = u.id WHERE u.status = 'active';"
                />
              </div>
            </div>

            {/* Output Styled Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  Processed Outcome
                </span>
                
                {/* Search query highlight */}
                {mode === 'format' && (
                  <div className="relative max-w-[150px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search term..."
                      className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-7 pr-2 py-1 text-[10px] text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                )}
              </div>

              {/* Styled Display Box */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl min-h-[440px] flex flex-col justify-between overflow-hidden relative">
                {/* Scrollable Highlight Code Area */}
                <div className="p-4 overflow-auto max-h-[500px] flex-1">
                  {output ? (
                    <pre className="whitespace-pre">{renderSyntaxHighlighting(output)}</pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full text-zinc-600 space-y-2 py-20">
                      <Database className="w-10 h-10 text-zinc-800" />
                      <p className="text-xs">Provide a SQL query on the left to review formatted output.</p>
                    </div>
                  )}
                </div>

                {/* Bottom Bar Controls for Output */}
                {output && (
                  <div className="bg-zinc-900/40 border-t border-zinc-900/80 px-4 py-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-zinc-500">
                      Completed in <span className="text-emerald-400 font-bold">{processTimeMs}ms</span>
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="text-[11px] font-mono text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-800 transition-colors flex items-center gap-1.5"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy SQL'}
                      </button>
                      <button
                        onClick={downloadSQLFile}
                        className="text-[11px] font-mono text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-800 transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download .sql
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Bar */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-lg grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Character Metrics</span>
              <p className="text-lg font-extrabold text-white font-sans">
                {stats.outLen} <span className="text-zinc-500 text-xs font-normal">/ {stats.rawLen} chars</span>
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Compression Ratio</span>
              <p className={`text-lg font-extrabold font-sans ${mode === 'minify' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {mode === 'minify' ? `-${stats.percent}%` : `+${Math.max(0, -parseFloat(stats.percent)).toFixed(1)}%`}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Line Count</span>
              <p className="text-lg font-extrabold text-white font-sans">
                {stats.lineCount} <span className="text-zinc-500 text-xs font-normal">lines</span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Word Count</span>
              <p className="text-lg font-extrabold text-white font-sans">
                {stats.wordCount} <span className="text-zinc-500 text-xs font-normal">tokens</span>
              </p>
            </div>
          </div>

          {/* Heuristic Diagnostic Logs */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 shadow-lg space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              Automated SQL Diagnostic Audit
            </span>
            <div className="space-y-2">
              {diagnostics.map((diag, index) => (
                <div 
                  key={index} 
                  className={`p-3.5 rounded-xl border text-xs flex gap-3 ${
                    diag.severity === 'success' 
                      ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300' 
                      : diag.severity === 'warning'
                        ? 'bg-red-950/10 border-red-500/20 text-red-300'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <AlertCircle className={`w-4 h-4 shrink-0 ${
                    diag.severity === 'success' 
                      ? 'text-emerald-400' 
                      : diag.severity === 'warning'
                        ? 'text-red-400'
                        : 'text-zinc-400'
                  }`} />
                  <div className="space-y-1 leading-relaxed">
                    <p className="font-bold">{diag.message}</p>
                    {diag.details && <p className="text-[11px] font-mono opacity-80">{diag.details}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

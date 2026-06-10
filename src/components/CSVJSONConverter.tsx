import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeftRight,
  Upload,
  Download,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Settings,
  Grid,
  Code,
  AlertCircle,
  HelpCircle,
  Trash2,
  Plus,
  Play,
  RotateCcw,
  CheckCircle,
  Hash,
  Layers,
  ChevronRight,
  Info,
  Sliders,
  Sparkles,
  Sheet,
  Braces
} from 'lucide-react';
import { logToolUsage } from '../utils/toolAnalytics';

// Default CSV sample content
const DEFAULT_CSV = `id,name,role,department,salary,isActive
101,John Doe,Lead Architect,Core Platform,135000,true
102,Sarah Smith,Principle Engineer,Data Signals,142000,true
103,Alex Rivera,Senior Analyst,Analytics Lab,98000,false
104,Alex Dev,L3 Code Specialist,AI Frameworks,115000,true
105,Elena Petrova,UX Researcher,Design Systems,88000,true`;

// Default JSON sample content corresponding to the CSV
const DEFAULT_JSON = `[
  {
    "id": 101,
    "name": "John Doe",
    "role": "Lead Architect",
    "department": "Core Platform",
    "salary": 135000,
    "isActive": true
  },
  {
    "id": 102,
    "name": "Sarah Smith",
    "role": "Principle Engineer",
    "department": "Data Signals",
    "salary": 142000,
    "isActive": true
  },
  {
    "id": 103,
    "name": "Alex Rivera",
    "role": "Senior Analyst",
    "department": "Analytics Lab",
    "salary": 98000,
    "isActive": false
  }
]`;

// Custom CSV Parser complying with RFC-4180
function parseSchemaCSV(text: string, delimiter: string = ',', hasHeaders: boolean = true, autoCast: boolean = true) {
  const lines: string[][] = [];
  let currentWord = '';
  let inQuotes = false;
  let currentLine: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentWord += '"';
          i++; // Skip escaping quote
        } else {
          inQuotes = false;
        }
      } else {
        currentWord += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentLine.push(currentWord);
        currentWord = '';
      } else if (char === '\r' || char === '\n') {
        currentLine.push(currentWord);
        currentWord = '';
        if (currentLine.length > 0 || (currentLine.length === 1 && currentLine[0] !== '')) {
          lines.push(currentLine);
        }
        currentLine = [];
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip Windows CRLF
        }
      } else {
        currentWord += char;
      }
    }
  }

  if (currentWord || currentLine.length > 0) {
    currentLine.push(currentWord);
    lines.push(currentLine);
  }

  // Filter empty lines
  const nonEmptyLines = lines.filter(l => l.some(cell => cell.trim() !== ''));
  if (nonEmptyLines.length === 0) return { headers: [], rows: [] };

  let headers: string[] = [];
  let startIndex = 0;

  if (hasHeaders) {
    headers = nonEmptyLines[0].map((h, index) => h.trim() || `column_${index + 1}`);
    startIndex = 1;
  } else {
    const cellCount = Math.max(...nonEmptyLines.map(l => l.length));
    headers = Array.from({ length: cellCount }, (_, i) => `column_${i + 1}`);
  }

  const rows = nonEmptyLines.slice(startIndex).map((line) => {
    const rowObj: Record<string, any> = {};
    headers.forEach((header, colIndex) => {
      const rawVal = line[colIndex] ?? '';
      let val: any = rawVal;
      if (autoCast) {
        const trimmed = rawVal.trim();
        if (trimmed.toLowerCase() === 'true') {
          val = true;
        } else if (trimmed.toLowerCase() === 'false') {
          val = false;
        } else if (trimmed === 'null') {
          val = null;
        } else if (trimmed !== '' && !isNaN(trimmed as any)) {
          val = Number(trimmed);
        }
      }
      rowObj[header] = val;
    });
    return rowObj;
  });

  return { headers, rows };
}

// Convert JSON arrays back into high-fidelity CSV
function serializeJSONtoCSV(jsonArray: any[], delimiter: string = ',', includeHeaders: boolean = true, newline: string = '\n') {
  if (!Array.isArray(jsonArray) || jsonArray.length === 0) return '';

  const headers = Array.from(
    new Set(jsonArray.flatMap(obj => (typeof obj === 'object' && obj !== null) ? Object.keys(obj) : []))
  );

  if (headers.length === 0) return '';

  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '';
    let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const csvRows: string[] = [];

  if (includeHeaders) {
    csvRows.push(headers.map(h => escapeCell(h)).join(delimiter));
  }

  jsonArray.forEach(item => {
    if (item && typeof item === 'object') {
      const row = headers.map(h => escapeCell(item[h]));
      csvRows.push(row.join(delimiter));
    }
  });

  return csvRows.join(newline);
}

export default function CSVJSONConverter() {
  // 'csv2json' or 'json2csv'
  const [conversionMode, setConversionMode] = useState<'csv2json' | 'json2csv'>('csv2json');

  // String Inputs
  const [csvInput, setCsvInput] = useState<string>(DEFAULT_CSV);
  const [jsonInput, setJsonInput] = useState<string>(DEFAULT_JSON);

  // Configuration settings
  const [csvDelimiter, setCsvDelimiter] = useState<string>(',');
  const [csvHasHeaders, setCsvHasHeaders] = useState<boolean>(true);
  const [csvAutoCastTypes, setCsvAutoCastTypes] = useState<boolean>(true);

  // JSON formatting options
  const [jsonIndentSize, setJsonIndentSize] = useState<number>(2);

  // Drag and drop uploading feed-backs
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  // Visual interactive states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [csvErrorMessage, setCsvErrorMessage] = useState<string | null>(null);
  const [jsonErrorMessage, setJsonErrorMessage] = useState<string | null>(null);

  // Search filter for Table Previews
  const [gridQuery, setGridQuery] = useState<string>('');

  // Interactive Table Edit state (Keep parsed row references in separate state so users can tweak properties in a sleek grid view)
  const [localTableHeaders, setLocalTableHeaders] = useState<string[]>([]);
  const [localTableRows, setLocalTableRows] = useState<any[]>([]);

  // Track operations
  useEffect(() => {
    logToolUsage('csv-json-converter');
  }, []);

  // Sync inputs dynamically or update local structured state
  useEffect(() => {
    if (conversionMode === 'csv2json') {
      try {
        setCsvErrorMessage(null);
        if (!csvInput.trim()) {
          setLocalTableHeaders([]);
          setLocalTableRows([]);
          return;
        }
        const { headers, rows } = parseSchemaCSV(csvInput, csvDelimiter, csvHasHeaders, csvAutoCastTypes);
        setLocalTableHeaders(headers);
        setLocalTableRows(rows);
      } catch (err: any) {
        setCsvErrorMessage(err.message || 'Parser Error occurred on tabular CSV compile.');
      }
    } else {
      try {
        setJsonErrorMessage(null);
        if (!jsonInput.trim()) {
          setLocalTableHeaders([]);
          setLocalTableRows([]);
          return;
        }
        const parsed = JSON.parse(jsonInput);
        if (Array.isArray(parsed)) {
          const headers = Array.from(new Set(parsed.flatMap(obj => obj && typeof obj === 'object' ? Object.keys(obj) : [])));
          setLocalTableHeaders(headers);
          setLocalTableRows(parsed);
        } else if (parsed && typeof parsed === 'object') {
          // Single object wrap
          setLocalTableHeaders(Object.keys(parsed));
          setLocalTableRows([parsed]);
        } else {
          setJsonErrorMessage('JSON input must be a valid array of structured key-value maps.');
        }
      } catch (err: any) {
        setJsonErrorMessage(err.message ? `JSON Lexer Error: ${err.message}` : 'Invalid JSON object pattern.');
      }
    }
  }, [csvInput, jsonInput, conversionMode, csvDelimiter, csvHasHeaders, csvAutoCastTypes]);

  // Compute final JSON output text representation from local state
  const computedJSONOutput = useMemo(() => {
    if (conversionMode !== 'csv2json') return '';
    if (localTableRows.length === 0) return '[]';
    return JSON.stringify(localTableRows, null, jsonIndentSize);
  }, [localTableRows, conversionMode, jsonIndentSize]);

  // Compute final CSV output text representation from local state
  const computedCSVOutput = useMemo(() => {
    if (conversionMode !== 'json2csv') return '';
    return serializeJSONtoCSV(localTableRows, csvDelimiter, csvHasHeaders, '\n');
  }, [localTableRows, conversionMode, csvDelimiter, csvHasHeaders]);

  // Handle Drag-over and drops
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.json')) {
        setJsonInput(text);
        setConversionMode('json2csv');
        setUploadFeedback(`Linked JSON successfully: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`);
      } else {
        // Fallback or explicit CSV upload
        setCsvInput(text);
        setConversionMode('csv2json');
        setUploadFeedback(`Linked CSV successfully: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`);
      }

      setTimeout(() => setUploadFeedback(null), 4000);
    };

    reader.onerror = () => {
      setUploadFeedback('Failed to read local file content.');
      setTimeout(() => setUploadFeedback(null), 4000);
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  // Live tabular cells changes updating inputs automatically
  const handleCellChange = (rowIndex: number, colKey: string, newValue: string) => {
    const updated = [...localTableRows];
    
    // Auto cast if enabled
    let valueToAssign: any = newValue;
    if (csvAutoCastTypes) {
      const trimmed = newValue.trim();
      if (trimmed.toLowerCase() === 'true') {
        valueToAssign = true;
      } else if (trimmed.toLowerCase() === 'false') {
        valueToAssign = false;
      } else if (trimmed === 'null') {
        valueToAssign = null;
      } else if (trimmed !== '' && !isNaN(trimmed as any)) {
        valueToAssign = Number(trimmed);
      }
    }

    updated[rowIndex] = {
      ...updated[rowIndex],
      [colKey]: valueToAssign
    };

    setLocalTableRows(updated);

    // Propagate changes back to respective inputs to keep inputs in sync
    if (conversionMode === 'csv2json') {
      const newCSV = serializeJSONtoCSV(updated, csvDelimiter, csvHasHeaders, '\n');
      setCsvInput(newCSV);
    } else {
      setJsonInput(JSON.stringify(updated, null, jsonIndentSize));
    }
  };

  // Interactive actions: Delete visual row
  const deleteRow = (index: number) => {
    const updated = localTableRows.filter((_, idx) => idx !== index);
    setLocalTableRows(updated);
    
    if (conversionMode === 'csv2json') {
      const newCSV = serializeJSONtoCSV(updated, csvDelimiter, csvHasHeaders, '\n');
      setCsvInput(newCSV);
    } else {
      setJsonInput(JSON.stringify(updated, null, jsonIndentSize));
    }
  };

  // Interactive actions: Add custom row
  const insertNewRow = () => {
    const emptyRow: Record<string, any> = {};
    localTableHeaders.forEach(h => {
      emptyRow[h] = '';
    });

    const updated = [...localTableRows, emptyRow];
    setLocalTableRows(updated);

    if (conversionMode === 'csv2json') {
      const newCSV = serializeJSONtoCSV(updated, csvDelimiter, csvHasHeaders, '\n');
      setCsvInput(newCSV);
    } else {
      setJsonInput(JSON.stringify(updated, null, jsonIndentSize));
    }
  };

  // Reset to default sample structures
  const handleReset = () => {
    if (conversionMode === 'csv2json') {
      setCsvInput(DEFAULT_CSV);
    } else {
      setJsonInput(DEFAULT_JSON);
    }
  };

  // Code / File copy clips helpers
  const handleCopyClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // File downloads generator helper
  const handleDownloadFile = () => {
    const outputText = conversionMode === 'csv2json' ? computedJSONOutput : computedCSVOutput;
    const extension = conversionMode === 'csv2json' ? 'json' : 'csv';
    const mime = conversionMode === 'csv2json' ? 'application/json' : 'text/csv';
    
    const blob = new Blob([outputText], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `apex_converted_${Date.now()}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter local rows matching search query
  const filteredGridRows = useMemo(() => {
    if (!gridQuery.trim()) return localTableRows;
    const query = gridQuery.toLowerCase();
    return localTableRows.filter(row => {
      return Object.values(row).some(val => String(val).toLowerCase().includes(query));
    });
  }, [localTableRows, gridQuery]);

  return (
    <div id="csv-json-converter-studio" className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* Visual Header Grid Zone */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-brand-border/30">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shadow-lg shadow-amber-500/5">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-amber-400 tracking-widest block uppercase">Apex Relational Workspace</span>
              <h1 className="text-3xl font-sans font-medium tracking-tight text-white mb-1">CSV ⇄ JSON Data Converter</h1>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2 max-w-xl">
            Instantly map and parse nested tables, transform datasets file-to-file, configure strict delimiters, and visually edit rows live with full data safety.
          </p>
        </div>

        {/* Dynamic Mode Controller Tabs */}
        <div className="flex bg-[#0c0d12]/80 border border-brand-border/40 p-1 rounded-xl shadow-lg">
          <button
            onClick={() => setConversionMode('csv2json')}
            className={`px-4 py-2 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5 ${
              conversionMode === 'csv2json'
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sheet className="w-3.5 h-3.5" />
            CSV to JSON
          </button>
          
          <button
            onClick={() => setConversionMode('json2csv')}
            className={`px-4 py-2 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5 ${
              conversionMode === 'json2csv'
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Braces className="w-3.5 h-3.5" />
            JSON to CSV
          </button>
        </div>
      </div>

      {/* Main Drag & Drop Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border border-dashed rounded-2xl p-6 text-center transition relative ${
          isDragging 
            ? 'border-amber-500 bg-amber-500/[0.04]' 
            : 'border-brand-border/30 bg-[#07080b]/50 hover:bg-[#07080b]/80'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
          <div className="p-3 bg-brand-surface/80 border border-brand-border/20 rounded-full text-amber-400">
            <Upload className="w-5 h-5 animate-bounce" />
          </div>
          <p className="text-sm text-gray-200">
            Drag and drop structured <span className="font-mono text-amber-400">.csv</span> or <span className="font-mono text-cyan-400">.json</span> templates anywhere
          </p>
          <p className="text-xs text-gray-500">Or browse local directories for immediate automatic parsing</p>
        </div>

        {/* Real hidden file input */}
        <label htmlFor="csv-json-uploader-file-input" className="absolute inset-0 w-full h-full cursor-pointer opacity-0">
          <input 
            id="csv-json-uploader-file-input"
            type="file" 
            accept=".csv,.json,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
        
        {uploadFeedback && (
          <div className="mt-4 text-xs font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 py-1.5 px-3 rounded-lg inline-block">
            {uploadFeedback}
          </div>
        )}
      </div>

      {/* Two Columns Code Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Input Column Panel */}
        <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-xl">
          
          <div className="flex justify-between items-center pb-2 border-b border-brand-border/20">
            <span className="text-xs font-mono uppercase text-gray-450 tracking-wider inline-flex items-center gap-1.5 text-gray-400">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Source Input Panel
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="p-1 px-2.5 text-[10px] font-mono hover:text-white border border-brand-border/40 rounded bg-[#090b0e] transition flex items-center gap-1"
                title="Reset sample data"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                Reset Sample
              </button>
            </div>
          </div>

          {/* Quick Setup Configurations */}
          <div className="bg-brand-surface/30 border border-brand-border/30 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* Custom Delimiter setting */}
            <div className="space-y-1.5">
              <label htmlFor="sel-data-delimiter" className="text-gray-450 font-mono tracking-wider text-gray-400 block">Separator Delimiter</label>
              <select
                id="sel-data-delimiter"
                value={csvDelimiter}
                onChange={(e) => setCsvDelimiter(e.target.value)}
                className="w-full bg-[#050608] border border-brand-border/40 rounded px-2 py-1 text-amber-400 font-mono focus:outline-none"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="&#9;">Tab (\\t)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>

            {/* Headers switcher */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <label id="lbl-has-headers" className="flex items-center gap-2.5 cursor-pointer select-none text-gray-300 py-1.5">
                <input
                  type="checkbox"
                  checked={csvHasHeaders}
                  aria-labelledby="lbl-has-headers"
                  onChange={() => setCsvHasHeaders(!csvHasHeaders)}
                  className="rounded border-gray-600 text-amber-500 focus:ring-amber-500/20 bg-black/40"
                />
                <span className="font-mono">Use First Row Header</span>
              </label>
            </div>

            {/* Auto Casting */}
            <div className="space-y-1.5 flex flex-col justify-end">
              {conversionMode === 'csv2json' ? (
                <label id="lbl-auto-cast" className="flex items-center gap-2.5 cursor-pointer select-none text-gray-300 py-1.5" title="Cast numbers, booleans, and null entries into native JSON types.">
                  <input
                    type="checkbox"
                    checked={csvAutoCastTypes}
                    aria-labelledby="lbl-auto-cast"
                    onChange={() => setCsvAutoCastTypes(!csvAutoCastTypes)}
                    className="rounded border-gray-600 text-amber-500 focus:ring-amber-500/20 bg-black/40"
                  />
                  <span className="font-mono">Auto Type Casts</span>
                </label>
              ) : (
                <div className="space-y-1">
                  <label htmlFor="json-indent-select" className="text-gray-400 font-mono block">Indent Layout</label>
                  <select
                    id="json-indent-select"
                    value={jsonIndentSize}
                    onChange={(e) => setJsonIndentSize(Number(e.target.value))}
                    className="w-full bg-[#050608] border border-brand-border/40 rounded px-2 py-1 text-amber-400 font-mono focus:outline-none"
                  >
                    <option value={2}>2 Spaces</option>
                    <option value={4}>4 Spaces</option>
                  </select>
                </div>
              )}
            </div>

          </div>

          {/* Text Area */}
          <div className="relative">
            {conversionMode === 'csv2json' ? (
              <>
                <label htmlFor="tx-csv-source-input" className="sr-only">Raw CSV input data</label>
                <textarea
                  id="tx-csv-source-input"
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder="Paste raw CSV textual grid structure here..."
                  className="w-full bg-[#050608] border border-brand-border/40 focus:border-amber-500/40 rounded-xl p-4 font-mono text-xs text-amber-200 focus:outline-none h-[280px] resize-none leading-relaxed"
                />
              </>
            ) : (
              <>
                <label htmlFor="tx-json-source-input" className="sr-only">Raw JSON input data</label>
                <textarea
                  id="tx-json-source-input"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste structures of structured JSON array objects here..."
                  className="w-full bg-[#050608] border border-brand-border/40 focus:border-cyan-500/40 rounded-xl p-4 font-mono text-xs text-cyan-200 focus:outline-none h-[280px] resize-none leading-relaxed"
                />
              </>
            )}

            {/* Error Indicators */}
            {conversionMode === 'csv2json' && csvErrorMessage && (
              <div className="absolute bottom-3 left-3 right-3 p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] rounded flex items-center gap-1.5 font-mono">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{csvErrorMessage}</span>
              </div>
            )}
            {conversionMode === 'json2csv' && jsonErrorMessage && (
              <div className="absolute bottom-3 left-3 right-3 p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] rounded flex items-center gap-1.5 font-mono">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{jsonErrorMessage}</span>
              </div>
            )}
          </div>

        </div>

        {/* Output Column Panel */}
        <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-brand-border/20">
              <span className="text-xs font-mono uppercase text-gray-450 tracking-wider inline-flex items-center gap-1.5 text-gray-400">
                <Code className="w-3.5 h-3.5 text-amber-400" />
                Dynamic Compilation Target ({conversionMode === 'csv2json' ? 'JSON' : 'CSV'})
              </span>

              {/* Action Tools */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyClipboard(
                    conversionMode === 'csv2json' ? computedJSONOutput : computedCSVOutput,
                    'clipboardOutput'
                  )}
                  className="p-1 px-2 text-[10px] font-mono hover:text-white border border-brand-border/40 rounded bg-[#090b0e] transition flex items-center gap-1"
                >
                  {copiedId === 'clipboardOutput' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-gray-400" />
                      <span>Copy Result</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadFile}
                  className="p-1 px-2 text-[10px] font-mono text-black bg-amber-400 hover:bg-amber-300 rounded font-medium transition flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download File
                </button>
              </div>
            </div>

            {/* Read Only Result Screen */}
            <div className="relative mt-4">
              <textarea
                id="tx-conversion-result-block"
                value={conversionMode === 'csv2json' ? computedJSONOutput : computedCSVOutput}
                readOnly
                placeholder="Awaiting parsed structured schemas output..."
                className="w-full bg-[#050608] border border-brand-border/40 rounded-xl p-4 font-mono text-xs text-zinc-300 focus:outline-none h-[335px] resize-none leading-relaxed"
              />
            </div>
          </div>

        </div>

      </div>

      {/* Structured Interactive Grid Table Editor */}
      <div className="bg-[#0b0c10]/80 border border-brand-border/30 rounded-2xl p-5 space-y-4 shadow-2xl">
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 border-b border-brand-border/20">
          <div>
            <span className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-amber-400" />
              Live Interactive Data Grid Editor
            </span>
            <p className="text-[11px] text-gray-500 mt-0.5">Edit cells instantly; changes synchronize back to target syntax blocks in real-time.</p>
          </div>

          {/* Table Filters & Row Insert controls */}
          <div className="flex flex-wrap items-center gap-3">
            <input 
              type="text"
              value={gridQuery}
              onChange={(e) => setGridQuery(e.target.value)}
              placeholder="Filter table rows..."
              className="px-3 py-1.5 text-xs bg-[#07080b] border border-brand-border/40 focus:border-amber-500/40 rounded-lg focus:outline-none font-mono placeholder-gray-650 text-amber-200 max-w-[200px]"
            />

            <button
              onClick={insertNewRow}
              disabled={localTableHeaders.length === 0}
              className="px-3 py-1.5 bg-[#0e1017] border border-amber-500/20 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-mono flex items-center gap-1.5 transition disabled:opacity-30 disabled:pointer-events-none"
            >
              <Plus className="w-3.5 h-3.5" />
              Insert Row
            </button>
          </div>
        </div>

        {/* Real Data Visual Table */}
        {localTableHeaders.length === 0 ? (
          <div className="text-center py-10 border border-brand-border/20 border-dashed rounded-xl">
            <HelpCircle className="w-8 h-8 text-gray-650 mx-auto mb-2 text-gray-500" />
            <p className="text-xs text-gray-500 font-mono">Provide structural CSV/JSON inputs to visualize direct tabular row matrices here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full border border-brand-border/30 rounded-xl bg-[#07080b]/50 max-h-[380px]">
            <table className="w-full text-left border-collapse text-xs select-text">
              <thead>
                <tr className="bg-[#0b0c10] border-b border-brand-border/40 font-mono text-gray-400 text-[10px] uppercase tracking-wider">
                  <th className="p-3 text-center w-12 border-r border-brand-border/20">#</th>
                  {localTableHeaders.map((header) => (
                    <th key={header} className="p-3 font-medium border-r border-brand-border/10">
                      {header}
                    </th>
                  ))}
                  <th className="p-3 text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/25 font-mono">
                {filteredGridRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-brand-surface/20 transition-all">
                    
                    {/* Index identifier columns */}
                    <td className="p-2.5 text-center text-[10px] text-gray-500 border-r border-brand-border/25 bg-[#090b0e]">
                      {rIdx + 1}
                    </td>

                    {/* Matched row schemas cells custom editor inputs */}
                    {localTableHeaders.map((header) => {
                      const val = row[header];
                      // Cast to display string appropriately
                      const valStr = val === null ? 'null' : String(val);
                      
                      // Dynamic text highlight styling according to boolean/numeric/null state
                      let textColor = 'text-gray-200';
                      if (typeof val === 'number') textColor = 'text-cyan-400';
                      if (typeof val === 'boolean') textColor = val ? 'text-emerald-400 font-semibold' : 'text-rose-400';
                      if (val === null) textColor = 'text-gray-500 italic';

                      return (
                        <td key={header} className="p-1 border-r border-brand-border/15 min-w-[140px]">
                          <input
                            type="text"
                            value={valStr}
                            onChange={(e) => handleCellChange(rIdx, header, e.target.value)}
                            className={`w-full bg-transparent px-2 py-1 focus:bg-[#07080b] focus:outline-none rounded transition ${textColor}`}
                          />
                        </td>
                      );
                    })}

                    {/* Quick Row Deletions */}
                    <td className="p-1.5 text-center">
                      <button
                        onClick={() => deleteRow(rIdx)}
                        className="p-1.5 hover:bg-rose-500/15 rounded-lg text-gray-500 hover:text-rose-400 transition"
                        title="Delete this row item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom indicators card bar */}
        {localTableRows.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 pt-3 text-[10px] font-mono text-gray-500 border-t border-brand-border/10">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Values parsed automatically. Boolean strings (<em>true/false</em>) or numbers are converted to native structural primitives.
            </span>
            <div className="flex gap-4">
              <span>Rows Counted: <strong className="text-white">{localTableRows.length}</strong></span>
              <span>Cols Counted: <strong className="text-white">{localTableHeaders.length}</strong></span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

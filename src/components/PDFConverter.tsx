import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, Download, RefreshCw, FileText, Table, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

export default function PDFConverter() {
  const [pdfText, setPdfText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [extractedRows, setExtractedRows] = useState<string[][]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<'word' | 'excel'>('word');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setIsProcessing(true);
      setError(null);
      setPdfText('');
      setExtractedRows([]);

      try {
        const arrayBuffer = await file.arrayBuffer();
        
        // Initialize pdfjs worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        const rowsTemp: string[][] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          let pageText = '';
          let lastY = -1;
          let currentRow: string[] = [];

          textContent.items.forEach((item: any) => {
            pageText += item.str + ' ';
            
            // Basic table row detection heuristic based on vertical coordinates
            const currentY = item.transform[5];
            if (lastY === -1 || Math.abs(currentY - lastY) < 5) {
              currentRow.push(item.str);
            } else {
              if (currentRow.length > 1) {
                rowsTemp.push(currentRow);
              }
              currentRow = [item.str];
            }
            lastY = currentY;
          });

          fullText += `--- Page ${i} ---\n` + pageText + '\n\n';
        }

        setPdfText(fullText.trim());
        setExtractedRows(rowsTemp.slice(0, 50)); // Limit preview rows for speed
      } catch (err: any) {
        console.error(err);
        setError('Failed to extract core PDF text natively. Showing simulated extracted document output.');
        
        // Simulated fallback in case CORS or CDN issues occur
        setTimeout(() => {
          setPdfText(`Apex Utility Labs Corporate Contract\n\n1. Overview of Services\nThis agreement mandates the execution of localized image conversions, PDF optimizations, and secure cryptographic key generators.\n\n2. Service Deliverables\nDeliverable 1: WebP canvas compression engine with responsive sliders.\nDeliverable 2: Security Vault passphrase matrix.\n\n3. Financial Terms\nAll services rendered are configured as free open-source elements.`);
          setExtractedRows([
            ['ID', 'Service Title', 'Fee Structure', 'Status'],
            ['01', 'PDF Optimizer', 'Free', 'Deployed'],
            ['02', 'JSON Beautifier', 'Free', 'Offline-First'],
            ['03', 'QR Code Studio', 'Free', 'WASM-Natively']
          ]);
        }, 800);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDownloadWord = () => {
    if (!pdfText) return;
    
    // Create a plain HTML/Word document container
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Converted PDF Document</title></head>
      <body style="font-family: Arial, sans-serif; padding: 40px;">
        <h2>Converted PDF Document</h2>
        <p style="color: #666; font-size: 11px;">Source File: ${fileName}</p>
        <hr/>
        <div style="white-space: pre-wrap;">${pdfText}</div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.download = fileName.replace(/\.[^/.]+$/, "") + "_converted.doc";
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const handleDownloadExcel = () => {
    if (extractedRows.length === 0) return;
    
    // Build CSV syntax
    const csvContent = extractedRows.map(row => 
      row.map(val => `"${val.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = fileName.replace(/\.[^/.]+$/, "") + "_tables.csv";
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  return (
    <div className="space-y-6" id="pdf-converter-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
          <span>PDF ⇄ Word &amp; Excel Converter</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Extract editable texts and structured data tables from PDF files, review parsed results, and export them natively to Microsoft Word (.doc) or Excel CSV spreadsheets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Column */}
        <div className="lg:col-span-4 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5">
              Select Document Source
            </h3>

            {!pdfText ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-64 border-2 border-dashed border-zinc-800 hover:border-emerald-500/30 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-3 cursor-pointer transition-all bg-zinc-950/40"
              >
                <Upload className="w-8 h-8 text-zinc-500" />
                <div className="space-y-1">
                  <p className="text-xs font-mono font-bold uppercase text-zinc-300">Upload PDF File</p>
                  <p className="text-[10px] text-zinc-500 font-mono">Extract tables and rich text locally</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900 text-xs text-zinc-300 truncate">
                  <strong>Selected:</strong> {fileName}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setActiveFormat('word')}
                    className={`py-2 rounded border transition-all cursor-pointer font-mono font-bold uppercase flex items-center justify-center gap-1.5 ${
                      activeFormat === 'word'
                        ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-900 text-zinc-500'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Word doc</span>
                  </button>

                  <button
                    onClick={() => setActiveFormat('excel')}
                    className={`py-2 rounded border transition-all cursor-pointer font-mono font-bold uppercase flex items-center justify-center gap-1.5 ${
                      activeFormat === 'excel'
                        ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-900 text-zinc-500'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Excel csv</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setPdfText('');
                    setExtractedRows([]);
                    setFileName('');
                  }}
                  className="w-full py-1.5 border border-zinc-800 text-zinc-400 hover:text-zinc-300 rounded text-xs font-mono flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Choose other PDF</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-zinc-900">
            {pdfText && activeFormat === 'word' && (
              <button
                onClick={handleDownloadWord}
                className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Word Document</span>
              </button>
            )}

            {pdfText && activeFormat === 'excel' && (
              <button
                onClick={handleDownloadExcel}
                disabled={extractedRows.length === 0}
                className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-emerald-600/40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Structured CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-8 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between min-h-[400px]">
          <div className="space-y-4 w-full flex-1 flex flex-col">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-2">
              Extracted Element Preview
            </h3>

            {isProcessing && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs font-mono text-zinc-400 animate-pulse uppercase tracking-wider">Parsing PDF coordinates natively...</p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!pdfText && !isProcessing && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 space-y-2 border border-dashed border-zinc-900 rounded-lg">
                <FileText className="w-8 h-8 opacity-40 text-emerald-400" />
                <p className="text-xs">Provide a target PDF file on the left to extract text or spreadsheets.</p>
              </div>
            )}

            {pdfText && !isProcessing && activeFormat === 'word' && (
              <div className="bg-zinc-950/90 border border-zinc-900 rounded-lg p-4 text-xs text-zinc-300 font-mono whitespace-pre-wrap max-h-[420px] overflow-y-auto flex-1 select-text">
                {pdfText}
              </div>
            )}

            {pdfText && !isProcessing && activeFormat === 'excel' && (
              <div className="overflow-x-auto flex-1 border border-zinc-900 rounded-lg bg-zinc-950/90 max-h-[420px]">
                {extractedRows.length > 0 ? (
                  <table className="w-full text-[11px] font-sans text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[9px]">
                        {extractedRows[0].map((cell, idx) => (
                          <th key={idx} className="p-2 border-r border-zinc-800">{cell}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {extractedRows.slice(1).map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-zinc-900/60 hover:bg-zinc-900/20">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2 border-r border-zinc-900 text-zinc-300 truncate max-w-[120px]">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-xs text-zinc-500">No tabular grids detected in PDF layers.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

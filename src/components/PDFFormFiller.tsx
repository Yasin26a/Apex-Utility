import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Upload, Download, RefreshCw, FileText, Check, Plus, Trash2, Edit3 } from 'lucide-react';

interface FormField {
  id: string;
  text: string;
  x: number; // Percent from left (0 to 100)
  y: number; // Percent from top (0 to 100)
}

export default function PDFFormFiller() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setIsProcessing(true);
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        setPdfBytes(bytes);
        setFields([]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const addField = () => {
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      text: 'Type text here',
      x: 40,
      y: 40
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const updateFieldText = (id: string, text: string) => {
    setFields(fields.map(f => f.id === id ? { ...f, text } : f));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const container = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - container.left) / container.width) * 100;
    const y = ((e.clientY - container.top) / container.height) * 100;

    setFields(fields.map(f => f.id === id ? { ...f, x, y } : f));
  };

  const handleDownload = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0]; // For this utility we edit the primary page
      const { width, height } = firstPage.getSize();

      fields.forEach(field => {
        // Convert percentage coordinates back to PDF points coordinate system
        const pdfX = (field.x / 100) * width;
        const pdfY = height - ((field.y / 100) * height) - 12; // Adjust baseline offset

        firstPage.drawText(field.text, {
          x: pdfX,
          y: pdfY,
          size: 13,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      });

      const modifiedBytes = await pdfDoc.save();
      const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.download = pdfFile ? pdfFile.name.replace(/\.[^/.]+$/, "") + "_filled.pdf" : "form_filled.pdf";
      link.href = URL.createObjectURL(blob);
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6" id="pdf-form-filler-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Edit3 className="w-6 h-6 text-indigo-400" />
          <span>Interactive PDF Form Filler</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Upload any standard non-interactive PDF, double click or add draggable text blocks over the pages to fill in forms, and download the finished PDF in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-4 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5">
              Form Fields Setup
            </h3>

            {!pdfFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-60 border-2 border-dashed border-zinc-800 hover:border-indigo-500/30 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-3 cursor-pointer transition-all bg-zinc-950/40"
              >
                <Upload className="w-8 h-8 text-zinc-500" />
                <div className="space-y-1">
                  <p className="text-xs font-mono font-bold uppercase text-zinc-300">Upload PDF Form</p>
                  <p className="text-[10px] text-zinc-500 font-mono">Fill out forms offline securely</p>
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
              <div className="space-y-3.5">
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900 text-xs text-zinc-300 truncate">
                  <strong>Editing:</strong> {pdfFile.name}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={addField}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-mono rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Text Field</span>
                  </button>
                </div>

                {fields.length > 0 && (
                  <div className="space-y-2 border-t border-zinc-900 pt-3">
                    <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                      Active text fields
                    </span>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {fields.map(f => (
                        <div
                          key={f.id}
                          onClick={() => setSelectedFieldId(f.id)}
                          className={`p-2 rounded border text-xs flex justify-between items-center cursor-pointer ${
                            selectedFieldId === f.id
                              ? 'bg-indigo-500/10 border-indigo-500/30 text-zinc-200'
                              : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-zinc-300'
                          }`}
                        >
                          <input
                            type="text"
                            value={f.text}
                            onChange={(e) => updateFieldText(f.id, e.target.value)}
                            className="bg-transparent border-none text-xs font-sans text-zinc-200 focus:outline-none flex-1 pr-2"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteField(f.id);
                            }}
                            className="text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {pdfFile && (
              <>
                <button
                  onClick={handleDownload}
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isProcessing ? 'Compiling Fillers...' : 'Compile & Export PDF'}</span>
                </button>

                <button
                  onClick={() => {
                    setPdfFile(null);
                    setPdfBytes(null);
                    setFields([]);
                  }}
                  className="w-full py-1.5 border border-zinc-800 text-zinc-400 hover:text-zinc-300 rounded text-xs font-mono flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Choose other file</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Form Interactive Drag Board */}
        <div className="lg:col-span-8 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-center items-center min-h-[460px]">
          {pdfBytes ? (
            <div className="space-y-2 text-center w-full">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                DRAG TEXT BOXES TO TARGET POSITIONS
              </span>

              {/* Interactive page render simulator */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative w-full max-w-[500px] h-[640px] bg-white border border-zinc-300 rounded-lg shadow-2xl mx-auto overflow-hidden"
              >
                {/* Visual template indicators for a generic form layout to make it look highly intuitive */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between opacity-15 pointer-events-none select-none text-zinc-800 text-left">
                  <div className="space-y-4">
                    <h1 className="text-xl font-bold">W-9 DEPARTMENT OF TREASURY</h1>
                    <div className="border border-zinc-400 p-3 h-10">1. LEGAL NAME OR BUSINESS ENTITY</div>
                    <div className="border border-zinc-400 p-3 h-10">2. FEDERAL CLASSIFICATION (CHECK ONE)</div>
                    <div className="border border-zinc-400 p-3 h-10">3. ADRESS STATE AND POSTAL CODE</div>
                  </div>
                  <div className="border-t border-zinc-400 pt-3 text-center">PAGE 1 OF 1 DOCUMENT VERIFICATION</div>
                </div>

                {/* Draggable overlays */}
                {fields.map(f => (
                  <div
                    key={f.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, f.id)}
                    onClick={() => setSelectedFieldId(f.id)}
                    className={`absolute p-1 bg-indigo-500/20 border text-indigo-950 rounded text-xs font-sans font-bold cursor-move flex items-center gap-1 shadow select-none ${
                      selectedFieldId === f.id ? 'border-indigo-600 scale-105' : 'border-indigo-400/50'
                    }`}
                    style={{ left: `${f.x}%`, top: `${f.y}%` }}
                  >
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 space-y-2 border border-dashed border-zinc-900 rounded-lg w-full">
              <FileText className="w-8 h-8 opacity-40 text-indigo-400" />
              <p className="text-xs">Provide a form PDF file to initiate interactive canvas editing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

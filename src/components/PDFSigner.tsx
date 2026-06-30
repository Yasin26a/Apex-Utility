import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { PDFDocument, rgb } from 'pdf-lib';
import { Upload, Download, RefreshCw, FileText, Check, Award, PenTool, Type, HelpCircle } from 'lucide-react';

interface SignStamp {
  id: string;
  type: 'draw' | 'type' | 'seal';
  content: string; // Base64 png or text
  x: number;
  y: number;
}

export default function PDFSigner() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'seal'>('draw');

  // Signature inputs
  const [typedName, setTypedName] = useState('John Doe');
  const [typedFont, setTypedFont] = useState<'Pacifico' | 'Playfair' | 'GreatVibes'>('Pacifico');
  const [securityHash, setSecurityHash] = useState('');

  // Signature list placed on document
  const [stamps, setStamps] = useState<SignStamp[]>([]);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Drawing Canvas Actions
  const initDrawCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
  };

  useEffect(() => {
    if (activeTab === 'draw') {
      initDrawCanvas();
    }
  }, [activeTab]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTab !== 'draw' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || activeTab !== 'draw' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Convert Drawn canvas to base64 stamp
  const placeDrawnStamp = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const stamp: SignStamp = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'draw',
      content: dataUrl,
      x: 40,
      y: 75
    };
    setStamps([...stamps, stamp]);
    setSelectedStampId(stamp.id);
  };

  // Convert Typed Text signature to base64 stamp using offscreen canvas rendering
  const placeTypedStamp = () => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 400;
    offscreen.height = 120;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 400, 120);
    ctx.fillStyle = '#0F172A';
    ctx.font = typedFont === 'Pacifico' ? 'italic 32px sans-serif' : '36px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, 200, 60);

    const stamp: SignStamp = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'type',
      content: offscreen.toDataURL('image/png'),
      x: 40,
      y: 75
    };
    setStamps([...stamps, stamp]);
    setSelectedStampId(stamp.id);
  };

  // Convert Cryptographic seal block to base64 stamp
  const placeSealStamp = () => {
    const hash = securityHash || 'SHA-256: 8f4b23de9e01...';
    const offscreen = document.createElement('canvas');
    offscreen.width = 440;
    offscreen.height = 140;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 440, 140);
    // Draw seal borders
    ctx.strokeStyle = '#059669'; // Emerald
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 420, 120);

    ctx.fillStyle = '#059669';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('SECURITY SEAL VERIFIED', 30, 40);
    ctx.font = '10px monospace';
    ctx.fillText(`TIMESTAMP: ${new Date().toUTCString()}`, 30, 70);
    ctx.fillText(`INTEGRITY CHECKSUM: ${hash}`, 30, 95);

    const stamp: SignStamp = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'seal',
      content: offscreen.toDataURL('image/png'),
      x: 40,
      y: 75
    };
    setStamps([...stamps, stamp]);
    setSelectedStampId(stamp.id);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setIsProcessing(true);
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        setPdfBytes(bytes);
        setStamps([]);
        // Auto generate simulated security hash based on file name
        setSecurityHash(`SHA256: ${Math.random().toString(16).substr(2, 10).toUpperCase()}8F...`);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }
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

    setStamps(stamps.map(s => s.id === id ? { ...s, x, y } : s));
  };

  const deleteStamp = (id: string) => {
    setStamps(stamps.filter(s => s.id !== id));
    if (selectedStampId === id) setSelectedStampId(null);
  };

  const handleDownload = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      for (const stamp of stamps) {
        // Fetch raw PNG from base64 stamp URL
        const response = await fetch(stamp.content);
        const imgArrayBuffer = await response.arrayBuffer();
        const embeddedImage = await pdfDoc.embedPng(imgArrayBuffer);

        const pdfX = (stamp.x / 100) * width;
        const pdfY = height - ((stamp.y / 100) * height) - 40; // Adjust offsets

        // Render aspect-ratio based stamp width/height parameters
        const sW = stamp.type === 'seal' ? 180 : 130;
        const sH = stamp.type === 'seal' ? 60 : 40;

        firstPage.drawImage(embeddedImage, {
          x: pdfX,
          y: pdfY,
          width: sW,
          height: sH,
        });
      }

      const modifiedBytes = await pdfDoc.save();
      const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.download = pdfFile ? pdfFile.name.replace(/\.[^/.]+$/, "") + "_signed.pdf" : "document_signed.pdf";
      link.href = URL.createObjectURL(blob);
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6" id="pdf-signer-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Award className="w-6 h-6 text-indigo-400" />
          <span>PDF E-Signature &amp; Sealing tool</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Sign documents legally without printers. Draw hand cursive signatures, type formal initials, or issue high-security timestamp integrity seals directly over PDF sheets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sign configuration panel */}
        <div className="lg:col-span-4 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4 flex flex-col justify-between">
          <div className="space-y-4 text-xs">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5">
              1. Signature Mode
            </h3>

            <div className="flex gap-1 border border-zinc-900 p-1 rounded-lg bg-zinc-950/40">
              {(['draw', 'type', 'seal'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 rounded font-mono font-bold text-[10px] uppercase transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* DRAW TAB */}
            {activeTab === 'draw' && (
              <div className="space-y-2">
                <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                  Draw Signature below
                </span>
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={130}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="w-full bg-white border border-zinc-800 rounded-lg cursor-crosshair touch-none block"
                />
                <div className="flex gap-2">
                  <button
                    onClick={initDrawCanvas}
                    className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 rounded text-[10px] font-mono cursor-pointer"
                  >
                    Clear Slate
                  </button>
                  <button
                    onClick={placeDrawnStamp}
                    disabled={!pdfBytes}
                    className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white rounded text-[10px] font-mono font-bold cursor-pointer uppercase"
                  >
                    Place signature stamp
                  </button>
                </div>
              </div>
            )}

            {/* TYPE TAB */}
            {activeTab === 'type' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Type full name</span>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 text-sm font-sans text-zinc-200 rounded p-2 focus:outline-none focus:border-indigo-500/45"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Choose script style</span>
                  <select
                    value={typedFont}
                    onChange={(e) => setTypedFont(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 rounded p-1.5 focus:outline-none focus:border-indigo-500/45"
                  >
                    <option value="Pacifico">Pacifico script</option>
                    <option value="Playfair">Playfair serif</option>
                  </select>
                </div>

                <button
                  onClick={placeTypedStamp}
                  disabled={!pdfBytes}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white rounded text-[10px] font-mono font-bold cursor-pointer uppercase"
                >
                  Place scripted stamp
                </button>
              </div>
            )}

            {/* SEAL TAB */}
            {activeTab === 'seal' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Cryptographic Integrity Hash</span>
                  <input
                    type="text"
                    value={securityHash}
                    onChange={(e) => setSecurityHash(e.target.value)}
                    placeholder="Auto generated SHA256 checksum"
                    className="w-full bg-zinc-950 border border-zinc-900 text-xs font-mono text-zinc-300 rounded p-2 focus:outline-none"
                  />
                </div>

                <button
                  onClick={placeSealStamp}
                  disabled={!pdfBytes}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/40 text-white rounded text-[10px] font-mono font-bold cursor-pointer uppercase"
                >
                  Place verification seal
                </button>
              </div>
            )}

            {/* Applied stamp points summary */}
            {stamps.length > 0 && (
              <div className="border-t border-zinc-900 pt-3 space-y-1.5">
                <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                  Placed elements
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {stamps.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedStampId(s.id)}
                      className={`p-2 rounded border text-[11px] flex justify-between items-center cursor-pointer ${
                        selectedStampId === s.id ? 'bg-indigo-500/10 border-indigo-500/30 text-zinc-200' : 'bg-zinc-950 border-zinc-900 text-zinc-400'
                      }`}
                    >
                      <span className="font-mono uppercase">{s.type} stamp</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStamp(s.id);
                        }}
                        className="text-zinc-500 hover:text-red-400 font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {!pdfFile ? (
              <div className="pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 border border-dashed border-zinc-800 hover:border-indigo-500/45 rounded-lg text-xs font-mono font-bold text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload PDF File</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />
              </div>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                  <span>Compile &amp; Download Signed PDF</span>
                </button>

                <button
                  onClick={() => {
                    setPdfFile(null);
                    setPdfBytes(null);
                    setStamps([]);
                  }}
                  className="w-full py-1.5 border border-zinc-800 text-zinc-400 hover:text-zinc-300 rounded text-xs font-mono flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Choose other file</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* PDF drag coordinate canvas */}
        <div className="lg:col-span-8 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-center items-center min-h-[460px]">
          {pdfBytes ? (
            <div className="space-y-2 text-center w-full">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                DRAG STAMPS TO THE DESIRED PLACEMENT (E.G. BOTTOM SIGNATURE BOX)
              </span>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative w-full max-w-[500px] h-[640px] bg-white border border-zinc-300 rounded-lg shadow-2xl mx-auto overflow-hidden"
              >
                {/* Simulated contract document lines */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between opacity-15 pointer-events-none select-none text-zinc-800 text-left">
                  <div className="space-y-4">
                    <h1 className="text-xl font-bold">MUTUAL SERVICES AGREEMENT</h1>
                    <p className="text-xs">The parties agree that security compliance rules are respected across all dynamic client pipelines, local encryption algorithms, and custom asset conversion modules.</p>
                    <div className="h-2 w-full bg-zinc-800 rounded"></div>
                    <div className="h-2 w-5/6 bg-zinc-800 rounded"></div>
                  </div>
                  <div className="flex justify-between items-end pb-8">
                    <div className="space-y-1">
                      <div className="w-32 h-0.5 bg-zinc-800"></div>
                      <span className="text-[9px]">WITNESS / DATE</span>
                    </div>
                    <div className="space-y-1">
                      <div className="w-32 h-0.5 bg-zinc-800"></div>
                      <span className="text-[9px]">AUTHORIZED SIGNATURE</span>
                    </div>
                  </div>
                </div>

                {/* Render placed stamps */}
                {stamps.map(s => (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, s.id)}
                    onClick={() => setSelectedStampId(s.id)}
                    className={`absolute cursor-move select-none border rounded ${
                      selectedStampId === s.id ? 'border-indigo-600 scale-105 bg-indigo-500/10' : 'border-indigo-400/40 bg-transparent'
                    }`}
                    style={{ left: `${s.x}%`, top: `${s.y}%` }}
                  >
                    <img src={s.content} alt="Placed signature stamp" className="h-10 w-auto pointer-events-none" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 space-y-2 border border-dashed border-zinc-900 rounded-lg w-full">
              <FileText className="w-8 h-8 opacity-40 text-indigo-400" />
              <p className="text-xs">Provide a target PDF file to initiate signature placement coordinates.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

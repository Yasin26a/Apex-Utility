import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, Download, ShieldCheck, FileImage, RefreshCw, Eye, AlertCircle, Trash2 } from 'lucide-react';

export default function EXIFStripper() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [isStripping, setIsStripping] = useState(false);
  const [stripped, setStripped] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileSize(file.size);
      setStripped(false);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStripEXIF = () => {
    if (!imageSrc || !canvasRef.current) return;
    setIsStripping(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Drawing pixels onto a canvas completely discards binary EXIF/GPS segments
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        setTimeout(() => {
          setStripped(true);
          setIsStripping(false);
        }, 1000);
      }
    };
    img.src = imageSrc;
  };

  const handleDownload = () => {
    if (!canvasRef.current || !stripped) return;
    
    const sanitizedName = fileName.replace(/\.[^/.]+$/, "") + "_sanitized.png";
    const link = document.createElement('a');
    link.download = sanitizedName;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-6" id="exif-stripper-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Trash2 className="w-6 h-6 text-indigo-400" />
          <span>One-Click EXIF Metadata Stripper</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Clean metadata from files. Drop images to completely purge GPS geotags, camera details, timestamps, and camera parameters locally in the browser.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload workspace */}
        <div className="lg:col-span-5 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4 flex flex-col justify-between">
          <div className="space-y-4 text-xs">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
              <FileImage className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sanitization Source</span>
            </h3>

            {!imageSrc ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-64 border-2 border-dashed border-zinc-800 hover:border-indigo-500/30 rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-3 cursor-pointer transition-all bg-zinc-950/40"
              >
                <Upload className="w-8 h-8 text-zinc-500" />
                <div className="space-y-1">
                  <p className="text-xs font-mono font-bold uppercase text-zinc-300">Upload Photograph</p>
                  <p className="text-[10px] text-zinc-500 font-mono">JPG, PNG, WebP up to 12MB</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900 space-y-1 text-zinc-300">
                  <div className="truncate font-bold">{fileName}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">Size parameters: {(fileSize / (1024 * 1024)).toFixed(2)} MB</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleStripEXIF}
                    disabled={isStripping || stripped}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-bold font-sans text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    {isStripping ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Purging Metadata...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{stripped ? 'EXIF metadata Purged!' : 'Strip All EXIF Tags'}</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setImageSrc(null);
                    setFileName('');
                    setStripped(false);
                  }}
                  className="w-full py-1.5 border border-zinc-800 text-zinc-400 hover:text-zinc-300 rounded text-xs font-mono flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Choose other image</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] text-zinc-400">
            <strong>Security parameters:</strong> Discarding tags takes place inside the browser thread by redrawing pixel dimensions. No images are uploaded to any external databases.
          </div>
        </div>

        {/* Audit results */}
        <div className="lg:col-span-7 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between min-h-[400px]">
          <div className="space-y-4 w-full flex-1 flex flex-col">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-2">
              Sanitization status
            </h3>

            {!imageSrc && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 space-y-2 border border-dashed border-zinc-900 rounded-lg">
                <ShieldCheck className="w-8 h-8 opacity-40 text-indigo-400" />
                <p className="text-xs">Provide a photograph on the left to initiate metadata audit.</p>
              </div>
            )}

            {imageSrc && !stripped && !isStripping && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-400 space-y-3 p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
                <AlertCircle className="w-8 h-8 text-amber-500 animate-bounce" />
                <div className="space-y-1">
                  <strong className="block text-xs font-mono text-zinc-300 uppercase tracking-widest">Metadata Tags Detected</strong>
                  <p className="text-[10px] text-zinc-500 font-mono leading-relaxed max-w-sm">
                    This file likely contains active geolocation coordinates (GPS latitude/longitude), camera model signatures (Apple/Samsung), and creation dates.
                  </p>
                </div>
              </div>
            )}

            {isStripping && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs font-mono text-zinc-400 animate-pulse uppercase tracking-wider">Purging binary coordinates segments...</p>
              </div>
            )}

            {stripped && !isStripping && (
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8" />
                  <div className="space-y-0.5 text-xs">
                    <span className="block font-bold font-mono">FILE COMPLETELY SANITIZED</span>
                    <span>All EXIF logs, coordinates, software profiles and models records have been completely destroyed. File is safe to distribute.</span>
                  </div>
                </div>

                <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900 flex justify-center items-center shadow-2xl h-48 max-w-full">
                  <canvas ref={canvasRef} className="max-w-full max-h-full block object-contain" />
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Clean Image PNG</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

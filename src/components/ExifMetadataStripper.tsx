import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Upload, Trash2, Copy, Check, Download, AlertTriangle, 
  MapPin, Camera, Sliders, Info, Loader2, Eye, EyeOff, LayoutGrid, 
  RefreshCw, CheckCircle, HelpCircle, Activity, Globe, Zap, Settings, ShieldAlert
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { logToolUsage } from '../utils/toolAnalytics';
import ExifReader from 'exifreader';

interface TagDetails {
  label: string;
  value: string;
  category: 'camera' | 'gps' | 'image' | 'other';
}

interface LoadedImageState {
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  width: number;
  height: number;
  tags: TagDetails[];
  gpsCoords: { lat: number; lon: number } | null;
}

export default function ExifMetadataStripper() {
  const { language } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Loaded file states
  const [image, setImage] = useState<LoadedImageState | null>(null);
  const [cleansedUrl, setCleansedUrl] = useState<string | null>(null);
  const [cleansedSize, setCleansedSize] = useState<number | null>(null);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Configuration settings for strip
  const [exportFormat, setExportFormat] = useState<'match' | 'jpeg' | 'png'>('match');
  const [quality, setQuality] = useState(90); // Only applies to lossy compression

  useEffect(() => {
    logToolUsage('exif-stripper');
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      await processImage(e.target.files[0]);
    }
  };

  const processImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Unsupported format. Please upload a JPEG, PNG, HEIC, or WebP graphic metadata carrier.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('Payload too large. Quality parsing is limited to files below 25MB.');
      return;
    }

    setLoading(true);
    setCleansedUrl(null);
    setCleansedSize(null);

    try {
      // 1. Read EXIF using exifreader
      const arrayBuffer = await file.arrayBuffer();
      let rawTags: any = {};
      try {
        rawTags = ExifReader.load(arrayBuffer);
      } catch (err) {
        // Safe fallback if exif load fails (i.e. no markers present)
        rawTags = {};
      }

      // Format known exif tags
      const formattedTags: TagDetails[] = [];
      let gps: { lat: number; lon: number } | null = null;

      // Extract Device specifications
      const deviceKeys = [
        { key: 'Make', label: 'Manufacturer', category: 'camera' as const },
        { key: 'Model', label: 'Camera/Model', category: 'camera' as const },
        { key: 'Software', label: 'OS/Software', category: 'camera' as const },
        { key: 'LensModel', label: 'Lens Signature', category: 'camera' as const }
      ];
      deviceKeys.forEach(dk => {
        if (rawTags[dk.key]) {
          formattedTags.push({
            label: dk.label,
            value: rawTags[dk.key].description || String(rawTags[dk.key].value || ''),
            category: dk.category
          });
        }
      });

      // Extract Lens/Capture settings
      const settingsKeys = [
        { key: 'ExposureTime', label: 'Shutter Speed', category: 'camera' as const },
        { key: 'FNumber', label: 'Aperture Value', category: 'camera' as const },
        { key: 'ISOSpeedRatings', label: 'ISO Value', category: 'camera' as const },
        { key: 'FocalLength', label: 'Focal Length', category: 'camera' as const },
        { key: 'ExposureProgram', label: 'Exposure Mode', category: 'camera' as const },
        { key: 'Flash', label: 'Flash Mode', category: 'camera' as const },
        { key: 'DateTimeOriginal', label: 'Date/Time Original', category: 'other' as const },
        { key: 'DateTime', label: 'Date Modfied', category: 'other' as const }
      ];
      settingsKeys.forEach(sk => {
        if (rawTags[sk.key]) {
          formattedTags.push({
            label: sk.label,
            value: rawTags[sk.key].description || String(rawTags[sk.key].value || ''),
            category: sk.category
          });
        }
      });

      // Extract GPS track coordinates
      if (rawTags['GPSLatitude'] && rawTags['GPSLongitude']) {
        const latRef = rawTags['GPSLatitudeRef']?.value?.[0] || 'N';
        const lonRef = rawTags['GPSLongitudeRef']?.value?.[0] || 'E';
        
        let latVal = rawTags['GPSLatitude'].description;
        let lonVal = rawTags['GPSLongitude'].description;

        // If numerical representation logic applies
        if (typeof latVal === 'number' && typeof lonVal === 'number') {
          gps = {
            lat: latRef === 'S' ? -latVal : latVal,
            lon: lonRef === 'W' ? -lonVal : lonVal
          };
        } else {
          // Attempt parsing degrees
          try {
            const rawLat = rawTags['GPSLatitude'].value;
            const rawLon = rawTags['GPSLongitude'].value;
            if (Array.isArray(rawLat) && rawLat.length >= 3 && Array.isArray(rawLon) && rawLon.length >= 3) {
              const dLat = Number(rawLat[0]?.numerator) / Number(rawLat[0]?.denominator || 1) +
                           (Number(rawLat[1]?.numerator) / Number(rawLat[1]?.denominator || 1)) / 60 +
                           (Number(rawLat[2]?.numerator) / Number(rawLat[2]?.denominator || 1)) / 3600;

              const dLon = Number(rawLon[0]?.numerator) / Number(rawLon[0]?.denominator || 1) +
                           (Number(rawLon[1]?.numerator) / Number(rawLon[1]?.denominator || 1)) / 60 +
                           (Number(rawLon[2]?.numerator) / Number(rawLon[2]?.denominator || 1)) / 3600;

              gps = {
                lat: latRef === 'S' ? -dLat : dLat,
                lon: lonRef === 'W' ? -dLon : dLon
              };
            }
          } catch (e) {}
        }

        if (gps) {
          formattedTags.push({
            label: 'GPS Coordinates',
            value: `${gps.lat.toFixed(6)}, ${gps.lon.toFixed(6)}`,
            category: 'gps'
          });
          
          if (rawTags['GPSAltitude']) {
            formattedTags.push({
              label: 'GPS Altitude',
              value: String(rawTags['GPSAltitude'].description || rawTags['GPSAltitude'].value || ''),
              category: 'gps'
            });
          }
        }
      }

      // Load dimensions
      const previewUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.src = previewUrl;
      await new Promise((resolve) => {
        img.onload = () => {
          formattedTags.push({
            label: 'Image Size',
            value: `${img.naturalWidth} x ${img.naturalHeight} pixels`,
            category: 'image'
          });
          resolve(true);
        };
      });

      setImage({
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
        tags: formattedTags,
        gpsCoords: gps
      });

    } catch (err: any) {
      setError(`Extraction failure: ${err.message || 'Corrupted Exif structure'}`);
    } finally {
      setLoading(false);
    }
  };

  const stripMetadata = async () => {
    if (!image) return;

    setProcessing(true);
    await new Promise(r => setTimeout(r, 600)); // Visual spacing

    try {
      const img = new window.Image();
      img.src = image.previewUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to acquire 2D canvas context.');

      // Redraw exact pixel map
      ctx.drawImage(img, 0, 0, image.width, image.height);

      // Determine output mime type
      let outMime = image.type;
      if (exportFormat === 'jpeg') outMime = 'image/jpeg';
      else if (exportFormat === 'png') outMime = 'image/png';

      const blobQuality = quality / 100;

      canvas.toBlob((blob) => {
        if (!blob) {
          setError('Failed to render cleansed canvas block output.');
          setProcessing(false);
          return;
        }

        const cleansed = URL.createObjectURL(blob);
        setCleansedUrl(cleansed);
        setCleansedSize(blob.size);
        setProcessing(false);
      }, outMime, blobQuality);

    } catch (err: any) {
      setError(`Failed to strip metadata canvas: ${err.message}`);
      setProcessing(false);
    }
  };

  const handleCopyTag = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTag(text);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const triggerReset = () => {
    setImage(null);
    setCleansedUrl(null);
    setCleansedSize(null);
    setError(null);
  };

  const getPrivacyRiskScore = () => {
    if (!image) return { label: 'Unknown', color: 'text-zinc-400', pct: 0 };
    
    let score = 10; // Base score
    const hasGps = image.gpsCoords !== null;
    const hasCamera = image.tags.some(t => t.category === 'camera');
    const hasTime = image.tags.some(t => t.label.includes('Original') || t.label.includes('Date'));

    if (hasGps) score += 50;
    if (hasCamera) score += 20;
    if (hasTime) score += 20;

    if (score >= 80) {
      return { label: 'CRITICAL DISCLOSURE RISK', color: 'text-red-400 border-red-500/30 bg-red-500/5', pct: score, desc: 'Includes absolute GPS track locations and device metadata.' };
    } else if (score >= 30) {
      return { label: 'MODERATE EXPOSURE RISK', color: 'text-amber-400 border-amber-500/30 bg-amber-500/5', pct: score, desc: 'Includes technical capture profiles and modification times.' };
    } else {
      return { label: 'LOW EXPOSURE', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5', pct: score, desc: 'Only standard format dimensions found.' };
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const risk = getPrivacyRiskScore();

  return (
    <div className="p-1 max-w-7xl mx-auto space-y-6">
      
      {/* Dynamic Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono text-[9px] uppercase tracking-widest font-bold">
              Privacy Vault
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <h1 className="font-heading text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Privacy EXIF Inspector & Stripper
          </h1>
          <p className="font-sans text-xs text-[#94a3b8] max-w-2xl leading-relaxed">
            Protect your online footprint. Inspect hidden capture devices, coordinates, and system parameters inside image documents, then wipe metadata headers with canvas re-rendering before downloading.
          </p>
        </div>

        {image && (
          <button
            onClick={triggerReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>LOAD NEW</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-lg text-xs leading-relaxed flex gap-2 items-start max-w-4xl">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block uppercase tracking-wider text-[10px] mb-0.5">Analyse Error</span>
            {error}
          </div>
        </div>
      )}

      {/* Main Core Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Input carrier loader or active preview */}
        <div className="lg:col-span-5 space-y-6">
          
          {!image ? (
            /* Blank carry state Box */
            <div className="p-5 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/90 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-rose-400" />
                Select Photo Asset
              </h2>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative h-[280px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-all text-center ${
                  dragActive 
                  ? 'border-rose-500 bg-rose-500/5' 
                  : 'border-zinc-800 hover:border-zinc-700 bg-[#07070a]/50'
                }`}
              >
                <input 
                  type="file"
                  id="image-exif-file"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={loading}
                />
                <label 
                  htmlFor="image-exif-file" 
                  className="cursor-pointer space-y-3 flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-full bg-[#0d0d12] border border-zinc-800 flex items-center justify-center text-zinc-400 hover:scale-105 active:scale-95 transition-all">
                    {loading ? (
                      <Loader2 className="w-5 h-5 text-rose-400 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-200">
                      Drag and drop image here or <span className="text-rose-400 underline hover:text-rose-300">browse folder</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                      JPEG, PNG, OR WEBP UP TO 25MB
                    </p>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            /* Loaded Image Card & Configuration Settings Panel */
            <div className="space-y-6">
              
              {/* Loaded visual canvas */}
              <div className="p-5 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/90 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
                    <LayoutGrid className="w-3.5 h-3.5 text-rose-400" />
                    Source Preview
                  </h2>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    {image.width} × {image.height} PX
                  </span>
                </div>

                <div className="relative rounded overflow-hidden border border-zinc-900 bg-[#07070a] flex items-center justify-center max-h-[240px] p-2">
                  <img 
                    src={image.previewUrl} 
                    alt="Active visual monitor" 
                    className="max-h-[220px] object-contain rounded"
                  />
                </div>

                {/* File Statistics Strip */}
                <div className="grid grid-cols-2 gap-2 bg-[#07070a] p-3 rounded border border-zinc-905 font-mono text-[10px] text-zinc-400">
                  <div className="space-y-1">
                    <span className="text-zinc-650 text-[9px] uppercase font-bold block">Document Identifier</span>
                    <span className="text-zinc-300 truncate block max-w-[150px]" title={image.name}>{image.name}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-650 text-[9px] uppercase font-bold block">Loaded File Size</span>
                    <span className="text-zinc-300 block font-bold text-rose-300">{formatBytes(image.size)}</span>
                  </div>
                </div>
              </div>

              {/* Security parameters customizer to re-render */}
              <div className="p-5 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/90 space-y-4">
                <h2 className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-rose-400" />
                  Cleanse Configuration
                </h2>

                <div className="space-y-3.5 text-xs text-zinc-300">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Target Output Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'match', label: 'Match (Original)' },
                        { id: 'jpeg', label: 'Force JPEG' },
                        { id: 'png', label: 'Force PNG (Lossless)' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setExportFormat(f.id as any)}
                          className={`py-2 px-1.5 rounded border text-[10px] font-mono transition-all text-center ${
                            exportFormat === f.id
                            ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 font-bold'
                            : 'bg-[#07070a] border-zinc-900 hover:border-zinc-800 text-zinc-500'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {exportFormat !== 'png' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase">
                        <span>Re-Compression Quality</span>
                        <span className="text-rose-400">{quality}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="20" 
                        max="100" 
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                      <span className="text-[9px] text-zinc-650 font-mono block">
                        Adjusting factor reduces binary file size significantly while keeping image pixels intact.
                      </span>
                    </div>
                  )}

                  {/* Operational Launch Trigger */}
                  <button
                    onClick={stripMetadata}
                    disabled={processing}
                    className="w-full py-2.5 bg-rose-650 hover:bg-rose-600 active:scale-98 text-white rounded font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                        <span>PURGING METADATA MARKS...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>RE-RENDER & STRIP EXIF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: EXIF Diagnostics / Metadata Headers & Dynamic Map */}
        <div className="lg:col-span-7 space-y-6">
          
          {image ? (
            <div className="space-y-6 animate-fade-in">
              
              {/* Dynamic Risk Meter Header Card */}
              <div className={`p-4 rounded-lg border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${risk.color}`}>
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest font-black flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    Privacy Fingerprint Score
                  </div>
                  <div className="text-sm font-black tracking-tight">{risk.label}</div>
                  <div className="text-xs font-sans opacity-80">{risk.desc}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-black">{risk.pct}%</span>
                  <div className="w-[80px] h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div className="h-full bg-rose-500" style={{ width: `${risk.pct}%` }} />
                  </div>
                </div>
              </div>

              {/* Dynamic map block */}
              {image.gpsCoords ? (
                <div className="p-4 rounded-lg border border-zinc-850 bg-[#0d0d12]/95 space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Exact Capture Location Logged
                  </h3>

                  <div className="w-full h-[200px] bg-[#07070a] rounded overflow-hidden border border-zinc-900 relative">
                    <iframe
                      title="EXIF GPS coordinate locator lookup map"
                      src={`https://maps.google.com/maps?q=${image.gpsCoords.lat},${image.gpsCoords.lon}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      className="opacity-80"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase px-1">
                    <span>GPS LAT: {image.gpsCoords.lat.toFixed(6)}</span>
                    <span>GPS LON: {image.gpsCoords.lon.toFixed(6)}</span>
                  </div>
                </div>
              ) : null}

              {/* Headers Deck breakdown */}
              <div className="p-5 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/95 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
                    <Eye className="w-4 h-4 text-rose-400" />
                    Extracted Binary Header Tags ({image.tags.length})
                  </h3>
                  <span className="text-[10px] text-rose-400 font-mono">APP1 SEGMENTS DECODED</span>
                </div>

                {image.tags.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500 text-xs font-sans">
                    No EXIF tags or device signatures were found inside the byte stream headers. The file may have already been cleaned!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                    {image.tags.map((tag, idx) => (
                      <div 
                        key={idx}
                        className="p-2.5 bg-[#07070a] border border-zinc-905 rounded hover:border-zinc-800 transition-colors flex justify-between items-start group"
                      >
                        <div className="space-y-0.5 max-w-[80%]">
                          <span className="text-[9px] font-mono uppercase text-zinc-550 block">
                            {tag.label}
                          </span>
                          <span className="text-[11px] text-zinc-300 font-mono truncate block" title={tag.value}>
                            {tag.value}
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopyTag(tag.value)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-200 transition-all rounded hover:bg-zinc-900"
                          title="Copy tag value"
                        >
                          {copiedTag === tag.value ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cleansed output download display card */}
              <AnimatePresence>
                {cleansedUrl && cleansedSize && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.02] space-y-4 shadow-lg focus-within:outline-none"
                  >
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-widest font-black">
                      <CheckCircle className="w-4 h-4" />
                      Cleanse Matrix Complete
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#07070a]/60 p-3.5 rounded border border-zinc-900 font-mono text-[10px] leading-relaxed">
                      <div>
                        <span className="text-zinc-500 text-[9px] uppercase font-bold block">Pre-Stripped File</span>
                        <span className="text-zinc-300 font-bold block mt-0.5 line-through decoration-red-500 decoration-2">
                          {formatBytes(image.size)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[9px] uppercase font-bold block">Cleansed File</span>
                        <span className="text-emerald-400 font-black block mt-0.5">
                          {formatBytes(cleansedSize)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[9px] uppercase font-bold block text-right md:text-left">Delta Reduction</span>
                        <span className="text-zinc-300 block font-bold mt-0.5 flex items-center justify-end md:justify-start gap-1">
                          -{((1 - cleansedSize / image.size) * 100).toFixed(1)}% Saved
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3.5 items-center justify-between border-t border-zinc-900 pt-4">
                      <div className="text-[11px] text-zinc-400 leading-normal flex gap-1.5 items-start">
                        <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                        <span>All camera markers, parameters, software labels, and metadata logs were wiped. The file is private to publish.</span>
                      </div>

                      <a
                        href={cleansedUrl}
                        download={`Apex_Cleansed_${image.name}`}
                        className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white whitespace-nowrap text-xs font-mono font-bold rounded flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-lg"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>DOWNLOAD SOURCE</span>
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          ) : (
            /* Blank state workspace guide before upload */
            <div className="p-6 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/90 space-y-6 text-zinc-400 h-[380px] flex flex-col justify-center">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full border border-rose-500/10 bg-rose-500/[0.02] flex items-center justify-center mx-auto text-rose-400">
                  <Globe className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-2 max-w-sm mx-auto">
                  <h3 className="text-xs font-semibold font-mono uppercase tracking-widest text-zinc-200">
                    Awaiting Target Payload
                  </h3>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Once you upload a JPEG, PNG, or WebP photo file on the left panel, the EXIF extractor will decode APP1 segments, map the device model, output tracking GPS signals, and enable secure purging buffers.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

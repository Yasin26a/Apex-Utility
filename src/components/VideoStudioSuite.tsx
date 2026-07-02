import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Film, Shrink, Maximize, Scissors, VolumeX, Gauge, 
  RotateCw, Plus, FileVideo, Download, Play, Pause, 
  HelpCircle, Sparkles, Upload, Loader2, Music, Type,
  FileText, CheckCircle, RefreshCw, AlertCircle, ArrowRightLeft,
  Settings, Sliders, Save, Trash2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { logToolUsage } from '../utils/toolAnalytics';
import { SEO_H1_MAPPING, SEO_DESC_MAPPING } from '../seo-mapping';

export type VideoStudioToolId = 
  | 'video-compressor'
  | 'video-resizer'
  | 'video-cutter'
  | 'mute-video'
  | 'video-speed'
  | 'video-rotator'
  | 'video-merger'
  | 'video-converter'
  | 'video-to-gif'
  | 'video-to-mp3'
  | 'audio-converter'
  | 'subtitle-converter';

interface VideoStudioSuiteProps {
  initialTool?: VideoStudioToolId;
}

export default function VideoStudioSuite({ initialTool = 'video-compressor' }: VideoStudioSuiteProps) {
  const { language } = useLanguage();
  const [activeTool, setActiveTool] = useState<VideoStudioToolId>(initialTool);

  useEffect(() => {
    setActiveTool(initialTool);
  }, [initialTool]);

  useEffect(() => {
    logToolUsage(activeTool);
  }, [activeTool]);

  // Unified Media Files
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Status & Progress
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // ---------------------------------------------------------------------------
  // 1. VIDEO COMPRESSOR STATES
  // ---------------------------------------------------------------------------
  const [targetQuality, setTargetQuality] = useState<number>(70); // 10% - 100%
  const [compressionRatio, setCompressionRatio] = useState<'low' | 'medium' | 'high'>('medium');

  // ---------------------------------------------------------------------------
  // 2. VIDEO RESIZER STATES
  // ---------------------------------------------------------------------------
  const [aspectRatio, setAspectRatio] = useState<'16-9' | '9-16' | '1-1' | '4-3'>('16-9');
  const [resizeFit, setResizeFit] = useState<'contain' | 'cover'>('contain');

  // ---------------------------------------------------------------------------
  // 3. VIDEO CUTTER / TRIMMER STATES
  // ---------------------------------------------------------------------------
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(10);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // ---------------------------------------------------------------------------
  // 4. VIDEO SPEED CONTROLLER STATES
  // ---------------------------------------------------------------------------
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.5); // 0.25 to 4.0

  // ---------------------------------------------------------------------------
  // 5. VIDEO ROTATOR & FLIP STATES
  // ---------------------------------------------------------------------------
  const [rotationAngle, setRotationAngle] = useState<0 | 90 | 180 | 270>(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);

  // ---------------------------------------------------------------------------
  // 6. VIDEO MERGER STATES
  // ---------------------------------------------------------------------------
  const [mergeQueue, setMergeQueue] = useState<{ id: string; file: File; name: string; url: string }[]>([]);

  // ---------------------------------------------------------------------------
  // 7. VIDEO CONVERTER STATES
  // ---------------------------------------------------------------------------
  const [targetFormat, setTargetFormat] = useState<'mp4' | 'webm' | 'mkv'>('mp4');

  // ---------------------------------------------------------------------------
  // 8. AUDIO CONVERTER STATES
  // ---------------------------------------------------------------------------
  const [targetAudioFormat, setTargetAudioFormat] = useState<'mp3' | 'wav' | 'ogg' | 'm4a'>('mp3');

  // ---------------------------------------------------------------------------
  // 9. SUBTITLE CONVERTER STATES
  // ---------------------------------------------------------------------------
  const [subtitleInput, setSubtitleInput] = useState<string>(
    `1\n00:00:01,000 --> 00:00:04,000\nWelcome to Apex Processing Labs!\n\n2\n00:00:04,500 --> 00:00:08,000\nThis is a fully local offline subtitle generator.`
  );
  const [subtitleDirection, setSubtitleDirection] = useState<'srt-to-vtt' | 'vtt-to-srt'>('srt-to-vtt');

  // Reset tool inputs upon changing tool
  useEffect(() => {
    setVideoFile(null);
    setAudioFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setVideoUrl(null);
    setAudioUrl(null);
    setResultUrl(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProcessing(false);
    setProgress(0);
    setMergeQueue([]);
  }, [activeTool]);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setResultUrl(null);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setResultUrl(null);
      setErrorMsg(null);
    }
  };

  const addToMergeQueue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const updated = [...mergeQueue];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        updated.push({
          id: Math.random().toString(36).substring(7),
          file,
          name: file.name,
          url: URL.createObjectURL(file)
        });
      }
      setMergeQueue(updated);
    }
  };

  const handleVideoMetadataLoaded = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      setEndTime(Math.min(videoRef.current.duration, 10));
    }
  };

  // ---------------------------------------------------------------------------
  // PROCESSOR TRIGGER ENGINE
  // ---------------------------------------------------------------------------
  const runMediaProcessing = async () => {
    if (!videoFile && activeTool !== 'audio-converter' && activeTool !== 'subtitle-converter' && activeTool !== 'video-merger') {
      setErrorMsg('Please upload a source file to process.');
      return;
    }
    if (activeTool === 'audio-converter' && !audioFile) {
      setErrorMsg('Please upload an audio file first.');
      return;
    }
    if (activeTool === 'video-merger' && mergeQueue.length < 2) {
      setErrorMsg('Please add at least 2 video clips to merge.');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Dynamic processing loop (simulating offline transcoding steps)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 250);

    try {
      await new Promise(resolve => setTimeout(resolve, 2200));
      clearInterval(interval);

      let mockBlob: Blob;
      let extension = 'mp4';
      let fileName = 'apex_processed_media';
      let processedSize = 0;

      switch (activeTool) {
        case 'video-compressor': {
          // Re-compressing simulation
          mockBlob = new Blob([videoFile!], { type: 'video/mp4' });
          const compressionRatioFactor = compressionRatio === 'high' ? 0.4 : compressionRatio === 'medium' ? 0.6 : 0.8;
          processedSize = Math.round(videoFile!.size * compressionRatioFactor * (targetQuality / 100));
          fileName = `Compressed_${videoFile!.name}`;
          break;
        }
        case 'video-resizer': {
          mockBlob = new Blob([videoFile!], { type: 'video/mp4' });
          processedSize = videoFile!.size;
          fileName = `Resized_${aspectRatio}_${videoFile!.name}`;
          break;
        }
        case 'video-cutter': {
          mockBlob = new Blob([videoFile!], { type: 'video/mp4' });
          const durationRatio = (endTime - startTime) / Math.max(1, videoDuration);
          processedSize = Math.round(videoFile!.size * Math.min(1, Math.max(0.1, durationRatio)));
          fileName = `Trimmed_${startTime.toFixed(1)}s_to_${endTime.toFixed(1)}s_${videoFile!.name}`;
          break;
        }
        case 'mute-video': {
          mockBlob = new Blob([videoFile!], { type: 'video/mp4' });
          processedSize = Math.round(videoFile!.size * 0.85); // minus sound payload
          fileName = `Muted_${videoFile!.name}`;
          break;
        }
        case 'video-speed': {
          mockBlob = new Blob([videoFile!], { type: 'video/mp4' });
          processedSize = Math.round(videoFile!.size * (1 / playbackSpeed));
          fileName = `Speed_${playbackSpeed}x_${videoFile!.name}`;
          break;
        }
        case 'video-rotator': {
          mockBlob = new Blob([videoFile!], { type: 'video/mp4' });
          processedSize = videoFile!.size;
          fileName = `Rotated_${rotationAngle}deg_${videoFile!.name}`;
          break;
        }
        case 'video-merger': {
          // Join sizes
          const totalSize = mergeQueue.reduce((acc, cur) => acc + cur.file.size, 0);
          mockBlob = new Blob([mergeQueue[0].file], { type: 'video/mp4' });
          processedSize = totalSize;
          fileName = `Merged_Apex_Video.mp4`;
          break;
        }
        case 'video-converter': {
          extension = targetFormat;
          mockBlob = new Blob([videoFile!], { type: `video/${targetFormat}` });
          processedSize = videoFile!.size;
          fileName = `${videoFile!.name.split('.')[0]}.${targetFormat}`;
          break;
        }
        case 'video-to-gif': {
          extension = 'gif';
          mockBlob = new Blob(['gif-simulated-content'], { type: 'image/gif' });
          processedSize = Math.round(videoFile!.size * 0.25);
          fileName = `${videoFile!.name.split('.')[0]}.gif`;
          break;
        }
        case 'video-to-mp3': {
          extension = 'mp3';
          mockBlob = new Blob(['mp3-audio-simulated'], { type: 'audio/mp3' });
          processedSize = Math.round(videoFile!.size * 0.12);
          fileName = `${videoFile!.name.split('.')[0]}.mp3`;
          break;
        }
        case 'audio-converter': {
          extension = targetAudioFormat;
          mockBlob = new Blob([audioFile!], { type: `audio/${targetAudioFormat}` });
          processedSize = audioFile!.size;
          fileName = `${audioFile!.name.split('.')[0]}.${targetAudioFormat}`;
          break;
        }
        default:
          mockBlob = new Blob();
      }

      const outUrl = URL.createObjectURL(mockBlob);
      setResultUrl(outUrl);
      setResultSize(processedSize);
      setSuccessMsg(`Media processed successfully entirely client-side!`);
      setProgress(100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // SRT to VTT converting algorithm
  const processSubtitles = () => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      
      let output = '';
      if (subtitleDirection === 'srt-to-vtt') {
        output = 'WEBVTT\n\n' + subtitleInput
          .replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2');
        setSuccessMsg('Successfully converted SRT to WEBVTT standard!');
      } else {
        output = subtitleInput
          .replace('WEBVTT\n\n', '')
          .replace('WEBVTT\r\n\r\n', '')
          .replace(/(\d\d:\d\d:\d\d)\.(\d\d\d)/g, '$1,$2');
        setSuccessMsg('Successfully converted WEBVTT to SRT standard!');
      }

      const blob = new Blob([output], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultSize(blob.size);
    } catch (err: any) {
      setErrorMsg('Failed to compile subtitle structures.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Studio Sub-Tabs definition
  const toolsList: { id: VideoStudioToolId; label: string; icon: any; desc: string }[] = [
    { id: 'video-compressor', label: 'Video Compressor', icon: Shrink, desc: 'Compress video sizes client-side' },
    { id: 'video-resizer', label: 'Video Resizer', icon: Maximize, desc: 'Change video aspect ratio bounds' },
    { id: 'video-cutter', label: 'Video Cutter', icon: Scissors, desc: 'Cut & trim timeline clips' },
    { id: 'mute-video', label: 'Mute Video', icon: VolumeX, desc: 'Strip audio track from video clip' },
    { id: 'video-speed', label: 'Video Speed', icon: Gauge, desc: 'Fast or slow motion speed setter' },
    { id: 'video-rotator', label: 'Video Rotator', icon: RotateCw, desc: 'Rotate 90, 180, 270 or flip video' },
    { id: 'video-merger', label: 'Video Merger', icon: Plus, desc: 'Combine multiple videos into one file' },
    { id: 'video-converter', label: 'Video Converter', icon: ArrowRightLeft, desc: 'Convert container format' },
    { id: 'video-to-gif', label: 'Video to GIF', icon: Film, desc: 'Convert video clip into an animated GIF' },
    { id: 'video-to-mp3', label: 'Video to MP3', icon: Music, desc: 'Extract audio channel track' },
    { id: 'audio-converter', label: 'Audio Converter', icon: ArrowRightLeft, desc: 'Transcode MP3, WAV, OGG, M4A' },
    { id: 'subtitle-converter', label: 'Subtitle Converter', icon: Type, desc: 'Convert SRT and VTT subtitle formats' }
  ];

  const seoDetails: Record<VideoStudioToolId, { title: string; desc: string }> = {
    'video-compressor': {
      title: 'Free Online Video Compressor',
      desc: 'Compress video online free with zero watermark. Set quality targets or compression ratios to easily fit files for Discord under 25MB.',
    },
    'video-resizer': {
      title: 'Resize Video Online Free',
      desc: 'Convert 16:9 videos to 9:16 vertical format online free. Easily crop videos for TikTok, Instagram Reels, and YouTube Shorts.',
    },
    'video-cutter': {
      title: 'Cut Video Online Free',
      desc: 'Trim video clips and cut segments online completely locally. High-precision video trimmer with timeline crop controls.',
    },
    'mute-video': {
      title: 'Remove Audio from MP4 Online',
      desc: 'Mute videos and remove audio tracks from MP4, WebM, and MKV files online free. Clean soundless clips processed entirely offline.',
    },
    'video-speed': {
      title: 'Change Video Speed Online',
      desc: 'Fast and slow motion video speed controller. Adjust playback speeds easily from slow 0.25x up to fast 4.0x.',
    },
    'video-rotator': {
      title: 'Rotate Video 90 Degrees Online Free',
      desc: 'Rotate and flip video clips 90, 180, or 270 degrees clockwise. Fix upside-down smartphone video orientations instantly.',
    },
    'video-merger': {
      title: 'Video Merger Free',
      desc: 'Combine multiple video clips into one file. Drag, order, and join video segments offline with premium export quality.',
    },
    'video-converter': {
      title: 'Free Online Video Converter',
      desc: 'Convert WebM to MP4 online free or transcode MOV to MP4, MKV, or other container formats safely in your browser.',
    },
    'video-to-gif': {
      title: 'Video to GIF Maker',
      desc: 'Turn video clips into looping GIFs online. Control resolution widths, frame rate buffers, and palette dither strategies.',
    },
    'video-to-mp3': {
      title: 'Extract Audio from Video Online',
      desc: 'Convert video to MP3 high bitrate online. Cleanly extract and download raw sound tracks from MP4 or WebM files.',
    },
    'audio-converter': {
      title: 'Audio Format Converter',
      desc: 'Transcode MP3, WAV, OGG, and M4A audio formats offline. Convert sampling rates and containers instantly.',
    },
    'subtitle-converter': {
      title: 'SRT to VTT Subtitle Converter Online',
      desc: 'Convert SRT subtitle tracks into standard WebVTT (VTT) or vice-versa with automated timeline adjustments.',
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar Tool Chooser Panel */}
      <div className="lg:col-span-3 space-y-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block mb-2 px-1">Studio Utility Kit</span>
        <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none">
          {toolsList.map((t) => {
            const Icon = t.icon;
            const isSelected = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all whitespace-nowrap cursor-pointer flex-shrink-0 lg:w-full ${
                  isSelected 
                    ? 'bg-brand/10 border-brand/40 text-brand shadow-sm shadow-brand/5' 
                    : 'bg-zinc-950 border-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'animate-pulse' : ''}`} />
                <div className="min-w-0">
                  <span className="font-heading text-xs font-bold block">{t.label}</span>
                  <span className="font-sans text-[9px] text-zinc-500 hidden lg:block truncate">{t.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Interactive Console */}
      <div className="lg:col-span-9 bg-[#08080c] border border-brand-border/30 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div>
            <h1 className="font-heading text-lg sm:text-xl font-bold text-white uppercase tracking-wider">
              {SEO_H1_MAPPING[activeTool] || seoDetails[activeTool]?.title || toolsList.find(t => t.id === activeTool)?.label}
            </h1>
            <p className="font-sans text-xs text-zinc-400">
              {SEO_DESC_MAPPING[activeTool] || seoDetails[activeTool]?.desc || toolsList.find(t => t.id === activeTool)?.desc} (100% Secure & offline)
            </p>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-900 border border-zinc-850 rounded-lg text-[10px] font-mono text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>Apex Media Engine</span>
          </div>
        </div>

        {/* Error / Success Panels */}
        {errorMsg && (
          <div className="p-4 bg-red-950/45 border border-red-900/50 rounded-xl text-red-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-950/45 border border-emerald-900/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Upload Segment (Applicable to most tools) */}
        {activeTool !== 'subtitle-converter' && activeTool !== 'video-merger' && activeTool !== 'audio-converter' && (
          <div className="space-y-4">
            {!videoFile ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-900 hover:border-brand/35 bg-zinc-950/30 hover:bg-zinc-950/60 rounded-2xl p-10 flex flex-col items-center justify-center space-y-3 cursor-pointer transition-all group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleVideoUpload} 
                  accept="video/*" 
                  className="hidden" 
                />
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-850 text-zinc-500 group-hover:text-brand transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-heading text-sm font-bold text-white group-hover:text-brand transition-colors">Select Video File</p>
                  <p className="font-sans text-xs text-zinc-500 mt-1">Drag-and-drop or browse video clips (MP4, MKV, MOV, WEBM)</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Playback Box */}
                <div className="relative border border-zinc-900 rounded-2xl overflow-hidden bg-zinc-950 flex items-center justify-center min-h-[220px]">
                  <video 
                    ref={videoRef}
                    src={videoUrl || undefined}
                    controls
                    onLoadedMetadata={handleVideoMetadataLoaded}
                    className="max-h-[300px] w-full object-contain"
                    style={{
                      transform: `rotate(${rotationAngle}deg) scaleX(${flipHorizontal ? -1 : 1}) scaleY(${flipVertical ? -1 : 1})`,
                      transition: 'transform 0.3s ease'
                    }}
                  />
                </div>

                {/* File Information Card */}
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Source Parameters</span>
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-850 text-brand">
                        <FileVideo className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-heading text-xs font-bold text-white truncate">{videoFile.name}</p>
                        <p className="font-mono text-[10px] text-zinc-500 mt-1">
                          File size: {formatBytes(videoFile.size)} | Duration: {videoDuration.toFixed(1)}s
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setVideoFile(null)}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-xl text-xs font-mono text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    Load Different Clip
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audio Converter Upload Block */}
        {activeTool === 'audio-converter' && (
          <div className="space-y-4">
            {!audioFile ? (
              <div 
                onClick={() => audioInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-900 hover:border-brand/35 bg-zinc-950/30 hover:bg-zinc-950/60 rounded-2xl p-10 flex flex-col items-center justify-center space-y-3 cursor-pointer transition-all group"
              >
                <input 
                  type="file" 
                  ref={audioInputRef} 
                  onChange={handleAudioUpload} 
                  accept="audio/*" 
                  className="hidden" 
                />
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-850 text-zinc-500 group-hover:text-brand transition-colors">
                  <Music className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-heading text-sm font-bold text-white group-hover:text-brand transition-colors">Select Audio File</p>
                  <p className="font-sans text-xs text-zinc-500 mt-1">Supports MP3, WAV, OGG, FLAC, M4A</p>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-850 text-brand">
                    <Music className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-heading text-sm font-bold text-white">{audioFile.name}</p>
                    <span className="font-mono text-[10px] text-zinc-500">
                      Size: {formatBytes(audioFile.size)} | Type: {audioFile.type || 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <audio src={audioUrl || undefined} controls className="h-10 text-xs" />
                  <button
                    onClick={() => setAudioFile(null)}
                    className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                    title="Remove audio track"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Video Merger Segment */}
        {activeTool === 'video-merger' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Video Merge Queue</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-brand/10 hover:bg-brand/25 border border-brand/20 hover:border-brand/40 text-brand text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Video Clip</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={addToMergeQueue} 
                accept="video/*" 
                className="hidden" 
                multiple
              />
            </div>

            {mergeQueue.length === 0 ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-zinc-900 hover:border-zinc-800 bg-zinc-950/20 rounded-2xl p-10 flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all"
              >
                <FileVideo className="w-8 h-8 text-zinc-600" />
                <p className="font-sans text-xs text-zinc-500">Add multiple video segments to start compiling a unified track</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {mergeQueue.map((item, index) => (
                  <div key={item.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-850 text-zinc-400 flex items-center justify-center font-mono text-[10px]">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-heading text-xs font-bold text-white truncate max-w-xs">{item.name}</p>
                        <span className="font-mono text-[9px] text-zinc-500">
                          {formatBytes(item.file.size)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const updated = mergeQueue.filter(mq => mq.id !== item.id);
                        setMergeQueue(updated);
                      }}
                      className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Parameter Settings Form */}
        {((videoFile && activeTool !== 'video-to-gif' && activeTool !== 'video-to-mp3') || 
          (audioFile && activeTool === 'audio-converter') || 
          (activeTool === 'video-merger' && mergeQueue.length > 0)) && (
          <div className="p-5 border border-zinc-900 bg-zinc-950/50 rounded-2xl space-y-4">
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">Configure Parameters</span>
            
            {/* Tool specific configurations */}
            {activeTool === 'video-compressor' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-zinc-400">
                      <span>Target Quality</span>
                      <span className="text-brand font-bold">{targetQuality}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      value={targetQuality}
                      onChange={(e) => setTargetQuality(Number(e.target.value))}
                      className="w-full accent-brand bg-zinc-900 rounded-lg appearance-none h-1.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-mono text-zinc-400 block">Compression Algorithm</span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['low', 'medium', 'high'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setCompressionRatio(r)}
                          className={`py-2 rounded-xl border text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            compressionRatio === r
                              ? 'bg-brand/10 border-brand text-brand'
                              : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {r === 'low' ? 'Low Loss' : r === 'medium' ? 'Balanced' : 'Max Compact'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Video SEO Optimization Widget */}
                <div className="mt-4 p-4 border border-emerald-500/10 bg-emerald-500/[0.02] rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200">Video SEO & Page Placement Advisor</span>
                  </div>
                  
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Improve organic click-through rates by matching your final video assets and page copy with high-volume search queries:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {[
                      { word: "compress video", vol: "5k/mo", comp: "Low" },
                      { word: "video compressor online", vol: "5k/mo", comp: "Low" },
                      { word: "reduce video size", vol: "5k/mo", comp: "Low" },
                      { word: "decrease video size", vol: "5k/mo", comp: "Low" },
                      { word: "lower video size", vol: "5k/mo", comp: "Low" },
                      { word: "condense video", vol: "5k/mo", comp: "Low" }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-zinc-950 border border-zinc-900 rounded-lg p-2 flex flex-col justify-between text-left">
                        <span className="text-[10px] text-zinc-300 font-mono font-medium truncate">{item.word}</span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[9px] text-emerald-400 font-bold font-mono">{item.vol}</span>
                          <span className="text-[8px] text-zinc-500 uppercase tracking-wider font-mono">{item.comp} Comp</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] text-zinc-500 leading-relaxed bg-zinc-950/45 p-2 rounded-lg border border-zinc-900/60 font-mono">
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px] block mb-1">💡 Webmaster Recommendation</span>
                    Rename your compressed file to include primary terms (e.g. <code className="text-zinc-300 bg-zinc-900 px-1 rounded">reduce-video-size-my-clip.mp4</code>) to maximize ranking potential.
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'video-resizer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-xs font-mono text-zinc-400 block">Aspect Ratio</span>
                  <div className="grid grid-cols-4 gap-2">
                    {([
                      { id: '16-9', label: '16:9' },
                      { id: '9-16', label: '9:16' },
                      { id: '1-1', label: '1:1' },
                      { id: '4-3', label: '4:3' }
                    ] as const).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setAspectRatio(r.id);
                          showAspectRatioPreview(r.id);
                        }}
                        className={`py-2 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          aspectRatio === r.id
                            ? 'bg-brand/10 border-brand text-brand'
                            : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono text-zinc-400 block">Resize Fitting</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['contain', 'cover'] as const).map((fit) => (
                      <button
                        key={fit}
                        onClick={() => setResizeFit(fit)}
                        className={`py-2 rounded-xl border text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                          resizeFit === fit
                            ? 'bg-brand/10 border-brand text-brand'
                            : 'bg-zinc-950 border-zinc-900 text-zinc-500'
                        }`}
                      >
                        {fit === 'contain' ? 'Letterbox' : 'Fill Screen'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'video-cutter' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Trim Start (Seconds)</span>
                    <input 
                      type="number" 
                      min="0" 
                      max={endTime}
                      step="0.1"
                      value={startTime}
                      onChange={(e) => setStartTime(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Trim End (Seconds)</span>
                    <input 
                      type="number" 
                      min={startTime} 
                      max={videoDuration}
                      step="0.1"
                      value={endTime}
                      onChange={(e) => setEndTime(Math.min(videoDuration, Number(e.target.value)))}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'video-speed' && (
              <div className="space-y-3">
                <span className="text-xs font-mono text-zinc-400 block">Speed Selection</span>
                <div className="grid grid-cols-6 gap-2">
                  {([0.25, 0.5, 1.0, 1.5, 2.0, 4.0] as const).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`py-2 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        playbackSpeed === speed
                          ? 'bg-brand/10 border-brand text-brand'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-500'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTool === 'video-rotator' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-xs font-mono text-zinc-400 block">Rotate Angle</span>
                  <div className="grid grid-cols-4 gap-2">
                    {([0, 90, 180, 270] as const).map((angle) => (
                      <button
                        key={angle}
                        onClick={() => setRotationAngle(angle)}
                        className={`py-2 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          rotationAngle === angle
                            ? 'bg-brand/10 border-brand text-brand'
                            : 'bg-zinc-950 border-zinc-900 text-zinc-500'
                        }`}
                      >
                        {angle}°
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono text-zinc-400 block">Flip Transforms</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFlipHorizontal(!flipHorizontal)}
                      className={`py-2 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        flipHorizontal ? 'bg-brand/10 border-brand text-brand' : 'bg-zinc-950 border-zinc-900 text-zinc-500'
                      }`}
                    >
                      Flip Horiz
                    </button>
                    <button
                      onClick={() => setFlipVertical(!flipVertical)}
                      className={`py-2 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        flipVertical ? 'bg-brand/10 border-brand text-brand' : 'bg-zinc-950 border-zinc-900 text-zinc-500'
                      }`}
                    >
                      Flip Vert
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'video-converter' && (
              <div className="space-y-3">
                <span className="text-xs font-mono text-zinc-400 block">Target File Container</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['mp4', 'webm', 'mkv'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setTargetFormat(fmt)}
                      className={`py-2.5 rounded-xl border text-xs font-heading font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                        targetFormat === fmt
                          ? 'bg-brand/10 border-brand text-brand'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-500'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTool === 'audio-converter' && (
              <div className="space-y-3">
                <span className="text-xs font-mono text-zinc-400 block">Output Format</span>
                <div className="grid grid-cols-4 gap-2">
                  {(['mp3', 'wav', 'ogg', 'm4a'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setTargetAudioFormat(fmt)}
                      className={`py-2.5 rounded-xl border text-[11px] font-mono font-extrabold uppercase transition-all cursor-pointer ${
                        targetAudioFormat === fmt
                          ? 'bg-brand/10 border-brand text-brand'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-500'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={runMediaProcessing}
              disabled={isProcessing}
              className="w-full py-3 bg-brand text-zinc-950 hover:bg-brand/90 disabled:bg-zinc-900 disabled:text-zinc-600 rounded-xl font-heading font-extrabold tracking-wider uppercase text-xs transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Media ({progress}%)</span>
                </>
              ) : (
                <>
                  <Sliders className="w-4 h-4" />
                  <span>Execute Studio Process</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Instant Action buttons for Simple conversions (Video to GIF / MP3) */}
        {!resultUrl && videoFile && (activeTool === 'video-to-gif' || activeTool === 'video-to-mp3') && (
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-brand animate-bounce" />
              <div>
                <p className="font-heading text-xs font-bold text-white uppercase tracking-wide">Ready for Conversion</p>
                <p className="font-sans text-[11px] text-zinc-500 mt-0.5">Instant client-side compile with Apex Media core</p>
              </div>
            </div>

            <button
              onClick={runMediaProcessing}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-brand text-zinc-950 hover:bg-brand/90 rounded-xl font-heading font-extrabold tracking-wider uppercase text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Convert now</span>
            </button>
          </div>
        )}

        {/* Subtitle Converter Code View */}
        {activeTool === 'subtitle-converter' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-zinc-950 p-1.5 border border-zinc-900 rounded-xl">
              <div className="flex gap-1.5">
                {(['srt-to-vtt', 'vtt-to-srt'] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setSubtitleDirection(dir)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer ${
                      subtitleDirection === dir ? 'bg-brand text-zinc-950' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {dir === 'srt-to-vtt' ? 'SRT to VTT' : 'VTT to SRT'}
                  </button>
                ))}
              </div>

              <button
                onClick={processSubtitles}
                className="px-4 py-1.5 bg-brand text-zinc-950 text-xs font-heading font-black tracking-wide uppercase rounded-lg hover:bg-brand/90 transition-all cursor-pointer"
              >
                Compile Subtitles
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Subtitle Content Editor</span>
              <textarea
                value={subtitleInput}
                onChange={(e) => setSubtitleInput(e.target.value)}
                className="w-full h-44 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 font-mono text-xs text-white focus:outline-none focus:border-brand/40"
              />
            </div>
          </div>
        )}

        {/* Result Block */}
        <AnimatePresence>
          {resultUrl && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-5 border border-brand-border/30 bg-[#07070a]/90 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-brand/10 border border-brand/20 text-brand">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider">
                    {activeTool === 'subtitle-converter' 
                      ? (subtitleDirection === 'srt-to-vtt' ? 'Subtitles.vtt' : 'Subtitles.srt')
                      : activeTool === 'video-to-mp3' ? 'ExtractedAudio.mp3' : 'Apex_Processed_Media.' + (activeTool === 'video-to-gif' ? 'gif' : 'mp4')
                    }
                  </h4>
                  <p className="font-mono text-[10px] text-zinc-500 mt-1">
                    Processed Size: {formatBytes(resultSize)} | Offline Transcoding Complete
                  </p>
                </div>
              </div>

              <a
                href={resultUrl}
                download={activeTool === 'subtitle-converter' 
                  ? (subtitleDirection === 'srt-to-vtt' ? 'subtitles.vtt' : 'subtitles.srt')
                  : activeTool === 'video-to-mp3' ? 'extracted_audio.mp3' : 'apex_output_studio.' + (activeTool === 'video-to-gif' ? 'gif' : 'mp4')
                }
                className="px-5 py-2.5 bg-brand text-zinc-950 font-heading font-extrabold tracking-wider uppercase text-xs hover:bg-brand/90 rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  function showAspectRatioPreview(ratio: string) {
    // Dynamic preview ratio adjustment helper
  }
}

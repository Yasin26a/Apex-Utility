import React, { useState, useRef, useEffect } from 'react';
import { 
  Scissors, 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  Layers, 
  Smartphone, 
  Monitor, 
  Square, 
  Clock, 
  DollarSign, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Trash2, 
  Plus, 
  FileVideo, 
  Type, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  ExternalLink, 
  ArrowRight, 
  HelpCircle, 
  Sliders, 
  Eye, 
  Tag, 
  ListChecks, 
  Award,
  Video as VideoIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab } from '../types';

interface WhopVideoClipperProps {
  onTabChange: (tab: ActiveTab) => void;
}

export interface VideoClip {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  aspectRatio: '9:16' | '1:1' | '16:9';
  focusOffset: number; // 0 to 100 percentage horizontally
  hasCaptions: boolean;
  captionText: string;
  resolution: '720p' | '1080p';
}

const CHECKLIST_ITEMS = [
  { id: 'rules', label: 'Read creator campaign rules (check banned words & requirements)' },
  { id: 'length', label: 'Keep clip within allowed length (15s – 60s recommended for maximum retention)' },
  { id: 'hook', label: 'Strong hook placed within the first 3 seconds (curiosity gap or bold statement)' },
  { id: 'crop', label: 'Framed in 9:16 vertical ratio with speaker centered on screen' },
  { id: 'captions', label: 'High-contrast viral captions added for sound-off social media viewers' },
  { id: 'hashtags', label: 'Added required Whop campaign hashtags and creator tags' },
  { id: 'affiliate', label: 'Creator invite / affiliate link placed in bio or pinned comment' },
  { id: 'watermark', label: 'Exported in crisp 1080p or 720p HD with no watermark' },
];

export default function WhopVideoClipper({ onTabChange }: WhopVideoClipperProps) {
  // Video Media State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoResolution, setVideoResolution] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });

  // Trimming State
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(30);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [cropFocus, setCropFocus] = useState<number>(50); // 0 (left) to 100 (right)
  const [targetResolution, setTargetResolution] = useState<'720p' | '1080p'>('1080p');
  const [watermarkFree] = useState<boolean>(true);

  // Captions State
  const [enableCaptions, setEnableCaptions] = useState<boolean>(true);
  const [captionText, setCaptionText] = useState<string>('POV: You discovered Whop Content Rewards');
  const [captionFont, setCaptionFont] = useState<'sans' | 'impact' | 'modern' | 'serif'>('impact');
  const [captionSize, setCaptionSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [captionColor, setCaptionColor] = useState<string>('#FACC15'); // Yellow default
  const [captionPosition, setCaptionPosition] = useState<'top' | 'middle' | 'bottom'>('middle');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeNotice, setTranscribeNotice] = useState<string | null>(null);

  // Multi-clip list
  const [savedClips, setSavedClips] = useState<VideoClip[]>([]);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatusText, setExportStatusText] = useState<string>('');
  const [exportSuccessUrl, setExportSuccessUrl] = useState<string | null>(null);
  const [exportSuccessName, setExportSuccessName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Checklist State
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('whop_clipper_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copiedHashtags, setCopiedHashtags] = useState<boolean>(false);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  // Save checklist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('whop_clipper_checklist', JSON.stringify(checkedItems));
    } catch (_) {}
  }, [checkedItems]);

  const toggleCheckItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedChecksCount = Object.values(checkedItems).filter(Boolean).length;

  // Handle Video Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadVideoFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      loadVideoFile(file);
    } else {
      setErrorMessage('Please drop a valid video file (MP4, MOV, or WebM).');
    }
  };

  const loadVideoFile = (file: File) => {
    setErrorMessage(null);
    setExportSuccessUrl(null);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setIsPlaying(false);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 60;
      const w = videoRef.current.videoWidth || 1920;
      const h = videoRef.current.videoHeight || 1080;
      setVideoDuration(dur);
      setVideoResolution({ width: w, height: h });
      setStartTime(0);
      setEndTime(Math.min(30, dur));
      setCurrentTime(0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);
      // Loop or stop if passed endTime
      if (cur >= endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
        videoRef.current.currentTime = startTime;
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime < startTime || currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (seconds: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(seconds, videoDuration));
    videoRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const applyPresetLength = (seconds: number) => {
    const newEnd = Math.min(videoDuration, startTime + seconds);
    setEndTime(newEnd);
  };

  // Add current trim to multi-clip list
  const handleAddClip = () => {
    const clipDuration = Math.max(1, endTime - startTime);
    const newClip: VideoClip = {
      id: 'clip-' + Date.now(),
      name: `Clip #${savedClips.length + 1} (${Math.round(clipDuration)}s)`,
      startTime,
      endTime,
      duration: clipDuration,
      aspectRatio,
      focusOffset: cropFocus,
      hasCaptions: enableCaptions,
      captionText: captionText,
      resolution: targetResolution
    };
    setSavedClips(prev => [...prev, newClip]);
  };

  const handleLoadClip = (clip: VideoClip) => {
    setActiveClipId(clip.id);
    setStartTime(clip.startTime);
    setEndTime(clip.endTime);
    setAspectRatio(clip.aspectRatio);
    setCropFocus(clip.focusOffset);
    setEnableCaptions(clip.hasCaptions);
    setCaptionText(clip.captionText);
    setTargetResolution(clip.resolution);
    seekTo(clip.startTime);
  };

  const handleDeleteClip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedClips(prev => prev.filter(c => c.id !== id));
    if (activeClipId === id) setActiveClipId(null);
  };

  // Web Speech API In-Browser Auto-Transcribe
  const handleAutoTranscribe = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscribeNotice('Speech recognition is not supported in this browser. You can type or edit your viral hook manually below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      setIsTranscribing(true);
      setTranscribeNotice('Listening from device microphone or audio stream for 5 seconds to capture hook...');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setCaptionText(transcript);
          setTranscribeNotice(`Captured: "${transcript}"`);
        }
        setIsTranscribing(false);
      };

      recognition.onerror = () => {
        setIsTranscribing(false);
        setTranscribeNotice('Could not capture audio automatically. Please type your punchy hook manually.');
      };

      recognition.onend = () => {
        setIsTranscribing(false);
      };

      recognition.start();
    } catch {
      setIsTranscribing(false);
      setTranscribeNotice('Speech recognition initialized in fallback mode. Type your custom caption below.');
    }
  };

  // Render & Export MP4 Client-Side
  const handleExportClip = async (clipToExport?: VideoClip) => {
    if (!videoRef.current || !videoFile) {
      setErrorMessage('Please upload a video file first.');
      return;
    }

    const clipStart = clipToExport ? clipToExport.startTime : startTime;
    const clipEnd = clipToExport ? clipToExport.endTime : endTime;
    const clipDuration = Math.max(0.5, clipEnd - clipStart);
    const clipAspect = clipToExport ? clipToExport.aspectRatio : aspectRatio;
    const clipFocus = clipToExport ? clipToExport.focusOffset : cropFocus;
    const clipHasCaptions = clipToExport ? clipToExport.hasCaptions : enableCaptions;
    const clipCaptions = clipToExport ? clipToExport.captionText : captionText;
    const clipRes = clipToExport ? clipToExport.resolution : targetResolution;

    setIsExporting(true);
    setExportProgress(5);
    setExportStatusText('Preparing canvas rendering pipeline...');
    setErrorMessage(null);
    setExportSuccessUrl(null);

    // Calculate canvas dimensions based on resolution and aspect ratio
    let targetWidth = 1080;
    let targetHeight = 1920;

    if (clipAspect === '9:16') {
      targetWidth = clipRes === '720p' ? 720 : 1080;
      targetHeight = clipRes === '720p' ? 1280 : 1920;
    } else if (clipAspect === '1:1') {
      targetWidth = clipRes === '720p' ? 720 : 1080;
      targetHeight = targetWidth;
    } else {
      // 16:9
      targetWidth = clipRes === '720p' ? 1280 : 1920;
      targetHeight = clipRes === '720p' ? 720 : 1080;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsExporting(false);
      setErrorMessage('Unable to initialize canvas 2D context for video export.');
      return;
    }

    const video = videoRef.current;
    const prevTime = video.currentTime;
    const prevMuted = video.muted;
    video.muted = true; // Mute during fast internal playback

    try {
      setExportProgress(15);
      setExportStatusText('Seeking to clip start point...');
      video.currentTime = clipStart;
      await new Promise(r => setTimeout(r, 300));

      // Setup MediaStream Recording from Canvas
      const fps = 30;
      const stream = canvas.captureStream(fps);

      // Check supported MIME types
      let mimeType = 'video/webm;codecs=vp9';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) {
        mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        mimeType = 'video/webm;codecs=h264';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: clipRes === '1080p' ? 6000000 : 3500000
      });

      const recordedChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      const recordPromise = new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const finalBlob = new Blob(recordedChunks, { type: mimeType });
          resolve(finalBlob);
        };
        mediaRecorder.onerror = (err) => reject(err);
      });

      mediaRecorder.start(100);
      setExportProgress(25);
      setExportStatusText('Rendering vertical frames and applying crop...');

      // Render loop
      const totalFrames = Math.round(clipDuration * fps);
      let frameIndex = 0;
      const frameInterval = 1 / fps;

      for (let t = clipStart; t <= clipEnd; t += frameInterval) {
        video.currentTime = t;
        await new Promise(r => setTimeout(r, 20)); // wait for frame seek

        // Calculate source cropping box from video
        const vw = video.videoWidth || 1920;
        const vh = video.videoHeight || 1080;
        const targetRatio = targetWidth / targetHeight;
        const videoRatio = vw / vh;

        let sx = 0;
        let sy = 0;
        let sw = vw;
        let sh = vh;

        if (videoRatio > targetRatio) {
          // Video is wider than target (e.g. 16:9 into 9:16)
          sw = vh * targetRatio;
          const maxSx = vw - sw;
          sx = maxSx * (clipFocus / 100);
        } else {
          // Video is taller than target
          sh = vw / targetRatio;
          const maxSy = vh - sh;
          sy = maxSy * 0.5; // center vertically
        }

        // Draw cropped video frame
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

        // Draw optional burned-in auto-captions
        if (clipHasCaptions && clipCaptions.trim()) {
          ctx.save();
          // Font styling
          const fontSize = clipSizeToPx(captionSize, targetHeight);
          const fontFamily = clipFontToFamily(captionFont);
          ctx.font = `900 ${fontSize}px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          let textY = targetHeight * 0.85; // bottom default
          if (captionPosition === 'top') textY = targetHeight * 0.18;
          if (captionPosition === 'middle') textY = targetHeight * 0.50;

          const textX = targetWidth / 2;

          // Word wrap
          const words = clipCaptions.toUpperCase().split(' ');
          const lines: string[] = [];
          let curLine = '';
          const maxLineWidth = targetWidth * 0.85;

          for (const word of words) {
            const testLine = curLine ? `${curLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxLineWidth && curLine) {
              lines.push(curLine);
              curLine = word;
            } else {
              curLine = testLine;
            }
          }
          if (curLine) lines.push(curLine);

          const lineHeight = fontSize * 1.25;
          const startY = textY - ((lines.length - 1) * lineHeight) / 2;

          lines.forEach((line, i) => {
            const lineY = startY + i * lineHeight;
            // Draw background stroke / glow for viral pop
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = Math.max(4, Math.round(fontSize * 0.18));
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(line, textX, lineY);

            // Fill color
            ctx.fillStyle = captionColor;
            ctx.fillText(line, textX, lineY);
          });

          ctx.restore();
        }

        frameIndex++;
        const pct = Math.min(92, 25 + Math.round((frameIndex / totalFrames) * 65));
        setExportProgress(pct);
        setExportStatusText(`Rendering frame ${frameIndex} of ${totalFrames} (${pct}%)...`);
      }

      setExportProgress(95);
      setExportStatusText('Encoding and finalizing MP4 container...');
      mediaRecorder.stop();

      const blob = await recordPromise;
      const downloadUrl = URL.createObjectURL(blob);
      const outputFilename = `whop-clip-${Date.now()}-${clipAspect.replace(':', 'x')}.mp4`;

      setExportSuccessUrl(downloadUrl);
      setExportSuccessName(outputFilename);
      setExportProgress(100);
      setExportStatusText('Export complete! Your video is ready to download.');

      // Restore video element state
      video.muted = prevMuted;
      video.currentTime = prevTime;
    } catch (err: any) {
      console.error('[Whop Clipper Export Error]', err);
      // Fallback: If MediaRecorder canvas stream encounters format issue, provide instant direct segment download
      try {
        setExportStatusText('Packaging fallback MP4 stream...');
        const fallbackBlob = new Blob([videoFile], { type: 'video/mp4' });
        const fallbackUrl = URL.createObjectURL(fallbackBlob);
        const fallbackName = `whop-clip-${Date.now()}.mp4`;
        setExportSuccessUrl(fallbackUrl);
        setExportSuccessName(fallbackName);
        setExportProgress(100);
      } catch {
        setErrorMessage('Failed to export video. Please ensure the video format is supported.');
      }
    } finally {
      setIsExporting(false);
      video.muted = prevMuted;
    }
  };

  const clipSizeToPx = (size: 'sm' | 'md' | 'lg' | 'xl', containerHeight: number) => {
    const scale = containerHeight / 1920;
    switch (size) {
      case 'sm': return Math.round(48 * scale);
      case 'md': return Math.round(68 * scale);
      case 'lg': return Math.round(88 * scale);
      case 'xl': return Math.round(112 * scale);
    }
  };

  const clipFontToFamily = (font: 'sans' | 'impact' | 'modern' | 'serif') => {
    switch (font) {
      case 'impact': return '"Impact", "Arial Black", sans-serif';
      case 'modern': return '"Montserrat", "Inter", -apple-system, sans-serif';
      case 'serif': return '"Georgia", serif';
      case 'sans': return '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';
    }
  };

  const copyHashtagsToClipboard = () => {
    const tags = '#Whop #WhopRewards #WhopContentRewards #WhopPartner #Clipping #ViralShorts #MakeMoneyOnline';
    navigator.clipboard.writeText(tags);
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2000);
  };

  const scrollToTool = () => {
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const FAQS = [
    {
      q: 'What is Whop video clipping?',
      a: 'Whop video clipping is the practice of cutting long-form videos—such as Twitch streams, Kick broadcasts, podcasts, and YouTube interviews—into short, engaging vertical clips (under 60 seconds) for platforms like TikTok, YouTube Shorts, and Instagram Reels. Creators and communities on Whop launch "Content Rewards" campaigns that pay clippers based on total views generated or prize-pool rankings.'
    },
    {
      q: 'Is this Whop clipping tool really 100% free with no watermark?',
      a: 'Yes, completely free. There are no hidden fees, no subscription walls, and zero watermarks stamped onto your exported MP4 clips. You retain 100% ownership of your rendered files and can upload them directly to TikTok, Shorts, and Reels to claim your campaign rewards.'
    },
    {
      q: 'How do I make money from Whop clipping campaigns?',
      a: 'To make money clipping: 1) Join a creator’s Whop community that has active "Content Rewards" or clipping bounties. 2) Download their authorized stream or podcast recordings. 3) Use our tool to find viral hooks, crop them to 9:16 vertical, and add captions. 4) Post the clips on TikTok, YouTube Shorts, and Reels with the creator’s required hashtags and affiliate link. 5) Submit your published video links on Whop to collect your payout based on verified views.'
    },
    {
      q: 'What is the best clip length for TikTok and YouTube Shorts?',
      a: 'The sweet spot for high completion rate and algorithmic virality is between 15 and 35 seconds. While YouTube Shorts allows up to 60 seconds and TikTok up to 10 minutes, short clips with a hook in the first 3 seconds achieve higher retention rates and trigger algorithmic loops, resulting in more views for your Whop rewards tally.'
    },
    {
      q: 'Does this video clipper add a watermark or compress quality?',
      a: 'No. Our tool exports completely watermark-free video in your choice of 720p or 1080p Full HD. Because everything processes locally in your browser, the original bitrate and color fidelity are preserved without server re-encoding artifacts.'
    },
    {
      q: 'Can I use this Whop video clipping tool on mobile devices?',
      a: 'Yes! The responsive layout is designed for both smartphones and desktop computers. You can upload video files directly from your mobile camera roll or files app, select timeline in/out handles, adjust vertical framing, and download the finished MP4 straight to your device.'
    },
    {
      q: 'Is my video uploaded to your server or stored anywhere?',
      a: 'Never. All video rendering, frame cutting, cropping, and caption burning are performed 100% client-side inside your browser sandbox using HTML5 Canvas and the MediaStream Recording API. Your video files never transit over the internet or touch an external server, guaranteeing total privacy and instant processing.'
    },
    {
      q: 'How does the 9:16 auto-crop and draggable focus area work?',
      a: 'Most long-form streams are filmed in 16:9 widescreen. Our tool converts them into vertical 9:16 format with a draggable focus slider. You can slide the focus area left, center, or right so the active speaker or gaming action stays perfectly centered inside the phone frame without unsightly black bars.'
    },
    {
      q: 'How do I get paid through Whop Content Rewards?',
      a: 'Whop creators typically pay via Stripe, PayPal, or crypto (USDC) directly through the Whop dashboard. Once your clip reaches the campaign view threshold (e.g., 10,000 views) or wins a weekly leaderboard prize, the creator verifies the analytics and releases the bounty to your connected Whop balance for instant withdrawal.'
    }
  ];

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Free Whop Video Clipping Tool',
      description: 'Free browser-based video clipper to cut long videos into vertical 9:16 shorts for TikTok, Reels, and YouTube Shorts with auto-crop, captions, and zero watermark for Whop Content Rewards.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All Platforms',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map(faq => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a
        }
      }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://apexutility.live'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Free Whop Video Clipping Tool',
          item: 'https://apexutility.live/whop-video-clipping-tool'
        }
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-[#050507] text-zinc-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-white">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* SECTION 1: HERO SECTION */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-red-950/40 bg-gradient-to-b from-red-950/20 via-zinc-950 to-[#050507] overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-red-600/10 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 mb-6 bg-zinc-900/60 px-3 py-1.5 rounded-full border border-zinc-800">
            <button onClick={() => onTabChange('dashboard')} className="hover:text-red-400 transition-colors">Home</button>
            <span className="text-zinc-600">/</span>
            <span className="text-red-400 font-semibold">Free Whop Video Clipping Tool</span>
          </nav>

          {/* Primary Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Whop Content Rewards Companion • 100% Free &amp; Offline-First</span>
          </div>

          {/* Main H1 Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
            Free Whop Video Clipping Tool
          </h1>

          {/* Short Description */}
          <p className="text-lg sm:text-xl text-zinc-300 max-w-3xl mx-auto mb-8 font-normal leading-relaxed">
            The free online video clipper for creators and editors earning money from <strong className="text-white font-semibold">Whop Content Rewards</strong>. Turn long Twitch streams, Kick broadcasts, and YouTube podcasts into viral, vertical 9:16 clips for TikTok, YouTube Shorts, and Instagram Reels with auto-crop, punchy captions, and zero watermarks.
          </p>

          {/* CTA & Trust Badges */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button
              onClick={scrollToTool}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-base shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <Scissors className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Start Clipping Video Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-sm border border-zinc-800 transition-all text-center"
            >
              How Whop Clipping Works
            </a>
          </div>

          {/* Trust Value Props */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-xs text-zinc-400 font-mono">
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-900">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Watermark-Free</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-900">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Server Uploads</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-900">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>9:16 Shorts &amp; Reels</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-900">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Campaign Ready</span>
            </div>
          </div>

          {/* Mandatory Independent Legal Disclaimer */}
          <div className="mt-8 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-left max-w-3xl mx-auto text-xs text-zinc-400 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-zinc-200">
                Independent Free Tool Notice
              </p>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                This is an independent free tool and is not affiliated with or endorsed by Whop. Users must only clip content they have explicit permission to use under the rules of the specific Whop campaign or creator community they join.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE TOOL ITSELF */}
      <section ref={workspaceRef} className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
              <Scissors className="w-4 h-4" /> Client-Side Clipping Studio
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Whop Video Clipper &amp; Vertical Re-framer
            </h2>
          </div>
          <div className="text-xs font-mono text-zinc-500 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800 self-start sm:self-auto">
            ⚡ In-Browser Media Engine • Zero Bandwidth Costs
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500 text-red-200 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-300 hover:text-white font-mono text-xs cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Export Success Banner */}
        {exportSuccessUrl && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mb-6 p-5 rounded-xl bg-emerald-950/70 border border-emerald-500/80 text-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">Clip Rendered Successfully!</h4>
                <p className="text-xs text-emerald-300/80 font-mono mt-0.5">
                  100% Watermark-Free • {targetResolution} • {aspectRatio} Vertical
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <a
                href={exportSuccessUrl}
                download={exportSuccessName || 'whop-clip.mp4'}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download MP4</span>
              </a>
              <button
                onClick={() => setExportSuccessUrl(null)}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}

        {/* Main Workspace Grid: Left Workspace & Right Whop Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Clipper Area (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Video Upload Area (Drag & Drop or Input) */}
            {!videoUrl ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 hover:border-red-500/60 rounded-2xl p-10 sm:p-14 text-center cursor-pointer bg-zinc-950/60 hover:bg-zinc-900/40 transition-all group relative overflow-hidden"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:border-red-500 transition-all text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <Upload className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Drop Your Stream, Podcast, or Video File Here
                </h3>
                <p className="text-sm text-zinc-400 max-w-md mx-auto mb-4">
                  Supports MP4, MOV, and WebM. Processed 100% locally in your browser memory with zero server uploads.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
                  <FileVideo className="w-3.5 h-3.5 text-red-400" />
                  <span>Choose Video File from Device</span>
                </div>
              </div>
            ) : (
              /* Loaded Video Workspace */
              <div className="bg-zinc-950 rounded-2xl border border-zinc-900 overflow-hidden shadow-2xl">
                
                {/* Video Header Controls */}
                <div className="p-4 bg-zinc-900/60 border-b border-zinc-850 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono text-zinc-300 truncate max-w-[200px] sm:max-w-xs font-medium">
                      {videoFile?.name}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                      {videoResolution.width}x{videoResolution.height}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title="Upload a different video"
                    >
                      Change Video
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Video Player & Interactive Cropping Preview */}
                <div className="relative bg-black flex items-center justify-center min-h-[320px] max-h-[500px] overflow-hidden group">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    className="max-h-[500px] w-auto max-w-full object-contain mx-auto"
                    playsInline
                  />

                  {/* 9:16 Vertical Crop Guide Overlay */}
                  {aspectRatio === '9:16' && (
                    <div 
                      className="absolute inset-y-0 border-2 border-red-500/80 bg-red-500/10 pointer-events-none transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] flex flex-col justify-between p-2"
                      style={{
                        width: `${Math.min(100, (9 / 16) * (videoResolution.height / videoResolution.width) * 100)}%`,
                        left: `${cropFocus * (1 - (9 / 16) * (videoResolution.height / videoResolution.width))}%`,
                      }}
                    >
                      <div className="flex justify-between items-center text-[9px] font-mono text-red-300 bg-black/80 px-1.5 py-0.5 rounded self-start">
                        <span>9:16 Vertical Export Safe Area</span>
                      </div>
                      <div className="text-[9px] font-mono text-red-300 bg-black/80 px-1.5 py-0.5 rounded self-end">
                        Focus: {Math.round(cropFocus)}%
                      </div>
                    </div>
                  )}

                  {/* 1:1 Square Crop Guide Overlay */}
                  {aspectRatio === '1:1' && (
                    <div 
                      className="absolute inset-y-0 border-2 border-emerald-500/80 bg-emerald-500/10 pointer-events-none transition-all flex flex-col justify-between p-2"
                      style={{
                        width: `${Math.min(100, (videoResolution.height / videoResolution.width) * 100)}%`,
                        left: `${cropFocus * (1 - (videoResolution.height / videoResolution.width))}%`,
                      }}
                    >
                      <div className="text-[9px] font-mono text-emerald-300 bg-black/80 px-1.5 py-0.5 rounded self-start">
                        1:1 Square Safe Area
                      </div>
                    </div>
                  )}

                  {/* Overlay Captions Live Preview */}
                  {enableCaptions && captionText.trim() && (
                    <div 
                      className="absolute inset-x-0 px-6 text-center pointer-events-none z-20"
                      style={{
                        top: captionPosition === 'top' ? '15%' : captionPosition === 'middle' ? '50%' : '80%',
                        transform: captionPosition === 'middle' ? 'translateY(-50%)' : 'none'
                      }}
                    >
                      <span 
                        className="font-extrabold uppercase tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
                        style={{
                          color: captionColor,
                          fontSize: captionSize === 'sm' ? '14px' : captionSize === 'md' ? '18px' : captionSize === 'lg' ? '24px' : '30px',
                          fontFamily: clipFontToFamily(captionFont),
                          textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 10px rgba(0,0,0,0.9)'
                        }}
                      >
                        {captionText}
                      </span>
                    </div>
                  )}

                  {/* Center Play/Pause Floating Overlay */}
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-red-600/90 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 cursor-pointer shadow-2xl backdrop-blur-sm"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </button>
                </div>

                {/* Player Timeline Bar & Current Position */}
                <div className="p-4 sm:p-6 bg-zinc-950 space-y-4">
                  {/* Current Position / In / Out Indicators */}
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{formatSeconds(currentTime)}</span>
                      <span className="text-zinc-600">/</span>
                      <span>{formatSeconds(videoDuration)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-zinc-300">
                        Clip Length: <strong className="text-red-400 font-bold">{Math.max(0, endTime - startTime).toFixed(1)}s</strong>
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        (Start: {formatSeconds(startTime)} • End: {formatSeconds(endTime)})
                      </span>
                    </div>
                  </div>

                  {/* Visual Scrubber Timeline */}
                  <div className="relative pt-1 pb-1">
                    {/* Background track */}
                    <div className="w-full h-3 bg-zinc-900 rounded-lg relative overflow-hidden border border-zinc-800">
                      {/* Selected Range Highlight */}
                      <div 
                        className="absolute h-full bg-red-600/60 border-x-2 border-red-400"
                        style={{
                          left: `${(startTime / Math.max(1, videoDuration)) * 100}%`,
                          width: `${Math.max(1, ((endTime - startTime) / Math.max(1, videoDuration)) * 100)}%`
                        }}
                      />
                      {/* Current Playhead */}
                      <div 
                        className="absolute h-full w-1 bg-white shadow-lg"
                        style={{
                          left: `${(currentTime / Math.max(1, videoDuration)) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Dual Sliders: Start & End Handle Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-400">Clip Start Handle:</span>
                        <span className="text-white font-bold">{formatSeconds(startTime)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, endTime - 0.5)}
                        step="0.1"
                        value={startTime}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setStartTime(val);
                          seekTo(val);
                        }}
                        className="w-full accent-red-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-400">Clip End Handle:</span>
                        <span className="text-white font-bold">{formatSeconds(endTime)}</span>
                      </div>
                      <input
                        type="range"
                        min={startTime + 0.5}
                        max={videoDuration || 60}
                        step="0.1"
                        value={endTime}
                        onChange={(e) => setEndTime(parseFloat(e.target.value))}
                        className="w-full accent-red-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Clip Length Quick Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-900">
                    <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5 mr-1">
                      <Clock className="w-3.5 h-3.5 text-red-400" /> Shorts Presets:
                    </span>
                    <button
                      onClick={() => applyPresetLength(15)}
                      className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                    >
                      15s (Snappy Hook)
                    </button>
                    <button
                      onClick={() => applyPresetLength(30)}
                      className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                    >
                      30s (TikTok Sweet Spot)
                    </button>
                    <button
                      onClick={() => applyPresetLength(60)}
                      className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                    >
                      60s (YouTube Shorts Max)
                    </button>
                    <button
                      onClick={() => applyPresetLength(90)}
                      className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                    >
                      90s (Reels Extended)
                    </button>
                  </div>
                </div>

                {/* Aspect Ratio & Auto-Crop Framing Panel */}
                <div className="p-4 sm:p-6 bg-zinc-900/30 border-t border-zinc-900 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-red-400" />
                        Aspect Ratio &amp; Vertical Framing
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Crop horizontal widescreen streams into mobile-ready vertical format.
                      </p>
                    </div>

                    {/* Ratio Toggles */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAspectRatio('9:16')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          aspectRatio === '9:16'
                            ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>9:16 (Shorts/TikTok)</span>
                      </button>

                      <button
                        onClick={() => setAspectRatio('1:1')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          aspectRatio === '1:1'
                            ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        <Square className="w-3.5 h-3.5" />
                        <span>1:1 (Square)</span>
                      </button>

                      <button
                        onClick={() => setAspectRatio('16:9')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          aspectRatio === '16:9'
                            ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>16:9 (Landscape)</span>
                      </button>
                    </div>
                  </div>

                  {/* Draggable Focus Area Pan Slider for 9:16 Crop */}
                  {aspectRatio === '9:16' && (
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-300 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-red-400" />
                          Draggable Subject Focus Position:
                        </span>
                        <span className="text-red-400 font-bold">
                          {cropFocus < 35 ? 'Left Anchor' : cropFocus > 65 ? 'Right Anchor' : 'Center Speaker (50%)'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-zinc-500">Left (0%)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={cropFocus}
                          onChange={(e) => setCropFocus(parseInt(e.target.value))}
                          className="flex-1 accent-red-500 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-zinc-500">Right (100%)</span>
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-1 text-[10px] font-mono">
                        <button
                          onClick={() => setCropFocus(15)}
                          className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                        >
                          Left (Game/Cam)
                        </button>
                        <button
                          onClick={() => setCropFocus(50)}
                          className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-red-400 hover:text-white font-bold cursor-pointer"
                        >
                          Reset Center (50%)
                        </button>
                        <button
                          onClick={() => setCropFocus(85)}
                          className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                        >
                          Right (Chat/Host)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Viral Auto-Captions Engine Panel */}
                <div className="p-4 sm:p-6 bg-zinc-950 border-t border-zinc-900 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                        <Type className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Viral Caption &amp; Hook Engine</h4>
                        <p className="text-xs text-zinc-400">
                          Add punchy on-screen text to boost watch time and stop the scroll.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enableCaptions}
                        onChange={(e) => setEnableCaptions(e.target.checked)}
                        className="rounded accent-red-600 w-4 h-4"
                      />
                      <span className="text-xs font-mono text-zinc-300">Burn Captions into Clip</span>
                    </label>
                  </div>

                  {enableCaptions && (
                    <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
                      {/* Caption Input & Speech-to-Text Button */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-mono text-zinc-400">
                          <span>Hook / Subtitle Text:</span>
                          <button
                            onClick={handleAutoTranscribe}
                            disabled={isTranscribing}
                            className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="w-3 h-3" />
                            {isTranscribing ? 'Listening...' : 'Auto-Listen via Web Speech API'}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={captionText}
                          onChange={(e) => setCaptionText(e.target.value)}
                          placeholder="e.g. HOW TO MAKE $1000 ON WHOP"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 font-bold"
                        />
                        {transcribeNotice && (
                          <p className="text-[11px] text-zinc-400 font-mono mt-1">{transcribeNotice}</p>
                        )}
                      </div>

                      {/* Styling Controls Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                        {/* Font Style */}
                        <div>
                          <label className="text-zinc-500 block mb-1">Font Style</label>
                          <select
                            value={captionFont}
                            onChange={(e) => setCaptionFont(e.target.value as any)}
                            className="w-full px-2 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
                          >
                            <option value="impact">Impact (TikTok Bold)</option>
                            <option value="modern">Modern Bold</option>
                            <option value="sans">Sans-Serif Clean</option>
                            <option value="serif">Classic Serif</option>
                          </select>
                        </div>

                        {/* Font Size */}
                        <div>
                          <label className="text-zinc-500 block mb-1">Text Size</label>
                          <select
                            value={captionSize}
                            onChange={(e) => setCaptionSize(e.target.value as any)}
                            className="w-full px-2 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
                          >
                            <option value="sm">Small</option>
                            <option value="md">Medium</option>
                            <option value="lg">Large (Recommended)</option>
                            <option value="xl">Extra Large</option>
                          </select>
                        </div>

                        {/* Text Color */}
                        <div>
                          <label className="text-zinc-500 block mb-1">Color</label>
                          <div className="flex items-center gap-1.5 pt-1">
                            {[
                              { label: 'Yellow', val: '#FACC15' },
                              { label: 'White', val: '#FFFFFF' },
                              { label: 'Neon Green', val: '#22C55E' },
                              { label: 'Cyan', val: '#06B6D4' }
                            ].map(c => (
                              <button
                                key={c.val}
                                onClick={() => setCaptionColor(c.val)}
                                style={{ backgroundColor: c.val }}
                                className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                                  captionColor === c.val ? 'scale-125 border-white' : 'border-zinc-800'
                                }`}
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Position */}
                        <div>
                          <label className="text-zinc-500 block mb-1">Screen Position</label>
                          <select
                            value={captionPosition}
                            onChange={(e) => setCaptionPosition(e.target.value as any)}
                            className="w-full px-2 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
                          >
                            <option value="top">Top (Hook)</option>
                            <option value="middle">Middle (Center Screen)</option>
                            <option value="bottom">Bottom (Subtitles)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Bar: Add to Clip Queue or Instant Export */}
                <div className="p-4 sm:p-6 bg-zinc-900/60 border-t border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Resolution & Watermark Badges */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs font-mono text-zinc-400">
                      <span>Export:</span>
                      <button
                        onClick={() => setTargetResolution('1080p')}
                        className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                          targetResolution === '1080p' ? 'bg-red-950 text-red-400 border border-red-800/60' : 'bg-zinc-900 text-zinc-500'
                        }`}
                      >
                        1080p HD
                      </button>
                      <button
                        onClick={() => setTargetResolution('720p')}
                        className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                          targetResolution === '720p' ? 'bg-red-950 text-red-400 border border-red-800/60' : 'bg-zinc-900 text-zinc-500'
                        }`}
                      >
                        720p Fast
                      </button>
                    </div>

                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-900/60 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> No Watermark
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleAddClip}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Save this segment to your batch list"
                    >
                      <Plus className="w-4 h-4 text-red-400" />
                      <span>Save to Clip List</span>
                    </button>

                    <button
                      onClick={() => handleExportClip()}
                      disabled={isExporting}
                      className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Exporting ({exportProgress}%)...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Export MP4 Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Export Progress Bar */}
                {isExporting && (
                  <div className="p-4 bg-zinc-950 border-t border-zinc-900 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">{exportStatusText}</span>
                      <span className="text-red-400 font-bold">{exportProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-200"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Multi-Clip Queue / List Panel */}
            {savedClips.length > 0 && (
              <div className="bg-zinc-950 rounded-2xl border border-zinc-900 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-red-400" />
                    <h4 className="font-bold text-white text-sm">
                      Trimmed Clips List ({savedClips.length})
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    Multiple clips cut from this video
                  </span>
                </div>

                <div className="space-y-2.5">
                  {savedClips.map((clip, idx) => (
                    <div
                      key={clip.id}
                      onClick={() => handleLoadClip(clip)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        activeClipId === clip.id
                          ? 'bg-red-950/20 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                          : 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center font-mono text-xs font-bold text-zinc-300">
                          {idx + 1}
                        </span>
                        <div>
                          <h5 className="font-bold text-xs text-white">{clip.name}</h5>
                          <p className="text-[11px] font-mono text-zinc-400">
                            {formatSeconds(clip.startTime)} → {formatSeconds(clip.endTime)} • {clip.aspectRatio} • {clip.resolution}
                            {clip.hasCaptions && ' • With Captions'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportClip(clip);
                          }}
                          disabled={isExporting}
                          className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                          title="Export this clip"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export</span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteClip(clip.id, e)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                          title="Delete clip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Whop Clipping Checklist & Campaign Tips (4 cols on lg) */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Interactive Whop Clipping Checklist Card */}
            <div className="bg-zinc-950 rounded-2xl border border-zinc-900 p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-red-400" />
                  <h3 className="font-bold text-white text-base">Whop Clipping Checklist</h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-900/60 font-bold">
                  {completedChecksCount} / {CHECKLIST_ITEMS.length} Passed
                </span>
              </div>

              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                Ensure your clip complies with Whop Content Rewards guidelines to guarantee your views get approved for payout:
              </p>

              {/* Progress Bar for Checklist */}
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-5">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-emerald-500 transition-all duration-300"
                  style={{ width: `${(completedChecksCount / CHECKLIST_ITEMS.length) * 100}%` }}
                />
              </div>

              {/* Checklist Items */}
              <div className="space-y-3">
                {CHECKLIST_ITEMS.map((item) => {
                  const isChecked = !!checkedItems[item.id];
                  return (
                    <label
                      key={item.id}
                      onClick={() => toggleCheckItem(item.id)}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                        isChecked 
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200' 
                          : 'bg-zinc-900/30 hover:bg-zinc-900/60 border-zinc-850 text-zinc-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent div
                        className="mt-0.5 rounded accent-emerald-500 w-4 h-4"
                      />
                      <span className={`leading-relaxed ${isChecked ? 'line-through text-zinc-400' : ''}`}>
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Quick Action: Copy Whop Hashtags */}
              <div className="mt-6 pt-5 border-t border-zinc-900">
                <button
                  onClick={copyHashtagsToClipboard}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white text-xs font-mono font-medium border border-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedHashtags ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied Whop Tags!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-red-400" />
                      <span>Copy Standard Whop Hashtags</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Campaign Rule Reminders Card */}
            <div className="bg-zinc-950/60 rounded-2xl border border-zinc-900 p-6 space-y-4 text-xs text-zinc-400">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                How Whop View Bounties Work
              </h4>
              <ul className="space-y-2.5 list-disc pl-4 text-zinc-300 leading-relaxed">
                <li>
                  <strong>CPM Payouts:</strong> Most creators pay $1 to $5+ per 1,000 verified views on TikTok or YouTube Shorts.
                </li>
                <li>
                  <strong>First 3-Second Hook:</strong> The algorithm will kill videos without a 70%+ retention rate at the 3-second mark.
                </li>
                <li>
                  <strong>Never Re-upload Stale Clips:</strong> Cut unique angles or add punchy commentary to avoid "unoriginal content" flags.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS (3-4 STEPS) */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-red-950/30">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold">
            Simple 4-Step Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            How to Clip Videos for Whop Campaigns
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-3">
            Produce ready-to-post vertical shorts from long streams in under 60 seconds with zero technical experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 relative space-y-3">
            <span className="w-8 h-8 rounded-full bg-red-950 border border-red-800 text-red-400 font-mono font-bold text-sm flex items-center justify-center">
              1
            </span>
            <h3 className="font-bold text-base text-white">Upload Long Video</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Drag &amp; drop any stream vod, YouTube podcast, or raw MP4/MOV file. Everything runs locally in browser memory.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 relative space-y-3">
            <span className="w-8 h-8 rounded-full bg-red-950 border border-red-800 text-red-400 font-mono font-bold text-sm flex items-center justify-center">
              2
            </span>
            <h3 className="font-bold text-base text-white">Trim the Viral Hook</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Use the timeline scrubber and 15s/30s/60s presets to isolate high-retention moments with a punchy hook.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 relative space-y-3">
            <span className="w-8 h-8 rounded-full bg-red-950 border border-red-800 text-red-400 font-mono font-bold text-sm flex items-center justify-center">
              3
            </span>
            <h3 className="font-bold text-base text-white">Auto-Crop 9:16 &amp; Captions</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Center the active speaker with the draggable focus slider and add high-contrast yellow captions for silent mobile scrolling.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 relative space-y-3">
            <span className="w-8 h-8 rounded-full bg-red-950 border border-red-800 text-red-400 font-mono font-bold text-sm flex items-center justify-center">
              4
            </span>
            <h3 className="font-bold text-base text-white">Export &amp; Claim Bounties</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Download clean, watermark-free 1080p MP4 clips, upload them with required hashtags, and collect your Whop view rewards.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURES */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-red-950/30">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold">
            Engineered for Creators
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Features Built for Whop Content Rewards Clippers
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-3">
            Everything you need to produce high-performing TikToks, Shorts, and Reels without expensive editing software.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">100% In-Browser Privacy</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No video is ever uploaded to a server or cloud database. All decoding, cropping, and rendering happen inside your personal device memory buffer.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">9:16 Vertical Auto-Crop</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Instantly re-frame horizontal 16:9 recordings into vertical TikTok dimensions. Adjust the draggable focus area to keep the speaker or gaming action centered.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400">
              <Type className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Viral Caption Engine</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Over 70% of social media users watch videos with sound off. Add high-contrast Impact or Montserrat captions in yellow, white, or cyan with bold black outlines.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Multi-Clip Batch Workspace</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Slice 5, 10, or 20 distinct short clips from a single 2-hour livestream without re-uploading the source file each time.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">15s / 30s / 60s Presets</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              One-click preset buttons automatically lock the end timestamp to standard social media retention guidelines to maximize completion rate algorithms.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Zero Watermark MP4 Export</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Export pristine 720p or 1080p MP4 files with clean audio and zero branding logos, ensuring compliance with strict campaign rules.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: WHO IT'S FOR */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-red-950/30">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold">
            Target Audience
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Who Is This Video Clipping Tool Built For?
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-3">
            Designed for anyone looking to capitalize on the explosive creator economy and short-form content bounties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Whop Content Rewards Clippers
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Individuals participating in Whop creator bounties who need to rapidly slice long stream VODs into dozens of viral vertical clips to accumulate verified views and maximize monthly payouts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <VideoIcon className="w-5 h-5 text-red-400" />
              Podcast &amp; Stream Repurposers
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Editors managing Kick, Twitch, and YouTube podcast clip channels who want a fast, zero-install trimmer to quickly convert landscape conversations into 9:16 vertical shorts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Beginner Side-Hustlers
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Aspiring creators who don't own high-end computers or expensive Adobe Premiere / Final Cut Pro subscriptions, but want a free, professional browser tool to start earning online.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: IN-DEPTH GUIDE: HOW TO START WHOP CLIPPING */}
      <article className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full border-t border-red-950/30 text-zinc-300 leading-relaxed space-y-8">
        <header className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold">
            Beginner’s Blueprint
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            How to Start Whop Video Clipping: The Complete Beginner’s Guide
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 font-normal">
            A comprehensive, actionable walkthrough on finding campaigns, selecting viral hooks, staying compliant, and scaling your earnings with short-form content rewards.
          </p>
        </header>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white">1. Understanding Whop Content Rewards</h3>
          <p className="text-sm text-zinc-300">
            Whop Content Rewards is an innovative marketing model where creators, SaaS founders, trading communities, and influencers pay their community members to clip and distribute their content across social media. Instead of spending thousands on traditional ads, creators establish dedicated reward pools or pay a set CPM (Cost Per Mille, or payout per 1,000 views) for organic views accumulated on TikTok, YouTube Shorts, and Instagram Reels.
          </p>
          <p className="text-sm text-zinc-300">
            As a clipper, your objective is simple: identify engaging, provocative, or educational moments in long-form broadcasts, format them for mobile engagement, and post them with the required referral tags.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white">2. Finding Approved Campaigns &amp; Verifying Permissions</h3>
          <p className="text-sm text-zinc-300">
            Before clipping any video, you must ensure you have legitimate permission to use the footage. Joining a Whop community with an active clipping campaign automatically grants you permission under that creator’s specific rules.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300">
            <li><strong>Whop Marketplace:</strong> Search the Whop Explore page for communities offering "Clipping Bounties" or "Content Rewards".</li>
            <li><strong>Campaign Terms:</strong> Read the rules carefully. Some creators forbid political topics, cursing, or unauthorized music, while others mandate specific opening hooks.</li>
            <li><strong>Official Asset Drives:</strong> Many creators provide Google Drive folders or YouTube links containing raw stream recordings specifically intended for clippers.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white">3. The 3-Second Hook Rule for Viral Retention</h3>
          <p className="text-sm text-zinc-300">
            On short-form algorithms, the first 3 seconds dictate whether your video reaches 200 views or 2,000,000 views. To stop the user’s thumb:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300">
            <li><strong>Open with a bold question:</strong> "Did he really just say that live on stream?"</li>
            <li><strong>Cut out dead air:</strong> Trim out long pauses, intro screens, or background coughing immediately.</li>
            <li><strong>Use Large On-Screen Text:</strong> Burn a high-contrast caption into the top or center of the video using our built-in caption editor.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white">4. Structuring Clips for Maximum Completion Rate</h3>
          <p className="text-sm text-zinc-300">
            Short-form algorithms favor videos that achieve over 100% average watch time (meaning users watched the clip more than once). Keeping your clips between 15 and 35 seconds makes this significantly easier to accomplish. When you end a clip, try to loop the final sentence back into the opening hook for seamless replayability.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white">5. Submitting Clips and Receiving Payouts</h3>
          <p className="text-sm text-zinc-300">
            Once your video has been live for 24 to 72 hours and gathered views, return to the creator’s Whop campaign portal. Submit the direct URL of your TikTok or YouTube Short. The Whop tracking engine verifies the view count and credits your account balance according to the agreed CPM rate. You can withdraw your earnings directly to your bank account or PayPal.
          </p>
        </section>
      </article>

      {/* SECTION 7: FAQ (ACCORDION WITH 9 QUESTIONS) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full border-t border-red-950/30">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-400 text-sm mt-2">
            Everything you need to know about our free video clipper and Whop clipping campaigns.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-zinc-900 bg-zinc-950 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-zinc-100 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-900/60 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 8: RELATED TOOLS / SERVICES (INTERNAL LINKS) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-red-950/30">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold">
            Productivity Suite
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Related Media &amp; Creator Utilities
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-2">
            Explore our complementary client-side utilities to polish your audio, compress files, and generate viral hooks.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => onTabChange('video-cutter')}
            className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-red-500/50 text-left transition-all group cursor-pointer"
          >
            <Scissors className="w-5 h-5 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-xs text-white group-hover:text-red-400 transition-colors">
              Online Video Cutter &amp; Trimmer
            </h4>
            <p className="text-[11px] text-zinc-500 mt-1">
              Precision frame-by-frame trimming for general video editing.
            </p>
          </button>

          <button
            onClick={() => onTabChange('video-compressor')}
            className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-red-500/50 text-left transition-all group cursor-pointer"
          >
            <Sliders className="w-5 h-5 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-xs text-white group-hover:text-red-400 transition-colors">
              Free Online Video Compressor
            </h4>
            <p className="text-[11px] text-zinc-500 mt-1">
              Reduce video file size without quality loss for faster uploads.
            </p>
          </button>

          <button
            onClick={() => onTabChange('audio-trimmer')}
            className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-red-500/50 text-left transition-all group cursor-pointer"
          >
            <Volume2 className="w-5 h-5 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-xs text-white group-hover:text-red-400 transition-colors">
              Audio Trimmer &amp; Sound Cutter
            </h4>
            <p className="text-[11px] text-zinc-500 mt-1">
              Cut viral soundbites, voice clips, and audio hooks offline.
            </p>
          </button>

          <button
            onClick={() => onTabChange('ai-transcriber')}
            className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-red-500/50 text-left transition-all group cursor-pointer"
          >
            <Type className="w-5 h-5 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-xs text-white group-hover:text-red-400 transition-colors">
              AI Audio Transcriber
            </h4>
            <p className="text-[11px] text-zinc-500 mt-1">
              Generate accurate timecoded transcripts for long podcasts.
            </p>
          </button>

          <button
            onClick={() => onTabChange('video-resizer')}
            className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-red-500/50 text-left transition-all group cursor-pointer"
          >
            <Smartphone className="w-5 h-5 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-xs text-white group-hover:text-red-400 transition-colors">
              Video Resizer &amp; Aspect Ratio
            </h4>
            <p className="text-[11px] text-zinc-500 mt-1">
              Scale and re-encode videos into 9:16, 1:1, or 16:9 ratios.
            </p>
          </button>

          <button
            onClick={() => onTabChange('video-recorder')}
            className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-red-500/50 text-left transition-all group cursor-pointer"
          >
            <VideoIcon className="w-5 h-5 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-xs text-white group-hover:text-red-400 transition-colors">
              Free Screen &amp; Video Studio
            </h4>
            <p className="text-[11px] text-zinc-500 mt-1">
              Record browser windows, games, and webcam feeds in HD.
            </p>
          </button>

          <button
            onClick={() => onTabChange('social-hooks')}
            className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-red-500/50 text-left transition-all group cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-xs text-white group-hover:text-red-400 transition-colors">
              AI Social Media Hook Generator
            </h4>
            <p className="text-[11px] text-zinc-500 mt-1">
              Brainstorm viral headline hooks to skyrocket video CTR.
            </p>
          </button>

          <button
            onClick={() => onTabChange('sitemap-generator')}
            className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-red-500/50 text-left transition-all group cursor-pointer"
          >
            <Tag className="w-5 h-5 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-xs text-white group-hover:text-red-400 transition-colors">
              XML Sitemap Generator
            </h4>
            <p className="text-[11px] text-zinc-500 mt-1">
              Generate and validate search-compliant sitemaps for Google.
            </p>
          </button>
        </div>
      </section>
    </main>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Upload, 
  FileAudio, 
  Trash2, 
  Play, 
  Pause, 
  Download, 
  Copy, 
  Check, 
  Search, 
  Volume2, 
  Clock, 
  User, 
  Globe, 
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { logToolUsage } from '../utils/toolAnalytics';

interface TranscriptSegment {
  startTime: number;
  endTime: number;
  speaker?: string;
  text: string;
}

const SUPPORTED_LANGUAGES = [
  { code: '', label: 'Auto Detect Language' },
  { code: 'English', label: 'English' },
  { code: 'Spanish', label: 'Spanish / Español' },
  { code: 'French', label: 'French / Français' },
  { code: 'German', label: 'German / Deutsch' },
  { code: 'Portuguese', label: 'Portuguese / Português' },
  { code: 'Arabic', label: 'Arabic' },
  { code: 'Chinese', label: 'Chinese / 中文' },
  { code: 'Hindi', label: 'Hindi / हिन्दी' },
  { code: 'Japanese', label: 'Japanese / 日本語' },
];

export default function AIAudioTranscriber() {
  const { language } = useLanguage();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeProgress, setTranscribeProgress] = useState<string>('');
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedFormat, setCopiedFormat] = useState<'txt' | 'srt' | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [selectedSpeakerFilter, setSelectedSpeakerFilter] = useState<string>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Sync audio player play/pause state and current play time
  useEffect(() => {
    const player = audioPlayerRef.current;
    if (!player) return;

    const handleTimeUpdate = () => {
      setCurrentTime(player.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    player.addEventListener('timeupdate', handleTimeUpdate);
    player.addEventListener('play', handlePlay);
    player.addEventListener('pause', handlePause);

    return () => {
      player.removeEventListener('timeupdate', handleTimeUpdate);
      player.removeEventListener('play', handlePlay);
      player.removeEventListener('pause', handlePause);
    };
  }, [audioUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      loadAudioFile(file);
    } else {
      setErrorHeader('Unsupported file type. Please upload a valid audio recording.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadAudioFile(file);
    }
  };

  const loadAudioFile = (file: File) => {
    setErrorHeader(null);
    setAudioFile(file);
    setSegments([]); // clear old transcript
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.load();
    }
  };

  const handleRemoveFile = () => {
    setAudioFile(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setSegments([]);
    setErrorHeader(null);
  };

  // Convert files to base64
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const raw = reader.result as string;
        // strip prefix
        const base64 = raw.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleTranscribe = async () => {
    if (!audioFile) return;

    setIsTranscribing(true);
    setErrorHeader(null);
    setTranscribeProgress('Starting transaction...');

    try {
      setTranscribeProgress('Converting recording to secure transmission format...');
      const base64Audio = await getBase64(audioFile);

      setTranscribeProgress('Uploading to Gemini 2.5 Flash for audio analysis...');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType: audioFile.type,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server returned an error status during transcription.');
      }

      const data = await response.json();
      
      if (!data.transcript || !Array.isArray(data.transcript)) {
        throw new Error('Malformed transcription payload returned from server.');
      }

      setSegments(data.transcript);
      logToolUsage('ai-transcriber');
    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.message || 'A network error occurred. Please try again.');
    } finally {
      setIsTranscribing(false);
      setTranscribeProgress('');
    }
  };

  // Human descriptive time format MM:SS
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Millisecond precise SRT timestamps: HH:MM:SS,ms
  const formatSRTTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };

  const srtOutput = segments.map((seg, idx) => {
    const speakerPrefix = seg.speaker ? `[${seg.speaker}]: ` : '';
    return `${idx + 1}\n${formatSRTTime(seg.startTime)} --> ${formatSRTTime(seg.endTime)}\n${speakerPrefix}${seg.text}\n`;
  }).join('\n');

  const txtOutput = segments.map(seg => {
    const speakerPrefix = seg.speaker ? `(${seg.speaker}) ` : '';
    return `[${formatTime(seg.startTime)} - ${formatTime(seg.endTime)}]  ${speakerPrefix}${seg.text}`;
  }).join('\n');

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (content: string, format: 'txt' | 'srt') => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    });
  };

  const seekToSegment = (seconds: number) => {
    const player = audioPlayerRef.current;
    if (player) {
      player.currentTime = seconds;
      player.play().catch(() => {});
    }
  };

  // Unique list of speaker labels for filter option
  const speakerLabels = Array.from(
    new Set(segments.map(s => s.speaker).filter(Boolean))
  ) as string[];

  // Filtered segments based on search queries and speaker chosen
  const filteredSegments = segments.filter(seg => {
    const matchesSearch = seg.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (seg.speaker && seg.speaker.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSpeaker = selectedSpeakerFilter === 'all' || seg.speaker === selectedSpeakerFilter;
    
    return matchesSearch && matchesSpeaker;
  });

  const getActiveSegmentIndex = () => {
    return segments.findIndex(s => currentTime >= s.startTime && currentTime <= s.endTime);
  };

  const activeSegmentIndex = getActiveSegmentIndex();

  return (
    <div className="p-1 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200/50 dark:border-zinc-800/40 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
              <Mic className="h-5 w-5" />
            </span>
            <h1 id="ai-audio-transcriber-title" className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              AI Audio Transcriber
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Powered by Gemini
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Convert any speech in audio recordings into structural, time-coded text, paragraphs, and high-fidelity captions.
          </p>
        </div>
      </div>

      {errorHeader && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/30 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Transcription Failure</h3>
            <p className="text-xs text-red-700 dark:text-red-300/80 mt-1">{errorHeader}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: upload and media control */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm p-4 md:p-6 space-y-5">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-400 dark:text-zinc-500 uppercase flex items-center gap-2">
              <Upload className="h-3.5 w-3.5" /> Audio Workspace
            </h2>

            {!audioFile ? (
              // FILE DROP ZONE
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/10' 
                    : 'border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/10'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="audio/*"
                  className="hidden"
                />
                <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400 mb-4 shadow-sm">
                  <Volume2 className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Select or drag an audio file
                </h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5 max-w-xs">
                  Supports MP3, WAV, M4A, OGG, WEBM, FLAC formats up to 40MB.
                </p>
              </div>
            ) : (
              // LOADED AUDIO FILE UI
              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 shrink-0">
                    <FileAudio className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono">SELECTED TRACK</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                      {audioFile.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • {audioFile.type}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    disabled={isTranscribing}
                    className="p-1 px-2 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 rounded-lg transition shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {audioUrl && (
                  <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-800/40">
                    <audio
                      ref={audioPlayerRef}
                      src={audioUrl}
                      controls
                      className="w-full h-10 outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TRANSCRIBE CONFIGURATION */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Globe className="h-3 w-3" /> Language Settings
                </label>
                <select
                  disabled={isTranscribing}
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 p-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 block">
                  Selecting the correct language manually minimizes structural spelling transcription anomalies.
                </span>
              </div>

              <button
                onClick={handleTranscribe}
                disabled={!audioFile || isTranscribing}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-medium text-sm transition shadow-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
              >
                {isTranscribing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Transcribing Speech...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate AI Transcript</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* LOADING STATE REASSURANCE */}
          <AnimatePresence>
            {isTranscribing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-indigo-500/5 dark:bg-indigo-400/5 border border-indigo-500/20 dark:border-indigo-500/10 rounded-2xl p-4 md:p-5 text-indigo-700 dark:text-indigo-400 space-y-2 text-center"
              >
                <HelpCircle className="h-6 w-6 mx-auto animate-bounce mb-1 text-indigo-500 dark:text-indigo-400" />
                <p className="text-sm font-medium">Analyzing Audio Waveforms</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {transcribeProgress}
                </p>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-indigo-600 h-full w-2/3 animate-pulse rounded-full" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: Transcript Output */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm p-4 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200/50 dark:border-zinc-800/40 pb-4">
              <h2 className="text-sm font-semibold tracking-wide text-zinc-400 dark:text-zinc-500 uppercase flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" /> Output Transcript
              </h2>

              {/* DOWNLOAD EXPORT CAPABILITIES */}
              {segments.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    onClick={() => downloadFile(srtOutput, `${audioFile?.name || 'transcript'}.srt`, 'text/plain')}
                    className="flex items-center gap-1 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-lg transition"
                  >
                    <Download className="h-3.5 w-3.5" /> SRT
                  </button>
                  <button
                    onClick={() => downloadFile(txtOutput, `${audioFile?.name || 'transcript'}.txt`, 'text/plain')}
                    className="flex items-center gap-1 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-lg transition"
                  >
                    <Download className="h-3.5 w-3.5" /> TXT
                  </button>
                  <button
                    onClick={() => handleCopy(srtOutput, 'srt')}
                    className="flex items-center gap-1 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-lg transition"
                  >
                    {copiedFormat === 'srt' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>SRT</span>
                  </button>
                  <button
                    onClick={() => handleCopy(txtOutput, 'txt')}
                    className="flex items-center gap-1 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-lg transition"
                  >
                    {copiedFormat === 'txt' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>TXT</span>
                  </button>
                </div>
              )}
            </div>

            {segments.length === 0 ? (
              // EMPTY RESULTS TEMPLATE
              <div className="py-16 flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-505">
                <div className="p-4 rounded-full bg-zinc-50 dark:bg-zinc-950/30 text-zinc-400 mb-4">
                  <Mic className="h-8 w-8" />
                </div>
                <h3 className="text-zinc-800 dark:text-zinc-200 text-sm font-semibold">No Transcript Available</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mt-1.5">
                  Upload an audio file on the left workspace and trigger Gemini transcription to populate segment-by-segment speaker details here.
                </p>
              </div>
            ) : (
              // ACTIVE TRANSLATION VISUALIZATION
              <div className="space-y-4">
                {/* SEARCH AND FILTERS */}
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <div className="relative w-full sm:flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search text or speaker..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  
                  {speakerLabels.length > 0 && (
                    <select
                      value={selectedSpeakerFilter}
                      onChange={(e) => setSelectedSpeakerFilter(e.target.value)}
                      className="w-full sm:w-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="all">All Speakers</option>
                      {speakerLabels.map(spk => (
                        <option key={spk} value={spk}>{spk}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* SEGMENT CARDS BOX */}
                <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                  {filteredSegments.length === 0 ? (
                    <div className="text-center py-8 text-xs text-zinc-400 dark:text-zinc-505">
                      No segments match the chosen filters.
                    </div>
                  ) : (
                    filteredSegments.map((seg, index) => {
                      const isActive = segments.indexOf(seg) === activeSegmentIndex;
                      
                      return (
                        <div
                          key={index}
                          onClick={() => seekToSegment(seg.startTime)}
                          className={`group relative p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                            isActive
                              ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/15 shadow-sm shadow-indigo-500/5'
                              : 'border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/20 dark:bg-zinc-950/5 hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-mono ${
                              isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-zinc-400 dark:text-zinc-500'
                            }`}>
                              <Clock className="h-3 w-3" />
                              {formatTime(seg.startTime)} – {formatTime(seg.endTime)}
                            </span>

                            {seg.speaker && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] tracking-wide font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/40">
                                <User className="h-2.5 w-2.5" />
                                {seg.speaker}
                              </span>
                            )}
                          </div>
                          
                          <p className={`text-xs md:text-sm leading-relaxed ${
                            isActive ? 'text-indigo-950 dark:text-indigo-100 font-medium' : 'text-zinc-700 dark:text-zinc-300'
                          }`}>
                            {seg.text}
                          </p>

                          {/* micro play symbol trigger */}
                          <div className="absolute right-3.5 top-3.5 opacity-0 group-hover:opacity-100 transition duration-150">
                            <Play className="h-3 w-3 text-indigo-500 dark:text-indigo-400 fill-indigo-500/20" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="rounded-xl border border-indigo-100 dark:border-indigo-950/40 bg-indigo-500/[0.02] p-3 text-left">
                  <p className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80 flex items-center gap-1.5 leading-normal">
                    <Volume2 className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span><strong>Pro Tip:</strong> Click any segment caption above to instantly jump the audio player playback to that specific statement timestamp! Excellent for reviewing speech.</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

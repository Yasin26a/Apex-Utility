import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, MicOff, Play, Pause, Square, Download, 
  Volume2, VolumeX, RefreshCw, AlertCircle, Sparkles, 
  CheckCircle, Settings, FileAudio, ChevronRight, Activity
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { logToolUsage } from '../utils/toolAnalytics';
import { SEO_H1_MAPPING, SEO_DESC_MAPPING } from '../seo-mapping';

interface DeviceOption {
  deviceId: string;
  label: string;
}

export default function VoiceRecorder() {
  const { language } = useLanguage();
  
  useEffect(() => {
    logToolUsage('voice-recorder');
  }, []);

  // Recording State
  const [recorderState, setRecorderState] = useState<'idle' | 'recording' | 'paused' | 'complete'>('idle');
  const [micDevices, setMicDevices] = useState<DeviceOption[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result Parameters
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordedBlobSize, setRecordedBlobSize] = useState<number>(0);
  const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [playbackProgress, setPlaybackProgress] = useState(0);

  // Media Capture Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const totalSamplesRef = useRef<number>(0);
  const levelAnimationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Playback Refs
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  // Enumerate Mic Devices
  useEffect(() => {
    enumerateMics(false);
    return () => {
      cleanupStream();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (levelAnimationFrameRef.current) cancelAnimationFrame(levelAnimationFrameRef.current);
    };
  }, []);

  const enumerateMics = async (askPermission: boolean = false) => {
    try {
      if (!navigator || !navigator.mediaDevices) {
        setErrorMsg('Media Devices API is not supported in this browser.');
        return;
      }

      if (askPermission) {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tempStream.getTracks().forEach(t => t.stop());
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 5) || 'Device'}`
        }));

      setMicDevices(mics);
      if (mics.length > 0 && !selectedMic) {
        setSelectedMic(mics[0].deviceId);
      }
    } catch (err: any) {
      console.warn('Microphone enumeration failed:', err);
    }
  };

  const startVoiceRecording = async () => {
    try {
      setErrorMsg(null);
      setRecordedBlobUrl(null);
      setRecordedBlobSize(0);
      audioChunksRef.current = [];
      totalSamplesRef.current = 0;
      setRecordingSeconds(0);

      const constraints: MediaStreamConstraints = {
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
        video: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      // Audio processing
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      source.connect(analyser);

      // Raw PCM script processor for precise audio visualizer and lossless compilation
      const bufferSize = 4096;
      const scriptProcessor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (e) => {
        if (recorderState === 'paused') return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Deep copy of samples
        const copy = new Float32Array(inputData.length);
        copy.set(inputData);
        audioChunksRef.current.push(copy);
        totalSamplesRef.current += copy.length;
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(audioCtx.destination);

      // Audio level check
      const checkAudioLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setAudioLevel(average / 128); // normalize roughly to 0-1
        levelAnimationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();

      setRecorderState('recording');

      // Timer Setup
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to acquire microphone stream.');
      cleanupStream();
    }
  };

  const pauseVoiceRecording = () => {
    if (recorderState === 'recording') {
      setRecorderState('paused');
      if (audioContextRef.current) {
        audioContextRef.current.suspend();
      }
    } else if (recorderState === 'paused') {
      setRecorderState('recording');
      if (audioContextRef.current) {
        audioContextRef.current.resume();
      }
    }
  };

  const stopVoiceRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (levelAnimationFrameRef.current) cancelAnimationFrame(levelAnimationFrameRef.current);

    setRecorderState('complete');
    
    // Stop tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Compile samples to WAV format
    if (audioChunksRef.current.length > 0 && audioContextRef.current) {
      const sampleRate = audioContextRef.current.sampleRate;
      const combined = new Float32Array(totalSamplesRef.current);
      let offset = 0;
      for (const chunk of audioChunksRef.current) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      const wavBlob = writeWavHeader(combined, sampleRate);
      const url = URL.createObjectURL(wavBlob);
      setRecordedBlobUrl(url);
      setRecordedBlobSize(wavBlob.size);
    }

    cleanupStream();
  };

  const cleanupStream = () => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  };

  // Binary WAV writing helper
  const writeWavHeader = (samples: Float32Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
      for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    
    floatTo16BitPCM(view, 44, samples);
    
    return new Blob([view], { type: 'audio/wav' });
  };

  const handlePlaybackPlay = () => {
    if (!audioPlaybackRef.current) return;
    if (playbackState === 'playing') {
      audioPlaybackRef.current.pause();
      setPlaybackState('paused');
    } else {
      audioPlaybackRef.current.play();
      setPlaybackState('playing');
    }
  };

  const handlePlaybackTimeUpdate = () => {
    if (!audioPlaybackRef.current) return;
    const progress = (audioPlaybackRef.current.currentTime / audioPlaybackRef.current.duration) * 100;
    setPlaybackProgress(isNaN(progress) ? 0 : progress);
  };

  const handlePlaybackEnded = () => {
    setPlaybackState('idle');
    setPlaybackProgress(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const restartVoiceSession = () => {
    setRecorderState('idle');
    setRecordedBlobUrl(null);
    setRecordedBlobSize(0);
    setPlaybackProgress(0);
    setPlaybackState('idle');
  };

  return (
    <div className="p-6 bg-slate-950 border border-brand-border/30 rounded-2xl shadow-xl space-y-6">
      {/* Title Bar */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20 text-brand">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-heading text-lg sm:text-xl font-bold text-white uppercase tracking-wider">
              {SEO_H1_MAPPING['voice-recorder']}
            </h1>
            <p className="font-sans text-xs text-zinc-400">
              {SEO_DESC_MAPPING['voice-recorder']}
            </p>
          </div>
        </div>

        <button 
          onClick={() => enumerateMics(true)}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all text-xs flex items-center gap-1.5"
          title="Refresh Microphone hardware inputs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/45 border border-red-900/50 rounded-xl text-red-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mic Devices selector */}
      {recorderState === 'idle' && (
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider">Select Audio Input Device</label>
          <div className="relative">
            <select
              value={selectedMic}
              onChange={(e) => setSelectedMic(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand/40"
            >
              {micDevices.map((m) => (
                <option key={m.deviceId} value={m.deviceId}>{m.label}</option>
              ))}
              {micDevices.length === 0 && (
                <option value="">Default System Microphone</option>
              )}
            </select>
          </div>
        </div>
      )}

      {/* Main Console Stage */}
      <div className="relative border border-zinc-900 bg-zinc-950/40 rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111115_1px,transparent_1px),linear-gradient(to_bottom,#111115_1px,transparent_1px)] bg-[size:24px_24px] opacity-25 pointer-events-none" />

        {/* Live Audio Waves and Pulse ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full border border-brand/5 scale-100 animate-ping [animation-duration:3s]" />
          <div className="absolute w-20 h-20 rounded-full border border-brand/10 scale-100 animate-ping [animation-duration:2s]" />

          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            recorderState === 'recording' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            recorderState === 'paused' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            'bg-brand/10 text-brand border border-brand/20'
          }`}>
            <Mic className={`w-8 h-8 ${recorderState === 'recording' ? 'scale-110 animate-pulse' : ''}`} />
          </div>
        </div>

        {/* Live Decibel / Level Bar */}
        {recorderState === 'recording' && (
          <div className="w-full max-w-xs space-y-1">
            <div className="flex justify-between text-[9px] font-mono text-zinc-500">
              <span>MIC INPUT LEVEL</span>
              <span>{Math.round(audioLevel * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand transition-all duration-75"
                style={{ width: `${Math.min(100, audioLevel * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Timer Counter */}
        <div className="text-center space-y-1">
          <div className="font-mono text-3xl font-black tracking-widest text-white">
            {formatTime(recordingSeconds)}
          </div>
          <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">
            {recorderState === 'recording' ? 'Recording live stream' :
             recorderState === 'paused' ? 'Recording suspended' :
             recorderState === 'complete' ? 'Recording complete' :
             'System ready'}
          </span>
        </div>

        {/* Recording Controls */}
        <div className="flex items-center gap-4">
          {recorderState === 'idle' && (
            <button
              onClick={startVoiceRecording}
              className="px-6 py-2.5 rounded-xl bg-brand text-zinc-950 font-heading font-extrabold tracking-wider uppercase text-xs hover:bg-brand/90 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
            >
              <Mic className="w-4 h-4" />
              <span>Record Voice</span>
            </button>
          )}

          {(recorderState === 'recording' || recorderState === 'paused') && (
            <>
              <button
                onClick={pauseVoiceRecording}
                className="p-3 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-all cursor-pointer"
                title={recorderState === 'recording' ? 'Pause recording' : 'Resume recording'}
              >
                {recorderState === 'recording' ? <Pause className="w-5 h-5 text-amber-500" /> : <Play className="w-5 h-5 text-emerald-500" />}
              </button>

              <button
                onClick={stopVoiceRecording}
                className="p-3 rounded-full bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-400 transition-all cursor-pointer"
                title="Stop recording"
              >
                <Square className="w-5 h-5 fill-red-400/20" />
              </button>
            </>
          )}

          {recorderState === 'complete' && (
            <button
              onClick={restartVoiceSession}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-mono"
            >
              Restart Session
            </button>
          )}
        </div>
      </div>

      {/* Output Segment */}
      <AnimatePresence>
        {recordedBlobUrl && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-5 border border-zinc-900 bg-zinc-950/60 rounded-2xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <FileAudio className="w-5 h-5 text-brand" />
                <div>
                  <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wide">
                    RecordedAudio.wav
                  </h4>
                  <span className="font-mono text-[10px] text-zinc-500">
                    File format: Lossless WAV | Size: {formatBytes(recordedBlobSize)}
                  </span>
                </div>
              </div>

              <a
                href={recordedBlobUrl}
                download="Apex_Voice_Recording.wav"
                className="px-4 py-2 rounded-xl bg-brand text-zinc-950 font-heading font-extrabold tracking-wider uppercase text-xs hover:bg-brand/90 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
              >
                <Download className="w-4 h-4" />
                <span>Export WAV</span>
              </a>
            </div>

            {/* Simulated Seekbar Audio Player */}
            <div className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-xl space-y-3">
              <audio 
                ref={audioPlaybackRef}
                src={recordedBlobUrl}
                onTimeUpdate={handlePlaybackTimeUpdate}
                onEnded={handlePlaybackEnded}
                className="hidden"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlaybackPlay}
                  className="p-2 rounded-lg bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-all cursor-pointer"
                >
                  {playbackState === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-brand/20" />}
                </button>

                <div className="flex-1 relative h-2 bg-zinc-900 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                  if (!audioPlaybackRef.current) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  audioPlaybackRef.current.currentTime = pct * audioPlaybackRef.current.duration;
                }}>
                  <div 
                    className="absolute h-full bg-brand"
                    style={{ width: `${playbackProgress}%` }}
                  />
                </div>

                <div className="font-mono text-[10px] text-zinc-400">
                  {audioPlaybackRef.current ? formatTime(Math.round(audioPlaybackRef.current.currentTime)) : '00:00'}
                  {' / '}
                  {formatTime(recordingSeconds)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

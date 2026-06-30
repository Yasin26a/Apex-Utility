import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, Mic, Video, Play, Pause, RefreshCw, 
  Settings, HelpCircle, AlertCircle, Sparkles, CheckCircle, 
  Activity, Sliders, VolumeX, Eye, Camera, ShieldCheck, HelpCircle as HelpIcon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { logToolUsage } from '../utils/toolAnalytics';

export type HardwareTestTab = 'microphone-tester' | 'webcam-check' | 'speaker-tester';

interface HardwareTestSuiteProps {
  initialTab?: HardwareTestTab;
}

export default function HardwareTestSuite({ initialTab = 'microphone-tester' }: HardwareTestSuiteProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<HardwareTestTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    logToolUsage(activeTab);
  }, [activeTab]);

  // Status & Streams
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [successHeader, setSuccessHeader] = useState<string | null>(null);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // ---------------------------------------------------------------------------
  // 1. MICROPHONE TESTER STATES & REFS
  // ---------------------------------------------------------------------------
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const [micState, setMicState] = useState<'idle' | 'listening'>('idle');
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micAudioContextRef = useRef<AudioContext | null>(null);
  const micAnimFrameRef = useRef<number | null>(null);

  // ---------------------------------------------------------------------------
  // 2. WEBCAM CHECK STATES & REFS
  // ---------------------------------------------------------------------------
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamState, setWebcamState] = useState<'idle' | 'active'>('idle');
  const [cameraResolutions, setCameraResolutions] = useState<{ label: string; width: number; height: number; supported: boolean | null }[]>([
    { label: 'SD (480p)', width: 640, height: 480, supported: null },
    { label: 'HD (720p)', width: 1280, height: 720, supported: null },
    { label: 'Full HD (1080p)', width: 1920, height: 1080, supported: null },
    { label: '4K Ultra HD', width: 3840, height: 2160, supported: null }
  ]);
  const [activeResolution, setActiveResolution] = useState<string>('Detecting...');
  const [cameraFps, setCameraFps] = useState<number>(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [capturedSnapshots, setCapturedSnapshots] = useState<string[]>([]);

  // ---------------------------------------------------------------------------
  // 3. SPEAKER TESTER STATES & REFS
  // ---------------------------------------------------------------------------
  const [speakerState, setSpeakerState] = useState<'idle' | 'playing-left' | 'playing-right' | 'playing-both' | 'playing-sweep'>('idle');
  const [sweepFrequency, setSweepFrequency] = useState<number>(440); // 20Hz to 20kHz
  const speakerCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);

  // ---------------------------------------------------------------------------
  // CLEANUPS
  // ---------------------------------------------------------------------------
  const stopAllHardwareStreams = () => {
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      setMicStream(null);
    }
    if (webcamStream) {
      webcamStream.getTracks().forEach(t => t.stop());
      setWebcamStream(null);
    }
    if (micAnimFrameRef.current) cancelAnimationFrame(micAnimFrameRef.current);
    if (micAudioContextRef.current) micAudioContextRef.current.close().catch(() => {});
    
    stopSpeakerSounds();
    setMicState('idle');
    setWebcamState('idle');
    setErrorHeader(null);
    setSuccessHeader(null);
  };

  useEffect(() => {
    stopAllHardwareStreams();
    return () => {
      stopAllHardwareStreams();
    };
  }, [activeTab]);

  // ---------------------------------------------------------------------------
  // MICROPHONE TESTER LOGIC
  // ---------------------------------------------------------------------------
  const toggleMicrophoneTest = async () => {
    if (micState === 'listening') {
      stopAllHardwareStreams();
      return;
    }

    try {
      setErrorHeader(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setMicStream(stream);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      micAudioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      micAnalyserRef.current = analyser;
      source.connect(analyser);

      setMicState('listening');

      // Waveform draw & decibel loop
      const drawMicWaveform = () => {
        if (!canvasRef.current || !micAnalyserRef.current) return;
        const canvas = canvasRef.current;
        const drawCtx = canvas.getContext('2d');
        if (!drawCtx) return;

        const bufferLength = micAnalyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        micAnalyserRef.current.getByteTimeDomainData(dataArray);

        // Clear canvas
        drawCtx.fillStyle = '#050508';
        drawCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Waveform properties
        drawCtx.lineWidth = 2.5;
        drawCtx.strokeStyle = 'var(--theme-glow, #f59e0b)';
        drawCtx.shadowColor = 'var(--theme-glow, #f59e0b)';
        drawCtx.shadowBlur = 6;
        drawCtx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        let levelSum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            drawCtx.moveTo(x, y);
          } else {
            drawCtx.lineTo(x, y);
          }

          x += sliceWidth;
          levelSum += Math.abs(dataArray[i] - 128);
        }

        drawCtx.lineTo(canvas.width, canvas.height / 2);
        drawCtx.stroke();
        drawCtx.shadowBlur = 0; // reset

        // Audio average input check
        setMicAudioLevel(levelSum / bufferLength);
        micAnimFrameRef.current = requestAnimationFrame(drawMicWaveform);
      };

      drawMicWaveform();
    } catch (err: any) {
      setErrorHeader(err.message || 'Microphone access denied or Busy.');
    }
  };

  // ---------------------------------------------------------------------------
  // WEBCAM CHECK LOGIC
  // ---------------------------------------------------------------------------
  const toggleWebcamTest = async () => {
    if (webcamState === 'active') {
      stopAllHardwareStreams();
      return;
    }

    try {
      setErrorHeader(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      setWebcamStream(stream);
      setWebcamState('active');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Read active tracks parameters
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      setActiveResolution(`${settings.width || 'Unknown'} x ${settings.height || 'Unknown'}`);
      setCameraFps(settings.frameRate || 30);

      // Dynamically run resolution checks
      probeAvailableResolutions();

    } catch (err: any) {
      setErrorHeader(err.message || 'Webcam access denied or Hardware Busy.');
    }
  };

  const probeAvailableResolutions = async () => {
    const checked = [...cameraResolutions];
    for (let i = 0; i < checked.length; i++) {
      const r = checked[i];
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { exact: r.width }, height: { exact: r.height } }
        });
        r.supported = true;
        stream.getTracks().forEach(t => t.stop());
      } catch (e) {
        r.supported = false;
      }
    }
    setCameraResolutions([...checked]);
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedSnapshots([dataUrl, ...capturedSnapshots.slice(0, 7)]);
      setSuccessHeader('Snapshot captured successfully!');
      setTimeout(() => setSuccessHeader(null), 3000);
    }
  };

  // ---------------------------------------------------------------------------
  // SPEAKER TESTER LOGIC (WEB AUDIO OSCILLATORS)
  // ---------------------------------------------------------------------------
  const startSpeakerTest = (type: 'left' | 'right' | 'both' | 'sweep') => {
    stopSpeakerSounds();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      speakerCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      oscillatorRef.current = osc;

      const gain = ctx.createGain();
      gainNodeRef.current = gain;

      osc.connect(gain);

      // Direct panner to left or right channel
      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        pannerNodeRef.current = panner;
        gain.connect(panner);
        panner.connect(ctx.destination);

        if (type === 'left') {
          panner.pan.value = -1.0;
          setSpeakerState('playing-left');
        } else if (type === 'right') {
          panner.pan.value = 1.0;
          setSpeakerState('playing-right');
        } else {
          panner.pan.value = 0.0;
          setSpeakerState(type === 'both' ? 'playing-both' : 'playing-sweep');
        }
      } else {
        gain.connect(ctx.destination);
        setSpeakerState(type === 'both' ? 'playing-both' : 'playing-sweep');
      }

      if (type === 'sweep') {
        osc.frequency.setValueAtTime(sweepFrequency, ctx.currentTime);
        osc.type = 'sine';
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime); // standard 440Hz standard A
        osc.type = 'sine';
      }

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      osc.start();

    } catch (e: any) {
      setErrorHeader('Failed to boot Web Audio Engine.');
    }
  };

  const handleSweepFrequencyChange = (val: number) => {
    setSweepFrequency(val);
    if (oscillatorRef.current && speakerCtxRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(val, speakerCtxRef.current.currentTime);
    }
  };

  const stopSpeakerSounds = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (e) {}
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    if (pannerNodeRef.current) {
      pannerNodeRef.current.disconnect();
      pannerNodeRef.current = null;
    }
    if (speakerCtxRef.current) {
      speakerCtxRef.current.close().catch(() => {});
      speakerCtxRef.current = null;
    }
    setSpeakerState('idle');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Tab Switcher rail */}
      <div className="lg:col-span-3 space-y-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block mb-2 px-1">Hardware Audit Suite</span>
        <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none">
          {[
            { id: 'microphone-tester', label: 'Microphone Tester', icon: Mic, desc: 'Live volume decibel & waves test' },
            { id: 'webcam-check', label: 'Webcam check', icon: Video, desc: 'Resolution & snapshot quality' },
            { id: 'speaker-tester', label: 'Speaker Tester', icon: Volume2, desc: 'Stereo channels & frequency sweep' }
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as HardwareTestTab)}
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

      {/* Primary Stage Console */}
      <div className="lg:col-span-9 bg-[#08080c] border border-brand-border/30 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Title row */}
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div>
            <h3 className="font-heading text-lg font-bold text-white uppercase tracking-wider">
              {activeTab === 'microphone-tester' ? 'Microphone Hardware Tester' :
               activeTab === 'webcam-check' ? 'High Precision Webcam Check' :
               'Speaker Frequency Tester'}
            </h3>
            <p className="font-sans text-xs text-zinc-400">
              Audit hardware streams securely client-side in physical isolation.
            </p>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-900 border border-zinc-850 rounded-lg text-[10px] font-mono text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Sandbox Protected</span>
          </div>
        </div>

        {/* Notices */}
        {errorHeader && (
          <div className="p-4 bg-red-950/45 border border-red-900/50 rounded-xl text-red-200 text-xs flex items-center gap-2.5 animate-pulse">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>Hardware Error: {errorHeader}</span>
          </div>
        )}

        {successHeader && (
          <div className="p-4 bg-emerald-950/45 border border-emerald-900/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successHeader}</span>
          </div>
        )}

        {/* Tab 1: MICROPHONE TESTER */}
        {activeTab === 'microphone-tester' && (
          <div className="space-y-6">
            <div className="relative border border-zinc-900 rounded-2xl overflow-hidden bg-zinc-950 p-1 flex items-center justify-center">
              <canvas 
                ref={canvasRef} 
                width={600} 
                height={200} 
                className="w-full h-[200px] rounded-xl block bg-zinc-950" 
              />
              {micState === 'idle' && (
                <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                  <Mic className="w-10 h-10 text-zinc-600 animate-bounce" />
                  <p className="font-sans text-xs text-zinc-400">Activate microphone level analyser</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-950 p-4 border border-zinc-900 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${micState === 'listening' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-zinc-900 border-zinc-850 text-zinc-400'}`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-heading text-xs font-bold text-white uppercase">Decibel Input level</p>
                  <p className="font-mono text-[10px] text-zinc-500 mt-0.5">
                    {micState === 'listening' ? `Average Amplitude: ${Math.round(micAudioLevel)}db` : 'Hardware Listening Mode Idle'}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleMicrophoneTest}
                className={`px-5 py-2.5 rounded-xl font-heading font-extrabold tracking-wider uppercase text-xs transition-all cursor-pointer ${
                  micState === 'listening'
                    ? 'bg-red-500/20 hover:bg-red-500/35 border border-red-500/30 text-red-400'
                    : 'bg-brand text-zinc-950 hover:bg-brand/90'
                }`}
              >
                {micState === 'listening' ? 'Mute Mic Feed' : 'Launch Mic Feed'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: WEBCAM CHECK */}
        {activeTab === 'webcam-check' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Display Camera feed */}
              <div className="md:col-span-8 relative border border-zinc-900 rounded-2xl overflow-hidden bg-zinc-950 flex items-center justify-center min-h-[250px]">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover rounded-2xl"
                  style={{
                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                  }}
                />
                {webcamState === 'idle' && (
                  <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                    <Camera className="w-10 h-10 text-zinc-600 animate-bounce" />
                    <p className="font-sans text-xs text-zinc-400">Probe webcam feed & resolution matrices</p>
                  </div>
                )}
              </div>

              {/* Resolution Metrics Panel */}
              <div className="md:col-span-4 p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">Resolution probe</span>
                
                <div className="space-y-2.5">
                  {cameraResolutions.map((r) => (
                    <div key={r.label} className="flex justify-between items-center bg-[#0d0d12] p-2.5 border border-zinc-900 rounded-xl text-xs">
                      <span className="font-bold text-zinc-300">{r.label}</span>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                        r.supported === true ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                        r.supported === false ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                        'bg-zinc-900 text-zinc-500'
                      }`}>
                        {r.supported === true ? 'SUPPORTED' : r.supported === false ? 'NOT FOUND' : 'UNTESTED'}
                      </span>
                    </div>
                  ))}
                </div>

                {webcamState === 'active' && (
                  <div className="pt-3 border-t border-zinc-900 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">ACTIVE FORMAT:</span>
                      <span className="text-brand font-bold">{activeResolution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">ACTIVE FPS:</span>
                      <span className="text-brand font-bold">{Math.round(cameraFps)} FPS</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Exposure Sliders & Control Panel */}
            {webcamState === 'active' && (
              <div className="p-5 border border-zinc-900 bg-zinc-950/50 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-zinc-400">
                    <span>Brightness</span>
                    <span>{brightness}%</span>
                  </div>
                  <input 
                    type="range" min="50" max="150" value={brightness} 
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-brand bg-zinc-900 appearance-none h-1 rounded-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-zinc-400">
                    <span>Contrast</span>
                    <span>{contrast}%</span>
                  </div>
                  <input 
                    type="range" min="50" max="150" value={contrast} 
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-brand bg-zinc-900 appearance-none h-1 rounded-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-zinc-400">
                    <span>Color Saturation</span>
                    <span>{saturation}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" value={saturation} 
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full accent-brand bg-zinc-900 appearance-none h-1 rounded-full"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center bg-zinc-950 p-4 border border-zinc-900 rounded-2xl">
              <button
                onClick={toggleWebcamTest}
                className={`px-5 py-2.5 rounded-xl font-heading font-extrabold tracking-wider uppercase text-xs transition-all cursor-pointer ${
                  webcamState === 'active'
                    ? 'bg-red-500/20 hover:bg-red-500/35 border border-red-500/30 text-red-400'
                    : 'bg-brand text-zinc-950 hover:bg-brand/90 shadow-[0_4px_12px_rgba(245,158,11,0.2)]'
                }`}
              >
                {webcamState === 'active' ? 'Shut Cam Stream' : 'Deploy Cam Feed'}
              </button>

              {webcamState === 'active' && (
                <button
                  onClick={captureWebcamSnapshot}
                  className="px-5 py-2.5 bg-brand/10 hover:bg-brand/25 border border-brand/20 hover:border-brand/40 text-brand rounded-xl font-heading font-extrabold tracking-wider uppercase text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Photo</span>
                </button>
              )}
            </div>

            {/* Photos Slideshow */}
            {capturedSnapshots.length > 0 && (
              <div className="space-y-3">
                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">Snapshots history</span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {capturedSnapshots.map((snap, idx) => (
                    <div key={idx} className="relative border border-zinc-900 bg-zinc-950 rounded-xl overflow-hidden aspect-video group">
                      <img src={snap} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <a 
                        href={snap} 
                        download={`ApexCamSnapshot_${idx}.png`}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-brand text-[9px] font-mono uppercase font-bold"
                      >
                        Export
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: SPEAKER TESTER */}
        {activeTab === 'speaker-tester' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { type: 'left', label: 'LEFT CHANNEL ONLY', desc: 'Audio pans entirely left (-1.0)', badge: 'STEREO L' },
                { type: 'right', label: 'RIGHT CHANNEL ONLY', desc: 'Audio pans entirely right (1.0)', badge: 'STEREO R' },
                { type: 'both', label: 'STEREO CENTER', desc: 'Symmetric mono sound waves (0.0)', badge: 'BALANCED' }
              ].map((s) => {
                const isPlaying = speakerState === `playing-${s.type}`;
                return (
                  <div 
                    key={s.type}
                    className={`p-5 rounded-2xl border flex flex-col justify-between h-40 transition-all ${
                      isPlaying 
                        ? 'bg-brand/10 border-brand/40 shadow-sm shadow-brand/10' 
                        : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-zinc-500">{s.badge}</span>
                      {isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />}
                    </div>

                    <div>
                      <h4 className="font-heading text-xs font-bold text-white uppercase">{s.label}</h4>
                      <p className="font-sans text-[10px] text-zinc-500 mt-1">{s.desc}</p>
                    </div>

                    <button
                      onClick={() => isPlaying ? stopSpeakerSounds() : startSpeakerTest(s.type as any)}
                      className={`w-full py-2.5 rounded-xl font-mono text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-all ${
                        isPlaying 
                          ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400' 
                          : 'bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-300'
                      }`}
                    >
                      {isPlaying ? 'MUTE TEST' : 'TRIGGER WAVES'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Sweep Tone Sweep Sweep */}
            <div className="p-5 border border-zinc-900 bg-zinc-950/60 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-heading text-xs font-bold text-white uppercase">Dynamic Sweep Tone Generator</h4>
                  <p className="font-sans text-[10px] text-zinc-500 mt-0.5">Test speaker limit frequencies ranging 20Hz - 20,000Hz (Sine Waves)</p>
                </div>
                
                <button
                  onClick={() => speakerState === 'playing-sweep' ? stopSpeakerSounds() : startSpeakerTest('sweep')}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                    speakerState === 'playing-sweep' 
                      ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400' 
                      : 'bg-brand text-zinc-950 hover:bg-brand/90'
                  }`}
                >
                  {speakerState === 'playing-sweep' ? 'STOP SWEEP' : 'ENGAGE SWEEP'}
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>Frequency</span>
                  <span className="text-brand font-bold">{sweepFrequency} Hz</span>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="10000" 
                  value={sweepFrequency}
                  onChange={(e) => handleSweepFrequencyChange(Number(e.target.value))}
                  className="w-full accent-brand bg-zinc-900 appearance-none h-1.5 rounded-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

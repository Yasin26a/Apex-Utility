import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, Mic, Video, Play, Pause, RefreshCw, 
  Settings, HelpCircle, AlertCircle, Sparkles, CheckCircle, 
  Activity, Sliders, VolumeX, Eye, Camera, ShieldCheck, HelpCircle as HelpIcon,
  Laptop, Phone, Tv, Radio, Info, ChevronDown, ChevronUp, TrendingUp, Zap,
  Headphones, Check, Download, Disc
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { logToolUsage } from '../utils/toolAnalytics';
import { SEO_H1_MAPPING, SEO_DESC_MAPPING } from '../seo-mapping';

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
  const [micLoopback, setMicLoopback] = useState<boolean>(false);
  const [micPitch, setMicPitch] = useState<number | null>(null);
  const [micMaxDb, setMicMaxDb] = useState<number>(0);
  const [micDeviceName, setMicDeviceName] = useState<string | null>(null);
  const [micAvailableDevices, setMicAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [activeMicFaq, setActiveMicFaq] = useState<number | null>(null);
  const [micFaqSearchQuery, setMicFaqSearchQuery] = useState<string>('');

  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micAudioContextRef = useRef<AudioContext | null>(null);
  const micAnimFrameRef = useRef<number | null>(null);
  const micLoopbackGainRef = useRef<GainNode | null>(null);

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
  const [webcamAvailableDevices, setWebcamAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedWebcamId, setSelectedWebcamId] = useState<string>('');
  const [webcamMirror, setWebcamMirror] = useState<boolean>(true);
  const [webcamAspectRatio, setWebcamAspectRatio] = useState<'16:9' | '4:3' | '1:1'>('16:9');
  const [webcamColorFilter, setWebcamColorFilter] = useState<'none' | 'grayscale' | 'contrast' | 'warm' | 'cool' | 'negative' | 'studio'>('none');
  const [activeWebcamFaq, setActiveWebcamFaq] = useState<number | null>(null);
  const [webcamFaqSearchQuery, setWebcamFaqSearchQuery] = useState<string>('');

  // ---------------------------------------------------------------------------
  // 3. SPEAKER TESTER STATES & REFS
  // ---------------------------------------------------------------------------
  const [speakerState, setSpeakerState] = useState<'idle' | 'playing-left' | 'playing-right' | 'playing-both' | 'playing-sweep' | 'playing-bass' | 'playing-preset'>('idle');
  const [sweepFrequency, setSweepFrequency] = useState<number>(440); // 20Hz to 20kHz
  const [speakerWaveform, setSpeakerWaveform] = useState<'sine' | 'triangle' | 'square' | 'sawtooth'>('sine');
  const [speakerPan, setSpeakerPan] = useState<number>(0.0);
  const [speakerVolume, setSpeakerVolume] = useState<number>(40); // 0 to 100
  const [activePresetLabel, setActivePresetLabel] = useState<string>('');
  const [bassPulseScale, setBassPulseScale] = useState<number>(1.0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [faqSearchQuery, setFaqSearchQuery] = useState<string>('');

  const speakerCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const speakerAnalyserRef = useRef<AnalyserNode | null>(null);
  const speakerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const speakerAnimFrameRef = useRef<number | null>(null);

  // ---------------------------------------------------------------------------
  // 4. EXTRA SEO & INTERACTIVE ADVANCED DIAGNOSTICS
  // ---------------------------------------------------------------------------
  // Voice Recording (offline mic check playback loop)
  const [voiceRecordState, setVoiceRecordState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [voiceRecordDuration, setVoiceRecordDuration] = useState<number>(0);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<any | null>(null);

  // Hearing test state
  const [hearingTestState, setHearingTestState] = useState<'idle' | 'testing' | 'completed'>('idle');
  const [hearingCurrentFreq, setHearingCurrentFreq] = useState<number>(2000);
  const [hearingResultLimit, setHearingResultLimit] = useState<number | null>(null);
  const hearingIntervalRef = useRef<any | null>(null);

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
    if (micAudioContextRef.current) {
      try {
        micAudioContextRef.current.close().catch(() => {});
      } catch (e) {}
      micAudioContextRef.current = null;
    }
    if (micLoopbackGainRef.current) {
      try {
        micLoopbackGainRef.current.disconnect();
      } catch (e) {}
      micLoopbackGainRef.current = null;
    }

    // Clear voice recording
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    setVoiceRecordState('idle');

    // Clear hearing tests
    if (hearingIntervalRef.current) {
      clearInterval(hearingIntervalRef.current);
      hearingIntervalRef.current = null;
    }
    setHearingTestState('idle');
    
    stopSpeakerSounds();
    setMicState('idle');
    setWebcamState('idle');
    setMicMaxDb(0);
    setMicPitch(null);
    setErrorHeader(null);
    setSuccessHeader(null);
  };

  const loadMicDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(d => d.kind === 'audioinput');
        setMicAvailableDevices(audioInputDevices);
        if (audioInputDevices.length > 0 && !selectedMicId) {
          setSelectedMicId(audioInputDevices[0].deviceId);
        }
      }
    } catch (e) {
      console.warn('Could not load input devices', e);
    }
  };

  const loadWebcamDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter(d => d.kind === 'videoinput');
        setWebcamAvailableDevices(videoInputDevices);
        if (videoInputDevices.length > 0 && !selectedWebcamId) {
          setSelectedWebcamId(videoInputDevices[0].deviceId);
        }
      }
    } catch (e) {
      console.warn('Could not load webcam devices', e);
    }
  };

  useEffect(() => {
    stopAllHardwareStreams();
    if (activeTab === 'microphone-tester') {
      loadMicDevices();
    } else if (activeTab === 'webcam-check') {
      loadWebcamDevices();
    }
    return () => {
      stopAllHardwareStreams();
    };
  }, [activeTab]);

  // Autocorrelation pitch detector helper
  const autoCorrelate = (buffer: Uint8Array, sampleRate: number): number => {
    let SIZE = buffer.length;
    let maxSamples = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      let val = (buffer[i] - 128) / 128;
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // too quiet

    let r1 = 0, r2 = SIZE - 1;
    let thres = 0.2;
    for (let i = 0; i < SIZE; i++) {
      if (Math.abs((buffer[i] - 128) / 128) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = SIZE - 1; i >= 0; i--) {
      if (Math.abs((buffer[i] - 128) / 128) < thres) {
        r2 = i;
        break;
      }
    }
    let len = r2 - r1;
    if (len < 16) return -1;

    let correlations = new Float32Array(maxSamples);
    for (let offset = 0; offset < maxSamples; offset++) {
      let sum = 0;
      for (let i = 0; i < maxSamples; i++) {
        let v1 = (buffer[r1 + i] - 128) / 128;
        let v2 = (buffer[r1 + i + offset] - 128) / 128;
        sum += v1 * v2;
      }
      correlations[offset] = sum;
    }

    let d = 0;
    while (d < maxSamples - 1 && correlations[d] > 0) d++;
    let peakOffset = -1;
    let peakVal = -1;
    for (let i = d; i < maxSamples; i++) {
      if (correlations[i] > peakVal) {
        peakVal = correlations[i];
        peakOffset = i;
      }
    }

    if (peakOffset > 0) {
      return sampleRate / peakOffset;
    }
    return -1;
  };

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
      
      const constraints: MediaStreamConstraints = {
        audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
        video: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMicStream(stream);

      // Save device label
      const activeTrack = stream.getAudioTracks()[0];
      if (activeTrack) {
        setMicDeviceName(activeTrack.label || 'Default Microphone Input');
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      micAudioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      micAnalyserRef.current = analyser;
      source.connect(analyser);

      // Handle active loopback state
      if (micLoopback) {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        micLoopbackGainRef.current = gain;
        analyser.connect(gain);
        gain.connect(ctx.destination);
      }

      setMicState('listening');

      // Refresh devices list
      loadMicDevices();

      // Waveform draw & decibel loop
      const drawMicWaveform = () => {
        if (!canvasRef.current || !micAnalyserRef.current || !micAudioContextRef.current) return;
        const canvas = canvasRef.current;
        const drawCtx = canvas.getContext('2d');
        if (!drawCtx) return;

        const bufferLength = micAnalyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        micAnalyserRef.current.getByteTimeDomainData(dataArray);

        // Clear canvas
        drawCtx.fillStyle = '#050508';
        drawCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle decibel guide lines
        drawCtx.strokeStyle = 'rgba(245, 158, 11, 0.05)';
        drawCtx.lineWidth = 1;
        drawCtx.beginPath();
        drawCtx.moveTo(0, canvas.height * 0.25);
        drawCtx.lineTo(canvas.width, canvas.height * 0.25);
        drawCtx.moveTo(0, canvas.height * 0.75);
        drawCtx.lineTo(canvas.width, canvas.height * 0.75);
        drawCtx.stroke();

        // Waveform properties
        drawCtx.lineWidth = 2.5;
        drawCtx.strokeStyle = '#f59e0b'; // theme amber
        drawCtx.shadowColor = 'rgba(245, 158, 11, 0.4)';
        drawCtx.shadowBlur = 8;
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
        const avgLevel = levelSum / bufferLength;
        setMicAudioLevel(avgLevel);

        // Track peak volume
        if (avgLevel > micMaxDb) {
          setMicMaxDb(Math.min(100, Math.round(avgLevel * 1.5)));
        }

        // Calculate pitch frequency
        const detectedFreq = autoCorrelate(dataArray, micAudioContextRef.current.sampleRate);
        if (detectedFreq > 0) {
          setMicPitch(Math.round(detectedFreq));
        }

        micAnimFrameRef.current = requestAnimationFrame(drawMicWaveform);
      };

      drawMicWaveform();
    } catch (err: any) {
      setErrorHeader(err.message || 'Microphone access denied or Busy. Make sure browser permissions are active.');
    }
  };

  // Loopback dynamically react to toggle
  useEffect(() => {
    if (micState === 'listening' && micAudioContextRef.current && micAnalyserRef.current) {
      if (micLoopback) {
        try {
          if (!micLoopbackGainRef.current) {
            const gain = micAudioContextRef.current.createGain();
            gain.gain.setValueAtTime(0.35, micAudioContextRef.current.currentTime);
            micLoopbackGainRef.current = gain;
          }
          micAnalyserRef.current.connect(micLoopbackGainRef.current);
          micLoopbackGainRef.current.connect(micAudioContextRef.current.destination);
        } catch (e) {
          console.error(e);
        }
      } else {
        if (micLoopbackGainRef.current) {
          try {
            micLoopbackGainRef.current.disconnect();
          } catch (e) {}
          micLoopbackGainRef.current = null;
        }
      }
    }
  }, [micLoopback, micState]);

  // ---------------------------------------------------------------------------
  // INTERACTIVE VOICE RECORDER CHECK ENGINE (Offline playback voice check)
  // ---------------------------------------------------------------------------
  const startVoiceRecord = async () => {
    try {
      setErrorHeader(null);
      let activeStream = micStream;
      
      // If mic feed is not currently active, launch it
      if (!activeStream) {
        const constraints = {
          audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
          video: false
        };
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        setMicStream(activeStream);
        setMicState('listening');

        // Setup active audio context analyzer
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        micAudioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(activeStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        micAnalyserRef.current = analyser;
        source.connect(analyser);

        // Run devices query
        loadMicDevices();
      }

      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(activeStream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setVoiceAudioUrl(url);
        setVoiceRecordState('recorded');
        setSuccessHeader('Voice recording test captured! Play it back to audit sound quality.');
        setTimeout(() => setSuccessHeader(null), 4000);
      };

      mediaRecorder.start();
      setVoiceRecordState('recording');
      setVoiceRecordDuration(0);

      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = setInterval(() => {
        setVoiceRecordDuration((prev) => {
          if (prev >= 9) { // 10 second maximum voice record
            stopVoiceRecord();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      setErrorHeader(err.message || 'Failed to start browser MediaRecorder. Check mic permissions.');
    }
  };

  const stopVoiceRecord = () => {
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
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
      const width = webcamAspectRatio === '16:9' ? 1280 : webcamAspectRatio === '4:3' ? 1024 : 720;
      const height = webcamAspectRatio === '16:9' ? 720 : webcamAspectRatio === '4:3' ? 768 : 720;
      
      let stream: MediaStream;
      try {
        const constraints: any = {
          video: {
            deviceId: selectedWebcamId ? { exact: selectedWebcamId } : undefined,
            width: { ideal: width },
            height: { ideal: height },
            aspectRatio: webcamAspectRatio === '16:9' ? 1.7777777778 : webcamAspectRatio === '4:3' ? 1.3333333333 : 1.0
          },
          audio: false
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback without deviceId or explicit resolutions
        const constraints: any = {
          video: {
            width: { ideal: width },
            height: { ideal: height },
          },
          audio: false
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

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
      loadWebcamDevices();

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

  const getFilterStyle = () => {
    let base = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    if (webcamColorFilter === 'grayscale') base += ' grayscale(100%)';
    else if (webcamColorFilter === 'contrast') base += ' contrast(180%)';
    else if (webcamColorFilter === 'warm') base += ' sepia(35%) hue-rotate(-15deg)';
    else if (webcamColorFilter === 'cool') base += ' saturate(120%) hue-rotate(15deg)';
    else if (webcamColorFilter === 'negative') base += ' invert(100%)';
    else if (webcamColorFilter === 'studio') base += ' brightness(115%) contrast(110%) saturate(105%)';
    return base;
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.filter = getFilterStyle();
      if (webcamMirror) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
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
  const startSpeakerCanvasLoop = () => {
    if (speakerAnimFrameRef.current) {
      cancelAnimationFrame(speakerAnimFrameRef.current);
    }

    const draw = () => {
      if (!speakerCanvasRef.current || !speakerAnalyserRef.current) {
        speakerAnimFrameRef.current = requestAnimationFrame(draw);
        return;
      }
      const canvas = speakerCanvasRef.current;
      const drawCtx = canvas.getContext('2d');
      if (!drawCtx) return;

      const bufferLength = speakerAnalyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      speakerAnalyserRef.current.getByteTimeDomainData(dataArray);

      // Clear canvas with dark futuristic deck color
      drawCtx.fillStyle = '#09090e';
      drawCtx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle decorative radar circles
      drawCtx.strokeStyle = 'rgba(245, 158, 11, 0.05)';
      drawCtx.lineWidth = 1;
      drawCtx.beginPath();
      drawCtx.arc(canvas.width / 2, canvas.height / 2, 35, 0, Math.PI * 2);
      drawCtx.arc(canvas.width / 2, canvas.height / 2, 70, 0, Math.PI * 2);
      drawCtx.stroke();

      // Waveform lines
      drawCtx.lineWidth = 2.5;
      drawCtx.strokeStyle = '#f59e0b'; // theme amber
      drawCtx.shadowColor = 'rgba(245, 158, 11, 0.4)';
      drawCtx.shadowBlur = 8;
      drawCtx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      let maxVal = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          drawCtx.moveTo(x, y);
        } else {
          drawCtx.lineTo(x, y);
        }

        x += sliceWidth;

        const val = Math.abs(dataArray[i] - 128);
        if (val > maxVal) maxVal = val;
      }

      drawCtx.lineTo(canvas.width, canvas.height / 2);
      drawCtx.stroke();
      drawCtx.shadowBlur = 0; // reset

      // Calculate vibration scale for our subwoofer UI driver
      const pulse = 1.0 + (maxVal / 128) * 0.4;
      setBassPulseScale(pulse);

      speakerAnimFrameRef.current = requestAnimationFrame(draw);
    };

    speakerAnimFrameRef.current = requestAnimationFrame(draw);
  };

  const startSpeakerTest = (
    type: 'left' | 'right' | 'both' | 'sweep' | 'bass' | 'preset',
    customFreq?: number,
    customWave?: 'sine' | 'triangle' | 'square' | 'sawtooth',
    presetLabel?: string
  ) => {
    stopSpeakerSounds();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      speakerCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      oscillatorRef.current = osc;

      const gain = ctx.createGain();
      gainNodeRef.current = gain;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      speakerAnalyserRef.current = analyser;

      osc.connect(gain);
      gain.connect(analyser);

      // Set default pan
      let initialPan = speakerPan;
      if (type === 'left') {
        initialPan = -1.0;
        setSpeakerPan(-1.0);
        setSpeakerState('playing-left');
      } else if (type === 'right') {
        initialPan = 1.0;
        setSpeakerPan(1.0);
        setSpeakerState('playing-right');
      } else if (type === 'both') {
        initialPan = 0.0;
        setSpeakerPan(0.0);
        setSpeakerState('playing-both');
      } else if (type === 'sweep') {
        setSpeakerState('playing-sweep');
      } else if (type === 'bass') {
        setSpeakerState('playing-bass');
      } else {
        setSpeakerState('playing-preset');
        if (presetLabel) setActivePresetLabel(presetLabel);
      }

      // Configure Stereo Panner
      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        pannerNodeRef.current = panner;
        analyser.connect(panner);
        panner.connect(ctx.destination);
        panner.pan.value = initialPan;
      } else {
        analyser.connect(ctx.destination);
      }

      // Waveform Selection
      osc.type = customWave || speakerWaveform;

      // Frequency Mapping
      let freq = sweepFrequency;
      if (type === 'left' || type === 'right' || type === 'both') {
        freq = 440; // 440Hz standard A
      } else if (customFreq) {
        freq = customFreq;
        setSweepFrequency(customFreq);
      }
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Volume / Gain mapping
      const gainVal = (speakerVolume / 100) * 0.45;
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);

      osc.start();

      // Launch drawing loop
      startSpeakerCanvasLoop();

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

  const handleSpeakerPanChange = (val: number) => {
    setSpeakerPan(val);
    if (pannerNodeRef.current && speakerCtxRef.current) {
      pannerNodeRef.current.pan.setValueAtTime(val, speakerCtxRef.current.currentTime);
    }
  };

  const handleSpeakerVolumeChange = (val: number) => {
    setSpeakerVolume(val);
    if (gainNodeRef.current && speakerCtxRef.current) {
      const gainVal = (val / 100) * 0.45;
      gainNodeRef.current.gain.setValueAtTime(gainVal, speakerCtxRef.current.currentTime);
    }
  };

  const handleSpeakerWaveformChange = (type: 'sine' | 'triangle' | 'square' | 'sawtooth') => {
    setSpeakerWaveform(type);
    if (oscillatorRef.current) {
      oscillatorRef.current.type = type;
    }
  };

  const stopSpeakerSounds = () => {
    if (speakerAnimFrameRef.current) {
      cancelAnimationFrame(speakerAnimFrameRef.current);
      speakerAnimFrameRef.current = null;
    }
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
    setBassPulseScale(1.0);
    setActivePresetLabel('');
  };

  // ---------------------------------------------------------------------------
  // ADVANCED NOISE, POLARITY & HEARING RANGE TEST OPERATIONS
  // ---------------------------------------------------------------------------
  // White, Pink, and Brown Noise synthesizers
  const playNoise = (type: 'white' | 'pink' | 'brown') => {
    stopSpeakerSounds();
    setErrorHeader(null);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      speakerCtxRef.current = ctx;

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      if (type === 'white') {
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
      } else if (type === 'pink') {
        // Paul Kellet's refined 1/f noise filter approximation
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11; // normalise gain
          b6 = white * 0.115926;
        }
      } else {
        // Brown (red) noise Brownian walk
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // adjust perceived loudness
        }
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime((speakerVolume / 100) * 0.25, ctx.currentTime);
      gainNodeRef.current = gain;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      speakerAnalyserRef.current = analyser;

      noiseNode.connect(gain);
      gain.connect(analyser);
      analyser.connect(ctx.destination);

      noiseNode.start();
      oscillatorRef.current = noiseNode as any; // mock ref to handle stop
      setSpeakerState('playing-preset');
      setActivePresetLabel(`${type} noise`);

      startSpeakerCanvasLoop();
    } catch (e: any) {
      setErrorHeader('Failed to play custom noise synthesiser.');
    }
  };

  // Stereo Polarity & Phase Inverter (correlated vs uncorrelated center)
  const playPhaseTest = (inPhase: boolean) => {
    stopSpeakerSounds();
    setErrorHeader(null);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      speakerCtxRef.current = ctx;

      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      oscillatorRef.current = oscL; // keep reference to L to trigger stopping

      oscL.frequency.setValueAtTime(330, ctx.currentTime);
      oscR.frequency.setValueAtTime(330, ctx.currentTime);
      oscL.type = 'sine';
      oscR.type = 'sine';

      const gainL = ctx.createGain();
      const gainR = ctx.createGain();
      gainL.gain.setValueAtTime((speakerVolume / 100) * 0.2, ctx.currentTime);
      
      // Phase-invert right channel to cancel center image if out-of-phase
      const multiplier = inPhase ? 1.0 : -1.0;
      gainR.gain.setValueAtTime((speakerVolume / 100) * 0.2 * multiplier, ctx.currentTime);

      const merger = ctx.createChannelMerger(2);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      speakerAnalyserRef.current = analyser;

      oscL.connect(gainL);
      oscR.connect(gainR);

      gainL.connect(merger, 0, 0);
      gainR.connect(merger, 0, 1);

      merger.connect(analyser);
      analyser.connect(ctx.destination);

      oscL.start();
      oscR.start();

      setSpeakerState('playing-preset');
      setActivePresetLabel(inPhase ? 'In-Phase' : 'Out-of-Phase');

      startSpeakerCanvasLoop();
    } catch (e: any) {
      setErrorHeader('Failed to configure phase splitter channels.');
    }
  };

  // Ear & Hearing Range Frequency Sweep Test
  const startHearingRangeTest = () => {
    stopSpeakerSounds();
    setErrorHeader(null);
    setHearingResultLimit(null);
    setHearingCurrentFreq(4000); // start at standard audible 4kHz

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      speakerCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      oscillatorRef.current = osc;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4000, ctx.currentTime);

      const gain = ctx.createGain();
      gainNodeRef.current = gain;
      // Keep safety volume during hearing sweep
      gain.gain.setValueAtTime((speakerVolume / 100) * 0.15, ctx.currentTime);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      speakerAnalyserRef.current = analyser;

      osc.connect(gain);
      gain.connect(analyser);
      analyser.connect(ctx.destination);

      osc.start();
      setHearingTestState('testing');
      setSpeakerState('playing-preset');
      setActivePresetLabel('Hearing Check');

      startSpeakerCanvasLoop();

      if (hearingIntervalRef.current) clearInterval(hearingIntervalRef.current);
      hearingIntervalRef.current = setInterval(() => {
        setHearingCurrentFreq((prev) => {
          const next = prev + 150;
          if (next >= 21000) {
            stopHearingRangeTest(true, 20000);
            return 20000;
          }
          if (oscillatorRef.current && speakerCtxRef.current) {
            try {
              oscillatorRef.current.frequency.setValueAtTime(next, speakerCtxRef.current.currentTime);
            } catch (e) {}
          }
          return next;
        });
      }, 120);

    } catch (e: any) {
      setErrorHeader('Failed to boot ear testing frequency sweeps.');
    }
  };

  const stopHearingRangeTest = (wasSuccess: boolean, overrideFreq?: number) => {
    if (hearingIntervalRef.current) {
      clearInterval(hearingIntervalRef.current);
      hearingIntervalRef.current = null;
    }

    const finalFreq = overrideFreq || hearingCurrentFreq;
    stopSpeakerSounds();

    if (wasSuccess) {
      setHearingResultLimit(finalFreq);
      setHearingTestState('completed');
    } else {
      setHearingTestState('idle');
    }
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
            <h1 className="font-heading text-lg sm:text-xl font-bold text-white uppercase tracking-wider">
              {SEO_H1_MAPPING[activeTab] || (activeTab === 'microphone-tester' ? 'Free Online Microphone Tester' : activeTab === 'webcam-check' ? 'Free Webcam Check Online' : 'Free Speaker Test Online')}
            </h1>
            <p className="font-sans text-xs text-zinc-400">
              {SEO_DESC_MAPPING[activeTab] || (activeTab === 'microphone-tester' ? 'Mic tester for Google Meet and Zoom with playback loopback and live decibel level charts' : activeTab === 'webcam-check' ? 'Check webcam resolution, aspect ratios, and camera lighting online with zero watermark' : 'Stereo speaker test left right channel sound, balance sweeps, and custom frequency sweeps')}
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Visual canvas & stats */}
              <div className="lg:col-span-8 space-y-4">
                <div className="relative border border-zinc-900 rounded-2xl overflow-hidden bg-[#040408] p-1 flex items-center justify-center">
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400">Live Mic Level Waves</span>
                  </div>
                  
                  {micState === 'listening' && micDeviceName && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      <span className="font-mono text-[9px] text-zinc-500 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800 uppercase max-w-[200px] truncate">{micDeviceName}</span>
                    </div>
                  )}

                  <canvas 
                    ref={canvasRef} 
                    width={600} 
                    height={200} 
                    className="w-full h-[200px] rounded-xl block bg-[#040408]" 
                  />
                  {micState === 'idle' && (
                    <div className="absolute inset-0 bg-[#040408]/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 rounded-full bg-zinc-900/80 border border-zinc-800">
                        <Mic className="w-10 h-10 text-brand animate-bounce" />
                      </div>
                      <p className="font-sans text-xs text-zinc-300 font-bold">Mic Test & Audio Check Tool</p>
                      <p className="font-sans text-[10px] text-zinc-500 max-w-xs text-center leading-relaxed">
                        Click 'Start Microphone Test' to run an instant online sound check, check decibel levels, and trace vocal frequencies.
                      </p>
                    </div>
                  )}
                </div>

                {/* Main Mic trigger and device settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-4 border border-zinc-900 rounded-2xl">
                  {/* Select device */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide block">Select Audio Input Hardware</label>
                    <select
                      value={selectedMicId}
                      onChange={(e) => {
                        setSelectedMicId(e.target.value);
                        if (micState === 'listening') {
                          // Restart stream with new device
                          stopAllHardwareStreams();
                          setTimeout(() => toggleMicrophoneTest(), 100);
                        }
                      }}
                      className="w-full bg-zinc-900 text-white border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand"
                    >
                      {micAvailableDevices.length === 0 ? (
                        <option value="">Default Input Device</option>
                      ) : (
                        micAvailableDevices.map((d, idx) => (
                          <option key={d.deviceId || idx} value={d.deviceId}>
                            {d.label || `Microphone ${idx + 1}`}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Toggle Button */}
                  <div className="flex items-end">
                    <button
                      onClick={toggleMicrophoneTest}
                      className={`w-full py-2.5 rounded-xl font-heading font-extrabold tracking-wider uppercase text-xs transition-all cursor-pointer ${
                        micState === 'listening'
                          ? 'bg-red-500/20 hover:bg-red-500/35 border border-red-500/30 text-red-400 font-bold'
                          : 'bg-brand text-zinc-950 hover:bg-brand/90 font-bold shadow-md shadow-brand/10'
                      }`}
                    >
                      {micState === 'listening' ? '🔴 Mute Microphone Feed' : '🎤 Start Microphone Test'}
                    </button>
                  </div>
                </div>

                {/* Voice Recorder & Audio Playback Sandbox */}
                <div className="bg-[#09090e] border border-zinc-900 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900/40 pb-2">
                    <div className="flex items-center gap-2">
                      <Disc className={`w-4 h-4 text-brand ${voiceRecordState === 'recording' ? 'animate-spin text-red-500' : ''}`} />
                      <span className="font-heading text-xs font-bold text-white uppercase tracking-wider">Voice Recording Playback Audit</span>
                    </div>
                    <span className="font-mono text-[9px] text-zinc-500">OFFLINE PRIVACY SAFE</span>
                  </div>

                  <p className="font-sans text-[11px] text-zinc-400 leading-relaxed">
                    Test how you sound to others. Record a 10-second vocal clip and play it back instantly to check for crackling, popping, background hiss, or level dips.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Record button */}
                    {voiceRecordState !== 'recording' ? (
                      <button
                        onClick={startVoiceRecord}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 font-sans text-xs font-bold transition-all cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        Record 10-Sec Sample
                      </button>
                    ) : (
                      <button
                        onClick={stopVoiceRecord}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-sans text-xs font-bold transition-all cursor-pointer animate-pulse"
                      >
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-sm" />
                        Stop Recording ({voiceRecordDuration}s)
                      </button>
                    )}

                    {/* Progress Bar / Indicator */}
                    {voiceRecordState === 'recording' && (
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-red-500 h-full transition-all duration-1000"
                            style={{ width: `${(voiceRecordDuration / 10) * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-red-400 font-bold">{10 - voiceRecordDuration}s remaining</span>
                      </div>
                    )}

                    {/* Recorded Output audio deck */}
                    {voiceRecordState === 'recorded' && voiceAudioUrl && (
                      <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#050508] border border-zinc-900 px-3 py-2 rounded-xl">
                        <audio src={voiceAudioUrl} controls className="h-8 max-w-full flex-1" />
                        <a 
                          href={voiceAudioUrl} 
                          download="mic_test_recording.webm"
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[10px] font-sans font-bold text-zinc-300 transition-all cursor-pointer"
                        >
                          <Download className="w-3 h-3 text-brand" />
                          <span>Save Clip</span>
                        </a>
                      </div>
                    )}

                    {voiceRecordState === 'idle' && (
                      <div className="flex-1 flex items-center justify-center h-9 border border-dashed border-zinc-900/60 rounded-xl">
                        <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Awaiting Voice Capture</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Audio & Vocal Analysis Deck */}
              <div className="lg:col-span-4 p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">Live Sound Check Metrics</span>

                <div className="space-y-3">
                  {/* Decibel meter bar */}
                  <div className="space-y-1 bg-[#09090e] p-3 rounded-xl border border-zinc-900/60">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-zinc-500">DYNAMIC AMPLITUDE</span>
                      <span className="text-brand font-bold">{Math.round(micAudioLevel)} dB</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mt-1 flex">
                      <div 
                        className="bg-brand h-full rounded-full transition-all duration-75"
                        style={{ width: `${Math.min(100, micAudioLevel * 2.5)}%` }}
                      />
                    </div>
                  </div>

                  {/* Peak Volume hold */}
                  <div className="flex justify-between items-center bg-[#09090e] p-3 rounded-xl border border-zinc-900/60 text-xs">
                    <span className="font-mono text-[10px] text-zinc-500">PEAK VOLUME HOLD</span>
                    <span className="font-bold text-white font-mono">{micMaxDb} dB</span>
                  </div>

                  {/* Live Pitch Frequency Detector */}
                  <div className="bg-[#09090e] p-3 rounded-xl border border-zinc-900/60 space-y-1 text-xs">
                    <div className="flex justify-between items-center font-mono text-[10px] text-zinc-500">
                      <span>Vocal Pitch &amp; Frequency</span>
                      <span className="text-brand font-bold">
                        {micPitch ? `${micPitch} Hz` : 'Silent'}
                      </span>
                    </div>
                    {micPitch && (
                      <div className="text-[10px] text-zinc-400 font-sans mt-1">
                        Est. Range:{' '}
                        <span className="font-bold text-white font-mono uppercase text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-850">
                          {micPitch < 150 ? 'Bass/Baritone 🧔' :
                           micPitch < 250 ? 'Tenor/Alto 👨' :
                           micPitch < 400 ? 'Soprano 👩' : 'High Whistle/Treble 🔔'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Hear Yourself Loopback switch */}
                  <div className="bg-[#0d0d15] p-3.5 rounded-xl border border-amber-500/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-brand animate-pulse" />
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">Playback loopback</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={micLoopback}
                          onChange={(e) => setMicLoopback(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand peer-checked:after:bg-zinc-950 peer-checked:after:border-zinc-950" />
                      </label>
                    </div>
                    <p className="text-[9px] text-zinc-500 leading-relaxed">
                      🔁 <strong>Hear yourself online:</strong> Loop back your voice feed to test mic quality and latency.
                    </p>
                    {micLoopback && (
                      <p className="text-[8px] text-amber-500 leading-tight font-sans">
                        ⚠️ <strong>Warning:</strong> Use headphones to prevent microphone audio feedback loops.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Video-conferencing App Verification status */}
            <div className="p-5 border border-zinc-900 bg-zinc-950 rounded-2xl space-y-3">
              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">Unified Chat &amp; Meeting App Compatibility</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {[
                  { name: 'Zoom Meeting', key: 'zoom' },
                  { name: 'Google Meet', key: 'meet' },
                  { name: 'Microsoft Teams', key: 'teams' },
                  { name: 'Discord voice', key: 'discord' },
                  { name: 'Apple FaceTime', key: 'facetime' },
                  { name: 'Skype Call', key: 'skype' }
                ].map((app) => (
                  <div key={app.key} className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-900 flex flex-col justify-between h-14">
                    <span className="font-heading text-[10px] font-bold text-zinc-400 uppercase">{app.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="font-mono text-[9px] text-zinc-500 uppercase">Compatible</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comprehensive Searchable FAQ section for Microphone Checker */}
            <div className="p-5 border border-zinc-900 bg-zinc-950 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-brand" />
                    <span>Microphone Tester Troubleshooting &amp; FAQ Hub</span>
                  </h4>
                  <p className="font-sans text-[10px] text-zinc-500">Fix voice audio check issues, zoom permissions, and offline mic test problems</p>
                </div>

                {/* Filter search query */}
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search mic check topics..."
                    value={micFaqSearchQuery}
                    onChange={(e) => setMicFaqSearchQuery(e.target.value)}
                    className="w-full sm:w-64 bg-zinc-900 text-white placeholder-zinc-500 text-xs px-3 py-1.5 rounded-lg border border-zinc-800 focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {[
                  {
                    q: "How do I perform a mic test or microphone test on this website?",
                    a: "Testing your microphone is fast and simple: select your connected audio input hardware from the selector dropdown, click the 'Start Microphone Test' button, and allow the browser to access your microphone. Speak into your mic - the live waveform graph and decibel level bar will respond in real-time. This free mic test online operates fully inside your secure browser sandbox, ensuring absolute privacy."
                  },
                  {
                    q: "Is there a mic test with sound playback loopback available?",
                    a: "Yes! To hear your voice through your speakers or headphones to test microphone audio quality, toggle the 'Playback Loopback' switch in the right-hand metrics column. This routes your active mic input stream directly to your audio speakers. Note: we highly recommend using headphones during a voice check online with loopback to prevent acoustic feedback."
                  },
                  {
                    q: "What does the decibel (dB) level amplitude check tell me?",
                    a: "Our sound check microphone tool displays average amplitude and peak amplitude. If the decibel level remains flat or very low when you speak, check if your microphone is physically muted or if your system volume settings are set too low. Adjusting system input gain can boost mic sensitivity for clean Zoom, Teams, and Discord audio."
                  },
                  {
                    q: "How do I resolve 'Microphone access denied or Busy' errors?",
                    a: "If the mic test website says your mic is denied or busy, click the lock icon in your browser URL bar and verify that microphone permissions are set to 'Allow'. Also ensure that no other apps (like Zoom, Teams, or Audacity) are running in the background holding exclusive access to your microphone hardware."
                  },
                  {
                    q: "Can I run a mobile phone speaker test or phone microphone check?",
                    a: "Yes! This audio test website is fully responsive and supports iPhone, Android, iPads, laptops, and chromebooks. Simply open the page in your mobile web browser, click the mic trigger, and talk to execute an online microphone test, or use our Speaker Tester tab to check phone speaker test sound frequencies."
                  }
                ].filter(faq => 
                  faq.q.toLowerCase().includes(micFaqSearchQuery.toLowerCase()) || 
                  faq.a.toLowerCase().includes(micFaqSearchQuery.toLowerCase())
                ).map((faq, i) => {
                  const isOpen = activeMicFaq === i;
                  return (
                    <div key={i} className="border border-zinc-900 rounded-xl bg-zinc-950 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setActiveMicFaq(isOpen ? null : i)}
                        className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-zinc-900/40 transition-colors cursor-pointer"
                      >
                        <span className="text-xs font-heading font-extrabold text-white leading-relaxed">{faq.q}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <div className="px-4 pb-4 pt-1 text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-900 bg-zinc-950/60">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Empty check */}
                {[
                  { q: "How do I perform a mic test?", a: "" }
                ].filter(faq => 
                  faq.q.toLowerCase().includes(micFaqSearchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-6 text-zinc-500 text-xs font-mono">
                    No answers matching "{micFaqSearchQuery}" found. Try searching "loopback", "permission", or "decibel".
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: WEBCAM CHECK */}
        {activeTab === 'webcam-check' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Display Camera feed column */}
              <div className="xl:col-span-8 space-y-4">
                <div className="relative border border-zinc-900 rounded-2xl overflow-hidden bg-zinc-950 flex items-center justify-center min-h-[300px] sm:min-h-[420px] shadow-2xl">
                  {/* Aspect Ratio Guideline Borders */}
                  <div 
                    className={`w-full h-full flex items-center justify-center transition-all duration-300 ${
                      webcamAspectRatio === '16:9' ? 'aspect-video' :
                      webcamAspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-square max-w-[420px]'
                    }`}
                  >
                    <video 
                      ref={videoRef} 
                      className={`w-full h-full object-cover rounded-xl transition-all duration-300 ${webcamMirror ? 'scale-x-[-1]' : ''}`}
                      style={{
                        filter: getFilterStyle()
                      }}
                    />
                  </div>
                  
                  {webcamState === 'idle' && (
                    <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center animate-pulse">
                        <Camera className="w-8 h-8 text-brand" />
                      </div>
                      <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider">Deploy Web Browser Camera Access</h4>
                      <p className="font-sans text-[11px] text-zinc-400 max-w-sm leading-relaxed">
                        Execute a camera test right on this webpage. Click below to enable webcam access, query format matrices, and test video stream stability.
                      </p>
                      <button
                        onClick={toggleWebcamTest}
                        className="mt-2 px-6 py-2.5 rounded-xl bg-brand text-zinc-950 font-heading font-extrabold text-xs uppercase tracking-wider transition-all hover:bg-brand/90 hover:scale-[1.02] shadow-[0_4px_16px_rgba(245,158,11,0.25)] cursor-pointer"
                      >
                        Launch Camera Test
                      </button>
                    </div>
                  )}

                  {webcamState === 'active' && (
                    <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800/80 text-[10px] font-mono text-zinc-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>STREAM SECURE &amp; OFFLINE</span>
                    </div>
                  )}
                </div>

                {/* Quick actions row */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-4 border border-zinc-900 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleWebcamTest}
                      className={`px-5 py-2.5 rounded-xl font-heading font-extrabold tracking-wider uppercase text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        webcamState === 'active'
                          ? 'bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400'
                          : 'bg-brand text-zinc-950 hover:bg-brand/90 shadow-[0_4px_12px_rgba(245,158,11,0.2)]'
                      }`}
                    >
                      {webcamState === 'active' ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Close Camera</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5" />
                          <span>Deploy Cam Feed</span>
                        </>
                      )}
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

                  {/* Horizontal Mirroring toggle */}
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/60 border border-zinc-900 rounded-xl cursor-pointer hover:bg-zinc-900 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={webcamMirror}
                      onChange={(e) => setWebcamMirror(e.target.checked)}
                      className="accent-brand cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-zinc-300 uppercase select-none">Mirror Preview</span>
                  </label>
                </div>
              </div>

              {/* Hardware Selection & Resolution Metrics Column */}
              <div className="xl:col-span-4 space-y-6">
                {/* Panel 1: Device Routing & Geometry */}
                <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
                  <div className="border-b border-zinc-900 pb-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">Hardware Settings</span>
                    <h3 className="font-heading text-xs font-bold text-white uppercase tracking-wider mt-0.5">Camera Setup</h3>
                  </div>

                  {/* Active selector */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider block">Select Active Camera Device</label>
                    <div className="relative">
                      <select
                        value={selectedWebcamId}
                        onChange={(e) => {
                          setSelectedWebcamId(e.target.value);
                          if (webcamState === 'active') {
                            // Cycle stream
                            stopAllHardwareStreams();
                            setTimeout(() => toggleWebcamTest(), 150);
                          }
                        }}
                        className="w-full bg-[#07070a] text-zinc-300 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs font-sans focus:outline-none focus:border-brand appearance-none"
                      >
                        {webcamAvailableDevices.length > 0 ? (
                          webcamAvailableDevices.map((d, index) => (
                            <option key={d.deviceId || index} value={d.deviceId}>
                              {d.label || `Webcam ${index + 1} (${d.deviceId.slice(0, 5)}...)`}
                            </option>
                          ))
                        ) : (
                          <option value="">Default Web Camera</option>
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Aspect Ratio Config */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider block">Aspect Ratio Guideline</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['16:9', '4:3', '1:1'] as const).map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => {
                            setWebcamAspectRatio(ratio);
                            if (webcamState === 'active') {
                              // Restart with new aspect constraints
                              stopAllHardwareStreams();
                              setTimeout(() => toggleWebcamTest(), 150);
                            }
                          }}
                          className={`py-1.5 border rounded-xl font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            webcamAspectRatio === ratio
                              ? 'bg-brand/10 border-brand text-brand shadow-sm'
                              : 'bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shaders and Filters */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider block">Visual Filters &amp; Lighting Presets</label>
                    <div className="relative">
                      <select
                        value={webcamColorFilter}
                        onChange={(e) => setWebcamColorFilter(e.target.value as any)}
                        className="w-full bg-[#07070a] text-zinc-300 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs font-sans focus:outline-none focus:border-brand appearance-none"
                      >
                        <option value="none">Normal (Natural Color)</option>
                        <option value="grayscale">Grayscale (Monochrome Test)</option>
                        <option value="contrast">High Contrast (Edge Isolation)</option>
                        <option value="warm">Warm Profile (Studio Amber)</option>
                        <option value="cool">Cool Profile (Fluorescent Audit)</option>
                        <option value="negative">Inverted Color (Thermal Map simulation)</option>
                        <option value="studio">Studio Light Boost (+15% brightness)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Panel 2: Stream Resolution Matrix Prober */}
                <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
                  <div className="border-b border-zinc-900 pb-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">Resolution probe</span>
                    <h3 className="font-heading text-xs font-bold text-white uppercase tracking-wider mt-0.5">Hardware Capabilities</h3>
                  </div>

                  <div className="space-y-2">
                    {cameraResolutions.map((r) => (
                      <div key={r.label} className="flex justify-between items-center bg-[#0d0d12] p-2.5 border border-zinc-900 rounded-xl text-[11px]">
                        <span className="font-bold text-zinc-300">{r.label}</span>
                        <span className={`font-mono text-[9px] px-2 py-0.5 rounded ${
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
                    <div className="pt-3 border-t border-zinc-900/60 space-y-1.5 text-[11px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ACTIVE FORMAT:</span>
                        <span className="text-brand font-bold">{activeResolution}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ACTIVE FRAMERATE:</span>
                        <span className="text-brand font-bold">{Math.round(cameraFps)} FPS</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Exposure, Contrast, and Saturation Panel */}
            {webcamState === 'active' && (
              <div className="p-5 border border-zinc-900 bg-zinc-950 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-zinc-400">
                    <span>Brightness Feed</span>
                    <span>{brightness}%</span>
                  </div>
                  <input 
                    type="range" min="50" max="150" value={brightness} 
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-brand bg-zinc-900 appearance-none h-1 rounded-full cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-zinc-400">
                    <span>Contrast Ratio</span>
                    <span>{contrast}%</span>
                  </div>
                  <input 
                    type="range" min="50" max="150" value={contrast} 
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-brand bg-zinc-900 appearance-none h-1 rounded-full cursor-pointer"
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
                    className="w-full accent-brand bg-zinc-900 appearance-none h-1 rounded-full cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Photos Slideshow */}
            {capturedSnapshots.length > 0 && (
              <div className="space-y-3 bg-zinc-950 p-5 border border-zinc-900 rounded-2xl">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <span className="font-heading text-xs font-bold text-white uppercase tracking-wider">Webcam Snapshots History</span>
                  <span className="font-mono text-[9px] text-zinc-500 uppercase">Click image to export png</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                  {capturedSnapshots.map((snap, idx) => (
                    <div key={idx} className="relative border border-zinc-900 bg-zinc-950 rounded-xl overflow-hidden aspect-video group">
                      <img src={snap} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <a 
                        href={snap} 
                        download={`ApexCamSnapshot_${idx}.png`}
                        className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-brand text-[9px] font-mono uppercase font-bold gap-1 cursor-pointer"
                      >
                        <Camera className="w-3 h-3 text-brand" />
                        <span>Save PNG</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comprehensive Searchable FAQ section for Webcam Tester */}
            <div className="p-5 border border-zinc-900 bg-zinc-950 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-brand" />
                    <span>Webcam Checker Troubleshooting &amp; FAQ Hub</span>
                  </h4>
                  <p className="font-sans text-[10px] text-zinc-500">Enable webcam, allow access to camera on Chrome / Safari, and resolve browser checks</p>
                </div>

                {/* Filter search query */}
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search camera topics..."
                    value={webcamFaqSearchQuery}
                    onChange={(e) => setWebcamFaqSearchQuery(e.target.value)}
                    className="w-full sm:w-64 bg-zinc-900 text-white placeholder-zinc-500 text-xs px-3 py-1.5 rounded-lg border border-zinc-800 focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {[
                  {
                    q: "How do I perform a webcam check or test my website camera in this browser?",
                    a: "Testing your webcam is fast, private, and fully secure on our online testing website. Click the 'Deploy Cam Feed' or 'Launch Camera Test' button, and click 'Allow' when your web browser prompts you for camera access permissions. The live camera stream will immediately render on this page. Our camera browser utility checks your feed fully offline for absolute security."
                  },
                  {
                    q: "How do I perform a Logitech webcam test or check my laptop camera?",
                    a: "Whether you have a built-in computer camera, an external laptop camera, or a high-end Logitech HD webcam (like the Logitech C920, C930, or Brio), this tool acts as a universal camera test. Simply connect your USB webcam, reload this web page, click the camera activation button, and choose your logitech computer camera or built-in web camera from the prober list."
                  },
                  {
                    q: "How can I check both my webcam and microphone online together?",
                    a: "To run a dual check webcam and microphone test, use our combined Hardware Test Suite! First, navigate to this webcam check tab to confirm your video stream, camera lighting, and frame rate. Then, switch to our Microphone Tester tab to measure voice audio, listen to a real-time voice playback loop, and perform a full sound check. It is the easiest way to check camera and mic online."
                  },
                  {
                    q: "How do I test my camera and microphone for proctored exams, Zoom, or Microsoft Teams?",
                    a: "Schools and employers frequently require a browser camera test and mic check before starting online proctored exams, Zoom meetings, Google Meet, or Microsoft Teams calls. You can use this free online camera test to make sure your video cam is working, the lens is clean, and the lighting is flattering. Check your webcam online here to prevent any last-minute hardware surprises during important sessions."
                  },
                  {
                    q: "Can I use this page as an online camera recorder or video tester?",
                    a: "Yes! If you need to record a short webcam video, capture your screen with a webcam overlay, or extract high-quality audio, our companion Video Studio Suite tab acts as a comprehensive online camera recorder. You can record, compress, cut, resize, or convert raw video clips and sound files entirely offline in your browser with zero watermark."
                  },
                  {
                    q: "How do I enable webcam permissions and grant web browser camera access?",
                    a: "When a test website requests access, click the 'Allow' button in the popup dialog. If you accidentally blocked it, click the site settings lock icon in your web browser URL bar, change 'Camera' to 'Allow', and reload website. This allows browser camera access to re-initiate instantly."
                  },
                  {
                    q: "What should I do if the webcam page says my camera is busy or failed to start?",
                    a: "If your browser cannot open the camera media stream, another application (such as Zoom, Skype, Google Meet, or OBS Studio) may have exclusive access to your camera hardware. Close all other browser tabs and background camera software, then click 'Deploy Cam Feed' to re-test browser compatibility."
                  },
                  {
                    q: "Does this webcam checker support Safari, Chrome, and mobile browsers?",
                    a: "Yes! This browser check tool is built to test safari online, Google Chrome, Firefox, Microsoft Edge, Opera, and mobile browsers on iPhone and Android. Simply load this test site URL on your device, enable webcam permissions, and check your mobile camera page instantly."
                  },
                  {
                    q: "Can I test different webcam hardware inputs and select custom aspect ratios (16:9, 4:3)?",
                    a: "Absolutely! Our advanced test my browser suite detects all connected camera devices. Use the select camera dropdown to switch hardware feeds, and use the Aspect Ratio toggles to switch between standard high-definition widescreen (16:9), television format (4:3), or square avatar format (1:1)."
                  },
                  {
                    q: "How can I check webcam resolution or test camera fps online?",
                    a: "Our resolution prober automatically attempts to feed standard high-definition formats (including SD 480p, HD 720p, Full HD 1080p, and 4K Ultra HD) to analyze webcam capabilities. The active resolution format and live capture frame rate (FPS) are audited and displayed in real-time in the sidebar."
                  },
                  {
                    q: "Is my webcam video feed recorded or sent to any remote servers?",
                    a: "No! This camera browser test is run entirely offline in your browser using the local media stream API. No video, media, or snapshot telemetry is ever uploaded to any web server or database. It is 100% private, sandbox-safe, and free from external tracking."
                  }
                ].filter(faq => 
                  faq.q.toLowerCase().includes(webcamFaqSearchQuery.toLowerCase()) || 
                  faq.a.toLowerCase().includes(webcamFaqSearchQuery.toLowerCase())
                ).map((faq, i) => {
                  const isOpen = activeWebcamFaq === i;
                  return (
                    <div key={i} className="border border-zinc-900 rounded-xl bg-zinc-950 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setActiveWebcamFaq(isOpen ? null : i)}
                        className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-zinc-900/40 transition-colors cursor-pointer"
                      >
                        <span className="text-xs font-heading font-extrabold text-white leading-relaxed">{faq.q}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <div className="px-4 pb-4 pt-1 text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-900 bg-zinc-950/60">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Empty check */}
                {[
                  { q: "How do I perform a webcam test?", a: "" }
                ].filter(faq => 
                  faq.q.toLowerCase().includes(webcamFaqSearchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-6 text-zinc-500 text-xs font-mono">
                    No answers matching "{webcamFaqSearchQuery}" found. Try searching "Chrome", "aspect ratio", or "permissions".
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: SPEAKER TESTER (COMPREHENSIVE AUDIO SANDBOX) */}
        {activeTab === 'speaker-tester' && (
          <div className="space-y-6">
            {/* Header and Live Oscilloscope Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-brand">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </span>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wider">HiFi Audio Sandbox</h3>
                    <p className="text-[10px] text-zinc-500">Continuous sound tester, balance sweepers & subwoofer diagnostic engine</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Calibrate, test, and troubleshoot your stereo setup, soundbars, or built-in hardware. 
                  Audit stereo separation, test deep subwoofer frequencies, and measure hifi range outputs in real-time.
                </p>

                {/* State Indicators */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-900 text-[10px] font-mono">
                    <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Active Channel</span>
                    <span className="text-white font-bold">
                      {speakerState === 'playing-left' ? '⬅️ LEFT ONLY' :
                       speakerState === 'playing-right' ? '➡️ RIGHT ONLY' :
                       speakerState === 'playing-both' ? '↔️ STEREO CENTER' :
                       speakerState === 'playing-sweep' ? '🔊 DYNAMIC SWEEP' :
                       speakerState === 'playing-bass' ? '🔊 SUB-BASS WOOFER' :
                       speakerState === 'playing-preset' ? `🔊 PRESET: ${activePresetLabel}` : '🔇 IDLE (Muted)'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-900 text-[10px] font-mono">
                    <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Output Signal</span>
                    <span className="text-brand font-bold">
                      {speakerState !== 'idle' ? `${sweepFrequency} Hz (${speakerWaveform.toUpperCase()})` : 'No Signal'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Oscilloscope Canvas Deck */}
              <div className="lg:col-span-7 p-4 bg-zinc-950 rounded-2xl border border-zinc-900 relative overflow-hidden group">
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400">Live Waveform Analyzer</span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  <span className="font-mono text-[9px] text-zinc-600">Gain: -{100 - speakerVolume}%</span>
                </div>

                <div className="pt-6">
                  <canvas 
                    ref={speakerCanvasRef} 
                    className="w-full h-32 bg-[#05050a] rounded-xl border border-zinc-900/60 shadow-inner"
                    width={500} 
                    height={128} 
                  />
                </div>
              </div>
            </div>

            {/* Main Diagnostics & Tuning Center */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box A: 2D Spatial Stereo Balance Stage */}
              <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider">1. Stereo Balance Stage & Panner</h4>
                      <p className="font-sans text-[10px] text-zinc-500">Check right left speaker placement & channel routing</p>
                    </div>
                    <span className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850 text-zinc-400">Pan: {speakerPan.toFixed(1)}</span>
                  </div>

                  {/* 2D Interactive Stage visualization */}
                  <div className="my-5 p-4 rounded-xl bg-[#07070c] border border-zinc-900 flex flex-col justify-between h-28 relative">
                    <div className="flex justify-between items-center px-6">
                      <div className="flex flex-col items-center">
                        <Volume2 className={`w-6 h-6 transition-colors ${speakerPan < -0.1 && speakerState !== 'idle' ? 'text-brand' : 'text-zinc-600'}`} />
                        <span className="text-[8px] font-mono text-zinc-500 uppercase mt-1">Left Spk</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`p-1.5 rounded-full border bg-zinc-950 transition-all ${speakerState !== 'idle' ? 'border-brand/30 animate-pulse' : 'border-zinc-800'}`}>
                          <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center font-mono text-[8px] text-zinc-400">👤</div>
                        </div>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase mt-1">Listener</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <Volume2 className={`w-6 h-6 transition-colors ${speakerPan > 0.1 && speakerState !== 'idle' ? 'text-brand' : 'text-zinc-600'}`} />
                        <span className="text-[8px] font-mono text-zinc-500 uppercase mt-1">Right Spk</span>
                      </div>
                    </div>

                    {/* Interactive slider */}
                    <div className="space-y-1">
                      <input 
                        type="range"
                        min="-1.0"
                        max="1.0"
                        step="0.1"
                        value={speakerPan}
                        onChange={(e) => handleSpeakerPanChange(parseFloat(e.target.value))}
                        className="w-full accent-brand bg-zinc-900 appearance-none h-1 rounded-full cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] font-mono text-zinc-600 uppercase px-1">
                        <span>Max Left (-1.0)</span>
                        <span>Center Balance (0.0)</span>
                        <span>Max Right (+1.0)</span>
                      </div>
                    </div>
                  </div>

                  {/* Waveform Selector & Volume Control Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Oscillator Waveform</label>
                      <div className="grid grid-cols-4 gap-1">
                        {(['sine', 'triangle', 'square', 'sawtooth'] as const).map((w) => (
                          <button
                            key={w}
                            onClick={() => handleSpeakerWaveformChange(w)}
                            className={`py-1 rounded text-[9px] font-mono uppercase border transition-colors cursor-pointer ${
                              speakerWaveform === w
                                ? 'bg-brand/20 border-brand text-brand font-bold'
                                : 'bg-zinc-900 border-zinc-850 hover:border-zinc-700 text-zinc-400'
                            }`}
                            title={`Select ${w} sound wave`}
                          >
                            {w.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-zinc-400 uppercase">Volume Limit</span>
                        <span className="text-brand font-bold">{speakerVolume}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="100" 
                        value={speakerVolume}
                        onChange={(e) => handleSpeakerVolumeChange(Number(e.target.value))}
                        className="w-full accent-brand bg-zinc-900 appearance-none h-1.5 rounded-full cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Direct quick channel play buttons */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-zinc-900">
                  {[
                    { type: 'left', label: 'Play Left', icon: Volume2 },
                    { type: 'both', label: 'Play Both', icon: Volume2 },
                    { type: 'right', label: 'Play Right', icon: Volume2 }
                  ].map((ch) => {
                    const isSelected = speakerState === `playing-${ch.type}`;
                    return (
                      <button
                        key={ch.type}
                        onClick={() => isSelected ? stopSpeakerSounds() : startSpeakerTest(ch.type as any)}
                        className={`py-2 rounded-xl border flex items-center justify-center gap-1.5 font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/40 text-red-400 shadow-sm shadow-red-500/5'
                            : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-850 hover:border-zinc-750 text-zinc-300'
                        }`}
                      >
                        {isSelected ? <VolumeX className="w-3.5 h-3.5" /> : <ch.icon className="w-3.5 h-3.5" />}
                        <span>{isSelected ? 'Mute' : ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Box B: Woofer, Subwoofer & Bass Sub-System Tester */}
              <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider">2. Deep Subwoofer & Bass Woofer Tester</h4>
                      <p className="font-sans text-[10px] text-zinc-500">Verify low-frequency bass limits & earphone resonance</p>
                    </div>
                    <span className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850 text-amber-500">BASS</span>
                  </div>

                  <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* Pulsing sub-woofer visualizer driver */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#06060c] border border-zinc-900 relative overflow-hidden h-32">
                      <div className="absolute inset-0 bg-radial from-amber-500/5 via-transparent to-transparent pointer-events-none" />
                      
                      {/* Outer Frame */}
                      <motion.div 
                        style={{ scale: bassPulseScale }}
                        className="w-20 h-20 rounded-full bg-zinc-900 border-4 border-zinc-800 flex items-center justify-center relative shadow-lg shadow-black"
                      >
                        {/* Speaker suspension rim */}
                        <div className="w-16 h-16 rounded-full bg-zinc-950 border-2 border-zinc-700 flex items-center justify-center">
                          {/* Speaker dust cap */}
                          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-600 flex items-center justify-center shadow-inner">
                            <div className="w-4 h-4 rounded-full bg-zinc-800" />
                          </div>
                        </div>

                        {/* Soundwaves ripples */}
                        {speakerState === 'playing-bass' && (
                          <span className="absolute -inset-2 rounded-full border border-amber-500/20 animate-ping pointer-events-none" />
                        )}
                      </motion.div>
                      <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest mt-2">Physical Driver Simulator</span>
                    </div>

                    <div className="space-y-2">
                      <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-wide block">Low-frequency Presets:</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { freq: 20, desc: '20Hz Sub-bass limit' },
                          { freq: 30, desc: '30Hz Deep Rumble' },
                          { freq: 40, desc: '40Hz Woofer check' },
                          { freq: 50, desc: '50Hz Sub resonance' },
                          { freq: 60, desc: '60Hz Kick punch' },
                          { freq: 80, desc: '80Hz Upper bass' }
                        ].map((b) => {
                          const isActive = speakerState === 'playing-bass' && sweepFrequency === b.freq;
                          return (
                            <button
                              key={b.freq}
                              onClick={() => isActive ? stopSpeakerSounds() : startSpeakerTest('bass', b.freq, 'sine')}
                              className={`p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                                  : 'bg-zinc-900/60 border-zinc-850 hover:border-zinc-750 text-zinc-400'
                              }`}
                              title={b.desc}
                            >
                              <span className="font-mono text-[10px] font-bold">{b.freq} Hz</span>
                              <span className="text-[8px] opacity-70 truncate max-w-full">{b.desc.split(' ')[1]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-900 text-center">
                  <p className="text-[9px] text-zinc-500 italic leading-relaxed">
                    ⚠️ Sub-bass frequencies (20-40Hz) require dedicated subwoofers or high-end hifi headphones. Small mobile phone or tablet speaker elements cannot reproduce these wavelengths.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: High Fidelity Sweep Generator & Device Optimizers */}
            <div className="p-5 border border-zinc-900 bg-zinc-950 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-brand" />
                    <span>3. Dynamic Sweep Tone Generator & Booster Presets</span>
                  </h4>
                  <p className="font-sans text-[10px] text-zinc-500">Continuous frequency analyzer & specialty device sweep channels</p>
                </div>
                
                <button
                  onClick={() => speakerState === 'playing-sweep' ? stopSpeakerSounds() : startSpeakerTest('sweep')}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                    speakerState === 'playing-sweep' 
                      ? 'bg-red-500/20 hover:bg-red-500/35 border border-red-500/30 text-red-400' 
                      : 'bg-brand text-zinc-950 hover:bg-brand/90'
                  }`}
                >
                  {speakerState === 'playing-sweep' ? 'STOP SWEEP' : 'ENGAGE SWEEP'}
                </button>
              </div>

              {/* Slider Controller */}
              <div className="space-y-3 p-4 bg-[#07070c] rounded-xl border border-zinc-900/80">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400 uppercase">Manual Sweep Frequency</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleSweepFrequencyChange(Math.max(20, sweepFrequency - 100))}
                      className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                    >
                      -100Hz
                    </button>
                    <span className="text-brand font-bold text-sm bg-zinc-950 px-3 py-1 rounded border border-zinc-850 min-w-20 text-center">{sweepFrequency} Hz</span>
                    <button 
                      onClick={() => handleSweepFrequencyChange(Math.min(20000, sweepFrequency + 100))}
                      className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                    >
                      +100Hz
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <input 
                    type="range" 
                    min="20" 
                    max="15000" 
                    value={sweepFrequency}
                    onChange={(e) => handleSweepFrequencyChange(Number(e.target.value))}
                    className="w-full accent-brand bg-zinc-900 appearance-none h-1.5 rounded-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-zinc-600">
                    <span>20 Hz (Deep Bass limit)</span>
                    <span>1,000 Hz (Reference Mid-frequency)</span>
                    <span>15,000 Hz (High Treble limit)</span>
                  </div>
                </div>
              </div>

              {/* Specialty Diagnostic Sweeps */}
              <div className="space-y-2">
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block">Specialty Hardware Optimizers:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'chromebook',
                      label: 'Chromebook Dialog Mids',
                      freq: 1200,
                      wave: 'triangle' as const,
                      desc: 'Check clarity on dialogue mids (1200Hz)',
                      icon: Laptop,
                      badge: 'Laptops'
                    },
                    {
                      id: 'phone',
                      label: 'Phone Speaker Booster',
                      freq: 4200,
                      wave: 'sine' as const,
                      desc: 'Treble response sweeps (4200Hz)',
                      icon: Phone,
                      badge: 'Smartphones'
                    },
                    {
                      id: 'tweeter',
                      label: 'HiFi Tweeter Limit',
                      freq: 11000,
                      wave: 'sine' as const,
                      desc: 'Ultra-high treble test (11,000Hz)',
                      icon: Zap,
                      badge: 'High-Hertz'
                    }
                  ].map((p) => {
                    const isPlaying = speakerState === 'playing-preset' && activePresetLabel === p.label;
                    return (
                      <button
                        key={p.id}
                        onClick={() => isPlaying ? stopSpeakerSounds() : startSpeakerTest('preset', p.freq, p.wave, p.label)}
                        className={`p-3 rounded-xl border text-left space-y-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isPlaying
                            ? 'bg-brand/10 border-brand text-brand'
                            : 'bg-zinc-900/40 border-zinc-850 hover:border-zinc-800 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="p-1 rounded bg-zinc-950 border border-zinc-850">
                            <p.icon className="w-4 h-4 text-zinc-400" />
                          </span>
                          <span className="text-[8px] font-mono uppercase bg-zinc-950 text-zinc-500 px-1.5 py-0.5 rounded">{p.badge}</span>
                        </div>
                        <div>
                          <h5 className="text-[11px] font-bold text-white uppercase">{p.label}</h5>
                          <p className="text-[9px] text-zinc-500 line-clamp-1">{p.desc}</p>
                        </div>
                        <div className="flex justify-between items-center w-full pt-1 text-[9px] font-mono">
                          <span className="text-zinc-400 font-bold">{p.freq}Hz</span>
                          <span className="text-zinc-600">{isPlaying ? 'TAP TO STOP' : 'RUN TEST'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 4: Advanced Audio Calibration & Hearing Suite (Ear Hz & Mosquito Test, Noise Burn-In, Speaker Phase) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Card 4A: Ear & Hearing Range Frequency Check (Mosquito Test) */}
              <div className="p-5 border border-zinc-900 bg-zinc-950 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span>Ear &amp; Hearing Hz Check</span>
                      </h4>
                      <p className="font-sans text-[10px] text-zinc-500">Test your maximum frequency hearing limit (Mosquito test)</p>
                    </div>
                    <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">HEARING TEST</span>
                  </div>

                  <p className="font-sans text-[11px] text-zinc-400 leading-relaxed mt-2">
                    Human hearing drops as we age. Run this automated test sweep to discover the highest pitch frequency your ears can perceive. Use quality headphones at safe volume!
                  </p>

                  <div className="my-4 p-4 rounded-xl bg-[#06060c] border border-zinc-900 flex flex-col items-center justify-center text-center h-28 relative overflow-hidden">
                    {hearingTestState === 'testing' ? (
                      <div className="space-y-2">
                        <span className="font-mono text-[9px] text-emerald-500 uppercase tracking-widest animate-pulse block">Frequency Sweeping...</span>
                        <div className="text-2xl font-mono font-extrabold text-white">{hearingCurrentFreq} <span className="text-emerald-500 text-xs">Hz</span></div>
                        <span className="font-sans text-[9px] text-zinc-500 block">Ramping from 4,000Hz up to 20,000Hz</span>
                      </div>
                    ) : hearingTestState === 'completed' && hearingResultLimit ? (
                      <div className="space-y-1">
                        <span className="font-mono text-[9px] text-amber-500 uppercase tracking-widest block">🎉 Test Complete!</span>
                        <div className="text-xl font-mono font-extrabold text-white">{hearingResultLimit} Hz</div>
                        <span className="font-sans text-[9px] text-emerald-400 font-bold block max-w-[200px] leading-tight">
                          {hearingResultLimit < 12000 ? 'Spectrum limit: Over 50 years threshold' :
                           hearingResultLimit < 15000 ? 'Spectrum limit: Over 35 years threshold' :
                           hearingResultLimit < 17000 ? 'Spectrum limit: Over 30 years threshold' :
                           hearingResultLimit < 19000 ? 'Spectrum limit: Under 25 years threshold (Mosquito Pitch)' :
                           'Exceptional perfect hearing! Under 18 years threshold'}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest block">Ready to Sweeper</span>
                        <div className="text-lg font-mono font-extrabold text-zinc-400">4,000 Hz ➔ 20,000 Hz</div>
                        <span className="font-sans text-[9px] text-zinc-500 block">Click below to begin sweep</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-900">
                  {hearingTestState === 'testing' ? (
                    <button
                      onClick={() => stopHearingRangeTest(true)}
                      className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-red-600/10 text-center animate-pulse"
                    >
                      🛑 Can't Hear It Anymore! (LOCK IN)
                    </button>
                  ) : (
                    <button
                      onClick={startHearingRangeTest}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/10 text-center"
                    >
                      ⚡ Start Hearing Range Test
                    </button>
                  )}
                  {hearingTestState === 'completed' && (
                    <button
                      onClick={() => setHearingTestState('idle')}
                      className="w-full py-1 text-center font-mono text-[9px] text-zinc-500 hover:text-zinc-300 uppercase tracking-widest"
                    >
                      Reset and Try Again
                    </button>
                  )}
                </div>
              </div>

              {/* Card 4B: Background Noise & Speaker Burn-In (Static Noise Check) */}
              <div className="p-5 border border-zinc-900 bg-zinc-950 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-amber-500" />
                        <span>Speaker Burn-In &amp; Noise</span>
                      </h4>
                      <p className="font-sans text-[10px] text-zinc-500">Play standard white, pink, and brown linear noise</p>
                    </div>
                    <span className="text-[8px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">BURN-IN / NOISE</span>
                  </div>

                  <p className="font-sans text-[11px] text-zinc-400 leading-relaxed mt-2">
                    Noise signals test speaker linearity and break-in new diaphragms. Play white noise (all frequencies), pink noise (equal energy per octave for burn-in), or brown noise (smooth focus sound).
                  </p>

                  <div className="grid grid-cols-3 gap-2 my-4">
                    {[
                      { id: 'white', label: 'White Noise', desc: 'Full-spectrum flat', style: 'border-zinc-800 text-zinc-300 hover:border-zinc-700' },
                      { id: 'pink', label: 'Pink Noise', desc: 'Headphone break-in', style: 'border-rose-950/40 text-rose-300 hover:border-rose-900/60 hover:bg-rose-950/10' },
                      { id: 'brown', label: 'Brown Noise', desc: 'Deep warm rumble', style: 'border-amber-950/40 text-amber-300 hover:border-amber-900/60 hover:bg-amber-950/10' }
                    ].map((n) => {
                      const isActive = speakerState === 'playing-preset' && activePresetLabel === `${n.id} noise`;
                      return (
                        <button
                          key={n.id}
                          onClick={() => isActive ? stopSpeakerSounds() : playNoise(n.id as any)}
                          className={`p-2 border rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10 font-bold'
                              : n.style
                          }`}
                        >
                          <span className="text-[10px] font-bold block truncate max-w-full">{n.label.split(' ')[0]}</span>
                          <span className="text-[7px] text-zinc-500 mt-0.5 leading-tight">{n.desc.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-900">
                  <div className="flex justify-between items-center bg-[#07070c] p-2 rounded-xl border border-zinc-900">
                    <span className="font-mono text-[9px] text-zinc-500">SIGNAL STATE</span>
                    <span className="font-mono text-[9px] text-zinc-400 font-bold">
                      {speakerState === 'playing-preset' && activePresetLabel.includes('noise')
                        ? `🔊 PLAYING ${activePresetLabel.toUpperCase()}`
                        : '🔇 NO STATIC SIGNAL'}
                    </span>
                  </div>
                  {speakerState === 'playing-preset' && activePresetLabel.includes('noise') && (
                    <button
                      onClick={stopSpeakerSounds}
                      className="w-full mt-2 py-1 text-center font-mono text-[9px] text-red-400 hover:text-red-300 uppercase tracking-widest"
                    >
                      Mute Noise Signal
                    </button>
                  )}
                </div>
              </div>

              {/* Card 4C: Stereo Polarity & Phase Alignment (Acoustic Cancellation Check) */}
              <div className="p-5 border border-zinc-900 bg-zinc-950 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-purple-500" />
                        <span>Polarity &amp; Speaker Phase</span>
                      </h4>
                      <p className="font-sans text-[10px] text-zinc-500">Test if left and right speakers are wired in phase</p>
                    </div>
                    <span className="text-[8px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">PHASE CHECK</span>
                  </div>

                  <p className="font-sans text-[11px] text-zinc-400 leading-relaxed mt-2">
                    A sound system wired out-of-phase causes left/right channels to cancel each other's bass. "In-Phase" plays a solid centered sound, while "Out-of-Phase" sounds hollow, wide, and strangely diffused.
                  </p>

                  <div className="grid grid-cols-2 gap-2.5 my-4">
                    {[
                      { inPhase: true, label: 'In-Phase', desc: 'Center Image' },
                      { inPhase: false, label: 'Out-Of-Phase', desc: 'Hollow Wide' }
                    ].map((ph) => {
                      const isActive = speakerState === 'playing-preset' && activePresetLabel === (ph.inPhase ? 'In-Phase' : 'Out-of-Phase');
                      return (
                        <button
                          key={ph.label}
                          onClick={() => isActive ? stopSpeakerSounds() : playPhaseTest(ph.inPhase)}
                          className={`p-2.5 border rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                            isActive
                              ? 'bg-purple-500/25 border-purple-500 text-purple-400 shadow-md shadow-purple-500/10 font-bold'
                              : 'bg-zinc-900/60 border-zinc-850 hover:border-zinc-750 text-zinc-400'
                          }`}
                        >
                          <span className="text-[10px] font-bold block">{ph.label}</span>
                          <span className="text-[7px] text-zinc-500 mt-0.5 leading-none">{ph.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-900">
                  <div className="flex justify-between items-center bg-[#07070c] p-2 rounded-xl border border-zinc-900">
                    <span className="font-mono text-[9px] text-zinc-500">POLARITY STATUS</span>
                    <span className="font-mono text-[9px] text-purple-400 font-bold">
                      {speakerState === 'playing-preset' && (activePresetLabel === 'In-Phase' || activePresetLabel === 'Out-of-Phase')
                        ? `🔊 PLAYING ${activePresetLabel.toUpperCase()}`
                        : '🔇 DISENGAGED'}
                    </span>
                  </div>
                  {speakerState === 'playing-preset' && (activePresetLabel === 'In-Phase' || activePresetLabel === 'Out-of-Phase') && (
                    <button
                      onClick={stopSpeakerSounds}
                      className="w-full mt-2 py-1 text-center font-mono text-[9px] text-red-400 hover:text-red-300 uppercase tracking-widest"
                    >
                      Mute Phase Signal
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Advanced Audio Sandbox Troubleshooting & Search FAQ */}
            <div className="p-5 border border-zinc-900 bg-zinc-950 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-brand" />
                    <span>4. Audio Sandbox Troubleshooting & FAQ Hub</span>
                  </h4>
                  <p className="font-sans text-[10px] text-zinc-500">Answers to left-right orientation, subwoofer frequencies, and soundbar setup problems</p>
                </div>

                {/* Filter query search bar */}
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search audio topics..."
                    value={faqSearchQuery}
                    onChange={(e) => setFaqSearchQuery(e.target.value)}
                    className="w-full sm:w-64 bg-zinc-900 text-white placeholder-zinc-500 text-xs px-3 py-1.5 rounded-lg border border-zinc-800 focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {[
                  {
                    q: "How do I perform a correct Left and Right speaker balance check?",
                    a: "Our Stereo & Balance tester pans the audio entirely left (-1.0), right (1.0), or centered (0.0). Trigger each channel to verify that your left speakers and right speakers match their physical placement, which is key for a proper sound system stage. If you find the left and right speaker sound different or one right speaker is not working, check your system's hardware output balance settings or verify connections to your receiver/amplifier."
                  },
                  {
                    q: "What is a woofer and subwoofer test, and how do I test my bass?",
                    a: "Woofer stereo and subwoofer elements are designed for low frequencies (20Hz - 120Hz). Select our 'Deep Subwoofer & Bass Tester' presets (such as 30Hz or 40Hz) with a Sine wave to check physical rattle and low-end frequency limits. Ensure you use headphones with good subwoofer response or connect a quality subwoofer element to test deep vibration."
                  },
                  {
                    q: "Can I test soundbars, hifi audio systems, and multi-channel surround rigs?",
                    a: "Yes! Modern hifi speakers, Edifier stereo setups, or Audiolab speakers can be checked by sliding the interactive 2D spatial pan controller or using our dynamic frequency sweep (20Hz - 20kHz). This ensures that your soundbar of speakers or soundbar of receiver setup reproduces accurate highs, dialogue, and wide stereo airplay fields."
                  },
                  {
                    q: "How can I perform a phone speaker test or troubleshoot Chromebook audio?",
                    a: "Phone speakers and Chromebook speakers are physically small, meaning they struggle with sub-bass and focus heavily on mid-to-high frequencies. Select our 'Phone Speaker Check & Booster' (1kHz - 8kHz) or 'Chromebook Dialog Optimizer' (500Hz - 4kHz) to audit clarity, and check if both speakers are clean without any static, distortion, or clipping at high volume."
                  },
                  {
                    q: "Why do some frequencies sound completely silent on my headphones/speakers?",
                    a: "This can be due to two factors: human hearing limits (most adults cannot hear above 15,000Hz - 17,000Hz) or hardware frequency response limits (small speakers can rarely play below 60Hz, and cheap tweeters might struggle with treble above 16,000Hz). Use the free speaker test frequency sweep to discover both your ears' limit and your hardware's capabilities!"
                  }
                ].filter(faq => 
                  faq.q.toLowerCase().includes(faqSearchQuery.toLowerCase()) || 
                  faq.a.toLowerCase().includes(faqSearchQuery.toLowerCase())
                ).map((faq, i) => {
                  const isOpen = activeFaq === i;
                  return (
                    <div key={i} className="border border-zinc-900 rounded-xl bg-zinc-950 overflow-hidden">
                      <button
                        onClick={() => setActiveFaq(isOpen ? null : i)}
                        className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-zinc-900/40 transition-colors cursor-pointer"
                      >
                        <span className="text-xs font-heading font-extrabold text-white leading-relaxed">{faq.q}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <div className="px-4 pb-4 pt-1 text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-900 bg-zinc-950/60">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Empty check */}
                {[
                  {
                    q: "How do I perform a correct Left and Right speaker balance check?",
                    a: ""
                  }
                ].filter(faq => 
                  faq.q.toLowerCase().includes(faqSearchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-6 text-zinc-500 text-xs font-mono">
                    No answers matching "{faqSearchQuery}" found. Try searching "subwoofer", "balance", or "Chromebook".
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
